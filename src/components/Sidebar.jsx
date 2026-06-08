import React from 'react'
import { useSettings } from '../settings.jsx'

const ITEMS = [
  { id: 'dashboard', ico: '📊', label: 'Dashboard' },
  { id: 'inventario', ico: '📦', label: 'Inventario' },
  { id: 'ventas', ico: '💳', label: 'Ventas' },
  { id: 'cambios', ico: '🔄', label: 'Cambios' },
  { id: 'zapatos', ico: '👟', label: 'Zapatos' },
  { id: 'clientes', ico: '👥', label: 'Clientes' },
  { id: 'caja', ico: '💵', label: 'Caja' },
  { id: 'reportes', ico: '📈', label: 'Reportes' }
]

export default function Sidebar({ vista, setVista }) {
  const { settings, actualizar } = useSettings()
  const oscuro = settings.tema === 'oscuro'

  function alternarTema() {
    actualizar({ tema: oscuro ? 'claro' : 'oscuro' })
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">A</div>
        <b>{settings.nombreLocal || 'AndyiOS'}</b>
      </div>

      <div className="nav-label">Menú</div>
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={'nav-item' + (vista === it.id ? ' active' : '')}
          onClick={() => setVista(it.id)}
        >
          <span className="ico">{it.ico}</span>{it.label}
        </button>
      ))}

      <div className="spacer" />

      <button className="nav-item" onClick={alternarTema}>
        <span className="ico">{oscuro ? '☀️' : '🌙'}</span>{oscuro ? 'Modo claro' : 'Modo oscuro'}
      </button>
      <button
        className={'nav-item' + (vista === 'ajustes' ? ' active' : '')}
        onClick={() => setVista('ajustes')}
      >
        <span className="ico">⚙️</span>Ajustes
      </button>
      <div className="me">
        <div className="av">👤</div>
        <div><b style={{ fontSize: 13 }}>Andy</b><br /><small>Local · Mac</small></div>
      </div>
    </aside>
  )
}
