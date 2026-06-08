import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import { useSettings, fmtUSD, fmtBs } from '../settings.jsx'
import { estadisticas, listarProductos, listarVentas } from '../productos.js'
import { listarMovimientos } from '../movimientos.js'
import { iconoProducto, describirProducto } from '../data/opciones.js'

const COLORES = ['#007AFF', '#34C759', '#FF9F0A', '#AF52DE', '#FF375F', '#5AC8FA']

export default function Dashboard({ irA }) {
  const { settings } = useSettings()
  const tasa = settings.tasaBs
  const oscuro = settings.tema === 'oscuro'

  const [stats, setStats] = useState(null)
  const [recientes, setRecientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [movs, setMovs] = useState([])

  useEffect(() => {
    estadisticas().then(setStats)
    listarProductos().then((p) => setRecientes(p.slice(0, 4)))
    listarVentas().then((v) => setVentas(v.slice(0, 4)))
    listarMovimientos().then((m) => setMovs(m.slice(0, 5)))
  }, [])

  const ejeColor = oscuro ? '#98989D' : '#86868B'
  const gridColor = oscuro ? '#2C2C2E' : '#ECECEF'
  const tooltipStyle = {
    background: oscuro ? '#1C1C1E' : '#fff',
    border: `1px solid ${oscuro ? '#3A3A3C' : '#E5E5EA'}`,
    borderRadius: 10, fontSize: 13, color: oscuro ? '#F5F5F7' : '#1D1D1F'
  }

  if (!stats) return (<><div className="topbar"><div><h1>Dashboard</h1></div></div><div className="content"><div className="note">Cargando…</div></div></>)

  const metricas = [
    { t: 'Valor de inventario', v: stats.valor_inventario, d: `${stats.unidades_stock} uds · potencial ${fmtUSD(stats.ganancia_potencial)}`, ico: '📦' },
    { t: 'Ganancia del mes', v: stats.ganancias_mes, d: `${stats.ventas_mes} venta(s) este mes`, ico: '💰', up: stats.ganancias_mes > 0 },
    { t: 'Gastos del mes', v: stats.gastos_mes, d: `otros ingresos: ${fmtUSD(stats.ingresos_extra_mes)}`, ico: '🧾' },
    { t: 'Balance del mes', v: stats.balance_mes, d: 'ventas + ingresos − gastos', ico: '⚖️', balance: true }
  ]
  const hayStock = stats.unidades_stock > 0
  const hayFlujo = stats.hay_ventas || stats.hay_movimientos

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Resumen · {new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <button className="btn btn-primary" onClick={() => irA('inventario')}>＋ Agregar dispositivo</button>
      </div>

      <div className="content">
        {tasa > 0
          ? <div className="tasa-pill">Tasa actual: 1 USD = Bs {tasa.toLocaleString('es-VE')}</div>
          : <div className="tasa-pill warn">Sin tasa configurada — ve a <b>Ajustes</b> para ver montos en bolívares</div>}

        <div className="metrics">
          {metricas.map((m) => (
            <div className="metric" key={m.t}>
              <span className="chip">{m.ico}</span>
              <div className="t">{m.t}</div>
              <div className="v" style={m.balance ? { color: m.v >= 0 ? 'var(--verde)' : 'var(--rojo)' } : undefined}>{fmtUSD(m.v)}</div>
              {fmtBs(m.v, tasa) && <div className="bs">{fmtBs(m.v, tasa)}</div>}
              <div className={'d ' + (m.up ? 'up' : 'muted')}>{m.d}</div>
            </div>
          ))}
        </div>

        <div className="grid2">
          <div className="panel">
            <h3>Inventario por tipo</h3>
            <div className="chart">
              {hayStock ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={stats.inventario_por_tipo} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {stats.inventario_por_tipo.map((e, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} unidades`, n]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 13, color: ejeColor }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <VacioChart texto="Sin productos en stock todavía" />}
            </div>
          </div>

          <div className="panel">
            <h3>Entradas y gastos por mes (USD)</h3>
            <div className="chart">
              {hayFlujo ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.ganancias_por_mes} margin={{ top: 12, right: 12, left: -6, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: ejeColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: oscuro ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)' }} contentStyle={tooltipStyle} formatter={(v, n) => [fmtUSD(v), n === 'entradas' ? 'Entradas' : 'Gastos']} />
                    <Legend wrapperStyle={{ fontSize: 12, color: ejeColor }} />
                    <Bar dataKey="entradas" name="Entradas" fill="#34C759" radius={[5, 5, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="gastos" name="Gastos" fill="#FF3B30" radius={[5, 5, 0, 0]} maxBarSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <VacioChart texto="Registra ventas o movimientos para ver el flujo" />}
            </div>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="panel">
            <h3>Ventas recientes <a onClick={() => irA('ventas')}>Ver todo</a></h3>
            {ventas.length > 0 ? ventas.map((v) => {
              const d = v.producto ? describirProducto(v.producto) : { titulo: 'Producto', detalles: '' }
              return (
                <div className="row" key={v.id}>
                  <div className="thumb">{v.producto ? iconoProducto(v.producto) : '💳'}</div>
                  <div className="info"><b>{d.titulo}</b><small>{new Date(v.fecha).toLocaleDateString('es-VE')} · venta {fmtUSD(v.precio_final)}</small></div>
                  <div className="price"><b className="gain">+{fmtUSD(v.ganancia)}</b><small>ganancia</small></div>
                </div>
              )
            }) : (
              <div className="empty" style={{ border: 'none', boxShadow: 'none', padding: '30px 20px' }}>
                <div className="empty-ico">💳</div><b>Aún no registras ventas</b>
                <p>Ve a <a className="link" onClick={() => irA('ventas')}>Ventas</a> para registrar la primera.</p>
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Movimientos recientes <a onClick={() => irA('caja')}>Ver todo</a></h3>
            {movs.length > 0 ? movs.map((m) => (
              <div className="row" key={m.id}>
                <div className="thumb">{m.tipo === 'ingreso' ? '💵' : '🧾'}</div>
                <div className="info"><b>{m.concepto || (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}</b><small>{new Date(m.fecha).toLocaleDateString('es-VE')}{m.categoria ? ` · ${m.categoria}` : ''}</small></div>
                <div className="price"><b className={m.tipo === 'ingreso' ? 'gain' : 'loss'}>{m.tipo === 'ingreso' ? '+' : '−'}{fmtUSD(m.monto)}</b></div>
              </div>
            )) : (
              <div className="empty" style={{ border: 'none', boxShadow: 'none', padding: '30px 20px' }}>
                <div className="empty-ico">💵</div><b>Sin movimientos</b>
                <p>Registra ingresos y gastos en <a className="link" onClick={() => irA('caja')}>Caja</a>.</p>
              </div>
            )}
          </div>
        </div>

        <div className="note">Todas las métricas son reales · calculadas desde tu base de datos</div>
      </div>
    </>
  )
}

function VacioChart({ texto }) {
  return <div className="note" style={{ paddingTop: 90 }}>{texto}</div>
}
