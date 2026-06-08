import React, { useEffect, useState } from 'react'
import { useSettings, fmtUSD, fmtBs } from '../settings.jsx'
import { listarProductos, listarCambios, registrarCambio } from '../productos.js'
import { iconoProducto, describirProducto, MODELOS, SERIES, ALMACENAMIENTO, ESTADOS_FISICOS } from '../data/opciones.js'
import ClientePicker from '../components/ClientePicker.jsx'
import BuscadorProductos from '../components/BuscadorProductos.jsx'

function Chips({ opciones, valor, onChange }) {
  return (
    <div className="chips">
      {opciones.map((o) => (
        <button key={o} type="button" className={'chip-opt' + (valor === o ? ' sel' : '')} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}

const REC_INICIAL = { modelo: '', serie: '', almacenamiento: '', bateria: 85, estado_fisico: '', color: '', valor_cotizado: '', precio_potencial: '' }

export default function Cambios() {
  const { settings } = useSettings()
  const tasa = settings.tasaBs
  const [disponibles, setDisponibles] = useState([])
  const [cambios, setCambios] = useState([])
  const [entregadoId, setEntregadoId] = useState(null)
  const [precioVenta, setPrecioVenta] = useState('')
  const [rec, setRec] = useState({ ...REC_INICIAL })
  const [clienteId, setClienteId] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const setR = (campo, v) => setRec((p) => ({ ...p, [campo]: v }))

  async function recargar() {
    const prods = await listarProductos()
    setDisponibles(prods.filter((p) => p.estado === 'Disponible'))
    setCambios(await listarCambios())
  }
  useEffect(() => { recargar() }, [])

  function elegirEntregado(p) {
    setEntregadoId(p.id)
    setPrecioVenta(String(p.precio_potencial || ''))
  }

  const entregado = disponibles.find((p) => p.id === entregadoId)
  const precioVentaNum = parseFloat(precioVenta) || 0
  const valorCotNum = parseFloat(rec.valor_cotizado) || 0
  const diferencia = precioVentaNum - valorCotNum
  const puedeConfirmar = entregado && precioVentaNum > 0 && rec.modelo && rec.serie && rec.almacenamiento && valorCotNum > 0

  async function confirmar() {
    setGuardando(true)
    await registrarCambio({
      producto_entregado_id: entregadoId,
      precio_venta_entregado: precioVentaNum,
      cliente_id: clienteId,
      recibido: {
        tipo: 'iPhone', modelo: rec.modelo, serie: rec.serie, almacenamiento: rec.almacenamiento,
        bateria: Number(rec.bateria), estado_fisico: rec.estado_fisico, color: rec.color || null,
        valor_cotizado: valorCotNum, precio_potencial: parseFloat(rec.precio_potencial) || valorCotNum
      }
    })
    setGuardando(false)
    setEntregadoId(null); setPrecioVenta(''); setRec({ ...REC_INICIAL }); setClienteId(null)
    recargar()
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Cambios</h1><div className="sub">Trade-in · {cambios.length} registrados</div></div>
      </div>

      <div className="content">
        <div className="cambio-grid">
          {/* 1. Equipo que se lleva el cliente */}
          <div className="panel">
            <h3>1 · Equipo que se lleva el cliente</h3>
            <div className="cambio-body">
              {entregado && (
                <div className="venta-prod" style={{ marginBottom: 12 }}>
                  <div className="thumb">{entregado.foto ? <img src={entregado.foto} alt="" className="thumb-img" /> : iconoProducto(entregado)}</div>
                  <div><b>{describirProducto(entregado).titulo}</b><br /><small>{describirProducto(entregado).detalles || describirProducto(entregado).sub}</small></div>
                </div>
              )}
              <BuscadorProductos productos={disponibles} placeholder="Buscar el equipo que se lleva…"
                vacioTexto="No hay productos disponibles en el inventario." renderItem={(p) => {
                  const d = describirProducto(p)
                  return (
                    <div key={p.id} className={'row sel-row' + (entregadoId === p.id ? ' sel' : '')} onClick={() => elegirEntregado(p)}>
                      <div className="thumb">{p.foto ? <img src={p.foto} alt="" className="thumb-img" /> : iconoProducto(p)}</div>
                      <div className="info"><b>{d.titulo}</b><small>{d.detalles || d.sub}</small></div>
                      <div className="price"><b>{fmtUSD(p.precio_potencial)}</b></div>
                    </div>
                  )
                }} />
              {entregado && (
                <label className="campo" style={{ marginTop: 14 }}>Precio de venta de este equipo (USD)
                  <input type="number" min="0" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} />
                </label>
              )}
            </div>
          </div>

          {/* 2. Equipo que entrega el cliente */}
          <div className="panel">
            <h3>2 · Equipo que entrega el cliente (verificación)</h3>
            <div className="cambio-body">
              <label className="campo">Modelo</label>
              <Chips opciones={MODELOS.map((m) => 'iPhone ' + m)} valor={rec.modelo ? 'iPhone ' + rec.modelo : ''} onChange={(v) => setR('modelo', v.replace('iPhone ', ''))} />
              <label className="campo" style={{ marginTop: 12 }}>Serie</label>
              <Chips opciones={SERIES} valor={rec.serie} onChange={(v) => setR('serie', v)} />
              <label className="campo" style={{ marginTop: 12 }}>Almacenamiento</label>
              <Chips opciones={ALMACENAMIENTO} valor={rec.almacenamiento} onChange={(v) => setR('almacenamiento', v)} />
              <label className="campo" style={{ marginTop: 12 }}>Batería</label>
              <div className="bateria">
                <input type="range" min="0" max="100" value={rec.bateria} onChange={(e) => setR('bateria', e.target.value)} />
                <span className="bat-val">{rec.bateria}%</span>
              </div>
              <label className="campo" style={{ marginTop: 12 }}>Estado físico</label>
              <Chips opciones={ESTADOS_FISICOS} valor={rec.estado_fisico} onChange={(v) => setR('estado_fisico', v)} />
              <div className="precios" style={{ marginTop: 14 }}>
                <label className="campo">Color
                  <input type="text" placeholder="Ej. Negro" value={rec.color} onChange={(e) => setR('color', e.target.value)} />
                </label>
                <label className="campo">Valor cotizado (USD)
                  <input type="number" min="0" placeholder="0" value={rec.valor_cotizado} onChange={(e) => setR('valor_cotizado', e.target.value)} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cliente */}
        <div className="panel" style={{ marginTop: 16, padding: '16px 18px' }}>
          <ClientePicker value={clienteId} onChange={setClienteId} label="Cliente del cambio (opcional)" />
        </div>

        {/* Diferencia + confirmar */}
        <div className="diferencia-bar">
          <div className="dif-detalle">
            <span>Se lleva: <b>{fmtUSD(precioVentaNum)}</b></span>
            <span className="op">−</span>
            <span>Entrega: <b>{fmtUSD(valorCotNum)}</b></span>
            <span className="op">=</span>
          </div>
          <div className="dif-total">
            <small>Diferencia que paga el cliente</small>
            <b className={diferencia >= 0 ? '' : 'loss'}>{fmtUSD(diferencia)}</b>
            {fmtBs(Math.abs(diferencia), tasa) && <small className="dif-bs">{diferencia < 0 ? 'le devuelves ' : ''}{fmtBs(Math.abs(diferencia), tasa)}</small>}
          </div>
          <button className="btn btn-primary" disabled={!puedeConfirmar || guardando} onClick={confirmar}>
            {guardando ? 'Procesando…' : 'Confirmar cambio'}
          </button>
        </div>

        {/* Historial */}
        <div className="panel" style={{ marginTop: 20 }}>
          <h3>Cambios recientes</h3>
          {cambios.length === 0 ? (
            <div className="note">Aún no has registrado cambios.</div>
          ) : cambios.map((c) => {
            const e = c.entregado ? describirProducto(c.entregado) : { titulo: '—' }
            const r = c.recibido ? describirProducto(c.recibido) : { titulo: '—' }
            return (
              <div className="row" key={c.id}>
                <div className="info">
                  <b>🔄 {e.titulo} → {r.titulo}</b>
                  <small>{new Date(c.fecha).toLocaleDateString('es-VE')} · se llevó {fmtUSD(c.precio_venta_entregado)} · cotizado {fmtUSD(c.valor_cotizado)}</small>
                </div>
                <div className="price"><b className="gain">{fmtUSD(c.diferencia)}</b><small>diferencia</small></div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
