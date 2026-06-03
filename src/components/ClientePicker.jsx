import React, { useEffect, useState } from 'react'
import { listarClientes, agregarCliente } from '../clientes.js'

// Selector de cliente con opción de crear uno nuevo en línea.
export default function ClientePicker({ value, onChange, label = 'Cliente (opcional)' }) {
  const [clientes, setClientes] = useState([])
  const [creando, setCreando] = useState(false)
  const [nuevo, setNuevo] = useState({ cedula: '', nombre: '', telefono: '' })

  async function recargar() { setClientes(await listarClientes()) }
  useEffect(() => { recargar() }, [])

  async function guardarNuevo() {
    if (!nuevo.nombre.trim()) return
    const c = await agregarCliente(nuevo)
    await recargar()
    onChange(c.id)
    setCreando(false)
    setNuevo({ cedula: '', nombre: '', telefono: '' })
  }

  return (
    <div className="cliente-picker">
      <label className="campo">{label}</label>
      {!creando ? (
        <div className="cp-row">
          <select value={value || ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
            <option value="">— Sin cliente —</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.cedula ? ` · ${c.cedula}` : ''}</option>)}
          </select>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreando(true)}>＋ Nuevo</button>
        </div>
      ) : (
        <div className="cp-nuevo">
          <input placeholder="Cédula" value={nuevo.cedula} onChange={(e) => setNuevo({ ...nuevo, cedula: e.target.value })} />
          <input placeholder="Nombre *" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
          <input placeholder="Teléfono" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
          <div className="cp-acc">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreando(false)}>Cancelar</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={guardarNuevo} disabled={!nuevo.nombre.trim()}>Guardar cliente</button>
          </div>
        </div>
      )}
    </div>
  )
}
