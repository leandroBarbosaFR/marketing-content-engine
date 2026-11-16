// Synthetic seed for both datasets (brief §5). Everything is fictional ("Acme" companies, made-up
// numbers); it has the brief's shape, not its data. Amounts are GBP, July to October 2026.
//
// It reproduces the patterns the brief describes so every screen has something to show: spend
// concentrated on one ICP, two ICPs effectively unfunded, a third of spend on brand search, gaps in
// the coverage grid, an expired proof point still live, one review overdue, JP and CN variants,
// and a month where leads rise while MQLs fall.
import {rightToWinScore, scoreAttractiveness} from '../hub/src/engine/scoring.ts'
import type {GtmDocument, Ref, WebsiteDocument} from '../hub/src/engine/types.ts'

export interface Seed {
  website: WebsiteDocument[]
  gtm: GtmDocument[]
}

export const SEED_MONTHS = ['2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01']

// Deterministic random numbers, so the seed and the tests never drift.
function createRandom(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function generateSeed({projectId, websiteDataset}: {projectId: string; websiteDataset: string}): Seed {
  const random = createRandom(1367)
  const between = (low: number, high: number) => low + (high - low) * random()
  const ref = (id: string, key?: string): Ref => ({_type: 'reference', _ref: id, ...(key ? {_key: key} : {})})
  const refs = (ids: string[]) => ids.map((id, index) => ref(id, `r${index}`))
  // Cross-dataset reference from gtm-brain into vistra.com (same project).
  const cdr = (id: string, key?: string): Ref => ({
    _type: 'crossDatasetReference',
    _ref: id,
    _dataset: websiteDataset,
    _projectId: projectId,
    _weak: true,
    ...(key ? {_key: key} : {}),
  })
  const cdrs = (ids: string[]) => ids.map((id, index) => cdr(id, `x${index}`))
  const keyed = <T extends object>(items: T[], prefix: string) => items.map((item, index) => ({_key: `${prefix}${index}`, ...item}))

  // ------------------------------------------------------------ vistra.com dataset

  const ICP = {
    scaler: 'icp-international-scaler',
    multinational: 'icp-distributed-multinational',
    consolidator: 'icp-global-consolidator',
    structuring: 'icp-cross-border-structuring',
    fund: 'icp-fund-investment-platform',
  }
  const icps: WebsiteDocument[] = [
    {
      _id: ICP.scaler,
      _type: 'icp',
      order: 1,
      title: 'International Scaler',
      archetype: 'international-scaler',
      situation: 'Enter and establish operations in new international markets',
      need: 'Get set up and compliant in a new country fast, without building a local team (synthetic).',
      clientPhrase: 'Help us open the next country without hiring a team there',
      triggers: ['Funding round closed', 'First hire abroad', 'New market announced'],
      pathway: ['Pre-entry advice', 'Entity set-up', 'Payroll and HR', 'Accounting and tax', 'Ongoing entity management'],
    },
    {
      _id: ICP.multinational,
      _type: 'icp',
      order: 2,
      title: 'Distributed Multinational',
      archetype: 'distributed-multinational',
      situation: 'Run recurring requirements across an established multi-country footprint',
      need: 'Reliable payroll, accounting and filings in many small country operations (synthetic).',
      clientPhrase: 'Help us run lots of small countries the same way',
      triggers: ['Provider contract renewal', 'Missed filing or penalty', 'New group CFO'],
      pathway: ['Payroll, entity or accounting entry point', 'More countries and services', 'Integrated ongoing support'],
    },
    {
      _id: ICP.consolidator,
      _type: 'icp',
      order: 3,
      title: 'Global Consolidator',
      archetype: 'global-consolidator',
      situation: 'Simplify fragmented providers, entities or processes across countries',
      need: 'Fewer providers, fewer entities, one view of obligations (synthetic).',
      clientPhrase: 'Help us simplify our international set-up',
      triggers: ['Post-merger integration', 'Cost programme launched', 'Audit finding on entity governance'],
      pathway: ['Provider and entity review', 'Entity rationalisation', 'Consolidated payroll, tax and accounting'],
    },
    {
      _id: ICP.structuring,
      _type: 'icp',
      order: 4,
      title: 'Cross-border Corporate Structuring',
      archetype: 'cross-border-structuring',
      situation: 'Structure the business for an IPO, transaction, ownership or tax objective',
      need: 'The right holding and governance set-up across jurisdictions for a deal (synthetic).',
      clientPhrase: 'Help us structure the group for the deal',
      triggers: ['Pre-IPO timetable set', 'Re-domiciliation decided', 'Holding restructure planned'],
      pathway: ['Structuring assessment', 'Entity set-up or restructuring', 'Governance support', 'Ongoing compliance'],
    },
    {
      _id: ICP.fund,
      _type: 'icp',
      order: 5,
      title: 'Fund / Investment Platform',
      archetype: 'fund-investment-platform',
      situation: 'Operate and administer multiple funds, SPVs or investment structures',
      need: 'Administration and reporting that scale with each new fund (synthetic).',
      clientPhrase: 'Help us launch and run funds without growing the back office',
      triggers: ['New fund launch', 'First close', 'Change of administrator'],
      pathway: ['Fund set-up', 'Fund and SPV administration', 'Regulatory support', 'Lifecycle administration'],
    },
  ]

  const SOL = {
    entry: 'solution-market-entry',
    payroll: 'solution-payroll',
    entity: 'solution-entity-management',
    tax: 'solution-tax-accounting',
    fund: 'solution-fund-admin',
  }
  const PP = {
    onboarding: 'proof-onboarding-days',
    accuracy: 'proof-payroll-accuracy',
    countries: 'proof-countries',
    consolidation: 'proof-consolidation-case',
    fundQuote: 'proof-fund-quote',
    friction: 'proof-friction-index',
    listing: 'proof-listing-case',
    japan: 'proof-japan-filings',
  }
  const MKT = {global: 'market-global', uk: 'market-uk', nl: 'market-nl', sg: 'market-sg', hk: 'market-hk', jp: 'market-jp', cn: 'market-cn', us: 'market-us'}

  const solutions: WebsiteDocument[] = [
    {_id: SOL.entry, _type: 'solution', title: 'Market entry', businessUnit: 'vgs', valueProposition: 'Open a new country in weeks with one partner (synthetic).', proofPoints: refs([PP.onboarding, PP.countries]), pricingGuidance: 'Synthetic: fixed set-up fee per country.'},
    {_id: SOL.payroll, _type: 'solution', title: 'Payroll', businessUnit: 'vgs', valueProposition: 'Accurate payroll in every country from one team (synthetic).', proofPoints: refs([PP.accuracy, PP.japan]), pricingGuidance: 'Synthetic: per employee per month.'},
    {_id: SOL.entity, _type: 'solution', title: 'Entity management', businessUnit: 'vgs', valueProposition: 'Every entity compliant and visible in one place (synthetic).', proofPoints: refs([PP.consolidation, PP.listing]), pricingGuidance: 'Synthetic: per entity per year.'},
    {_id: SOL.tax, _type: 'solution', title: 'Tax & accounting', businessUnit: 'vgs', valueProposition: 'Local books and filings to one standard (synthetic).', proofPoints: refs([PP.countries]), pricingGuidance: 'Synthetic: per entity per year.'},
    {_id: SOL.fund, _type: 'solution', title: 'Fund admin', businessUnit: 'vfs', valueProposition: 'Fund accounting and investor services that scale with the platform (synthetic).', proofPoints: refs([PP.fundQuote, PP.friction]), pricingGuidance: 'Synthetic: basis points on AUM with a minimum.'},
  ]

  const proofPoints: WebsiteDocument[] = [
    {_id: PP.onboarding, _type: 'proofPoint', title: 'Onboarding in 9 business days', kind: 'stat', statement: 'Clients are onboarded in 9 business days on average (synthetic).', source: 'Synthetic operations report 2026', expiresAt: '2027-06-30'},
    {_id: PP.accuracy, _type: 'proofPoint', title: '99.7% payroll accuracy', kind: 'stat', statement: '99.7% of payroll runs are right first time (synthetic).', source: 'Synthetic payroll QA 2026', expiresAt: '2027-03-31'},
    {_id: PP.countries, _type: 'proofPoint', title: 'Support in 40 countries', kind: 'stat', statement: 'Entity, payroll and accounting support in 40 countries (synthetic).', source: 'Synthetic coverage list', expiresAt: '2027-12-31'},
    {_id: PP.consolidation, _type: 'proofPoint', title: '14 providers to 1', kind: 'case-study', statement: 'A synthetic group moved 14 local providers to one and closed 9 dormant entities.', source: 'Synthetic case study', expiresAt: '2027-09-30', allowedMarkets: refs([MKT.uk, MKT.nl])},
    {_id: PP.fundQuote, _type: 'proofPoint', title: 'Second fund ahead of plan', kind: 'quote', statement: '"Our second fund was operational three weeks early." COO, synthetic fund manager', source: 'Synthetic client interview', expiresAt: '2027-02-28', allowedMarkets: refs([MKT.us, MKT.uk])},
    {_id: PP.friction, _type: 'proofPoint', title: 'Friction Index 2025', kind: 'stat', statement: 'Synthetic index of fund operations friction, 2025 edition.', source: 'Synthetic research 2025', expiresAt: '2026-09-30'},
    {_id: PP.listing, _type: 'proofPoint', title: 'Pre-listing structure case', kind: 'case-study', statement: 'A synthetic tech group set up its holding structure ahead of a listing.', source: 'Synthetic case study', expiresAt: '2027-05-31', allowedMarkets: refs([MKT.hk, MKT.cn])},
    {_id: PP.japan, _type: 'proofPoint', title: 'Japan filings on time', kind: 'stat', statement: 'Every synthetic Japan payroll filing in 2026 was on time.', source: 'Synthetic Japan team', expiresAt: '2027-04-30', allowedMarkets: refs([MKT.jp])},
  ]

  const markets: WebsiteDocument[] = [
    {_id: MKT.global, _type: 'market', title: 'Global', kind: 'region', languages: ['en'], priorityIcps: refs(Object.values(ICP))},
    {_id: MKT.uk, _type: 'market', title: 'United Kingdom', kind: 'country', countryCode: 'GB', languages: ['en'], regulations: keyed([{name: 'ECCTA', summary: 'Identity verification for directors changes incorporation timelines (synthetic note).'}], 'g'), priorityIcps: refs([ICP.consolidator, ICP.scaler]), localProof: refs([PP.consolidation])},
    {_id: MKT.nl, _type: 'market', title: 'Netherlands', kind: 'country', countryCode: 'NL', languages: ['en', 'nl'], priorityIcps: refs([ICP.multinational, ICP.fund]), localProof: refs([PP.consolidation])},
    {_id: MKT.sg, _type: 'market', title: 'Singapore', kind: 'country', countryCode: 'SG', languages: ['en'], priorityIcps: refs([ICP.scaler, ICP.multinational])},
    {_id: MKT.hk, _type: 'market', title: 'Hong Kong', kind: 'country', countryCode: 'HK', languages: ['en', 'zh-hant'], priorityIcps: refs([ICP.structuring, ICP.scaler]), localProof: refs([PP.listing])},
    {_id: MKT.jp, _type: 'market', title: 'Japan', kind: 'country', countryCode: 'JP', languages: ['ja'], priorityIcps: refs([ICP.multinational]), localProof: refs([PP.japan])},
    {_id: MKT.cn, _type: 'market', title: 'Mainland China', kind: 'country', countryCode: 'CN', languages: ['zh-hans'], priorityIcps: refs([ICP.structuring]), localProof: refs([PP.listing])},
    {_id: MKT.us, _type: 'market', title: 'United States', kind: 'country', countryCode: 'US', languages: ['en'], priorityIcps: refs([ICP.fund, ICP.scaler]), localProof: refs([PP.fundQuote])},
  ]

  // Topics: pillars and clusters. Target queries are generic phrases.
  const T = (key: string) => `topic-${key}`
  const pillars: [string, string, string][] = [
    ['formation', 'Company formation', SOL.entry],
    ['payroll', 'Global payroll', SOL.payroll],
    ['entity', 'Entity management', SOL.entity],
    ['funds', 'Fund services', SOL.fund],
    ['structuring', 'Corporate structuring', SOL.entity],
  ]
  const clusters: [key: string, title: string, pillar: string, queries: string[], icp: string, stage: string][] = [
    ['company-types', 'Company types', 'formation', ['unlimited company', 'public limited company', 'stichting'], ICP.scaler, 'aware'],
    ['expansion-guides', 'Expansion guides by country', 'formation', ['set up company in singapore', 'expand to netherlands'], ICP.scaler, 'aware'],
    ['entity-vs-eor', 'Entity or employer of record', 'formation', ['entity vs eor', 'employer of record'], ICP.scaler, 'consider'],
    ['payroll-by-country', 'Payroll by country', 'payroll', ['global payroll', 'payroll in japan'], ICP.multinational, 'consider'],
    ['compliance-calendar', 'Multi-country compliance', 'entity', ['statutory filing deadlines', 'compliance calendar'], ICP.multinational, 'aware'],
    ['management-accounting', 'Management accounting', 'entity', ['management accounting services'], ICP.multinational, 'consider'],
    ['provider-consolidation', 'Provider consolidation', 'entity', ['consolidate corporate service providers'], ICP.consolidator, 'aware'],
    ['entity-governance', 'Entity governance', 'entity', ['entity management', 'process agent'], ICP.consolidator, 'consider'],
    ['offshore-companies', 'Offshore companies', 'structuring', ['bvi company', 'bvi company formation'], ICP.structuring, 'aware'],
    ['pre-ipo', 'Pre-IPO structuring', 'structuring', ['pre ipo structuring', 'holding company structure'], ICP.structuring, 'consider'],
    ['fund-launch', 'Fund launch', 'funds', ['fund launch timeline', 'launch a fund'], ICP.fund, 'aware'],
    ['fund-accounting', 'Fund accounting', 'funds', ['fund accounting', 'fund administration outsourcing'], ICP.fund, 'consider'],
  ]
  const topics: WebsiteDocument[] = [
    ...pillars.map(([key, title, solution]) => ({_id: T(`pillar-${key}`), _type: 'topic' as const, title, kind: 'pillar' as const, solution: ref(solution)})),
    ...clusters.map(([key, title, pillar, targetQueries, icp, stage]) => ({
      _id: T(key),
      _type: 'topic' as const,
      title,
      kind: 'cluster' as const,
      parent: ref(T(`pillar-${pillar}`)),
      targetQueries,
      icp: ref(icp),
      solution: ref(pillars.find((entry) => entry[0] === pillar)![2]),
      stage,
    })),
  ]

  // Content pieces. Left empty on purpose: Global Consolidator consider/decide, Cross-border
  // Structuring consider/decide (briefed or in progress), Fund decide (in review).
  type PieceSpec = [key: string, title: string, format: string, status: string, icp: string, stage: string, topic: string, solution: string, market: string, date: string, proofs: string[], extra?: Partial<Record<string, unknown>>]
  const C = (key: string) => `content-${key}`
  const pieceSpecs: PieceSpec[] = [
    ['expansion-sg', 'Expanding to Singapore: the guide', 'guide', 'published', ICP.scaler, 'aware', 'expansion-guides', SOL.entry, MKT.sg, '2026-05-12', [PP.onboarding, PP.countries]],
    ['expansion-nl', 'Expanding to the Netherlands: the guide', 'guide', 'published', ICP.scaler, 'aware', 'expansion-guides', SOL.entry, MKT.nl, '2026-08-20', [PP.onboarding]],
    ['company-types', 'Unlimited or public limited: which company?', 'article', 'published', ICP.scaler, 'aware', 'company-types', SOL.entry, MKT.uk, '2026-01-14', []],
    ['entity-vs-eor', 'Entity vs EOR comparison tool', 'tool', 'published', ICP.scaler, 'consider', 'entity-vs-eor', SOL.payroll, MKT.global, '2026-06-03', [PP.countries]],
    ['market-entry-cases', 'Market-entry case studies', 'case-study', 'published', ICP.scaler, 'decide', 'expansion-guides', SOL.entry, MKT.global, '2026-09-02', [PP.onboarding]],
    ['compliance-calendar', 'Multi-country compliance calendar', 'tool', 'published', ICP.multinational, 'aware', 'compliance-calendar', SOL.tax, MKT.global, '2026-04-22', [PP.countries]],
    ['payroll-buyers-guide', "Global payroll buyer's guide", 'guide', 'published', ICP.multinational, 'consider', 'payroll-by-country', SOL.payroll, MKT.global, '2026-07-01', [PP.accuracy]],
    ['payroll-buyers-guide-ja', 'グローバル給与 購入ガイド', 'guide', 'published', ICP.multinational, 'consider', 'payroll-by-country', SOL.payroll, MKT.jp, '2026-09-15', [PP.japan], {language: 'ja', variantOf: C('payroll-buyers-guide'), variantKind: 'language'}],
    ['payroll-buyers-guide-zh', '全球薪资 采购指南', 'guide', 'localising', ICP.multinational, 'consider', 'payroll-by-country', SOL.payroll, MKT.cn, '2026-11-30', [PP.accuracy], {language: 'zh-hans', variantOf: C('payroll-buyers-guide'), variantKind: 'language'}],
    ['management-accounting', 'Management accounting, explained', 'article', 'published', ICP.multinational, 'consider', 'management-accounting', SOL.tax, MKT.global, '2026-03-10', []],
    ['payroll-accounting-cases', 'Payroll and accounting case studies', 'case-study', 'published', ICP.multinational, 'decide', 'payroll-by-country', SOL.payroll, MKT.global, '2026-06-18', [PP.accuracy]],
    ['fragmented-providers', 'The cost of fragmented providers', 'guide', 'published', ICP.consolidator, 'aware', 'provider-consolidation', SOL.entity, MKT.uk, '2026-03-18', [PP.consolidation]],
    ['process-agent', 'What does a process agent do?', 'article', 'refresh', ICP.consolidator, 'aware', 'entity-governance', SOL.entity, MKT.global, '2025-07-09', []],
    ['consolidation-playbook', 'Provider consolidation playbook', 'guide', 'drafting', ICP.consolidator, 'consider', 'provider-consolidation', SOL.entity, MKT.uk, '2026-12-15', [PP.consolidation]],
    ['pre-ipo-checklist', 'Pre-IPO structuring checklist', 'tool', 'published', ICP.structuring, 'aware', 'pre-ipo', SOL.entity, MKT.hk, '2026-08-05', [PP.listing]],
    ['bvi-company', 'What is a BVI company?', 'article', 'published', ICP.structuring, 'aware', 'offshore-companies', SOL.entity, MKT.global, '2025-11-02', []],
    ['holding-options', 'Holding structure options by jurisdiction', 'tool', 'briefed', ICP.structuring, 'consider', 'pre-ipo', SOL.entity, MKT.hk, '2027-01-25', []],
    ['fund-launch-timeline', 'Fund launch timeline', 'tool', 'published', ICP.fund, 'aware', 'fund-launch', SOL.fund, MKT.us, '2026-06-20', [PP.fundQuote]],
    ['fund-admin-outsourcing', 'Fund admin outsourcing guide', 'guide', 'published', ICP.fund, 'consider', 'fund-accounting', SOL.fund, MKT.global, '2026-02-10', [PP.friction]],
    ['fund-services-proof', 'Fund services proof: emerging manager case', 'case-study', 'review', ICP.fund, 'decide', 'fund-launch', SOL.fund, MKT.us, '2026-11-24', [PP.fundQuote]],
  ]
  const isLive = (status: string) => status === 'published' || status === 'refresh'
  const pieces: WebsiteDocument[] = pieceSpecs.map(([key, title, format, status, icp, stage, topic, solution, market, date, proofs, extra], index) => {
    const live = isLive(status)
    const language = (extra?.language as string | undefined) ?? 'en'
    const reviewYear = Number(date.slice(0, 4)) + 1
    return {
      _id: C(key),
      _type: 'contentPiece' as const,
      title,
      format,
      status,
      topic: ref(T(topic)),
      icp: ref(icp),
      solution: ref(solution),
      market: ref(market),
      stage,
      owner: `Writer ${String.fromCharCode(65 + (index % 6))} (synthetic)`,
      reviewDate: `${reviewYear}${date.slice(4)}`,
      ...(live ? {publishedAt: date, url: `https://example.com/${language}/${key}`} : {plannedDate: date}),
      summary: `Synthetic two-sentence answer for "${title}". Written to be quoted by AI assistants.`,
      sections: keyed(
        [`What is ${topic.replaceAll('-', ' ')}?`, 'How long does it take and what does it cost?', 'How does Vistra help?'].map((heading, sectionIndex) => ({
          _type: 'section',
          heading,
          body: [{_type: 'block', _key: `b${sectionIndex}`, style: 'normal', markDefs: [], children: [{_type: 'span', _key: `s${sectionIndex}`, text: 'Synthetic body text.', marks: []}]}],
        })),
        's',
      ),
      faqs: keyed([{question: `A common question about ${topic.replaceAll('-', ' ')}?`, answer: 'A short synthetic answer that stands on its own.'}], 'f'),
      proofPoints: refs(proofs),
      conversion:
        format === 'guide' || format === 'tool'
          ? {ctaLabel: `Get the ${format}`, hubspotFormId: `${(0x5e000000 + index).toString(16)}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`}
          : {ctaLabel: 'Talk to us'},
      language,
      ...(extra?.variantOf ? {variantOf: ref(extra.variantOf as string), variantKind: extra.variantKind as string} : {}),
    }
  })

  // ------------------------------------------------------------ gtm-brain dataset

  const PLAN = 'plan-fy27'
  const plan: GtmDocument = {
    _id: PLAN,
    _type: 'plan',
    title: 'FY27 marketing plan (synthetic)',
    fiscalYear: 'FY27',
    goals: keyed(
      [
        {metric: 'mqls', value: 7200},
        {metric: 'pipeline', value: 24000000},
        {metric: 'non-brand-clicks', value: 15000},
        {metric: 'ai-assistant-mqls', value: 600},
        {metric: 'icp-spend-share', value: 85},
      ],
      'g',
    ),
    budgets: keyed([{businessUnit: 'vgs', amount: 380000}, {businessUnit: 'vfs', amount: 140000}], 'b'),
  }

  const MP = (key: string) => `pillar-${key}`
  const pillarSpecs: [string, string, string, string | null, string, [string, string][], [string, string][]][] = [
    ['scaler-entry', ICP.scaler, SOL.entry, null, 'Open your next country in weeks, with one partner for entity, payroll and filings.', [['Onboarding in 9 business days on average', PP.onboarding]], [['Guaranteed regulator approval', 'Outcomes depend on authorities']]],
    ['scaler-payroll', ICP.scaler, SOL.payroll, null, 'Pay your first hires abroad correctly from day one.', [['99.7% of payroll runs right first time', PP.accuracy]], [['Cheapest payroll provider', 'No comparison data']]],
    ['multinational-payroll', ICP.multinational, SOL.payroll, MKT.jp, 'One payroll standard across every small country team.', [['Japan filings on time in 2026', PP.japan]], []],
    ['multinational-tax', ICP.multinational, SOL.tax, null, 'Local books and filings to one standard, with one view.', [['Support in 40 countries', PP.countries]], [['Zero penalties', 'Cannot be guaranteed']]],
    ['consolidator-entity', ICP.consolidator, SOL.entity, MKT.uk, 'Fewer providers, fewer entities, one view of obligations.', [['14 providers consolidated to 1', PP.consolidation]], []],
    ['structuring-entity', ICP.structuring, SOL.entity, MKT.hk, 'The right holding structure before the deal timetable starts.', [['Pre-listing structure delivered', PP.listing]], [['Tax savings guaranteed', 'Advice depends on facts']]],
    ['fund-admin', ICP.fund, SOL.fund, null, 'Launch and run funds without adding back-office headcount.', [['Second fund operational early', PP.fundQuote]], [['Fastest administrator in the market', 'Unsupported superlative']]],
  ]
  const messagingPillars: GtmDocument[] = pillarSpecs.map(([key, icp, solution, market, coreMessage, approved, banned]) => ({
    _id: MP(key),
    _type: 'messagingPillar',
    title: `${icps.find((entry) => entry._id === icp)!.title} × ${solutions.find((entry) => entry._id === solution)!.title}`,
    icp: cdr(icp),
    solution: cdr(solution),
    ...(market ? {market: cdr(market)} : {}),
    coreMessage,
    approvedClaims: keyed(approved.map(([claim, proof]) => ({claim, proofPoint: cdr(proof)})), 'a'),
    bannedClaims: keyed(banned.map(([claim, reason]) => ({claim, reason})), 'n'),
  }))

  const PR = (key: string) => `programme-${key}`
  const programmeSpecs: [string, string, string, string, string[], string[], number, number, number][] = [
    ['vgs-scaler-global', 'vgs', ICP.scaler, MKT.global, [SOL.entry, SOL.payroll], ['scaler-entry', 'scaler-payroll'], 110000, 1800, 6000000],
    ['vgs-multinational-global', 'vgs', ICP.multinational, MKT.global, [SOL.payroll, SOL.tax], ['multinational-payroll', 'multinational-tax'], 140000, 2600, 8000000],
    ['vgs-consolidator-uk', 'vgs', ICP.consolidator, MKT.uk, [SOL.entity], ['consolidator-entity'], 60000, 500, 3500000],
    ['vgs-structuring-hk', 'vgs', ICP.structuring, MKT.hk, [SOL.entity], ['structuring-entity'], 50000, 300, 3000000],
    ['vfs-fund-us', 'vfs', ICP.fund, MKT.us, [SOL.fund], ['fund-admin'], 90000, 900, 3500000],
  ]
  const programmes: GtmDocument[] = programmeSpecs.map(([key, businessUnit, icp, market, solutionIds, pillarKeys, budget, mqls, pipeline], index) => ({
    _id: PR(key),
    _type: 'programme',
    title: `${businessUnit.toUpperCase()} · ${icps.find((entry) => entry._id === icp)!.title} · ${markets.find((entry) => entry._id === market)!.title}`,
    plan: ref(PLAN),
    businessUnit,
    icp: cdr(icp),
    market: cdr(market),
    solutions: cdrs(solutionIds),
    messaging: refs(pillarKeys.map(MP)),
    budget,
    targets: keyed([{metric: 'mqls', value: mqls}, {metric: 'pipeline', value: pipeline}], 't'),
    owner: `Programme lead ${String.fromCharCode(65 + index)} (synthetic)`,
  }))

  const competitors: GtmDocument[] = [
    {_id: 'competitor-northwind', _type: 'competitor', title: 'Northwind Corporate (synthetic)', positioning: 'Low-cost incorporation in a few hubs.', pricingSignals: 'Entry price below ours; extra fees per filing.', winThemes: ['Breadth of countries', 'One team across services'], lossThemes: ['Headline price']},
    {_id: 'competitor-globex', _type: 'competitor', title: 'Globex Payroll (synthetic)', positioning: 'Payroll software with a partner network.', pricingSignals: 'Per employee; partner fees on top.', winThemes: ['Local filing accuracy', 'Accounting in the same team'], lossThemes: ['Self-service software']},
    {_id: 'competitor-initech', _type: 'competitor', title: 'Initech Fund Services (synthetic)', positioning: 'Fund administration for large managers.', pricingSignals: 'Minimum fees above emerging-manager budgets.', winThemes: ['Emerging-manager focus'], lossThemes: ['Brand with large LPs']},
  ]

  const briefs: GtmDocument[] = [
    {_id: 'brief-consolidation-playbook', _type: 'brief', title: 'Provider consolidation playbook', topic: cdr(T('provider-consolidation')), icp: cdr(ICP.consolidator), stage: 'consider', messagingPillar: ref(MP('consolidator-entity')), proofPoints: cdrs([PP.consolidation]), format: 'guide', deadline: '2026-12-10', status: 'in-progress', owner: 'Writer B (synthetic)', deliverable: cdr(C('consolidation-playbook'))},
    {_id: 'brief-switching-proof', _type: 'brief', title: 'Switching proof and ROI', topic: cdr(T('provider-consolidation')), icp: cdr(ICP.consolidator), stage: 'decide', messagingPillar: ref(MP('consolidator-entity')), proofPoints: cdrs([PP.consolidation]), format: 'case-study', deadline: '2027-01-20', status: 'requested', owner: 'Writer C (synthetic)'},
    {_id: 'brief-holding-options', _type: 'brief', title: 'Holding structure options by jurisdiction', topic: cdr(T('pre-ipo')), icp: cdr(ICP.structuring), stage: 'consider', messagingPillar: ref(MP('structuring-entity')), format: 'tool', deadline: '2027-01-15', status: 'in-progress', owner: 'Writer D (synthetic)', deliverable: cdr(C('holding-options'))},
    {_id: 'brief-ipo-cases', _type: 'brief', title: 'IPO and re-domiciliation cases', topic: cdr(T('pre-ipo')), icp: cdr(ICP.structuring), stage: 'decide', proofPoints: cdrs([PP.listing]), format: 'case-study', deadline: '2027-02-01', status: 'requested'},
  ]

  // Campaigns: names follow a typical ad-platform convention, all fictional. Monthly spend is
  // budget-driven; the ICP mix mirrors the brief's pattern without its numbers.
  type CampaignSpec = [key: string, name: string, icp: string | null, brand: boolean, solution: string | null, market: string, channel: 'google-ads' | 'linkedin-ads', monthly: number, stage: string, programme: string | null, topic: string | null, pieces: string[], activeMonths?: number[]]
  const campaignSpecs: CampaignSpec[] = [
    ['mn-tas-search', 'syn_vgs_tas_gl_search_google', ICP.multinational, false, SOL.tax, MKT.global, 'google-ads', 4300, 'live', PR('vgs-multinational-global'), 'compliance-calendar', ['compliance-calendar']],
    ['mn-payroll-search', 'syn_vgs_payroll_gl_search_google', ICP.multinational, false, SOL.payroll, MKT.global, 'google-ads', 3100, 'live', PR('vgs-multinational-global'), 'payroll-by-country', ['payroll-buyers-guide']],
    ['mn-ems-search', 'syn_vgs_ems_gl_entity_google', ICP.multinational, false, SOL.entity, MKT.global, 'google-ads', 1500, 'live', PR('vgs-multinational-global'), 'management-accounting', ['management-accounting']],
    ['mn-payroll-li', 'syn_vgs_payroll_gl_linkedin_cfo', ICP.multinational, false, SOL.payroll, MKT.global, 'linkedin-ads', 1700, 'live', PR('vgs-multinational-global'), 'payroll-by-country', ['payroll-buyers-guide', 'payroll-accounting-cases']],
    ['mn-payroll-jp', 'syn_vgs_payroll_jp_search_google', ICP.multinational, false, SOL.payroll, MKT.jp, 'google-ads', 900, 'live', PR('vgs-multinational-global'), 'payroll-by-country', ['payroll-buyers-guide-ja'], [2, 3]],
    ['mn-accounting-li', 'syn_vgs_accounting_emea_linkedin', ICP.multinational, false, SOL.tax, MKT.nl, 'linkedin-ads', 800, 'paused', PR('vgs-multinational-global'), 'management-accounting', [], [0, 1]],
    ['is-expansion-search', 'syn_international_expansion_gl_search_google', ICP.scaler, false, SOL.entry, MKT.global, 'google-ads', 2600, 'live', PR('vgs-scaler-global'), 'expansion-guides', ['expansion-sg', 'expansion-nl']],
    ['is-ges-payroll', 'syn_vgs_ges_gl_payroll_demand_gen', ICP.scaler, false, SOL.payroll, MKT.global, 'google-ads', 1600, 'live', PR('vgs-scaler-global'), 'entity-vs-eor', ['entity-vs-eor']],
    ['is-eor-li', 'syn_vgs_eor_gl_linkedin_founders', ICP.scaler, false, SOL.payroll, MKT.global, 'linkedin-ads', 900, 'live', PR('vgs-scaler-global'), 'entity-vs-eor', ['entity-vs-eor', 'market-entry-cases']],
    ['is-sg-search', 'syn_vgs_entry_sg_search_google', ICP.scaler, false, SOL.entry, MKT.sg, 'google-ads', 500, 'ended', PR('vgs-scaler-global'), 'expansion-guides', ['expansion-sg'], [0, 1]],
    ['gc-switching', 'syn_vgs_switching_uk_search_google', ICP.consolidator, false, SOL.entity, MKT.uk, 'google-ads', 33, 'paused', PR('vgs-consolidator-uk'), 'provider-consolidation', ['fragmented-providers'], [0]],
    ['gc-switching-li', 'syn_vgs_consolidation_uk_linkedin', ICP.consolidator, false, SOL.entity, MKT.uk, 'linkedin-ads', 33, 'paused', PR('vgs-consolidator-uk'), 'provider-consolidation', [], [0]],
    ['fi-admin-search', 'syn_vfs_fund_admin_gl_search_google', ICP.fund, false, SOL.fund, MKT.global, 'google-ads', 700, 'live', PR('vfs-fund-us'), 'fund-accounting', ['fund-admin-outsourcing'], [0, 1, 2]],
    ['fi-launch-li', 'syn_vfs_fund_launch_us_linkedin', ICP.fund, false, SOL.fund, MKT.us, 'linkedin-ads', 400, 'live', PR('vfs-fund-us'), 'fund-launch', ['fund-launch-timeline']],
    ['brand-gl', 'syn_brand_gl_en_search_google', null, true, null, MKT.global, 'google-ads', 3600, 'live', null, null, []],
    ['brand-vfs', 'syn_vfs_brand_always_on_search', null, true, null, MKT.global, 'google-ads', 2900, 'live', null, null, []],
    ['brand-vgs', 'syn_vgs_brand_search_campaign', null, true, null, MKT.global, 'google-ads', 1200, 'live', null, null, []],
    ['brand-li', 'syn_brand_gl_linkedin_awareness', null, true, null, MKT.global, 'linkedin-ads', 900, 'live', null, null, []],
    // Untagged: the register proposes an ICP from the name.
    ['untagged-payroll-apac', 'syn_vgs_payroll_apac_search_google', null, false, SOL.payroll, MKT.sg, 'google-ads', 450, 'live', null, null, []],
    ['untagged-fund-li', 'syn_vfs_fund_managers_emea_linkedin', null, false, SOL.fund, MKT.nl, 'linkedin-ads', 300, 'live', null, null, [], [2, 3]],
    // Planned for FY27: no spend yet.
    ['cb-preipo-planned', 'syn_vgs_preipo_hk_linkedin', ICP.structuring, false, SOL.entity, MKT.hk, 'linkedin-ads', 0, 'planned', PR('vgs-structuring-hk'), 'pre-ipo', ['pre-ipo-checklist']],
  ]
  const tacticKinds = ['ad', 'landing-page', 'email', 'abm-play', 'sales-kit', 'social']
  const campaigns: GtmDocument[] = campaignSpecs.map(([key, name, icp, brand, solution, market, channel, monthly, stage, programme, topic, pieceKeys]) => ({
    _id: `campaign-${key}`,
    _type: 'campaign',
    title: name,
    ...(programme ? {programme: ref(programme)} : {}),
    brand,
    ...(icp ? {icp: cdr(icp)} : {}),
    ...(solution ? {solution: cdr(solution)} : {}),
    market: cdr(market),
    ...(topic ? {topic: cdr(T(topic))} : {}),
    channels: [channel],
    budget: Math.round(monthly * 6),
    startDate: stage === 'planned' ? '2027-01-15' : '2026-07-01',
    endDate: stage === 'ended' ? '2026-08-31' : '2027-06-30',
    stage,
    owner: 'Campaign lead (synthetic)',
    contentUsed: cdrs(pieceKeys.map(C)),
    tactics: keyed(
      pieceKeys.flatMap((pieceKey, pieceIndex) =>
        tacticKinds.slice(0, 2 + ((pieceIndex + key.length) % 3)).map((kind) => ({kind, name: `${kind.replace('-', ' ')}: ${pieceKey.replaceAll('-', ' ')}`, asset: cdr(C(pieceKey))})),
      ),
      't',
    ),
    utm: name.replaceAll(/[^a-z0-9_-]/g, ''),
    hubspotCampaignId: `syn-${1000 + campaignSpecs.findIndex((spec) => spec[0] === key)}`,
  }))

  // ------------------------------------------------------------ monthly snapshots

  const snapshots: GtmDocument[] = []
  const tagsFrom = (icp?: string | null, solution?: string | null, market?: string | null, topic?: string | null) => ({
    ...(icp ? {icp: cdr(icp)} : {}),
    ...(solution ? {solution: cdr(solution)} : {}),
    ...(market ? {market: cdr(market)} : {}),
    ...(topic ? {topic: cdr(topic)} : {}),
  })
  const snapshotId = (month: string, subjectType: string, subjectId: string) => `snapshot-${month.slice(0, 7)}-${subjectType}-${subjectId}`
  const syncedAt = (month: string) => `${month.slice(0, 8)}28T02:00:00Z`

  // Campaigns: spend, clicks, impressions, leads, MQLs.
  const seasonal = [0.75, 1.15, 1.35, 0.95]
  const campaignMetrics = new Map<string, {month: string; spend: number; leads: number; mqls: number; icp: string | null}>()
  campaignSpecs.forEach(([key, , icp, brand, solution, market, channel, monthly, stage, , topic, , activeMonths]) => {
    if (stage === 'planned') return
    SEED_MONTHS.forEach((month, monthIndex) => {
      if (activeMonths && !activeMonths.includes(monthIndex)) return
      const spend = Math.round(monthly * seasonal[monthIndex] * between(0.85, 1.15))
      const cpc = channel === 'linkedin-ads' ? between(7, 11) : brand ? between(0.6, 1.2) : between(4, 9)
      const clicks = Math.max(1, Math.round(spend / cpc))
      const leads = Math.round(clicks * (brand ? 0.03 : 0.025) * between(0.7, 1.3))
      const mqls = Math.round(leads * between(0.3, 0.45))
      campaignMetrics.set(`${key}:${month}`, {month, spend, leads, mqls, icp})
      snapshots.push({
        _id: snapshotId(month, 'campaign', `campaign-${key}`),
        _type: 'snapshot',
        month,
        subjectType: 'campaign',
        campaign: {_type: 'reference', _ref: `campaign-${key}`, _weak: true},
        ...tagsFrom(icp, solution, market, topic ? T(topic) : null),
        spend,
        clicks,
        impressions: Math.round(clicks * between(18, 40)),
        leads,
        mqls,
        opportunities: Math.floor(mqls / 6),
        pipeline: Math.floor(mqls / 6) * Math.round(between(30, 70)) * 1000,
        syncedAt: syncedAt(month),
      })
    })
  })

  // Content pieces: sessions, search, AI citations; leads only where there is a form.
  const pieceMetrics = new Map<string, {leads: number; mqls: number; aiAssistantMqls: number; clicks: number; impressions: number; position: number; aiCitations: number}>()
  pieces.forEach((document) => {
    const piece = document as Extract<WebsiteDocument, {_type: 'contentPiece'}>
    if (!isLive(piece.status ?? '')) return
    const base = between(150, 900)
    SEED_MONTHS.forEach((month, monthIndex) => {
      if ((piece.publishedAt ?? '9999') > `${month.slice(0, 7)}-31`) return
      const impressions = Math.round(base * 14 * between(0.8, 1.25))
      const clicks = Math.max(1, Math.round(impressions * between(0.002, 0.012)))
      const sessions = Math.round(clicks * between(1.3, 2))
      const hasForm = Boolean(piece.conversion?.hubspotFormId)
      // September: more leads, worse quality (the brief's "leads up, MQLs down").
      const leadRate = monthIndex === 2 ? 0.07 : 0.035
      const qualifyRate = monthIndex === 2 ? 0.22 : 0.5
      const leads = hasForm ? Math.round(sessions * leadRate * between(0.7, 1.3)) : 0
      const mqls = Math.round(leads * qualifyRate)
      const aiAssistantMqls = Math.min(mqls, Math.round(between(0, 3)))
      const position = Math.round(between(3, 14) * 10) / 10
      const aiCitations = Math.round(between(0, 18))
      pieceMetrics.set(`${piece._id}:${month}`, {leads, mqls, aiAssistantMqls, clicks, impressions, position, aiCitations})
      snapshots.push({
        _id: snapshotId(month, 'contentPiece', piece._id),
        _type: 'snapshot',
        month,
        subjectType: 'contentPiece',
        subject: cdr(piece._id),
        ...tagsFrom(piece.icp?._ref, piece.solution?._ref, piece.market?._ref, piece.topic?._ref),
        sessions,
        conversions: leads,
        impressions,
        clicks,
        position,
        aiCitations,
        leads,
        mqls,
        aiAssistantMqls,
        syncedAt: syncedAt(month),
      })
    })
  })

  // Topics: queries the topic ranks for (with or without a piece) plus its pieces' MQLs.
  clusters.forEach(([key, , , , icp]) => {
    const topicId = T(key)
    const topicPieces = pieces.filter((piece) => (piece as {topic?: Ref}).topic?._ref === topicId).map((piece) => piece._id)
    SEED_MONTHS.forEach((month, monthIndex) => {
      const rows = topicPieces.map((id) => pieceMetrics.get(`${id}:${month}`)).filter(Boolean) as {mqls: number; aiAssistantMqls: number; clicks: number; impressions: number; position: number; aiCitations: number}[]
      const extraImpressions = Math.round(between(1500, 9000))
      const impressions = extraImpressions + rows.reduce((total, row) => total + row.impressions, 0)
      const clicks = Math.round(extraImpressions * between(0.001, 0.004)) + rows.reduce((total, row) => total + row.clicks, 0)
      const position = rows.length
        ? Math.round((rows.reduce((total, row) => total + row.position, 0) / rows.length) * 10) / 10
        : Math.round(between(9, 22) * 10) / 10
      snapshots.push({
        _id: snapshotId(month, 'topic', topicId),
        _type: 'snapshot',
        month,
        subjectType: 'topic',
        subject: cdr(topicId),
        ...tagsFrom(icp, null, null, topicId),
        impressions,
        clicks,
        position: Math.max(1, Math.round((position - monthIndex * 0.3) * 10) / 10),
        aiCitations: rows.reduce((total, row) => total + row.aiCitations, 0),
        mqls: rows.reduce((total, row) => total + row.mqls, 0),
        aiAssistantMqls: rows.reduce((total, row) => total + row.aiAssistantMqls, 0),
        syncedAt: syncedAt(month),
      })
    })
  })

  // ICPs: campaigns plus content tagged to the ICP (MQLs need HubSpot contacts linked to accounts).
  icps.forEach((icp) => {
    SEED_MONTHS.forEach((month) => {
      const campaignRows = [...campaignMetrics.values()].filter((row) => row.month === month && row.icp === icp._id)
      const pieceRows = pieces
        .filter((piece) => (piece as {icp?: Ref}).icp?._ref === icp._id)
        .map((piece) => pieceMetrics.get(`${piece._id}:${month}`))
        .filter(Boolean) as {leads: number; mqls: number}[]
      const leads = campaignRows.reduce((total, row) => total + row.leads, 0) + pieceRows.reduce((total, row) => total + row.leads, 0)
      const mqls = campaignRows.reduce((total, row) => total + row.mqls, 0) + pieceRows.reduce((total, row) => total + row.mqls, 0)
      const opportunities = Math.floor(mqls / 5)
      snapshots.push({
        _id: snapshotId(month, 'icp', icp._id),
        _type: 'snapshot',
        month,
        subjectType: 'icp',
        subject: cdr(icp._id),
        icp: cdr(icp._id),
        spend: campaignRows.reduce((total, row) => total + row.spend, 0),
        leads,
        mqls,
        opportunities,
        pipeline: opportunities * Math.round(between(40, 80)) * 1000,
        syncedAt: syncedAt(month),
      })
    })
  })

  // All sources: HubSpot site totals, most of which come through the contact form, by source.
  SEED_MONTHS.forEach((month, monthIndex) => {
    // Site totals include everything a campaign or a content piece produced, plus direct traffic.
    const attributed = [...campaignMetrics.values(), ...[...pieceMetrics].filter(([key]) => key.endsWith(`:${month}`)).map(([, row]) => row)]
      .filter((row) => !('month' in row) || row.month === month)
      .reduce((total, row) => ({leads: total.leads + row.leads, mqls: total.mqls + row.mqls}), {leads: 0, mqls: 0})
    const leads = Math.max(Math.round(attributed.leads * 1.2), Math.round([620, 780, 1180, 690][monthIndex] * between(0.95, 1.05)))
    const mqls = Math.max(attributed.mqls, Math.round([300, 360, 250, 320][monthIndex] * between(0.95, 1.05)))
    const shares: [string, number][] = [['Direct', 0.44], ['Google', 0.29], ['Organic', 0.055], ['AI assistants', 0.047], ['Unattributed', 0.045], ['Bing', 0.042], ['LinkedIn', 0.006], ['Email', 0.003]]
    const bySource = shares.map(([source, share]) => ({source, mqls: Math.round(mqls * share)}))
    bySource[0].mqls += mqls - bySource.reduce((total, entry) => total + entry.mqls, 0)
    snapshots.push({
      _id: snapshotId(month, 'all', 'all-sources'),
      _type: 'snapshot',
      month,
      subjectType: 'all',
      leads,
      mqls,
      aiAssistantMqls: bySource.find((entry) => entry.source === 'AI assistants')!.mqls,
      mqlsBySource: keyed(bySource, 's'),
      syncedAt: syncedAt(month),
    })
  })

  // ------------------------------------------------------------ accounts (phase 4 shape)

  const companyNames = ['Arbor', 'Beacon', 'Cobalt', 'Delta Ridge', 'Ember', 'Fjord', 'Granite', 'Harbor', 'Ionic', 'Juniper', 'Kestrel', 'Lumen', 'Meridian', 'Nimbus', 'Orchard', 'Pioneer', 'Quartz', 'Riverstone', 'Summit', 'Tidal']
  const icpCycle = [ICP.scaler, ICP.multinational, ICP.consolidator, ICP.structuring, ICP.fund, null]
  const accounts: GtmDocument[] = companyNames.map((name, index) => {
    const icp = icpCycle[index % icpCycle.length]
    const revenueUsd = [2e6, 1.5e7, 6e7, 3e8, 1.2e9, 5e9][Math.floor(between(0, 6))]
    const globalCountries = icp ? [1, 3, 6, 12, 25, 50][Math.floor(between(0, 6))] : 1
    const vistraCountries = Math.max(1, Math.min(globalCountries, [1, 1, 2, 3, 5, 8][Math.floor(between(0, 6))]))
    const productGroups = [1, 1, 2, 3, 4, 6][Math.floor(between(0, 6))]
    const rightToWin = {
      capability: random() < 0.7,
      geographic: random() < 0.6,
      proposition: random() < 0.5,
      relationship: random() < 0.5,
      economic: random() < 0.6,
    }
    const score = scoreAttractiveness({globalRevenue: revenueUsd, globalCountries, vistraCountries, productGroups})
    return {
      _id: `account-${String(index).padStart(2, '0')}`,
      _type: 'account',
      title: `${name} Holdings (synthetic)`,
      salesforceId: `001SYN${String(index).padStart(9, '0')}`,
      demandbaseId: `syn-db-${1000 + index}`,
      ...(icp ? {icp: cdr(icp)} : {}),
      inputs: {revenueUsd, globalCountries, vistraCountries, productGroups},
      rightToWin,
      scores: {
        potential: Math.round(score.potential * 10) / 10,
        complexity: Math.round(score.complexity * 10) / 10,
        rightToWin: rightToWinScore({
          capabilityFit: rightToWin.capability,
          geographicFit: rightToWin.geographic,
          propositionFit: rightToWin.proposition,
          relationshipAccess: rightToWin.relationship,
          economicFit: rightToWin.economic,
        }),
        quadrant: score.quadrant,
      },
    }
  })

  return {
    website: [...icps, ...solutions, ...markets, ...topics, ...proofPoints, ...pieces],
    gtm: [plan, ...programmes, ...messagingPillars, ...competitors, ...briefs, ...campaigns, ...snapshots, ...accounts],
  }
}
