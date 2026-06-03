// Acceso a datos de modelos de zapatos (con respaldo en memoria para la vista previa).
const tieneAndy = typeof window !== 'undefined' && window.andy
let mem = []
let id = 1

export async function listarModelosZapato() {
  if (tieneAndy) return window.andy.listarModelosZapato()
  return [...mem]
}
export async function agregarModeloZapato(m) {
  if (tieneAndy) return window.andy.agregarModeloZapato(m)
  const r = { id: id++, ...m }; mem.push(r); return r
}
export async function eliminarModeloZapato(idm) {
  if (tieneAndy) return window.andy.eliminarModeloZapato(idm)
  mem = mem.filter((x) => x.id !== idm); return true
}
