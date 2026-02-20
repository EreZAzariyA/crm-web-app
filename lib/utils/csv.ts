/**
 * Exports an array of objects to a CSV file and triggers a browser download.
 * @param data     - Array of row objects
 * @param filename - Output filename (e.g. "contacts.csv")
 * @param headers  - Optional map of key → column header label
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: Partial<Record<keyof T, string>>
): void {
  if (data.length === 0) return

  const keys = Object.keys(data[0]) as (keyof T)[]

  // Build header row
  const headerRow = keys
    .map((k) => csvCell(String(headers?.[k] ?? k)))
    .join(',')

  // Build data rows
  const rows = data.map((row) =>
    keys.map((k) => csvCell(String(row[k] ?? ''))).join(',')
  )

  const csv = [headerRow, ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Wraps a cell value in quotes if it contains commas, quotes, or newlines. */
function csvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
