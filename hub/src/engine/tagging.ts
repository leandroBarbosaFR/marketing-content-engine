// First-pass ICP tags proposed from campaign names (brief §8: "Tags are a first-pass proposal from
// campaign naming; change any tag here"). People confirm or change the proposal in the register.
// Rules match whole name tokens, so "fund" never matches "refund".

export interface TagProposal {
  brand: boolean
  archetype?: string
  matchedToken?: string
}

const BRAND_TOKENS = ['brand']

// Checked in order: the first archetype with a matching token wins.
const ARCHETYPE_TOKENS: [archetype: string, tokens: string[]][] = [
  ['cross-border-structuring', ['ipo', 'structuring', 'redomiciliation', 'redomicile', 'holding', 'listing']],
  ['global-consolidator', ['consolidation', 'consolidate', 'consolidator', 'switching', 'switch']],
  ['fund-investment-platform', ['fund', 'funds', 'vfs', 'spv', 'aif', 'investor']],
  ['international-scaler', ['expansion', 'entry', 'eor', 'incorporation', 'setup', 'international', 'ges']],
  ['distributed-multinational', ['payroll', 'tas', 'tax', 'accounting', 'compliance', 'ems', 'entity', 'cosec']],
]

export function campaignTokens(name: string): string[] {
  return name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

export function proposeTags(campaignName: string): TagProposal {
  const tokens = campaignTokens(campaignName)
  const brandToken = tokens.find((token) => BRAND_TOKENS.includes(token))
  if (brandToken) return {brand: true, matchedToken: brandToken}
  for (const [archetype, archetypeTokens] of ARCHETYPE_TOKENS) {
    const matchedToken = tokens.find((token) => archetypeTokens.includes(token))
    if (matchedToken) return {brand: false, archetype, matchedToken}
  }
  return {brand: false}
}
