import {formatCount, formatGbp, formatGbpShort, formatShare, monthShort} from '../engine/format'
import {channelLabels} from '../engine/labels'
import {analyticsView, icpName, type EngineModel} from '../engine/model'
import {BarList, Callout, Empty, Section, StackedColumns} from '../ui'

export function AnalyticsTab({model}: {model: EngineModel}) {
  const view = analyticsView(model)
  if (!model.months.length) return <Empty>No snapshots yet. Results appear after the first nightly sync.</Empty>
  return (
    <>
      {view.conversionAnomaly ? <Callout tone="warn" title="Conversion check">{view.conversionAnomaly}</Callout> : null}
      <div className="grid-2">
        <Section title="Paid spend by month">
          <StackedColumns
            format={formatGbpShort}
            series={view.channels.map((channel) => ({key: channel, label: channelLabels[channel] ?? channel}))}
            columns={view.spendByMonth.map((entry) => ({key: entry.month, label: monthShort(entry.month), values: entry.byChannel}))}
          />
        </Section>
        <Section title="New leads and MQLs by month" note="HubSpot, all sources.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="num">New leads</th>
                  <th className="num">MQLs</th>
                  <th className="num">Lead → MQL</th>
                </tr>
              </thead>
              <tbody>
                {view.leadsAndMqlsByMonth.map((entry) => (
                  <tr key={entry.month}>
                    <td>{monthShort(entry.month)}</td>
                    <td className="num">{formatCount(entry.leads)}</td>
                    <td className="num">{formatCount(entry.mqls)}</td>
                    <td className="num">{formatShare(entry.rate, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <Section title="MQLs by source">
          <BarList format={(value) => formatCount(value)} rows={view.mqlsBySource.map((entry) => ({key: entry.source, label: entry.source, value: entry.mqls}))} />
        </Section>
        <Section title="MQLs by topic">
          <BarList
            format={(value) => formatCount(value)}
            rows={view.mqlsByTopic.slice(0, 10).map((entry) => ({key: entry.topic._id, label: entry.topic.title, value: entry.mqls}))}
          />
        </Section>
      </div>
      <Section title="Funnel by ICP" note="HubSpot leads and MQLs, Salesforce opportunities and pipeline, all attributed through the ICP tag.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ICP</th>
                <th className="num">Leads</th>
                <th className="num">MQLs</th>
                <th className="num">Opportunities</th>
                <th className="num">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {view.icpFunnel.map((row) => (
                <tr key={row.icp._id}>
                  <td>{icpName(row.icp)}</td>
                  <td className="num">{formatCount(row.leads)}</td>
                  <td className="num">{formatCount(row.mqls)}</td>
                  <td className="num">{formatCount(row.opportunities)}</td>
                  <td className="num">{formatGbp(row.pipeline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Assets that produce MQLs">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Content piece</th>
                <th className="num">MQLs</th>
                <th className="num">From AI assistants</th>
                <th className="num">Organic clicks</th>
              </tr>
            </thead>
            <tbody>
              {view.mqlsByAsset.slice(0, 15).map((row) => (
                <tr key={row.piece._id}>
                  <td>{row.piece.title}</td>
                  <td className="num">{formatCount(row.mqls)}</td>
                  <td className="num">{formatCount(row.aiAssistantMqls)}</td>
                  <td className="num">{formatCount(row.clicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  )
}
