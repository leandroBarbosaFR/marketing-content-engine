import {describe, expect, it} from 'vitest'
import {
  analyticsView,
  buildModel,
  campaignRegister,
  contentInventory,
  coverageGrid,
  editorialCalendar,
  icpCards,
  orchestrationView,
  overviewView,
  setupView,
  strategyView,
  topicResults,
} from '../hub/src/engine/model'
import {GTM_TYPES, WEBSITE_TYPES} from '../hub/src/engine/types'
import {generateSeed} from '../seed/generate'

const seed = generateSeed({projectId: 'testproject', websiteDataset: 'production'})
const model = buildModel(seed.website, seed.gtm)
const TODAY = '2026-11-16'

describe('Overview (prototype tab)', () => {
  const overview = overviewView(model)

  it('leads with the concentration finding and the unfunded ICP', () => {
    expect(overview.headline).toMatch(/^\d+% of paid spend backs one ICP, and Cross-border Corporate Structuring gets none$/)
  })

  it('splits paid spend by ICP, brand and untagged, adding up to the total', () => {
    const total = overview.spendByIcp.reduce((sum, row) => sum + row.spend, 0)
    expect(total).toBeCloseTo(overview.paidSpend, 6)
    expect(overview.spendByIcp.find((row) => row.isBrand)!.share).toBeGreaterThan(0.25)
    expect(overview.spendByIcp.find((row) => row.key === 'untagged')!.campaignCount).toBe(2)
  })

  it('flags both effectively unfunded ICPs and suggests a next step from their triggers', () => {
    expect(overview.unfundedIcps.map((entry) => entry.icp.archetype).sort()).toEqual(['cross-border-structuring', 'global-consolidator'])
    expect(overview.coverageGap).toMatch(/2 of the 5 priority ICPs are effectively unfunded/)
    expect(overview.nextStep).toMatch(/trigger list.*Retag brand search/)
  })

  it('reports Google and LinkedIn spend, and HubSpot totals from the all-sources snapshots', () => {
    expect(overview.spendByChannel.map((entry) => entry.channel)).toEqual(['google-ads', 'linkedin-ads'])
    expect(overview.leads).toBeGreaterThan(overview.mqls)
    expect(overview.spendingInLatestMonth).toBeLessThan(overview.campaignCount)
  })
})

describe('Campaign register (prototype tab)', () => {
  const rows = campaignRegister(model)

  it('lists every campaign, biggest spend first, with a status from the latest month', () => {
    expect(rows).toHaveLength(model.campaigns.length)
    expect(rows.map((row) => row.spend)).toEqual([...rows.map((row) => row.spend)].sort((first, second) => second - first))
    expect(rows.find((row) => row.campaign.stage === 'planned')!.statusLabel).toBe('Planned')
    expect(rows.some((row) => row.statusLabel === 'Spending in Oct')).toBe(true)
    expect(rows.some((row) => row.statusLabel === 'No Oct spend')).toBe(true)
  })

  it('proposes an ICP from the name for untagged campaigns only', () => {
    const untagged = rows.filter((row) => !row.icpLabel)
    expect(untagged.map((row) => row.proposedIcp?.archetype).sort()).toEqual(['distributed-multinational', 'fund-investment-platform'])
    expect(rows.filter((row) => row.icpLabel).every((row) => !row.proposedIcp)).toBe(true)
    expect(rows.filter((row) => row.campaign.brand).every((row) => row.icpLabel === 'Brand (all ICPs)' && row.product === 'Brand')).toBe(true)
  })
})

describe('Content (new tab)', () => {
  it('flags the empty cells of the coverage grid', () => {
    const grid = coverageGrid(model)
    expect(grid).toHaveLength(15)
    expect(grid.filter((cell) => cell.isGap).map((cell) => `${cell.icpId}:${cell.stage}`)).toEqual([
      'icp-global-consolidator:consider',
      'icp-global-consolidator:decide',
      'icp-cross-border-structuring:consider',
      'icp-cross-border-structuring:decide',
      'icp-fund-investment-platform:decide',
    ])
    expect(grid.find((cell) => cell.icpId === 'icp-global-consolidator' && cell.stage === 'decide')!.briefs).toHaveLength(1)
  })

  it('counts a JP or CN variant in its source piece cell, not twice', () => {
    const cell = coverageGrid(model).find((candidate) => candidate.icpId === 'icp-distributed-multinational' && candidate.stage === 'consider')!
    expect(cell.livePieces.map((piece) => piece._id).sort()).toEqual(['content-management-accounting', 'content-payroll-buyers-guide'])
  })

  it('builds the inventory with all four tags and the editorial calendar in date order', () => {
    const inventory = contentInventory(model)
    expect(inventory.every((row) => row.topic && row.icp && row.solution && row.market)).toBe(true)
    const calendar = editorialCalendar(model)
    expect(calendar.map((entry) => entry.date)).toEqual([...calendar.map((entry) => entry.date)].sort())
    expect(calendar.some((entry) => entry.kind === 'brief')).toBe(true)
  })

  it('reports topic results from the latest month, biggest first', () => {
    const topics = topicResults(model)
    expect(topics).toHaveLength(12)
    expect(topics.every((row) => typeof row.position === 'number')).toBe(true)
    expect(topics[0].impressions).toBeGreaterThanOrEqual(topics.at(-1)!.impressions)
  })
})

describe('Analytics, orchestration, strategy and setup', () => {
  it('finds the month where leads rose and MQLs fell', () => {
    const analytics = analyticsView(model)
    expect(analytics.conversionAnomaly).toMatch(/^In Sep new leads rose/)
    expect(analytics.mqlsBySource.map((entry) => entry.source)).toContain('AI assistants')
    expect(analytics.spendByMonth).toHaveLength(4)
    expect(analytics.icpFunnel.every((row) => row.mqls <= row.leads)).toBe(true)
  })

  it('shows which live asset runs where, and the ones no campaign uses', () => {
    const orchestration = orchestrationView(model)
    expect(orchestration.assetUse.every((entry) => entry.uses['web-page'] >= 1)).toBe(true)
    expect(orchestration.unusedLivePieces.length).toBeGreaterThan(0)
    expect(orchestration.byStage.planned).toHaveLength(1)
  })

  it('rolls campaign results up to programmes and flags expired proof still live', () => {
    const strategy = strategyView(model, TODAY)
    expect(strategy.plan?.fiscalYear).toBe('FY27')
    expect(strategy.programmes.find((row) => row.programme._id === 'programme-vgs-multinational-global')!.spend).toBeGreaterThan(0)
    expect(strategy.proofPoints.filter((row) => row.isExpired && row.liveUses > 0).map((row) => row.proofPoint._id)).toEqual(['proof-friction-index'])
    expect(strategy.messaging).toHaveLength(5)
  })

  it('resolves every cross-dataset reference in the seed', () => {
    const setup = setupView(model, WEBSITE_TYPES, GTM_TYPES)
    expect(setup.crossDatasetRefs).toBeGreaterThan(100)
    expect(setup.danglingRefs).toEqual([])
    expect(setup.snapshotMonths).toEqual(['2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01'])
  })

  it('gives every ICP card its gaps, programmes and messaging', () => {
    const cards = icpCards(model)
    expect(cards).toHaveLength(5)
    expect(cards.find((card) => card.icp.archetype === 'cross-border-structuring')!.gapStages).toEqual(['consider', 'decide'])
    expect(cards.every((card) => card.programmes.length === 1)).toBe(true)
  })

  it('prefers a draft over its published version', () => {
    const campaign = seed.gtm.find((document) => document._type === 'campaign')!
    const withDraft = buildModel(seed.website, [...seed.gtm, {...campaign, _id: `drafts.${campaign._id}`, title: 'Edited name'}])
    expect(withDraft.campaigns.find((candidate) => candidate._id === campaign._id)!.title).toBe('Edited name')
    expect(withDraft.campaigns).toHaveLength(model.campaigns.length)
  })
})
