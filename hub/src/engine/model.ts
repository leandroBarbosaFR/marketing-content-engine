import {
  archetypeLabels,
  channelLabels,
  IN_PROGRESS_STATUSES,
  LIVE_STATUSES,
  PAID_CHANNELS,
  STAGES,
  TACTIC_KINDS,
} from './labels'
import {formatShare, joinNames, monthShort} from './format'
import {proposeTags, type TagProposal} from './tagging'
import type {
  AccountDocument,
  BriefDocument,
  CampaignDocument,
  CompetitorDocument,
  ContentPieceDocument,
  GtmDocument,
  IcpDocument,
  MarketDocument,
  MessagingPillarDocument,
  PlanDocument,
  ProgrammeDocument,
  ProofPointDocument,
  Ref,
  SnapshotDocument,
  SnapshotMetrics,
  SolutionDocument,
  TopicDocument,
  WebsiteDocument,
} from './types'

// Everything the hub shows is computed here from the two datasets, so every screen can be tested
// against the seed without a browser. Cross-dataset references are joined by _ref.

export interface EngineModel {
  icps: IcpDocument[]
  solutions: SolutionDocument[]
  markets: MarketDocument[]
  topics: TopicDocument[]
  proofPoints: ProofPointDocument[]
  pieces: ContentPieceDocument[]
  plans: PlanDocument[]
  programmes: ProgrammeDocument[]
  pillars: MessagingPillarDocument[]
  competitors: CompetitorDocument[]
  briefs: BriefDocument[]
  campaigns: CampaignDocument[]
  snapshots: SnapshotDocument[]
  accounts: AccountDocument[]
  months: string[]
  latestMonth?: string
  title: (ref: Ref | undefined) => string | undefined
  byId: Map<string, WebsiteDocument | GtmDocument>
}

const publishedId = (id: string) => id.replace(/^drafts\./, '')

// With the drafts perspective a document can appear twice (draft and published); keep the draft.
function dedupe<T extends {_id: string}>(documents: T[]): T[] {
  const kept = new Map<string, T>()
  for (const document of documents) {
    const id = publishedId(document._id)
    if (!kept.has(id) || document._id.startsWith('drafts.')) kept.set(id, {...document, _id: id})
  }
  return [...kept.values()]
}

function ofType<T extends {_type: string}>(documents: {_type: string}[], type: T['_type']): T[] {
  return documents.filter((document) => document._type === type) as T[]
}

export function buildModel(websiteDocuments: WebsiteDocument[], gtmDocuments: GtmDocument[]): EngineModel {
  const website = dedupe(websiteDocuments)
  const gtm = dedupe(gtmDocuments)
  const byId = new Map<string, WebsiteDocument | GtmDocument>()
  for (const document of [...website, ...gtm]) byId.set(document._id, document)
  const snapshots = ofType<SnapshotDocument>(gtm, 'snapshot').filter((snapshot) => snapshot.month)
  const months = [...new Set(snapshots.map((snapshot) => snapshot.month!))].sort()
  const icps = ofType<IcpDocument>(website, 'icp').sort(
    (first, second) => (first.order ?? 99) - (second.order ?? 99) || (first.title ?? '').localeCompare(second.title ?? ''),
  )
  return {
    icps,
    solutions: ofType<SolutionDocument>(website, 'solution'),
    markets: ofType<MarketDocument>(website, 'market'),
    topics: ofType<TopicDocument>(website, 'topic'),
    proofPoints: ofType<ProofPointDocument>(website, 'proofPoint'),
    pieces: ofType<ContentPieceDocument>(website, 'contentPiece'),
    plans: ofType<PlanDocument>(gtm, 'plan'),
    programmes: ofType<ProgrammeDocument>(gtm, 'programme'),
    pillars: ofType<MessagingPillarDocument>(gtm, 'messagingPillar'),
    competitors: ofType<CompetitorDocument>(gtm, 'competitor'),
    briefs: ofType<BriefDocument>(gtm, 'brief'),
    campaigns: ofType<CampaignDocument>(gtm, 'campaign'),
    snapshots,
    accounts: ofType<AccountDocument>(gtm, 'account'),
    months,
    latestMonth: months.at(-1),
    byId,
    title: (ref) => {
      if (!ref?._ref) return undefined
      return (byId.get(ref._ref) as {title?: string} | undefined)?.title
    },
  }
}

export function sum<Row>(rows: Row[], read: (row: Row) => number | undefined | null): number {
  return rows.reduce((total, row) => total + (read(row) ?? 0), 0)
}

const sameRef = (ref: Ref | undefined, id: string | undefined) => Boolean(ref?._ref && id && ref._ref === id)

export function icpName(icp: IcpDocument | undefined): string {
  if (!icp) return 'No ICP'
  return archetypeLabels[icp.archetype ?? ''] ?? icp.title ?? 'Untitled ICP'
}

function snapshotsFor(model: EngineModel, subjectType: SnapshotDocument['subjectType']) {
  return model.snapshots.filter((snapshot) => snapshot.subjectType === subjectType)
}

function campaignSnapshots(model: EngineModel, campaignId: string) {
  return snapshotsFor(model, 'campaign').filter((snapshot) => sameRef(snapshot.campaign, campaignId))
}

// ---------------------------------------------------------------- Overview (prototype tab 1)

export interface SpendByIcpRow {
  key: string
  label: string
  icpId?: string
  spend: number
  share: number
  clicks: number
  campaignCount: number
  isBrand: boolean
}

export interface OverviewView {
  headline: string
  summary: string
  paidSpend: number
  spendByChannel: {channel: string; label: string; spend: number}[]
  campaignCount: number
  spendingInLatestMonth: number
  latestMonth?: string
  leads: number
  mqls: number
  aiAssistantMqls: number
  spendByIcp: SpendByIcpRow[]
  icpShareOfSpend: number
  unfundedIcps: {icp: IcpDocument; spend: number; pausedCampaigns: number}[]
  coverageGap?: string
  nextStep?: string
}

// "Effectively unfunded": an ICP below this share of paid spend (the brief: two ICPs had under
// £500 of £110k between them).
export const UNFUNDED_SHARE = 0.02

export function overviewView(model: EngineModel): OverviewView {
  const campaignRows = snapshotsFor(model, 'campaign')
  const paidSpend = sum(campaignRows, (row) => row.spend)
  const campaignById = new Map(model.campaigns.map((campaign) => [campaign._id, campaign]))
  const channelOf = (row: SnapshotDocument) =>
    campaignById.get(row.campaign?._ref ?? '')?.channels?.find((channel) => PAID_CHANNELS.includes(channel))

  const spendByChannel = PAID_CHANNELS.map((channel) => ({
    channel,
    label: channelLabels[channel],
    spend: sum(campaignRows.filter((row) => channelOf(row) === channel), (row) => row.spend),
  })).filter((entry) => entry.spend > 0)

  const spendingInLatestMonth = new Set(
    campaignRows.filter((row) => row.month === model.latestMonth && (row.spend ?? 0) > 0).map((row) => row.campaign?._ref),
  ).size

  const icpRows: SpendByIcpRow[] = model.icps.map((icp) => {
    const campaigns = model.campaigns.filter((campaign) => !campaign.brand && sameRef(campaign.icp, icp._id))
    const ids = new Set(campaigns.map((campaign) => campaign._id))
    const rows = campaignRows.filter((row) => ids.has(row.campaign?._ref ?? ''))
    const spend = sum(rows, (row) => row.spend)
    return {
      key: icp._id,
      label: icpName(icp),
      icpId: icp._id,
      spend,
      share: paidSpend ? spend / paidSpend : 0,
      clicks: sum(rows, (row) => row.clicks),
      campaignCount: campaigns.length,
      isBrand: false,
    }
  })
  const brandIds = new Set(model.campaigns.filter((campaign) => campaign.brand).map((campaign) => campaign._id))
  const brandRows = campaignRows.filter((row) => brandIds.has(row.campaign?._ref ?? ''))
  const brandSpend = sum(brandRows, (row) => row.spend)
  const untaggedIds = new Set(
    model.campaigns.filter((campaign) => !campaign.brand && !campaign.icp?._ref).map((campaign) => campaign._id),
  )
  const untaggedRows = campaignRows.filter((row) => untaggedIds.has(row.campaign?._ref ?? ''))
  const untaggedSpend = sum(untaggedRows, (row) => row.spend)
  const spendByIcp = [
    ...icpRows,
    {
      key: 'brand',
      label: 'Brand (all ICPs)',
      spend: brandSpend,
      share: paidSpend ? brandSpend / paidSpend : 0,
      clicks: sum(brandRows, (row) => row.clicks),
      campaignCount: brandIds.size,
      isBrand: true,
    },
    ...(untaggedSpend > 0
      ? [
          {
            key: 'untagged',
            label: 'Not tagged yet',
            spend: untaggedSpend,
            share: untaggedSpend / paidSpend,
            clicks: sum(untaggedRows, (row) => row.clicks),
            campaignCount: untaggedIds.size,
            isBrand: false,
          },
        ]
      : []),
  ]
  const icpSpend = sum(icpRows, (row) => row.spend)

  const allRows = snapshotsFor(model, 'all')
  const leads = sum(allRows, (row) => row.leads)
  const mqls = sum(allRows, (row) => row.mqls)

  const unfundedIcps = icpRows
    .filter((row) => row.share < UNFUNDED_SHARE)
    .map((row) => {
      const icp = model.icps.find((candidate) => candidate._id === row.icpId)!
      const pausedCampaigns = model.campaigns.filter(
        (campaign) => sameRef(campaign.icp, icp._id) && campaign.stage === 'paused',
      ).length
      return {icp, spend: row.spend, pausedCampaigns}
    })
  const zeroIcps = icpRows.filter((row) => row.spend === 0)
  const top = [...icpRows].sort((first, second) => second.spend - first.spend)[0]

  const headline = !paidSpend
    ? 'No paid spend recorded yet'
    : `${formatShare(top?.spend ?? 0, paidSpend, 0)} of paid spend backs one ICP${
        zeroIcps.length
          ? `, and ${joinNames(zeroIcps.map((row) => row.label))} ${zeroIcps.length === 1 ? 'gets' : 'get'} none`
          : ''
      }`
  const campaignsWithSpend = new Set(campaignRows.filter((row) => (row.spend ?? 0) > 0).map((row) => row.campaign?._ref)).size
  const summary = `${campaignsWithSpend} paid campaigns spent £${Math.round(paidSpend).toLocaleString('en-GB')} in the period. ${formatShare(
    icpSpend,
    paidSpend,
    0,
  )} is tied to a priority ICP; ${formatShare(brandSpend, paidSpend, 0)} is brand search. HubSpot recorded ${leads.toLocaleString(
    'en-GB',
  )} new leads and ${mqls.toLocaleString('en-GB')} MQLs.`

  let coverageGap: string | undefined
  let nextStep: string | undefined
  if (unfundedIcps.length) {
    const names = joinNames(unfundedIcps.map((entry) => icpName(entry.icp)))
    const combined = sum(unfundedIcps, (entry) => entry.spend)
    const paused = unfundedIcps.filter((entry) => entry.pausedCampaigns > 0)
    const triggerless = unfundedIcps.filter((entry) => !model.campaigns.some((campaign) => sameRef(campaign.icp, entry.icp._id)))
    coverageGap = `${names} ${unfundedIcps.length === 1 ? 'has' : 'have'} £${Math.round(combined).toLocaleString('en-GB')} of paid spend between ${
      unfundedIcps.length === 1 ? 'it' : 'them'
    }: ${unfundedIcps.length} of the ${model.icps.length} priority ICPs ${unfundedIcps.length === 1 ? 'is' : 'are'} effectively unfunded.${
      paused.length ? ` ${joinNames(paused.map((entry) => `${icpName(entry.icp)} has ${entry.pausedCampaigns} paused campaign(s)`))}.` : ''
    }${triggerless.length ? ` ${joinNames(triggerless.map((entry) => icpName(entry.icp)))} triggers have no campaign at all.` : ''}`
    const first = unfundedIcps[0]
    const firstTrigger = first.icp.triggers?.[0]
    nextStep = `Brief one always-on campaign per uncovered ICP using its trigger list${
      firstTrigger ? `, starting with ${icpName(first.icp)}: "${firstTrigger}"` : ''
    }.${brandSpend > 0 ? ` Retag brand search by landing page so its ${formatShare(brandSpend, paidSpend, 0)} share can be read by ICP.` : ''}`
  }

  return {
    headline,
    summary,
    paidSpend,
    spendByChannel,
    campaignCount: model.campaigns.length,
    spendingInLatestMonth,
    latestMonth: model.latestMonth,
    leads,
    mqls,
    aiAssistantMqls: sum(allRows, (row) => row.aiAssistantMqls),
    spendByIcp,
    icpShareOfSpend: paidSpend ? icpSpend / paidSpend : 0,
    unfundedIcps,
    coverageGap,
    nextStep,
  }
}

// ---------------------------------------------------------------- Campaign register (tab 3)

export interface CampaignRow {
  campaign: CampaignDocument
  icpLabel?: string
  proposal: TagProposal
  proposedIcp?: IcpDocument
  channelLabels: string[]
  market?: string
  product: string
  status: 'spending' | 'no-spend' | 'planned' | 'ended'
  statusLabel: string
  spend: number
  clicks: number
  leads: number
  mqls: number
}

export function campaignRegister(model: EngineModel): CampaignRow[] {
  const latest = model.latestMonth
  return model.campaigns
    .map((campaign) => {
      const rows = campaignSnapshots(model, campaign._id)
      const latestSpend = sum(
        rows.filter((row) => row.month === latest),
        (row) => row.spend,
      )
      const icp = model.icps.find((candidate) => sameRef(campaign.icp, candidate._id))
      const proposal = proposeTags(campaign.title ?? '')
      const proposedIcp =
        !campaign.brand && !icp && proposal.archetype
          ? model.icps.find((candidate) => candidate.archetype === proposal.archetype)
          : undefined
      let status: CampaignRow['status']
      if (campaign.stage === 'planned') status = 'planned'
      else if (latestSpend > 0) status = 'spending'
      else if (campaign.stage === 'ended') status = 'ended'
      else status = 'no-spend'
      const statusLabel = {
        spending: `Spending in ${monthShort(latest)}`,
        'no-spend': `No ${monthShort(latest)} spend`,
        planned: 'Planned',
        ended: 'Ended',
      }[status]
      return {
        campaign,
        icpLabel: campaign.brand ? 'Brand (all ICPs)' : icp ? icpName(icp) : undefined,
        proposal,
        proposedIcp,
        channelLabels: (campaign.channels ?? []).map((channel) => channelLabels[channel] ?? channel),
        market: model.title(campaign.market),
        product: campaign.brand ? 'Brand' : (model.title(campaign.solution) ?? '—'),
        status,
        statusLabel,
        spend: sum(rows, (row) => row.spend),
        clicks: sum(rows, (row) => row.clicks),
        leads: sum(rows, (row) => row.leads),
        mqls: sum(rows, (row) => row.mqls),
      }
    })
    .sort((first, second) => second.spend - first.spend)
}

// ---------------------------------------------------------------- ICPs (tab 2)

export interface IcpCardView {
  icp: IcpDocument
  name: string
  spend: number
  share: number
  mqls: number
  pipeline: number
  campaignCount: number
  livePieces: number
  gapStages: string[]
  programmes: ProgrammeDocument[]
  pillars: MessagingPillarDocument[]
  priorityMarkets: string[]
  accountCount: number
  priorityAccounts: number
}

export function icpCards(model: EngineModel): IcpCardView[] {
  const overview = overviewView(model)
  const grid = coverageGrid(model)
  return model.icps.map((icp) => {
    const rows = snapshotsFor(model, 'icp').filter((row) => sameRef(row.subject, icp._id))
    const spendRow = overview.spendByIcp.find((row) => row.icpId === icp._id)
    const accounts = model.accounts.filter((account) => sameRef(account.icp, icp._id))
    return {
      icp,
      name: icpName(icp),
      spend: spendRow?.spend ?? 0,
      share: spendRow?.share ?? 0,
      mqls: sum(rows, (row) => row.mqls),
      pipeline: sum(rows, (row) => row.pipeline),
      campaignCount: spendRow?.campaignCount ?? 0,
      livePieces: grid.filter((cell) => cell.icpId === icp._id).reduce((total, cell) => total + cell.livePieces.length, 0),
      gapStages: grid.filter((cell) => cell.icpId === icp._id && cell.isGap).map((cell) => cell.stage),
      programmes: model.programmes.filter((programme) => sameRef(programme.icp, icp._id)),
      pillars: model.pillars.filter((pillar) => sameRef(pillar.icp, icp._id)),
      priorityMarkets: model.markets
        .filter((market) => market.priorityIcps?.some((ref) => ref._ref === icp._id))
        .map((market) => market.title ?? ''),
      accountCount: accounts.length,
      priorityAccounts: accounts.filter((account) => account.scores?.quadrant === 'priority-focus').length,
    }
  })
}

// ---------------------------------------------------------------- Content (new tab)

export interface CoverageCell {
  icpId: string
  stage: string
  livePieces: ContentPieceDocument[]
  inProgress: ContentPieceDocument[]
  briefs: BriefDocument[]
  mqls: number
  isGap: boolean
}

// Originals only: a JP or CN variant covers the same cell as its source piece.
const isOriginal = (piece: ContentPieceDocument) => !piece.variantOf?._ref

export function coverageGrid(model: EngineModel): CoverageCell[] {
  const mqlsByPiece = new Map<string, number>()
  for (const row of snapshotsFor(model, 'contentPiece')) {
    const id = row.subject?._ref
    if (id) mqlsByPiece.set(id, (mqlsByPiece.get(id) ?? 0) + (row.mqls ?? 0))
  }
  const variantMqls = (pieceId: string) =>
    model.pieces.filter((piece) => piece.variantOf?._ref === pieceId).reduce((total, piece) => total + (mqlsByPiece.get(piece._id) ?? 0), 0)
  return model.icps.flatMap((icp) =>
    STAGES.map((stage) => {
      const inCell = model.pieces.filter((piece) => isOriginal(piece) && piece.stage === stage && sameRef(piece.icp, icp._id))
      const livePieces = inCell.filter((piece) => LIVE_STATUSES.has(piece.status ?? ''))
      return {
        icpId: icp._id,
        stage,
        livePieces,
        inProgress: inCell.filter((piece) => IN_PROGRESS_STATUSES.has(piece.status ?? '')),
        briefs: model.briefs.filter(
          (brief) => brief.status !== 'delivered' && brief.stage === stage && sameRef(brief.icp, icp._id),
        ),
        mqls: sum(livePieces, (piece) => (mqlsByPiece.get(piece._id) ?? 0) + variantMqls(piece._id)),
        isGap: livePieces.length === 0,
      }
    }),
  )
}

export interface InventoryRow {
  piece: ContentPieceDocument
  topic?: string
  icp?: string
  solution?: string
  market?: string
  variantOf?: string
  hasForm: boolean
  mqls: number
  clicks: number
  usedBy: number
}

export function contentInventory(model: EngineModel): InventoryRow[] {
  const rows = snapshotsFor(model, 'contentPiece')
  return model.pieces
    .map((piece) => {
      const pieceRows = rows.filter((row) => sameRef(row.subject, piece._id))
      return {
        piece,
        topic: model.title(piece.topic),
        icp: model.icps.find((icp) => sameRef(piece.icp, icp._id)) ? icpName(model.icps.find((icp) => sameRef(piece.icp, icp._id))) : undefined,
        solution: model.title(piece.solution),
        market: model.title(piece.market),
        variantOf: model.title(piece.variantOf),
        hasForm: Boolean(piece.conversion?.hubspotFormId),
        mqls: sum(pieceRows, (row) => row.mqls),
        clicks: sum(pieceRows, (row) => row.clicks),
        usedBy: model.campaigns.filter(
          (campaign) =>
            campaign.contentUsed?.some((ref) => ref._ref === piece._id) ||
            campaign.tactics?.some((tactic) => tactic.asset?._ref === piece._id),
        ).length,
      }
    })
    .sort((first, second) => (first.piece.title ?? '').localeCompare(second.piece.title ?? ''))
}

export interface CalendarEntry {
  id: string
  kind: 'piece' | 'brief'
  title: string
  date: string
  status?: string
  icp?: string
}

export function editorialCalendar(model: EngineModel): CalendarEntry[] {
  const icpTitle = (ref: Ref | undefined) => {
    const icp = model.icps.find((candidate) => sameRef(ref, candidate._id))
    return icp ? icpName(icp) : undefined
  }
  const entries: CalendarEntry[] = [
    ...model.pieces
      .filter((piece) => piece.publishedAt || piece.plannedDate)
      .map((piece) => ({
        id: piece._id,
        kind: 'piece' as const,
        title: piece.title ?? 'Untitled',
        date: (LIVE_STATUSES.has(piece.status ?? '') ? piece.publishedAt : piece.plannedDate) ?? piece.publishedAt ?? piece.plannedDate!,
        status: piece.status,
        icp: icpTitle(piece.icp),
      })),
    ...model.briefs
      .filter((brief) => brief.deadline && brief.status !== 'delivered')
      .map((brief) => ({
        id: brief._id,
        kind: 'brief' as const,
        title: brief.title ?? 'Untitled brief',
        date: brief.deadline!,
        status: brief.status,
        icp: icpTitle(brief.icp),
      })),
  ]
  return entries.sort((first, second) => first.date.localeCompare(second.date))
}

export interface TopicResultRow {
  topic: TopicDocument
  pillar?: string
  impressions: number
  clicks: number
  position?: number
  previousPosition?: number
  aiCitations: number
  mqls: number
  livePieces: number
}

export function topicResults(model: EngineModel): TopicResultRow[] {
  const rows = snapshotsFor(model, 'topic')
  const latest = model.latestMonth
  const previous = model.months.at(-2)
  return model.topics
    .filter((topic) => topic.kind === 'cluster')
    .map((topic) => {
      const topicRows = rows.filter((row) => sameRef(row.subject, topic._id))
      const latestRow = topicRows.find((row) => row.month === latest)
      return {
        topic,
        pillar: model.title(topic.parent),
        impressions: latestRow?.impressions ?? 0,
        clicks: latestRow?.clicks ?? 0,
        position: latestRow?.position,
        previousPosition: topicRows.find((row) => row.month === previous)?.position,
        aiCitations: latestRow?.aiCitations ?? 0,
        mqls: sum(topicRows, (row) => row.mqls),
        livePieces: model.pieces.filter((piece) => sameRef(piece.topic, topic._id) && LIVE_STATUSES.has(piece.status ?? '')).length,
      }
    })
    .sort((first, second) => second.impressions - first.impressions)
}

// ---------------------------------------------------------------- Analytics (tab 4)

export interface AnalyticsView {
  spendByMonth: {month: string; byChannel: Record<string, number>}[]
  channels: string[]
  mqlsBySource: {source: string; mqls: number}[]
  leadsAndMqlsByMonth: {month: string; leads: number; mqls: number; rate: number}[]
  mqlsByAsset: {piece: ContentPieceDocument; mqls: number; aiAssistantMqls: number; clicks: number}[]
  mqlsByTopic: {topic: TopicDocument; mqls: number}[]
  icpFunnel: {icp: IcpDocument; leads: number; mqls: number; opportunities: number; pipeline: number}[]
  conversionAnomaly?: string
}

export function analyticsView(model: EngineModel): AnalyticsView {
  const campaignById = new Map(model.campaigns.map((campaign) => [campaign._id, campaign]))
  const campaignRows = snapshotsFor(model, 'campaign')
  const channels = PAID_CHANNELS.filter((channel) => model.campaigns.some((campaign) => campaign.channels?.includes(channel)))
  const spendByMonth = model.months.map((month) => {
    const byChannel: Record<string, number> = {}
    for (const channel of channels) {
      byChannel[channel] = sum(
        campaignRows.filter(
          (row) =>
            row.month === month &&
            campaignById.get(row.campaign?._ref ?? '')?.channels?.find((candidate) => PAID_CHANNELS.includes(candidate)) === channel,
        ),
        (row) => row.spend,
      )
    }
    return {month, byChannel}
  })

  const allRows = snapshotsFor(model, 'all')
  const sourceTotals = new Map<string, number>()
  for (const row of allRows) for (const entry of row.mqlsBySource ?? []) {
    if (entry.source) sourceTotals.set(entry.source, (sourceTotals.get(entry.source) ?? 0) + (entry.mqls ?? 0))
  }
  const leadsAndMqlsByMonth = model.months.map((month) => {
    const rows = allRows.filter((row) => row.month === month)
    const leads = sum(rows, (row) => row.leads)
    const mqls = sum(rows, (row) => row.mqls)
    return {month, leads, mqls, rate: leads ? mqls / leads : 0}
  })
  // Leads up while MQLs fall: the pattern the brief says nobody can explain today.
  let conversionAnomaly: string | undefined
  for (let index = 1; index < leadsAndMqlsByMonth.length; index += 1) {
    const current = leadsAndMqlsByMonth[index]
    const previous = leadsAndMqlsByMonth[index - 1]
    if (current.leads > previous.leads && current.mqls < previous.mqls) {
      conversionAnomaly = `In ${monthShort(current.month)} new leads rose to ${current.leads.toLocaleString('en-GB')} while MQLs fell to ${current.mqls.toLocaleString(
        'en-GB',
      )}. The per-asset and per-topic tables below show where the drop came from.`
    }
  }

  const pieceRows = snapshotsFor(model, 'contentPiece')
  const topicRows = snapshotsFor(model, 'topic')
  const icpRows = snapshotsFor(model, 'icp')
  return {
    spendByMonth,
    channels,
    mqlsBySource: [...sourceTotals].map(([source, mqls]) => ({source, mqls})).sort((first, second) => second.mqls - first.mqls),
    leadsAndMqlsByMonth,
    mqlsByAsset: model.pieces
      .map((piece) => {
        const rows = pieceRows.filter((row) => sameRef(row.subject, piece._id))
        return {
          piece,
          mqls: sum(rows, (row) => row.mqls),
          aiAssistantMqls: sum(rows, (row) => row.aiAssistantMqls),
          clicks: sum(rows, (row) => row.clicks),
        }
      })
      .filter((row) => row.mqls > 0 || row.clicks > 0)
      .sort((first, second) => second.mqls - first.mqls),
    mqlsByTopic: model.topics
      .filter((topic) => topic.kind === 'cluster')
      .map((topic) => ({topic, mqls: sum(topicRows.filter((row) => sameRef(row.subject, topic._id)), (row) => row.mqls)}))
      .sort((first, second) => second.mqls - first.mqls),
    icpFunnel: model.icps.map((icp) => {
      const rows = icpRows.filter((row) => sameRef(row.subject, icp._id))
      return {
        icp,
        leads: sum(rows, (row) => row.leads),
        mqls: sum(rows, (row) => row.mqls),
        opportunities: sum(rows, (row) => row.opportunities),
        pipeline: sum(rows, (row) => row.pipeline),
      }
    }),
    conversionAnomaly,
  }
}

// ---------------------------------------------------------------- Orchestration (tab 5)
// The brief does not describe the prototype's Orchestration tab. This is its reading of step 4,
// Distribution: "which asset runs where" and "one asset, many uses", by ICP and channel.

export interface OrchestrationView {
  icpByChannel: {icp: IcpDocument; cells: Record<string, {campaigns: number; latestSpend: number}>}[]
  channels: string[]
  assetUse: {piece: ContentPieceDocument; uses: Record<string, number>; campaigns: string[]; totalUses: number}[]
  unusedLivePieces: ContentPieceDocument[]
  byStage: Record<string, CampaignDocument[]>
}

export function orchestrationView(model: EngineModel): OrchestrationView {
  const channels = [...new Set(model.campaigns.flatMap((campaign) => campaign.channels ?? []))].sort(
    (first, second) => Object.keys(channelLabels).indexOf(first) - Object.keys(channelLabels).indexOf(second),
  )
  const campaignRows = snapshotsFor(model, 'campaign')
  const icpByChannel = model.icps.map((icp) => {
    const cells: Record<string, {campaigns: number; latestSpend: number}> = {}
    for (const channel of channels) {
      const campaigns = model.campaigns.filter(
        (campaign) =>
          !campaign.brand && sameRef(campaign.icp, icp._id) && campaign.channels?.includes(channel) && campaign.stage !== 'ended',
      )
      const ids = new Set(campaigns.map((campaign) => campaign._id))
      cells[channel] = {
        campaigns: campaigns.length,
        latestSpend: sum(
          campaignRows.filter((row) => row.month === model.latestMonth && ids.has(row.campaign?._ref ?? '')),
          (row) => row.spend,
        ),
      }
    }
    return {icp, cells}
  })

  const assetUse = model.pieces
    .filter((piece) => LIVE_STATUSES.has(piece.status ?? ''))
    .map((piece) => {
      const uses: Record<string, number> = Object.fromEntries(TACTIC_KINDS.map((kind) => [kind, 0]))
      const campaigns = new Set<string>()
      for (const campaign of model.campaigns) {
        for (const tactic of campaign.tactics ?? []) {
          if (tactic.asset?._ref === piece._id && tactic.kind) {
            uses[tactic.kind] = (uses[tactic.kind] ?? 0) + 1
            campaigns.add(campaign.title ?? campaign._id)
          }
        }
        if (campaign.contentUsed?.some((ref) => ref._ref === piece._id)) campaigns.add(campaign.title ?? campaign._id)
      }
      if (piece.url) uses['web-page'] = Math.max(1, uses['web-page'])
      return {piece, uses, campaigns: [...campaigns], totalUses: Object.values(uses).reduce((total, count) => total + count, 0)}
    })
    .sort((first, second) => second.totalUses - first.totalUses)

  const byStage: Record<string, CampaignDocument[]> = {planned: [], live: [], paused: [], ended: []}
  for (const campaign of model.campaigns) (byStage[campaign.stage ?? 'planned'] ??= []).push(campaign)

  return {
    icpByChannel,
    channels,
    assetUse,
    unusedLivePieces: assetUse.filter((entry) => entry.campaigns.length === 0).map((entry) => entry.piece),
    byStage,
  }
}

// ---------------------------------------------------------------- Strategy (new tab)

export interface ProgrammeRow {
  programme: ProgrammeDocument
  icp?: string
  market?: string
  solutions: string[]
  messaging: string[]
  campaigns: CampaignDocument[]
  spend: number
  mqls: number
  pipeline: number
  targets: Record<string, number>
}

export interface StrategyView {
  plan?: PlanDocument
  planBudget: number
  programmes: ProgrammeRow[]
  messaging: {icp: IcpDocument; bySolution: Record<string, MessagingPillarDocument[]>}[]
  proofPoints: {proofPoint: ProofPointDocument; isExpired: boolean; liveUses: number; markets: string[]}[]
  competitors: CompetitorDocument[]
}

export function strategyView(model: EngineModel, today: string): StrategyView {
  const plan = [...model.plans].sort((first, second) => (second.fiscalYear ?? '').localeCompare(first.fiscalYear ?? ''))[0]
  const programmes = model.programmes
    .filter((programme) => !plan || sameRef(programme.plan, plan._id))
    .map((programme) => {
      const campaigns = model.campaigns.filter((campaign) => sameRef(campaign.programme, programme._id))
      const ids = new Set(campaigns.map((campaign) => campaign._id))
      const rows = snapshotsFor(model, 'campaign').filter((row) => ids.has(row.campaign?._ref ?? ''))
      const icp = model.icps.find((candidate) => sameRef(programme.icp, candidate._id))
      return {
        programme,
        icp: icp ? icpName(icp) : undefined,
        market: model.title(programme.market),
        solutions: (programme.solutions ?? []).map((ref) => model.title(ref) ?? '').filter(Boolean),
        messaging: (programme.messaging ?? []).map((ref) => model.title(ref) ?? '').filter(Boolean),
        campaigns,
        spend: sum(rows, (row) => row.spend),
        mqls: sum(rows, (row) => row.mqls),
        pipeline: sum(rows, (row) => row.pipeline),
        targets: Object.fromEntries((programme.targets ?? []).map((target) => [target.metric ?? '', target.value ?? 0])),
      }
    })
  const livePieces = model.pieces.filter((piece) => LIVE_STATUSES.has(piece.status ?? ''))
  return {
    plan,
    planBudget: sum(plan?.budgets ?? [], (budget) => budget.amount),
    programmes,
    messaging: model.icps.map((icp) => {
      const bySolution: Record<string, MessagingPillarDocument[]> = {}
      for (const solution of model.solutions) {
        bySolution[solution._id] = model.pillars.filter((pillar) => sameRef(pillar.icp, icp._id) && sameRef(pillar.solution, solution._id))
      }
      return {icp, bySolution}
    }),
    proofPoints: model.proofPoints
      .map((proofPoint) => ({
        proofPoint,
        isExpired: Boolean(proofPoint.expiresAt && proofPoint.expiresAt < today),
        liveUses: livePieces.filter((piece) => piece.proofPoints?.some((ref) => ref._ref === proofPoint._id)).length,
        markets: (proofPoint.allowedMarkets ?? []).map((ref) => model.title(ref) ?? '').filter(Boolean),
      }))
      .sort((first, second) => (first.proofPoint.expiresAt ?? '').localeCompare(second.proofPoint.expiresAt ?? '')),
    competitors: model.competitors,
  }
}

// ---------------------------------------------------------------- Sanity setup (tab 7)
// Also not described in the brief: shows what the hub is reading and whether the joins hold.

export interface SetupView {
  countsByType: {dataset: 'website' | 'gtm'; type: string; count: number}[]
  crossDatasetRefs: number
  danglingRefs: {from: string; field: string; ref: string}[]
  lastSyncedAt?: string
  snapshotMonths: string[]
}

export function setupView(model: EngineModel, websiteTypes: readonly string[], gtmTypes: readonly string[]): SetupView {
  const countOf = (type: string) => [...model.byId.values()].filter((document) => document._type === type).length
  const danglingRefs: SetupView['danglingRefs'] = []
  let crossDatasetRefs = 0
  const visit = (value: unknown, from: string, field: string) => {
    if (Array.isArray(value)) value.forEach((item) => visit(item, from, field))
    else if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      if (record._type === 'crossDatasetReference' && typeof record._ref === 'string') {
        crossDatasetRefs += 1
        if (!model.byId.has(record._ref)) danglingRefs.push({from, field, ref: record._ref})
      }
      for (const [key, child] of Object.entries(record)) if (!key.startsWith('_')) visit(child, from, key)
    }
  }
  for (const document of model.byId.values()) {
    if ((gtmTypes as readonly string[]).includes(document._type)) visit(document, document._id, '')
  }
  const syncedAt = model.snapshots.map((snapshot) => snapshot.syncedAt).filter(Boolean).sort().at(-1)
  return {
    countsByType: [
      ...websiteTypes.map((type) => ({dataset: 'website' as const, type, count: countOf(type)})),
      ...gtmTypes.map((type) => ({dataset: 'gtm' as const, type, count: countOf(type)})),
    ],
    crossDatasetRefs,
    danglingRefs,
    lastSyncedAt: syncedAt,
    snapshotMonths: model.months,
  }
}

export type {SnapshotMetrics}
