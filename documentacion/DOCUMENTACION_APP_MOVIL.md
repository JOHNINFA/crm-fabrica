# 📱 APP MÓVIL - AP GUERRERO (REACT NATIVE)

## 📅 Última actualización: 2026-01-05
## 🎯 Estado: FUNCIONANDO - Documentación Completa

---

## 📊 ARQUITECTURA DE LA APP

```
AP GUERRERO/
├── App.js (141 líneas) - Navegación principal
├── LoginScreen.js - Autenticación
├── MainScreen.js - Pantalla de "Sugerido"
├── config.js - Endpoints y configuración
├── components/
│   ├── OptionsScreen.js (99 líneas) - Menú principal (5 botones)
│   ├── Cargue.js (636 líneas) - Consultar cargue y marcar checks
│   ├── ProductList.js (322 líneas) - "Sugerido" (crear cargue)
│   ├── Vencidas.js (388 líneas) - Ver rendimiento
│   ├── Navbar.js - Selector de días
│   ├── Product.js - Componente de producto
│   ├── Ventas/ (5 archivos) - Ventas en ruta
│   │   ├── VentasScreen.js (70KB - el más grande)
│   │   ├── ClienteSelector.js (18KB)
│   │   ├── ClienteModal.js (18KB)
│   │   ├── DevolucionesVencidas.js (16KB)
│   │   └── ResumenVentaModal.js (20KB)
│   └── rutas/ (4 archivos) - Gestión de rutas
│       ├── InicioRutas.js
│       ├── SeleccionarRuta.js
│       ├── SeleccionarDia.js
│       └── ListaClientes.js (23KB)
└── services/
    ├── ventasService.js (23KB) - Lógica de ventas y cache
    ├── rutasApiService.js (5.8KB)
    ├── printerService.js (7.4KB) - Impresión de tickets
    └── sheetsService.js (2.5KB)
```

---

## 🗺️ NAVEGACIÓN COMPLETA

```
LoginScreen
    ↓ (autenticación exitosa)
OptionsScreen (MENÚ PRINCIPAL)
    ├─ Botón 1: "Ventas" ✅
    │     → VentasScreen
    │
    ├─ Botón 2: "Cargue" ✅
    │     → Cargue.js
    │
    ├─ Botón 3: "Sugerido" ✅
    │     → MainScreen → ProductList.js
    │
    ├─ Botón 4: "Rendimiento" ✅
    │     → Vencidas.js (⚠️ nombre confuso)
    │
    └─ Botón 5: "Rutas" ✅
          → InicioRutas
          → SeleccionarRuta
          → SeleccionarDia
          → ListaClientes
```

---

## 📋 MÓDULOS DETALLADOS

### **1. VENTAS** ✅
**Archivo:** `components/Ventas/VentasScreen.js` (70KB)

**Función:**
Registrar ventas en ruta cliente por cliente.

**Flujo:**
```javascript
1. Seleccionar cliente:
   - Desde rutas (pre-cargado)
   - Buscar por nombre
   - Crear nuevo cliente (modal)

2. Seleccionar productos:
   - Buscar por nombre
   - Agregar al carrito
   - Ajustar cantidades (+/-)

3. Método de pago:
   - EFECTIVO
   - NEQUI
   - DAVIPLATA
   - TRANSFERENCIA

4. Confirmar venta:
   POST /api/ventas-ruta/
   Body: {
     numero_venta: auto-generado,
     vendedor_id: "ID1", vendedor_nombre: "...",
     cliente_id: 123, cliente_nombre: "Tienda Sol",
     productos: [
       {
         producto_id: 5,
         nombre: "AREPA MEDIANA 330Gr",
         cantidad: 10,
         precio: 3500
       }
     ],
     total: 35000,
     metodo_pago: "EFECTIVO",
     fecha: "2026-01-05",
     hora: "10:30:00"
   }

5. Sincronización automática:
   → Guarda en tabla VentaRuta
   → Web consulta en tiempo real
   → Actualiza CargueID1.vendidas automáticamente

6. Imprimir ticket (opcional):
   - Usa printerService.js
   - Bluetooth printer
```

**Características:**
- ✅ Cache de productos (AsyncStorage)
- ✅ Cache de clientes por vendedor
- ✅ Búsqueda rápida
- ✅ Validación de stock
- ✅ Impresión de tickets Bluetooth
- ✅ Sincronización tiempo real

---

### **2. CARGUE** ✅
**Archivo:** `components/Cargue.js` (636 líneas)

**Función REAL:**
**CONSULTAR** el cargue del día despachado desde el web y marcar recepción.

**⚠️ IMPORTANTE:** NO permite crear/editar cantidades, solo marcar checks.

**Flujo:**
```javascript
1. Seleccionar día (LUNES-SÁBADO)
2. Seleccionar fecha (DatePicker)

3. Recargar datos:
   GET /api/obtener-cargue/?vendedor_id=ID1&dia=LUNES&fecha=2026-01-05
   
   Response: {
     "AREPA MEDIANA 330Gr": {
       quantity: 100,
       v: false,  // Check Vendedor
       d: true    // Check Despachador (del CRM)
     },
     ...
   }

4. Mostrar tabla:
   ┌───┬───┬──────┬────────────────────┐
   │ V │ D │ Cant │ Producto           │
   ├───┼───┼──────┼────────────────────┤
   │ ✓ │ ✓ │ 100  │ AREPA MEDIANA...   │
   │   │ ✓ │  50  │ ALMOJABANA         │
   └───┴───┴──────┴────────────────────┘

   V = Vendedor (editable en app)
   D = Despachador (solo lectura, viene del CRM)
   Cant = Solo lectura

5. Marcar Check "V":
   - Usuario toca checkbox V
   - Validaciones:
     * Si Check D no está marcado → Error "Despachador debe marcar primero"
     * Si cantidad = 0 → Error "Sin cantidad"
   - Si pasa validaciones:
     POST /api/actualizar-check-vendedor/
     Body: {
       vendedor_id: "ID1",
       dia: "LUNES",
       fecha: "2026-01-05",
       producto: "AREPA MEDIANA 330Gr",
       v: true
     }
   - Backend actualiza CargueID1.v = True
```

**Características:**
- ✅ Sincronización de productos en segundo plano
- ✅ Cache inteligente (30s)
- ✅ Validación de checks
- ✅ Vibración al marcar
- ✅ Optimistic updates (UI inmediata)
- ✅ Revert automático si falla
- ❌ NO permite editar cantidades
- ❌ NO crea cargue (solo consulta)

---

### **3. SUGERIDO** ✅ (Nombre confuso)
**Archivos:** `MainScreen.js` + `components/ProductList.js` (322 líneas)

**Función REAL:**
Vendedor **CREA su cargue manualmente** ingresando las cantidades que necesita.

**⚠️ NO ES IA - ES ENTRADA MANUAL**

**Flujo:**
```javascript
1. Seleccionar día (Navbar: LUNES-SÁBADO)

2. Ingresar cantidades MANUALMENTE:
   Por cada producto:
   - Mostrar imagen
   - Campo de cantidad (teclado numérico)
   - Vendedor decide cuánto necesita

3. Presionar "Enviar Sugerido"
   - Abre DatePicker
   - Seleccionar fecha del cargue

4. Validaciones:
   - Día debe coincidir con fecha
   - Al menos un producto con cantidad > 0
   - No puede haber sugerido duplicado

5. Enviar:
   POST /api/guardar-sugerido/
   Body: {
     vendedor_id: "ID1",
     dia: "LUNES",
     fecha: "2026-01-05",
     productos: [
       {nombre: "AREPA MEDIANA 330Gr", cantidad: 100},
       {nombre: "ALMOJABANA", cantidad: 50}
     ]
   }

6. Backend:
   - Verifica si ya existe (unique: dia+fecha+producto)
   - Si existe → Error 409 "YA_EXISTE_SUGERIDO"
   - Si no existe → Crea registros en CargueID1
   - Marca usuario = "AppMovil"

7. Resultado:
   - Se CREA el cargue del día en la BD
   - Web puede ver estas cantidades
   - Despachador revisa y ajusta si necesario
```

**Características:**
- ✅ Mapeo de imágenes de productos
- ✅ Búsqueda flexible de imágenes
- ✅ Validación día vs fecha
- ✅ Prevención de duplicados
- ✅ Cache de productos
- ❌ NO hay IA involucrada
- ❌ NO son "sugerencias automáticas"
- ⚠️ Nombre debería ser "Solicitar Cargue" o "Crear Pedido"

---

### **4. RENDIMIENTO** ✅ (Botón mal nombrado)
**Archivo:** `components/Vencidas.js` (388 líneas)

**⚠️ CONFUSIÓN:** El botón dice "Rendimiento" pero el archivo se llama "Vencidas.js"

**Función REAL:**
Ver **estadísticas de cargue** por día (solo lectura).

**Flujo:**
```javascript
1. Seleccionar día (Navbar)
2. Seleccionar fecha (DatePicker)

3. Consultar datos:
   GET /api/rendimiento-cargue/?dia=LUNES&fecha=2026-01-05
   
   Response: {
     success: true,
     data: [
       {
         producto: "AREPA MEDIANA 330Gr",
         vencidas: 5,
         devoluciones: 10,
         total: 100  // Cantidad despachada
       }
     ]
   }

4. Mostrar tabla:
   ┌─────────────────┬─────────┬───────────┬───────┐
   │ PRODUCTO        │ VENCIDAS│ DEVOLUCI. │ TOTAL │
   ├─────────────────┼─────────┼───────────┼───────┤
   │ AREPA MEDIANA...│    5    │    10     │  100  │
   │ ALMOJABANA      │    0    │     5     │   50  │
   └─────────────────┴─────────┴───────────┴───────┘
```

**Características:**
- ✅ Sincronización de productos
- ✅ Solo lectura (no edita nada)
- ✅ Muestra rendimiento del día
- ❌ NO registra vencidas (solo consulta)
- ⚠️ Nombre debería ser "Ver Rendimiento"

---

### **5. RUTAS** ✅
**Archivos:** `components/rutas/` (4 archivos)

**Función:**
Gestionar clientes organizados por rutas y días.

**Flujo:**
```javascript
InicioRutas.js
  - Pantalla de inicio de rutas
  ↓
SeleccionarRuta.js
  - GET /api/rutas/?vendedor_id=ID1
  - Muestra rutas del vendedor
  - Seleccionar una ruta
  ↓
SeleccionarDia.js
  - Seleccionar día (LUNES-DOMINGO)
  - Filtra clientes de ese día
  ↓
ListaClientes.js (23KB)
  - GET /api/clientes-ruta/?vendedor_id=ID1&dia=LUNES
  - Lista de clientes ordenada por visita
  - Por cada cliente:
    * Nombre, negocio
    * Dirección
    * Teléfono
    * Orden de visita
    * Botón "VENDER" → Abre VentasScreen con cliente pre-cargado
```

**Características:**
- ✅ Cache de clientes por vendedor
- ✅ Precarga automática al login
- ✅ Búsqueda de clientes
- ✅ Integración con Ventas
- ✅ Orden de visita respetado

---

## 🔧 SERVICIOS

### **ventasService.js** (23KB)
```javascript
Funciones:
- inicializarProductos() - Carga productos desde backend
- sincronizarProductos() - Actualiza cache de productos
- obtenerProductos() - Lee de AsyncStorage
- guardarVenta() - POST /api/ventas-ruta/
- imprimirTicket() - Integración con printerService

Cache:
- productos_cache: Lista completa de productos
- clientes_cache_ID1: Clientes por vendedor
- last_user_id: Último vendedor logueado

Sincronización:
- GET /api/productos/ → AsyncStorage
- Timestamp de última actualización
- Modo offline (usa cache si no hay internet)
```

### **rutasApiService.js** (5.8KB)
```javascript
- obtenerRutas(vendedorId)
- obtenerClientesPorRuta(vendedorId, dia)
- crearCliente(clienteData)
```

### **printerService.js** (7.4KB)
```javascript
- Conexión Bluetooth con impresora
- Formato de tickets
- Codificación de caracteres
```

---

## 📡 ENDPOINTS UTILIZADOS

```javascript
// config.js - ENDPOINTS

GUARDAR_SUGERIDO: POST /api/guardar-sugerido/
  → Crear cargue desde app (MANUAL)

OBTENER_CARGUE: GET /api/obtener-cargue/
  → Consultar cargue del día

ACTUALIZAR_CHECK_VENDEDOR: POST /api/actualizar-check-vendedor/
  → Marcar check "V" en cargue

VERIFICAR_ESTADO_DIA: GET /api/verificar-estado-dia/
  → Ver estado del día (SUGERIDO, DESPACHO, COMPLETADO)

RENDIMIENTO_CARGUE: GET /api/rendimiento-cargue/
  → Estadísticas de vencidas/devoluciones/total

CERRAR_TURNO: POST /api/cargue/cerrar-turno/
  → Cerrar turno del vendedor (no usado actualmente)

TURNO_VERIFICAR: GET /api/turno/verificar/
TURNO_ABRIR: POST /api/turno/abrir/
TURNO_CERRAR: POST /api/turno/cerrar/

// Endpoints REST estándar:
GET /api/productos/
GET /api/ventas-ruta/
POST /api/ventas-ruta/
GET /api/rutas/
GET /api/clientes-ruta/
```

---

## 🔄 FLUJO DIARIO COMPLETO

```
DÍA ANTERIOR (Noche):
┌─────────────────────────────────────────────┐
│ APP: Módulo "SUGERIDO"                      │
│ 1. Vendedor ID1 selecciona LUNES            │
│ 2. Selecciona fecha: 2026-01-05            │
│ 3. Ingresa cantidades MANUALMENTE:         │
│    - AREPA MEDIANA: 100                    │
│    - ALMOJABANA: 50                        │
│ 4. Presiona "Enviar Sugerido"              │
│ 5. POST /api/guardar-sugerido/             │
│ 6. Backend crea registros en CargueID1     │
└─────────────────────────────────────────────┘
                    ↓
DÍA N (Madrugada):
┌─────────────────────────────────────────────┐
│ WEB: Módulo PRODUCCIÓN                      │
│ 7. Producción fabrica cantidades            │
│ 8. Asigna lotes de producción               │
└─────────────────────────────────────────────┘
                    ↓
DÍA N (Mañana 7-8 AM):
┌─────────────────────────────────────────────┐
│ WEB: Módulo CARGUE                          │
│ 9. Despachador revisa "Sugerido" del vendor │
│ 10. Ajusta cantidades si necesario          │
│ 11. Asigna lotes a cada producto            │
│ 12. Marca check "D" (Despachador)           │
│ 13. Estado: DESPACHO                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ APP: Módulo "CARGUE"                        │
│ 14. Vendedor consulta su cargue             │
│ 15. GET /api/obtener-cargue/                │
│ 16. Ve cantidades despachadas               │
│ 17. Marca check "V" al recibir productos    │
│ 18. Validación: Solo si D=✓ y Cant>0       │
└─────────────────────────────────────────────┘
                    ↓
DÍA N (Durante el día 8AM-6PM):
┌─────────────────────────────────────────────┐
│ APP: Módulo "RUTAS"                         │
│ 19. Vendedor abre "Rutas"                   │
│ 20. Selecciona ruta y día                   │
│ 21. Ve lista de clientes en orden           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ APP: Módulo "VENTAS"                        │
│ 22. Por cada cliente:                       │
│     - Selecciona productos                  │
│     - Ingresa cantidades vendidas           │
│     - Método de pago                        │
│     - POST /api/ventas-ruta/                │
│ 23. Sincronización automática:              │
│     → Guarda en VentaRuta                   │
│     → Web consulta en tiempo real           │
│     → Actualiza CargueID1.vendidas          │
└─────────────────────────────────────────────┘
                    ↓
DÍA N (Tarde):
┌─────────────────────────────────────────────┐
│ APP: Módulo "RENDIMIENTO"                   │
│ 24. Vendedor consulta rendimiento           │
│ 25. GET /api/rendimiento-cargue/            │
│ 26. Ve: Vencidas, Devoluciones, Total       │
└─────────────────────────────────────────────┘
                    ↓
DÍA N (Noche 6-8PM):
┌─────────────────────────────────────────────┐
│ WEB: Módulo CARGUE (BotonLimpiar)           │
│ 27. Web consulta ventas de app              │
│ 28. GET /api/cargue/ventas-tiempo-real/     │
│ 29. Actualiza "vendidas" con ventas reales  │
│ 30. Registra vencidas (con lotes y motivos) │
│ 31. Registra devoluciones                   │
│ 32. Calcula descuentos/adicionales          │
│ 33. Registra pagos (efectivo, Nequi, etc.)  │
│ 34. Presiona "Limpiar" (Finalizar)          │
│ 35. Afecta inventario (descuenta vendidas)  │
│ 36. Estado: COMPLETADO                      │
└─────────────────────────────────────────────┘
```

---

## ⚠️ ACLARACIONES IMPORTANTES

### **1. "SUGERIDO" NO ES IA**
```
❌ NO es: Sugerencias de IA
❌ NO es: Predicciones automáticas
❌ NO es: Recomendaciones del sistema

✅ ES: Solicitud manual de cargue por el vendedor
✅ ES: Vendedor decide cantidades que necesita
✅ ES: Creación de registros en CargueIDX

Nombre real debería ser:
- "Solicitar Cargue"
- "Crear Pedido de Despacho"
- "Cantidades Necesarias"
```

### **2. "RENDIMIENTO" (Vencidas.js) - Nombre Confuso**
```
El botón dice: "Rendimiento"
El archivo es: Vencidas.js

Función real: VER rendimiento (solo lectura)
NO registra vencidas, solo consulta
```

### **3. Módulo de Vencidas con Foto NO está en Navegación**
```
Existe código para:
- Tomar fotos de vencidas
- Seleccionar lote y motivo
- Subir imagen al backend

PERO: No aparece en OptionsScreen.js
Estado: Código existe pero no está activo
```

---

## ✅ RESUMEN DE MÓDULOS

| Módulo | Archivo | Función Real | Escritura | Lectura |
|--------|---------|--------------|-----------|---------|
| **Ventas** | VentasScreen.js | Registrar ventas en ruta | ✅ | ✅ |
| **Cargue** | Cargue.js | Consultar cargue y marcar checks | ✅ (solo checks) | ✅ |
| **Sugerido** | ProductList.js | Crear cargue manualmente | ✅ | ❌ |
| **Rendimiento** | Vencidas.js | Ver estadísticas | ❌ | ✅ |
| **Rutas** | rutas/ | Gestionar clientes | ❌ | ✅ |

---

## 🎯 MÉTRICAS DE LA APP

```
Archivos totales: ~25
Líneas de código: ~5,000
Tamaño más grande: VentasScreen.js (70KB)
Componentes: 16
Servicios: 4
Pantallas: 7 principales
Endpoints utilizados: 15+

Tecnologías:
- React Native 0.81
- Expo SDK 54
- AsyncStorage (cache)
- React Navigation
- DateTimePicker
- Checkbox (expo-checkbox)
- Bluetooth Printing
```

---

**FIN - DOCUMENTACIÓN COMPLETA Y CORRECTA DE LA APP** ✅
