import React, { useEffect, useState } from 'react'
import { listarClientes, agregarCliente, actualizarCliente, eliminarCliente } from '../clientes.js'

const VACIO = { cedula: '', nombre: '', telefono: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null) // null | {} (nuevo) | cliente (editar)

  async function recargar() { setClientes(await listarClientes()) }
  useEffect(() => { recargar() }, [])

  async function borrar(c) {
    if (!window.confirm(`¿Eliminar a "${c.nombre}"?`)) return
    await eliminarCliente(c.id); recargar()
  }

  const filtrados = clientes.filter((c) => {
    if (!busqueda) return true
    return `${c.nombre} ${c.cedula || ''} ${c.telefono || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  })

  return (
    <>
      <div className="topbar">
        <div><h1>Clientes</h1><div className="sub">{clientes.length} registrados</div></div>
        <button className="btn btn-primary" onClick={() => setModal({ ...VACIO })}>＋ Nuevo cliente</button>
      </div>

      <div className="content">
        <div className="toolbar">
          <div className="search"><input placeholder="Buscar por nombre, cédula o teléfono…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
        </div>

        {clientes.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">👥</div><b>Aún no tienes clientes</b>
            <p>Agrega clientes para asociarlos a tus ventas, compras y cambios.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal({ ...VACIO })}>＋ Nuevo cliente</button>
          </div>
        ) : (
          <table>
            <thead><tr><th>Nombre</th><th>Cédula</th><th>Teléfono</th><th></th></tr></thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td><div className="dev"><div className="thumb">👤</div><b>{c.nombre}</b></div></td>
                  <td>{c.cedula || <span className="muted">—</span>}</td>
                  <td>{c.telefono || <span className="muted">—</span>}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="icon-btn" title="Editar" onClick={() => setModal(c)}>✏️</button>
                    <button className="icon-btn" title="Eliminar" onClick={() => borrar(c)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan="4" className="note" style={{ textAlign: 'center' }}>Sin resultados</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ClienteModal inicial={modal} onClose={() => setModal(null)} onGuardado={() => { setModal(null); recargar() }} />}
    </>
  )
}

function ClienteModal({ inicial, onClose, onGuardado }) {
  const [f, setF] = useState({ cedula: inicial.cedula || '', nombre: inicial.nombre || '', telefono: inicial.telefono || '' })
  const [guardando, setGuardando] = useState(false)
  const editando = !!inicial.id

  async function guardar() {
    if (!f.nombre.trim()) return
    setGuardando(true)
    if (editando) await actualizarCliente({ id: inicial.id, ...f })
    else await agregarCliente(f)
    setGuardando(false)
    onGuardado()
  }

  return (
    <div className="overlay show" onClick={(e) => { if (e.target.classList.contains('overlay')) onClose() }}>
      <div className="modal">
        <h2>{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <div style={{ textAlign: 'left', marginTop: 14 }}>
          <label className="campo">Cédula
            <input type="text" placeholder="Ej. V-12.345.678" value={f.cedula} onChange={(e) => setF({ ...f, cedula: e.target.value })} />
          </label>
          <label className="campo">Nombre *
            <input type="text" placeholder="Nombre y apellido" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoFocus />
          </label>
          <label className="campo">Teléfono
            <input type="tel" placeholder="Ej. 0414-1234567" value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} />
          </label>
        </div>
        <div className="wz-pie">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={!f.nombre.trim() || guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}
