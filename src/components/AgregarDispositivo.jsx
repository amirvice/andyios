import React, { useState } from 'react'
import { MODELOS, SERIES, ALMACENAMIENTO, ESTADOS_FISICOS, ORIGENES, CATEGORIAS } from '../data/opciones.js'
import { agregarProducto } from '../productos.js'
import ClientePicker from './ClientePicker.jsx'

// Grupo de "chips" seleccionables (una sola opción)
function Chips({ opciones, valor, onChange }) {
  return (
    <div className="chips">
      {opciones.map((o) => (
        <button key={o} type="button"
          className={'chip-opt' + (valor === o ? ' sel' : '')}
          onClick={() => onChange(o)}>{o}</button>
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

const TOTAL_IPHONE = 6

export default function AgregarDispositivo({ onClose, onGuardado }) {
  const [tipo, setTipo] = useState(null)
  const [paso, setPaso] = useState(1)
  const [f, setF] = useState({ incluye_caja: false, incluye_cargador: false, origen: 'Persona' })
  const [guardando, setGuardando] = useState(false)

  const set = (campo, valor) => setF((prev) => ({ ...prev, [campo]: valor }))

  function leerFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('foto', reader.result)
    reader.readAsDataURL(file)
  }

  async function guardar() {
    setGuardando(true)
    const base = {
      foto: f.foto || null,
      precio_costo: parseFloat(f.precio_costo) || 0,
      precio_potencial: parseFloat(f.precio_potencial) || 0,
      cantidad: Math.max(1, parseInt(f.cantidad, 10) || 1),
      etiqueta: f.etiqueta || null,
      cliente_id: f.cliente_id || null
    }
    const producto = tipo === 'iPhone'
      ? {
          tipo: 'iPhone', ...base,
          modelo: f.modelo, serie: f.serie, almacenamiento: f.almacenamiento,
          bateria: f.bateria != null && f.bateria !== '' ? Number(f.bateria) : null,
          estado_fisico: f.estado_fisico, color: f.color || null,
          incluye_caja: f.incluye_caja, incluye_cargador: f.incluye_cargador,
          piezas_reemplazadas: f.piezas_reemplazadas || null, origen: f.origen
        }
      : {
          tipo: 'Otro', ...base,
          nombre: f.nombre, categoria: f.categoria, notas: f.notas || null
        }
    const nuevo = await agregarProducto(producto)
    setGuardando(false)
    onGuardado(nuevo)
    onClose()
  }

  // ---- Pantalla inicial: elegir tipo ----
  if (!tipo) {
    return (
      <Overlay onClose={onClose}>
        <div className="modal">
          <h2>Agregar dispositivo</h2>
          <p>¿Qué tipo de producto vas a registrar?</p>
          <div className="choices">
            <div className="choice" onClick={() => { setTipo('iPhone'); setPaso(1) }}>
              <div className="big">📱</div><b>iPhone</b><small>Asistente paso a paso</small>
            </div>
            <div className="choice" onClick={() => { setTipo('Otro'); setPaso(1) }}>
              <div className="big">📦</div><b>Otro</b><small>PS5, forro, cable…</small>
            </div>
          </div>
          <button className="btn btn-ghost close" onClick={onClose}>Cancelar</button>
        </div>
      </Overlay>
    )
  }

  // ---- Formulario "Otro" (un solo paso) ----
  if (tipo === 'Otro') {
    const valido = f.nombre && f.categoria
    return (
      <Overlay onClose={onClose}>
        <div className="modal modal-wide">
          <Cabecera titulo="Nuevo accesorio / producto" onVolver={() => setTipo(null)} />
          <div className="wz-body">
            <label className="campo">Nombre
              <input type="text" placeholder="Ej. PlayStation 5 Slim" value={f.nombre || ''}
                onChange={(e) => set('nombre', e.target.value)} />
            </label>
            <label className="campo">Categoría</label>
            <Chips opciones={CATEGORIAS} valor={f.categoria} onChange={(v) => set('categoria', v)} />
            <Precios f={f} set={set} />
            <div className="precios">
              <label className="campo">Cantidad
                <input type="number" min="1" placeholder="1" value={f.cantidad || ''} onChange={(e) => set('cantidad', e.target.value)} />
              </label>
              <label className="campo">Etiqueta (opcional)
                <input type="text" placeholder="Ej. promo" value={f.etiqueta || ''} onChange={(e) => set('etiqueta', e.target.value)} />
              </label>
            </div>
            <Foto foto={f.foto} onPick={leerFoto} />
            <label className="campo">Notas (opcional)
              <textarea rows="2" placeholder="Detalles, accesorios incluidos…" value={f.notas || ''}
                onChange={(e) => set('notas', e.target.value)} />
            </label>
            <ClientePicker value={f.cliente_id} onChange={(id) => set('cliente_id', id)} label="¿A quién se lo compraste? (opcional)" />
          </div>
          <Pie onCancelar={onClose}
            primario={{ texto: guardando ? 'Guardando…' : 'Guardar', onClick: guardar, disabled: !valido || guardando }} />
        </div>
      </Overlay>
    )
  }

  // ---- Asistente iPhone (6 pasos) ----
  const puedeAvanzar = (
    (paso === 1 && f.modelo) ||
    (paso === 2 && f.serie) ||
    (paso === 3 && f.almacenamiento) ||
    (paso === 4 && f.estado_fisico) ||
    (paso === 5) ||
    (paso === 6)
  )
  const esUltimo = paso === TOTAL_IPHONE
  const validoFinal = f.modelo && f.serie && f.almacenamiento

  return (
    <Overlay onClose={onClose}>
      <div className="modal modal-wide">
        <Cabecera titulo={`iPhone · paso ${paso} de ${TOTAL_IPHONE}`}
          onVolver={() => (paso === 1 ? setTipo(null) : setPaso(paso - 1))} />
        <div className="wz-progress">
          {Array.from({ length: TOTAL_IPHONE }).map((_, i) => (
            <span key={i} className={'pip' + (i + 1 <= paso ? ' on' : '')} />
          ))}
        </div>

        <div className="wz-body">
          {paso === 1 && (<>
            <h4>¿Qué modelo es?</h4>
            <Chips opciones={MODELOS.map((m) => 'iPhone ' + m)} valor={f.modelo ? 'iPhone ' + f.modelo : null}
              onChange={(v) => set('modelo', v.replace('iPhone ', ''))} />
          </>)}

          {paso === 2 && (<>
            <h4>Serie</h4>
            <Chips opciones={SERIES} valor={f.serie} onChange={(v) => set('serie', v)} />
          </>)}

          {paso === 3 && (<>
            <h4>Almacenamiento</h4>
            <Chips opciones={ALMACENAMIENTO} valor={f.almacenamiento} onChange={(v) => set('almacenamiento', v)} />
          </>)}

          {paso === 4 && (<>
            <h4>Estado de la batería</h4>
            <div className="bateria">
              <input type="range" min="0" max="100" value={f.bateria ?? 85}
                onChange={(e) => set('bateria', e.target.value)} />
              <span className="bat-val">{f.bateria ?? 85}%</span>
            </div>
            <h4 style={{ marginTop: 18 }}>Estado físico</h4>
            <Chips opciones={ESTADOS_FISICOS} valor={f.estado_fisico} onChange={(v) => set('estado_fisico', v)} />
          </>)}

          {paso === 5 && (<>
            <label className="campo">Color
              <input type="text" placeholder="Ej. Titanio natural" value={f.color || ''}
                onChange={(e) => set('color', e.target.value)} />
            </label>
            <h4 style={{ marginTop: 6 }}>¿Qué incluye?</h4>
            <div className="toggles">
              <Toggle label="Caja" valor={f.incluye_caja} onChange={(v) => set('incluye_caja', v)} />
              <Toggle label="Cargador" valor={f.incluye_cargador} onChange={(v) => set('incluye_cargador', v)} />
            </div>
            <label className="campo" style={{ marginTop: 14 }}>Piezas reemplazadas (opcional)
              <input type="text" placeholder="Ej. pantalla, batería…" value={f.piezas_reemplazadas || ''}
                onChange={(e) => set('piezas_reemplazadas', e.target.value)} />
            </label>
          </>)}

          {paso === 6 && (<>
            <Precios f={f} set={set} />
            <div className="precios">
              <label className="campo">Cantidad
                <input type="number" min="1" placeholder="1" value={f.cantidad || ''} onChange={(e) => set('cantidad', e.target.value)} />
              </label>
              <label className="campo">Etiqueta (opcional)
                <input type="text" placeholder="Ej. apartado" value={f.etiqueta || ''} onChange={(e) => set('etiqueta', e.target.value)} />
              </label>
            </div>
            <h4 style={{ marginTop: 8 }}>¿De dónde lo compraste?</h4>
            <Chips opciones={ORIGENES} valor={f.origen} onChange={(v) => set('origen', v)} />
            <Foto foto={f.foto} onPick={leerFoto} />
            <ClientePicker value={f.cliente_id} onChange={(id) => set('cliente_id', id)} label="¿A quién se lo compraste? (opcional)" />
          </>)}
        </div>

        <Pie onCancelar={onClose}
          atras={paso > 1 ? () => setPaso(paso - 1) : null}
          primario={esUltimo
            ? { texto: guardando ? 'Guardando…' : 'Guardar', onClick: guardar, disabled: !validoFinal || guardando }
            : { texto: 'Siguiente →', onClick: () => setPaso(paso + 1), disabled: !puedeAvanzar }} />
      </div>
    </Overlay>
  )
}

// ---- Subcomponentes ----
function Overlay({ children, onClose }) {
  return (
    <div className="overlay show" onClick={(e) => { if (e.target.classList.contains('overlay')) onClose() }}>
      {children}
    </div>
  )
}

function Cabecera({ titulo, onVolver }) {
  return (
    <div className="wz-head">
      <button className="wz-volver" onClick={onVolver}>‹</button>
      <h2>{titulo}</h2>
    </div>
  )
}

function Pie({ onCancelar, atras, primario }) {
  return (
    <div className="wz-pie">
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        {atras && <button className="btn btn-ghost" onClick={atras}>‹ Atrás</button>}
      </div>
      <button className="btn btn-primary" onClick={primario.onClick} disabled={primario.disabled}>{primario.texto}</button>
    </div>
  )
}

function Precios({ f, set }) {
  return (
    <div className="precios">
      <label className="campo">Precio de costo (USD)
        <input type="number" min="0" step="1" placeholder="0" value={f.precio_costo || ''}
          onChange={(e) => set('precio_costo', e.target.value)} />
      </label>
      <label className="campo">Precio potencial (USD)
        <input type="number" min="0" step="1" placeholder="0" value={f.precio_potencial || ''}
          onChange={(e) => set('precio_potencial', e.target.value)} />
      </label>
    </div>
  )
}

function Foto({ foto, onPick }) {
  return (
    <div className="foto-campo">
      <label className="foto-pick">
        {foto ? <img src={foto} alt="foto" /> : <span>📷<br />Agregar foto</span>}
        <input type="file" accept="image/*" onChange={onPick} hidden />
      </label>
    </div>
  )
}
