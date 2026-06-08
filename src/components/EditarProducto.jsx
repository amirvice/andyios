import React, { useState } from 'react'
import { MODELOS, SERIES, ALMACENAMIENTO, ESTADOS_FISICOS, CATEGORIAS, describirProducto } from '../data/opciones.js'
import { actualizarProducto } from '../productos.js'

function Chips({ opciones, valor, onChange }) {
  return (
    <div className="chips">
      {opciones.map((o) => (
        <button key={o} type="button" className={'chip-opt' + (valor === o ? ' sel' : '')} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  )
}
function Toggle({ label, valor, onChange }) {
  return (
    <button type="button" className={'toggle' + (valor ? ' on' : '')} onClick={() => onChange(!valor)}>
      <span className="dot" />{label}
    </button>
  )
}

export default function EditarProducto({ producto, onClose, onGuardado }) {
  const [f, setF] = useState({
    ...producto,
    incluye_caja: !!producto.incluye_caja,
    incluye_cargador: !!producto.incluye_cargador,
    precio_costo: String(producto.precio_costo ?? ''),
    precio_potencial: String(producto.precio_potencial ?? '')
  })
  const [guardando, setGuardando] = useState(false)
  const set = (campo, v) => setF((prev) => ({ ...prev, [campo]: v }))

  function leerFoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader(); r.onload = () => set('foto', r.result); r.readAsDataURL(file)
  }

  async function guardar() {
    setGuardando(true)
    await actualizarProducto({ ...f, precio_costo: parseFloat(f.precio_costo) || 0, precio_potencial: parseFloat(f.precio_potencial) || 0 })
    setGuardando(false)
    onGuardado()
  }

  const d = describirProducto(producto)

  return (
    <div className="overlay show" onClick={(e) => { if (e.target.classList.contains('overlay')) onClose() }}>
      <div className="modal modal-wide">
        <h2>Editar producto</h2>
        <div className="venta-prod">
          <div className="thumb">{f.foto ? <img src={f.foto} alt="" className="thumb-img" /> : '✏️'}</div>
          <div><b>{d.titulo}</b><br /><small>{producto.estado}</small></div>
        </div>

        <div className="wz-body">
          {/* Campos según tipo */}
          {f.tipo === 'iPhone' && (<>
            <label className="campo">Modelo</label>
            <Chips opciones={MODELOS.map((m) => 'iPhone ' + m)} valor={f.modelo ? 'iPhone ' + f.modelo : null} onChange={(v) => set('modelo', v.replace('iPhone ', ''))} />
            <label className="campo" style={{ marginTop: 12 }}>Serie</label>
            <Chips opciones={SERIES} valor={f.serie} onChange={(v) => set('serie', v)} />
            <label className="campo" style={{ marginTop: 12 }}>Almacenamiento</label>
            <Chips opciones={ALMACENAMIENTO} valor={f.almacenamiento} onChange={(v) => set('almacenamiento', v)} />
            <label className="campo" style={{ marginTop: 12 }}>Batería: {f.bateria ?? 0}%</label>
            <div className="bateria"><input type="range" min="0" max="100" value={f.bateria ?? 85} onChange={(e) => set('bateria', e.target.value)} /><span className="bat-val">{f.bateria ?? 85}%</span></div>
            <label className="campo" style={{ marginTop: 12 }}>Estado físico</label>
            <Chips opciones={ESTADOS_FISICOS} valor={f.estado_fisico} onChange={(v) => set('estado_fisico', v)} />
            <div className="precios">
              <label className="campo">Color<input type="text" value={f.color || ''} onChange={(e) => set('color', e.target.value)} /></label>
            </div>
            <div className="toggles">
              <Toggle label="Caja" valor={f.incluye_caja} onChange={(v) => set('incluye_caja', v)} />
              <Toggle label="Cargador" valor={f.incluye_cargador} onChange={(v) => set('incluye_cargador', v)} />
            </div>
          </>)}

          {f.tipo === 'Otro' && (<>
            <label className="campo">Nombre<input type="text" value={f.nombre || ''} onChange={(e) => set('nombre', e.target.value)} /></label>
            <label className="campo">Categoría</label>
            <Chips opciones={CATEGORIAS} valor={f.categoria} onChange={(v) => set('categoria', v)} />
          </>)}

          {f.tipo === 'Zapato' && (<>
            <div className="precios">
              <label className="campo">Modelo<input type="text" value={f.nombre || ''} onChange={(e) => set('nombre', e.target.value)} /></label>
            </div>
            <div className="precios">
              <label className="campo">Color<input type="text" value={f.color || ''} onChange={(e) => set('color', e.target.value)} /></label>
              <label className="campo">Talla<input type="text" value={f.talla || ''} onChange={(e) => set('talla', e.target.value)} /></label>
            </div>
          </>)}

          {/* Comunes */}
          <div className="precios">
            <label className="campo">Precio de costo (USD)<input type="number" min="0" value={f.precio_costo} onChange={(e) => set('precio_costo', e.target.value)} /></label>
            <label className="campo">Precio potencial (USD)<input type="number" min="0" value={f.precio_potencial} onChange={(e) => set('precio_potencial', e.target.value)} /></label>
          </div>
          <label className="campo">Etiqueta (opcional)<input type="text" value={f.etiqueta || ''} onChange={(e) => set('etiqueta', e.target.value)} /></label>
          <div className="foto-campo">
            <label className="foto-pick">
              {f.foto ? <img src={f.foto} alt="" /> : <span>📷<br />Foto</span>}
              <input type="file" accept="image/*" onChange={leerFoto} hidden />
            </label>
          </div>
        </div>

        <div className="wz-pie">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </div>
    </div>
  )
}
