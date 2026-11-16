import {formatCount, formatGbp, formatGbpShort, formatShare, monthShort} from '../engine/format'
import {overviewView, type EngineModel} from '../engine/model'
import {BarList, Callout, Section, Stat, Stats} from '../ui'

export function OverviewTab({model}: {model: EngineModel}) {
  const view = overviewView(model)
  return (
    <>
      <div className="headline">
        <h2>{view.headline}</h2>
        <p className="muted">{view.summary}</p>
      </div>
      <Stats>
        <Stat label="Paid spend" value={formatGbp(view.paidSpend)} detail={view.spendByChannel.map((entry) => `${entry.label} ${formatGbpShort(entry.spend)}`).join(' · ')} />
        <Stat label="Campaigns" value={formatCount(view.campaignCount)} detail={`${view.spendingInLatestMonth} spending in ${monthShort(view.latestMonth)}`} />
        <Stat label="New leads" value={formatCount(view.leads)} detail="HubSpot, all sources" />
        <Stat label="MQLs" value={formatCount(view.mqls)} detail={`${formatCount(view.aiAssistantMqls)} from AI assistants`} />
        <Stat label="Spend on the five ICPs" value={formatShare(view.icpShareOfSpend, 1, 0)} detail="the rest is brand or untagged" />
      </Stats>
      <div className="grid-2">
        <Section title="Paid spend by ICP" note="Brand campaigns serve all ICPs; untagged campaigns have no ICP yet (tag them in Campaigns).">
          <BarList
            format={formatGbpShort}
            rows={view.spendByIcp.map((row) => ({
              key: row.key,
              label: row.label,
              value: row.spend,
              detail: `${formatShare(row.share, 1, 0)} · ${row.campaignCount} campaign${row.campaignCount === 1 ? '' : 's'}`,
              muted: row.isBrand || row.key === 'untagged',
            }))}
          />
        </Section>
        <Section title="Where coverage is missing">
          {view.unfundedIcps.length ? (
            <>
              <ul className="plain-list">
                {view.unfundedIcps.map((entry) => (
                  <li key={entry.icp._id}>
                    <strong>{entry.icp.title}</strong>: {formatGbp(entry.spend)} of paid spend
                    {entry.pausedCampaigns ? `, ${entry.pausedCampaigns} paused campaign${entry.pausedCampaigns === 1 ? '' : 's'}` : ''}
                  </li>
                ))}
              </ul>
              {view.coverageGap ? <Callout title="Coverage gap">{view.coverageGap}</Callout> : null}
              {view.nextStep ? <Callout title="Suggested next step">{view.nextStep}</Callout> : null}
            </>
          ) : (
            <p>Every ICP has paid support.</p>
          )}
        </Section>
      </div>
    </>
  )
}
