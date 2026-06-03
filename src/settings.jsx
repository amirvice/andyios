// ===== Contexto global de Ajustes (incluye la tasa USD -> Bs) =====
import React, { createContext, useContext, useEffect, useState } from 'react'

const SettingsContext = createContext(null)

// Si window.andy no existe (ej. abrir en navegador normal), usamos un respaldo
// para que la app no se rompa durante el desarrollo.
const DEF = { tasaBs: 0, nombreLocal: 'AndyiOS', tema: 'claro' }
const fallback = {
  _data: { ...DEF },
  getSettings() { return Promise.resolve(this._data) },
  saveSettings(n) { this._data = { ...this._data, ...n }; return Promise.resolve(this._data) }
}
const api = (typeof window !== 'undefined' && window.andy) ? window.andy : fallback

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ ...DEF })
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    api.getSettings().then((s) => { setSettings(s); setCargado(true) })
  }, [])

  // Aplica el tema (claro/oscuro) al documento cada vez que cambia.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.tema === 'oscuro' ? 'dark' : 'light')
  }, [settings.tema])

  async function actualizar(nuevos) {
    const guardado = await api.saveSettings(nuevos)
    setSettings(guardado)
    return guardado
  }

  return (
    <SettingsContext.Provider value={{ settings, actualizar, cargado }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider')
  return ctx
}

// ----- Helpers de moneda -----
export function fmtUSD(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// Devuelve el equivalente en bolívares, o null si no hay tasa configurada.
export function fmtBs(n, tasa) {
  if (!tasa || tasa <= 0) return null
  return 'Bs ' + (Number(n || 0) * tasa).toLocaleString('es-VE', { maximumFractionDigits: 0 })
}
