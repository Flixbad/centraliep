/**
 * Génère et télécharge un fichier CSV à partir d'un tableau d'objets.
 * @param {Array<Object>} data - Liste d'objets (clés = colonnes)
 * @param {string} filename - Nom du fichier sans extension
 * @param {string[]} columns - [['key', 'Label affiché'], ...] pour l'ordre et les en-têtes
 */
export function downloadCsv(data, filename, columns) {
  if (!data.length) return
  const BOM = '\uFEFF'
  const headers = columns.map(([, label]) => escapeCsvCell(label))
  const rows = data.map((row) =>
    columns.map(([key]) => escapeCsvCell(row[key] == null ? '' : String(row[key])))
  )
  const csv = [headers, ...rows].map((r) => r.join(';')).join('\n')
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCsvCell(str) {
  const s = String(str)
  if (/[;\r\n"]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * Copie du texte dans le presse-papier. Retourne true si OK.
 */
export async function copyToClipboard(text) {
  if (!text || !navigator.clipboard) return false
  try {
    await navigator.clipboard.writeText(String(text))
    return true
  } catch {
    return false
  }
}
