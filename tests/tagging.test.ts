import {describe, expect, it} from 'vitest'
import {proposeTags} from '../hub/src/engine/tagging'

describe('campaign name → ICP proposal', () => {
  it.each([
    ['vgs_tas_gl_search_google_1025', 'distributed-multinational'],
    ['international-expansion-international-generic-gl-en', 'international-scaler'],
    ['vgs_ges_global_payroll_demand_gen_0625', 'international-scaler'],
    ['vgs_ems_gl_entity_management_solutions_google', 'distributed-multinational'],
    ['fund-admistration-gl-en-search-lg-go', 'fund-investment-platform'],
    ['vgs_switching_uk_search', 'global-consolidator'],
    ['preipo_hk_ipo_structuring', 'cross-border-structuring'],
  ])('%s → %s', (name, archetype) => {
    expect(proposeTags(name)).toMatchObject({brand: false, archetype})
  })

  it('treats brand campaigns as all ICPs', () => {
    expect(proposeTags('VFS Brand Always on - Search')).toEqual({brand: true, matchedToken: 'brand'})
    expect(proposeTags('brand-gl-en-search-ba-go').brand).toBe(true)
  })

  it('matches whole tokens only and proposes nothing when unsure', () => {
    expect(proposeTags('refund_policy_search').archetype).toBeUndefined()
    expect(proposeTags('generic_awareness_q4')).toEqual({brand: false})
  })
})
