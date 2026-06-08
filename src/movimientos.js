// Acceso a datos de movimientos (ingresos / gastos) — con respaldo en memoria.
const tieneAndy = typeof window !== 'undefined' && window.andy
let mem = []
let id = 1

export async function listarMovimientos() {
  if (tieneAndy) return window.andy.listarMovimientos()
  return [...mem].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}
export async function agregarMovimiento(m) {
  if (tieneAndy) return window.andy.agregarMovimiento(m)
  const row = { id: id++, ...m, monto: Number(m.monto) || 0, fecha: m.fecha || new Date().toISOString() }
  mem.push(row); return row
}
export async function eliminarMovimiento(idm) {
  if (tieneAndy) return window.andy.eliminarMovimiento(idm)
  mem = mem.filter((x) => x.id !== idm); return true
}

export const CATEGORIAS_INGRESO = ['Servicio/Reparación', 'Accesorios sueltos', 'Abono de cliente', 'Otro ingreso']
export const CATEGORIAS_GASTO = ['Alquiler', 'Servicios (luz/agua/internet)', 'Compra de mercancía', 'Sueldos', 'Transporte', 'Publicidad', 'Otro gasto']
