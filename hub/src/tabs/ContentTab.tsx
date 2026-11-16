import {useState} from 'react'
import {studioEditUrl, WEBSITE_WORKSPACE} from '../config'
import {useEngineActions} from '../data'
import {formatCount, monthLong} from '../engine/format'
import {briefStatusLabels, contentStatusLabels, formatLabels, languageLabels, stageLabels, STAGES} from '../engine/labels'
import {contentInventory, coverageGrid, editorialCalendar, icpName, topicResults, type CoverageCell, type EngineModel} from '../engine/model'
import {Badge, Section} from '../ui'

function GapCell({cell, model}: {cell: CoverageCell; model: EngineModel}) {
  const {createBrief} = useEngineActions()
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const icp = model.icps.find((candidate) => candidate._id === cell.icpId)
  const create = async () => {
    setState('saving')
    try {
      await createBrief({icpId: cell.icpId, stage: cell.stage, title: `${icpName(icp)} · ${stageLabels[cell.stage] ?? cell.stage} content`})
      setState('done')
    } catch {
      setState('error')
    }
  }
  return (
    <div className={cell.isGap ? 'coverage-cell is-gap' : 'coverage-cell'}>
      <div>
        <strong>{cell.livePieces.length}</strong> live
        {cell.inProgress.length ? <span className="muted"> · {cell.inProgress.length} in progress</span> : null}
        {cell.briefs.length ? <span className="muted"> · {cell.briefs.length} brief{cell.briefs.length === 1 ? '' : 's'}</span> : null}
      </div>
      <div className="muted small">{formatCount(cell.mqls)} MQLs</div>
      {cell.isGap && !cell.briefs.length && state !== 'done' ? (
        <button type="button" className="button small" disabled={state === 'saving'} onClick={create}>
          {state === 'error' ? 'Retry: create brief' : 'Create brief'}
        </button>
      ) : null}
    </div>
  )
}

export function ContentTab({model}: {model: EngineModel}) {
  const grid = coverageGrid(model)
  const inventory = contentInventory(model)
  const calendar = editorialCalendar(model)
  const topics = topicResults(model)
  return (
    <>
      <Section title="Coverage" note="Live content per ICP and buying stage. A red cell has nothing live; create a brief to fill it.">
        <div className="table-wrap">
          <table className="coverage">
            <thead>
              <tr>
                <th>ICP</th>
                {STAGES.map((stage) => (
                  <th key={stage}>{stageLabels[stage]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.icps.map((icp) => (
                <tr key={icp._id}>
                  <td>{icpName(icp)}</td>
                  {STAGES.map((stage) => {
                    const cell = grid.find((entry) => entry.icpId === icp._id && entry.stage === stage)
                    return <td key={stage}>{cell ? <GapCell cell={cell} model={model} /> : '—'}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Inventory" note="Every content piece with its four tags: topic, ICP, solution and market.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Content piece</th>
                <th>Format</th>
                <th>Status</th>
                <th>Topic</th>
                <th>ICP</th>
                <th>Solution</th>
                <th>Market</th>
                <th>Stage</th>
                <th>Form</th>
                <th className="num">Campaigns</th>
                <th className="num">MQLs</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row) => (
                <tr key={row.piece._id}>
                  <td>
                    <a href={studioEditUrl(WEBSITE_WORKSPACE, row.piece._id, 'contentPiece')} target="_blank" rel="noreferrer">
                      {row.piece.title}
                    </a>
                    {row.variantOf ? (
                      <div className="muted small">
                        {languageLabels[row.piece.language ?? ''] ?? row.piece.language} variant of {row.variantOf}
                      </div>
                    ) : null}
                  </td>
                  <td>{formatLabels[row.piece.format ?? ''] ?? row.piece.format}</td>
                  <td>
                    <Badge tone={row.piece.status === 'published' ? 'good' : row.piece.status === 'refresh' ? 'warn' : 'neutral'}>
                      {contentStatusLabels[row.piece.status ?? ''] ?? row.piece.status}
                    </Badge>
                  </td>
                  <td>{row.topic ?? '—'}</td>
                  <td>{row.icp ?? '—'}</td>
                  <td>{row.solution ?? '—'}</td>
                  <td>{row.market ?? '—'}</td>
                  <td>{stageLabels[row.piece.stage ?? ''] ?? '—'}</td>
                  <td>{row.hasForm ? 'Yes' : '—'}</td>
                  <td className="num">{row.usedBy}</td>
                  <td className="num">{formatCount(row.mqls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <div className="grid-2">
        <Section title="Editorial calendar" note="Planned publication dates and brief deadlines.">
          <ul className="calendar">
            {calendar.map((entry) => (
              <li key={entry.id}>
                <span className="mono">{entry.date}</span>
                <span>
                  {entry.title}
                  {entry.icp ? <span className="muted"> · {entry.icp}</span> : null}
                </span>
                <Badge tone={entry.kind === 'brief' ? 'info' : 'neutral'}>
                  {entry.kind === 'brief' ? (briefStatusLabels[entry.status ?? ''] ?? 'Brief') : (contentStatusLabels[entry.status ?? ''] ?? entry.status)}
                </Badge>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Topic results" note={`Search Console and AI citations, ${monthLong(model.latestMonth)}.`}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th className="num">Impressions</th>
                  <th className="num">Clicks</th>
                  <th className="num">Position</th>
                  <th className="num">AI citations</th>
                  <th className="num">MQLs</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((row) => (
                  <tr key={row.topic._id}>
                    <td>
                      {row.topic.title}
                      {row.pillar ? <div className="muted small">{row.pillar}</div> : null}
                    </td>
                    <td className="num">{formatCount(row.impressions)}</td>
                    <td className="num">{formatCount(row.clicks)}</td>
                    <td className="num">
                      {formatCount(row.position, 1)}
                      {typeof row.previousPosition === 'number' && typeof row.position === 'number' ? (
                        <span className={row.position <= row.previousPosition ? 'up' : 'down'}>{row.position <= row.previousPosition ? ' ▲' : ' ▼'}</span>
                      ) : null}
                    </td>
                    <td className="num">{formatCount(row.aiCitations)}</td>
                    <td className="num">{formatCount(row.mqls)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </>
  )
}
