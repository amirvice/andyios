import React, { useEffect, useState } from 'react'
import { useSettings, fmtUSD, fmtBs } from '../settings.jsx'
import { listarProductos, listarVentas, registrarVenta } from '../productos.js'
import { iconoProducto, describirProducto } from '../data/opciones.js'
import ClientePicker from '../components/ClientePicker.jsx'

export default function Ventas() {
  const { settings } = useSettings()
  const tasa = settings.tasaBs
  const [disponibles, setDisponibles] = useState([])
  const [ventas, setVentas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [sel, setSel] = useState(null)

  async function recargar() {
    const prods = await listarProductos()
    setDisponibles(prods.filter((p) => p.estado === 'Disponible'))
    setVentas(await listarVentas())
  }
  useEffect(() => { recargar() }, [])

  const filtrados = disponibles.filter((p) => {
    if (!busqueda) return true
    const d = describirProducto(p)
    return `${d.titulo} ${d.sub} ${d.detalles}`.toLowerCase().includes(busqueda.toLowerCase())
  })

  return (
    <>
      <div className="topbar">
        <div><h1>Ventas</h1><div className="sub">{disponibles.length} disponibles · {ventas.length} ventas registradas</div></div>
      </div>

      <div className="content">
        <div className="grid2">
          {/* Productos disponibles para vender */}
          <div className="panel">
            <h3>Vender un producto</h3>
            <div style={{ padding: '12px 16px' }}>
              <div className="search"><input placeholder="Buscar producto disponible…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
            </div>
            {filtrados.length === 0 ? (
              <div className="note">No hay productos disponibles para vender.</div>
            ) : filtrados.map((p) => {
              const d = describirProducto(p)
              return (
                <div className="row" key={p.id}>
                  <div className="thumb">{p.foto ? <img src={p.foto} alt="" className="thumb-img" /> : iconoProducto(p)}</div>
                  <div className="info"><b>{d.titulo}</b><small>{d.detalles || d.sub}</small></div>
                  <div className="price"><b>{fmtUSD(p.precio_potencial)}</b><small>costo {fmtUSD(p.precio_costo)}</small></div>
                  <button className="btn btn-primary btn-sm" onClick={() => setSel(p)}>Vender</button>
                </div>
              )
            })}
          </div>

          {/* Historial de ventas */}
          <div className="panel">
            <h3>Ventas recientes</h3>
            {ventas.length === 0 ? (
              <div className="empty" style={{ border: 'none', boxShadow: 'none', padding: '40px 20px' }}>
                <div className="empty-ico">💳</div><b>Aún no hay ventas</b>
                <p>Vende un producto para registrar tu primera venta.</p>
              </div>
            ) : ventas.map((v) => {
              const d = v.producto ? describirProducto(v.producto) : { titulo: 'Producto eliminado', detalles: '' }
              return (
                <div className="row" key={v.id}>
                  <div className="thumb">{v.producto ? iconoProducto(v.producto) : '❓'}</div>
                  <div className="info">
                    <b>{d.titulo} {v.tipo_operacion === 'cambio' && <span className="badge cambio">cambio</span>}</b>
                    <small>{new Date(v.fecha).toLocaleDateString('es-VE')} · venta {fmtUSD(v.precio_final)}{v.cliente ? ` · 👤 ${v.cliente.nombre}` : ''}</small>
                  </div>
                  <div className="price"><b className={v.ganancia >= 0 ? 'gain' : 'loss'}>{v.ganancia >= 0 ? '+' : ''}{fmtUSD(v.ganancia)}</b><small>ganancia</small></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {sel && <VenderModal producto={sel} tasa={tasa} onClose={() => setSel(null)} onHecho={() => { setSel(null); recargar() }} />}
    </>
  )
}

function VenderModal({ producto, tasa, onClose, onHecho }) {
  const d = describirProducto(producto)
  const [precio, setPrecio] = useState(String(producto.precio_potencial || ''))
  const [clienteId, setClienteId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const pf = parseFloat(precio) || 0
  const ganancia = pf - (Number(producto.precio_costo) || 0)

  async function confirmar() {
    setGuardando(true)
    await registrarVenta({ producto_id: producto.id, precio_final: pf, cliente_id: clienteId })
    setGuardando(false)
    onHecho()
  }

  return (
    <div className="overlay show" onClick={(e) => { if (e.target.classList.contains('overlay')) onClose() }}>
      <div className="modal modal-wide">
        <h2>Registrar venta</h2>
        <div className="venta-prod">
          <div className="thumb">{producto.foto ? <img src={producto.foto} alt="" className="thumb-img" /> : iconoProducto(producto)}</div>
          <div><b>{d.titulo}</b><br /><small>{d.detalles || d.sub}</small></div>
        </div>

        <label className="campo">Precio final de venta (USD) — editable para rebajas
          <input type="number" min="0" step="1" value={precio} onChange={(e) => setPrecio(e.target.value)} autoFocus />
        </label>
        <div className="venta-info">
          <span>Costo: <b>{fmtUSD(producto.precio_costo)}</b></span>
          <span>Sugerido: <b>{fmtUSD(producto.precio_potencial)}</b></span>
        </div>

        <div className="ganancia-box">
          <span>Ganancia de esta venta</span>
          <b className={ganancia >= 0 ? 'gain' : 'loss'}>{ganancia >= 0 ? '+' : ''}{fmtUSD(ganancia)}</b>
          {fmtBs(pf, tasa) && <small>Cliente paga {fmtBs(pf, tasa)}</small>}
        </div>

        <ClientePicker value={clienteId} onChange={setClienteId} label="Cliente (opcional)" />

        <div className="wz-pie">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={confirmar} disabled={pf <= 0 || guardando}>{guardando ? 'Registrando…' : 'Registrar venta'}</button>
        </div>
      </div>
    </div>
  )
}
