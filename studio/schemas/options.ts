// Fixed lists used by both datasets. Labels follow the brief's wording.

export const businessUnitOptions = [
  {title: 'VGS', value: 'vgs'},
  {title: 'VFS', value: 'vfs'},
]

// The five Simon-Kucher archetypes (brief section 3). Stable keys for code and syncs.
export const archetypeOptions = [
  {title: 'International Scaler', value: 'international-scaler'},
  {title: 'Distributed Multinational', value: 'distributed-multinational'},
  {title: 'Global Consolidator', value: 'global-consolidator'},
  {title: 'Cross-border Corporate Structuring', value: 'cross-border-structuring'},
  {title: 'Fund / Investment Platform', value: 'fund-investment-platform'},
]

// Journey stages (brief section 4, coverage grid columns).
export const stageOptions = [
  {title: 'Aware: the trigger', value: 'aware'},
  {title: 'Consider: how to solve it', value: 'consider'},
  {title: 'Decide: why Vistra', value: 'decide'},
]

// Content piece types (brief section 6).
export const formatOptions = [
  {title: 'Guide', value: 'guide'},
  {title: 'Article', value: 'article'},
  {title: 'Tool', value: 'tool'},
  {title: 'Case study', value: 'case-study'},
  {title: 'Video', value: 'video'},
]

// Content lifecycle (brief section 4): find gap → brief → draft → review → localise → publish,
// then refresh or retire.
export const contentStatusOptions = [
  {title: 'Gap (backlog)', value: 'backlog'},
  {title: 'Briefed', value: 'briefed'},
  {title: 'Drafting', value: 'drafting'},
  {title: 'Review (SME + legal)', value: 'review'},
  {title: 'Localising', value: 'localising'},
  {title: 'Published', value: 'published'},
  {title: 'Refresh', value: 'refresh'},
  {title: 'Retired', value: 'retired'},
]

export const variantKindOptions = [
  {title: 'Language', value: 'language'},
  {title: 'Market', value: 'market'},
  {title: 'Format', value: 'format'},
]

export const languageOptions = [
  {title: 'English', value: 'en'},
  {title: 'Japanese', value: 'ja'},
  {title: 'Chinese (Simplified)', value: 'zh-hans'},
  {title: 'Chinese (Traditional)', value: 'zh-hant'},
  {title: 'Dutch', value: 'nl'},
  {title: 'French', value: 'fr'},
  {title: 'German', value: 'de'},
  {title: 'Spanish', value: 'es'},
]

export const proofKindOptions = [
  {title: 'Stat', value: 'stat'},
  {title: 'Quote', value: 'quote'},
  {title: 'Case study', value: 'case-study'},
]

export const channelOptions = [
  {title: 'Google Ads', value: 'google-ads'},
  {title: 'LinkedIn Ads', value: 'linkedin-ads'},
  {title: 'Bing Ads', value: 'bing-ads'},
  {title: 'Email', value: 'email'},
  {title: 'ABM (Demandbase)', value: 'abm'},
  {title: 'Organic social', value: 'social'},
  {title: 'Events', value: 'events'},
  {title: 'Web', value: 'web'},
]

// Campaign stage (brief section 6, "stage").
export const campaignStageOptions = [
  {title: 'Planned', value: 'planned'},
  {title: 'Live', value: 'live'},
  {title: 'Paused', value: 'paused'},
  {title: 'Ended', value: 'ended'},
]

// Tactic / asset use (brief section 3) and distribution channels (brief section 1, step 4).
export const tacticKindOptions = [
  {title: 'Web page', value: 'web-page'},
  {title: 'Ad', value: 'ad'},
  {title: 'Email', value: 'email'},
  {title: 'Landing page', value: 'landing-page'},
  {title: 'Event', value: 'event'},
  {title: 'ABM play', value: 'abm-play'},
  {title: 'Sales kit', value: 'sales-kit'},
  {title: 'Social', value: 'social'},
]

export const briefStatusOptions = [
  {title: 'Requested', value: 'requested'},
  {title: 'In progress', value: 'in-progress'},
  {title: 'Delivered', value: 'delivered'},
]

export const planMetricOptions = [
  {title: 'MQLs', value: 'mqls'},
  {title: 'Pipeline (GBP)', value: 'pipeline'},
  {title: 'Leads', value: 'leads'},
  {title: 'Non-brand organic clicks', value: 'non-brand-clicks'},
  {title: 'AI assistant MQLs', value: 'ai-assistant-mqls'},
  {title: 'ICP share of paid spend (%)', value: 'icp-spend-share'},
]

// Snapshot subjects (brief section 6) plus "all sources", which the Overview's headline totals
// and the MQLs-by-source chart need (HubSpot totals that no single subject carries).
export const snapshotSubjectOptions = [
  {title: 'Content piece', value: 'contentPiece'},
  {title: 'Topic', value: 'topic'},
  {title: 'Campaign', value: 'campaign'},
  {title: 'ICP', value: 'icp'},
  {title: 'All sources (site total)', value: 'all'},
]

export const CURRENCY = 'GBP'
