import {useState} from 'react'
import {formatCount} from '../engine/format'
import {productGroupLabels} from '../engine/labels'
import {icpName, type EngineModel} from '../engine/model'
import {
  CREDIBLE_RIGHT_TO_WIN,
  HIGH_COMPLEXITY_THRESHOLD,
  HIGH_POTENTIAL_THRESHOLD,
  nextBestActions,
  quadrantLabels,
  quadrantStances,
  rightToWinScore,
  roundScore,
  scoreAttractiveness,
  type AttractivenessQuadrant,
  type RightToWinInput,
} from '../engine/scoring'
import {Badge, Section, Stat, Stats} from '../ui'

const RIGHT_TO_WIN: {key: keyof RightToWinInput; label: string}[] = [
  {key: 'capabilityFit', label: 'Capability fit'},
  {key: 'geographicFit', label: 'Geographic fit'},
  {key: 'propositionFit', label: 'Proposition fit'},
  {key: 'relationshipAccess', label: 'Relationship access'},
  {key: 'economicFit', label: 'Economic fit'},
]

const quadrantTone: Record<AttractivenessQuadrant, 'good' | 'info' | 'warn' | 'neutral'> = {
  'priority-focus': 'good',
  selective: 'info',
  'attractive-exception': 'warn',
  'efficient-serve': 'neutral',
}

export function ScorerTab({model}: {model: EngineModel}) {
  const [revenue, setRevenue] = useState(250_000_000)
  const [globalCountries, setGlobalCountries] = useState(18)
  const [vistraCountries, setVistraCountries] = useState(3)
  const [groups, setGroups] = useState<string[]>(['entity-cosec', 'payroll'])
  const [isIcpFit, setIsIcpFit] = useState(true)
  const [rightToWin, setRightToWin] = useState<RightToWinInput>({capabilityFit: true, geographicFit: true, propositionFit: true})

  const score = scoreAttractiveness({globalRevenue: revenue, globalCountries, vistraCountries, productGroups: groups.length})
  const rtw = rightToWinScore(rightToWin)
  const stance = quadrantStances[score.quadrant]
  const actions = nextBestActions({globalRevenue: revenue, globalCountries, vistraCountries, productGroups: groups.length, productGroupValues: groups, isIcpFit})
  const toggleGroup = (value: string) => setGroups((current) => (current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]))
  const accounts = [...model.accounts].sort((first, second) => (second.scores?.potential ?? 0) - (first.scores?.potential ?? 0))

  return (
    <>
      <div className="grid-2">
        <Section title="Score a client" note="Simon-Kucher client attractiveness (brief §7). Revenue in USD, as in the Salesforce data.">
          <div className="form">
            <label>
              Global revenue (USD)
              <input type="number" min={0} step={1_000_000} value={revenue} onChange={(event) => setRevenue(Number(event.target.value))} />
            </label>
            <label>
              Countries the client operates in
              <input type="number" min={1} value={globalCountries} onChange={(event) => setGlobalCountries(Number(event.target.value))} />
            </label>
            <label>
              Countries Vistra serves today
              <input type="number" min={0} value={vistraCountries} onChange={(event) => setVistraCountries(Number(event.target.value))} />
            </label>
            <fieldset>
              <legend>Product groups Vistra serves today ({groups.length})</legend>
              {Object.entries(productGroupLabels).map(([value, label]) => (
                <label key={value} className="check">
                  <input type="checkbox" checked={groups.includes(value)} onChange={() => toggleGroup(value)} /> {label}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Right to win ({rtw} of 5)</legend>
              {RIGHT_TO_WIN.map((entry) => (
                <label key={entry.key} className="check">
                  <input type="checkbox" checked={Boolean(rightToWin[entry.key])} onChange={(event) => setRightToWin((current) => ({...current, [entry.key]: event.target.checked}))} /> {entry.label}
                </label>
              ))}
            </fieldset>
            <label className="check">
              <input type="checkbox" checked={isIcpFit} onChange={(event) => setIsIcpFit(event.target.checked)} /> Fits one of the five ICPs
            </label>
          </div>
        </Section>
        <Section title="Result">
          <Stats>
            <Stat label="Potential" value={roundScore(score.potential)} detail={`high from ${HIGH_POTENTIAL_THRESHOLD} · 0.7 revenue + 0.3 countries`} />
            <Stat label="Complexity" value={roundScore(score.complexity)} detail={`high from ${HIGH_COMPLEXITY_THRESHOLD} · 0.5 Vistra countries + 0.5 products`} />
            <Stat label="Right to win" value={`${rtw}/5`} detail={rtw >= CREDIBLE_RIGHT_TO_WIN ? 'credible' : `credible from ${CREDIBLE_RIGHT_TO_WIN}`} />
          </Stats>
          <p>
            <Badge tone={quadrantTone[score.quadrant]}>{quadrantLabels[score.quadrant]}</Badge> <strong>{stance.stance}</strong>
          </p>
          <ul className="plain-list">
            {stance.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <h4>Next-best actions</h4>
          {actions.length ? (
            <ul className="plain-list">
              {actions.map((action) => (
                <li key={action.pattern}>
                  <strong>{action.action}</strong> <span className="muted">({action.pattern})</span>
                  <br />
                  {action.logic}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">None of the four starting rules applies.</p>
          )}
        </Section>
      </div>
      <Section title="Scored accounts" note="Stored on account documents in gtm-brain, with the same formulas.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>ICP</th>
                <th className="num">Revenue (USD)</th>
                <th className="num">Countries</th>
                <th className="num">Vistra countries</th>
                <th className="num">Products</th>
                <th className="num">Potential</th>
                <th className="num">Complexity</th>
                <th className="num">Right to win</th>
                <th>Quadrant</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const quadrant = account.scores?.quadrant as AttractivenessQuadrant | undefined
                return (
                  <tr key={account._id}>
                    <td>{account.title}</td>
                    <td>{account.icp ? icpName(model.icps.find((icp) => icp._id === account.icp?._ref)) : '—'}</td>
                    <td className="num">{formatCount(account.inputs?.revenueUsd)}</td>
                    <td className="num">{formatCount(account.inputs?.globalCountries)}</td>
                    <td className="num">{formatCount(account.inputs?.vistraCountries)}</td>
                    <td className="num">{formatCount(account.inputs?.productGroups)}</td>
                    <td className="num">{formatCount(account.scores?.potential)}</td>
                    <td className="num">{formatCount(account.scores?.complexity)}</td>
                    <td className="num">{formatCount(account.scores?.rightToWin)}</td>
                    <td>{quadrant ? <Badge tone={quadrantTone[quadrant]}>{quadrantLabels[quadrant]}</Badge> : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  )
}
