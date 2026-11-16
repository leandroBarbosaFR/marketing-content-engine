import {GTM_WORKSPACE, studioEditUrl, WEBSITE_WORKSPACE} from '../config'
import {formatCount, formatGbp} from '../engine/format'
import {businessUnitLabels, planMetricLabels} from '../engine/labels'
import {icpName, strategyView, type EngineModel} from '../engine/model'
import {Badge, Empty, Section, Stat, Stats} from '../ui'

const today = () => new Date().toISOString().slice(0, 10)

function Progress({actual, target, money}: {actual: number; target?: number; money?: boolean}) {
  const format = money ? formatGbp : formatCount
  if (!target) return <>{format(actual)}</>
  const ratio = actual / target
  return (
    <>
      {format(actual)} <span className="muted">/ {format(target)}</span>{' '}
      <Badge tone={ratio >= 1 ? 'good' : ratio >= 0.5 ? 'info' : 'warn'}>{Math.round(100 * ratio)}%</Badge>
    </>
  )
}

export function StrategyTab({model}: {model: EngineModel}) {
  const view = strategyView(model, today())
  return (
    <>
      {view.plan ? (
        <Section title={view.plan.title ?? 'Annual plan'} note="Programmes roll up to the plan; campaign results roll up to programmes.">
          <Stats>
            <Stat label="Fiscal year" value={view.plan.fiscalYear ?? '—'} />
            <Stat
              label="Budget"
              value={formatGbp(view.planBudget)}
              detail={view.plan.budgets?.map((budget) => `${businessUnitLabels[budget.businessUnit ?? ''] ?? budget.businessUnit} ${formatGbp(budget.amount)}`).join(' · ')}
            />
            {view.plan.goals?.map((goal) => (
              <Stat key={goal._key ?? goal.metric} label={planMetricLabels[goal.metric ?? ''] ?? goal.metric ?? 'Goal'} value={goal.metric === 'pipeline' ? formatGbp(goal.value) : goal.metric === 'icp-spend-share' ? `${formatCount(goal.value)}%` : formatCount(goal.value)} />
            ))}
          </Stats>
        </Section>
      ) : (
        <Empty>No annual plan yet. Create one in the gtm-brain workspace.</Empty>
      )}
      <Section title="Programmes">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Programme</th>
                <th>ICP</th>
                <th>Market</th>
                <th>Solutions</th>
                <th className="num">Campaigns</th>
                <th className="num">Budget</th>
                <th className="num">Spend</th>
                <th className="num">MQLs</th>
                <th className="num">Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {view.programmes.map((row) => (
                <tr key={row.programme._id}>
                  <td>
                    <a href={studioEditUrl(GTM_WORKSPACE, row.programme._id, 'programme')} target="_blank" rel="noreferrer">
                      {row.programme.title}
                    </a>
                  </td>
                  <td>{row.icp ?? '—'}</td>
                  <td>{row.market ?? '—'}</td>
                  <td className="small">{row.solutions.join(', ') || '—'}</td>
                  <td className="num">{row.campaigns.length}</td>
                  <td className="num">{formatGbp(row.programme.budget)}</td>
                  <td className="num">
                    <Progress actual={row.spend} target={row.programme.budget} money />
                  </td>
                  <td className="num">
                    <Progress actual={row.mqls} target={row.targets.mqls} />
                  </td>
                  <td className="num">
                    <Progress actual={row.pipeline} target={row.targets.pipeline} money />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Messaging by ICP and solution" note="Approved messaging pillars. Writers and agents draw claims from here.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ICP</th>
                {model.solutions.map((solution) => (
                  <th key={solution._id}>{solution.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.messaging.map((row) => (
                <tr key={row.icp._id}>
                  <td>{icpName(row.icp)}</td>
                  {model.solutions.map((solution) => (
                    <td key={solution._id} className={row.bySolution[solution._id]?.length ? 'small' : 'small is-empty'}>
                      {row.bySolution[solution._id]?.map((pillar) => (
                        <div key={pillar._id}>
                          <strong>{pillar.title}</strong>
                          {pillar.approvedClaims?.length ? <span className="muted"> · {pillar.approvedClaims.length} approved claim{pillar.approvedClaims.length === 1 ? '' : 's'}</span> : null}
                        </div>
                      )) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <div className="grid-2">
        <Section title="Proof points" note="Expired proof still used by live content is flagged.">
          <table>
            <tbody>
              {view.proofPoints.map((row) => (
                <tr key={row.proofPoint._id}>
                  <td>
                    <a href={studioEditUrl(WEBSITE_WORKSPACE, row.proofPoint._id, 'proofPoint')} target="_blank" rel="noreferrer">
                      {row.proofPoint.title}
                    </a>
                    <div className="muted small">{row.markets.length ? row.markets.join(', ') : 'All markets'}</div>
                  </td>
                  <td>
                    {row.isExpired ? <Badge tone={row.liveUses ? 'bad' : 'warn'}>Expired {row.proofPoint.expiresAt}</Badge> : <Badge tone="good">Valid</Badge>}
                  </td>
                  <td className="num">{row.liveUses} live use{row.liveUses === 1 ? '' : 's'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="Competitors">
          {view.competitors.map((competitor) => (
            <div key={competitor._id} className="competitor">
              <strong>{competitor.title}</strong>
              {competitor.positioning ? <p className="small">{competitor.positioning}</p> : null}
              <p className="small muted">
                {competitor.winThemes?.length ? `We win on: ${competitor.winThemes.join(', ')}. ` : ''}
                {competitor.lossThemes?.length ? `We lose on: ${competitor.lossThemes.join(', ')}.` : ''}
              </p>
            </div>
          ))}
        </Section>
      </div>
    </>
  )
}
