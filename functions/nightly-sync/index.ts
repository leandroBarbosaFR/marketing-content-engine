// Nightly sync (brief §6, phase 3): reads Funnel.io (paid), GA4, Search Console, HubSpot and
// Peec AI, and writes one monthly snapshot per content piece, topic, campaign and ICP, plus the
// site total, into gtm-brain. Deterministic IDs make every run replace the same documents.
//
// Guardrails:
// - SYNC_ENABLED must be "true", or the Function logs and stops.
// - While SYNTHETIC_ONLY is not "false" it never writes: real rows must not land next to the
//   synthetic seed. It still maps and logs the reconciliation (a dry run).
// - Secrets live only in Function environment variables (npx sanity functions env add …).
import {createClient, type ClientConfig} from '@sanity/client'
import {buildSnapshots} from './lib/buildSnapshots'
import {loadSourceRows} from './lib/sourceAdapters'
import {GTM_SUBJECTS_QUERY, WEBSITE_SUBJECTS_QUERY, type CampaignSubject, type SyncSubjects} from './lib/sourceRows'

interface ScheduledFunctionInput {
  context: {clientOptions: ClientConfig; local?: boolean}
}

const API_VERSION = '2026-10-01'
const MINIMUM_MATCHED_SHARE = 0.98

// The last complete month and the current one, as first-of-month dates.
export function monthsToSync(now: Date): string[] {
  const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  return [previous, current].map((date) => date.toISOString().slice(0, 10))
}

// "USD=0.79,EUR=0.85": GBP per unit of each currency.
export function parseGbpRates(value: string | undefined): Record<string, number> {
  if (!value?.trim()) return {}
  return Object.fromEntries(
    value.split(',').map((pair) => {
      const [code, rate] = pair.split('=').map((part) => part.trim())
      const parsedRate = Number(rate)
      if (!/^[A-Z]{3}$/.test(code ?? '') || !(parsedRate > 0)) throw new Error(`SYNC_GBP_RATES entry "${pair}" must look like USD=0.79.`)
      return [code, parsedRate]
    }),
  )
}

export async function handler({context}: ScheduledFunctionInput): Promise<void> {
  const environment = process.env
  if (environment.SYNC_ENABLED !== 'true') {
    console.log('Nightly sync is off (SYNC_ENABLED is not "true"). Nothing read or written.')
    return
  }
  const projectId = environment.SYNC_PROJECT_ID || context.clientOptions.projectId
  const websiteDataset = environment.SYNC_WEBSITE_DATASET || 'production'
  const gtmDataset = environment.SYNC_GTM_DATASET || 'gtm-brain'
  if (!projectId) throw new Error('Set SYNC_PROJECT_ID: the project that holds both datasets.')
  const isSyntheticOnly = environment.SYNTHETIC_ONLY !== 'false'

  const months = monthsToSync(new Date())
  const {rows, outcomes} = await loadSourceRows(months, environment)
  for (const outcome of outcomes) console.log(`${outcome.source}: ${outcome.status} (${outcome.detail}, ${outcome.rowCount} rows)`)
  if (!outcomes.some((outcome) => outcome.status === 'loaded')) {
    console.log('No source is configured yet. Nothing written.')
    return
  }

  const clientFor = (dataset: string) =>
    createClient({...context.clientOptions, projectId, dataset, apiVersion: API_VERSION, useCdn: false, perspective: 'published'})
  const website = await clientFor(websiteDataset).fetch<Omit<SyncSubjects, 'campaigns'>>(WEBSITE_SUBJECTS_QUERY)
  const gtm = clientFor(gtmDataset)
  const campaigns = await gtm.fetch<CampaignSubject[]>(GTM_SUBJECTS_QUERY)
  const {snapshots, reconciliation} = buildSnapshots({
    subjects: {...website, campaigns},
    rows,
    gbpRates: parseGbpRates(environment.SYNC_GBP_RATES),
    projectId,
    websiteDataset,
    syncedAt: new Date().toISOString(),
  })
  for (const line of reconciliation) {
    const warning = line.matchedShare < MINIMUM_MATCHED_SHARE ? ' — below 98%: tag or map the unmatched rows' : ''
    console.log(`Reconciliation ${line.source} ${line.measure}: ${(100 * line.matchedShare).toFixed(1)}% matched${warning}`)
  }

  if (isSyntheticOnly || context.local) {
    console.log(`Dry run: ${snapshots.length} snapshot(s) built, none written (SYNTHETIC_ONLY or local test).`)
    return
  }
  for (let start = 0; start < snapshots.length; start += 100) {
    const transaction = gtm.transaction()
    for (const snapshot of snapshots.slice(start, start + 100)) transaction.createOrReplace(snapshot)
    await transaction.commit({visibility: 'async'})
  }
  console.log(`Wrote ${snapshots.length} snapshot(s) for ${months.join(' and ')} to ${gtmDataset}.`)
}
