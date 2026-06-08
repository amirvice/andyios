// Genera build/icon.png (1024x1024) desde el SVG del ícono de Vicery.
// electron-builder lo usa automáticamente como ícono de la app en macOS.
const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs'); const path = require('path')

const svg = fs.readFileSync(path.join(__dirname, '..', 'src', 'assets', 'vicery-icono.svg'), 'utf-8')
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 }, background: 'rgba(0,0,0,0)' })
const png = resvg.render().asPng()
const out = path.join(__dirname, '..', 'build')
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'icon.png'), png)
console.log('build/icon.png 1024x1024 generado (' + Math.round(png.length / 1024) + ' KB)')
