import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { useSettings, fmtUSD, fmtBs } from '../settings.jsx'
import { estadisticas, listarProductos, listarVentas } from '../productos.js'
import { iconoProducto, describirProducto } from '../data/opciones.js'

const COLORES = ['#007AFF', '#34C759', '#FF9F0A', '#AF52DE', '#FF375F', '#5AC8FA']

export default function Dashboard({ irA }) {
  const { settings } = useSettings()
  const tasa = settings.tasaBs
  const oscuro = settings.tema === 'oscuro'

  const [stats, setStats] = useState(null)
  const [recientes, setRecientes] = useState([])
  const [ventas, setVentas] = useState([])

  useEffect(() => {
    estadisticas().then(setStats)
    listarProductos().then((p) => setRecientes(p.slice(0, 5)))
    listarVentas().then((v) => setVentas(v.slice(0, 5)))
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
    { t: 'Valor de inventario', v: stats.valor_inventario, d: `${stats.unidades_stock} unidades · costo`, ico: '📦' },
    { t: 'Ganancia potencial', v: stats.ganancia_potencial, d: 'si vendes todo el stock', ico: '✨', up: true },
    { t: 'Ganancia del mes', v: stats.ganancias_mes, d: `${stats.ventas_mes} venta(s) este mes`, ico: '💰', up: stats.ganancias_mes > 0 },
    { t: 'Ganancias totales', v: stats.ganancias_realizadas, d: 'realizadas', ico: '🏆', up: true }
  ]
  const hayStock = stats.unidades_stock > 0

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
              <div className="v">{fmtUSD(m.v)}</div>
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
            <h3>Ganancias por mes (USD)</h3>
            <div className="chart">
              {stats.hay_ventas ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.ganancias_por_mes} margin={{ top: 12, right: 12, left: -6, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: ejeColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: oscuro ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)' }} contentStyle={tooltipStyle} formatter={(v) => [fmtUSD(v), 'Ganancia']} />
                    <Bar dataKey="ganancia" fill="#34C759" radius={[6, 6, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <VacioChart texto="Registra ventas para ver tus ganancias por mes" />}
            </div>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="panel">
            <h3>Inventario reciente <a onClick={() => irA('inventario')}>Ver todo</a></h3>
            {recientes.length > 0 ? recientes.map((p) => {
              const d = describirProducto(p)
              return (
                <div className="row" key={p.id}>
                  <div className="thumb">{p.foto ? <img src={p.foto} alt="" className="thumb-img" /> : iconoProducto(p)}</div>
                  <div className="info"><b>{d.titulo}</b><small>{d.detalles || d.sub}</small></div>
                  <div className="price"><b>{fmtUSD(p.precio_potencial)}</b><small>costo {fmtUSD(p.precio_costo)}</small></div>
                </div>
              )
            }) : <div className="note">Aún no hay productos. <a className="link" onClick={() => irA('inventario')}>Agregar el primero</a></div>}
          </div>

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
              <div className="empty" style={{ border: 'none', boxShadow: 'none', padding: '36px 20px' }}>
                <div className="empty-ico">💳</div><b>Aún no registras ventas</b>
                <p>Ve a <a className="link" onClick={() => irA('ventas')}>Ventas</a> para registrar la primera.</p>
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
