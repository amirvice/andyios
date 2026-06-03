// Respaldo / exportación de datos.
const tieneAndy = typeof window !== 'undefined' && window.andy

export async function exportarRespaldo() {
  if (tieneAndy) return window.andy.exportarRespaldo()
  return { ok: false, browser: true }
}
export async function importarRespaldo() {
  if (tieneAndy) return window.andy.importarRespaldo()
  return { ok: false, browser: true }
}

// Genera y descarga un CSV en el navegador/Electron.
export function descargarCSV(nombreArchivo, columnas, filas) {
  const escapar = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const head = columnas.map((c) => escapar(c.titulo)).join(',')
  const cuerpo = filas.map((f) => columnas.map((c) => escapar(c.valor(f))).join(',')).join('\n')
  const csv = '﻿' + head + '\n' + cuerpo // BOM para que Excel reconozca acentos
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombreArchivo
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
