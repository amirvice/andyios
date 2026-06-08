// ===== Proceso principal de Electron (Node.js) =====
// Crea la ventana de la app y maneja la lectura/escritura de Ajustes en disco.
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const db = require('./db')

// En desarrollo cargamos el servidor de Vite; empaquetada, cargamos los archivos compilados.
const isDev = !app.isPackaged

// Ruta del archivo de ajustes (carpeta de datos del usuario, propia de cada SO).
function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

const DEFAULT_SETTINGS = {
  tasaBs: 0,        // bolívares por 1 USD (0 = sin configurar)
  nombreLocal: 'AndyiOS',
  tema: 'claro'     // 'claro' u 'oscuro'
}

function leerAjustes() {
  try {
    const data = fs.readFileSync(settingsPath(), 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function guardarAjustes(nuevos) {
  const actuales = leerAjustes()
  const merged = { ...actuales, ...nuevos }
  fs.writeFileSync(settingsPath(), JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#F5F5F7',
    titleBarStyle: 'hiddenInset', // barra de título estilo Mac (en Windows se ve normal)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    // win.webContents.openDevTools() // descomenta para depurar
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// ----- Canales IPC para Ajustes (el renderer los llama vía preload) -----
ipcMain.handle('settings:get', () => leerAjustes())
ipcMain.handle('settings:set', (_evt, nuevos) => guardarAjustes(nuevos))

// ----- Canales IPC para productos (inventario) -----
ipcMain.handle('productos:list', () => db.listarProductos())
ipcMain.handle('productos:add', (_evt, producto) => db.agregarProducto(producto))
ipcMain.handle('productos:remove', (_evt, id) => db.eliminarProducto(id))
ipcMain.handle('productos:update', (_evt, p) => db.actualizarProducto(p))
ipcMain.handle('stats:get', () => db.estadisticas())

// ----- Movimientos (ingresos / gastos) -----
ipcMain.handle('mov:list', () => db.listarMovimientos())
ipcMain.handle('mov:add', (_evt, m) => db.agregarMovimiento(m))
ipcMain.handle('mov:remove', (_evt, id) => db.eliminarMovimiento(id))

// ----- Ventas y cambios -----
ipcMain.handle('ventas:list', () => db.listarVentas())
ipcMain.handle('ventas:add', (_evt, venta) => db.registrarVenta(venta))
ipcMain.handle('cambios:list', () => db.listarCambios())
ipcMain.handle('cambios:add', (_evt, cambio) => db.registrarCambio(cambio))

// ----- Clientes -----
ipcMain.handle('clientes:list', () => db.listarClientes())
ipcMain.handle('clientes:add', (_evt, c) => db.agregarCliente(c))
ipcMain.handle('clientes:update', (_evt, c) => db.actualizarCliente(c))
ipcMain.handle('clientes:remove', (_evt, id) => db.eliminarCliente(id))

// ----- Modelos de zapatos -----
ipcMain.handle('zapatos:listModelos', () => db.listarModelosZapato())
ipcMain.handle('zapatos:addModelo', (_evt, m) => db.agregarModeloZapato(m))
ipcMain.handle('zapatos:removeModelo', (_evt, id) => db.eliminarModeloZapato(id))

// ----- Respaldo / importación -----
ipcMain.handle('backup:export', async () => {
  const fecha = new Date().toISOString().slice(0, 10)
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Guardar respaldo de AndyiOS',
    defaultPath: `andyios-respaldo-${fecha}.sqlite`,
    filters: [{ name: 'Base de datos SQLite', extensions: ['sqlite'] }]
  })
  if (canceled || !filePath) return { ok: false }
  fs.copyFileSync(db.rutaDB(), filePath)
  return { ok: true, filePath }
})

ipcMain.handle('backup:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Importar respaldo (reemplaza tus datos actuales)',
    filters: [{ name: 'Base de datos SQLite', extensions: ['sqlite'] }],
    properties: ['openFile']
  })
  if (canceled || !filePaths || !filePaths[0]) return { ok: false }
  fs.copyFileSync(filePaths[0], db.rutaDB())
  db.reabrir()
  return { ok: true }
})

app.whenReady().then(async () => {
  await db.init(app.getPath('userData')) // abre/crea la base antes de mostrar la ventana
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
