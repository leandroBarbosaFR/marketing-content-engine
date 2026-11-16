import {formatGbpShort, monthShort} from '../engine/format'
import {campaignStageLabels, channelLabels, tacticLabels, TACTIC_KINDS} from '../engine/labels'
import {icpName, orchestrationView, type EngineModel} from '../engine/model'
import {Empty, InterpretationNote, Section} from '../ui'

const STAGE_ORDER = ['planned', 'live', 'paused', 'ended']

export function OrchestrationTab({model}: {model: EngineModel}) {
  const view = orchestrationView(model)
  const usedKinds = TACTIC_KINDS.filter((kind) => view.assetUse.some((entry) => entry.uses[kind]))
  return (
    <>
      <InterpretationNote>
        The prototype’s Orchestration screen was not available. This tab is built from the brief’s step 4: which asset runs
        where, for which ICP, through which channel, and where each campaign stands.
      </InterpretationNote>
      <Section title="ICP × channel" note={`Campaigns per cell, with ${monthShort(model.latestMonth)} spend.`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ICP</th>
                {view.channels.map((channel) => (
                  <th key={channel} className="num">
                    {channelLabels[channel] ?? channel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.icpByChannel.map((row) => (
                <tr key={row.icp._id}>
                  <td>{icpName(row.icp)}</td>
                  {view.channels.map((channel) => {
                    const cell = row.cells[channel]
                    return (
                      <td key={channel} className={cell?.campaigns ? 'num' : 'num is-empty'}>
                        {cell?.campaigns ? (
                          <>
                            {cell.campaigns} <span className="muted">· {formatGbpShort(cell.latestSpend)}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Asset reuse" note="Each live content piece and the campaign tactics that carry it.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Content piece</th>
                {usedKinds.map((kind) => (
                  <th key={kind} className="num">
                    {tacticLabels[kind]}
                  </th>
                ))}
                <th>Campaigns</th>
              </tr>
            </thead>
            <tbody>
              {view.assetUse.map((entry) => (
                <tr key={entry.piece._id}>
                  <td>{entry.piece.title}</td>
                  {usedKinds.map((kind) => (
                    <td key={kind} className="num">
                      {entry.uses[kind] || '—'}
                    </td>
                  ))}
                  <td className="small">{entry.campaigns.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {view.unusedLivePieces.length ? (
          <p className="muted small">
            Live but used by no campaign: {view.unusedLivePieces.map((piece) => piece.title).join(' · ')}
          </p>
        ) : null}
      </Section>
      <Section title="Campaigns by stage">
        <div className="board">
          {STAGE_ORDER.map((stage) => (
            <div key={stage} className="board-column">
              <h4>
                {campaignStageLabels[stage]} <span className="muted">{view.byStage[stage]?.length ?? 0}</span>
              </h4>
              {view.byStage[stage]?.length ? (
                view.byStage[stage].map((campaign) => (
                  <div key={campaign._id} className="board-card mono">
                    {campaign.title}
                  </div>
                ))
              ) : (
                <Empty>None</Empty>
              )}
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}
