// Display helpers. Money is in GBP, as in the brief.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function formatGbp(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `£${Math.round(value).toLocaleString('en-GB')}`
}

export function formatGbpShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}m`
  if (Math.abs(value) >= 1000) return `£${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
  return formatGbp(value)
}

export function formatCount(value: number | null | undefined, fractionDigits = 0): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return value.toLocaleString('en-GB', {minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits})
}

export function formatShare(part: number, whole: number, fractionDigits = 1): string {
  if (!whole) return '—'
  return `${((100 * part) / whole).toFixed(fractionDigits)}%`
}

export function monthShort(month: string | undefined): string {
  if (!month) return '—'
  return MONTHS.at(Number(month.slice(5, 7)) - 1) ?? month
}

export function monthLong(month: string | undefined): string {
  if (!month) return '—'
  return `${LONG_MONTHS.at(Number(month.slice(5, 7)) - 1) ?? month} ${month.slice(0, 4)}`
}

export function describePeriod(months: string[]): string {
  if (!months.length) return 'no results yet'
  const first = months[0]
  const last = months.at(-1)!
  return first === last ? monthLong(first) : `${monthShort(first)} to ${monthLong(last)}`
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const quote = (value: string | number | null | undefined) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return [header, ...rows].map((row) => row.map(quote).join(',')).join('\r\n')
}
