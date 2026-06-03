// ===== Base de datos local (SQLite vía sql.js / WebAssembly) =====
// Guardamos un archivo .sqlite real en la carpeta de datos del usuario.
// sql.js mantiene la base en memoria; tras cada cambio la escribimos a disco.
const fs = require('fs')
const path = require('path')
const initSqlJs = require('sql.js')

let db = null
let dbPath = null
let SQLib = null

async function init(userDataDir) {
  dbPath = path.join(userDataDir, 'andyios.sqlite')
  SQLib = await initSqlJs({
    locateFile: (f) => path.join(path.dirname(require.resolve('sql.js')), f)
  })
  abrir()
}

// Abre (o crea) la base desde disco y aplica esquema + migraciones.
function abrir() {
  db = fs.existsSync(dbPath) ? new SQLib.Database(fs.readFileSync(dbPath)) : new SQLib.Database()
  crearEsquema()
  migrar()
  guardar()
}

function crearEsquema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo                TEXT NOT NULL,            -- 'iPhone' | 'Otro' | 'Zapato'
      estado              TEXT NOT NULL DEFAULT 'Disponible',
      precio_costo        REAL NOT NULL DEFAULT 0,
      precio_potencial    REAL NOT NULL DEFAULT 0,
      foto                TEXT,
      fecha_ingreso       TEXT NOT NULL,
      modelo              TEXT,
      serie               TEXT,
      almacenamiento      TEXT,
      bateria             INTEGER,
      estado_fisico       TEXT,
      color               TEXT,
      incluye_caja        INTEGER DEFAULT 0,
      incluye_cargador    INTEGER DEFAULT 0,
      piezas_reemplazadas TEXT,
      nombre              TEXT,
      categoria           TEXT,
      origen              TEXT,
      notas               TEXT,
      talla               TEXT,
      modelo_zapato_id    INTEGER,
      etiqueta            TEXT,
      cliente_id          INTEGER
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id     INTEGER,
      precio_final    REAL NOT NULL DEFAULT 0,
      ganancia        REAL NOT NULL DEFAULT 0,
      fecha           TEXT NOT NULL,
      tipo_operacion  TEXT NOT NULL DEFAULT 'venta',
      cliente_id      INTEGER
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS cambios (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_entregado_id  INTEGER,
      precio_venta_entregado REAL,
      producto_recibido_id   INTEGER,
      valor_cotizado         REAL,
      diferencia             REAL,
      fecha                  TEXT NOT NULL,
      cliente_id             INTEGER
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula    TEXT,
      nombre    TEXT NOT NULL,
      telefono  TEXT,
      fecha     TEXT
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS modelos_zapato (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre  TEXT NOT NULL,
      marca   TEXT,
      foto    TEXT,
      fecha   TEXT
    )
  `)
}

// Añade columnas nuevas a bases de datos ya existentes (sin perder datos).
function migrar() {
  const cols = (tabla) => query(`PRAGMA table_info(${tabla})`).map((c) => c.name)
  const addCol = (tabla, col, def) => { if (!cols(tabla).includes(col)) db.run(`ALTER TABLE ${tabla} ADD COLUMN ${col} ${def}`) }
  addCol('productos', 'talla', 'TEXT')
  addCol('productos', 'modelo_zapato_id', 'INTEGER')
  addCol('productos', 'etiqueta', 'TEXT')
  addCol('productos', 'cliente_id', 'INTEGER')
  addCol('ventas', 'cliente_id', 'INTEGER')
  addCol('cambios', 'cliente_id', 'INTEGER')
}

function guardar() {
  fs.writeFileSync(dbPath, Buffer.from(db.export()))
}

function query(sql, params = {}) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const filas = []
  while (stmt.step()) filas.push(stmt.getAsObject())
  stmt.free()
  return filas
}

// ----- Productos -----
function listarProductos() {
  return query('SELECT * FROM productos ORDER BY datetime(fecha_ingreso) DESC, id DESC')
}

// Inserta el producto. Si p.cantidad > 1, crea esa cantidad de unidades idénticas.
function agregarProducto(p) {
  const cantidad = Math.max(1, parseInt(p.cantidad, 10) || 1)
  let ultimo = null
  for (let i = 0; i < cantidad; i++) {
    db.run(`
      INSERT INTO productos (
        tipo, estado, precio_costo, precio_potencial, foto, fecha_ingreso,
        modelo, serie, almacenamiento, bateria, estado_fisico, color,
        incluye_caja, incluye_cargador, piezas_reemplazadas,
        nombre, categoria, origen, notas, talla, modelo_zapato_id, etiqueta, cliente_id
      ) VALUES (
        $tipo, 'Disponible', $precio_costo, $precio_potencial, $foto, $fecha_ingreso,
        $modelo, $serie, $almacenamiento, $bateria, $estado_fisico, $color,
        $incluye_caja, $incluye_cargador, $piezas_reemplazadas,
        $nombre, $categoria, $origen, $notas, $talla, $modelo_zapato_id, $etiqueta, $cliente_id
      )
    `, {
      $tipo: p.tipo,
      $precio_costo: Number(p.precio_costo) || 0,
      $precio_potencial: Number(p.precio_potencial) || 0,
      $foto: p.foto || null,
      $fecha_ingreso: p.fecha_ingreso || new Date().toISOString(),
      $modelo: p.modelo || null,
      $serie: p.serie || null,
      $almacenamiento: p.almacenamiento || null,
      $bateria: p.bateria != null && p.bateria !== '' ? Number(p.bateria) : null,
      $estado_fisico: p.estado_fisico || null,
      $color: p.color || null,
      $incluye_caja: p.incluye_caja ? 1 : 0,
      $incluye_cargador: p.incluye_cargador ? 1 : 0,
      $piezas_reemplazadas: p.piezas_reemplazadas || null,
      $nombre: p.nombre || null,
      $categoria: p.categoria || null,
      $origen: p.origen || null,
      $notas: p.notas || null,
      $talla: p.talla || null,
      $modelo_zapato_id: p.modelo_zapato_id || null,
      $etiqueta: p.etiqueta || null,
      $cliente_id: p.cliente_id || null
    })
    ultimo = query('SELECT * FROM productos ORDER BY id DESC LIMIT 1')[0]
  }
  guardar()
  return ultimo
}

function eliminarProducto(id) {
  db.run('DELETE FROM productos WHERE id = $id', { $id: id })
  guardar()
  return true
}

// ----- Ventas -----
function registrarVenta({ producto_id, precio_final, tipo_operacion = 'venta', cliente_id = null }) {
  const prod = query('SELECT * FROM productos WHERE id = $id', { $id: producto_id })[0]
  if (!prod) throw new Error('Producto no encontrado')
  const ganancia = (Number(precio_final) || 0) - (Number(prod.precio_costo) || 0)
  db.run(`INSERT INTO ventas (producto_id, precio_final, ganancia, fecha, tipo_operacion, cliente_id)
          VALUES ($pid, $pf, $g, $fecha, $tipo, $cli)`, {
    $pid: producto_id, $pf: Number(precio_final) || 0, $g: ganancia,
    $fecha: new Date().toISOString(), $tipo: tipo_operacion, $cli: cliente_id || null
  })
  db.run("UPDATE productos SET estado = 'Vendido' WHERE id = $id", { $id: producto_id })
  guardar()
  return query('SELECT * FROM ventas ORDER BY id DESC LIMIT 1')[0]
}

function listarVentas() {
  const ventas = query('SELECT * FROM ventas ORDER BY datetime(fecha) DESC, id DESC')
  const prods = query('SELECT * FROM productos'); const mp = {}; prods.forEach((p) => { mp[p.id] = p })
  const clientes = query('SELECT * FROM clientes'); const mc = {}; clientes.forEach((c) => { mc[c.id] = c })
  return ventas.map((v) => ({ ...v, producto: mp[v.producto_id] || null, cliente: mc[v.cliente_id] || null }))
}

// ----- Cambios (trade-in) -----
function registrarCambio({ producto_entregado_id, precio_venta_entregado, recibido, cliente_id = null }) {
  const valor_cotizado = Number(recibido.valor_cotizado) || 0
  const nuevo = agregarProducto({
    ...recibido, precio_costo: valor_cotizado,
    precio_potencial: Number(recibido.precio_potencial) || valor_cotizado,
    origen: 'Cambio', cliente_id
  })
  registrarVenta({ producto_id: producto_entregado_id, precio_final: precio_venta_entregado, tipo_operacion: 'cambio', cliente_id })
  const diferencia = (Number(precio_venta_entregado) || 0) - valor_cotizado
  db.run(`INSERT INTO cambios (producto_entregado_id, precio_venta_entregado, producto_recibido_id, valor_cotizado, diferencia, fecha, cliente_id)
          VALUES ($e, $pv, $r, $vc, $dif, $fecha, $cli)`, {
    $e: producto_entregado_id, $pv: Number(precio_venta_entregado) || 0,
    $r: nuevo.id, $vc: valor_cotizado, $dif: diferencia, $fecha: new Date().toISOString(), $cli: cliente_id || null
  })
  guardar()
  return { recibido: nuevo, diferencia }
}

function listarCambios() {
  const cambios = query('SELECT * FROM cambios ORDER BY datetime(fecha) DESC, id DESC')
  const prods = query('SELECT * FROM productos'); const mp = {}; prods.forEach((p) => { mp[p.id] = p })
  const clientes = query('SELECT * FROM clientes'); const mc = {}; clientes.forEach((c) => { mc[c.id] = c })
  return cambios.map((c) => ({
    ...c, entregado: mp[c.producto_entregado_id] || null, recibido: mp[c.producto_recibido_id] || null,
    cliente: mc[c.cliente_id] || null
  }))
}

// ----- Clientes -----
function listarClientes() { return query('SELECT * FROM clientes ORDER BY nombre COLLATE NOCASE') }
function agregarCliente(c) {
  db.run('INSERT INTO clientes (cedula, nombre, telefono, fecha) VALUES ($c, $n, $t, $f)',
    { $c: c.cedula || null, $n: c.nombre || '', $t: c.telefono || null, $f: new Date().toISOString() })
  guardar(); return query('SELECT * FROM clientes ORDER BY id DESC LIMIT 1')[0]
}
function actualizarCliente(c) {
  db.run('UPDATE clientes SET cedula = $c, nombre = $n, telefono = $t WHERE id = $id',
    { $id: c.id, $c: c.cedula || null, $n: c.nombre || '', $t: c.telefono || null })
  guardar(); return query('SELECT * FROM clientes WHERE id = $id', { $id: c.id })[0]
}
function eliminarCliente(id) { db.run('DELETE FROM clientes WHERE id = $id', { $id: id }); guardar(); return true }

// ----- Modelos de zapatos -----
function listarModelosZapato() { return query('SELECT * FROM modelos_zapato ORDER BY nombre COLLATE NOCASE') }
function agregarModeloZapato(m) {
  db.run('INSERT INTO modelos_zapato (nombre, marca, foto, fecha) VALUES ($n, $m, $f, $fe)',
    { $n: m.nombre || '', $m: m.marca || null, $f: m.foto || null, $fe: new Date().toISOString() })
  guardar(); return query('SELECT * FROM modelos_zapato ORDER BY id DESC LIMIT 1')[0]
}
function eliminarModeloZapato(id) { db.run('DELETE FROM modelos_zapato WHERE id = $id', { $id: id }); guardar(); return true }

// ----- Estadísticas -----
function estadisticas() {
  const suma = (filas, campo) => filas.reduce((t, f) => t + (Number(f[campo]) || 0), 0)
  const disponibles = query("SELECT * FROM productos WHERE estado = 'Disponible'")
  const todos = query('SELECT precio_costo FROM productos')
  const ventas = query('SELECT * FROM ventas')

  const valor_inventario = suma(disponibles, 'precio_costo')
  const valor_potencial = suma(disponibles, 'precio_potencial')

  const porTipo = {}
  for (const p of disponibles) {
    const clave = p.tipo === 'iPhone' ? 'iPhone' : p.tipo === 'Zapato' ? 'Zapatos' : (p.categoria || 'Otro')
    porTipo[clave] = (porTipo[clave] || 0) + 1
  }
  const inventario_por_tipo = Object.entries(porTipo).map(([name, value]) => ({ name, value }))

  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const ahora = new Date()
  const enMes = (v, a, m) => { const f = new Date(v.fecha); return f.getFullYear() === a && f.getMonth() === m }
  const ganancias_por_mes = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const dm = ventas.filter((v) => enMes(v, d.getFullYear(), d.getMonth()))
    ganancias_por_mes.push({ mes: MESES[d.getMonth()], ganancia: suma(dm, 'ganancia'), ventas: dm.length })
  }
  const vMes = ventas.filter((v) => enMes(v, ahora.getFullYear(), ahora.getMonth()))

  return {
    valor_inventario, valor_potencial,
    ganancia_potencial: valor_potencial - valor_inventario,
    unidades_stock: disponibles.length,
    costos_totales: suma(todos, 'precio_costo'),
    inventario_por_tipo,
    ganancias_realizadas: suma(ventas, 'ganancia'),
    ganancias_mes: suma(vMes, 'ganancia'),
    ventas_mes: vMes.length,
    ganancias_por_mes,
    hay_ventas: ventas.length > 0
  }
}

// ----- Respaldo / importación -----
function rutaDB() { return dbPath }
function reabrir() { abrir() } // recarga la base desde el archivo en disco

module.exports = {
  init, listarProductos, agregarProducto, eliminarProducto, estadisticas,
  registrarVenta, listarVentas, registrarCambio, listarCambios,
  listarClientes, agregarCliente, actualizarCliente, eliminarCliente,
  listarModelosZapato, agregarModeloZapato, eliminarModeloZapato,
  rutaDB, reabrir
}
