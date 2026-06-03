import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inventario from './pages/Inventario.jsx'
import Ventas from './pages/Ventas.jsx'
import Cambios from './pages/Cambios.jsx'
import Zapatos from './pages/Zapatos.jsx'
import Clientes from './pages/Clientes.jsx'
import Reportes from './pages/Reportes.jsx'
import Ajustes from './pages/Ajustes.jsx'

const PAGINAS = {
  dashboard: Dashboard,
  inventario: Inventario,
  ventas: Ventas,
  cambios: Cambios,
  zapatos: Zapatos,
  clientes: Clientes,
  reportes: Reportes,
  ajustes: Ajustes
}

export default function App() {
  const [vista, setVista] = useState('dashboard')
  const Pagina = PAGINAS[vista] || Dashboard

  return (
    <div className="app">
      <Sidebar vista={vista} setVista={setVista} />
      <main className="main">
        <Pagina irA={setVista} />
      </main>
    </div>
  )
}
