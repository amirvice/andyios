import React, { useEffect, useState } from 'react'
import { useSettings, fmtUSD } from '../settings.jsx'
import { listarModelosZapato, agregarModeloZapato, eliminarModeloZapato } from '../zapatos.js'
import { listarProductos, agregarProducto, eliminarProducto } from '../productos.js'

function leerFotoA(setter) {
  return (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader(); r.onload = () => setter(r.result); r.readAsDataURL(file)
  }
}

const INV_VACIO = { color: '', talla: '', precio_costo: '', precio_potencial: '', cantidad: '1', foto: '', etiqueta: '' }

export default function Zapatos() {
  const [modelos, setModelos] = useState([])
  const [inventario, setInventario] = useState([])
  const [sel, setSel] = useState(null)
  const [mod, setMod] = useState({ nombre: '', marca: '', foto: '' })
  const [inv, setInv] = useState({ ...INV_VACIO })
  const [msg, setMsg] = useState('')

  async function recargar() {
    setModelos(await listarModelosZapato())
    const prods = await listarProductos()
    setInventario(prods.filter((p) => p.tipo === 'Zapato'))
  }
  useEffect(() => { recargar() }, [])

  async function crearModelo() {
    if (!mod.nombre.trim()) return
    const nuevo = await agregarModeloZapato(mod)
    setMod({ nombre: '', marca: '', foto: '' })
    await recargar()
    setSel(nuevo.id)
  }

  async function borrarModelo(m) {
    if (!window.confirm(`¿Eliminar el modelo "${m.nombre}"? (no borra el inventario ya ingresado)`)) return
    await eliminarModeloZapato(m.id); if (sel === m.id) setSel(null); recargar()
  }

  const modeloSel = modelos.find((m) => m.id === sel)

  async function agregarInventario() {
    if (!modeloSel || !inv.talla.trim()) return
    const cant = Math.max(1, parseInt(inv.cantidad, 10) || 1)
    await agregarProducto({
      tipo: 'Zapato', categoria: 'Zapato', nombre: modeloSel.nombre, modelo_zapato_id: modeloSel.id,
      color: inv.color || null, talla: inv.talla, etiqueta: inv.etiqueta || null,
      precio_costo: inv.precio_costo, precio_potencial: inv.precio_potencial,
      foto: inv.foto || modeloSel.foto || null, cantidad: cant
    })
    setInv({ ...INV_VACIO })
    setMsg(`✓ ${cant} par(es) agregado(s) al inventario`)
    setTimeout(() => setMsg(''), 2500)
    recargar()
  }

  async function borrarZapato(p) {
    if (!window.confirm('¿Eliminar este par del inventario?')) return
    await eliminarProducto(p.id); recargar()
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Zapatos</h1><div className="sub">{modelos.length} modelos · {inventario.length} pares en inventario</div></div>
      </div>

      <div className="content">
        <div className="cambio-grid">
          {/* Modelos */}
          <div className="panel">
            <h3>1 · Modelos de zapatos</h3>
            <div className="cambio-body">
              <div className="precios">
                <label className="campo">Nombre del modelo *
                  <input type="text" placeholder="Ej. Nike Air Max 90" value={mod.nombre} onChange={(e) => setMod({ ...mod, nombre: e.target.value })} />
                </label>
                <label className="campo">Marca
                  <input type="text" placeholder="Ej. Nike" value={mod.marca} onChange={(e) => setMod({ ...mod, marca: e.target.value })} />
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <label className="foto-pick">
                  {mod.foto ? <img src={mod.foto} alt="" /> : <span>📷<br />Foto modelo</span>}
                  <input type="file" accept="image/*" onChange={leerFotoA((v) => setMod({ ...mod, foto: v }))} hidden />
                </label>
                <button className="btn btn-primary" onClick={crearModelo} disabled={!mod.nombre.trim()}>＋ Crear modelo</button>
              </div>

              <div className="lista-sel" style={{ marginTop: 16 }}>
                {modelos.length === 0 ? <div className="note">Aún no hay modelos.</div> : modelos.map((m) => (
                  <div key={m.id} className={'row sel-row' + (sel === m.id ? ' sel' : '')} onClick={() => setSel(m.id)}>
                    <div className="thumb">{m.foto ? <img src={m.foto} alt="" className="thumb-img" /> : '👟'}</div>
                    <div className="info"><b>{m.nombre}</b><small>{m.marca || 'Sin marca'}</small></div>
                    <button className="icon-btn" title="Eliminar modelo" onClick={(e) => { e.stopPropagation(); borrarModelo(m) }}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agregar al inventario */}
          <div className="panel">
            <h3>2 · Ingresar al inventario</h3>
            <div className="cambio-body">
              {!modeloSel ? (
                <div className="note">Selecciona o crea un modelo a la izquierda para ingresar pares.</div>
              ) : (
                <>
                  <div className="venta-prod">
                    <div className="thumb">{modeloSel.foto ? <img src={modeloSel.foto} alt="" className="thumb-img" /> : '👟'}</div>
                    <div><b>{modeloSel.nombre}</b><br /><small>{modeloSel.marca || 'Sin marca'}</small></div>
                  </div>
                  <div className="precios">
                    <label className="campo">Color
                      <input type="text" placeholder="Ej. Negro/Blanco" value={inv.color} onChange={(e) => setInv({ ...inv, color: e.target.value })} />
                    </label>
                    <label className="campo">Talla *
                      <input type="text" placeholder="Ej. 42" value={inv.talla} onChange={(e) => setInv({ ...inv, talla: e.target.value })} />
                    </label>
                  </div>
                  <div className="precios">
                    <label className="campo">Costo inicial (USD)
                      <input type="number" min="0" placeholder="0" value={inv.precio_costo} onChange={(e) => setInv({ ...inv, precio_costo: e.target.value })} />
                    </label>
                    <label className="campo">Costo potencial (USD)
                      <input type="number" min="0" placeholder="0" value={inv.precio_potencial} onChange={(e) => setInv({ ...inv, precio_potencial: e.target.value })} />
                    </label>
                  </div>
                  <div className="precios">
                    <label className="campo">Cantidad (pares)
                      <input type="number" min="1" value={inv.cantidad} onChange={(e) => setInv({ ...inv, cantidad: e.target.value })} />
                    </label>
                    <label className="campo">Etiqueta (opcional)
                      <input type="text" placeholder="Ej. temporada" value={inv.etiqueta} onChange={(e) => setInv({ ...inv, etiqueta: e.target.value })} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                    <label className="foto-pick">
                      {inv.foto ? <img src={inv.foto} alt="" /> : <span>📷<br />Foto par</span>}
                      <input type="file" accept="image/*" onChange={leerFotoA((v) => setInv({ ...inv, foto: v }))} hidden />
                    </label>
                    <button className="btn btn-primary" onClick={agregarInventario} disabled={!inv.talla.trim()}>＋ Agregar al inventario</button>
                    {msg && <span className="ok">{msg}</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Inventario de zapatos */}
        <div className="panel" style={{ marginTop: 20 }}>
          <h3>Inventario de zapatos</h3>
          {inventario.length === 0 ? <div className="note">Aún no hay zapatos en el inventario.</div> : (
            <table className="mini-table">
              <thead><tr><th>Modelo</th><th>Color</th><th>Talla</th><th>Costo</th><th>Precio</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {inventario.map((p) => (
                  <tr key={p.id}>
                    <td><div className="dev"><div className="thumb">{p.foto ? <img src={p.foto} alt="" className="thumb-img" /> : '👟'}</div><b>{p.nombre}</b></div></td>
                    <td>{p.color || '—'}</td>
                    <td className="num">{p.talla || '—'}</td>
                    <td className="num">{fmtUSD(p.precio_costo)}</td>
                    <td className="num"><b>{fmtUSD(p.precio_potencial)}</b></td>
                    <td><span className={'badge ' + (p.estado === 'Disponible' ? 'disp' : 'vend')}>{p.estado}</span></td>
                    <td style={{ textAlign: 'right' }}>{p.estado === 'Disponible' && <button className="icon-btn" title="Eliminar" onClick={() => borrarZapato(p)}>🗑️</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
