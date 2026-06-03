# AndyiOS

App de escritorio para gestionar **inventario y ventas** de un local de reventa de
dispositivos móviles (iPhones, PS5, accesorios). Uso local, una sola computadora,
sin servidor.

- **Stack:** Electron + React + Vite (SQLite local llega en la Fase 2).
- **Desarrollo:** Windows. **Destino final:** macOS (.app/.dmg al final del proyecto).
- **Moneda:** dólar (principal) + bolívares con tasa configurable en Ajustes.

---

## Cómo correr la app en Windows (modo desarrollo)

1. Abre una terminal (PowerShell) dentro de la carpeta `andyios`.
2. La primera vez, instala las dependencias:
   ```powershell
   npm install
   ```
3. Inicia la app:
   ```powershell
   npm run dev
   ```
   Se abrirá la ventana de **AndyiOS**. Mientras dejes esa terminal abierta, la app
   recarga sola cuando se cambia el código. Para cerrarla, cierra la ventana o pulsa
   `Ctrl + C` en la terminal.

---

## Ubicación del proyecto

El proyecto vive en `C:\Dev\AndyiOS\` (**fuera de OneDrive**, a propósito).

> Mantenerlo fuera de OneDrive evita dos problemas: que OneDrive sincronice miles de
> archivos de `node_modules`, y que **corte la instalación de Electron** (el binario se
> descarga pero no termina de extraerse, dando el error *"Electron failed to install
> correctly"*). **No muevas esta carpeta de vuelta a OneDrive.**

Si alguna vez reinstalas dependencias y Electron falla al instalar, repáralo con:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\fix-electron.ps1
```

---

## Estructura del proyecto

```
andyios/
├─ electron/          Proceso principal de Electron (Node)
│  ├─ main.js         Crea la ventana; lee/guarda Ajustes en disco
│  └─ preload.js      Puente seguro app <-> sistema (window.andy)
├─ src/               Aplicación React (la interfaz)
│  ├─ App.jsx         Navegación entre pantallas
│  ├─ settings.jsx    Ajustes globales + helpers de moneda (USD/Bs)
│  ├─ styles.css      Sistema de diseño (estilo Apple/iOS)
│  ├─ components/     Sidebar, Placeholder
│  └─ pages/          Dashboard, Inventario, Ventas, Cambios, Reportes, Ajustes
├─ scripts/
│  └─ fix-electron.ps1   Repara Electron si OneDrive corta la instalación
└─ index.html        Punto de entrada del renderer
```

Los **Ajustes** (incluida la tasa USD→Bs) se guardan en:
`%APPDATA%\andyios\settings.json`

---

## Estado por fases

- [x] **Fase 1 — Esqueleto + diseño base**: navegación, sistema de diseño, Ajustes con tasa USD→Bs. (+ modo oscuro)
- [x] **Fase 2 — Inventario + alta de productos** (base de datos SQLite real con sql.js).
- [x] **Fase 3 — Dashboard** con métricas reales del inventario.
- [x] **Fase 4 — Ventas** (precio final editable, ganancia, marca producto Vendido).
- [x] **Fase 5 — Cambios / trade-in** (equipo recibido entra al inventario, diferencia automática).

- [x] **Reportes** — resumen por periodo: ventas, ingresos, ganancia, mejores modelos, gráficos, detalle con fechas, exportar CSV.
- [x] **Clientes** — cédula, nombre, teléfono; se asocian a ventas, compras y cambios.
- [x] **Cantidad** al agregar productos (crea varias unidades de una vez).
- [x] **Zapatos** — crear modelos y luego ingresar pares (modelo, color, talla, precio, fotos); se venden como cualquier producto.
- [x] **Respaldo** — exportar/importar la base (.sqlite) y exportar inventario/ventas a CSV (en Ajustes).
- [x] **Etiquetas** en productos + búsqueda mejorada.

**✅ App completa.** Único pendiente: empaquetado **.dmg para macOS** (cuando tengas acceso a una Mac).

> Tus datos viven en `%APPDATA%\andyios\andyios.sqlite`. **Haz respaldos** desde Ajustes con frecuencia.
