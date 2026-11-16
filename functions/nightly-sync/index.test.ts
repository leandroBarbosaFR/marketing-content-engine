import {describe, expect, it} from 'vitest'
import {buildSnapshots, convertToGbp, isAiAssistantSource, normalizeUrl, snapshotId, topicForQuery} from './lib/buildSnapshots'
import {loadSourceRows, type SourceAdapter} from './lib/sourceAdapters'
import type {SourceRows, SyncSubjects} from './lib/sourceRows'
import {handler, monthsToSync, parseGbpRates} from './index'

const subjects: SyncSubjects = {
  contentPieces: [
    {_id: 'content-payroll-guide', url: 'https://www.example.com/en/payroll-guide/', hubspotFormId: 'FORM-1', icp: 'icp-dm', solution: 'solution-payroll', market: 'market-global', topic: 'topic-payroll'},
    {_id: 'content-bvi', url: 'https://example.com/en/bvi', icp: 'icp-cb', topic: 'topic-bvi'},
  ],
  topics: [
    {_id: 'topic-payroll', targetQueries: ['global payroll'], icp: 'icp-dm'},
    {_id: 'topic-bvi', targetQueries: ['bvi company'], icp: 'icp-cb'},
    {_id: 'topic-bvi-formation', targetQueries: ['bvi company formation'], icp: 'icp-cb'},
  ],
  campaigns: [{_id: 'campaign-search', title: 'vgs_payroll_gl_search_google', utm: 'payroll_q4', icp: 'icp-dm', solution: 'solution-payroll'}],
  icpIds: ['icp-dm', 'icp-cb', 'icp-gc'],
}

const month = '2026-10-01'
const rows: SourceRows = {
  searchConsole: [
    {month, query: 'Global Payroll providers', pageUrl: 'http://example.com/en/payroll-guide', clicks: 10, impressions: 1000, position: 4},
    {month, query: 'global payroll', pageUrl: 'https://example.com/en/payroll-guide?utm=x', clicks: 30, impressions: 3000, position: 8},
    {month, query: 'bvi company formation cost', pageUrl: 'https://example.com/en/other', clicks: 5, impressions: 500, position: 12},
  ],
  analytics: [
    {month, pageUrl: 'https://example.com/en/payroll-guide', sessions: 400},
    {month, pageUrl: 'https://example.com/en/unknown', sessions: 100},
  ],
  hubspot: [
    {month, formId: 'form-1', utmCampaign: 'PAYROLL_Q4', source: 'Paid search', leads: 10, mqls: 4, opportunities: 1, pipeline: 50_000, currency: 'GBP'},
    {month, pageUrl: 'https://example.com/en/bvi/', source: 'ChatGPT', leads: 3, mqls: 2},
    {month, source: 'Direct', leads: 20, mqls: 5},
  ],
  funnel: [
    {month, campaignName: 'VGS_PAYROLL_GL_SEARCH_GOOGLE', spend: 1000, currency: 'USD', clicks: 200, impressions: 9000},
    {month, campaignName: 'unknown_campaign', spend: 500, currency: 'GBP', clicks: 50, impressions: 1000},
  ],
  peec: [{month, pageUrl: 'example.com/en/bvi', citations: 7}],
}

const result = buildSnapshots({subjects, rows, gbpRates: {USD: 0.8}, projectId: 'p1', websiteDataset: 'production', syncedAt: '2026-11-01T02:00:00Z'})
const byId = (id: string) => result.snapshots.find((snapshot) => snapshot._id === id)

describe('helpers', () => {
  it('normalises URLs, sources, queries and currencies', () => {
    expect(normalizeUrl('HTTPS://WWW.Example.com/en/a/?x=1#top')).toBe('example.com/en/a')
    expect(isAiAssistantSource('chatgpt.com')).toBe(true)
    expect(isAiAssistantSource('Paid search')).toBe(false)
    expect(topicForQuery('BVI company formation cost', subjects.topics)).toBe('topic-bvi-formation')
    expect(convertToGbp(100, 'USD', {USD: 0.8})).toBe(80)
    expect(() => convertToGbp(100, 'EUR', {})).toThrow(/SYNC_GBP_RATES/)
    expect(parseGbpRates('USD=0.79, EUR=0.85')).toEqual({USD: 0.79, EUR: 0.85})
    expect(() => parseGbpRates('usd=x')).toThrow()
    expect(monthsToSync(new Date('2026-01-15T00:00:00Z'))).toEqual(['2025-12-01', '2026-01-01'])
  })
})

describe('buildSnapshots', () => {
  it('uses the same deterministic IDs as the seed and the gtm-brain snapshot shape', () => {
    expect(snapshotId(month, 'contentPiece', 'content-bvi')).toBe('snapshot-2026-10-contentPiece-content-bvi')
    const piece = byId('snapshot-2026-10-contentPiece-content-payroll-guide')!
    expect(piece).toMatchObject({
      _type: 'snapshot',
      month,
      subjectType: 'contentPiece',
      subject: {_type: 'crossDatasetReference', _ref: 'content-payroll-guide', _dataset: 'production', _projectId: 'p1', _weak: true},
      icp: {_ref: 'icp-dm'},
      solution: {_ref: 'solution-payroll'},
      market: {_ref: 'market-global'},
      topic: {_ref: 'topic-payroll'},
      clicks: 40,
      impressions: 4000,
      position: 7,
      sessions: 400,
      leads: 10,
      mqls: 4,
      conversions: 10,
    })
  })

  it('maps paid spend to campaigns in GBP and HubSpot UTMs to the same campaign', () => {
    expect(byId('snapshot-2026-10-campaign-campaign-search')).toMatchObject({
      campaign: {_type: 'reference', _ref: 'campaign-search'},
      spend: 800,
      clicks: 200,
      leads: 10,
      mqls: 4,
      pipeline: 50_000,
      icp: {_ref: 'icp-dm'},
    })
  })

  it('rolls pieces up to topics and counts each lead once per ICP', () => {
    expect(byId('snapshot-2026-10-topic-topic-payroll')).toMatchObject({clicks: 40, mqls: 4})
    expect(byId('snapshot-2026-10-topic-topic-bvi')).toMatchObject({mqls: 2, aiAssistantMqls: 2, aiCitations: 7})
    expect(byId('snapshot-2026-10-topic-topic-bvi-formation')).toMatchObject({clicks: 5})
    expect(byId('snapshot-2026-10-icp-icp-dm')).toMatchObject({leads: 10, mqls: 4, spend: 800, sessions: 400})
    expect(byId('snapshot-2026-10-icp-icp-cb')).toMatchObject({leads: 3, mqls: 2, aiCitations: 7})
    expect(byId('snapshot-2026-10-icp-icp-gc')).toBeUndefined()
  })

  it('writes the site total with MQLs by source, AI assistants as their own source', () => {
    expect(byId('snapshot-2026-10-all-all-sources')).toMatchObject({
      leads: 33,
      mqls: 11,
      aiAssistantMqls: 2,
      mqlsBySource: [
        {source: 'Direct', mqls: 5},
        {source: 'Paid search', mqls: 4},
        {source: 'AI assistants', mqls: 2},
      ],
    })
  })

  it('reports what share of each source landed on a subject', () => {
    const line = (source: string, measure: string) => result.reconciliation.find((entry) => entry.source === source && entry.measure.startsWith(measure))!
    expect(line('analytics', 'sessions').matchedShare).toBeCloseTo(0.8)
    expect(line('funnel', 'spend').matchedShare).toBeCloseTo(800 / 1300)
    expect(line('hubspot', 'MQLs').matchedShare).toBeCloseTo(6 / 11)
  })

  it('rejects months that are not the first of the month', () => {
    expect(() => buildSnapshots({subjects, rows: {...rows, analytics: [{month: '2026-10-15', pageUrl: 'https://example.com/en/bvi', sessions: 1}]}, gbpRates: {USD: 0.8}, projectId: 'p', websiteDataset: 'production', syncedAt: ''})).toThrow(/first day/)
  })
})

describe('sources and guardrails', () => {
  it('skips sources without credentials and loads the rest', async () => {
    const adapter: SourceAdapter = {source: 'peec', requiredVariables: ['PEEC_API_KEY'], load: async () => [{month, pageUrl: 'x', citations: 1}]}
    const skipped = await loadSourceRows([month], {}, [adapter])
    expect(skipped.outcomes[0].status).toBe('not-configured')
    const loaded = await loadSourceRows([month], {PEEC_API_KEY: 'k'}, [adapter])
    expect(loaded.rows.peec).toHaveLength(1)
  })

  it('does nothing unless SYNC_ENABLED is "true"', async () => {
    const previous = process.env.SYNC_ENABLED
    delete process.env.SYNC_ENABLED
    const logs: string[] = []
    const original = console.log
    console.log = (message: string) => logs.push(message)
    try {
      await handler({context: {clientOptions: {}}})
    } finally {
      console.log = original
      if (previous !== undefined) process.env.SYNC_ENABLED = previous
    }
    expect(logs).toEqual(['Nightly sync is off (SYNC_ENABLED is not "true"). Nothing read or written.'])
  })
})
