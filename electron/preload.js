// ===== Puente seguro entre la app (React) y el proceso principal =====
// Expone solo funciones concretas en window.andy — no todo Node.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('andy', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (nuevos) => ipcRenderer.invoke('settings:set', nuevos),
  // Inventario
  listarProductos: () => ipcRenderer.invoke('productos:list'),
  agregarProducto: (producto) => ipcRenderer.invoke('productos:add', producto),
  eliminarProducto: (id) => ipcRenderer.invoke('productos:remove', id),
  estadisticas: () => ipcRenderer.invoke('stats:get'),
  // Ventas y cambios
  listarVentas: () => ipcRenderer.invoke('ventas:list'),
  registrarVenta: (venta) => ipcRenderer.invoke('ventas:add', venta),
  listarCambios: () => ipcRenderer.invoke('cambios:list'),
  registrarCambio: (cambio) => ipcRenderer.invoke('cambios:add', cambio),
  // Clientes
  listarClientes: () => ipcRenderer.invoke('clientes:list'),
  agregarCliente: (c) => ipcRenderer.invoke('clientes:add', c),
  actualizarCliente: (c) => ipcRenderer.invoke('clientes:update', c),
  eliminarCliente: (id) => ipcRenderer.invoke('clientes:remove', id),
  // Modelos de zapatos
  listarModelosZapato: () => ipcRenderer.invoke('zapatos:listModelos'),
  agregarModeloZapato: (m) => ipcRenderer.invoke('zapatos:addModelo', m),
  eliminarModeloZapato: (id) => ipcRenderer.invoke('zapatos:removeModelo', id),
  // Respaldo
  exportarRespaldo: () => ipcRenderer.invoke('backup:export'),
  importarRespaldo: () => ipcRenderer.invoke('backup:import')
})
