// ===== Acceso a datos (renderer) =====
// Usa window.andy (IPC a SQLite) en Electron; si no existe (navegador en dev),
// usa arreglos en memoria para que la interfaz no se rompa.
const tieneAndy = typeof window !== 'undefined' && window.andy

let memoria = []
let ventasMem = []
let cambiosMem = []
let memId = 1

// ----- Productos -----
export async function listarProductos() {
  if (tieneAndy) return window.andy.listarProductos()
  return [...memoria].reverse()
}

export async function agregarProducto(p) {
  if (tieneAndy) return window.andy.agregarProducto(p)
  const cantidad = Math.max(1, parseInt(p.cantidad, 10) || 1)
  let row = null
  for (let i = 0; i < cantidad; i++) {
    row = {
      id: memId++, estado: 'Disponible', fecha_ingreso: new Date().toISOString(),
      ...p,
      incluye_caja: p.incluye_caja ? 1 : 0,
      incluye_cargador: p.incluye_cargador ? 1 : 0
    }
    memoria.push(row)
  }
  return row
}

export async function eliminarProducto(id) {
  if (tieneAndy) return window.andy.eliminarProducto(id)
  memoria = memoria.filter((p) => p.id !== id)
  return true
}

// ----- Ventas -----
export async function registrarVenta(venta) {
  if (tieneAndy) return window.andy.registrarVenta(venta)
  const prod = memoria.find((p) => p.id === venta.producto_id)
  if (prod) prod.estado = 'Vendido'
  const row = {
    id: memId++, producto_id: venta.producto_id,
    precio_final: Number(venta.precio_final) || 0,
    ganancia: (Number(venta.precio_final) || 0) - (prod ? Number(prod.precio_costo) || 0 : 0),
    fecha: new Date().toISOString(), tipo_operacion: venta.tipo_operacion || 'venta'
  }
  ventasMem.push(row)
  return row
}

export async function listarVentas() {
  if (tieneAndy) return window.andy.listarVentas()
  return [...ventasMem].reverse().map((v) => ({ ...v, producto: memoria.find((p) => p.id === v.producto_id) || null }))
}

// ----- Cambios -----
export async function registrarCambio(cambio) {
  if (tieneAndy) return window.andy.registrarCambio(cambio)
  const valor_cotizado = Number(cambio.recibido.valor_cotizado) || 0
  const nuevo = await agregarProducto({
    ...cambio.recibido, precio_costo: valor_cotizado,
    precio_potencial: Number(cambio.recibido.precio_potencial) || valor_cotizado, origen: 'Cambio'
  })
  await registrarVenta({ producto_id: cambio.producto_entregado_id, precio_final: cambio.precio_venta_entregado, tipo_operacion: 'cambio' })
  const diferencia = (Number(cambio.precio_venta_entregado) || 0) - valor_cotizado
  cambiosMem.push({ id: memId++, ...cambio, producto_recibido_id: nuevo.id, valor_cotizado, diferencia, fecha: new Date().toISOString() })
  return { recibido: nuevo, diferencia }
}

export async function listarCambios() {
  if (tieneAndy) return window.andy.listarCambios()
  return [...cambiosMem].reverse().map((c) => ({
    ...c,
    entregado: memoria.find((p) => p.id === c.producto_entregado_id) || null,
    recibido: memoria.find((p) => p.id === c.producto_recibido_id) || null
  }))
}

// ----- Estadísticas -----
export async function estadisticas() {
  if (tieneAndy) return window.andy.estadisticas()
  const disp = memoria.filter((p) => p.estado === 'Disponible')
  const suma = (arr, c) => arr.reduce((t, f) => t + (Number(f[c]) || 0), 0)
  const porTipo = {}
  for (const p of disp) {
    const k = p.tipo === 'iPhone' ? 'iPhone' : (p.categoria || 'Otro')
    porTipo[k] = (porTipo[k] || 0) + 1
  }
  const valor_inventario = suma(disp, 'precio_costo')
  const valor_potencial = suma(disp, 'precio_potencial')
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const ahora = new Date()
  const enMes = (v, a, m) => { const f = new Date(v.fecha); return f.getFullYear() === a && f.getMonth() === m }
  const ganancias_por_mes = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const dm = ventasMem.filter((v) => enMes(v, d.getFullYear(), d.getMonth()))
    ganancias_por_mes.push({ mes: MESES[d.getMonth()], ganancia: suma(dm, 'ganancia'), ventas: dm.length })
  }
  const vMes = ventasMem.filter((v) => enMes(v, ahora.getFullYear(), ahora.getMonth()))
  return {
    valor_inventario, valor_potencial,
    ganancia_potencial: valor_potencial - valor_inventario,
    unidades_stock: disp.length,
    costos_totales: suma(memoria, 'precio_costo'),
    inventario_por_tipo: Object.entries(porTipo).map(([name, value]) => ({ name, value })),
    ganancias_realizadas: suma(ventasMem, 'ganancia'),
    ganancias_mes: suma(vMes, 'ganancia'),
    ventas_mes: vMes.length,
    ganancias_por_mes,
    hay_ventas: ventasMem.length > 0
  }
}
