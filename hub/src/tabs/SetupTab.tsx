import {GTM_DATASET, PROJECT_ID, STUDIO_URL, WEBSITE_DATASET} from '../config'
import {describePeriod} from '../engine/format'
import {setupView, type EngineModel} from '../engine/model'
import {GTM_TYPES, WEBSITE_TYPES} from '../engine/types'
import {Badge, Callout, InterpretationNote, Section, Stat, Stats} from '../ui'

export function SetupTab({model}: {model: EngineModel}) {
  const view = setupView(model, WEBSITE_TYPES, GTM_TYPES)
  const rows = (dataset: 'website' | 'gtm') => view.countsByType.filter((row) => row.dataset === dataset)
  return (
    <>
      <InterpretationNote>
        The prototype’s Sanity setup screen was not available. This tab shows what the hub is connected to and whether the
        links between the two datasets hold.
      </InterpretationNote>
      <Stats>
        <Stat label="Project" value={<span className="mono">{PROJECT_ID}</span>} />
        <Stat label="Cross-dataset references" value={view.crossDatasetRefs} detail={view.danglingRefs.length ? `${view.danglingRefs.length} broken` : 'all resolve'} />
        <Stat label="Results" value={describePeriod(view.snapshotMonths)} detail={view.lastSyncedAt ? `last sync ${new Date(view.lastSyncedAt).toLocaleString('en-GB')}` : 'no sync yet'} />
      </Stats>
      <div className="grid-2">
        {(['website', 'gtm'] as const).map((dataset) => (
          <Section
            key={dataset}
            title={dataset === 'website' ? `vistra.com · ${WEBSITE_DATASET}` : `gtm-brain · ${GTM_DATASET}`}
            note={dataset === 'website' ? 'The taxonomy and content the website publishes.' : 'Strategy, campaigns and results. Never published to the website.'}
          >
            <table>
              <tbody>
                {rows(dataset).map((row) => (
                  <tr key={row.type}>
                    <td className="mono">{row.type}</td>
                    <td className="num">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        ))}
      </div>
      {view.danglingRefs.length ? (
        <Section title="Broken references" note="gtm-brain documents pointing at a vistra.com document that no longer exists (or is not published).">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Field</th>
                <th>Missing target</th>
              </tr>
            </thead>
            <tbody>
              {view.danglingRefs.map((ref) => (
                <tr key={`${ref.from}-${ref.field}-${ref.ref}`}>
                  <td className="mono">{ref.from}</td>
                  <td className="mono">{ref.field}</td>
                  <td className="mono">{ref.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}
      <Callout title="Requirements">
        Cross-dataset references need the Sanity Enterprise plan, and both datasets must be in the same project.{' '}
        {STUDIO_URL ? (
          <a href={STUDIO_URL} target="_blank" rel="noreferrer">
            Open the Studio
          </a>
        ) : (
          <Badge tone="warn">SANITY_APP_STUDIO_URL not set</Badge>
        )}
      </Callout>
    </>
  )
}
