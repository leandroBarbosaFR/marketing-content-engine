import {emptySourceRows, type SourceRows} from './sourceRows'

// One adapter per source system. Each reads its credentials from the Function's environment and
// returns rows for the requested months, or reports why it was skipped. No adapter is connected in
// the first build: every connection needs IT Security sign-off (brief §10), and the brief's
// open questions 2–4 decide how GA4, Search Console and Peec AI are reached (direct API or Funnel).

export interface AdapterOutcome {
  source: keyof SourceRows
  status: 'loaded' | 'not-configured'
  detail: string
  rowCount: number
}

export interface SourceAdapter {
  source: keyof SourceRows
  requiredVariables: string[]
  load(months: string[], environment: Record<string, string | undefined>): Promise<SourceRows[keyof SourceRows]>
}

function notConnectedYet(source: keyof SourceRows, requiredVariables: string[]): SourceAdapter {
  return {
    source,
    requiredVariables,
    async load() {
      throw new Error(`${source} has credentials but no client yet. Build it once IT Security approves the connection.`)
    },
  }
}

export const SOURCE_ADAPTERS: SourceAdapter[] = [
  notConnectedYet('searchConsole', ['GSC_SERVICE_ACCOUNT_JSON', 'GSC_SITE_URL']),
  notConnectedYet('analytics', ['GA4_SERVICE_ACCOUNT_JSON', 'GA4_PROPERTY_ID']),
  notConnectedYet('hubspot', ['HUBSPOT_PRIVATE_APP_TOKEN']),
  notConnectedYet('funnel', ['FUNNEL_EXPORT_URL', 'FUNNEL_API_KEY']),
  notConnectedYet('peec', ['PEEC_API_KEY']),
]

export async function loadSourceRows(
  months: string[],
  environment: Record<string, string | undefined>,
  adapters: SourceAdapter[] = SOURCE_ADAPTERS,
): Promise<{rows: SourceRows; outcomes: AdapterOutcome[]}> {
  const rows = emptySourceRows()
  const outcomes: AdapterOutcome[] = []
  for (const adapter of adapters) {
    const missing = adapter.requiredVariables.filter((name) => !environment[name]?.trim())
    if (missing.length) {
      outcomes.push({source: adapter.source, status: 'not-configured', detail: `Missing ${missing.join(', ')}`, rowCount: 0})
      continue
    }
    const loaded = await adapter.load(months, environment)
    ;(rows[adapter.source] as unknown[]) = loaded
    outcomes.push({source: adapter.source, status: 'loaded', detail: 'OK', rowCount: loaded.length})
  }
  return {rows, outcomes}
}
