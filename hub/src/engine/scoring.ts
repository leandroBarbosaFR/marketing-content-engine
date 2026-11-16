// Simon-Kucher client attractiveness scoring (brief §7; Simon-Kucher "Vistra ICP
// development", October 2026). Pure functions with no dependencies, shared by the hub's ICP
// scorer and the account sync Function, so the hub, Salesforce and Demandbase lists apply the
// same formulas.
//
//   potential  = 0.7·R + 0.3·G
//     R = 100·log(revenue / $10k) / log(10^7)       ($10k → 0, $100bn → 100)
//     G = 100·log(globalCountries) / log(100)        (1 → 0, 100 → 100)
//   complexity = 0.5·C + 0.5·P
//     C = 100·log(vistraCountries) / log(8)          (1 → 0, 8 → 100)
//     P = 100·log(productGroups) / log(10)           (1 → 0, 10 → 100)
//   each score capped to 0–100; high potential ≥ 36, high complexity ≥ 20 (natural breaks)

export const HIGH_POTENTIAL_THRESHOLD = 36
export const HIGH_COMPLEXITY_THRESHOLD = 20
export const CREDIBLE_RIGHT_TO_WIN = 3

const REVENUE_FLOOR_USD = 10_000
const REVENUE_RANGE = 1e7 // $100bn / $10k

export type AttractivenessQuadrant =
  | 'priority-focus'
  | 'selective'
  | 'attractive-exception'
  | 'efficient-serve'

export const quadrantLabels: Record<AttractivenessQuadrant, string> = {
  'priority-focus': 'Priority focus',
  selective: 'Selective / specialist',
  'attractive-exception': 'Attractive exception',
  'efficient-serve': 'Efficient serve',
}

// What each quadrant means commercially (Simon-Kucher, "commercial stance").
export const quadrantStances: Record<AttractivenessQuadrant, {stance: string; actions: string[]}> = {
  'priority-focus': {
    stance: 'Proactively invest',
    actions: [
      'Build a proactive account or pursuit plan around needs and buying triggers',
      'Coordinate senior coverage across relevant markets and services',
      'Systematically develop country and service whitespace',
    ],
  },
  selective: {
    stance: 'Pursue selectively',
    actions: [
      'Qualify the opportunity before committing significant specialist resources',
      'Focus on complex needs where Vistra has a clear capability advantage',
      'Deprioritise where economics or right to win do not justify the effort',
    ],
  },
  'attractive-exception': {
    stance: 'Pursue where economics are compelling',
    actions: [
      'Focus on the specific high-value need with a targeted proposition',
      'Keep pricing, acquisition effort and delivery economics disciplined',
      'Explore adjacent opportunities without over-investing in broad coverage',
    ],
  },
  'efficient-serve': {
    stance: 'Serve efficiently',
    actions: [
      'Standardise proposition, delivery and coverage wherever possible',
      'Respond to attractive inbound and cross-sell rather than hunting',
      'Control cost-to-serve and avoid disproportionate senior effort',
    ],
  },
}

export interface ScoringInput {
  /** Global revenue in USD. */
  globalRevenue?: number | null
  /** Countries the client operates in. */
  globalCountries?: number | null
  /** Countries Vistra serves for the client today. */
  vistraCountries?: number | null
  /** Product groups Vistra serves for the client today. */
  productGroups?: number | null
}

export interface RightToWinInput {
  capabilityFit?: boolean | null
  geographicFit?: boolean | null
  propositionFit?: boolean | null
  relationshipAccess?: boolean | null
  economicFit?: boolean | null
}

export interface AttractivenessScore {
  revenueScore: number
  globalCountriesScore: number
  vistraCountriesScore: number
  productGroupsScore: number
  potential: number
  complexity: number
  quadrant: AttractivenessQuadrant
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

// 100·log(value / floor) / log(range): 0 at the floor, 100 at floor × range, capped both ways.
function logarithmicScore(value: number | null | undefined, floor: number, range: number): number {
  if (typeof value !== 'number' || !(value > floor)) return 0
  return clampScore((100 * Math.log(value / floor)) / Math.log(range))
}

export function revenueScore(globalRevenue: number | null | undefined): number {
  return logarithmicScore(globalRevenue, REVENUE_FLOOR_USD, REVENUE_RANGE)
}

export function globalCountriesScore(globalCountries: number | null | undefined): number {
  return logarithmicScore(globalCountries, 1, 100)
}

export function vistraCountriesScore(vistraCountries: number | null | undefined): number {
  return logarithmicScore(vistraCountries, 1, 8)
}

export function productGroupsScore(productGroups: number | null | undefined): number {
  return logarithmicScore(productGroups, 1, 10)
}

export function quadrantFor(potential: number, complexity: number): AttractivenessQuadrant {
  const isHighPotential = potential >= HIGH_POTENTIAL_THRESHOLD
  const isHighComplexity = complexity >= HIGH_COMPLEXITY_THRESHOLD
  if (isHighPotential && isHighComplexity) return 'priority-focus'
  if (isHighComplexity) return 'selective'
  if (isHighPotential) return 'attractive-exception'
  return 'efficient-serve'
}

export function scoreAttractiveness(input: ScoringInput): AttractivenessScore {
  const revenue = revenueScore(input.globalRevenue)
  const globalCountries = globalCountriesScore(input.globalCountries)
  const vistraCountries = vistraCountriesScore(input.vistraCountries)
  const productGroups = productGroupsScore(input.productGroups)
  const potential = clampScore(0.7 * revenue + 0.3 * globalCountries)
  const complexity = clampScore(0.5 * vistraCountries + 0.5 * productGroups)
  return {
    revenueScore: revenue,
    globalCountriesScore: globalCountries,
    vistraCountriesScore: vistraCountries,
    productGroupsScore: productGroups,
    potential,
    complexity,
    quadrant: quadrantFor(potential, complexity),
  }
}

export function rightToWinScore(rightToWin: RightToWinInput | null | undefined): number {
  if (!rightToWin) return 0
  return [
    rightToWin.capabilityFit,
    rightToWin.geographicFit,
    rightToWin.propositionFit,
    rightToWin.relationshipAccess,
    rightToWin.economicFit,
  ].filter((tick) => tick === true).length
}

export function hasCredibleRightToWin(rightToWin: RightToWinInput | null | undefined): boolean {
  return rightToWinScore(rightToWin) >= CREDIBLE_RIGHT_TO_WIN
}

// Sales' qualitative check (Simon-Kucher, steps 2 and 3): three ticks each for potential and
// complexity; 2–3 ticks = high. Used when the numbers for the formula are not known yet.
export interface QualitativeCheck {
  meaningfulScale: boolean
  broadAddressableOpportunity: boolean
  durableGrowingOpportunity: boolean
  crossBorderComplexity: boolean
  breadthOfRequirements: boolean
  coordinationBurden: boolean
}

export function qualitativeQuadrant(check: QualitativeCheck): AttractivenessQuadrant {
  const potentialTicks = [
    check.meaningfulScale,
    check.broadAddressableOpportunity,
    check.durableGrowingOpportunity,
  ].filter(Boolean).length
  const complexityTicks = [
    check.crossBorderComplexity,
    check.breadthOfRequirements,
    check.coordinationBurden,
  ].filter(Boolean).length
  const isHighPotential = potentialTicks >= 2
  const isHighComplexity = complexityTicks >= 2
  if (isHighPotential && isHighComplexity) return 'priority-focus'
  if (isHighComplexity) return 'selective'
  if (isHighPotential) return 'attractive-exception'
  return 'efficient-serve'
}

// Next-best actions: Simon-Kucher's four starting rules, before any propensity model.
export interface NextBestActionInput extends ScoringInput {
  productGroupValues?: string[] | null
  isIcpFit: boolean
}

export interface NextBestAction {
  pattern: string
  action: string
  logic: string
}

const OPERATING_SERVICES = ['entity-accounting', 'management-accounting', 'transactions-payments']

export function nextBestActions(input: NextBestActionInput): NextBestAction[] {
  const productGroupValues = input.productGroupValues ?? []
  const has = (value: string) => productGroupValues.includes(value)
  const score = scoreAttractiveness({...input, productGroups: productGroupValues.length || input.productGroups})
  const actions: NextBestAction[] = []

  if (has('entity-cosec') && !has('entity-accounting')) {
    actions.push({
      pattern: 'Broaden from an entity / governance anchor',
      action: 'Cross-sell adjacent recurring services',
      logic: 'Entity / CoSec client without entity accounting: test the accounting need first.',
    })
  }
  if (has('payroll') && productGroupValues.length === 1) {
    actions.push({
      pattern: 'Broaden from a payroll / operating-services anchor',
      action: 'Build a broader operating-services relationship',
      logic: 'Payroll-only client: prioritise accounting or payments based on need.',
    })
  } else if (has('payroll') && !OPERATING_SERVICES.some(has)) {
    actions.push({
      pattern: 'Broaden from a payroll / operating-services anchor',
      action: 'Build a broader operating-services relationship',
      logic: 'Payroll client without accounting or payments: prioritise the one closest to the need.',
    })
  }
  const globalCountries = input.globalCountries ?? 0
  const vistraCountries = input.vistraCountries ?? 0
  if (productGroupValues.length >= 3 && globalCountries > vistraCountries) {
    actions.push({
      pattern: 'Expand an established multi-product relationship geographically',
      action: 'Prioritise additional countries where need and right to win are strongest',
      logic: `Vistra serves ${vistraCountries} of ${globalCountries} countries: identify the next priority market.`,
    })
  }
  if (!input.isIcpFit && score.potential >= HIGH_POTENTIAL_THRESHOLD && productGroupValues.length <= 1) {
    actions.push({
      pattern: 'Selectively develop attractive exceptions',
      action: 'Test targeted product expansion before broader investment',
      logic: 'High-potential single-service client outside the ICPs: test one adjacent product, invest further only if it lands.',
    })
  }
  return actions
}

export function roundScore(score: number): number {
  return Math.round(score)
}
