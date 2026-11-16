import {useMemo, useState} from 'react'
import {GTM_WORKSPACE, studioEditUrl} from '../config'
import {useEngineActions, type IcpChoice} from '../data'
import {formatCount, formatGbp, toCsv} from '../engine/format'
import {channelLabels} from '../engine/labels'
import {campaignRegister, icpName, sum, type CampaignRow, type EngineModel} from '../engine/model'
import {Badge, downloadCsv, Section} from '../ui'

const statusTone = {spending: 'good', 'no-spend': 'warn', planned: 'info', ended: 'neutral'} as const

function IcpCell({row, model}: {row: CampaignRow; model: EngineModel}) {
  const {setCampaignIcp} = useEngineActions()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const save = async (choice: IcpChoice) => {
    setSaving(true)
    setError(undefined)
    try {
      await setCampaignIcp(row.campaign._id, choice)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }
  const current = row.campaign.brand ? 'brand' : (row.campaign.icp?._ref ?? '')
  return (
    <div className="icp-cell">
      {row.proposedIcp ? (
        <button type="button" className="button small" disabled={saving} onClick={() => save({kind: 'icp', icpId: row.proposedIcp!._id})} title={`Matched “${row.proposal.matchedToken}” in the name`}>
          Apply {icpName(row.proposedIcp)}
        </button>
      ) : null}
      <select
        value={current}
        disabled={saving}
        aria-label={`ICP for ${row.campaign.title}`}
        onChange={(event) => save(event.target.value === 'brand' ? {kind: 'brand'} : {kind: 'icp', icpId: event.target.value})}
      >
        <option value="" disabled>
          Untagged
        </option>
        <option value="brand">Brand (all ICPs)</option>
        {model.icps.map((icp) => (
          <option key={icp._id} value={icp._id}>
            {icpName(icp)}
          </option>
        ))}
      </select>
      {error ? <span className="error">{error}</span> : null}
    </div>
  )
}

export function CampaignsTab({model}: {model: EngineModel}) {
  const rows = campaignRegister(model)
  const [icpFilter, setIcpFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (icpFilter === 'untagged' && row.icpLabel) return false
        if (icpFilter === 'brand' && !row.campaign.brand) return false
        if (!['all', 'untagged', 'brand'].includes(icpFilter) && row.campaign.icp?._ref !== icpFilter) return false
        if (channelFilter !== 'all' && !row.campaign.channels?.includes(channelFilter)) return false
        if (statusFilter !== 'all' && row.status !== statusFilter) return false
        if (search && !(row.campaign.title ?? '').toLowerCase().includes(search.toLowerCase())) return false
        return true
      }),
    [rows, icpFilter, channelFilter, statusFilter, search],
  )
  const channels = [...new Set(rows.flatMap((row) => row.campaign.channels ?? []))]

  const exportCsv = () =>
    downloadCsv(
      'campaign-register.csv',
      toCsv(
        ['Campaign', 'ICP', 'Proposed ICP', 'Channels', 'Market', 'Product', 'Status', 'Spend (GBP)', 'Clicks', 'Leads', 'MQLs'],
        filtered.map((row) => [
          row.campaign.title,
          row.icpLabel ?? '',
          row.proposedIcp ? icpName(row.proposedIcp) : '',
          row.channelLabels.join('; '),
          row.market,
          row.product,
          row.statusLabel,
          Math.round(row.spend),
          row.clicks,
          row.leads,
          row.mqls,
        ]),
      ),
    )

  return (
    <Section
      title="Campaign register"
      note="Every campaign with its ICP, channel, market and product. Untagged campaigns get an ICP proposed from their name; applying it writes the tag to gtm-brain and publishes it."
      actions={
        <button type="button" className="button" onClick={exportCsv}>
          Export CSV
        </button>
      }
    >
      <div className="filters">
        <input type="search" placeholder="Search campaigns" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={icpFilter} onChange={(event) => setIcpFilter(event.target.value)} aria-label="ICP">
          <option value="all">All ICPs</option>
          <option value="brand">Brand</option>
          <option value="untagged">Untagged</option>
          {model.icps.map((icp) => (
            <option key={icp._id} value={icp._id}>
              {icpName(icp)}
            </option>
          ))}
        </select>
        <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)} aria-label="Channel">
          <option value="all">All channels</option>
          {channels.map((channel) => (
            <option key={channel} value={channel}>
              {channelLabels[channel] ?? channel}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status">
          <option value="all">All statuses</option>
          <option value="spending">Spending</option>
          <option value="no-spend">No spend this month</option>
          <option value="planned">Planned</option>
          <option value="ended">Ended</option>
        </select>
        <span className="muted">{filtered.length} of {rows.length}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>ICP</th>
              <th>Channels</th>
              <th>Market</th>
              <th>Product</th>
              <th>Status</th>
              <th className="num">Spend</th>
              <th className="num">Clicks</th>
              <th className="num">Leads</th>
              <th className="num">MQLs</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.campaign._id}>
                <td>
                  <a href={studioEditUrl(GTM_WORKSPACE, row.campaign._id, 'campaign')} target="_blank" rel="noreferrer" className="mono">
                    {row.campaign.title}
                  </a>
                </td>
                <td>
                  {row.icpLabel && !row.campaign.brand ? <span className="cell-label">{row.icpLabel}</span> : null}
                  <IcpCell row={row} model={model} />
                </td>
                <td>{row.channelLabels.join(', ')}</td>
                <td>{row.market ?? '—'}</td>
                <td>{row.product}</td>
                <td>
                  <Badge tone={statusTone[row.status]}>{row.statusLabel}</Badge>
                </td>
                <td className="num">{formatGbp(row.spend)}</td>
                <td className="num">{formatCount(row.clicks)}</td>
                <td className="num">{formatCount(row.leads)}</td>
                <td className="num">{formatCount(row.mqls)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6}>Total</td>
              <td className="num">{formatGbp(sum(filtered, (row) => row.spend))}</td>
              <td className="num">{formatCount(sum(filtered, (row) => row.clicks))}</td>
              <td className="num">{formatCount(sum(filtered, (row) => row.leads))}</td>
              <td className="num">{formatCount(sum(filtered, (row) => row.mqls))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Section>
  )
}
