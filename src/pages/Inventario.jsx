import React, { useEffect, useState } from 'react'
import { fmtUSD } from '../settings.jsx'
import { listarProductos, eliminarProducto } from '../productos.js'
import { iconoProducto, describirProducto } from '../data/opciones.js'
import AgregarDispositivo from '../components/AgregarDispositivo.jsx'
import EditarProducto from '../components/EditarProducto.jsx'

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tipo, setTipo] = useState('Todos')
  const [estado, setEstado] = useState('Disponible')
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [editar, setEditar] = useState(null)

  async function recargar() {
    setCargando(true)
    setProductos(await listarProductos())
    setCargando(false)
  }
  useEffect(() => { recargar() }, [])

  async function borrar(p) {
    const d = describirProducto(p)
    if (!window.confirm(`¿Eliminar "${d.titulo}" del inventario?`)) return
    await eliminarProducto(p.id)
    recargar()
  }

  const disponibles = productos.filter((p) => p.estado === 'Disponible').length
  const vendidos = productos.filter((p) => p.estado === 'Vendido').length

  const filtrados = productos.filter((p) => {
    if (tipo !== 'Todos' && p.tipo !== tipo) return false
    if (p.estado !== estado) return false
    if (busqueda) {
      const d = describirProducto(p)
      const texto = `${d.titulo} ${d.sub} ${d.detalles}`.toLowerCase()
      if (!texto.includes(busqueda.toLowerCase())) return false
    }
    return true
  })

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Inventario</h1>
          <div className="sub">{disponibles} disponibles · {vendidos} vendidos</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>＋ Agregar dispositivo</button>
      </div>

      <div className="content">
        <div className="toolbar">
          <div className="search">
            <input placeholder="Buscar por modelo, color, nombre…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="seg">
            {['Todos', 'iPhone', 'Otro', 'Zapato'].map((t) => (
              <button key={t} className={tipo === t ? 'on' : ''} onClick={() => setTipo(t)}>{t}</button>
            ))}
          </div>
          <div className="seg">
            {['Disponible', 'Vendido'].map((e) => (
              <button key={e} className={estado === e ? 'on' : ''} onClick={() => setEstado(e)}>{e}</button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="note">Cargando…</div>
        ) : productos.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">📦</div>
            <b>Tu inventario está vacío</b>
            <p>Agrega tu primer dispositivo para empezar.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal(true)}>＋ Agregar dispositivo</button>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Dispositivo</th><th>Detalles</th><th>Costo</th><th>Precio potencial</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const d = describirProducto(p)
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="dev">
                        <div className="thumb">{p.foto ? <img src={p.foto} alt="" className="thumb-img" /> : iconoProducto(p)}</div>
                        <div><b>{d.titulo}</b><br /><small>{d.sub}</small></div>
                      </div>
                    </td>
                    <td><small>{d.detalles}</small></td>
                    <td className="num">{fmtUSD(p.precio_costo)}</td>
                    <td className="num"><b>{fmtUSD(p.precio_potencial)}</b></td>
                    <td><span className={'badge ' + (p.estado === 'Disponible' ? 'disp' : 'vend')}>{p.estado}</span></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button className="icon-btn" title="Editar" onClick={() => setEditar(p)}>✏️</button>
                      <button className="icon-btn" title="Eliminar" onClick={() => borrar(p)}>🗑️</button>
                    </td>
                  </tr>
                )
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan="6" className="note" style={{ textAlign: 'center' }}>Sin resultados con estos filtros</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <AgregarDispositivo onClose={() => setModal(false)} onGuardado={() => recargar()} />
      )}
      {editar && (
        <EditarProducto producto={editar} onClose={() => setEditar(null)} onGuardado={() => { setEditar(null); recargar() }} />
      )}
    </>
  )
}
