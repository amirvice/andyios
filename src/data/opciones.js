// Catálogo de opciones para los formularios (selecciones fijas).
export const MODELOS = ['XR', '11', '12', '13', '14', '15', '16', '17', '18']
export const SERIES = ['Normal', 'Plus', 'Pro', 'Pro Max']
export const ALMACENAMIENTO = ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB']
export const ESTADOS_FISICOS = ['Decente', 'Regular', 'Excelente']
export const ORIGENES = ['Persona', 'eBay']
export const CATEGORIAS = ['PlayStation', 'Cargador', 'Forro', 'Cable', 'Auriculares', 'Otro']

// Ícono según el producto
export function iconoProducto(p) {
  if (p.tipo === 'iPhone') return '📱'
  if (p.tipo === 'Zapato') return '👟'
  switch (p.categoria) {
    case 'PlayStation': return '🎮'
    case 'Auriculares': return '🎧'
    case 'Cargador':
    case 'Cable': return '🔌'
    case 'Forro': return '🛡️'
    default: return '📦'
  }
}

// Texto descriptivo de un producto guardado
export function describirProducto(p) {
  if (p.tipo === 'iPhone') {
    const serie = p.serie && p.serie !== 'Normal' ? ' ' + p.serie : ''
    const titulo = `iPhone ${p.modelo || ''}${serie}`.trim()
    const detalles = [
      p.almacenamiento,
      p.bateria != null ? `Bat ${p.bateria}%` : null,
      p.estado_fisico,
      p.incluye_caja ? '📦 con caja' : null,
      p.piezas_reemplazadas ? `piezas: ${p.piezas_reemplazadas}` : null,
      p.etiqueta ? `🏷️ ${p.etiqueta}` : null
    ].filter(Boolean).join(' · ')
    return { titulo, sub: p.color || 'iPhone', detalles }
  }
  if (p.tipo === 'Zapato') {
    const detalles = [
      p.talla ? `Talla ${p.talla}` : null,
      p.color,
      p.etiqueta ? `🏷️ ${p.etiqueta}` : null
    ].filter(Boolean).join(' · ')
    return { titulo: p.nombre || 'Zapato', sub: 'Zapato', detalles }
  }
  const detalles = [p.notas, p.etiqueta ? `🏷️ ${p.etiqueta}` : null].filter(Boolean).join(' · ')
  return { titulo: p.nombre || 'Producto', sub: p.categoria || 'Otro', detalles }
}
