import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' para que en producción (Electron cargando archivos locales) las rutas funcionen.
export default defineConfig({
  plugins: [react()],
  base: './',
  // host 127.0.0.1 (IPv4) para que coincida con el wait-on de Electron en Windows.
  server: { host: '127.0.0.1', port: 5173, strictPort: true }
})
