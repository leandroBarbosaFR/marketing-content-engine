import {evaluate, parse} from 'groq-js'
import {describe, expect, it} from 'vitest'
import {GTM_QUERY, WEBSITE_QUERY} from '../hub/src/engine/types'
import {scoreAttractiveness} from '../hub/src/engine/scoring'
import {generateSeed, SEED_MONTHS} from '../seed/generate'

const seed = generateSeed({projectId: 'testproject', websiteDataset: 'production'})

function collectRefs(value: unknown, found: {_ref: string; _type?: string; _dataset?: string; _projectId?: string}[] = []) {
  if (Array.isArray(value)) value.forEach((item) => collectRefs(item, found))
  else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record._ref === 'string') found.push(record as never)
    Object.values(record).forEach((item) => collectRefs(item, found))
  }
  return found
}

describe('synthetic seed', () => {
  const websiteIds = new Set(seed.website.map((document) => document._id))
  const gtmIds = new Set(seed.gtm.map((document) => document._id))

  it('is deterministic', () => {
    expect(generateSeed({projectId: 'testproject', websiteDataset: 'production'})).toEqual(seed)
  })

  it('has unique IDs and keeps each type in its dataset (brief §5)', () => {
    expect(websiteIds.size).toBe(seed.website.length)
    expect(gtmIds.size).toBe(seed.gtm.length)
    expect(new Set(seed.website.map((document) => document._type))).toEqual(new Set(['icp', 'solution', 'market', 'topic', 'proofPoint', 'contentPiece']))
    expect(new Set(seed.gtm.map((document) => document._type))).toEqual(
      new Set(['plan', 'programme', 'messagingPillar', 'competitor', 'brief', 'campaign', 'snapshot', 'account']),
    )
  })

  it('references within the website dataset stay plain; gtm-brain uses cross-dataset references', () => {
    for (const reference of collectRefs(seed.website)) {
      expect(reference._type).toBe('reference')
      expect(websiteIds.has(reference._ref)).toBe(true)
    }
    for (const reference of collectRefs(seed.gtm)) {
      if (reference._type === 'crossDatasetReference') {
        expect(reference._dataset).toBe('production')
        expect(reference._projectId).toBe('testproject')
        expect(websiteIds.has(reference._ref)).toBe(true)
      } else {
        expect(gtmIds.has(reference._ref)).toBe(true)
      }
    }
  })

  it('has one ICP per Simon-Kucher archetype and the four tags on every content piece', () => {
    expect(seed.website.filter((document) => document._type === 'icp').map((document) => (document as {archetype?: string}).archetype)).toHaveLength(5)
    for (const piece of seed.website.filter((document) => document._type === 'contentPiece') as unknown as Record<string, {_ref?: string}>[]) {
      expect([piece.icp?._ref, piece.solution?._ref, piece.market?._ref, piece.topic?._ref].every(Boolean)).toBe(true)
    }
  })

  it('writes month-first snapshots with deterministic IDs', () => {
    const snapshots = seed.gtm.filter((document) => document._type === 'snapshot') as {_id: string; month: string; subjectType: string}[]
    expect(new Set(snapshots.map((snapshot) => snapshot.month))).toEqual(new Set(SEED_MONTHS))
    for (const snapshot of snapshots) expect(snapshot._id.startsWith(`snapshot-${snapshot.month.slice(0, 7)}-${snapshot.subjectType}-`)).toBe(true)
  })

  it('stores account scores that match the section 7 formulas', () => {
    for (const account of seed.gtm.filter((document) => document._type === 'account') as {
      inputs: {revenueUsd: number; globalCountries: number; vistraCountries: number; productGroups: number}
      scores: {quadrant: string; potential: number}
    }[]) {
      const score = scoreAttractiveness({
        globalRevenue: account.inputs.revenueUsd,
        globalCountries: account.inputs.globalCountries,
        vistraCountries: account.inputs.vistraCountries,
        productGroups: account.inputs.productGroups,
      })
      expect(account.scores.quadrant).toBe(score.quadrant)
      expect(account.scores.potential).toBeCloseTo(score.potential, 0)
    }
  })

  it('the hub queries return each whole dataset', async () => {
    const run = async (query: string, dataset: unknown[]) => (await evaluate(parse(query), {dataset})).get()
    expect(await run(WEBSITE_QUERY, seed.website)).toHaveLength(seed.website.length)
    expect(await run(GTM_QUERY, seed.gtm)).toHaveLength(seed.gtm.length)
  })
})

describe('site totals', () => {
  it('cover at least everything campaigns and content pieces produced each month', () => {
    const snapshots = seed.gtm.filter((document) => document._type === 'snapshot') as {month: string; subjectType: string; leads?: number; mqls?: number; aiAssistantMqls?: number}[]
    for (const month of SEED_MONTHS) {
      const inMonth = snapshots.filter((snapshot) => snapshot.month === month)
      const site = inMonth.find((snapshot) => snapshot.subjectType === 'all')!
      const attributed = inMonth.filter((snapshot) => snapshot.subjectType === 'campaign' || snapshot.subjectType === 'contentPiece')
      expect(site.leads).toBeGreaterThanOrEqual(attributed.reduce((total, snapshot) => total + (snapshot.leads ?? 0), 0))
      expect(site.mqls).toBeGreaterThanOrEqual(attributed.reduce((total, snapshot) => total + (snapshot.mqls ?? 0), 0))
    }
  })
})
