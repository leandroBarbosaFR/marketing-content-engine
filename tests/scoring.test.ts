import {describe, expect, it} from 'vitest'
import {
  globalCountriesScore,
  hasCredibleRightToWin,
  nextBestActions,
  productGroupsScore,
  qualitativeQuadrant,
  quadrantFor,
  revenueScore,
  rightToWinScore,
  roundScore,
  scoreAttractiveness,
  vistraCountriesScore,
} from '../hub/src/engine/scoring'

// Check values from the brief (section 7) and Simon-Kucher's scale tables.
describe('component scores match the published check values', () => {
  it.each([
    [10_000, 0],
    [1_000_000, 29],
    [100_000_000, 57],
    [1_000_000_000, 71],
    [100_000_000_000, 100],
  ])('revenue $%d scores %d', (revenue, expected) => {
    expect(roundScore(revenueScore(revenue))).toBe(expected)
  })

  it.each([
    [1, 0],
    [3, 24],
    [10, 50],
    [50, 85],
    [100, 100],
  ])('%d global countries score %d', (countries, expected) => {
    expect(roundScore(globalCountriesScore(countries))).toBe(expected)
  })

  it.each([
    [1, 0],
    [2, 33],
    [3, 53],
    [5, 77],
    [8, 100],
  ])('%d Vistra countries score %d', (countries, expected) => {
    expect(roundScore(vistraCountriesScore(countries))).toBe(expected)
  })

  it.each([
    [1, 0],
    [2, 30],
    [3, 48],
    [5, 70],
    [10, 100],
  ])('%d product groups score %d', (productGroups, expected) => {
    expect(roundScore(productGroupsScore(productGroups))).toBe(expected)
  })
})

describe('scores are capped and tolerate missing inputs', () => {
  it('caps above the top of each scale', () => {
    expect(revenueScore(5e12)).toBe(100)
    expect(globalCountriesScore(250)).toBe(100)
    expect(vistraCountriesScore(40)).toBe(100)
    expect(productGroupsScore(25)).toBe(100)
  })

  it('scores 0 below the floor, at zero and when unknown', () => {
    expect(revenueScore(5_000)).toBe(0)
    expect(revenueScore(0)).toBe(0)
    expect(revenueScore(undefined)).toBe(0)
    expect(globalCountriesScore(0)).toBe(0)
    expect(vistraCountriesScore(null)).toBe(0)
    expect(productGroupsScore(-3)).toBe(0)
  })
})

describe('potential, complexity and quadrant', () => {
  it('weights potential 70/30 and complexity 50/50', () => {
    const score = scoreAttractiveness({
      globalRevenue: 1_000_000_000,
      globalCountries: 10,
      vistraCountries: 2,
      productGroups: 2,
    })
    expect(score.potential).toBeCloseTo(0.7 * (500 / 7) + 0.3 * 50, 6)
    expect(score.complexity).toBeCloseTo(0.5 * ((100 * Math.log(2)) / Math.log(8)) + 0.5 * (100 * Math.log10(2)), 6)
    expect(score.quadrant).toBe('priority-focus')
  })

  it('uses the natural-break thresholds 36 and 20, inclusive', () => {
    expect(quadrantFor(36, 20)).toBe('priority-focus')
    expect(quadrantFor(35.99, 20)).toBe('selective')
    expect(quadrantFor(36, 19.99)).toBe('attractive-exception')
    expect(quadrantFor(10, 5)).toBe('efficient-serve')
  })

  it('places a large single-country payroll client as an attractive exception', () => {
    const score = scoreAttractiveness({
      globalRevenue: 2_000_000_000,
      globalCountries: 1,
      vistraCountries: 1,
      productGroups: 1,
    })
    expect(score.quadrant).toBe('attractive-exception')
  })

  it('places a small domestic CoSec client in efficient serve', () => {
    const score = scoreAttractiveness({globalRevenue: 2_000_000, globalCountries: 1, vistraCountries: 1, productGroups: 1})
    expect(score.quadrant).toBe('efficient-serve')
  })
})

describe('right to win and qualitative check', () => {
  it('counts ticks and needs 3 for a credible right to win', () => {
    const twoTicks = {capabilityFit: true, geographicFit: true}
    const threeTicks = {...twoTicks, economicFit: true}
    expect(rightToWinScore(undefined)).toBe(0)
    expect(rightToWinScore(twoTicks)).toBe(2)
    expect(hasCredibleRightToWin(twoTicks)).toBe(false)
    expect(hasCredibleRightToWin(threeTicks)).toBe(true)
  })

  it('treats 2 or 3 ticks as high on each axis', () => {
    const base = {
      meaningfulScale: false,
      broadAddressableOpportunity: false,
      durableGrowingOpportunity: false,
      crossBorderComplexity: false,
      breadthOfRequirements: false,
      coordinationBurden: false,
    }
    expect(qualitativeQuadrant(base)).toBe('efficient-serve')
    expect(qualitativeQuadrant({...base, meaningfulScale: true, durableGrowingOpportunity: true})).toBe(
      'attractive-exception',
    )
    expect(qualitativeQuadrant({...base, crossBorderComplexity: true, coordinationBurden: true})).toBe('selective')
    expect(
      qualitativeQuadrant({
        ...base,
        meaningfulScale: true,
        broadAddressableOpportunity: true,
        crossBorderComplexity: true,
        breadthOfRequirements: true,
      }),
    ).toBe('priority-focus')
  })
})

describe('next-best actions', () => {
  it('suggests accounting for an entity / CoSec client without it', () => {
    const actions = nextBestActions({productGroupValues: ['entity-cosec'], isIcpFit: true})
    expect(actions.map((action) => action.pattern)).toContain('Broaden from an entity / governance anchor')
  })

  it('suggests broadening a payroll-only client', () => {
    const actions = nextBestActions({productGroupValues: ['payroll'], isIcpFit: true})
    expect(actions[0].logic).toMatch(/Payroll-only/)
  })

  it('suggests the next country when Vistra serves part of a multi-product footprint', () => {
    const actions = nextBestActions({
      productGroupValues: ['entity-cosec', 'entity-accounting', 'payroll'],
      globalCountries: 12,
      vistraCountries: 4,
      isIcpFit: true,
    })
    expect(actions.map((action) => action.pattern)).toContain(
      'Expand an established multi-product relationship geographically',
    )
  })

  it('flags a high-potential single-service client outside the ICPs', () => {
    const actions = nextBestActions({
      productGroupValues: ['share-registry'],
      globalRevenue: 5_000_000_000,
      globalCountries: 20,
      isIcpFit: false,
    })
    expect(actions.map((action) => action.pattern)).toContain('Selectively develop attractive exceptions')
  })

  it('suggests nothing when no pattern applies', () => {
    expect(nextBestActions({productGroupValues: [], isIcpFit: true})).toEqual([])
  })
})
