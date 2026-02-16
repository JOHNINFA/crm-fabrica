---
inclusion: always
---

# 🤖 CONTEXTO RAG - CRM FÁBRICA

## Instrucciones para la IA

Eres un asistente experto en el proyecto **CRM Fábrica**. Tienes acceso a toda la información del proyecto a través de este contexto RAG.

### Reglas Importantes:

1. **Siempre consulta el contexto** antes de responder preguntas sobre el proyecto
2. **Sé específico** - Referencia archivos, modelos, componentes exactos
3. **Mantén la documentación actualizada** - Si sugieres cambios, actualiza la documentación
4. **Entiende la arquitectura** - El proyecto tiene 3 capas: Backend (Django), Frontend (React), Mobile (React Native)
5. **Respeta la estructura** - Sigue los patrones existentes en el código

---

## 📋 Estructura del Proyecto

### Backend (Django/Python)
- **Ubicación**: `backend_crm/` + `api/`
- **Modelos principales**: Producto, Cliente, Venta, Cargue, Stock
- **APIs**: REST Framework con endpoints para todas las operaciones
- **Base de datos**: PostgreSQL con esquema normalizado

### Frontend (React)
- **Ubicación**: `frontend/src/`
- **Componentes**: Modular, reutilizable
- **Estado**: Redux para gestión global
- **Estilos**: CSS/SCSS con Bootstrap

### App Móvil (React Native)
- **Ubicación**: `AP GUERRERO/`
- **Framework**: Expo
- **Funcionalidades**: Cargue, Ventas, Rutas, Sincronización
- **Almacenamiento**: AsyncStorage + Firebase

---

## 🗺️ Mapa de Endpoints por Módulo (AP GUERRERO)

Tabla de referencia rápida para entender cómo se comunica la app móvil `AP GUERRERO` con el backend Django.

| Módulo App | Método | Endpoint | Consumido desde | Propósito |
|---|---|---|---|---|
| Login | `POST` | `/api/vendedores/login/` | `LoginScreen.js` | Autenticar vendedor por `id_vendedor` + `password`. |
| Productos (base app) | `GET` | `/api/productos/` | `services/ventasService.js` | Sincronizar catálogo y precios (`precio_cargue`) + flags de disponibilidad por módulo. |
| Sugeridos | `POST` | `/api/guardar-sugerido/` | `components/ProductList.js` | Enviar sugerido diario por vendedor, día y fecha. |
| Cargue | `GET` | `/api/verificar-estado-dia/` | `components/Cargue.js` | Consultar estado operativo del día seleccionado. |
| Cargue | `GET` | `/api/obtener-cargue/` | `components/Cargue.js` | Traer cantidades/checks de cargue por día/fecha. |
| Cargue | `POST` | `/api/actualizar-check-vendedor/` | `components/Cargue.js` | Marcar/desmarcar check `V` (vendedor) por producto. |
| Rendimiento | `GET` | `/api/rendimiento-cargue/` | `components/Vencidas.js` | Consultar vencidas, devoluciones y total por producto/día. |
| Turnos | `POST` | `/api/turno/verificar/` | `components/Ventas/VentasScreen.js` | Validar estado de turno antes de operar ventas. |
| Turnos | `POST` | `/api/turno/abrir/` | `components/Ventas/VentasScreen.js` | Abrir turno vendedor. |
| Turnos | `POST` | `/api/turno/cerrar/` | `components/Ventas/VentasScreen.js` | Cerrar turno vendedor. |
| Turnos (cargue) | `POST` | `/api/cargue/cerrar-turno/` | `config.js`/flujos de cargue | Endpoint legado de cierre usado en algunos flujos móviles. |
| Ventas Ruta | `POST` | `/api/ventas-ruta/` | `services/rutasApiService.js` | Registrar venta de ruta (JSON o `FormData` con evidencias). |
| Ventas Ruta | `GET` | `/api/ventas-ruta/?search=...` | `services/ventasService.js` | Verificar duplicados antes de reintentos offline. |
| Pedidos | `GET` | `/api/pedidos/pendientes_vendedor/` | `components/Ventas/VentasScreen.js` | Cargar pedidos asignados al vendedor para una fecha. |
| Pedidos | `POST` | `/api/pedidos/{id}/marcar_entregado/` | `components/Ventas/VentasScreen.js` | Marcar pedido como entregado con método de pago. |
| Pedidos | `POST` | `/api/pedidos/{id}/marcar_no_entregado/` | `components/Ventas/VentasScreen.js` | Marcar pedido como no entregado y registrar motivo. |
| Pedidos | `PATCH` | `/api/pedidos/{id}/` | `services/rutasApiService.js` | Actualizar campos del pedido (edición parcial). |
| Rutas | `GET` | `/api/rutas/?vendedor_id=IDx` | `services/rutasApiService.js` | Obtener rutas activas por vendedor. |
| Clientes Ruta | `GET` | `/api/clientes-ruta/?ruta=...&dia=...` | `services/rutasApiService.js` | Obtener clientes de una ruta para un día. |
| Clientes Ruta | `GET` | `/api/clientes-ruta/?vendedor_id=...` | `App.js`, `ClienteSelector.js`, `VentasScreen.js` | Precarga y búsqueda global de clientes del vendedor. |
| Clientes Ruta | `POST` | `/api/clientes-ruta/` | `services/ventasService.js`, `services/syncService.js` | Crear cliente de ruta (alta normal u offline sync). |
| Clientes Ruta | `PATCH` | `/api/clientes-ruta/{id}/` | `components/Ventas/ClienteNotaModal.js` | Actualizar nota/atributos de cliente de ruta. |
| Orden de visita | `POST` | `/api/ruta-orden/guardar_orden_vendedor/` | `components/Ventas/ClienteSelector.js` | Persistir orden manual de clientes por día. |
| Impresión | `GET` | `/api/configuracion-impresion/` | `services/rutasApiService.js`, `services/printerService.js` | Obtener configuración de ticket para impresión móvil. |

### Reglas operativas de comunicación (AP GUERRERO)

- `Base URL`: se define en `AP GUERRERO/config.js` (`DEV` local por IP o `PROD` por dominio).
- `Offline-first`: la app guarda en `AsyncStorage` (`productos_cache`, `clientes_cache_*`, `ventas_pendientes_sync`, `clientes_pendientes`, etc.).
- `Reintentos`: al reconectar, sincroniza pendientes con `services/syncService.js` y `services/ventasService.js`.
- `Duplicados`: antes de reenviar ventas pendientes, se valida existencia en `/api/ventas-ruta/` para reducir dobles registros.
- `Timeouts`: la app usa timeouts explícitos en `fetch` para evitar cuelgues de UI en red lenta.

---

## 🔑 Conceptos Clave

### Modelos de Datos

**Producto**
- Nombre, descripción, precio, stock
- Categoría, marca, código de barras
- Disponibilidad por módulo (POS, Cargue, App, etc.)

**Cliente**
- Información personal y de contacto
- Tipo de negocio, régimen fiscal
- Productos frecuentes por día
- Cupo de crédito

**Venta**
- Número de factura único
- Detalles de productos vendidos
- Método de pago, estado
- Trazabilidad completa

**Cargue** (ID1, ID2, ID3, ID4, ID5)
- Registro diario de vendedores
- Productos cargados, vendidos, devueltos
- Control de cumplimiento
- Resumen de pagos

**Stock**
- Cantidad actual por producto
- Sincronización con Producto.stock_total
- Historial de movimientos

### Flujos Principales

1. **Cargue**: Vendedor carga productos → Sistema registra → App sincroniza
2. **Venta**: Cliente compra → POS registra → Stock se actualiza
3. **Devolución**: Producto devuelto → Stock se incrementa → Reporte
4. **Sincronización**: App ↔ Backend en tiempo real

---

## 🔄 Sincronización en Tiempo Real (Cargue)

### Arquitectura de Sincronización

El módulo de Cargue implementa un sistema de sincronización bidireccional entre:
- **CRM Web** (frontend/src/components/Cargue/)
- **Base de Datos** (tablas CargueID1-6)
- **App Móvil** (React Native)

### Componentes Clave

**1. Polling Inteligente (Frontend)**
- **Archivo**: `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- **Frecuencia**: Cada 4 segundos
- **Endpoint**: `/api/cargue/verificar-actualizaciones/`
- **Función**: Detecta cambios en la BD comparando timestamps

**2. Sincronización en Tiempo Real (Frontend)**
- **Servicio**: `frontend/src/services/cargueRealtimeService.js`
- **Debounce**: 1.5 segundos (evita saturar el servidor)
- **Método**: PATCH parcial (solo actualiza campos modificados)

**3. Endpoint de Verificación (Backend)**
- **Archivo**: `api/views.py` → función `verificar_actualizaciones`
- **Método**: GET ultraligero
- **Respuesta**: `{ last_update: "2026-02-13T04:25:30.123Z" }`

### Flujo de Sincronización

#### Escenario 1: Usuario escribe en CRM Web
```
1. Usuario escribe "devoluciones: 5" en navegador normal
2. Estado local se actualiza inmediatamente (UX instantánea)
3. Se activa bandera cambioManualRef = true (pausa polling)
4. Después de 1.5s → Debounce sincroniza con BD (PATCH)
5. Campo fecha_actualizacion se actualiza automáticamente
6. Después de 3s → Bandera se resetea (polling se reactiva)
7. Navegador incógnito detecta cambio en máximo 4s
8. Carga datos frescos desde BD → Ve "devoluciones: 5" ✅
```

#### Escenario 2: App Móvil envía datos
```
1. App envía: cantidad=10, adicional=2, dctos=1
2. Backend hace PATCH en tabla CargueID1
3. Campo fecha_actualizacion se actualiza automáticamente
4. CRM Web detecta cambio en máximo 4s (polling)
5. Carga datos frescos desde BD
6. Muestra: cantidad=10, adicional=2, dctos=1
7. Preserva: devoluciones y vencidas (si fueron escritas en CRM) ✅
```

### Protección Anti-Rebote

**Problema**: El polling recargaba datos antes de que se sincronizaran, causando parpadeos.

**Solución**:
```javascript
// Cuando usuario edita
cambioManualRef.current = true; // Pausa polling

// Después de 3 segundos
setTimeout(() => {
    cambioManualRef.current = false; // Reactiva polling
}, 3000);
```

**Resultado**: El polling espera a que el debounce (1.5s) sincronice antes de recargar.

### Campos Exclusivos por Origen

| Campo | CRM Web | App Móvil | Notas |
|-------|---------|-----------|-------|
| cantidad | ❌ | ✅ | Solo desde app |
| adicional | ✅ | ✅ | Ambos pueden modificar |
| dctos | ✅ | ✅ | Ambos pueden modificar |
| devoluciones | ✅ | ❌ | Solo desde CRM |
| vencidas | ✅ | ❌ | Solo desde CRM |
| lotes_vencidos | ✅ | ❌ | Solo desde CRM |
| v (vendedor check) | ❌ | ✅ | Solo desde app |
| d (despachador check) | ✅ | ❌ | Solo desde CRM |

### Regla de Oro

**El último que escribe gana. La BD es la fuente de verdad.**

- Si CRM escribe devoluciones=20 y luego App envía devoluciones=10 → Queda en 10
- Si App envía cantidad=10 y luego CRM escribe cantidad=5 → Queda en 5
- Django REST Framework hace PATCH parcial: solo actualiza campos enviados

### Tiempos de Sincronización

- **CRM → BD**: 1.5 segundos (debounce)
- **BD → CRM**: Máximo 4 segundos (polling)
- **Latencia total**: Máximo 6 segundos entre ventanas

### Protección Anti-Rebote (Febrero 2026)

**Problema**: Al marcar checks D rápidamente, el polling recargaba datos antes de que la BD se actualizara, causando rebotes visuales (checks se desmarcaban y volvían a marcarse).

**Solución implementada**:
1. **Optimistic update**: Estado de React se actualiza inmediatamente al hacer clic
2. **Sin debounce para checks D**: Se envían a BD al instante (0ms)
3. **Pausa de polling extendida**: 9 seg para checks D, 7 seg para campos de texto
4. **Bandera independiente**: El callback de sincronización NO resetea la bandera para checks D
5. **onInteractionStart en checkboxes**: Pausa el polling al hacer clic
6. **Timer de reset centralizado** (`resetBanderaTimerRef`): Cada nuevo check cancela el timer de reset anterior. Así al marcar 5 checks rápido, el polling se pausa 9 segundos después del ÚLTIMO check, no del primero. Esto evita que el primer reset desbloquee el polling antes de que los últimos checks se sincronicen.

**Tiempos por tipo de campo**:
| Campo | Debounce | Pausa Polling | Reseteo Bandera |
|-------|----------|---------------|-----------------|
| Check D (Despachador) | 0ms (inmediato) | 9 segundos | Solo por timeout (cancelable) |
| Check V (Vendedor) | 0ms (inmediato) | 9 segundos | Solo por timeout (cancelable) |
| Campos texto (dctos, adicional, etc.) | 1.5 segundos | 7 segundos | 2.5s post-sync |
| Lotes vencidos | 500ms | 7 segundos | 2.5s post-sync |

**Archivos clave**:
- `frontend/src/components/Cargue/PlantillaOperativa.jsx`: `cambioManualRef`, `resetBanderaTimerRef`, `debounceTimerRef`, función `actualizarProducto`

### Debugging

Para verificar sincronización, revisar logs en consola del navegador:
```
🔍 Polling URL: /api/cargue/verificar-actualizaciones/...
📡 Respuesta polling: { last_update: "..." }
⏰ Comparando tiempos: Local=... Remoto=...
🚀 CAMBIO REMOTO DETECTADO
🔄 ID1 - Sincronizando datos frescos...
📦 AREPA TIPO OBLEA: devoluciones=5, vencidas=6
✅ Datos locales están actualizados
```

### Archivos Relacionados

- `frontend/src/components/Cargue/PlantillaOperativa.jsx` - Componente principal
- `frontend/src/services/cargueRealtimeService.js` - Sincronización en tiempo real
- `api/views.py` - Endpoints de verificación y actualización
- `api/models.py` - Modelos CargueID1-6 con fecha_actualizacion

---

## 🎨 Optimización de Flujo de Cargue y UI (Febrero 2026)

### Resumen Ejecutivo

Se realizó una reingeniería completa del módulo de Cargue para simplificar el flujo de trabajo, mejorar la respuesta visual y eliminar estados obsoletos. El objetivo fue crear una transición ágil entre Alistamiento y Despacho.

### Cambios Implementados

#### A. BotonLimpiar.jsx - Lógica Principal

**Eliminación de Estado "SUGERIDO"**
- Se eliminó completamente el estado `SUGERIDO` (botón gris) del flujo
- Migración automática: detecta usuarios con estado `SUGERIDO` guardado localmente y lo convierte a `ALISTAMIENTO_ACTIVO` al cargar

**Estilo Visual - Color Café (#8B4513)**
- Estado `ALISTAMIENTO_ACTIVO` ahora es color café intenso
- Se añadió `opacity: 1 !important` para garantizar visibilidad incluso cuando el botón está técnicamente "deshabilitado"
- Esto resuelve el problema de opacidad baja al inicio (sin productos marcados)

**Lógica "Auto-Despacho" Ágil**
- Comportamiento nuevo: apenas detecta 1 producto con check de Despachador ('D') y cantidad, cambia automáticamente a estado DESPACHO (Azul)
- Intervalo de verificación reducido a 1 segundo (antes 2s) para mayor reactividad
- Delay de 500ms al evento de cambio de datos para asegurar que localStorage termine de escribir
- La lógica actúa tanto si el estado inicial es `ALISTAMIENTO` como `ALISTAMIENTO_ACTIVO`

**Limpieza de UI**
- Se eliminó el mensaje "⚠️ DESPACHO BLOQUEADO" que aparecía debajo del botón
- Se eliminaron ~200 líneas de código obsoleto (snapshots de planificación, validaciones redundantes)
- Bordes de tabla más definidos: color `#8e8e8e` (estilo Google Sheets) en `PlantillaOperativa.css`

#### B. TablaProductos.jsx - Interacción y Datos

**Navegación Tipo Excel**
- Implementada navegación entre celdas usando flechas del teclado (Arriba/Abajo/Izq/Der)

**Protección de Escritura (Anti-Rebote)**
- Evento `onInteractionStart` al hacer foco o escribir en una celda
- Pausa temporalmente el polling de sincronización para evitar que actualizaciones automáticas borren lo que el usuario está escribiendo

**Validación Ágil**
- Solo requiere check del Despachador ('D')
- Check del Vendedor ('V') ahora es opcional para permitir el flujo

#### C. cargueRealtimeService.js - Infraestructura

Estado: ✅ Finalizado (Commit `2dccfbab`)
- Maneja sincronización en tiempo real con backend Django
- Detecta cambios en celdas individuales
- Envía peticiones PATCH (registro existente) o POST (nuevo registro) de inmediato

#### D. ResumenVentas.jsx - Mejoras UI (Febrero 2026)

- Navegación tipo Excel con flechas (Arriba/Abajo/Izq/Der) en tabla de pagos (CONCEPTO/DESCUENTOS/NEQUI/DAVIPLATA)
- Bordes de tabla uniformes con tabla de productos (`#8e8e8e`)
- Tooltip del ojito en TOTAL EFECTIVO ahora muestra Descuentos + Nequi + Daviplata (antes solo Nequi/Daviplata)
- Solo muestra líneas con valor > 0 en el tooltip

### Flujo Optimizado

```
1. Usuario abre Cargue → Botón CAFÉ (Alistamiento Activo)
2. Usuario marca productos con check 'D' y cantidad
3. Sistema detecta en 1 segundo → Botón cambia a AZUL (Despacho)
4. Usuario puede continuar trabajando sin bloqueos
5. Sincronización en tiempo real preserva datos entre ventanas
```

### Archivos Modificados

- `frontend/src/components/Cargue/BotonLimpiar.jsx` - Lógica principal del flujo
- `frontend/src/components/Cargue/TablaProductos.jsx` - Interacción y navegación
- `frontend/src/services/cargueRealtimeService.js` - Sincronización (ya finalizado)

### Notas Técnicas para IA

1. **Estado del Botón**: Ahora es más permisivo, permite avanzar libremente. Color café es crítico para UX.
2. **Sincronización**: Tabla usa `cargueRealtimeService`, botón usa `simpleStorage` y `localStorage`.
3. **Auto-Despacho**: Cambio automático y agresivo (con 1 solo item marcado).

### Próximos Pasos

- Commit de cambios actuales en `BotonLimpiar.jsx` y `TablaProductos.jsx`
- Desplegar al VPS

```bash
git add frontend/src/components/Cargue/BotonLimpiar.jsx frontend/src/components/Cargue/TablaProductos.jsx
git commit -m "feat: UX Cargue optimizada (Auto-Despacho ágil, Color Café fix, Navegación Tabla)"
git push origin main
```

**Fecha de implementación**: 14 de Febrero de 2026

---

## 📅 Optimización de Planeación (Febrero 2026)

### Resumen Ejecutivo

Se eliminaron las restricciones que impedían editar la planeación de producción cuando el día operativo ya había iniciado. El objetivo es permitir ajustes dinámicos continuos hasta que el usuario decida manualmente "cerrar" la versión.

### Cambios Implementados

#### A. InventarioPlaneacion.jsx - Lógica de Edición

**Eliminación de Bloqueo (Día Congelado)**
- Se desactivó la lógica `diaCongelado` que bloqueaba inputs cuando el estado del cargue era `ALISTAMIENTO_ACTIVO` o superior.
- **Antes**: Si alguien iniciaba el alistamiento (botón café), Planeación se volvía de solo lectura.
- **Ahora**: Planeación es siempre editable, permitiendo corregir errores o ajustar cantidades de producción sobre la marcha.

**Control de Versiones (Snapshot)**
- La responsabilidad de "congelar" la producción final recae exclusivamente en el botón **"Guardar Reporte"**.
- Este botón genera un registro histórico inmutable (Snapshot) en la BD.
- Si no se guarda reporte, los datos siguen siendo dinámicos.

**Integración de Datos**
- **Inputs**: El usuario edita libremente las columnas `Orden` (cantidad a producir) e `IA` (predicción).
- **Outputs (Read-only)**: Las columnas `Solicitadas` (suma de ID1-ID6) y `Pedidos` siguen actualizándose en tiempo real desde la operación, sin verse afectadas por la edición manual.

### Archivos Modificados

- `frontend/src/components/inventario/InventarioPlaneacion.jsx`

---

## 📦 Análisis Detallado del Módulo de Cargue

### Arquitectura General

El módulo de Cargue es un sistema complejo de gestión de inventario diario para vendedores, con sincronización en tiempo real entre CRM Web, Base de Datos y App Móvil.

### Componentes Principales

#### 1. PlantillaOperativa.jsx - Componente Maestro
**Ubicación**: `frontend/src/components/Cargue/PlantillaOperativa.jsx`

**Responsabilidades**:
- Gestiona el estado de productos operativos para cada vendedor (ID1-ID6)
- Carga datos desde localStorage con caché de precios
- Sincroniza con BD cuando el día está COMPLETADO o DESPACHO
- Maneja el resumen de ventas (totalDespacho, totalPedidos, nequi, daviplata)
- Polling cada 15 segundos para actualizar pedidos en tiempo real

**Estados Clave**:
```javascript
- productosOperativos: Array de productos con cantidad, dctos, adicional, devoluciones, vencidas
- datosResumen: { totalDespacho, totalPedidos, totalDctos, venta, totalEfectivo, nequi, daviplata }
- nombreResponsable: Nombre del vendedor asignado al ID
- preciosLista: Mapa de precios cacheados (ID producto → precio)
```

**Flujo de Carga de Datos**:
1. **Carga Inmediata**: Lee localStorage con precios cacheados (evita parpadeo)
2. **Actualización en Segundo Plano**: Consulta backend para actualizar precios
3. **Lógica Defensiva**: Si API trae precio 0 pero caché tiene valor válido, conserva el caché
4. **Recalculo de Totales**: `total = cantidad - dctos + adicional - devoluciones - vencidas`

**Sincronización con BD**:
- Si estado es `COMPLETADO` o `DESPACHO` → Carga desde BD (tablas CargueID1-6)
- Si estado es `ALISTAMIENTO` → Carga desde localStorage
- Polling cada 4 segundos para detectar cambios remotos

#### 2. TablaProductos.jsx - Interfaz de Edición
**Ubicación**: `frontend/src/components/Cargue/TablaProductos.jsx`

**Características**:
- Navegación tipo Excel con flechas (Arriba/Abajo/Izq/Der)
- Protección anti-rebote: pausa polling al escribir (`onInteractionStart`)
- Validación ágil: solo requiere check de Despachador ('D'), Vendedor ('V') es opcional
- Campos bloqueados en estado COMPLETADO

**Campos Editables**:
- `cantidad`: Solo desde App Móvil (readonly en CRM)
- `dctos`: Descuentos aplicados
- `adicional`: Productos adicionales cargados
- `devoluciones`: Solo editable antes de DESPACHO
- `vencidas`: Solo editable antes de DESPACHO
- `lotesVencidos`: Array de objetos `{ lote, motivo }`

**Checks**:
- `V` (Vendedor): Solo desde App Móvil
- `D` (Despachador): Solo desde CRM Web

#### 3. BotonLimpiar.jsx - Controlador de Estados
**Ubicación**: `frontend/src/components/Cargue/BotonLimpiar.jsx`

**Estados del Flujo**:
1. `ALISTAMIENTO`: Estado inicial (sin productos)
2. `ALISTAMIENTO_ACTIVO`: Hay productos cargados (Color CAFÉ #8B4513)
3. `DESPACHO`: Al menos 1 producto con check 'D' y cantidad (Color AZUL)
4. `COMPLETADO`: Jornada finalizada (readonly)

**Lógica Auto-Despacho**:
- Verificación cada 1 segundo (antes 2s)
- Delay de 500ms al detectar cambios para asegurar escritura en localStorage
- Cambio automático a DESPACHO con 1 solo producto listo

**Funciones Críticas**:
- `verificarProductosListos()`: Revisa todos los IDs (ID1-ID6) para detectar productos listos
- `guardarDatosDelID()`: Guarda datos de un vendedor específico en BD
- `validarLotesVencidos()`: Bloquea cierre si hay vencidas sin lote asignado
- `congelarProduccion()`: Congela totales al pasar a DESPACHO (primera vez)

**Migración Automática**:
- Si detecta estado `SUGERIDO` (obsoleto) → Convierte a `ALISTAMIENTO_ACTIVO`

#### 4. Servicios de Sincronización

##### cargueRealtimeService.js
**Ubicación**: `frontend/src/services/cargueRealtimeService.js`

**Estrategia**:
- Si registro existe → `PATCH` (actualizar solo el campo modificado)
- Si NO existe → `POST` (crear registro nuevo)

**Métodos**:
```javascript
actualizarCampoProducto(idSheet, dia, fecha, productoNombre, campo, valor, valorPrecio, responsable)
actualizarMultiplesCampos(idSheet, dia, fecha, productoNombre, campos, valorPrecio, responsable)
actualizarCampoGlobal(idSheet, dia, fecha, campo, valor, responsable)
```

**Normalización**:
- Elimina espacios múltiples en nombres de productos
- Busca por `fecha + dia + producto` para evitar duplicados

##### cargueApiService.js
**Ubicación**: `frontend/src/services/cargueApiService.js`

**Configuración**:
```javascript
cargueApiConfig.USAR_API = true  // Sincronización activa
cargueApiConfig.DEBOUNCE_SINCRONIZACION = 1000  // 1 segundo
```

**Servicio Híbrido**:
- `cargarDatos()`: localStorage PRIMERO, merge inteligente con datos del servidor
- `guardarDatos()`: localStorage inmediato, servidor con debounce
- Merge inteligente: Combina datos de App Móvil con datos locales del CRM

**Reglas de Merge**:
- De la App: `cantidad`, `adicional`, `dctos`, checks `V/D`
- Del CRM: `devoluciones`, `vencidas`, `lotesVencidos` (NUNCA vienen de la app)
- Prioridad: Si CRM tiene valor mayor en `adicional/dctos`, lo preserva

##### simpleStorage.js
**Ubicación**: `frontend/src/services/simpleStorage.js`

**Nota**: Guardado en backend DESHABILITADO. Las URLs `/api/cargues/` dan 404.
- Solo guarda en localStorage inmediatamente
- La sincronización real se hace con `cargueRealtimeService`

### Flujo Completo de Trabajo

#### Escenario 1: Vendedor carga productos en App Móvil
```
1. App envía: cantidad=10, adicional=2, dctos=1, v=true
2. Backend hace POST/PATCH en tabla CargueID1
3. Campo fecha_actualizacion se actualiza automáticamente
4. CRM Web detecta cambio en máximo 4s (polling)
5. Carga datos frescos desde BD
6. Muestra: cantidad=10, adicional=2, dctos=1
7. Preserva: devoluciones y vencidas (si fueron escritas en CRM)
```

#### Escenario 2: Usuario escribe en CRM Web
```
1. Usuario escribe "devoluciones: 5" en navegador
2. Estado local se actualiza inmediatamente (UX instantánea)
3. Se activa bandera cambioManualRef = true (pausa polling)
4. Después de 1.5s → Debounce sincroniza con BD (PATCH)
5. Campo fecha_actualizacion se actualiza automáticamente
6. Después de 3s → Bandera se resetea (polling se reactiva)
7. Otro navegador detecta cambio en máximo 4s
8. Carga datos frescos desde BD → Ve "devoluciones: 5"
```

#### Escenario 3: Finalizar Jornada
```
1. Usuario hace clic en "Finalizar" (solo ID1 tiene el botón)
2. Sistema valida lotes vencidos (bloquea si falta información)
3. Guarda datos de todos los IDs (ID1-ID6) en BD
4. Descuenta inventario de productos despachados
5. Descuenta inventario de pedidos pendientes
6. Marca pedidos como ENTREGADA
7. Cambia estado a COMPLETADO
8. Limpia localStorage
9. Congela datos para consulta histórica
```

### Campos Exclusivos por Origen

| Campo | CRM Web | App Móvil | Notas |
|-------|---------|-----------|-------|
| cantidad | ❌ | ✅ | Solo desde app |
| adicional | ✅ | ✅ | Ambos pueden modificar |
| dctos | ✅ | ✅ | Ambos pueden modificar |
| devoluciones | ✅ | ❌ | Solo desde CRM |
| vencidas | ✅ | ❌ | Solo desde CRM |
| lotes_vencidos | ✅ | ❌ | Solo desde CRM |
| v (vendedor check) | ❌ | ✅ | Solo desde app |
| d (despachador check) | ✅ | ❌ | Solo desde CRM |

### Tiempos de Sincronización (Detalle por Módulo)

- **Check D → BD**: Inmediato (0ms debounce) + pausa polling 9 segundos
- **Campos texto → BD**: 1.5 segundos (debounce) + pausa polling 7 segundos
- **Lotes vencidos → BD**: 500ms (debounce) + pausa polling 7 segundos
- **BD → CRM**: Máximo 4 segundos (polling)
- **Verificación Auto-Despacho**: 1 segundo

### Debugging

Logs clave en consola:
```
⚡ INIT - Carga inmediata desde localStorage
💰 Precios actualizados y cacheados
🔄 Sincronizando datos frescos
📦 PRODUCTO: devoluciones=5, vencidas=6
✅ Datos locales están actualizados
🚀 CAMBIO REMOTO DETECTADO
```

---

## 🛒 Análisis Detallado del Módulo de Pedidos

### Arquitectura General

El módulo de Pedidos es un sistema POS (Point of Sale) adaptado para generar pedidos de entrega programada, con gestión de clientes, productos frecuentes y sincronización con el módulo de Cargue.

### Componentes Principales

#### 1. PedidosScreen.jsx - Pantalla Principal
**Ubicación**: `frontend/src/pages/PedidosScreen.jsx`

**Responsabilidades**:
- Gestiona el carrito de productos
- Formulario de destinatario y vendedor
- Cálculo de totales (subtotal, impuestos, descuentos)
- Persistencia de datos en localStorage
- Integración con contexto de productos y precios

**Estados Clave**:
```javascript
- cart: Array de productos en el carrito [{ id, name, price, qty }]
- date: Fecha de entrega programada (YYYY-MM-DD)
- seller: Vendedor asignado (default: "PEDIDOS")
- client: Nombre del destinatario
- clientData: Datos completos del cliente (dirección, teléfono, productos frecuentes)
- priceList: Lista de precios activa (default: "VENDEDORES")
```

**Carga de Productos Frecuentes**:
- Si viene `?cliente=...` en URL → Carga datos del cliente
- Si cliente tiene `productos_frecuentes` → Los agrega automáticamente al carrito
- Flag `productosFrecuentesCargados` evita recargas múltiples

**Integración con Gestión de Días**:
- Guarda contexto de retorno: `pedidos_retorno_dia` y `pedidos_retorno_fecha`
- Toggle "Volver a gestión del día" permite regresar a la planilla que estabas trabajando
- Después de crear pedido, puede volver automáticamente al día específico

#### 2. Cart.jsx - Carrito de Compras
**Ubicación**: `frontend/src/components/Pedidos/Cart.jsx`

**Características**:
- Drag scroll para navegación táctil
- Controles de cantidad (+/-)
- Campo de nota opcional
- Toggle persistente "Volver a gestión del día"
- Validación de cajero logueado antes de generar pedido

**Cálculos**:
```javascript
subtotal = Σ(precio × cantidad)
total = subtotal + impuestos - descuentos
```

**Validación de Login**:
- Si no hay cajero logueado → Muestra alerta y abre modal de login
- Solo usuarios autenticados pueden generar pedidos

#### 3. PaymentModal.jsx - Modal de Confirmación
**Ubicación**: `frontend/src/components/Pedidos/PaymentModal.jsx`

**Campos del Pedido**:
- `destinatario`: Nombre del cliente
- `direccion_entrega`: Dirección completa
- `telefono_contacto`: Teléfono (prioriza móvil > telefono_1 > telefono_contacto)
- `zona_barrio`: Zona o barrio del cliente
- `fecha_entrega`: Fecha programada de entrega
- `tipo_remision`: ENTREGA, TRASLADO, DEVOLUCION, MUESTRA
- `transportadora`: Propia, Servientrega, Coordinadora, etc.
- `metodo_pago`: Efectivo, Tarjeta, Qr, Transf, RAPPIPAY, etc.
- `nota`: Observaciones especiales

**Validación de Duplicados**:
```javascript
// ✅ ELIMINADA (Febrero 2026): Permite múltiples pedidos para el mismo cliente en la misma fecha
// Cada pedido tendrá su propio número único (ej: #PED-000235, #PED-000236)
// Esto permite que un cliente haga pedidos en la mañana, tarde y noche del mismo día
```

**Carga Automática de Teléfono**:
```javascript
// Prioridad de carga de teléfono:
// 1. clientData.telefono (desde PedidosDiaScreen)
// 2. clientData.movil
// 3. clientData.telefono_1
// 4. clientData.telefono_contacto

// Si se escribe manualmente el destinatario:
// - Busca automáticamente en BD después de 500ms (debounce)
// - Carga teléfono, dirección y zona si encuentra coincidencia
// - Búsqueda inteligente: ignora tildes, mayúsculas y espacios
```

**Flujo de Creación**:
1. Valida campos obligatorios (destinatario, dirección)
2. ~~Verifica duplicados en BD~~ (ELIMINADO - permite múltiples pedidos)
3. Crea pedido con estado `PENDIENTE`
4. Genera detalles del pedido (productos + cantidades)
5. Muestra pantalla de éxito con número de pedido (con setTimeout para evitar race condition)
6. Opcionalmente imprime tirilla
7. Limpia carrito y resetea formulario
8. Vuelve a gestión del día si toggle está activo

**Opciones de Impresión**:
- `Ninguna`: Solo guarda en BD
- `Tirilla`: Imprime ticket térmico
- `Carta`: Imprime formato carta
- Preferencia se guarda en localStorage

#### 4. ConsumerForm.jsx - Formulario de Cliente
**Ubicación**: `frontend/src/components/Pedidos/ConsumerForm.jsx`

**Funcionalidades**:
- Selector de cliente con autocompletado
- Selector de vendedor
- Selector de lista de precios
- Selector de fecha de entrega
- Carga automática de datos del cliente (dirección, teléfono, productos frecuentes)

**Integración con Clientes**:
- Carga clientes desde `/api/clientes/`
- Muestra alias/nombre de negocio
- Carga productos frecuentes por día de la semana
- Actualiza lista de precios según cliente

#### 5. ProductList.jsx - Lista de Productos
**Ubicación**: `frontend/src/components/Pedidos/ProductList.jsx`

**Características**:
- Filtrado por categoría
- Búsqueda por nombre
- Muestra precio según lista activa
- Botón de agregar al carrito
- Indicador visual de productos en carrito

**Precios Dinámicos**:
- Hook `usePriceList` obtiene precios según lista activa
- Actualiza precios del carrito cuando cambia la lista
- Fallback a precio base si no hay precio en lista

### Flujo Completo de Trabajo

#### Escenario 1: Crear Pedido desde Gestión de Días
```
1. Usuario está en /pedidos/LUNES?fecha=2026-02-17
2. Hace clic en "Ir a Pedidos" para un cliente
3. Sistema guarda contexto: pedidos_retorno_dia=LUNES, pedidos_retorno_fecha=2026-02-17
4. Navega a /pedidos?cliente={datos_cliente}
5. Carga productos frecuentes al carrito
6. Usuario ajusta cantidades y genera pedido
7. Sistema crea pedido con fecha_entrega=2026-02-17
8. Muestra pantalla de éxito
9. Si toggle activo → Vuelve a /pedidos/LUNES?fecha=2026-02-17
```

#### Escenario 2: Crear Pedido Directo
```
1. Usuario entra a /pedidos
2. Busca y agrega productos al carrito
3. Selecciona cliente (o escribe destinatario manual)
4. Selecciona fecha de entrega
5. Hace clic en "Generar Pedido"
6. Valida login de cajero
7. Abre PaymentModal
8. Completa datos de entrega
9. Sistema valida duplicados
10. Crea pedido con estado PENDIENTE
11. Muestra éxito y limpia carrito
```

#### Escenario 3: Múltiples Pedidos para el Mismo Cliente
```
1. Cliente "TAMALES EL SABOR TOLIMENSE" pide en la mañana
2. Sistema crea pedido #PED-000235 con fecha 2026-02-14
3. El mismo cliente pide en la tarde
4. Sistema crea pedido #PED-000236 con fecha 2026-02-14
5. Ambos pedidos aparecen en la lista de pendientes
6. Cada uno se puede entregar independientemente
7. Al finalizar el día, se descontará inventario de ambos pedidos
```

**Nota**: Desde Febrero 2026, el sistema permite múltiples pedidos para el mismo cliente en la misma fecha. Cada pedido tiene su número único y se gestiona independientemente.

### Integración con Módulo de Cargue

#### Carga de Pedidos en Resumen
**Ubicación**: `PlantillaOperativa.jsx` → `cargarPedidosVendedor()`

**Flujo**:
1. Consulta `/api/pedidos/?fecha_entrega={fecha}`
2. Filtra por vendedor (ID1, ID2, etc.)
3. Excluye estados ANULADA y CANCELADO
4. Excluye pedidos con `inventario_afectado=true` (urgentes ya procesados)
5. Suma totales por método de pago (Nequi, Daviplata, Efectivo)
6. Actualiza `datosResumen.totalPedidos`

**Polling Automático**:
- Cada 15 segundos verifica nuevos pedidos
- Actualiza totales en tiempo real
- Escucha eventos `pedidoCreado`, `pedidoActualizado`, `recargarPedidos`

#### Descuento de Inventario al Finalizar
**Ubicación**: `BotonLimpiar.jsx` → `cargarPedidosPendientes()`

**Flujo**:
1. Carga pedidos PENDIENTES para la fecha
2. Agrupa productos por nombre y suma cantidades
3. Descuenta del inventario (API: `/productos/{id}/actualizar_stock/`)
4. Marca pedidos como ENTREGADA
5. Actualiza campo `inventario_afectado=true`

### Datos Clave

**Estructura de Pedido en BD**:
```javascript
{
    numero_pedido: "PED-2026-001234",
    fecha: "2026-02-14",  // Fecha de creación
    fecha_entrega: "2026-02-17",  // Fecha programada
    vendedor: "ID1",
    destinatario: "TIENDA LA ESQUINA",
    direccion_entrega: "Calle 123 #45-67",
    telefono_contacto: "3001234567",
    zona_barrio: "Centro",
    tipo_remision: "ENTREGA",
    transportadora: "Propia",
    metodo_pago: "Efectivo",
    estado: "PENDIENTE",  // PENDIENTE, ENTREGADA, ANULADA
    inventario_afectado: false,
    subtotal: 100000,
    impuestos: 0,
    descuentos: 0,
    total: 100000,
    nota: "Entregar antes de las 10am",
    detalles: [
        { producto: 1, cantidad: 10, precio_unitario: 10000 }
    ]
}
```

**Estados de Pedido**:
- `PENDIENTE`: Recién creado, esperando entrega
- `ENTREGADA`: Entregado al cliente (inventario descontado)
- `ANULADA`: Cancelado (no afecta inventario)

### Debugging

Logs clave en consola:
```
📦 Cargando productos frecuentes al carrito
✅ 5 productos cargados al carrito
💰 Cambio detallado en pedidos: Total 0->150000
📊 Filtrados: 3 pedidos, 2 ventas ruta
⛔ ACCIÓN DENEGADA - Pedido duplicado detectado
✅ Pedido #PED-2026-001234 creado exitosamente
```

---

## 🛠️ Tecnologías

### Backend
- Django 4.2.2
- Django REST Framework
- PostgreSQL
- Gunicorn (producción)

### Frontend
- React 18+
- Redux
- Bootstrap
- Axios

### Mobile
- React Native
- Expo
- Firebase
- AsyncStorage

### Infraestructura
- Docker (desarrollo y producción)
- Nginx (proxy reverso)
- VPS (aglogistics.tech)
- SSL/TLS

---

## 📚 Cómo Usar Este Contexto

### Para Entender el Proyecto
```
"¿Cómo funciona el flujo de cargue?"
"¿Cuál es la estructura de la base de datos?"
"¿Cómo se sincroniza la app móvil?"
```

### Para Implementar Cambios
```
"Necesito agregar un nuevo campo a Producto"
"¿Cómo creo un nuevo endpoint de API?"
"¿Dónde debo actualizar el componente de ventas?"
```

### Para Debugging
```
"¿Por qué no se sincroniza el stock?"
"¿Cuál es el flujo de autenticación?"
"¿Cómo se manejan los errores?"
```

---

## 🔄 Actualización Automática

Este contexto se actualiza automáticamente cuando:
- Se indexa el código (ejecutar `python .kiro/rag/indexer.py`)
- Se modifica la documentación
- Se agregan nuevos archivos al proyecto

**Última actualización**: 15 de Febrero de 2026 - Fix Cierre Turno (doble confirmación) + Checks Cargue (controller por producto)

---

## 📞 Contacto y Soporte

Para preguntas sobre:
- **Arquitectura**: Revisar `backend_crm/settings.py` y `api/models.py`
- **APIs**: Revisar `api/views.py` y `api/urls.py`
- **Frontend**: Revisar `frontend/src/components/` y `frontend/src/pages/`
- **Mobile**: Revisar `AP GUERRERO/components/` y `AP GUERRERO/services/`

---

## ✅ Checklist para Cambios

Cuando hagas cambios al proyecto:

- [ ] Actualizar modelos si es necesario
- [ ] Crear/actualizar migraciones
- [ ] Actualizar APIs si cambian endpoints
- [ ] Actualizar componentes frontend/mobile
- [ ] Ejecutar tests
- [ ] Actualizar documentación
- [ ] Ejecutar indexador RAG: `python .kiro/rag/indexer.py`
- [ ] Verificar que el contexto se actualice

---

**🚀 Recuerda**: Este contexto es tu fuente de verdad sobre el proyecto. Úsalo para tomar decisiones informadas y mantener la consistencia.


---

## 📱 Análisis Detallado de la App Móvil "AP GUERRERO"

### Arquitectura General

La App Móvil "AP GUERRERO" es una aplicación React Native con Expo que permite a los vendedores gestionar cargue, ventas y rutas de entrega desde dispositivos móviles Android/iOS. Se sincroniza en tiempo real con el backend Django.

### Tecnologías Principales

- **Framework**: React Native 0.81.5 con Expo 54
- **Navegación**: React Navigation (Stack Navigator)
- **Almacenamiento**: AsyncStorage (caché local)
- **Sincronización**: Firebase Realtime Database + API REST
- **Estado**: React Hooks (useState, useEffect, useRef)
- **Networking**: Fetch API con AbortController (timeouts)

### Configuración (config.js)

```javascript
const ENV = 'DEV'; // DEV (Local) | PROD (VPS/Nube)
const LOCAL_IP = '192.168.1.19';
const PROD_URL = 'https://aglogistics.tech';

export const API_URL = ENV === 'DEV' 
  ? `http://${LOCAL_IP}:8000`
  : PROD_URL;
```

**Endpoints Principales**:
- `GUARDAR_SUGERIDO`: Guardar cantidades sugeridas
- `OBTENER_CARGUE`: Obtener datos del cargue
- `ACTUALIZAR_CHECK_VENDEDOR`: Marcar productos como verificados
- `VERIFICAR_ESTADO_DIA`: Verificar estado del día (SUGERIDO, DESPACHO, COMPLETADO)
- `TURNO_VERIFICAR/ABRIR/CERRAR`: Gestión de turnos
- `PEDIDOS_PENDIENTES`: Obtener pedidos asignados al vendedor

### Flujo de Inicio (App.js)

#### Precarga Automática
```javascript
useEffect(() => {
  Promise.all([
    inicializarProductos(),      // Sincronizar productos desde API
    precargarClientes(),          // Cargar clientes del vendedor
    precargarImagenes(),          // Precargar imágenes de productos
    sincronizarPendientesEnFondo() // Sincronizar ventas/clientes pendientes
  ]);
}, []);
```

#### Navegación Principal
1. **LoginScreen**: Autenticación del vendedor
2. **OptionsScreen**: Menú principal (Cargue, Ventas, Rutas)
3. **MainScreen**: Vista de productos (legacy)
4. **Cargue**: Módulo de cargue diario
5. **VentasScreen**: Módulo de ventas
6. **InicioRutas**: Módulo de rutas de entrega

### Módulo de Sugeridos (MainScreen + ProductList.js)

#### Funcionalidad Principal
Permite registrar y enviar el sugerido diario por vendedor (`userId`), con validación de día/fecha y confirmación previa antes de enviar al backend.

#### Flujo Operativo Actual (App Móvil)
```
1. Usuario selecciona día en Navbar (MainScreen)
2. Ingresa cantidades por producto en ProductList/Product
3. Pulsa "Enviar Sugerido"
4. Selecciona fecha en DatePicker
5. Validación: el día seleccionado debe coincidir con la fecha elegida
6. Se abre modal de confirmación (NO envía todavía)
7. Usuario:
   - "Cancelar": cierra modal sin enviar
   - "Confirmar y Enviar": hace POST a /api/guardar-sugerido/
8. Si éxito: limpia cantidades
9. Si duplicado (YA_EXISTE_SUGERIDO): alerta de sugerido ya enviado
```

#### Modal de Confirmación (estado aprobado)
Campos visibles:
- Día
- Fecha
- Lista producto + cantidad

Acciones:
- `Cancelar` (no envía)
- `Confirmar y Enviar` (envía al endpoint `guardar-sugerido`)

Notas UI:
- Diseño minimalista/compacto.
- La cantidad por producto se muestra como número en badge verde (sin prefijo `x`).
- Se removió la línea resumen `Productos • Unidades` para ganar espacio vertical y ver más ítems en la lista.

### Módulo de Cargue (Cargue.js)

#### Funcionalidad Principal
Permite al vendedor ver y marcar los productos cargados para el día, sincronizando con el CRM Web.

#### Estados Clave
```javascript
- selectedDay: Día seleccionado (Lunes-Sábado)
- selectedDate: Fecha seleccionada (YYYY-MM-DD)
- diaEstado: Estado del día (SUGERIDO, DESPACHO, COMPLETADO)
- quantities: Cantidades de productos { "AREPA TIPO OBLEA": "10" }
- checkedItems: Checks V/D { "AREPA TIPO OBLEA": { V: true, D: false } }
- productos: Array de nombres de productos disponibles
```

#### Flujo de Carga de Datos
```
1. Cargar productos desde caché (ventasService.obtenerProductos)
2. Filtrar por disponible_app_cargue !== false
3. Verificar estado del día (ENDPOINTS.VERIFICAR_ESTADO_DIA)
4. Obtener cantidades desde CRM (ENDPOINTS.OBTENER_CARGUE)
5. Mostrar TOTAL (stock disponible = cantidad + adicional - dctos - devoluciones - vencidas)
```

#### Checks de Verificación
- **V (Vendedor)**: Solo editable desde App Móvil
  - Validación: Requiere check D marcado y cantidad > 0
  - Actualización: Optimistic update + sincronización en segundo plano
  - Timeout: 8 segundos con AbortController
  
- **D (Despachador)**: Solo editable desde CRM Web (readonly en app)

#### Sincronización
- **Polling**: No implementado (solo carga manual con botón "Recargar")
- **Timeout**: 10 segundos para obtener cargue, 5 segundos para verificar estado
- **Offline**: Muestra datos cacheados si falla la conexión

#### Validaciones
```javascript
// No permitir marcar V si:
1. Check D no está marcado (viene del CRM)
2. Cantidad <= 0
3. Día está COMPLETADO
```

### Módulo de Ventas (VentasScreen.js)

#### Funcionalidad Principal
Sistema POS completo para registrar ventas en ruta, gestionar pedidos asignados y reportar novedades.

#### Estados Clave
```javascript
- diaSeleccionado: Día de trabajo (LUNES-DOMINGO)
- fechaSeleccionada: Fecha del turno (Date object)
- turnoAbierto: Boolean indicando si hay turno activo
- clienteSeleccionado: Cliente actual
- pedidoClienteSeleccionado: Pedido asignado al cliente
- carrito: Productos en el carrito { id: { ...producto, cantidad, precio, subtotal } }
- stockCargue: Stock disponible del cargue { "AREPA TIPO OBLEA": 10 }
- pedidosPendientes: Pedidos asignados al vendedor
- pedidosEntregadosHoy: IDs de pedidos entregados
- pedidosNoEntregadosHoy: Pedidos reportados como no entregados
- ventasDelDia: Ventas registradas en el día
```

#### Flujo de Apertura de Turno
```
1. Usuario selecciona día (LUNES-DOMINGO)
2. Abre DatePicker para seleccionar fecha
3. VALIDACIÓN: Verifica que día coincida con fecha
4. Carga stock del cargue (cargarStockCargue)
5. Verifica pedidos pendientes (verificarPedidosPendientes)
6. VALIDACIÓN ESTRICTA: Solo abre si cargue está en DESPACHO
7. Llama a ENDPOINTS.TURNO_ABRIR (persistir en backend)
8. Marca turnoAbierto = true
9. Precarga clientes en caché
10. Carga ventas del día
```

#### Validación de Apertura de Turno
```javascript
// POLÍTICA ESTRICTA: Solo permite abrir si:
- Hay cargue asignado (hayCargue = true)
- Estado del cargue es DESPACHO
- Si no cumple → Bloquea con mensaje y vuelve al menú
```

#### Gestión de Pedidos
**Cargar Pedido en Carrito**:
```
1. Usuario selecciona pedido de la lista
2. Sistema busca productos en catálogo local
3. Carga cantidades y precios originales del pedido
4. Guarda precios en preciosPersonalizados (para no perderlos al editar)
5. Pre-selecciona cliente si existe
```

**Marcar Pedido como Entregado**:
```
1. Usuario hace clic en "Entregar Pedido"
2. Abre modal de confirmación (ConfirmarEntregaModal)
3. Usuario selecciona método de pago (EFECTIVO, NEQUI, etc.)
4. Llama a ENDPOINTS.PEDIDO_MARCAR_ENTREGADO
5. Envía metodo_pago en el body
6. Agrega a pedidosEntregadosHoy
7. Recarga pedidos pendientes
```

**Reportar Novedad (No Entregado)**:
```
1. Usuario hace clic en "No Entregado"
2. Abre modal para escribir motivo
3. Llama a ENDPOINTS.PEDIDO_MARCAR_NO_ENTREGADO
4. Backend marca pedido como ANULADA con nota
5. Agrega a pedidosNoEntregadosHoy
6. Actualiza estado local del pedido
```

#### Flujo de Venta
```
1. Seleccionar cliente (ClienteSelector)
2. Agregar productos al carrito
3. Sistema valida stock contra cargue
4. Calcular subtotal y descuentos
5. Completar venta (genera ventaTemporal)
6. Confirmar método de pago
7. Guardar venta local (ventasService.guardarVenta)
8. Sincronizar con backend en segundo plano
9. Agregar a cola de pendientes si falla
10. Mostrar modal de impresión (opcional)
```

#### Historial y Reimpresión de Tickets (botón 🧾)
- Componente: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Trigger: botón `receipt-outline` en la barra superior de turno (área derecha).
- Fuente de datos: `ventasDelDia` (ventas locales del día cargadas por `cargarVentasDelDia()`).
- Acción por fila: botón `print` ejecuta `imprimirTicket(venta)`.

Estado UI aprobado (actual):
- El modal abre con overlay oscuro y panel inferior.
- Se removió el título `"🧾 Ventas del Día (n)"`.
- Se removió el texto guía `"Toca el botón de imprimir..."`.
- El contenedor general del modal en esa vista quedó transparente.
- Las cards de cada venta se mantienen sólidas (`#f8f9fa`), con cliente, hora/metodo de pago, total y botón de imprimir.
- Cierre del modal: botón `close-circle` (X) en la parte superior derecha.

#### Validación de Stock
```javascript
// Al agregar producto al carrito:
const stockDisponible = stockCargue[producto.nombre] || 0;
const cantidadEnCarrito = carrito[producto.id]?.cantidad || 0;

if (cantidadEnCarrito >= stockDisponible) {
  Alert.alert('Sin Stock', 'No hay más unidades disponibles');
  return;
}
```

#### Cierre de Turno
```
1. Usuario hace clic en "Cerrar Turno"
2. Sistema valida que no haya ventas pendientes de sincronizar
3. Muestra resumen: Total ventas, Total dinero, Pedidos entregados/no entregados
4. Llama a ENDPOINTS.TURNO_CERRAR
5. Limpia ventas locales (limpiarVentasLocales)
6. Resetea estados
7. Vuelve al selector de día
```

### Servicio de Ventas (ventasService.js)

#### Sistema Multi-Dispositivo
```javascript
// Genera ID único por dispositivo
const obtenerDispositivoId = async () => {
  // Formato: OS-MODELO-RANDOM
  // Ejemplo: ANDROID-SM-G991B-K3J9X2
  // Se guarda en AsyncStorage para mantener entre sesiones
};

// ID de venta único
const generarIdVenta = async (vendedorId) => {
  // Formato: VENDEDOR-DISPOSITIVO-TIMESTAMP-RANDOM
  // Ejemplo: ID1-ANDROID-SAMSUNG-K3J9X2-1737145200000-P9Q2X1
};
```

#### Cola de Sincronización Offline
```javascript
// Estructura de venta pendiente
{
  id: "ID1-ANDROID-...",
  data: { ...ventaBackend },
  intentos: 0,
  fechaCreacion: "2026-02-14T10:30:00Z"
}

// Flujo de sincronización
1. Guardar venta local inmediatamente
2. Intentar enviar a backend en segundo plano
3. Si falla → Agregar a cola de pendientes
4. Sincronizar automáticamente cuando hay conexión
5. Verificar duplicados antes de enviar
6. Auto-limpieza de ventas con errores 400 (datos inválidos)
```

#### Sincronización de Productos
```javascript
// Usa precio_cargue (precio independiente para App)
const sincronizarProductos = async () => {
  // 1. Descargar desde /api/productos/
  // 2. Mapear: precio = precio_cargue || precio
  // 3. Incluir campos de disponibilidad (disponible_app_cargue, etc.)
  // 4. Guardar en AsyncStorage como caché
  // 5. Actualizar productosEnMemoria
};
```

#### Gestión de Clientes
```javascript
// Guardar cliente con ruta asignada
const guardarCliente = async (cliente) => {
  // Validar que tenga rutaId
  // Enviar a /api/clientes-ruta/
  // Backend calcula orden automáticamente
  // Guardar en AsyncStorage si éxito
};
```

### Servicio de Sincronización (syncService.js)

#### Sincronización de Clientes Pendientes
```javascript
// Clientes creados offline
const sincronizarClientesPendientes = async () => {
  // 1. Leer de 'clientes_pendientes'
  // 2. Enviar a /api/clientes-ruta/ (POST)
  // 3. Si éxito → Eliminar de pendientes
  // 4. Si falla → Incrementar intentos
  // 5. Máximo 5 intentos
};
```

#### Sincronización de Ventas Pendientes
```javascript
// Ventas guardadas offline
const sincronizarVentasPendientes = async () => {
  // 1. Verificar conexión (NetInfo)
  // 2. Leer de 'ventas_pendientes'
  // 3. Verificar si ya existe en servidor (evitar duplicados)
  // 4. Enviar a /api/ventas/ (POST)
  // 5. Auto-limpieza de errores 400
  // 6. Retornar: { sincronizadas, pendientes, yaExistentes }
};
```

### Módulo de Rutas (InicioRutas.js)

#### Funcionalidad
- Pantalla de inicio para gestión de rutas
- Navega a SeleccionarRuta para elegir ruta del día
- Muestra clientes ordenados por día de visita
- Permite marcar clientes como visitados

#### Integración con Ventas
```javascript
// Desde ListaClientes, al hacer clic en "Vender":
navigation.navigate('Ventas', {
  userId: userId,
  clientePreseleccionado: {
    id: cliente.id,
    nombre: cliente.nombre,
    negocio: cliente.negocio,
    // ... otros datos
  }
});

// VentasScreen detecta clientePreseleccionado y:
1. Abre turno automáticamente
2. Pre-selecciona el cliente
3. Carga productos frecuentes si existen
```

### Optimizaciones Implementadas

#### Precarga de Datos
- Productos sincronizados al iniciar app
- Clientes precargados en caché por vendedor
- Imágenes de productos precargadas
- Sincronización de pendientes en segundo plano

#### Timeouts y Manejo de Errores
```javascript
// Patrón estándar con AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeoutId);

// Manejo de timeout
catch (error) {
  const esTimeout = error.name === 'AbortError';
  Alert.alert('Error', esTimeout 
    ? 'El servidor tardó demasiado'
    : 'Error de conexión'
  );
}
```

#### Optimistic Updates
```javascript
// Actualizar UI inmediatamente, sincronizar después
setCheckedItems(prev => ({
  ...prev,
  [productName]: { ...prev[productName], V: nuevoValorV }
}));

// Sincronizar en segundo plano
fetch(ENDPOINTS.ACTUALIZAR_CHECK_VENDEDOR, { ... })
  .catch(() => {
    // Revertir si falla
    setCheckedItems(prev => ({
      ...prev,
      [productName]: { ...prev[productName], V: !nuevoValorV }
    }));
  });
```

#### Caché Inteligente
```javascript
// Productos: Caché en AsyncStorage, actualización en segundo plano
// Clientes: Caché por vendedor con timestamp
// Ventas: Guardado local inmediato, sincronización diferida
```

### Flujo Completo de Trabajo Diario

#### 1. Inicio de Jornada
```
1. Vendedor abre app y hace login (userId: ID1, ID2, etc.)
2. App precarga productos, clientes e imágenes
3. Sincroniza pendientes en segundo plano
4. Navega a OptionsScreen (menú principal)
```

#### 2. Revisión de Cargue
```
1. Vendedor entra a "Cargue"
2. Selecciona día (ej: LUNES)
3. Abre calendario y selecciona fecha
4. Sistema carga cantidades desde CRM
5. Muestra productos con checks V/D
6. Vendedor marca check V para productos verificados
7. Sistema sincroniza checks con CRM en tiempo real
```

#### 3. Apertura de Turno de Ventas
```
1. Vendedor entra a "Ventas"
2. Selecciona día (ej: LUNES)
3. Abre calendario y selecciona fecha
4. Sistema valida que día coincida con fecha
5. Carga stock del cargue
6. Verifica pedidos pendientes
7. VALIDA que cargue esté en DESPACHO
8. Abre turno en backend
9. Muestra resumen: Stock, Pedidos asignados
```

#### 4. Gestión de Pedidos
```
1. Sistema muestra badge con cantidad de pedidos pendientes
2. Vendedor hace clic en badge
3. Abre modal con lista de pedidos
4. Opciones por pedido:
   a) Cargar en carrito (para editar y vender)
   b) Marcar como entregado (sin editar)
   c) Reportar novedad (no entregado)
```

#### 5. Registro de Ventas
```
1. Vendedor selecciona cliente
2. Agrega productos al carrito
3. Sistema valida stock contra cargue
4. Ajusta cantidades si es necesario
5. Completa venta
6. Selecciona método de pago
7. Sistema guarda local y sincroniza
8. Opción de imprimir ticket
```

#### 6. Cierre de Turno
```
1. Vendedor hace clic en "Cerrar Turno"
2. Sistema valida sincronización completa
3. Muestra resumen del día:
   - Total ventas
   - Total dinero
   - Pedidos entregados
   - Pedidos no entregados
4. Confirma cierre
5. Limpia datos locales
6. Cierra turno en backend
```

### Datos Clave

**Estructura de Venta en App**:
```javascript
{
  id: "ID1-ANDROID-SAMSUNG-K3J9X2-1737145200000-P9Q2X1",
  dispositivo_id: "ANDROID-SM-G991B-K3J9X2",
  vendedor: "ID1",
  cliente_nombre: "Juan Pérez",
  nombre_negocio: "Tienda El Sol",
  total: 50000,
  detalles: [
    { producto: 17, cantidad: 5, precio_unitario: 2500 }
  ],
  metodo_pago: "EFECTIVO",
  productos_vencidos: [
    { id: 17, producto: "AREPA TIPO OBLEA", cantidad: 2, motivo: "Vencido" }
  ],
  foto_vencidos: { uri: "...", base64: "..." },
  fecha: "2026-02-14T10:30:00Z",
  consecutivo: 123,
  sincronizada: false
}
```

**Estados de Sincronización**:
- `sincronizada: false`: Pendiente de enviar
- `sincronizada: true`: Enviada exitosamente
- En cola de pendientes: Esperando conexión

### Debugging

Logs clave en consola:
```
📱 Dispositivo ID generado: ANDROID-SM-G991B-K3J9X2
🚀 Precargando clientes para ID1
✅ Clientes precargados: 25
📦 Buscando pedidos para ID1 en 2026-02-14
✅ 3 pedidos pendientes, 2 entregados
🔄 Sincronizando 5 ventas pendientes...
✅ Venta ID1-ANDROID-...-P9Q2X1 sincronizada
⚠️ Venta ya existe en servidor, eliminando de cola
📊 Sincronización completada: 3 nuevas, 2 ya existían, 0 pendientes
```

---

**🚀 Recuerda**: Este contexto es tu fuente de verdad sobre el proyecto. Úsalo para tomar decisiones informadas y mantener la consistencia entre CRM Web, Backend y App Móvil.


---

## 🏪 Análisis Detallado del Módulo POS (Point of Sale)

### Funcionalidad Principal

Sistema de punto de venta completo para facturación rápida en mostrador, con gestión de cajeros, listas de precios y sincronización offline.

### Componentes Principales

#### PosScreen.jsx - Pantalla Principal
**Ubicación**: `frontend/src/pages/PosScreen.jsx`

**Características**:
- Listado de productos con filtrado por categoría
- Carrito de compras con cálculo automático
- Formulario de cliente y vendedor
- Procesamiento de pagos múltiples
- Sincronización automática offline

**Estados Clave**:
```javascript
- cart: Array de productos [{ id, name, price, qty }]
- seller: Vendedor (siempre el cajero logueado)
- client: Cliente (default: "CONSUMIDOR FINAL")
- priceList: Lista de precios activa (default: "PRECIOS CAJA")
- date: Fecha de la venta (YYYY-MM-DD)
- address: Dirección de envío (opcional)
- phone: Teléfono de contacto (opcional)
```

**Flujo de Venta**:
```
1. Cajero hace login (CajeroContext)
2. Selecciona productos y agrega al carrito
3. Precios se cargan según lista activa (usePriceList)
4. Ajusta cantidades, impuestos y descuentos
5. Selecciona cliente (o usa CONSUMIDOR FINAL)
6. Confirma venta
7. Selecciona método de pago
8. Sistema guarda venta local
9. Sincroniza con backend en segundo plano
10. Imprime ticket (opcional)
11. Limpia carrito automáticamente
```

**Sincronización Offline**:
```javascript
// Servicio: offlineSyncService
- Inicia sincronización automática al montar
- Detecta ventas pendientes en localStorage
- Reintenta envío cada 30 segundos
- Marca ventas como sincronizadas
- Limpia cola cuando tiene éxito
```

**Listas de Precios**:
- Hook `usePriceList` obtiene precios según lista activa
- Actualiza carrito automáticamente al cambiar lista
- Fallback a precio base si no hay precio en lista

---

## 📦 Análisis Detallado del Módulo de Inventario

### Arquitectura General

Sistema completo de gestión de inventario con 4 módulos: Producción, Maquilas, Planeación y Kardex.

### Módulos Principales

#### 1. Inventario Producción (InventarioProduccion.jsx)

**Funcionalidad**: Registro diario de producción con generación de lotes y control de vencimientos.

**Estados Clave**:
```javascript
- usuario: Usuario que registra (persistente en BD)
- fechaSeleccionada: Fecha de producción
- lote: Número de lote generado (formato: LYYYYMMDD)
- fechaVencimiento: Fecha de vencimiento del lote
- lotes: Array de lotes del día
- productos: Array de productos con cantidades
- yaSeGrabo: Boolean indicando si ya se grabó el día
- datosGuardados: Datos de confirmación del día
```

**Flujo de Registro de Producción**:
```
1. Usuario selecciona fecha
2. Sistema carga productos disponibles (disponible_inventario = true)
3. Usuario ingresa cantidades producidas por producto
4. Sistema genera lote automático (LYYYYMMDD)
5. Usuario ingresa fecha de vencimiento
6. Agrega lote a la lista
7. Confirma producción
8. Sistema:
   a) Actualiza stock en BD (api_stock)
   b) Crea movimientos de inventario (ENTRADA)
   c) Guarda lotes en api_lote
   d) Guarda registro en api_registroinventario
   e) Actualiza localStorage
   f) Marca día como grabado
9. Muestra tabla de confirmación
```

**Persistencia de Datos**:
```javascript
// Auto-guardado en localStorage por fecha
- inv_prod_lotes_YYYY-MM-DD: Array de lotes
- inv_prod_cantidades_YYYY-MM-DD: Mapa de cantidades { id: cantidad }
- confirmacion_produccion_YYYY-MM-DD: Datos confirmados

// Restauración automática
- Al cambiar fecha, restaura datos guardados
- Preserva cantidades durante recargas (F5)
- Permite edición posterior con trazabilidad
```

**Edición de Producción**:
```javascript
// Si ya se grabó el día
- Abre modal de edición con motivo
- Calcula diferencia de cantidades
- Crea movimiento de ajuste (ENTRADA/SALIDA)
- Actualiza tabla de confirmación
- Registra: cantidadOriginal, fechaEdicion, motivoEdicion
```

**Sincronización**:
```javascript
// Sincronizar productos desde BD
const sincronizarProductos = async () => {
  // 1. Cargar desde /api/productos/
  // 2. Actualizar localStorage 'productos'
  // 3. Actualizar localStorage 'products' (POS)
  // 4. Preservar cantidades del usuario (no sobrescribir)
  // 5. Disparar eventos: 'storage', 'productosUpdated'
};
```

#### 2. Kardex (TablaKardex.jsx)

**Funcionalidad**: Vista consolidada de movimientos de inventario en tiempo real.

**Fuente de Datos**:
```javascript
// FUENTE PRINCIPAL: api_stock (todos los productos activos)
- Carga stocks desde /api/stock/
- Filtra por disponible_inventario = true
- Obtiene últimos movimientos desde /api/registro-inventario/
- Muestra productos sin movimientos también
```

**Actualización en Tiempo Real**:
```javascript
// Escucha evento 'inventarioActualizado'
window.addEventListener('inventarioActualizado', () => {
  cargarMovimientosFromBD(); // Recarga inmediata
});

// Polling cada 30 segundos
setInterval(() => {
  cargarMovimientosFromBD();
}, 30000);
```

**Ordenamiento**:
```javascript
// Usa campo 'orden' de la BD (no lista hardcodeada)
const ordenarProductos = (productos) => {
  return productos.sort((a, b) => {
    const ordenA = a.orden || 999;
    const ordenB = b.orden || 999;
    if (ordenA === ordenB) {
      return a.nombre.localeCompare(b.nombre);
    }
    return ordenA - ordenB;
  });
};
```

**Visualización**:
```
- Producto: Nombre del producto
- Existencias: Cantidad actual (badge verde/rojo)
- Usuario: Último usuario que movió
- Movimiento: Tipo (Entrada/Salida/Sin movimiento)
```

#### 3. Inventario Maquilas

**Funcionalidad**: Gestión de productos maquilados (producidos por terceros).

**Características**:
- Registro de productos recibidos de maquilas
- Control de calidad y cantidades
- Integración con inventario principal

#### 4. Inventario Planeación

**Funcionalidad**: Planeación de producción basada en demanda histórica.

**Características**:
- Análisis de ventas históricas
- Sugerencias de producción
- Proyecciones de stock

---

## 🔍 Análisis Detallado del Módulo de Trazabilidad

### Funcionalidad Principal

Sistema de trazabilidad completa de lotes desde producción hasta retorno, con búsqueda por lote, fecha o mes.

### Componentes Principales

#### TrazabilidadScreen.jsx
**Ubicación**: `frontend/src/pages/TrazabilidadScreen.jsx`

**Modos de Búsqueda**:

1. **Por Lote Individual**:
```javascript
// Endpoint: /api/trazabilidad/buscar/?lote=LYYYYMMDD
// Retorna:
{
  lote: "L20260214",
  produccion: {
    fecha: "2026-02-14",
    usuario: "Juan Pérez",
    fecha_vencimiento: "2026-02-21"
  },
  despachos: [
    {
      fecha: "2026-02-15",
      dia: "LUNES",
      vendedor_id: "ID1",
      responsable: "Carlos López",
      producto: "AREPA TIPO OBLEA",
      cantidad: 50
    }
  ],
  vencidas: [
    {
      fecha: "2026-02-16",
      dia: "MARTES",
      vendedor_id: "ID1",
      responsable: "Carlos López",
      producto: "AREPA TIPO OBLEA",
      cantidad: 5,
      motivo: "Producto vencido"
    }
  ]
}
```

2. **Por Fecha (Historial del Día)**:
```javascript
// Endpoint: /api/trazabilidad/fecha/?fecha=2026-02-14
// Retorna:
{
  fecha: "2026-02-14",
  total_lotes: 15,
  lotes: [
    {
      lote: "L20260214",
      vendedor_id: "ID1",
      responsable: "Carlos López",
      producto: "AREPA TIPO OBLEA",
      cantidad: 100,
      origen: "PRODUCCION"
    }
  ]
}
```

3. **Por Mes (Historial Mensual)**:
```javascript
// Endpoint: /api/trazabilidad/mes/?mes=2026-02
// Retorna:
{
  mes: "2026-02",
  datos: [
    {
      fecha: "2026-02-14",
      lotes: [...]
    },
    {
      fecha: "2026-02-15",
      lotes: [...]
    }
  ]
}
```

**Visualización Timeline**:
```
📦 CREACIÓN (Badge verde)
  - Fecha de producción
  - Usuario que registró
  - Fecha de vencimiento

🚚 DESPACHO (Badge azul)
  - Fecha y día
  - Vendedor y responsable
  - Producto y cantidad

⚠️ RETORNO/VENCIDA (Badge rojo)
  - Fecha y día
  - Vendedor y responsable
  - Cantidad retornada
  - Motivo del retorno
```

**Exportación a Excel**:
```javascript
// Función: exportarTrazabilidadMesExcel()
// Genera archivo: Trazabilidad_Febrero_2026.xlsx
// Columnas: Lote, Fecha, Vendedor, Responsable, Producto, Cantidad, Usuario, Fecha Vencimiento, Origen
```

**Resumen Estadístico**:
```
- Total de despachos del lote
- Total de retornos del lote
- Total de unidades vencidas
- Total de lotes del día/mes
- Total de unidades del día/mes
```

---

## ⚙️ Análisis Detallado del Módulo "Otros"

### Funcionalidad Principal

Pantalla de configuraciones y herramientas administrativas del sistema.

### Módulos Disponibles

#### 1. Gestión de Sucursales
- Crear y administrar múltiples sucursales
- Configurar información de contacto
- Activar/desactivar sucursales
- Asignar sucursal principal

#### 2. Gestión de Usuarios
**Tipos de Usuarios**:
- **POS**: Se comportan como vendedores con capacidad de facturación
- **Pedidos**: Solo gestionan pedidos sin función de venta
- **Ambos**: Pueden usar ambos módulos

**Características**:
- Usuarios por sucursal y módulo
- Roles y permisos configurables
- Autenticación con contraseña

#### 3. Gestión de IA
- Controlar redes neuronales
- Entrenamiento de modelos
- Configuración de agentes

#### 4. Configuración de Impresión
- Configurar tickets
- Logo del negocio
- Datos de la empresa

#### 5. Reportes Avanzados
- Reportes detallados por cajero
- Reportes por sucursal
- Análisis de ventas

#### 6. Herramientas de Sistema
- Control de sincronización
- Limpieza de datos
- Mantenimiento de BD

#### 7. Gestión de Rutas
- Administrar rutas de vendedores
- Asignar clientes a rutas
- Ordenar clientes por día de visita
- **Archivo**: `frontend/src/components/rutas/GestionRutas.jsx`
- **Interacción doble clic**: Al hacer doble clic en una ruta seleccionada, aparecen dos botones compactos:
  - **Editar** (ícono lápiz, hover azul): Abre modal con nombre y vendedor precargados para editar
  - **Eliminar** (ícono basura, hover rojo): Abre modal de confirmación para eliminar
  - Los botones se ocultan automáticamente después de 5 segundos
- **Modal Ruta**: Mismo modal para crear y editar, con campos nombre y vendedor (select dinámico desde BD)
- **Fecha de actualización**: 15 de Febrero de 2026

#### 8. Reporte Ventas Ruta
- Ver reporte consolidado de ventas en ruta
- Filtrar por vendedor y fecha
- Exportar a Excel

#### 9. Precios Cargue y App
- Precios independientes para Cargue
- Precios independientes para App móvil
- Diferente a precios de POS

#### 10. Agente IA (Beta)
- Chat inteligente con datos de ventas
- Comandos de consulta
- Análisis predictivo

### Flujo Recomendado

```
1. Crear sucursales
2. Crear usuarios
3. Asignar módulos (POS/Pedidos/Ambos)
4. Configurar impresión
5. Configurar rutas (si aplica)
6. Configurar precios especiales (si aplica)
```

---

## 🔄 Integración entre Módulos

### Flujo Completo del Sistema

#### 1. Producción → Inventario
```
Producción registra lote → Actualiza api_stock → Crea movimiento ENTRADA → Kardex muestra cambio
```

#### 2. Inventario → POS
```
Stock actualizado → localStorage 'products' → POS muestra stock disponible → Valida antes de vender
```

#### 3. POS → Inventario
```
Venta confirmada → Descuenta stock → Crea movimiento SALIDA → Kardex muestra cambio
```

#### 4. Cargue → Inventario
```
Despacho finalizado → Descuenta stock → Registra lote en despacho → Trazabilidad registra movimiento
```

#### 5. Vencidas → Inventario
```
Reporte de vencidas → Incrementa stock → Crea movimiento ENTRADA → Trazabilidad registra retorno
```

#### 6. App Móvil → Backend → CRM
```
Venta en ruta → Guarda local → Sincroniza con BD → CRM muestra en reportes → Descuenta inventario
```

### Eventos del Sistema

```javascript
// Eventos disparados entre módulos
'storage' - Cambios en localStorage
'productosUpdated' - Productos actualizados
'inventarioActualizado' - Inventario modificado
'pedidoCreado' - Nuevo pedido creado
'pedidoActualizado' - Pedido modificado
'recargarPedidos' - Forzar recarga de pedidos
'cargueDataChanged' - Datos de cargue modificados
'responsableActualizado' - Responsable de vendedor actualizado
```

---

**🚀 Recuerda**: El sistema está completamente integrado. Cualquier cambio en inventario se refleja en tiempo real en todos los módulos (POS, Cargue, App Móvil, Kardex, Trazabilidad).


---

## 🔒 Gestión de Cierre y Reapertura de Turnos (Febrero 2026)

### Resumen

Sistema de control para cierre y reapertura de turnos desde la App Móvil, con modal de confirmación y limpieza automática de devoluciones al reabrir.

### Flujo de Cierre de Turno

```
1. Vendedor presiona "Cerrar Turno" en VentasScreen
2. Modal de confirmación con resumen de ventas
3. Backend calcula devoluciones automáticamente (cerrar_turno_vendedor)
4. TurnoVendedor se marca como CERRADO
5. App limpia estado local y navega al menú principal (Options)
```

### Flujo de Reapertura de Turno (App Móvil)

```
1. Vendedor entra a Ventas → verificarTurnoActivo encuentra turno CERRADO
2. App muestra selector de días (no entra directo)
3. Vendedor selecciona día/fecha → abrir_turno sin forzar
4. Backend detecta turno CERRADO → devuelve TURNO_YA_CERRADO (409)
5. App muestra Modal con icono ⚠️ y dos botones:
   - Cancelar (rojo): Vuelve al menú principal
   - Continuar (verde): Llama abrir_turno con forzar=true
6. Backend reabre turno + limpia devoluciones a 0 (restaura stock)
7. App abre turno localmente y carga stock/pedidos
```

### Cambios en Backend (api/views.py)

#### abrir_turno (POST /api/turno/abrir/)
- Acepta parámetro `forzar` (boolean)
- Sin `forzar`: Si turno está CERRADO → devuelve `TURNO_YA_CERRADO` (409)
- Con `forzar=true`: Reabre turno + limpia devoluciones del CargueIDx a 0
- Limpieza: `ModeloCargue.objects.filter(fecha, activo, devoluciones__gt=0).update(devoluciones=0)`

#### cerrar_turno_vendedor (POST /api/cargue/cerrar-turno/)
- Si detecta devoluciones > 0 (turno ya cerrado), ahora también fuerza TurnoVendedor a CERRADO
- Esto evita que un turno quede ABIERTO en BD después de un cierre previo

#### listar_vendedores_cargue (GET /api/vendedores-cargue/)
- Endpoint nuevo que devuelve vendedores desde modelo Vendedor
- Usado por Herramientas.jsx para cargar select dinámicamente
- Respuesta: `[{ id: "ID1", nombre: "JHONATHAN ONOFRES" }, ...]`

### Cambios en App Móvil (VentasScreen.js)

- **Nuevos estados**: `mostrarModalTurnoCerrado`, `fechaTurnoCerrado`
- **Modal**: Componente Modal con icono warning, mensaje y botones Cancelar/Continuar
- **Cierre**: Al cerrar turno exitosamente, toda la limpieza se hace dentro del callback de Alert "OK", luego navega a Options (menú principal)
- **Estilos**: `modalContent` y `btnModal` agregados al StyleSheet

### Cambios en Frontend (Herramientas.jsx)

- Select de vendedores ahora es dinámico (carga desde `/api/vendedores-cargue/`)
- Usa modelo Vendedor de la BD en vez de lista hardcodeada
- Se actualiza automáticamente si cambian nombres en Gestión de Vendedores

### Archivos Modificados

- `api/views.py` - Endpoints abrir_turno, cerrar_turno_vendedor, listar_vendedores_cargue
- `api/urls.py` - Nueva URL vendedores-cargue/
- `AP GUERRERO/components/Ventas/VentasScreen.js` - Modal turno cerrado, navegación post-cierre
- `frontend/src/components/common/Herramientas.jsx` - Select dinámico de vendedores

### Notas Técnicas

1. **El backend NO reabre sin confirmación**: Sin `forzar=true`, devuelve 409
2. **Devoluciones se limpian al reabrir**: El stock vuelve al valor pre-cierre
3. **Cierre navega al menú**: `navigation.navigate('Options')` en vez de `goBack()`
4. **TurnoVendedor siempre sincronizado**: Si hay devoluciones pero turno ABIERTO, se fuerza a CERRADO

**Fecha de implementación**: 15 de Febrero de 2026


---

## 🔧 Fix Cierre de Turno - Doble Confirmación Eliminada (15 Feb 2026)

### Problema
Al cerrar turno desde la App Móvil (VentasScreen), el vendedor tenía que confirmar DOS veces:
1. Modal bonito con botón "Cerrar Turno"
2. Alert nativo con OTRO botón "Cerrar Turno"

Si el vendedor tocaba "Cerrar Turno" en el modal pero luego tocaba "Cancelar" en el segundo Alert (o lo descartaba), el cierre nunca se ejecutaba. El turno quedaba ABIERTO en el backend y al volver a entrar a Ventas, el turno seguía activo.

### Solución
- Eliminada la doble confirmación. El modal ya ES la confirmación.
- `handleCerrarTurno` ahora ejecuta `procesarCierreTurno` directamente sin Alert intermedio.
- `procesarCierreTurno` extraída como función independiente (antes era función anidada dentro de `handleCerrarTurno`).
- Se eliminó la validación de "turno vacío" con Alert adicional (el modal ya muestra el resumen).

### Flujo Actual
```
1. Vendedor toca botón candado → Se abre modal con resumen
2. Modal muestra: Ventas Ruta, Pedidos, Total a Entregar
3. Vendedor toca "Cerrar Turno" en el modal
4. Se ejecuta procesarCierreTurno() DIRECTAMENTE
5. POST a /api/cargue/cerrar-turno/
6. Backend calcula devoluciones y cierra TurnoVendedor
7. App muestra resumen de cierre
8. Al tocar OK → Limpia estado y navega a Options
```

### Archivo Modificado
- `AP GUERRERO/components/Ventas/VentasScreen.js` - `handleCerrarTurno()` y `procesarCierreTurno()`

---

## ✅ Lógica de Checks V en Módulo Cargue (AP GUERRERO) - Documentación

### Arquitectura de Checks (Cargue.js)

El módulo de Cargue usa optimistic updates con reversión condicional para los checks de Vendedor (V).

### Flujo de handleCheckChange
```
1. Vendedor toca check V de un producto
2. Validaciones: requiere check D marcado + cantidad > 0
3. UI se actualiza INMEDIATAMENTE (optimistic update)
4. Vibración de feedback (30ms)
5. Se cancela request anterior del mismo controller (si existe)
6. POST a /api/actualizar-check-vendedor/ con timeout 12s
7. Si éxito → Log de confirmación
8. Si error/timeout → REVIERTE el check + muestra Alert
9. Si fue cancelado por nuevo click rápido → NO revierte
```

### Controller Compartido (checkControllerRef)
- Un solo `useRef` compartido para todos los productos
- Al marcar un check, se cancela el request anterior (`controller.abort()`)
- En el catch: si `controller !== checkControllerRef.current` → fue cancelado por nuevo click → NO revertir
- Si `controller === checkControllerRef.current` → fue timeout real → SÍ revertir

### Tiempos
- Timeout de request: 12 segundos
- Vibración: 30ms

### Archivo
- `AP GUERRERO/components/Cargue.js` - `handleCheckChange()`

---

## 📋 Tareas Pendientes

### 🔍 Revisar ventas en Cargue con precios especiales desde App Móvil
- **Prioridad**: Media
- **Descripción**: Cuando un vendedor vende a un cliente con precios especiales desde la app móvil (AP GUERRERO), revisar cómo se refleja en el módulo de Cargue del CRM Web. Verificar si los totales, el resumen de ventas y las diferencias de precios se calculan correctamente.
- **Archivos a revisar**: `AP GUERRERO/components/Ventas/VentasScreen.js`, `frontend/src/components/Cargue/PlantillaOperativa.jsx`, `api/views.py` (cerrar_turno_vendedor)
- **Fecha de registro**: 15 de Febrero de 2026

### 🔄 Eliminar rebote visual en tabla de Cargue al cambiar entre IDs
- **Prioridad**: Baja
- **Descripción**: Al cambiar entre IDs (ID1, ID2, etc.) en el módulo de Cargue cuando el estado es DESPACHO, se ve un rebote visual rápido (milisegundos) en las columnas TOTAL, VALOR y NETO. Se muestran por un instante valores anteriores (antes de devoluciones/vencidas) y luego se ajustan a los valores reales de la BD. El problema es que localStorage guarda un snapshot de los datos antes de que el vendedor cierre turno (sin devoluciones), y al cambiar de ID el `useState` inicial carga esos datos viejos antes de que la BD responda con los datos actualizados. También hay múltiples `useEffect` que disparan cargas simultáneas (`cargarDatosGuardados`, `cargarDatosDesdeDB`) al montar el componente, causando renders intermedios con datos inconsistentes.
- **Posibles soluciones**: (1) No cargar de localStorage cuando el estado es DESPACHO/COMPLETADO y solo esperar la BD. (2) Evitar cargas duplicadas con un ref de control. (3) Actualizar localStorage cuando el vendedor cierra turno para que refleje devoluciones. Requiere análisis cuidadoso para no romper la carga rápida en ALISTAMIENTO.
- **Archivos a revisar**: `frontend/src/components/Cargue/PlantillaOperativa.jsx` (useState inicial, useEffect de preciosLista, useEffect de montaje, useEffect de products)
- **Fecha de registro**: 15 de Febrero de 2026

### 🔧 Herramienta Admin para rehabilitar envío de Sugerido
- **Prioridad**: Media
- **Descripción**: Crear una herramienta en modo Administrador que permita rehabilitar el envío de sugerido para un vendedor/día/fecha específico. Caso de uso: cuando el vendedor envía sugerido desde la app y falla el internet, quedan registros con cantidad=0 que bloquean el reenvío. Actualmente se corrigió la validación para limpiar automáticamente registros vacíos, pero se necesita una herramienta manual para casos donde ya se envió un sugerido con cantidades incorrectas y se quiere permitir reenviar. La herramienta debe: (1) Mostrar selector de vendedor (ID1-ID6), día y fecha. (2) Mostrar los registros existentes del sugerido. (3) Botón para eliminar/resetear el sugerido y permitir reenvío. (4) Solo accesible en modo Administrador.
- **Archivos a revisar**: `api/views.py` (guardar_sugerido), `frontend/src/components/common/Herramientas.jsx`, modelos CargueID1-ID6
- **Fecha de registro**: 15 de Febrero de 2026

### 📱 Mejorar manejo de error de conexión al enviar Sugerido desde App
- **Prioridad**: Alta
- **Descripción**: Cuando el vendedor envía sugerido desde la app (AP GUERRERO) y falla la conexión a internet, la app se queda cargando sin mostrar error claro. Esto causa que el vendedor cierre la app y queden registros con cantidad=0 en la BD que bloquean futuros envíos. Se necesita: (1) Detectar fallo de conexión/timeout al hacer POST a `/api/guardar-sugerido/`. (2) Mostrar alerta clara "Fallo de conexión, no se pudo enviar el sugerido". (3) NO enviar datos parciales si la conexión falla. (4) Permitir reintentar el envío.
- **Archivos a revisar**: `AP GUERRERO/components/ProductList.js` (función de envío de sugerido), `AP GUERRERO/config.js` (timeouts)
- **Fecha de registro**: 15 de Febrero de 2026
