// Document shapes as the hub and the Functions read them. References are plain objects; cross-
// dataset references carry _dataset and _projectId as well. Every field is optional because the
// Content Lake never guarantees one.

export interface Ref {
  _ref: string
  _type?: string
  _key?: string
  _weak?: boolean
  _dataset?: string
  _projectId?: string
}

interface BaseDocument {
  _id: string
  _type: string
  _updatedAt?: string
}

// ---- vistra.com dataset ----

export interface IcpDocument extends BaseDocument {
  _type: 'icp'
  title?: string
  archetype?: string
  situation?: string
  need?: string
  clientPhrase?: string
  triggers?: string[]
  pathway?: string[]
  order?: number
}

export interface SolutionDocument extends BaseDocument {
  _type: 'solution'
  title?: string
  businessUnit?: string
  valueProposition?: string
  proofPoints?: Ref[]
  pricingGuidance?: string
}

export interface MarketDocument extends BaseDocument {
  _type: 'market'
  title?: string
  kind?: 'country' | 'region'
  countryCode?: string
  languages?: string[]
  regulations?: {_key?: string; name?: string; summary?: string}[]
  priorityIcps?: Ref[]
  localProof?: Ref[]
}

export interface TopicDocument extends BaseDocument {
  _type: 'topic'
  title?: string
  kind?: 'pillar' | 'cluster'
  parent?: Ref
  targetQueries?: string[]
  icp?: Ref
  solution?: Ref
  stage?: string
}

export interface ProofPointDocument extends BaseDocument {
  _type: 'proofPoint'
  title?: string
  kind?: string
  statement?: string
  source?: string
  expiresAt?: string
  allowedMarkets?: Ref[]
}

export interface ContentPieceDocument extends BaseDocument {
  _type: 'contentPiece'
  title?: string
  format?: string
  status?: string
  topic?: Ref
  icp?: Ref
  solution?: Ref
  market?: Ref
  stage?: string
  owner?: string
  reviewDate?: string
  plannedDate?: string
  summary?: string
  sections?: unknown[]
  faqs?: {_key?: string; question?: string; answer?: string}[]
  proofPoints?: Ref[]
  conversion?: {ctaLabel?: string; hubspotFormId?: string}
  url?: string
  publishedAt?: string
  language?: string
  variantOf?: Ref
  variantKind?: string
}

export type WebsiteDocument =
  | IcpDocument
  | SolutionDocument
  | MarketDocument
  | TopicDocument
  | ProofPointDocument
  | ContentPieceDocument

// ---- gtm-brain dataset ----

export interface Target {
  _key?: string
  metric?: string
  value?: number
}

export interface PlanDocument extends BaseDocument {
  _type: 'plan'
  title?: string
  fiscalYear?: string
  goals?: Target[]
  budgets?: {_key?: string; businessUnit?: string; amount?: number}[]
}

export interface ProgrammeDocument extends BaseDocument {
  _type: 'programme'
  title?: string
  plan?: Ref
  businessUnit?: string
  icp?: Ref
  market?: Ref
  solutions?: Ref[]
  messaging?: Ref[]
  budget?: number
  targets?: Target[]
  owner?: string
}

export interface MessagingPillarDocument extends BaseDocument {
  _type: 'messagingPillar'
  title?: string
  icp?: Ref
  solution?: Ref
  market?: Ref
  coreMessage?: string
  approvedClaims?: {_key?: string; claim?: string; proofPoint?: Ref}[]
  bannedClaims?: {_key?: string; claim?: string; reason?: string}[]
}

export interface CompetitorDocument extends BaseDocument {
  _type: 'competitor'
  title?: string
  positioning?: string
  pricingSignals?: string
  winThemes?: string[]
  lossThemes?: string[]
}

export interface BriefDocument extends BaseDocument {
  _type: 'brief'
  title?: string
  topic?: Ref
  icp?: Ref
  stage?: string
  messagingPillar?: Ref
  proofPoints?: Ref[]
  format?: string
  deadline?: string
  status?: string
  notes?: string
  owner?: string
  deliverable?: Ref
}

export interface TacticItem {
  _key?: string
  kind?: string
  name?: string
  asset?: Ref
  url?: string
}

export interface CampaignDocument extends BaseDocument {
  _type: 'campaign'
  title?: string
  programme?: Ref
  brand?: boolean
  icp?: Ref
  solution?: Ref
  market?: Ref
  topic?: Ref
  channels?: string[]
  budget?: number
  startDate?: string
  endDate?: string
  stage?: string
  owner?: string
  contentUsed?: Ref[]
  tactics?: TacticItem[]
  hubspotCampaignId?: string
  utm?: string
  platformCampaignId?: string
}

export type SnapshotSubjectType = 'contentPiece' | 'topic' | 'campaign' | 'icp' | 'all'

export interface SnapshotMetrics {
  sessions?: number
  conversions?: number
  impressions?: number
  clicks?: number
  position?: number
  aiCitations?: number
  leads?: number
  mqls?: number
  aiAssistantMqls?: number
  opportunities?: number
  pipeline?: number
  spend?: number
}

export interface SnapshotDocument extends BaseDocument, SnapshotMetrics {
  _type: 'snapshot'
  month?: string
  subjectType?: SnapshotSubjectType
  subject?: Ref
  campaign?: Ref
  icp?: Ref
  solution?: Ref
  market?: Ref
  topic?: Ref
  mqlsBySource?: {_key?: string; source?: string; mqls?: number}[]
  syncedAt?: string
}

export interface AccountDocument extends BaseDocument {
  _type: 'account'
  title?: string
  salesforceId?: string
  demandbaseId?: string
  icp?: Ref
  inputs?: {revenueUsd?: number; globalCountries?: number; vistraCountries?: number; productGroups?: number}
  rightToWin?: {capability?: boolean; geographic?: boolean; proposition?: boolean; relationship?: boolean; economic?: boolean}
  scores?: {potential?: number; complexity?: number; rightToWin?: number; quadrant?: string}
}

export type GtmDocument =
  | PlanDocument
  | ProgrammeDocument
  | MessagingPillarDocument
  | CompetitorDocument
  | BriefDocument
  | CampaignDocument
  | SnapshotDocument
  | AccountDocument

export const WEBSITE_TYPES = ['icp', 'solution', 'market', 'topic', 'proofPoint', 'contentPiece'] as const
export const GTM_TYPES = ['plan', 'programme', 'messagingPillar', 'competitor', 'brief', 'campaign', 'snapshot', 'account'] as const

// The two queries the hub runs. Both datasets are small (tens of strategy documents, a few hundred
// snapshots a month), so the hub loads them whole and joins cross-dataset references in code:
// GROQ cannot follow a reference from one dataset into another.
export const WEBSITE_QUERY = `*[_type in ${JSON.stringify(WEBSITE_TYPES)}]`
export const GTM_QUERY = `*[_type in ${JSON.stringify(GTM_TYPES)}]`
