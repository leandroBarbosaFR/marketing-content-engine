import {SanityApp, type SanityConfig} from '@sanity/sdk-react'
import {Suspense, useEffect, useState} from 'react'
import {GTM_DATASET, PROJECT_ID, WEBSITE_DATASET} from './config'
import {useEngineModel} from './data'
import {describePeriod, monthLong} from './engine/format'
import {setupView} from './engine/model'
import {GTM_TYPES, WEBSITE_TYPES} from './engine/types'
import {AnalyticsTab} from './tabs/AnalyticsTab'
import {CampaignsTab} from './tabs/CampaignsTab'
import {ContentTab} from './tabs/ContentTab'
import {IcpsTab} from './tabs/IcpsTab'
import {OrchestrationTab} from './tabs/OrchestrationTab'
import {OverviewTab} from './tabs/OverviewTab'
import {ScorerTab} from './tabs/ScorerTab'
import {SetupTab} from './tabs/SetupTab'
import {StrategyTab} from './tabs/StrategyTab'
import './App.css'

// Both datasets live in one project (brief §5): gtm-brain is the default resource, and the
// website dataset is named on each query.
const sanityConfigs: SanityConfig[] = [
  {projectId: PROJECT_ID, dataset: GTM_DATASET},
  {projectId: PROJECT_ID, dataset: WEBSITE_DATASET},
]

// The prototype's seven tabs, then the two the brief adds (§6): Strategy and Content.
const TABS = [
  {id: 'overview', label: 'Overview', Component: OverviewTab},
  {id: 'icps', label: 'ICPs', Component: IcpsTab},
  {id: 'campaigns', label: 'Campaigns', Component: CampaignsTab},
  {id: 'analytics', label: 'Analytics', Component: AnalyticsTab},
  {id: 'orchestration', label: 'Orchestration', Component: OrchestrationTab},
  {id: 'scorer', label: 'ICP scorer', Component: ScorerTab},
  {id: 'setup', label: 'Sanity setup', Component: SetupTab},
  {id: 'strategy', label: 'Strategy', Component: StrategyTab, isNew: true},
  {id: 'content', label: 'Content', Component: ContentTab, isNew: true},
] as const

type TabId = (typeof TABS)[number]['id']

function readTab(): TabId {
  const hash = window.location.hash.replace('#', '')
  return (TABS.find((tab) => tab.id === hash)?.id ?? 'overview') as TabId
}

function Hub() {
  const model = useEngineModel()
  const [tab, setTab] = useState<TabId>(readTab)
  useEffect(() => {
    const onHashChange = () => setTab(readTab())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  const setup = setupView(model, WEBSITE_TYPES, GTM_TYPES)
  const Active = TABS.find((entry) => entry.id === tab)!.Component

  return (
    <div className="hub">
      <header className="hub-header">
        <div>
          <h1>Marketing Hub</h1>
          <p className="muted">Marketing and content engine on Sanity · vistra.com + gtm-brain</p>
        </div>
        <div className="snapshot-badge" title="Results come from monthly snapshots written by the nightly sync">
          <span>Results: {describePeriod(model.months)}</span>
          <span className="muted">
            {setup.lastSyncedAt ? `Last sync ${new Date(setup.lastSyncedAt).toLocaleDateString('en-GB')}` : 'Not synced yet'}
            {model.latestMonth ? ` · latest month ${monthLong(model.latestMonth)}` : ''}
          </span>
        </div>
      </header>
      <nav className="tabs" aria-label="Hub sections">
        {TABS.map((entry) => (
          <a key={entry.id} href={`#${entry.id}`} className={entry.id === tab ? 'tab is-active' : 'tab'} aria-current={entry.id === tab ? 'page' : undefined}>
            {entry.label}
            {'isNew' in entry ? <span className="tab-new">new</span> : null}
          </a>
        ))}
      </nav>
      <main className="hub-main">
        <Active model={model} />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <SanityApp config={sanityConfigs} fallback={<div className="loading">Opening the hub…</div>}>
      <Suspense fallback={<div className="loading">Loading both datasets…</div>}>
        <Hub />
      </Suspense>
    </SanityApp>
  )
}
