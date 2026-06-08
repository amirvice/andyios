import React, { useState } from 'react'
import { describirProducto } from '../data/opciones.js'

// Buscador de productos: la lista NO se muestra hasta que escribes o pulsas la 🔍.
// Busca por modelo, talla, color, tipo (iPhone / zapato / otro), etc.
export default function BuscadorProductos({ productos, renderItem, placeholder = 'Buscar por modelo, talla, tipo…', vacioTexto = 'No hay productos disponibles.' }) {
  const [q, setQ] = useState('')
  const [verTodos, setVerTodos] = useState(false)

  const texto = q.trim().toLowerCase()
  const mostrar = texto !== '' || verTodos

  const filtrados = productos.filter((p) => {
    if (!mostrar) return false
    const d = describirProducto(p)
    const blob = `${d.titulo} ${d.sub} ${d.detalles} ${p.tipo} ${p.categoria || ''} ${p.talla || ''} ${p.etiqueta || ''}`.toLowerCase()
    return blob.includes(texto)
  })

  if (productos.length === 0) return <div className="note">{vacioTexto}</div>

  return (
    <div className="buscador-prod">
      <div className="bp-bar">
        <input placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <button type="button" className={'bp-lupa' + (verTodos ? ' on' : '')} title="Ver todos" onClick={() => setVerTodos((v) => !v)}>🔍</button>
      </div>

      {!mostrar ? (
        <div className="bp-hint">Escribe para buscar, o pulsa la <b>🔍</b> para ver todo el inventario.</div>
      ) : filtrados.length === 0 ? (
        <div className="note">Sin resultados para “{q}”.</div>
      ) : (
        <div className="bp-lista">{filtrados.map((p) => renderItem(p))}</div>
      )}
    </div>
  )
}
