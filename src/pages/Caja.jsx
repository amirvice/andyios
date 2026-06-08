import React, { useEffect, useState } from 'react'
import { useSettings, fmtUSD, fmtBs } from '../settings.jsx'
import { listarMovimientos, agregarMovimiento, eliminarMovimiento, CATEGORIAS_INGRESO, CATEGORIAS_GASTO } from '../movimientos.js'
import { estadisticas } from '../productos.js'

function hoyISO() { return new Date().toISOString().slice(0, 10) }

export default function Caja() {
  const { settings } = useSettings()
  const tasa = settings.tasaBs
  const [movs, setMovs] = useState([])
  const [stats, setStats] = useState(null)
  const [filtro, setFiltro] = useState('Todos')
  const [modal, setModal] = useState(null) // null | 'ingreso' | 'gasto'

  async function recargar() {
    setMovs(await listarMovimientos())
    setStats(await estadisticas())
  }
  useEffect(() => { recargar() }, [])

  async function borrar(m) {
    if (!window.confirm('¿Eliminar este movimiento?')) return
    await eliminarMovimiento(m.id); recargar()
  }

  const filtrados = movs.filter((m) => filtro === 'Todos' || (filtro === 'Ingresos' ? m.tipo === 'ingreso' : m.tipo === 'gasto'))

  return (
    <>
      <div className="topbar">
        <div><h1>Caja</h1><div className="sub">Ingresos y gastos del negocio</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setModal('gasto')}>－ Gasto</button>
          <button className="btn btn-primary" onClick={() => setModal('ingreso')}>＋ Ingreso</button>
        </div>
      </div>

      <div className="content">
        {stats && (
          <div className="metrics">
            <div className="metric"><span className="chip">📈</span><div className="t">Ganancia ventas (mes)</div><div className="v">{fmtUSD(stats.ganancias_mes)}</div>{fmtBs(stats.ganancias_mes, tasa) && <div className="bs">{fmtBs(stats.ganancias_mes, tasa)}</div>}</div>
            <div className="metric"><span className="chip">💵</span><div className="t">Otros ingresos (mes)</div><div className="v">{fmtUSD(stats.ingresos_extra_mes)}</div>{fmtBs(stats.ingresos_extra_mes, tasa) && <div className="bs">{fmtBs(stats.ingresos_extra_mes, tasa)}</div>}</div>
            <div className="metric"><span className="chip">🧾</span><div className="t">Gastos (mes)</div><div className="v">{fmtUSD(stats.gastos_mes)}</div>{fmtBs(stats.gastos_mes, tasa) && <div className="bs">{fmtBs(stats.gastos_mes, tasa)}</div>}</div>
            <div className="metric"><span className="chip">⚖️</span><div className="t">Balance del mes</div><div className="v" style={{ color: stats.balance_mes >= 0 ? 'var(--verde)' : 'var(--rojo)' }}>{fmtUSD(stats.balance_mes)}</div><div className="d muted">ventas + ingresos − gastos</div></div>
          </div>
        )}

        <div className="toolbar">
          <div className="seg">
            {['Todos', 'Ingresos', 'Gastos'].map((t) => (
              <button key={t} className={filtro === t ? 'on' : ''} onClick={() => setFiltro(t)}>{t}</button>
            ))}
          </div>
        </div>

        {movs.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">💵</div><b>Aún no hay movimientos</b>
            <p>Registra ingresos (servicios, abonos…) y gastos (alquiler, mercancía…) que no sean ventas de productos.</p>
          </div>
        ) : (
          <table>
            <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Tipo</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {filtrados.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha).toLocaleDateString('es-VE')}</td>
                  <td><b>{m.concepto || '—'}</b></td>
                  <td><small>{m.categoria || '—'}</small></td>
                  <td><span className={'badge ' + (m.tipo === 'ingreso' ? 'disp' : 'gasto-badge')}>{m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}</span></td>
                  <td className="num"><b className={m.tipo === 'ingreso' ? 'gain' : 'loss'}>{m.tipo === 'ingreso' ? '+' : '−'}{fmtUSD(m.monto)}</b></td>
                  <td style={{ textAlign: 'right' }}><button className="icon-btn" title="Eliminar" onClick={() => borrar(m)}>🗑️</button></td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan="6" className="note" style={{ textAlign: 'center' }}>Sin movimientos de este tipo</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {modal && <MovimientoModal tipoInicial={modal} tasa={tasa} onClose={() => setModal(null)} onGuardado={() => { setModal(null); recargar() }} />}
    </>
  )
}

function MovimientoModal({ tipoInicial, tasa, onClose, onGuardado }) {
  const [tipo, setTipo] = useState(tipoInicial)
  const [f, setF] = useState({ concepto: '', monto: '', categoria: '', fecha: hoyISO(), notas: '' })
  const [guardando, setGuardando] = useState(false)
  const set = (c, v) => setF((p) => ({ ...p, [c]: v }))
  const monto = parseFloat(f.monto) || 0
  const categorias = tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO

  async function guardar() {
    if (!f.concepto.trim() || monto <= 0) return
    setGuardando(true)
    await agregarMovimiento({
      tipo, concepto: f.concepto.trim(), monto,
      categoria: f.categoria || null,
      fecha: new Date(f.fecha + 'T12:00:00').toISOString(),
      notas: f.notas || null
    })
    setGuardando(false); onGuardado()
  }

  return (
    <div className="overlay show" onClick={(e) => { if (e.target.classList.contains('overlay')) onClose() }}>
      <div className="modal modal-wide">
        <h2>Nuevo movimiento</h2>
        <div className="seg" style={{ marginBottom: 16 }}>
          <button className={tipo === 'ingreso' ? 'on' : ''} onClick={() => { setTipo('ingreso'); set('categoria', '') }}>＋ Ingreso</button>
          <button className={tipo === 'gasto' ? 'on' : ''} onClick={() => { setTipo('gasto'); set('categoria', '') }}>－ Gasto</button>
        </div>
        <div className="wz-body">
          <label className="campo">Concepto *
            <input type="text" placeholder={tipo === 'ingreso' ? 'Ej. Reparación de pantalla' : 'Ej. Pago de alquiler'} value={f.concepto} onChange={(e) => set('concepto', e.target.value)} autoFocus />
          </label>
          <div className="precios">
            <label className="campo">Monto (USD) *
              <input type="number" min="0" step="0.01" placeholder="0" value={f.monto} onChange={(e) => set('monto', e.target.value)} />
            </label>
            <label className="campo">Fecha
              <input type="date" value={f.fecha} onChange={(e) => set('fecha', e.target.value)} />
            </label>
          </div>
          <label className="campo">Categoría</label>
          <div className="chips">
            {categorias.map((c) => (
              <button key={c} type="button" className={'chip-opt' + (f.categoria === c ? ' sel' : '')} onClick={() => set('categoria', c)}>{c}</button>
            ))}
          </div>
          <label className="campo" style={{ marginTop: 12 }}>Notas (opcional)
            <textarea rows="2" value={f.notas} onChange={(e) => set('notas', e.target.value)} />
          </label>
          {monto > 0 && fmtBs(monto, tasa) && <p className="ejemplo">Equivale a <b>{fmtBs(monto, tasa)}</b></p>}
        </div>
        <div className="wz-pie">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={!f.concepto.trim() || monto <= 0 || guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}
