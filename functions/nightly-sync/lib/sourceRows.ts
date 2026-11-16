// Rows the nightly sync reads from each source system (brief §6, "where each number comes from").
// Adapters turn API responses into these shapes; everything after that is pure and tested.
// All rows are counts or totals at month grain: no contacts, no people.

export interface SearchConsoleRow {
  month: string // YYYY-MM-01
  query: string
  pageUrl: string
  clicks: number
  impressions: number
  position: number
}

export interface AnalyticsRow {
  month: string
  pageUrl: string
  sessions: number
}

export interface HubSpotRow {
  month: string
  formId?: string
  pageUrl?: string
  utmCampaign?: string
  /** HubSpot original source, or the AI assistant that referred the visit. */
  source?: string
  leads: number
  mqls: number
  opportunities?: number
  pipeline?: number
  currency?: string
}

export interface FunnelRow {
  month: string
  campaignName?: string
  campaignId?: string
  spend: number
  currency: string
  clicks: number
  impressions: number
}

export interface PeecRow {
  month: string
  pageUrl: string
  citations: number
}

export interface SourceRows {
  searchConsole: SearchConsoleRow[]
  analytics: AnalyticsRow[]
  hubspot: HubSpotRow[]
  funnel: FunnelRow[]
  peec: PeecRow[]
}

export const emptySourceRows = (): SourceRows => ({searchConsole: [], analytics: [], hubspot: [], funnel: [], peec: []})

// The four tags of the brief, one each, as vistra.com document IDs.
export interface FourTags {
  icp?: string
  solution?: string
  market?: string
  topic?: string
}

export interface ContentPieceSubject extends FourTags {
  _id: string
  url?: string
  hubspotFormId?: string
}

export interface TopicSubject {
  _id: string
  targetQueries?: string[]
  icp?: string
  solution?: string
}

export interface CampaignSubject extends FourTags {
  _id: string
  title?: string
  platformCampaignId?: string
  utm?: string
}

export interface SyncSubjects {
  contentPieces: ContentPieceSubject[]
  topics: TopicSubject[]
  campaigns: CampaignSubject[]
  icpIds: string[]
}

// Read from vistra.com (published only: the website's truth).
export const WEBSITE_SUBJECTS_QUERY = `{
  "contentPieces": *[_type == "contentPiece" && status in ["published", "refresh"]]{
    _id, url, "hubspotFormId": conversion.hubspotFormId,
    "icp": icp._ref, "solution": solution._ref, "market": market._ref, "topic": topic._ref
  },
  "topics": *[_type == "topic"]{_id, targetQueries, "icp": icp._ref, "solution": solution._ref},
  "icpIds": *[_type == "icp"]._id
}`

// Read from gtm-brain. Cross-dataset references expose the target ID as _ref, like plain ones.
export const GTM_SUBJECTS_QUERY = `*[_type == "campaign"]{
  _id, title, platformCampaignId, utm,
  "icp": icp._ref, "solution": solution._ref, "market": market._ref, "topic": topic._ref
}`
