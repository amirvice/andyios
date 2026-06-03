import React, { useEffect, useState } from 'react'
import { useSettings, fmtBs } from '../settings.jsx'
import { exportarRespaldo, importarRespaldo, descargarCSV } from '../backup.js'
import { listarProductos, listarVentas } from '../productos.js'
import { describirProducto } from '../data/opciones.js'

export default function Ajustes() {
  const { settings, actualizar, cargado } = useSettings()
  const [tasa, setTasa] = useState('')
  const [nombre, setNombre] = useState('')
  const [guardado, setGuardado] = useState(false)

  // Cuando cargan los ajustes desde disco, rellenamos el formulario.
  useEffect(() => {
    if (cargado) {
      setTasa(settings.tasaBs ? String(settings.tasaBs) : '')
      setNombre(settings.nombreLocal || '')
    }
  }, [cargado, settings])

  async function guardar(e) {
    e.preventDefault()
    await actualizar({
      tasaBs: parseFloat(tasa) || 0,
      nombreLocal: nombre.trim() || 'AndyiOS'
    })
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  const tasaNum = parseFloat(tasa) || 0
  const [aviso, setAviso] = useState('')

  async function exportar() {
    const r = await exportarRespaldo()
    if (r.browser) setAviso('El respaldo solo funciona en la app de escritorio.')
    else if (r.ok) setAviso('✓ Respaldo guardado correctamente.')
    if (r.browser || r.ok) setTimeout(() => setAviso(''), 3000)
  }
  async function importar() {
    if (!window.confirm('Importar un respaldo REEMPLAZA todos tus datos actuales. ¿Continuar?')) return
    const r = await importarRespaldo()
    if (r.browser) { setAviso('La importación solo funciona en la app de escritorio.'); setTimeout(() => setAviso(''), 3000) }
    else if (r.ok) { setAviso('✓ Datos importados. Recargando…'); setTimeout(() => window.location.reload(), 900) }
  }
  async function exportarInventarioCSV() {
    const prods = await listarProductos()
    descargarCSV('andyios-inventario.csv', [
      { titulo: 'Producto', valor: (p) => describirProducto(p).titulo },
      { titulo: 'Tipo', valor: (p) => p.tipo },
      { titulo: 'Detalles', valor: (p) => describirProducto(p).detalles },
      { titulo: 'Estado', valor: (p) => p.estado },
      { titulo: 'Costo (USD)', valor: (p) => p.precio_costo },
      { titulo: 'Precio potencial (USD)', valor: (p) => p.precio_potencial }
    ], prods)
  }
  async function exportarVentasCSV() {
    const ventas = await listarVentas()
    descargarCSV('andyios-ventas.csv', [
      { titulo: 'Fecha', valor: (v) => new Date(v.fecha).toLocaleDateString('es-VE') },
      { titulo: 'Producto', valor: (v) => (v.producto ? describirProducto(v.producto).titulo : '—') },
      { titulo: 'Tipo', valor: (v) => v.tipo_operacion },
      { titulo: 'Cliente', valor: (v) => (v.cliente ? v.cliente.nombre : '') },
      { titulo: 'Precio final (USD)', valor: (v) => v.precio_final },
      { titulo: 'Ganancia (USD)', valor: (v) => v.ganancia }
    ], ventas)
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Ajustes</h1><div className="sub">Configuración general de la app</div></div>
      </div>

      <div className="content">
        <form className="card-form" onSubmit={guardar}>
          <h3>Moneda</h3>
          <label>Tasa del día — bolívares por 1 dólar (USD)</label>
          <div className="tasa-input">
            <span>1 USD =</span>
            <input
              type="number" min="0" step="0.01" inputMode="decimal"
              placeholder="Ej. 110.50" value={tasa}
              onChange={(e) => setTasa(e.target.value)}
            />
            <span>Bs</span>
          </div>
          {tasaNum > 0 && (
            <p className="ejemplo">Ejemplo: un equipo de $500 equivale a <b>{fmtBs(500, tasaNum)}</b></p>
          )}
          {tasaNum <= 0 && (
            <p className="ejemplo muted">Sin tasa, los montos se muestran solo en dólares.</p>
          )}

          <h3 style={{ marginTop: 28 }}>Apariencia</h3>
          <label>Tema de la aplicación</label>
          <div className="seg">
            <button type="button" className={settings.tema !== 'oscuro' ? 'on' : ''}
              onClick={() => actualizar({ tema: 'claro' })}>☀️ Claro</button>
            <button type="button" className={settings.tema === 'oscuro' ? 'on' : ''}
              onClick={() => actualizar({ tema: 'oscuro' })}>🌙 Oscuro</button>
          </div>

          <h3 style={{ marginTop: 28 }}>General</h3>
          <label>Nombre del local</label>
          <input
            type="text" placeholder="AndyiOS" value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Guardar cambios</button>
            {guardado && <span className="ok">✓ Guardado</span>}
          </div>
        </form>

        <div className="card-form" style={{ marginTop: 20 }}>
          <h3>Respaldo y datos</h3>
          <p className="ejemplo muted" style={{ marginTop: 0 }}>
            Tus datos se guardan en este equipo. Haz respaldos con frecuencia, sobre todo antes de cambiar de computadora.
          </p>
          <div className="backup-acciones">
            <button type="button" className="btn btn-primary" onClick={exportar}>⤓ Exportar respaldo (.sqlite)</button>
            <button type="button" className="btn btn-ghost" onClick={importar}>⤒ Importar respaldo</button>
          </div>
          <div className="backup-acciones" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={exportarInventarioCSV}>📄 Inventario a CSV</button>
            <button type="button" className="btn btn-ghost" onClick={exportarVentasCSV}>📄 Ventas a CSV</button>
          </div>
          {aviso && <p className="ejemplo" style={{ color: 'var(--azul)' }}>{aviso}</p>}
        </div>

        <div className="note">La tasa y los ajustes se guardan en tu computadora y se usan en todas las pantallas.</div>
      </div>
    </>
  )
}
