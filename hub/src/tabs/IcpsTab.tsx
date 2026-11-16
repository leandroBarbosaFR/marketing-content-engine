import {GTM_WORKSPACE, studioEditUrl, WEBSITE_WORKSPACE} from '../config'
import {formatCount, formatGbp, formatShare} from '../engine/format'
import {stageLabels} from '../engine/labels'
import {icpCards, type EngineModel} from '../engine/model'
import {Badge, StudioLink} from '../ui'

export function IcpsTab({model}: {model: EngineModel}) {
  const cards = icpCards(model)
  return (
    <div className="card-grid">
      {cards.map((card) => (
        <article key={card.icp._id} className="icp-card">
          <header>
            <h3>{card.name}</h3>
            <StudioLink href={studioEditUrl(WEBSITE_WORKSPACE, card.icp._id, 'icp')} />
          </header>
          {card.icp.clientPhrase ? <blockquote>“{card.icp.clientPhrase}”</blockquote> : null}
          <dl className="facts">
            {card.icp.situation ? (
              <>
                <dt>Situation</dt>
                <dd>{card.icp.situation}</dd>
              </>
            ) : null}
            {card.icp.need ? (
              <>
                <dt>Need</dt>
                <dd>{card.icp.need}</dd>
              </>
            ) : null}
            {card.icp.triggers?.length ? (
              <>
                <dt>Triggers</dt>
                <dd>{card.icp.triggers.join(' · ')}</dd>
              </>
            ) : null}
            {card.icp.pathway?.length ? (
              <>
                <dt>Service pathway</dt>
                <dd>{card.icp.pathway.join(' → ')}</dd>
              </>
            ) : null}
          </dl>
          <div className="mini-stats">
            <span>
              <strong>{formatGbp(card.spend)}</strong> paid ({formatShare(card.share, 1, 0)})
            </span>
            <span>
              <strong>{card.campaignCount}</strong> campaigns
            </span>
            <span>
              <strong>{formatCount(card.mqls)}</strong> MQLs
            </span>
            <span>
              <strong>{formatGbp(card.pipeline)}</strong> pipeline
            </span>
            <span>
              <strong>{card.livePieces}</strong> live pieces
            </span>
            <span>
              <strong>{card.priorityAccounts}</strong> of {card.accountCount} accounts priority focus
            </span>
          </div>
          <div className="badges">
            {card.gapStages.length ? (
              card.gapStages.map((stage) => (
                <Badge key={stage} tone="bad">
                  No live {stageLabels[stage] ?? stage} content
                </Badge>
              ))
            ) : (
              <Badge tone="good">Content at every stage</Badge>
            )}
          </div>
          {card.priorityMarkets.length ? <p className="muted small">Priority markets: {card.priorityMarkets.join(', ')}</p> : null}
          {card.programmes.length ? (
            <p className="muted small">
              Programmes:{' '}
              {card.programmes.map((programme, index) => (
                <span key={programme._id}>
                  {index ? ', ' : ''}
                  <a href={studioEditUrl(GTM_WORKSPACE, programme._id, 'programme')} target="_blank" rel="noreferrer">
                    {programme.title}
                  </a>
                </span>
              ))}
            </p>
          ) : null}
          {card.pillars.length ? (
            <ul className="plain-list small">
              {card.pillars.map((pillar) => (
                <li key={pillar._id}>
                  <strong>{pillar.title}</strong> {pillar.coreMessage ? `— ${pillar.coreMessage}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  )
}
