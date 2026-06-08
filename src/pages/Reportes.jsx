import React, { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useSettings, fmtUSD, fmtBs } from '../settings.jsx'
import { listarVentas } from '../productos.js'
import { describirProducto } from '../data/opciones.js'
import { descargarCSV } from '../backup.js'

const COLORES = ['#0E9AAE', '#34C759', '#FF9F0A', '#AF52DE', '#FF375F', '#5AC8FA']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const PERIODOS = [
  { id: 'mes', label: 'Este mes', meses: 1 },
  { id: '3m', label: '3 meses', meses: 3 },
  { id: '6m', label: '6 meses', meses: 6 },
  { id: 'todo', label: 'Todo', meses: 12 }
]

export default function Reportes() {
  const { settings } = useSettings()
  const tasa = settings.tasaBs
  const oscuro = settings.tema === 'oscuro'
  const [ventas, setVentas] = useState([])
  const [periodo, setPeriodo] = useState('6m')

  useEffect(() => { listarVentas().then(setVentas) }, [])

  const cfg = PERIODOS.find((p) => p.id === periodo)
  const ejeColor = oscuro ? '#98989D' : '#86868B'
  const gridColor = oscuro ? '#2C2C2E' : '#ECECEF'
  const tooltipStyle = {
    background: oscuro ? '#1C1C1E' : '#fff',
    border: `1px solid ${oscuro ? '#3A3A3C' : '#E5E5EA'}`,
    borderRadius: 10, fontSize: 13, color: oscuro ? '#F5F5F7' : '#1D1D1F'
  }

  const datos = useMemo(() => {
    const ahora = new Date()
    const corte = new Date(ahora.getFullYear(), ahora.getMonth() - (cfg.meses - 1), 1)
    const enPeriodo = ventas.filter((v) => new Date(v.fecha) >= corte)

    const ingresos = enPeriodo.reduce((t, v) => t + (Number(v.precio_final) || 0), 0)
    const ganancia = enPeriodo.reduce((t, v) => t + (Number(v.ganancia) || 0), 0)
    const ticket = enPeriodo.length ? ingresos / enPeriodo.length : 0

    // Buckets por mes
    const buckets = []
    for (let i = cfg.meses - 1; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const dm = enPeriodo.filter((v) => { const f = new Date(v.fecha); return f.getFullYear() === d.getFullYear() && f.getMonth() === d.getMonth() })
      buckets.push({
        mes: MESES[d.getMonth()],
        ganancia: dm.reduce((t, v) => t + (Number(v.ganancia) || 0), 0),
        ingresos: dm.reduce((t, v) => t + (Number(v.precio_final) || 0), 0)
      })
    }

    // Ingresos por tipo de producto
    const porTipo = {}
    for (const v of enPeriodo) {
      const p = v.producto
      const k = !p ? 'Otro' : (p.tipo === 'iPhone' ? 'iPhone' : (p.categoria || 'Otro'))
      porTipo[k] = (porTipo[k] || 0) + (Number(v.precio_final) || 0)
    }
    const ingresosPorTipo = Object.entries(porTipo).map(([name, value]) => ({ name, value: Math.round(value) }))

    // Rendimiento por modelo/producto
    const porModelo = {}
    for (const v of enPeriodo) {
      const p = v.producto
      const nombre = p ? describirProducto(p).titulo : 'Producto eliminado'
      if (!porModelo[nombre]) porModelo[nombre] = { modelo: nombre, uds: 0, ingresos: 0, ganancia: 0 }
      porModelo[nombre].uds += 1
      porModelo[nombre].ingresos += Number(v.precio_final) || 0
      porModelo[nombre].ganancia += Number(v.ganancia) || 0
    }
    const rendimiento = Object.values(porModelo).sort((a, b) => b.ganancia - a.ganancia)

    return { enPeriodo, ingresos, ganancia, ticket, buckets, ingresosPorTipo, rendimiento }
  }, [ventas, cfg])

  const hay = datos.enPeriodo.length > 0

  function exportar() {
    descargarCSV(`andyios-ventas-${periodo}.csv`, [
      { titulo: 'Fecha', valor: (v) => new Date(v.fecha).toLocaleDateString('es-VE') },
      { titulo: 'Producto', valor: (v) => (v.producto ? describirProducto(v.producto).titulo : '—') },
      { titulo: 'Tipo', valor: (v) => v.tipo_operacion },
      { titulo: 'Cliente', valor: (v) => (v.cliente ? v.cliente.nombre : '') },
      { titulo: 'Precio final (USD)', valor: (v) => v.precio_final },
      { titulo: 'Ganancia (USD)', valor: (v) => v.ganancia }
    ], datos.enPeriodo)
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Reportes</h1><div className="sub">Resumen de ventas por periodo</div></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {hay && <button className="btn btn-ghost" onClick={exportar}>⤓ Exportar CSV</button>}
          <div className="seg">
            {PERIODOS.map((p) => (
              <button key={p.id} className={periodo === p.id ? 'on' : ''} onClick={() => setPeriodo(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="content">
        {!hay ? (
          <div className="empty">
            <div className="empty-ico">📈</div>
            <b>No hay ventas en este periodo</b>
            <p>Registra ventas o cambia el periodo para ver tus reportes.</p>
          </div>
        ) : (
          <>
            <div className="metrics">
              <div className="metric"><span className="chip">🧾</span><div className="t">Ventas</div><div className="v">{datos.enPeriodo.length}</div><div className="d muted">en el periodo</div></div>
              <div className="metric"><span className="chip">💵</span><div className="t">Ingresos</div><div className="v">{fmtUSD(datos.ingresos)}</div>{fmtBs(datos.ingresos, tasa) && <div className="bs">{fmtBs(datos.ingresos, tasa)}</div>}</div>
              <div className="metric"><span className="chip">💰</span><div className="t">Ganancia</div><div className="v">{fmtUSD(datos.ganancia)}</div>{fmtBs(datos.ganancia, tasa) && <div className="bs">{fmtBs(datos.ganancia, tasa)}</div>}<div className="d up">total del periodo</div></div>
              <div className="metric"><span className="chip">🎯</span><div className="t">Ticket promedio</div><div className="v">{fmtUSD(datos.ticket)}</div><div className="d muted">por venta</div></div>
            </div>

            <div className="grid2">
              <div className="panel">
                <h3>Ganancia e ingresos por mes (USD)</h3>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={datos.buckets} margin={{ top: 12, right: 12, left: -6, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="mes" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: ejeColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: oscuro ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)' }} contentStyle={tooltipStyle} formatter={(v, n) => [fmtUSD(v), n === 'ganancia' ? 'Ganancia' : 'Ingresos']} />
                      <Legend wrapperStyle={{ fontSize: 12, color: ejeColor }} />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#0E9AAE" radius={[5, 5, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="ganancia" name="Ganancia" fill="#34C759" radius={[5, 5, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel">
                <h3>Ingresos por tipo</h3>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={datos.ingresosPorTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {datos.ingresosPorTipo.map((e, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} stroke="none" />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fmtUSD(v), n]} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 13, color: ejeColor }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <h3>Mejores modelos por ganancia</h3>
              <table className="mini-table">
                <thead><tr><th>Producto</th><th>Uds.</th><th>Ingresos</th><th>Ganancia</th></tr></thead>
                <tbody>
                  {datos.rendimiento.map((r) => (
                    <tr key={r.modelo}>
                      <td>{r.modelo}</td>
                      <td className="num">{r.uds}</td>
                      <td className="num">{fmtUSD(r.ingresos)}</td>
                      <td className="num gain">+{fmtUSD(r.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <h3>Detalle de ventas</h3>
              <table className="mini-table">
                <thead><tr><th>Fecha</th><th>Producto</th><th>Cliente</th><th>Precio</th><th>Ganancia</th></tr></thead>
                <tbody>
                  {datos.enPeriodo.map((v) => (
                    <tr key={v.id}>
                      <td>{new Date(v.fecha).toLocaleDateString('es-VE')}</td>
                      <td>{v.producto ? describirProducto(v.producto).titulo : '—'} {v.tipo_operacion === 'cambio' && <span className="badge cambio">cambio</span>}</td>
                      <td>{v.cliente ? v.cliente.nombre : <span className="muted">—</span>}</td>
                      <td className="num">{fmtUSD(v.precio_final)}</td>
                      <td className="num gain">+{fmtUSD(v.ganancia)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="note">Reporte calculado desde tus ventas reales · periodo: {cfg.label}</div>
          </>
        )}
      </div>
    </>
  )
}
