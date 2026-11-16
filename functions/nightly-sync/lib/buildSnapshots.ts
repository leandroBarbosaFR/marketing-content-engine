import type {CampaignSubject, ContentPieceSubject, FourTags, SourceRows, SyncSubjects, TopicSubject} from './sourceRows'

// Turns source rows into monthly snapshot documents for gtm-brain (brief §6): one per content
// piece, topic, campaign and ICP per month, plus one site total ("all"). Each copies the four tags
// of its subject, so results roll up by ICP, solution, market and topic. The _id is derived from
// month and subject, the same pattern the seed uses, so a re-run replaces instead of duplicating.

export type SnapshotSubjectType = 'contentPiece' | 'topic' | 'campaign' | 'icp' | 'all'

interface Metrics {
  sessions: number
  conversions: number
  impressions: number
  clicks: number
  aiCitations: number
  leads: number
  mqls: number
  aiAssistantMqls: number
  opportunities: number
  pipeline: number
  spend: number
}

interface CrossDatasetRef {
  _type: 'crossDatasetReference'
  _ref: string
  _dataset: string
  _projectId: string
  _weak: true
}

export interface SnapshotDocument extends Partial<Metrics> {
  _id: string
  _type: 'snapshot'
  month: string
  subjectType: SnapshotSubjectType
  subject?: CrossDatasetRef
  campaign?: {_type: 'reference'; _ref: string; _weak: true}
  icp?: CrossDatasetRef
  solution?: CrossDatasetRef
  market?: CrossDatasetRef
  topic?: CrossDatasetRef
  position?: number
  mqlsBySource?: {_key: string; source: string; mqls: number}[]
  syncedAt: string
}

export interface ReconciliationLine {
  source: keyof SourceRows
  measure: string
  sourceTotal: number
  matchedTotal: number
  /** Share of the source total that landed on a subject, 0–1. */
  matchedShare: number
}

export interface BuildResult {
  snapshots: SnapshotDocument[]
  reconciliation: ReconciliationLine[]
}

// AI assistants are their own source in the brief ("AI assistant MQLs").
const AI_ASSISTANT_SOURCES = ['chatgpt', 'openai', 'claude', 'anthropic', 'perplexity', 'copilot', 'gemini']
export const AI_ASSISTANTS_LABEL = 'AI assistants'

export function isAiAssistantSource(source: string | undefined): boolean {
  const normalized = (source ?? '').toLowerCase()
  return AI_ASSISTANT_SOURCES.some((assistant) => normalized.includes(assistant))
}

// Same page however the source wrote the URL: no protocol, no www, host lowercased, no trailing
// slash, no query string or fragment.
export function normalizeUrl(url: string | undefined): string {
  if (!url) return ''
  const withoutFragment = url.trim().split('#')[0].split('?')[0]
  const withoutProtocol = withoutFragment.replace(/^https?:\/\//i, '')
  const slashIndex = withoutProtocol.indexOf('/')
  const host = (slashIndex === -1 ? withoutProtocol : withoutProtocol.slice(0, slashIndex)).toLowerCase().replace(/^www\./, '')
  const path = slashIndex === -1 ? '' : withoutProtocol.slice(slashIndex)
  return `${host}${path}`.replace(/\/+$/, '')
}

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ')
}

// A search query belongs to the topic whose longest target phrase it contains, so "bvi company
// formation" goes to a formation cluster rather than a broader "bvi company" one.
export function topicForQuery(query: string, topics: TopicSubject[]): string | undefined {
  const normalized = normalizeQuery(query)
  let best: {topicId: string; length: number} | undefined
  for (const topic of topics) {
    for (const target of topic.targetQueries ?? []) {
      const phrase = normalizeQuery(target)
      if (phrase && normalized.includes(phrase) && (!best || phrase.length > best.length)) best = {topicId: topic._id, length: phrase.length}
    }
  }
  return best?.topicId
}

// Money is stored in GBP, as in the brief. gbpRates gives GBP per unit, e.g. {USD: 0.79}.
export function convertToGbp(amount: number, currency: string | undefined, gbpRates: Record<string, number>): number {
  const code = (currency ?? 'GBP').toUpperCase()
  if (code === 'GBP') return amount
  const rate = gbpRates[code]
  if (!rate) throw new Error(`No GBP rate for ${code}. Add it to SYNC_GBP_RATES.`)
  return amount * rate
}

interface Accumulator extends Metrics {
  positionWeight: number
  positionSum: number
  bySource: Map<string, number>
}

const emptyAccumulator = (): Accumulator => ({
  sessions: 0,
  conversions: 0,
  impressions: 0,
  clicks: 0,
  aiCitations: 0,
  leads: 0,
  mqls: 0,
  aiAssistantMqls: 0,
  opportunities: 0,
  pipeline: 0,
  spend: 0,
  positionWeight: 0,
  positionSum: 0,
  bySource: new Map(),
})

const MONTH_PATTERN = /^\d{4}-\d{2}-01$/
// Leads and pipeline reach ICPs straight from the HubSpot rows (below), so a lead on a tagged page
// reached through a tagged campaign counts once; the rest rolls up from the subjects.
const ROLL_UP_FIELDS = ['sessions', 'spend', 'aiCitations'] as const

export function snapshotId(month: string, subjectType: SnapshotSubjectType, subjectId: string): string {
  return `snapshot-${month.slice(0, 7)}-${subjectType}-${subjectId}`
}

export function buildSnapshots({
  subjects,
  rows,
  gbpRates,
  projectId,
  websiteDataset,
  syncedAt,
}: {
  subjects: SyncSubjects
  rows: SourceRows
  gbpRates: Record<string, number>
  projectId: string
  websiteDataset: string
  syncedAt: string
}): BuildResult {
  const accumulators = new Map<string, Accumulator>()
  const accumulatorFor = (month: string, subjectType: SnapshotSubjectType, subjectId: string) => {
    if (!MONTH_PATTERN.test(month)) throw new Error(`Month must be the first day of a month, got "${month}".`)
    const key = `${month}|${subjectType}|${subjectId}`
    let accumulator = accumulators.get(key)
    if (!accumulator) {
      accumulator = emptyAccumulator()
      accumulators.set(key, accumulator)
    }
    return accumulator
  }

  const piecesByUrl = new Map<string, ContentPieceSubject>()
  const piecesByFormId = new Map<string, ContentPieceSubject>()
  for (const piece of subjects.contentPieces) {
    if (piece.url) piecesByUrl.set(normalizeUrl(piece.url), piece)
    if (piece.hubspotFormId) piecesByFormId.set(piece.hubspotFormId.toLowerCase(), piece)
  }
  const campaignsByPlatformKey = new Map<string, CampaignSubject>()
  const campaignsByUtm = new Map<string, CampaignSubject>()
  for (const campaign of subjects.campaigns) {
    // The campaign name in the ad platform is the campaign's title (the brief's register).
    if (campaign.title) campaignsByPlatformKey.set(campaign.title.toLowerCase(), campaign)
    if (campaign.platformCampaignId) campaignsByPlatformKey.set(campaign.platformCampaignId.toLowerCase(), campaign)
    if (campaign.utm) campaignsByUtm.set(campaign.utm.toLowerCase(), campaign)
  }

  const reconciliation: ReconciliationLine[] = []
  const reconcile = (source: ReconciliationLine['source'], measure: string, sourceTotal: number, matchedTotal: number) =>
    reconciliation.push({source, measure, sourceTotal, matchedTotal, matchedShare: sourceTotal ? matchedTotal / sourceTotal : 1})

  // Search Console: clicks, impressions and position per page, and per topic through its queries.
  let clicksToPages = 0
  let clicksToTopics = 0
  for (const row of rows.searchConsole) {
    const piece = piecesByUrl.get(normalizeUrl(row.pageUrl))
    const topicId = topicForQuery(row.query, subjects.topics)
    const targets: [SnapshotSubjectType, string][] = []
    if (piece) {
      targets.push(['contentPiece', piece._id])
      clicksToPages += row.clicks
    }
    if (topicId) {
      targets.push(['topic', topicId])
      clicksToTopics += row.clicks
    }
    for (const [subjectType, subjectId] of targets) {
      const accumulator = accumulatorFor(row.month, subjectType, subjectId)
      accumulator.clicks += row.clicks
      accumulator.impressions += row.impressions
      accumulator.positionSum += row.position * row.impressions
      accumulator.positionWeight += row.impressions
    }
  }
  const searchClicks = rows.searchConsole.reduce((total, row) => total + row.clicks, 0)
  reconcile('searchConsole', 'clicks on content pages', searchClicks, clicksToPages)
  reconcile('searchConsole', 'clicks on topic queries', searchClicks, clicksToTopics)

  // GA4: sessions per page.
  let matchedSessions = 0
  for (const row of rows.analytics) {
    const piece = piecesByUrl.get(normalizeUrl(row.pageUrl))
    if (!piece) continue
    accumulatorFor(row.month, 'contentPiece', piece._id).sessions += row.sessions
    matchedSessions += row.sessions
  }
  reconcile('analytics', 'sessions', rows.analytics.reduce((total, row) => total + row.sessions, 0), matchedSessions)

  // Peec AI: answers citing each page.
  let matchedCitations = 0
  for (const row of rows.peec) {
    const piece = piecesByUrl.get(normalizeUrl(row.pageUrl))
    if (!piece) continue
    accumulatorFor(row.month, 'contentPiece', piece._id).aiCitations += row.citations
    matchedCitations += row.citations
  }
  reconcile('peec', 'citations', rows.peec.reduce((total, row) => total + row.citations, 0), matchedCitations)

  // HubSpot: every row counts in the site total by source; rows also land on a content piece
  // (form ID first, then page URL) and on a campaign (UTM).
  let matchedMqls = 0
  for (const row of rows.hubspot) {
    const isAiAssistant = isAiAssistantSource(row.source)
    const pipeline = convertToGbp(row.pipeline ?? 0, row.currency, gbpRates)
    const site = accumulatorFor(row.month, 'all', 'all-sources')
    site.leads += row.leads
    site.mqls += row.mqls
    if (isAiAssistant) site.aiAssistantMqls += row.mqls
    const sourceLabel = isAiAssistant ? AI_ASSISTANTS_LABEL : row.source?.trim() || 'Unattributed'
    site.bySource.set(sourceLabel, (site.bySource.get(sourceLabel) ?? 0) + row.mqls)

    const piece = (row.formId && piecesByFormId.get(row.formId.toLowerCase())) || piecesByUrl.get(normalizeUrl(row.pageUrl))
    const campaign = row.utmCampaign ? campaignsByUtm.get(row.utmCampaign.toLowerCase()) : undefined
    const targets: [SnapshotSubjectType, string][] = []
    if (piece) targets.push(['contentPiece', piece._id])
    if (campaign) targets.push(['campaign', campaign._id])
    if (targets.length) matchedMqls += row.mqls
    // The campaign's ICP wins over the page's: the campaign is what the money was spent on.
    const icpId = campaign?.icp ?? piece?.icp
    if (icpId && subjects.icpIds.includes(icpId)) targets.push(['icp', icpId])
    for (const [subjectType, subjectId] of targets) {
      const accumulator = accumulatorFor(row.month, subjectType, subjectId)
      accumulator.leads += row.leads
      accumulator.mqls += row.mqls
      if (subjectType === 'contentPiece') accumulator.conversions += row.leads
      if (isAiAssistant) accumulator.aiAssistantMqls += row.mqls
      accumulator.opportunities += row.opportunities ?? 0
      accumulator.pipeline += pipeline
    }
  }
  reconcile('hubspot', 'MQLs on a content piece or campaign', rows.hubspot.reduce((total, row) => total + row.mqls, 0), matchedMqls)

  // Funnel.io: paid spend, clicks and impressions per campaign, in GBP.
  let matchedSpend = 0
  let totalSpend = 0
  for (const row of rows.funnel) {
    const spend = convertToGbp(row.spend, row.currency, gbpRates)
    totalSpend += spend
    const campaign =
      (row.campaignId && campaignsByPlatformKey.get(row.campaignId.toLowerCase())) ||
      (row.campaignName && campaignsByPlatformKey.get(row.campaignName.toLowerCase()))
    if (!campaign) continue
    const accumulator = accumulatorFor(row.month, 'campaign', campaign._id)
    accumulator.spend += spend
    accumulator.clicks += row.clicks
    accumulator.impressions += row.impressions
    matchedSpend += spend
  }
  reconcile('funnel', 'spend (GBP)', totalSpend, matchedSpend)

  const tagsBySubject = new Map<string, FourTags>()
  for (const piece of subjects.contentPieces) tagsBySubject.set(piece._id, piece)
  for (const campaign of subjects.campaigns) tagsBySubject.set(campaign._id, campaign)
  for (const topic of subjects.topics) tagsBySubject.set(topic._id, {icp: topic.icp, solution: topic.solution, topic: topic._id})

  // Topics also collect the leads, MQLs and citations of the pieces tagged to them.
  for (const [key, accumulator] of [...accumulators]) {
    const [month, subjectType, subjectId] = key.split('|') as [string, SnapshotSubjectType, string]
    const topicId = subjectType === 'contentPiece' ? tagsBySubject.get(subjectId)?.topic : undefined
    if (!topicId) continue
    const topic = accumulatorFor(month, 'topic', topicId)
    for (const field of ['leads', 'mqls', 'aiAssistantMqls', 'aiCitations'] as const) topic[field] += accumulator[field]
  }

  // ICPs add up the sessions, spend and citations of their campaigns and content pieces.
  const icpIds = new Set(subjects.icpIds)
  for (const [key, accumulator] of [...accumulators]) {
    const [month, subjectType, subjectId] = key.split('|') as [string, SnapshotSubjectType, string]
    if (subjectType !== 'contentPiece' && subjectType !== 'campaign') continue
    const icpId = tagsBySubject.get(subjectId)?.icp
    if (!icpId || !icpIds.has(icpId)) continue
    const icp = accumulatorFor(month, 'icp', icpId)
    for (const field of ROLL_UP_FIELDS) icp[field] += accumulator[field]
  }

  const crossDatasetRef = (id: string): CrossDatasetRef => ({
    _type: 'crossDatasetReference',
    _ref: id,
    _dataset: websiteDataset,
    _projectId: projectId,
    _weak: true,
  })
  const snapshots = [...accumulators].map(([key, accumulator]): SnapshotDocument => {
    const [month, subjectType, subjectId] = key.split('|') as [string, SnapshotSubjectType, string]
    const tags: FourTags = subjectType === 'icp' ? {icp: subjectId} : subjectType === 'all' ? {} : (tagsBySubject.get(subjectId) ?? {})
    const {positionSum, positionWeight, bySource, ...metrics} = accumulator
    return {
      _id: snapshotId(month, subjectType, subjectId),
      _type: 'snapshot',
      month,
      subjectType,
      ...(subjectType === 'campaign' ? {campaign: {_type: 'reference' as const, _ref: subjectId, _weak: true as const}} : {}),
      ...(['contentPiece', 'topic', 'icp'].includes(subjectType) ? {subject: crossDatasetRef(subjectId)} : {}),
      ...(tags.icp ? {icp: crossDatasetRef(tags.icp)} : {}),
      ...(tags.solution ? {solution: crossDatasetRef(tags.solution)} : {}),
      ...(tags.market ? {market: crossDatasetRef(tags.market)} : {}),
      ...(tags.topic ? {topic: crossDatasetRef(tags.topic)} : {}),
      ...metrics,
      pipeline: Math.round(metrics.pipeline),
      spend: Math.round(metrics.spend * 100) / 100,
      ...(positionWeight ? {position: Math.round((10 * positionSum) / positionWeight) / 10} : {}),
      ...(subjectType === 'all'
        ? {
            mqlsBySource: [...bySource]
              .sort((first, second) => second[1] - first[1])
              .map(([source, mqls], index) => ({_key: `s${index}`, source, mqls})),
          }
        : {}),
      syncedAt,
    }
  })
  snapshots.sort((first, second) => first._id.localeCompare(second._id))
  return {snapshots, reconciliation}
}
