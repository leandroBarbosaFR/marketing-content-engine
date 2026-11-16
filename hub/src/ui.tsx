import type {ReactNode} from 'react'

// Small presentational pieces shared by the tabs. Charts are plain HTML bars: the brief asks for
// the numbers, not a charting library.

export function Section({title, note, actions, children}: {title: string; note?: ReactNode; actions?: ReactNode; children: ReactNode}) {
  return (
    <section className="section">
      <header className="section-header">
        <div>
          <h3>{title}</h3>
          {note ? <p className="muted">{note}</p> : null}
        </div>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}

export function Stat({label, value, detail}: {label: string; value: ReactNode; detail?: ReactNode}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {detail ? <span className="stat-detail">{detail}</span> : null}
    </div>
  )
}

export function Stats({children}: {children: ReactNode}) {
  return <div className="stats">{children}</div>
}

export function Badge({tone = 'neutral', children}: {tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info'; children: ReactNode}) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Callout({tone = 'info', title, children}: {tone?: 'info' | 'warn'; title?: string; children: ReactNode}) {
  return (
    <div className={`callout callout-${tone}`}>
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </div>
  )
}

// Labels a screen the brief does not describe in detail, so nobody mistakes it for the prototype.
export function InterpretationNote({children}: {children: ReactNode}) {
  return (
    <Callout tone="warn" title="Interpretation">
      {children}
    </Callout>
  )
}

export function BarList({rows, format}: {rows: {key: string; label: ReactNode; value: number; detail?: ReactNode; muted?: boolean}[]; format: (value: number) => string}) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="bar-list">
      {rows.map((row) => (
        <div key={row.key} className={row.muted ? 'bar-row is-muted' : 'bar-row'}>
          <span className="bar-label">{row.label}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{width: `${(100 * row.value) / max}%`}} />
          </span>
          <span className="bar-value">
            {format(row.value)}
            {row.detail ? <span className="muted"> {row.detail}</span> : null}
          </span>
        </div>
      ))}
    </div>
  )
}

const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)']

export function StackedColumns({
  columns,
  series,
  format,
}: {
  columns: {key: string; label: string; values: Record<string, number>}[]
  series: {key: string; label: string}[]
  format: (value: number) => string
}) {
  const max = Math.max(1, ...columns.map((column) => series.reduce((total, entry) => total + (column.values[entry.key] ?? 0), 0)))
  return (
    <div className="columns-chart">
      <div className="legend">
        {series.map((entry, index) => (
          <span key={entry.key}>
            <i style={{background: SERIES[index % SERIES.length]}} /> {entry.label}
          </span>
        ))}
      </div>
      <div className="columns">
        {columns.map((column) => {
          const total = series.reduce((sum, entry) => sum + (column.values[entry.key] ?? 0), 0)
          return (
            <div key={column.key} className="column">
              <span className="column-total">{format(total)}</span>
              <div className="column-bar">
                {series.map((entry, index) => (
                  <span
                    key={entry.key}
                    title={`${entry.label}: ${format(column.values[entry.key] ?? 0)}`}
                    style={{height: `${(100 * (column.values[entry.key] ?? 0)) / max}%`, background: SERIES[index % SERIES.length]}}
                  />
                ))}
              </div>
              <span className="column-label">{column.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Empty({children}: {children: ReactNode}) {
  return <p className="empty">{children}</p>
}

export function StudioLink({href, children = 'Open in Studio'}: {href?: string; children?: ReactNode}) {
  if (!href) return null
  return (
    <a className="studio-link" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], {type: 'text/csv;charset=utf-8'}))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
