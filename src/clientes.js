// Acceso a datos de clientes (con respaldo en memoria para la vista previa).
const tieneAndy = typeof window !== 'undefined' && window.andy
let mem = []
let id = 1

export async function listarClientes() {
  if (tieneAndy) return window.andy.listarClientes()
  return [...mem].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
}
export async function agregarCliente(c) {
  if (tieneAndy) return window.andy.agregarCliente(c)
  const r = { id: id++, ...c }; mem.push(r); return r
}
export async function actualizarCliente(c) {
  if (tieneAndy) return window.andy.actualizarCliente(c)
  const i = mem.findIndex((x) => x.id === c.id); if (i >= 0) mem[i] = { ...mem[i], ...c }; return mem[i]
}
export async function eliminarCliente(idc) {
  if (tieneAndy) return window.andy.eliminarCliente(idc)
  mem = mem.filter((x) => x.id !== idc); return true
}
