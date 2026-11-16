// Labels for the stored values. Mirrors studio/schemas/options.ts.

export const archetypeLabels: Record<string, string> = {
  'international-scaler': 'International Scaler',
  'distributed-multinational': 'Distributed Multinational',
  'global-consolidator': 'Global Consolidator',
  'cross-border-structuring': 'Cross-border Corporate Structuring',
  'fund-investment-platform': 'Fund / Investment Platform',
}

export const stageLabels: Record<string, string> = {
  aware: 'Aware: the trigger',
  consider: 'Consider: how to solve it',
  decide: 'Decide: why Vistra',
}

export const STAGES = ['aware', 'consider', 'decide'] as const

export const formatLabels: Record<string, string> = {
  guide: 'Guide',
  article: 'Article',
  tool: 'Tool',
  'case-study': 'Case study',
  video: 'Video',
}

export const contentStatusLabels: Record<string, string> = {
  backlog: 'Gap',
  briefed: 'Briefed',
  drafting: 'Drafting',
  review: 'Review',
  localising: 'Localising',
  published: 'Published',
  refresh: 'Refresh',
  retired: 'Retired',
}

export const LIVE_STATUSES = new Set(['published', 'refresh'])
export const IN_PROGRESS_STATUSES = new Set(['briefed', 'drafting', 'review', 'localising'])

export const channelLabels: Record<string, string> = {
  'google-ads': 'Google Ads',
  'linkedin-ads': 'LinkedIn Ads',
  'bing-ads': 'Bing Ads',
  email: 'Email',
  abm: 'ABM',
  social: 'Social',
  events: 'Events',
  web: 'Web',
}

export const PAID_CHANNELS = ['google-ads', 'linkedin-ads', 'bing-ads']

export const tacticLabels: Record<string, string> = {
  'web-page': 'Web page',
  ad: 'Ad',
  email: 'Email',
  'landing-page': 'Landing page',
  event: 'Event',
  'abm-play': 'ABM play',
  'sales-kit': 'Sales kit',
  social: 'Social',
}

export const TACTIC_KINDS = Object.keys(tacticLabels)

export const campaignStageLabels: Record<string, string> = {
  planned: 'Planned',
  live: 'Live',
  paused: 'Paused',
  ended: 'Ended',
}

export const businessUnitLabels: Record<string, string> = {vgs: 'VGS', vfs: 'VFS'}

export const planMetricLabels: Record<string, string> = {
  mqls: 'MQLs',
  pipeline: 'Pipeline',
  leads: 'Leads',
  'non-brand-clicks': 'Non-brand organic clicks',
  'ai-assistant-mqls': 'AI assistant MQLs',
  'icp-spend-share': 'ICP share of paid spend',
}

export const languageLabels: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  'zh-hans': 'Chinese (Simplified)',
  'zh-hant': 'Chinese (Traditional)',
  nl: 'Dutch',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
}

export const briefStatusLabels: Record<string, string> = {
  requested: 'Requested',
  'in-progress': 'In progress',
  delivered: 'Delivered',
}

// Vistra product groups as Simon-Kucher names them (ICP development, October 2026). The ICP
// scorer counts them for the complexity score and reads them for next-best actions.
export const productGroupLabels: Record<string, string> = {
  'entity-cosec': 'Entity / CoSec management',
  'entity-accounting': 'Entity accounting',
  payroll: 'Payroll',
  disbursement: 'Disbursement',
  'management-accounting': 'Management accounting',
  'transactions-payments': 'Transactions and payments',
  'tax-advisory': 'Tax advisory',
  'hr-advisory': 'HR advisory',
  'legal-advisory': 'Legal advisory',
  'legal-establishment': 'Legal establishment',
}
