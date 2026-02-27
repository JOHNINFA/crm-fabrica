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

### Ajustes recientes en Ventas (AP GUERRERO) — Febrero 2026

#### Modal `Vencidas` (`components/Ventas/DevolucionesVencidas.js`)
- El header del modal se compactó para subir visualmente el título **Productos Vencidos**.
- Se agregó buscador de productos **fijo (sticky)** arriba de la lista (`Buscar producto...`), para filtrar rápido sin perder el input al hacer scroll.
- Se eliminó la tarjeta visual de `Total vencidas` para ganar espacio útil en pantalla.
- El botón principal del footer ya no muestra `Limpiar` cuando está en cero; ahora usa `Guardar` (y `Guardar (N)` cuando hay cantidades).
- Se agregó ícono de papelera en el header para **limpiar todo**:
  - pone cantidades en `0` (vacía `cantidades`)
  - borra fotos cargadas (vacía `fotos`)
  - pide confirmación antes de ejecutar.
- Corrección funcional: si un producto tenía cantidad y luego se escribe `0`, se elimina correctamente del registro sin fallar (flujo de corrección de vendedor).

#### Flujo de guardado de vencidas en `VentasScreen`
- El modal de vencidas en flujo normal sigue guardando primero en estado local (`vencidas`, `fotoVencidas`) y se envía al backend al confirmar la venta.
- En confirmación de venta/pedido, se mapea a `productos_vencidos` + `foto_vencidos` (base64 si aplica) para persistencia backend.

#### Reimpresión de tickets (`printerService`) — Paridad con venta normal
- Se ajustó `services/printerService.js` para que en **reimpresión** los valores monetarios salgan igual que en una venta normal (sin decimales).
- En `generarTicketHTML` ahora se redondean:
  - `precio_unitario` por ítem
  - `subtotal` por ítem
  - `Subtotal`, `Descuento` y `TOTAL` del bloque de totales.
- Se agregó fallback para reimpresión cuando el objeto no trae `subtotal`:
  - calcula `subtotal` desde los detalles (`sum(item.subtotal)` o `cantidad * precio_unitario`).
- Se agregó fallback de `descuento` cuando falta:
  - `descuento = max(0, subtotal - total)`.
- Objetivo: evitar diferencias entre ticket de venta inmediata y ticket de reimpresión (casos detectados: subtotal ausente en ruta y decimales en pedidos).

#### Auto-sincronización de ventas offline (VentasScreen) — cada 5 segundos
- En `components/Ventas/VentasScreen.js` se implementó sincronización automática periódica para ventas pendientes offline.
- Regla operativa:
  - Solo corre cuando hay internet (`NetInfo` conectado).
  - Solo aplica si existen pendientes en `ventas_pendientes_sync`.
  - Intervalo de ejecución: **5 segundos**.
- También sincroniza inmediatamente cuando la conectividad vuelve (sin intervención del vendedor).
- Se agregó protección anti-solape para evitar múltiples sincronizaciones simultáneas (`sincronizandoAutoRef`).
- Feedback visual:
  - Banner `Sincronizando...` mientras envía.
  - Banner de éxito cuando se enviaron ventas.
  - Modal/toast rápido: `Venta offline enviada` / `N ventas offline enviadas`.
- Importante: este flujo **no cambia** el comportamiento normal online; solo actúa en casos con pendientes offline.

#### Edición de venta y ajuste de stock automático (sin pull-to-refresh manual)
- En la edición de ventas desde historial (`VentasScreen`), el ajuste de `stockCargue` quedó automático al confirmar cambios de cantidades.
- Flujo aplicado:
  1. Devuelve al stock local las cantidades de la venta original.
  2. Descuenta del stock local las cantidades de la venta editada.
  3. Refresca stock del backend en segundo plano con `cargarStockCargue(diaSeleccionado, fechaSeleccionada)` para asegurar paridad visual.
- Se robusteció el matching de nombres de producto para stock:
  - normalización por mayúsculas, tildes y espacios
  - fallback contra catálogo local (`productos`) cuando no hay coincidencia exacta por clave.
- Resultado esperado: al editar (ej. de 3 a 2 unidades), el stock se actualiza de inmediato sin necesidad de arrastrar para sincronizar.

#### Estabilidad UI en Ventas al abrir teclado (Android)
- Se ajustó configuración nativa Expo para evitar que al enfocar cantidades se desplace el bloque superior (card de cliente + botones `Vencidas/Cerrar`).
- Archivo modificado: `AP GUERRERO/app.json`.
- Cambio aplicado en Android:
  - `softwareKeyboardLayoutMode`: de `"pan"` a `"resize"`.
- Efecto esperado:
  - El área que se adapta al teclado es principalmente la lista de productos.
  - La card del cliente y los botones superiores permanecen fijos visualmente durante la edición de cantidades.
- Alcance:
  - No modifica lógica de ventas, sincronización ni backend.
  - Requiere relanzar/recompilar app Android para que el ajuste nativo se aplique correctamente.

#### Optimización de velocidad e interacción en Ventas (UI más fluida)
- Se aplicaron optimizaciones internas en `components/Ventas/VentasScreen.js` para mejorar respuesta al escribir, buscar y modificar cantidades, sin cambios visuales.
- Mejoras implementadas:
  - Búsqueda con debounce corto (`140ms`) para reducir renders innecesarios mientras se escribe.
  - Índice en memoria de productos por `id` (`Map`) para evitar búsquedas lineales repetidas (`find`) en acciones frecuentes.
  - Precálculo de nombres normalizados para filtrado de productos (mejor desempeño en búsqueda online/offline).
  - Precálculo de precios efectivos por producto (`preciosPorProductoId`) para evitar recalcular reglas de precio en cada render.
  - Actualización de cantidades con `setState` funcional + referencia `carritoRef` para mayor estabilidad en toques rápidos.
  - Cálculo de subtotal/total basado en productos realmente presentes en `carrito`, no en todo el catálogo.
- Resultado esperado:
  - Menor latencia percibida en `Buscar producto`.
  - Mejor respuesta al tocar `+/-` repetidamente.
  - Interacción más estable al editar cantidades con teclado.
- Alcance:
  - Sin cambios de layout/estilo.
  - Sin cambios de endpoints ni backend.

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
- **Sincronización de Estado Global**: Como el cambio de estado depende de los datos (checks 'D'), y los datos se sincronizan en tiempo real entre todos los usuarios, el cambio de botón (Café → Azul) se refleja automáticamente en todos los dispositivos conectados sin necesidad de recargar.

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

## 📅 Módulo de Planeación - Estado Actual (Febrero 2026)

### Resumen Ejecutivo

El módulo de Planeación (`InventarioPlaneacion.jsx`) permite planificar la cantidad de productos a fabricar para una fecha específica. Es siempre editable, sin bloqueos por estado del cargue. El control de versión final se hace con el botón "Guardar Reporte".

### Comportamiento Actual

#### Carga de Datos al Cambiar de Fecha
- Al seleccionar una fecha nueva: limpia `productos` y `cache` inmediatamente, activa spinner.
- Servidor carga los datos del día nuevo y los pinta de una sola vez (sin flash ni datos de otro día).
- El `useEffect` de `fechaSeleccionada` hace `setProductos([])`, `setCargando(true)` y `setCache({...null})` antes de llamar a `cargarExistenciasReales(true)`.

#### Merge con Validación de Fecha
- El bloque de fusión (`setProductos`) verifica `cache.fecha === fechaFormateada` antes de preservar valores locales.
- Si la fecha del cache es diferente → usa exactamente lo que trae el servidor (evita contaminación entre días).
- Si es la misma fecha → preserva `orden` e `ia` locales si el servidor trae 0 (protege ediciones del usuario).

#### Edición Siempre Habilitada
- `diaCongelado` está forzado a `false` (lógica anterior desactivada).
- El usuario puede editar `Orden` e `IA` en cualquier momento, sin importar el estado del cargue.
- El bloqueo real solo ocurre si `diaCongelado = true` (actualmente nunca se activa).

#### Guardado Automático
- Al editar `Orden` o `IA`: debounce de 500ms → guarda en BD via `guardarEnBD()` (POST o PATCH según exista).
- Guardado inmediato en `localStorage` (`planeacion_YYYY-MM-DD`) para sobrevivir recargas F5.
- Indicador visual de spinner por celda mientras guarda.

#### Polling Desactivado
- No hay polling automático. Solo se actualiza:
  1. Al cargar la página / cambiar de fecha
  2. Al hacer clic en "Sincronizar"
  3. Al recibir eventos: `pedidoGuardado`, `inventarioActualizado`, `productosUpdated`, `cargueActualizado`

#### Control de Versiones (Snapshot)
- Botón "Guardar Reporte" (verde cuando ya existe) genera snapshot inmutable en BD (`/api/reportes-planeacion/`).
- Si ya existe reporte → muestra advertencia y no sobreescribe.
- El reporte histórico tiene prioridad sobre `planeacion` BD al cargar (fuente de verdad para `orden` e `ia`).

### Columnas de la Tabla

| Columna | Editable | Fuente |
|---------|----------|--------|
| Existencias | ❌ | `api_stock` |
| Solicitadas | ❌ | Suma cargue ID1-ID6 en tiempo real |
| Pedidos | ❌ | `api/pedidos/` filtrado por fecha |
| Total | ❌ | Solicitadas + Pedidos |
| Orden | ✅ | Usuario / Snapshot BD |
| IA | ✅ (via botón) | Predicción IA + editable |

### Limpieza de localStorage
- Al montar el componente: elimina entradas `planeacion_*` con más de 7 días de antigüedad.

### Comportamiento Corregido (historial)
- Cambiar de día → spinner → datos frescos del nuevo día, sin flash ✅
- Abrir día sin datos → `Orden = 0` ✅
- Recargar mismo día con ediciones → preserva valores locales ✅
- Datos de día anterior no contaminan el día nuevo ✅

### Archivo
- `frontend/src/components/inventario/InventarioPlaneacion.jsx`

**Última actualización**: 19 de Febrero de 2026

---

## ⚡ Fix Botón Sincronizar Planeación (19 Feb 2026)

### Problema
El botón "Sincronizar" en Planeación llamaba a `sincronizarDatosOperativos()`, una función liviana que en la práctica no actualizaba correctamente los datos. Además no mostraba animación visual al presionarlo.

### Solución
- El botón ahora llama directamente a `cargarExistenciasReales(true)` — igual que un F5 pero sin perder la fecha seleccionada.
- Se agregó `setCargando(true)` al inicio de `cargarExistenciasReales` para que el botón muestre "Sincronizando..." y se desactive mientras carga.
- Se eliminó la función duplicada `sincronizarDatosOperativos` que había quedado dos veces en el archivo.

**Lo que recarga**:
- Existencias → desde `api_stock` ✅
- Solicitadas → desde cargue ID1-ID6 ✅
- Pedidos → desde BD ✅
- Orden → preserva lo que el usuario editó ✅
- IA → preserva lo que el usuario editó ✅

### Archivo Modificado
- `frontend/src/components/inventario/InventarioPlaneacion.jsx` — botón Sincronizar + `setCargando(true)` en `cargarExistenciasReales`

---

## 🖨️ Mejoras en Impresión de Tickets (Febrero 2026)

### Resumen
Se ajustó el diseño del ticket de pedido para mejorar la legibilidad y la trazabilidad de la impresión.

### Cambios Visuales
1.  **Encabezado (Fecha Principal):**
    -   Se reemplazó la fecha de *creación* por la **Fecha de Entrega**.
    -   Se añade dinámicamente la **Hora de Impresión** actual para dar contexto temporal preciso.
    -   Formato: `Fecha: YYYY-MM-DD HH:mm a.m./p.m.`

2.  **Pie de Página (Auditoría):**
    -   Se añadió un sello de tiempo explícito al final del ticket.
    -   Texto: `Fecha de impresion: DD/MM/YYYY, HH:mm a.m./p.m.` (Fuente pequeña 7px).
    -   Firma: **"Elaborado por Software Guerrero"** ahora es más visible (9px, negrita).

### Archivos Modificados
- `frontend/src/components/Print/TicketPreviewModal.jsx`

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

#### 1.1 Modal Auditoría de Liquidación (Vendidas)
**Ubicación**: Dentro de `PlantillaOperativa.jsx` (Lógica `abrirAuditoria` y UI `mostrarModalVendidas`)

**Características Reincorporadas**:
- Muestra comparación en vivo entre lo que tiene el vendedor (FÍSICO) y lo que reportó en la App Móvil (APP VENDIDAS).
- El sistema **pausa el polling autómatico en 2do plano** cuando el modal de auditoría se encuentra abierto (`if (mostrarModalVendidas) return;` en el `setInterval`). Esto previene el sobreescrito de valores en background y "parpadeos" del UI.
- Reincorporación de columnas **DIFERENCIA** y **ESTADO** con estilos visuales y calculadoras en tiempo real.
    - `Cuadra` (Diferencia = 0, Gris)
    - `Faltante` (Diferencia < 0, Rojo + Pulso)
    - `Sobrante` (Diferencia > 0, Naranja)

**⚠️ IMPORTANTE (Prevención de bugs de reseteo a 0)**:
El sistema de recarga automática en PlantillaOperativa (tanto desde `localStorage` como directos desde `results` / Backend) tiende a **limpiar variables que no estén mapeadas explícitamente**. 
Es obligatorio incluir `vendidas: parseInt(reg.vendidas) || 0` (y si procede `vencidas:` y `lotesVencidos:`) dentro de las asignaciones de todos los `.map()` de productos desde Base de Datos hacia `productosOperativos`. 
Si se omite este mapeo explícito de la llave `vendidas`, **el Polling en 2do plano reseteará el campo "vendidas" silenciosamente a 0 cada 15 segundos**, afectando inmediatamente el modal de auditoría al no encontrar los valores cacheados. Además, la carga desde `abrirAuditoria` debe escanear la data por la key correcta en el diccionario del servidor: `const ds = data[p.producto] || data[p.producto.trim()]`.

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

---

## ⚖️ Modal de Auditoría de Liquidación (19 Feb 2026)

### ¿Qué es?

El Modal de Auditoría es una vista especial dentro de `PlantillaOperativa.jsx` que el despachador puede abrir para revisar, **en tiempo real**, qué unidades registró el vendedor como vendidas en la App Móvil (`vendidas`). Se abre con el botón **"⚖️ Auditoría"** en el encabezado de la plantilla.

### Flujo al Abrir el Modal

Al hacer clic en "⚖️ Auditoría", se ejecuta `abrirAuditoria()`:

1. El botón muestra un spinner "Sincronizando..." y se deshabilita
2. Hace `fetch` a `/api/obtener-cargue/?vendedor_id=IDx&dia=...&fecha=...`
3. Actualiza **solo el campo `vendidas`** en `productosOperativos` con los datos frescos del servidor
4. Abre el modal con datos al 100% actualizados

```javascript
const abrirAuditoria = async () => {
    setSincronizandoAuditoria(true);
    // ... fetch al servidor ...
    setProductosOperativos(prev => prev.map(p => {
        const ds = datosServidor[p.producto];
        if (ds) return { ...p, vendidas: ds.vendidas ?? p.vendidas ?? 0 };
        return p;
    }));
    setMostrarModalVendidas(true);
};
```

### Vista del Modal

- Solo muestra productos donde **`vendidas > 0`** (lo que el vendedor reportó como vendido)
- Columnas: PRODUCTO | FÍSICO (total cargado) | APP (vendidas) | DIFERENCIA | ESTADO
- Badge de estado semántico: 🔴 Faltante / 🟢 Cuadra / 🟡 Sobrante
- `thead` y `tfoot` con `position: sticky` para scroll interno sin perder encabezados ni totales
- Footer muestra "Discrepancia crítica detectada" si hay faltantes

### Protección del Polling

Mientras el modal está abierto, el polling (3 seg) está pausado para evitar que `cargarDatosGuardados()` sobreescriba `vendidas` con valores viejos de localStorage:

```javascript
const pollingInterval = setInterval(async () => {
    if (mostrarModalVendidas) return; // 🛡️ Pausa mientras modal abierto
    // ... lógica normal de polling ...
}, 3000);
```

El `useEffect` del polling incluye `mostrarModalVendidas` en sus dependencias para recrearse correctamente.

### Posicionamiento Responsivo

Se inyecta un `<style>` dinámico con media query para esquivar el menú lateral:

```css
@media (min-width: 992px) {
    .modal-auditoria-bg { padding-left: 170px !important; }
}
/* En pantallas < 992px: centrado automático con Flexbox */
```

### Estados Nuevos

| Estado/Función | Tipo | Propósito |
|---|---|---|
| `mostrarModalVendidas` | `boolean` | Controla visibilidad del modal |
| `sincronizandoAuditoria` | `boolean` | Controla spinner del botón |
| `productosFiltradosAudit` | computed | `productosOperativos.filter(p => vendidas > 0)` |
| `abrirAuditoria()` | `async function` | Sincroniza servidor y abre modal |

### Impacto en Plantilla Principal

- ✅ TablaProductos, checks V/D, cálculo totales: **sin cambios**
- ✅ `cargueRealtimeService`: **sin cambios**
- ✅ Polling cuando modal cerrado: **idéntico al anterior**
- ⚠️ `abrirAuditoria` modifica **solo** `vendidas` en memoria, NO toca localStorage

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
- Fuente de datos (actual): backend primero + fallback local.
  - `GET /api/ventas-ruta/?vendedor_id=IDx&fecha=YYYY-MM-DD` (ventas ruta sincronizadas).
  - `GET /api/pedidos/pendientes_vendedor/?vendedor_id=x&fecha=YYYY-MM-DD` (solo `ENTREGADO/ENTREGADA` para reimpresión).
  - Si backend falla o no responde: usa `ventasDelDia` local (AsyncStorage).
- Acción por fila: botón `print` ejecuta `imprimirTicket(venta)`.

Estado UI aprobado (actual):
- El modal abre con overlay oscuro y panel inferior.
- Se removió el título `"🧾 Ventas del Día (n)"`.
- Se removió el texto guía `"Toca el botón de imprimir..."`.
- El contenedor general del modal en esa vista quedó transparente.
- Las cards de cada venta se mantienen sólidas (`#f8f9fa`), con cliente, hora/metodo de pago, total y botón de imprimir.
- Diferenciación visual por origen:
  - `RUTA`: card normal.
  - `PEDIDO_FACTURADO`: card con borde ámbar y badge `PEDIDO`.
- Cierre del modal: botón `close-circle` (X) en la parte superior derecha.

#### Flujo de Atención Secuencial de Clientes (UX)
- Objetivo: acelerar la atención en ruta respetando el orden del día.
- Fuente de orden: lista de `ClienteSelector` del día actual (incluye clientes de ruta y clientes con pedido).
- Comportamiento:
  - Después de confirmar una venta, la app avanza automáticamente al siguiente cliente del orden.
  - Si no se va a vender al cliente actual, el usuario puede tocar el botón `play-skip-forward` en la card de cliente para pasar manualmente al siguiente.
  - Se mantiene la entrada manual al listado completo con la flecha `chevron-forward`.
- Regla al final de la lista: muestra alerta de fin de ruta y no altera otros módulos.

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
- usuario: Usuario de sesión activa (tomado de login `crm_usuario`)
- fechaSeleccionada: Fecha de producción
- lote: Número de lote generado (formato: LYYYYMMDD)
- fechaVencimiento: Fecha de vencimiento del lote
- lotes: Array de lotes del día
- productos: Array de productos con cantidades
- yaSeGrabo: Boolean indicando si ya se grabó el día
- datosGuardados: Datos de confirmación del día
```

**Usuario autenticado en Inventario (Producción + Maquilas) — Febrero 2026**:
```javascript
// Fuente única del usuario operativo:
- AuthContext (sesión actual)
- Fallback: localStorage 'crm_usuario'
- Helper: frontend/src/utils/inventarioUsuario.js

// Regla aplicada:
- El nombre visible en Inventario SIEMPRE refleja el usuario logueado.
- Ya no depende de 'usuario_produccion' ni de configuración manual.
- Los movimientos/entradas/salidas se envían con ese usuario.
```

**Archivos clave**:
- `frontend/src/utils/inventarioUsuario.js`
- `frontend/src/components/inventario/InventarioProduccion.jsx`
- `frontend/src/components/inventario/InventarioMaquilas.jsx`

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
- Permite múltiples registros en el mismo día (ej: 10am, 12pm, tarde)
- Acumula confirmación del día (no reemplaza movimientos anteriores)
- Reconstruye confirmación desde backend cuando no existe cache local
- Usa el usuario logueado de sesión para todos los movimientos

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

### Controller Independiente por Producto (checkControllersRef)
- Un `useRef` tipo diccionario `{}` para gestionar controladores de forma independiente por cada producto.
- Al marcar un check de una Arepa A, si marcas otra Arepa B, ambas solicitudes conviven en paralelo.
- Solo se cancela el request (`controller.abort()`) si el usuario oprime *el mismo producto* varias veces seguidas muy rápido.
- En el catch: si `controller !== checkControllersRef.current[productName]` → fue cancelado por nuevo click en ese mismo producto → NO revierte.
- Si `controller === checkControllersRef.current[productName]` (o hay error de red/timeout) → SÍ revierte para corregir la UI.

### Tiempos
- Timeout de request: 12 segundos
- Vibración: 30ms

### Archivo
- `AP GUERRERO/components/Cargue.js` - `handleCheckChange()`

---

## 📸 Regla Flexibilizada para Evidencias de Vencidas (AP GUERRERO)

**Contexto**: Anteriormente, el módulo de ventas bloqueaba la confirmación si un vendedor reportaba Vencidas de 5 productos diferentes sin subir estrictamente 5 fotos (una por cada caja o tipo de arepa). Esto demoraba la atención al cliente.

**Nueva Regla en Producción**:
- Ahora el componente `DevolucionesVencidas.js` permite **fotos generales/agrupadas**.
- Al seleccionar la condición `tipo === 'vencidas'`, la App simplemente valida que haya **al menos UNA (1) foto** en cualquiera de las cajas de productos cargadas en ese modal. 
- No se obliga a tomar la foto de un producto específico, permitiendo al vendedor disponer varias pacas vencidas, tomar una o dos fotos panorámicas como evidencia e inmediatamente enviar el reporte en lote.
- `Object.values(fotos).some(uris => uris.length > 0)` es el condicional utilizado para destrabar el botón Guardar.
- Continúa empaquetándose en base64 para subir al servidor bajo un identificador `VENC-TIMESTAMP`, tal cual estaba planteado.

**Ubicación**:
- `AP GUERRERO/components/Ventas/DevolucionesVencidas.js`

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

- **Archivos a revisar**: `api/views.py` (guardar_sugerido), `frontend/src/components/common/Herramientas.jsx`, modelos CargueID1-ID6
- **Fecha de registro**: 15 de Febrero de 2026

### 📱 Mejorar manejo de error de conexión al enviar Sugerido desde App
- **Prioridad**: Alta
- **Descripción**: Cuando el vendedor envía sugerido desde la app (AP GUERRERO) y falla la conexión a internet, la app se queda cargando sin mostrar error claro. Esto causa que el vendedor cierre la app y queden registros con cantidad=0 en la BD que bloquean futuros envíos. Se necesita: (1) Detectar fallo de conexión/timeout al hacer POST a `/api/guardar-sugerido/`. (2) Mostrar alerta clara "Fallo de conexión, no se pudo enviar el sugerido". (3) NO enviar datos parciales si la conexión falla. (4) Permitir reintentar el envío.
- **Archivos a revisar**: `AP GUERRERO/components/ProductList.js` (función de envío de sugerido), `AP GUERRERO/config.js` (timeouts)
- **Fecha de registro**: 15 de Febrero de 2026

---

## 🔧 Fix Precios Cargue - Lógica Defensiva de Caché (16 Feb 2026)

### Problema Detectado

En el módulo "Precios Cargue y App" (`/otros/precios-cargue`), cuando se intentaba actualizar el precio de un producto que tenía `precio_cargue = 0` en la base de datos, el cambio NO se reflejaba en el módulo de Cargue. 

**Ejemplo específico**: CANASTILLA
- En BD: `precio_cargue = 0`
- En Cargue: Mostraba $13,000 (valor antiguo del caché)
- Al intentar cambiar a cualquier valor en "Precios Cargue y App", el cambio NO se reflejaba

### Causa Raíz

La lógica defensiva en `PlantillaOperativa.jsx` estaba diseñada para proteger contra "glitches" de la API, pero causaba un efecto secundario no deseado:

**Lógica ANTERIOR** (líneas 69-86):
```javascript
if (precioCargue > 0) {
    // 1. Si precio_cargue > 0 → Usar ese precio
    mapaPrecios[p.id] = precioCargue;
} else if (precioEnCache > 0) {
    // 2. Si precio_cargue = 0 PERO hay caché → CONSERVAR CACHÉ
    // ❌ PROBLEMA: Esto impedía actualizar productos con precio 0
    mapaPrecios[p.id] = precioEnCache;
} else {
    // 3. Si no hay nada → Calcular 65%
    mapaPrecios[p.id] = Math.round(precioBase * 0.65);
}
```

**Comportamiento problemático**:
1. CANASTILLA tenía `precio_cargue = 0` en BD
2. El caché del navegador (`localStorage.precios_cargue_cache`) tenía un valor antiguo de 13000
3. La condición `else if (precioEnCache > 0)` se cumplía
4. El sistema conservaba el valor del caché (13000) en lugar de respetar el 0 de la BD
5. Incluso al cambiar el precio en "Precios Cargue y App", si se guardaba como 0, seguía mostrando 13000

### Solución Implementada

Se modificó la lógica para distinguir entre:
- **`precio_cargue` definido explícitamente** (incluso si es 0) → Respetar ese valor
- **`precio_cargue` no definido** (null/undefined por error de API) → Conservar caché como protección

**Lógica NUEVA** (líneas 69-86):
```javascript
if (p.precio_cargue !== null && p.precio_cargue !== undefined) {
    // 1. Si precio_cargue EXISTE en BD (incluso si es 0) → Usarlo
    // ✅ CAMBIO: Ahora respeta cuando se pone explícitamente 0
    mapaPrecios[p.id] = precioCargue || 0;
} else if (precioEnCache > 0) {
    // 2. Si precio_cargue NO está definido pero hay caché → Conservar caché
    // Protección anti-glitch: solo actúa si la API no devuelve el campo
    mapaPrecios[p.id] = precioEnCache;
} else {
    // 3. Si no hay nada → Calcular 65%
    mapaPrecios[p.id] = Math.round(precioBase * 0.65);
}
```

### Comportamiento Corregido

| Escenario | precio_cargue BD | Caché | ANTES | AHORA |
|-----------|------------------|-------|-------|-------|
| Producto normal | 1900 | 1900 | 1900 ✅ | 1900 ✅ |
| Cambio de precio | 2500 | 1900 | 2500 ✅ | 2500 ✅ |
| Precio en 0 explícito | 0 | 13000 | 13000 ❌ | 0 ✅ |
| Error de API | undefined | 1900 | 1900 ✅ | 1900 ✅ |
| Producto nuevo sin precio | 0 | - | 65% ✅ | 0 ✅ |

### Impacto

- **Productos con precio > 0**: Sin cambios, funcionan igual que antes ✅
- **Productos con precio = 0**: Ahora se respeta el 0 de la BD en lugar de conservar caché antiguo ✅
- **Protección anti-glitch**: Se mantiene para casos donde la API no devuelve el campo ✅
- **Modificación de precios**: Sigue funcionando correctamente para todos los productos ✅

### Casos de Uso Validados

1. **Cambiar precio de producto normal**: 1900 → 2500 ✅
2. **Poner precio en 0**: 1900 → 0 ✅
3. **Cambiar precio desde 0**: 0 → 15000 ✅
4. **Productos sin precio_cargue**: Usan fallback 65% o caché según disponibilidad ✅

### Archivos Modificados

- `frontend/src/components/Cargue/PlantillaOperativa.jsx` - Lógica de carga de precios (líneas 69-86)

### Notas Técnicas

1. **Caché de precios**: Se guarda en `localStorage.precios_cargue_cache` como mapa `{ productoId: precio }`
2. **Actualización**: Se ejecuta al montar PlantillaOperativa (useEffect con dependencias vacías)
3. **Sincronización**: Los cambios en "Precios Cargue y App" se reflejan después de recargar Cargue (F5)
4. **Fallback 65%**: Solo se usa cuando `precio_cargue` no está definido Y no hay caché

**Fecha de implementación**: 16 de Febrero de 2026

---

**🚀 Recuerda**: Este contexto es tu fuente de verdad sobre el proyecto. Úsalo para tomar decisiones informadas y mantener la consistencia.

---

## 🛠️ Trabajo Realizado — 19 de Febrero de 2026

### 1. Fix: Configuración de Impresión con Caché Offline (printerService.js)

**Archivo**: `AP GUERRERO/services/printerService.js`

**Problema**: En modo offline, al abrir la app y querer imprimir un ticket, fallaba la consulta a `/api/configuracion-impresion/` y el ticket salía sin logo ni configuración personalizada. El error "Error obteniendo configuración de impresión" aparecía en pantalla.

**Solución implementada**:
- Nueva función `obtenerConfigImpresionConCache()` que:
  1. Intenta obtener config del backend (con internet)
  2. Si lo logra → guarda en `AsyncStorage` con key `impresion_config_cache_v1`
  3. Si falla (offline) → lee del caché guardado previamente
  4. Si no hay caché → usa valores por defecto (sin logo, nombre por defecto)

```javascript
const IMPRESION_CONFIG_CACHE_KEY = 'impresion_config_cache_v1';

const obtenerConfigImpresionConCache = async () => {
  let config = null;
  try {
    config = await obtenerConfiguracionImpresion();
    if (config) {
      await AsyncStorage.setItem(IMPRESION_CONFIG_CACHE_KEY, JSON.stringify({ config, timestamp: Date.now() }));
    }
  } catch (error) {
    // Offline → leer caché
    const cacheRaw = await AsyncStorage.getItem(IMPRESION_CONFIG_CACHE_KEY);
    if (cacheRaw) config = JSON.parse(cacheRaw).config;
  }
  const logoBase64 = (config?.logo_base64 && config?.mostrar_logo !== false) ? config.logo_base64 : null;
  return { config, logoBase64 };
};
```

- Las funciones `imprimirTicket()`, `generarTicketPDF()` y `compartirTicketWhatsApp()` ahora usan `obtenerConfigImpresionConCache()` en lugar de llamar directamente al backend.
- **Fix adicional**: Se corrigió referencia a `SERVER_URL` (indefinida) → `API_URL` importada desde `../config`.

**Resultado**: Con internet → config + logo guardados en caché. Sin internet → se usa caché → ticket imprime normalmente con logo ✅.

---

### 2. Fix: Badge "Vendido" Persistente en ClienteSelector (sobrevive borrar caché)

**Archivos modificados**:
- `AP GUERRERO/components/Ventas/ClienteSelector.js`
- `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema**: El badge "Vendido" (✅ verde) que aparece en la lista de clientes del selector solo tomaba datos de `ventasDelDia` (lista local en memoria/AsyncStorage). Al limpiar el caché de la app, esa lista se vaciaba y los badges desaparecían, aunque las ventas sí estuvieran en el servidor.

**Solución implementada**:

En `VentasScreen.js`:
- Se agrega prop `fechaSeleccionada` al `<ClienteSelector>` para que tenga la fecha del turno activo.

En `ClienteSelector.js`:
- Nuevo estado `ventasBackend = []`
- Nueva función `cargarVentasBackend()` que consulta silenciosamente `/api/ventas-ruta/?vendedor_id=IDx&fecha=YYYY-MM-DD` al abrir el selector
- Si falla (offline) → silencioso, usa solo datos locales
- La lógica `yaVendido` ahora combina `ventasDelDia` (local) + `ventasBackend` (servidor):

```javascript
const todasLasVentas = [
    ...(Array.isArray(ventasDelDia) ? ventasDelDia : []),
    ...(Array.isArray(ventasBackend) ? ventasBackend.map(v => ({
        cliente_negocio: v.nombre_negocio || v.cliente_negocio || '',
        cliente_nombre: v.cliente_nombre || '',
        total: v.total
    })) : [])
];
ventaRealizada = todasLasVentas.find(venta =>
    (norm(venta.cliente_negocio) === norm(item.negocio)) ||
    (norm(venta.cliente_nombre) === norm(item.nombre))
);
const yaVendido = !!ventaRealizada;
```

**Endpoint usado**: `GET /api/ventas-ruta/?vendedor_id=IDx&fecha=YYYY-MM-DD`
(mismo que usa el historial de reimpresión — ya existía)

**Resultado por escenario**:

| Escenario | Badge "Vendido" |
|---|---|
| Turno activo con internet | ✅ Correcto (local + backend) |
| Turno activo sin internet | ✅ Correcto (solo local) |
| Después de borrar caché | ✅ Correcto (viene del backend) |
| Sin sesión / sin datos | ⚪ No aparece (esperado) |

**Fecha de implementación**: 19 de Febrero de 2026


---

## ✏️ Edición de Ventas y Sincronización de Stock (Febrero 2026)

### Resumen Ejecutivo

Se habilitó la capacidad de editar ventas ya realizadas tanto desde la App Móvil como desde el CRM Web. El sistema garantiza la integridad del inventario mediante un mecanismo transaccional de reversión y re-aplicación de stock en el backend.

### Componentes Actualizados

#### A. Backend (Django) - Transaccionalidad
**Archivo**: `api/models.py`
- Campo nuevo: `editada = models.BooleanField(default=False)` en `VentaRuta`.

**Archivo**: `api/views.py` (`VentaRutaViewSet.update`)
- **Lógica de Reversión**:
    1.  Recupera la venta original (`instancia_anterior`).
    2.  Resta las cantidades originales del `CargueIDx` correspondiente (reversión).
    3.  Aplica los cambios de la edición (nuevas cantidades).
    4.  Suma las nuevas cantidades al `CargueIDx`.
    5.  Marca `editada=True`.
- **Seguridad**: Bloque `try/except` envolviendo la actualización de stock para no bloquear la edición de la venta si falla el cálculo de inventario (aunque lo loguea).

#### B. Frontend App Móvil (React Native)
**Archivo**: `components/Ventas/VentasScreen.js`
- **Interfaz**: 
    - Botón **Editar (Lápiz Naranja)** ✏️ en historial.
    - Modal de edición con ajuste de cantidades en tiempo real.
    - Visualización de ventas editadas: Fondo rojo claro + Borde rojo + Badge "EDITADA".
- **Servicio**: `editarVentaRuta(id, datos)` consume `PATCH /api/ventas-ruta/{id}/`.
- **Estado Local**: Actualización optimista del historial y del total del día tras la edición exitosa.

#### C. Frontend CRM Web (React)
**Archivo**: `components/rutas/ReporteVentasRuta.jsx`
- **Visualización**:
    - Badge `EDITADA` (rojo) en la tabla de ventas junto al monto.
    - Alerta informativa en el modal de detalle de venta: "Atención: Esta venta fue editada...".
    - Título del modal refleja el estado de edición.

### Flujo de Datos en Edición
1. **Usuario (App/Web)**: Abre venta → Modifica cantidades → Guarda.
2. **API (`PATCH`)**: Recibe cambios.
3. **Backend**: 
    - `Stock Vendedor = Stock Actual - Cantidad Vieja + Cantidad Nueva`.
    - `Venta.editada = True`.
4. **App**: Recibe OK → Actualiza UI (Badge Editada) → Refresca Totales.

### Consideraciones
- **Ventas Locales**: Las ventas creadas offline (`local-ID`) se editan en memoria del dispositivo antes de sincronizarse.
- **Auditoría**: El campo `editada` permite rastrear qué ventas han sido modificadas post-facturación.

**Fecha de implementación**: 19 de Febrero de 2026

---

## 📴 Modo Offline y Recuperación Local de Turnos (Febrero 2026)

### Resumen del Problema Resuelto
Al abrir turno y posteriormente intentar retomarlo **sin conexión a internet** (saliendo de la pantalla de Ventas y volviendo a entrar), la App eliminaba la retención del turno porque el endpoint `TURNO_VERIFICAR` fallaba. Esto forzaba al usuario a seleccionar el día de nuevo.
Adicionalmente, se existía una disparidad por Zona Horaria al guardar las fechas localmente (`toISOString` convertía las tarde-noches a hora UTC del día siguiente), lo que generaba expiración prematura de los turnos en el modo *Offline*.

### Solución Implementada:

#### 1. Persistencia de Turno Offline (`AsyncStorage`)
**Archivo**: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se agregó respaldo local. En dos puntos críticos:
    - Tras **crear un turno nuevo**.
    - Tras **recibir una confirmación de turno activo** desde el endpoint `/api/turno/verificar/`.
- **Estructura Guardada (`@turno_activo_${userId}`)**: `dia`, `fecha` y `hora_apertura`.
- **Limpieza (`removeItem`)**: Se ejecuta obligatoriamente en `handleCerrarTurno` al terminar de procesar con éxito o si se recibe error `TURNO_YA_CERRADO`.

#### 2. Lógica de Recuperación (Fallback System)
- Si falla `verificarTurnoActivo` (las 3 veces, tras un backoff o timeout):
    - La App busca la llave `@turno_activo_${userId}` en `AsyncStorage`.
    - **Validación del tiempo**: Verifica que el `fecha` del turno guardado coincida con la fecha *local* actual (usando `getFullYear()`, `getMonth()` y `getDate()`).
    - Si pasaron las pruebas: Se levanta el modo "Venta" instantáneamente de forma silenciosa e informa al usuario con la alerta: `📴 Turno Restaurado Sin Conexión`.
    - Si el turno es anticuado (ej. otro día distinto), se descarta de la memoria local y se procede al flujo habitual de exigir "abrir turno nuevo offline".

#### 3. Prevención de Bloqueo por Existencia de Cargue
- Cuando no hay internet, no es posible saber si el usuario tiene asignado un Cargue en estado "DESPACHO" (Regla de negocio principal).
- **Excepción Implementada**: En el parseo de `cargarStockCargue`, si se detecta falla de red, retorna una bandera `offline: true`. Con esto, la lógica permite saltar el bloqueo de seguridad e iniciar una Venta Offline para no detener el ritmo del vendedor.

**Fecha de implementación**: 19 de Febrero de 2026

---

## 🚫 Anulación de Ventas y Prioridad Backend (20 Feb 2026)

### Resumen del Problema Resuelto
Se requería la capacidad de anular (cancelar) ventas ya realizadas, para devolver los productos al inventario del vendedor y evitar que sumen a los totales financieros. Además, surgió un problema de "doble fuente de verdad" (Local vs Servidor) que impedía ocultar las insignias de "Ya vendido" en la aplicación móvil cuando una venta se anulaba.

### Solución Implementada:

#### 1. Backend (Django) - Transaccionalidad al Anular
**Archivo**: `api/views.py` (`VentaRutaViewSet.anular`)
- **Endpoint Nuevo**: `POST /api/ventas-ruta/{id}/anular/`.
- **Lógica de Anulación**:
    1. Verifica que la venta no esté ya anulada.
    2. Itera sobre los `detalles` de la factura y RESTA (devuelve) las cantidades al campo `vendidas` en el modelo `CargueIDx` correspondiente al vendedor y fecha de la venta.
    3. Marca la venta con `estado = 'ANULADA'`.

#### 2. Frontend CRM Web (React) - Filtrado Financiero
**Archivo**: `ReporteVentasRuta.jsx`
- **Filtro de Recepción**: Cuando el backend envía el array de ventas del día (`rutasService.obtenerVentasRuta`), el Dashboard intercepta y descarta inmediatamente las que tienen `estado === 'ANULADA'` usando `filter(v => v.estado !== 'ANULADA')`.
- Con este filtro temprano, las ventas anuladas mágicamente desaparecen del total recaudado (estadísticas en la parte superior) y de la tabla principal.
- Se agregó el botón auxiliar **"🚫 Anuladas"** que abre un modal con un fetch dedicado (`GET /api/ventas-ruta/?estado=ANULADA`) para listar exclusivamente las ventas rotas.

#### 3. Frontend App Móvil (React Native) - Resolución de Prioridades
**Problema**: El modo offline (AsyncStorage local) guardaba la venta original como "ACTIVA" de forma permanente, por lo que incluso después de descargar el estado real del servidor, el badge de "Ya Vendido" prevalecía en el cliente.
**Archivos**: `VentasScreen.js` y `ClienteSelector.js`.
- **La Regla de la Máxima Autoridad**: Se reestructuró la lógica para calcular la variable `yaVendidoHoy` y `ventaRealizada`.
- **Paso 1**: Aislar todas las ventas detectadas como "ANULADA" por el servidor (`ventasBackendDia`).
- **Paso 2**: Modificar las comprobaciones locales (`ventasDelDia.some(...)`) para **ignorar sistemáticamente** cualquier venta local si ese mismo cliente figura en la "lista negra" de anulados provista por el backend (`!anuladoEnBackend`).
- Tras una anulación exitosa, ahora se actualizan **3 estados simultáneamente** en memoria para UI instantánea sin recarga:
  1. `historialReimpresion` (Para tachar el precio y poner badge rojo en el historial).
  2. `ventasDelDia` (Para ocultar el badge en la selección de cliente en la pantalla principal).
  3. `ventasBackendDia` (Para ocultar el badge grande de cabecera que usa el modal superior).

---

## 🚀 Refinamientos de UX y Sincronización en Ventas (20 Feb 2026)

### Resumen de Mejoras
Se aplicó una ronda de pulido para resolver conflictos de usabilidad en la App Móvil (alertas solapadas, rebotes de teclado) y mejorar las interfaces de auditoría y recaudo en el CRM Web. Además, se fortaleció la respuesta en tiempo real del inventario frente a anulaciones y ediciones.

### 1. App Móvil (`VentasScreen.js`)
- **Fix Alertas Solapadas**: Se reestructuró la lógica post-venta (`confirmarVenta`). El avance al siguiente cliente y la alerta de "Ruta Completada" ahora solo se disparan **después** de que el usuario interactúe exitosamente con el modal (Imprimir, WhatsApp o Correo mediante callbacks `onSuccessCallback`), evitando colisiones visuales.
- **Auto-Ajuste de Stock y Recaudo al Instante**:
  - Al **Anular** una venta: La App lee los ítems cancelados y los devuelve inmediatamente al estado `stockCargue`, también descuenta el monto de los contadores visuales ("Dinero Hoy").
  - Al **Editar** una venta: Extrae la diferencia ("Nuevo Valor" - "Viejo Valor") para ajustar el recaudo diario. Devuelve al inventario los productos de la venta original y descuenta los de la nueva lista, sin requerir pull-to-refresh.
- **Fix de Teclado y Inputs (Modal de Edición)**:
  - Se configuró el `KeyboardAvoidingView` con behavior `padding` y contenedores con `flexShrink: 1` para que las ventanas de edición no se auto-corten o aplasten a la mitad al chocar contra el teclado virtual en Android/iOS.
  - Los campos numéricos de cantidad ahora implementan `selectTextOnFocus={true}`, lo que resalta y auto-selecciona el valor actual al toparlos, permitiendo escribir encima instantáneamente sin tener que borrar manualmente el número viejo en la App Móvil.

### 2. CRM Web (`ReporteVentasRuta.jsx`)
- **Visor de Anulaciones**: Se implementó una columna de "Acciones" (Ícono ojo 👁️) en la tabla de Ventas Anuladas. Esto permite abrir el ticket de la venta caída y leer todos sus productos fallidos para futura auditoría.
- **Protección de Impresión**: Se ocultó condicionalmente el botón *"Imprimir Ticket"* dentro de los modales de detalle si el sistema detecta que la prop `estado` equivale a `ANULADA`.
- **Nuevo Dashboard UI**: Se rediseñó la cabecera del visor de KPI. Se reemplazaron tarjetas independientes por un panel flexbox ultra-moderno con un "Total Recaudo General" (suma combinada de Ventas App + Entregas de Pedidos Reales) junto a desgloses visuales independientes en el lateral derecho con barras de progreso.

---

**🚀 Recuerda**: Este contexto es tu fuente de verdad sobre el proyecto. Úsalo para tomar decisiones informadas y mantener la consistencia.

---

## 🛡️ Prevención Asistida de Pedidos Duplicados (21 Feb 2026)

### Resumen del Problema Resuelto
Al crear un pedido desde el CRM Web (`PaymentModal.jsx`), si el internet del operador fluctuaba o este cliqueaba múltiples veces seguidas (o simplemente olvidaba que ya había tomado la orden), el sistema pasaba el guardado de largo creando pedidos idénticos para el mismo cliente el mismo día. Esto corrompía las cuentas del Cargue.

### Solución Implementada:
- **Validación Ágil Pre-Guardado**: Se añadió una consulta silenciosa en `handleSubmit` a `GET /api/pedidos/?fecha_entrega=YYYY-MM-DD`.
- **Filtro de Detección**: El frontend escanea el payload y si detecta un pedido con el mismo `destinatario` (normalizado en minúsculas) y estado diferente a `ANULADA`, detiene la ejecución.
- **Modal de Confirmación Amigable**: En lugar de bloquear agresivamente al usuario (ya que pueden haber clientes genuinos que piden 4 veces al día), el sistema despliega un soft-warning amarillo indicando *"El cliente X ya tiene un pedido programado. ¿Deseas continuar?"*.
- **Acciones Clave UX**:
  1. **Cancelar**: Limpia por completo el carrito de compras (`clearCart()`) y resetea el formulario (`handleCloseAndReset`), cerrando el modal para dejar la sesión limpia para el siguiente cliente real.
  2. **Continuar**: Si la intención es genuina, al pulsar continuar, se agregó un `setTimeout` de 50ms antes de ejecutar `executeCreation()`. Esto fuerza un Repaint del DOM de React, esfumando el modal amarillo visualmente *antes* de que el navegador se congele llamando a la ventana pesada de la impresora.

---

## ⚖️ Estabilización UI en Módulo de Cargue (21 Feb 2026)

### Resumen
Durante un intento de forzar un hard-reload constante desde la Base de Datos para mantener las devoluciones actualizadas, se provocó que la PlantillaOperativa tuviera bajones de rendimiento y "parpadeos" agresivos en pantalla (rebotes contables visuales). Además, se habían alterado erróneamente las matemáticas de `ResumenVentas.jsx` asumiendo que los "Pedidos" causaban dobles cobros.

### Solución Implementada (Rollback al Golden State):
- **Cálculo Financiero**: Se revirtieron por completo las alteraciones a la Venta Bruta (`ventaVal`). Se volvió a garantizar que el cálculo original de `Base Caja + Total Despacho + Total Pedidos` prevalece exacto.
- **Polling Suave Preservado**: Se eliminó la inyección forzada de recargas limpias en el useEffect de Polling para IDs en estado COMPLETADO.
- **Flujo Actual Confirmado**: 
  1. Al pestañear hacia otro Vendedor (ej ID2), el sistema lee inmediatamente del Caché (LocalStorage) (0ms de latencia, lectura limpia).
  2. Una fracción de segundo después, el Polling Inteligente le pregunta al backend si existen nuevos datos o devoluciones.
  3. De haber algo nuevo, se sobreescribe sutilmente en pantalla preservando todo el UX. La "fuente de la verdad fina" recae siempre en el backend.

---

## 📸 Mejoras en Gestión de Vencidas (Febrero 2026)

Se implementó una reingeniería en la captura y visualización de productos vencidos para mejorar la experiencia de usuario y la calidad de la evidencia fotográfica.

### 1. App Móvil (React Native - DevolucionesVencidas.js)

**Optimización de Interfaz y Espacio:**
- **Keyboard-Blocking Fix**: Se movió el `KeyboardAvoidingView` a nivel global del modal con behavior `height` (Android) / `padding` (iOS).
- **Header y Footer Dinámicos**: La sección de **Resumen de Productos** se movió al `ListHeaderComponent` y el **Panel de Evidencia** al `ListFooterComponent` del `FlatList`. Esto permite que el contenido fijo se desplace con el scroll, liberando espacio para ver al menos 3-4 productos simultáneamente cuando el teclado está activo.
- **Auto-Cierre**: El modal se cierra automáticamente al finalizar la captura ("Registrar Vencidas"), reduciendo pasos para el vendedor.

**Flujo de Evidencia:**
- **Captura Forzada**: Si el usuario intenta registrar vencidas sin fotos, el sistema activa automáticamente la cámara para garantizar que siempre exista evidencia.
- **Sincronización Base64**: En el `modoSoloRegistro`, las fotos se convierten a Base64 y se envían en el JSON de la venta para asegurar compatibilidad en redes inestables.

### 2. Dashboard Web (React - ReporteVentasRuta.jsx)

**Visualización Premium:**
- **Eliminación de Columnas Redundantes**: Se quitó la columna de "Evidencias" de la tabla de productos (donde antes salía "No especificado") para simplificar la vista.
- **Galería de Evidencia**: Implementación de una sección de **Evidencia Fotográfica** debajo de la tabla.
- **Estilo Cuadrado (200x200px)**: La foto se muestra en un cuadro perfecto con bordes redondeados, sombra profunda y un marco blanco estilo "Polaroid" para resaltar sobre el fondo.
- **Zoom**: Al hacer clic en la foto, se abre en tamaño original en una nueva pestaña.

**Tickets Físicos:**
- **Trazabilidad Impresa**: El ticket de venta (`imprimirTicket`) ahora incluye una sección roja de **PRODUCTOS VENCIDOS** con el detalle de items y cantidades recolectadas.

### 3. Backend (Django - views.py)

**Procesamiento de Imágenes:**
- **Base64 to ImageField**: El ViewSet de `VentaRuta` ahora detecta si `foto_vencidos` viene como un objeto Base64, lo decodifica y lo guarda directamente como un archivo físico en el sistema de archivos de Django, permitiendo su visualización vía URL estándar.

### 4. Optimizaciones de Rendimiento y Estabilidad (Febrero 2026)

**Frontend (VentasScreen.js):**
- **Memoización Crítica**: Implementación de `useMemo` para `productosFiltrados` y cálculo de totales (`subtotal`, `total`), evitando recalculaciones costosas en cada pulsación del teclado o cambio de cantidad.
- **Estabilidad de la Interfaz**: Uso de `useRef` (`buscadorRef`) y `useState` (`inputBuscadorEnFoco`) para mantener el foco en la barra de búsqueda al limpiarla (botón "X"). Esto evita que el teclado se oculte y aparezca de nuevo ("brincos" visuales).
- **Gestión Inteligente de Pantalla**: El indicador de "Turno Abierto" se oculta automáticamente cuando el teclado está abierto o el buscador tiene el foco, liberando espacio vertical y eliminando saltos de diseño.
- **Optimización de FlatList**: Configuración de `initialNumToRender`, `maxToRenderPerBatch`, `windowSize` y `removeClippedSubviews` para un scroll fluido y una búsqueda instantánea en catálogos grandes.
- **Callback Stability**: Uso de `useCallback` en funciones clave (`actualizarCantidad`, `getPrecioProducto`, `renderProducto`) para evitar renders innecesarios en componentes hijos (botones y items de lista).

**Sincronización y Persistencia (Bug Fixes):**
- **Persistence Guarantee**: Se corrigió el guardado de vencidas y fotos en la cola offline. Ahora las fotos se convierten a Base64 *antes* de guardarse en `AsyncStorage`, asegurando que no se pierdan si la app se cierra o el archivo local temporal es purgado por el sistema operativo.
- **Vencidas en Pedidos**: Se habilitó la sincronización de productos vencidos y sus fotos para entregas de pedidos asignados (modo "P"). Anteriormente, estas se perdían porque el endpoint de pedidos no las procesaba.
- **Backend Sync**: Se actualizó el modelo `Pedido` y su Serializer para procesar y guardar `productos_vencidos` y `foto_vencidos`, actualizando automáticamente el stock en los modelos `CargueIDx` correspondientes.

**Última actualización**: 22 de Febrero de 2026 (22:45)

---

## 📱 Optimización UI y Performance - VentasScreen (Febrero 2026)

### Resumen de Mejoras
Se realizó una optimización profunda en la pantalla de ventas (`VentasScreen.js`) centrada en la estabilidad visual y la velocidad de respuesta del catálogo de productos.

### 1. Estabilidad de Interfaz (UX)
- **Reversión a Cabeceras Fijas**: Se restauró el diseño de cabeceras fijas superiores (Turno, Cliente, Buscador) con la lista de productos deslizándose por debajo. Esto proporciona una referencia visual constante para el vendedor.
- **Visibilidad Inteligente del Turno**: Para maximizar el área de trabajo, la barra de "Turno Abierto" se oculta automáticamente cuando:
    - El teclado está abierto.
    - El buscador tiene el foco (`onFocus`).
- **Eliminación de "Saltos" Visuales**: 
    - Se implementó un `useRef` (`buscadorRef`) para controlar el foco del input.
    - Al presionar el botón **"X"** para limpiar la búsqueda, el sistema fuerza el mantenimiento del foco. Esto evita que el teclado se cierre y se vuelva a abrir (flicker), manteniendo el diseño estable durante la filtración de múltiples productos.

### 2. Optimización de Performance ("Turbo Mode")
Se aplicaron técnicas avanzadas de React para asegurar que el buscador sea instantáneo incluso con cientos de productos.

- **Memorización de Datos (`useMemo`)**:
    - `productosFiltrados`: Solo se recalcula al cambiar el texto de búsqueda o los productos base.
    - `subtotal` y `total`: Se memorizaron los cálculos de totales para evitar iteraciones costosas sobre el catálogo en cada pulsación de tecla.
- **Memorización de Funciones (`useCallback`)**:
    - `renderProducto`: Evita que `FlatList` re-renderice todos los items innecesariamente.
    - `actualizarCantidad` y `getPrecioProducto`: Optimizan la respuesta de los controles de cantidad.
- **Ajustes de FlatList**:
    - `initialNumToRender={10}`
    - `maxToRenderPerBatch={10}`
    - `windowSize={5}`
    - `removeClippedSubviews`: Activado en Android para liberar memoria de items fuera de pantalla.

### 3. Lógica de Precios
- **Precios Dinámicos**: Se refinó `getPrecioProducto` para priorizar precios personalizados y listas de clientes, optimizando el tiempo de búsqueda (`find`) para que no afecte el scroll de la lista.

**Última actualización**: 23 de Febrero de 2026 (00:00)
### 3. Funcionalidad de "Peeking" y Modo Ultra Compacto (Febrero 2026)

Se implementó un sistema avanzado de gestión de espacio para evitar que el teclado desplace el encabezado del cliente fuera de la vista y maximizar el área de productos.

- **Visualización por Demanda (Peeking)**:
    - **Comportamiento Estándar**: Cuando hay un cliente seleccionado, la barra de "Turno" se oculta automáticamente para ganar espacio.
    - **Manija Gris (Handle)**: En su lugar, aparece una pequeña "manija" gris discreta en la parte superior. Al tocarla o tocar el encabezado del cliente, el Turno se desliza (Peek) para permitir acceso a funciones como Reimpresión o Historial.
    - **Auto-Cierre**: El modo "Peek" se cierra automáticamente al esconder el teclado, quitar el foco del buscador o presionar el botón de cerrar (X roja) en la barra de turno.
- **Modo Ultra Compacto con Teclado**:
    - Al abrir el teclado o enfocar el buscador, el sistema entra en un modo de ahorro extremo:
        - Se ocultan los **Botones de Acciones** (Entregar, Vencidas, Cerrar).
        - Desaparece el **Banner de Conectividad**.
        - El **Encabezado del Cliente** reduce sus paddings internos significativamente.
    - **Resultado**: El nombre del cliente y el buscador se mantienen **estáticos y visibles** en la parte superior, mientras que la lista de productos se ajusta dinámicamente al espacio restante, eliminando los "brincos" o desplazamientos hacia arriba que sacaban al cliente de pantalla.

### 4. Optimizaciones Visuales de la Tarjeta del Cliente
- **Badge de "Vendido"**: Se implementó una etiqueta (badge) clara en la esquina superior derecha de la tarjeta con el texto "VENDIDO" (con fondo verde `#00ad53`) para indicar visualmente que el cliente actual ya cuenta con un registro de venta en el día, previniendo dobles ingresos accidentales y unificando el estilo visual con `ClienteSelector.js`.
- **Botón "Saltar Cliente" (⏭️)**: Se añadió un control de flujo rápido tipo flecha (`play-skip-forward`) al costado derecho del nombre del cliente en el encabezado. Permite limpiar el carrito en uso y avanzar inmediatamente al siguiente cliente en la lista ordenada de la ruta, acelerando drásticamente el flujo de trabajo en clientes que no requieren ventas.
- **Teclado Constante sobre Lista (Anti-Empuje)**: Se eliminaron los saltos visuales drásticos que empujaban y ocultaban la Card del Cliente y los botones principales al abrir el teclado en los últimos productos. Tras evaluar comportamientos dinámicos que causaban destellos, se optó por inyectar un "colchón de aire" permanente y estático (`paddingBottom: 250` en `listaContent`). Este espaciado extra "engaña" la lógica nativa de empuje de Android (`"softwareKeyboardLayoutMode": "pan"`, mantenido así para no afectar pantallas globales como el Login), garantizando que la tarjeta de cabecera jamás sea desplazada hacia arriba al tocar el último producto, asumiendo como un trade-off consciente el espacio en blanco extra al final del scroll.

- **Filtro Global de Productos No Vendibles**: Se modificó la base de `ventasService.js` (`obtenerProductos` y `buscarProductos`) para excluir permanentemente y en toda la app cualquier producto que contenga las palabras "CANASTILLA" o "BOLSA", garantizando que elementos internos no salgan a la venta al público.

### 5. Blindaje de Seguridad y Control de Dispositivos (Mobile Session Control)

Se implementó un sistema de seguridad robusto para proteger las operaciones críticas y centralizar el control de los equipos en campo.

- **Sistema de Tokens de Sesión Móvil**: 
    - Implementación de `VendedorSesionToken` en el backend.
    - El Login de la APK ahora emite un token único tipo **Bearer** (válido por 30 días).
    - **Protección de Endpoints**: Operaciones de ventas, turnos, pedidos y anulación ahora requieren el token. El servidor toma la identidad del vendedor directamente del token, impidiendo manipulaciones de identidad desde el cliente.
- **Módulo Administrativo de Sesiones (CRM Web)**:
    - Se integró un nuevo panel en **Herramientas de Sistema** que permite monitorear en tiempo real:
        - Qué vendedores están conectados.
        - Identificador de dispositivo (HWID).
        - Fecha y hora del último uso.
    - **Expulsión Remota**: Capacidad de "matar" una sesión directamente desde el panel web. Si un celular se extravía o se detecta anomalía, el administrador puede cerrar la sesión de forma remota, forzando a la APK a salir al login.
- **Ajustes de Interfaz en Modales (Estabilidad Android)**:
    - **Modal Vencidas**: Se corrigió un error visual donde el modal no cubría el 100% de la pantalla en Android al abrir el teclado, dejando ver botones de la pantalla inferior ("REGISTRAR VENCIDAS"). Se eliminó el `behavior="height"` en `KeyboardAvoidingView` para este componente, garantizando un fondo sólido y eliminando colisiones de clics entre capas.

**Fecha de implementación**: 23 de Febrero de 2026

**Última actualización global**: 23 de Febrero de 2026 (11:35 AM)

---

**🚀 Recuerda**: Este contexto es tu fuente de verdad sobre el proyecto. Úsalo para tomar decisiones informadas y mantener la consistencia.

---

## 🧭 Orden de Ruta por Vendedor + Día (24 Feb 2026)

### Problema
El orden que el vendedor movía con flechas en la App podía perderse o verse distinto en recargas/panel, porque coexistían fuentes de orden por ruta.

### Solución Implementada
- **Nueva persistencia global por vendedor+día**:
  - Modelo: `RutaOrdenVendedor`
  - Archivos: `api/models.py`, `api/migrations/0094_rutaordenvendedor.py`
- **Guardado unificado desde App**:
  - Endpoint: `POST /api/ruta-orden/guardar_orden_vendedor/`
  - Archivo: `api/views.py` (`RutaOrdenViewSet.guardar_orden_vendedor`)
  - Ahora guarda:
    1. Orden global exacto del día por vendedor (`RutaOrdenVendedor`).
    2. Orden por ruta (`RutaOrden`) para compatibilidad con panel web.
- **Lectura prioritaria del orden global**:
  - Endpoint: `GET /api/clientes-ruta/?vendedor_id=...&dia=...`
  - Archivo: `api/views.py` (`ClienteRutaViewSet.get_queryset`)
  - Prioriza `RutaOrdenVendedor`; si no existe, usa fallback por ruta.

### Resultado Esperado
- Cada vendedor mantiene orden independiente por día:
  - Lunes con un orden.
  - Miércoles con otro orden.
  - Sin mezclar entre días ni entre IDs.
- Comportamiento automático por día:
  - Al abrir `Seleccionar Cliente`, la app carga automáticamente el orden del día activo.
  - Si aparecen clientes nuevos del día, se agregan al final sin romper el orden guardado.
  - El vendedor puede reordenar de nuevo y ese día queda actualizado con el último guardado.

### Nota de despliegue backend
- Requiere migración:
  - `python3 manage.py migrate`

### UX/Performance en Selector de Cliente (App Móvil)
- Archivo: `AP GUERRERO/components/Ventas/ClienteSelector.js`
- Mejoras aplicadas:
  - Anti-rebote visual de orden: al mover clientes, el nuevo orden se guarda inmediatamente en `AsyncStorage` (cache del día), evitando ver un orden viejo antes de refrescar.
  - Apertura más rápida del modal:
    - optimización de índices (`Map`) para evitar búsquedas O(n) por card,
    - pre-indexado de ventas/pedidos por cliente,
    - ajuste de `FlatList` (`initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, `getItemLayout`, `removeClippedSubviews`).
  - Animación del modal en modo rápido (`animationType="none"`) para reducir latencia percibida.
- Compatibilidad offline:
  - Todo lo anterior funciona sin internet.
  - El orden queda local y se mantiene al salir/entrar al selector.

---

## 📊 Cargue - Resumen Informativo Vencidas FVTO (24 Feb 2026)

### Objetivo
Mostrar en el panel derecho de Cargue un total informativo de vencidas clasificadas como `FVTO`, con detalle visual por producto.

### Implementación
- Archivo: `frontend/src/components/Cargue/ResumenVentas.jsx`
- Nueva fila debajo de `TOTAL EFECTIVO`:
  - `VENCIDAS FVTO`
  - Ícono ojo para abrir modal de detalle.
- Modal incluye:
  - Producto
  - Cantidad FVTO
  - Valor unitario
  - Subtotal
  - Total general

### Regla de cálculo FVTO
- Si un producto tiene **solo motivos FVTO** en lotes:
  - `FVTO = vencidas reportadas`.
- Si tiene **mezcla de motivos** (`FVTO + HONGO/SELLADO/...`):
  - `FVTO = número de lotes FVTO` (con tope en `vencidas`).

### Independencia por ID
- El cálculo usa los `productos` del `idSheet` activo.
- ID1..ID6 se mantienen separados.
- No crea tablas nuevas; usa datos ya persistidos (`vencidas`, `lotes_vencidos`).

---

## ⚠️ Validación de Cierre por Clasificación Incompleta de Vencidas (24 Feb 2026)

### Riesgo cubierto
Evitar que el vendedor olvide registrar motivos no-FVTO (ej. HONGO/SELLADO) cuando hay varias vencidas.

### Implementación
- Archivo: `frontend/src/components/Cargue/BotonLimpiar.jsx`
- En validación de cierre (`validarLotesVencidos`):
  - Si `vencidas > 0`, hay solo lotes `FVTO`, y `lotes FVTO < vencidas`,
  - se muestra confirmación explícita antes de finalizar.

### Comportamiento
- Si el usuario **confirma**:
  - continúa cierre, asumiendo todas esas vencidas como FVTO.
- Si el usuario **cancela**:
  - se bloquea el cierre para completar la clasificación faltante.

---

## ✅ Cargue - Fix de Rebote en Totales al Cambiar de ID (24 Feb 2026)

### Síntoma reportado
Al cambiar entre pestañas de vendedor (ID1..ID6), la tabla y el panel de totales mostraban por un instante valores sin ajuste (antes de devoluciones/vencidas), y luego se corregían.

### Causa técnica
- En carga inicial desde BD se estaban pintando `total/neto` “crudos”.
- Después un recálculo en React corregía los valores, generando salto visual.

### Implementación aplicada
- Archivo: `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- Se normalizan `total/neto` con `recalcularTotales(...)` **antes** de hacer `setProductosOperativos(...)` en flujo de carga desde BD.
- El cálculo de `totalNeto` del resumen se toma desde los productos ya normalizados.
- Se robusteció lectura numérica de `total` para evitar coerciones inestables.

### Garantía funcional
- **No cambió la fórmula de negocio**:
  - `total = cantidad - dctos + adicional - devoluciones - vencidas`
  - `neto = total * valor`
- **Sin cambios en backend, endpoints ni base de datos**.
- Impacto: solo estabilidad visual y consistencia del primer render.

---

## 📦 App Móvil - Filtro por Módulo en Productos (24 Feb 2026)

### Problema detectado
Productos como `CANASTILLA`/`BOLSA` dejaron de aparecer en módulos donde sí estaban habilitados (ej. Cargue), porque se filtraban globalmente por nombre.

### Ajuste aplicado
- Archivo: `AP GUERRERO/services/ventasService.js`
- `obtenerProductos()` dejó de excluir productos por nombre.
- Ahora devuelve el catálogo en memoria y cada pantalla aplica su propio filtro por flags (`disponible_app_*`).

### Seguridad funcional
- No cambia backend ni estructura de datos.
- Se respeta la configuración del módulo desde **Productos**:
  - `disponible_app_cargue`
  - `disponible_app_ventas`
  - `disponible_app_sugeridos`
  - `disponible_app_rendimiento`

### Ajuste complementario en Ventas
- Archivo: `AP GUERRERO/components/Ventas/DevolucionesVencidas.js`
- Se fuerza filtro por `disponible_app_ventas !== false` para que el modal de vencidas solo muestre productos permitidos en Ventas.

---

## 🎯 App Móvil - Modal "Nuevo Cliente" más compacto (24 Feb 2026)

### Objetivo
Ganar espacio vertical al crear cliente para visualizar más inputs sin desplazar lógica.

### Ajustes visuales
- Archivo: `AP GUERRERO/components/Ventas/ClienteModal.js`
- Header más compacto (menor `paddingTop`/`paddingBottom`).
- Título reducido (`fontSize`).
- Formulario y espaciados internos reducidos (`scrollContent`, `formulario`, `campo`).

### Alcance
- Solo UI/UX.
- Sin cambios en validaciones, guardado local/offline ni sincronización con backend.

---

## 🔄 Ventas Ruta - Animación en botón Recargar (24 Feb 2026)

### Objetivo
Mejorar feedback visual cuando el usuario recarga datos en `Ventas Ruta`.

### Implementación
- Archivo: `frontend/src/components/rutas/ReporteVentasRuta.jsx`
  - Botón `Recargar` principal:
    - se deshabilita durante `loading`
    - el ícono `bi-arrow-clockwise` aplica clase de giro mientras carga.
  - Botón `Recargar` del modal `Anuladas`:
    - se deshabilita durante `loadingAnuladas`
    - el ícono también gira durante la carga.
- Archivo: `frontend/src/components/rutas/ReporteVentasRuta.css`
  - Se agregó `.reload-icon-spin` + `@keyframes reload-icon-rotate`.

### Alcance
- Solo cambio visual/UI.
- No cambia consultas, filtros ni cálculos del módulo.

---

## 🛡️ Fix Runtime en Clientes - `Unexpected token '<'` (24 Feb 2026)

### Síntoma
En `/#/clientes` aparecía overlay rojo con:
- `Unexpected token '<'`
- `SyntaxError: Unexpected token '<'`

### Causa probable
`ChatIA` leía valores de `localStorage` con `JSON.parse(...)` sin tolerancia a datos corruptos/no JSON (por ejemplo HTML o texto inválido).

### Implementación
- Archivo: `frontend/src/components/ChatIA/ChatIA.jsx`
  - Se agregó helper `safeParseJSON(rawValue, fallback)`.
  - Lectura segura de:
    - `chat_history_v1`
    - `chat_theme_preference`
  - Si falla parseo, usa fallback y evita romper render.

### Alcance
- Solo robustez frontend.
- Sin cambios en backend/API.

---

## 💳 Reimpresión - Edición de Método de Pago en Venta Ruta (25 Feb 2026)

### Objetivo
Permitir que, desde el historial de reimpresión en App, el vendedor pueda cambiar el método de pago de una venta de ruta ya registrada sin crear una nueva factura.

### App móvil (`AP GUERRERO`)
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
  - En modal `Editar Venta` se agregó selector de pago:
    - `EFECTIVO`
    - `NEQUI`
    - `DAVIPLATA`
  - El modal carga por defecto el `metodo_pago` actual de la venta.
  - Al guardar edición, se envía también `metodo_pago` al endpoint de edición.
  - Se actualiza en estado local:
    - `ventasDelDia`
    - `historialReimpresion`
    - `AsyncStorage('ventas')`
  - Si la venta estaba en cola offline, también se sincroniza:
    - `AsyncStorage('ventas_pendientes_sync')`
  - Se agregó bloque `Agregar Producto` en el mismo modal de edición:
    - buscador por nombre
    - botón `Agregar` por cada coincidencia
    - al agregar, incrementa cantidad en el carrito de edición con el precio activo del producto
  - Continúa soportando edición de cantidades `+ / -` y eliminación con cantidad `0` dentro de la misma factura editada.

### Backend (`crm-fabrica`)
- Archivo: `api/views.py` (`VentaRutaViewSet.editar`)
  - Se extendió el endpoint actual `PATCH /api/ventas-ruta/{id}/editar/` para aceptar `metodo_pago` opcional.
  - Compatibilidad:
    - Si llega `detalles`, mantiene la lógica actual de ajuste de `vendidas` en Cargue.
    - Si llega solo `metodo_pago`, actualiza pago sin requerir cambios de detalle.
  - Validación de método de pago: `EFECTIVO`, `NEQUI`, `DAVIPLATA`, `TARJETA`, `TRANSFERENCIA`.

### Alcance y seguridad
- No se creó endpoint nuevo.
- No se hicieron migraciones.
- No se cambió el flujo de pedidos (`PEDIDO_FACTURADO`), solo ventas de ruta (`VENTA_RUTA`).

---

## Operacion Produccion - Transicion APK Legacy/Nueva (27 Feb 2026)

### Estado observado en VPS (fecha de incidente: 26 Feb 2026)
- `POST /api/ventas-ruta/` con multiples respuestas `400` para equipo `ID5`.
- `SyncLog` con reintentos `CREATE_VENTA` sobre los mismos `id_local`.
- Error recurrente: `foto_vencidos` invalido como archivo en ciertos reintentos offline.
- Efecto funcional:
  - ventas quedan en `ventas_pendientes_sync`,
  - barra naranja persiste en app,
  - diferencia entre total de Cargue y total de Ventas Ruta en web.

### Estado de migraciones en produccion al 27/02/2026
- `showmigrations api` en VPS llega hasta `0089_add_nota_to_cargueresumen`.
- Migraciones `0090` a `0094` existen en repo local, pero aun no aplicadas en produccion.

### Estrategia acordada (2 fases)
1. **Fase transitoria inmediata (operacion diaria):**
   - aplicar hotfix backend compatible con APK legacy para no rechazar ventas por `foto_vencidos` mal serializado,
   - mantener sincronizacion de ventas y trazabilidad de `productos_vencidos`,
   - sin forzar aun el corte completo de seguridad para APK antiguas.
2. **Fase final nocturna (cuando todos tengan APK nueva Expo):**
   - desplegar backend pendiente completo + migraciones `0090-0094`,
   - aplicar reglas de token/sesion de forma definitiva,
   - ejecutar pruebas de humo en app y web.

### Condicion para ejecutar migraciones 0090-0094
- Confirmacion operativa de que todos los vendedores ya usan APK nueva.
- Si quedan equipos con APK antigua, se pospone el corte final para evitar fallos de autenticacion en ventas/pedidos/sugeridos.

### Ejecucion en produccion (madrugada 27/02/2026)
- Se descarto despliegue de un commit amplio por riesgo de mezclar cambios no relacionados.
- Se aplico flujo seguro:
  - `revert` del commit amplio en remoto,
  - despliegue de hotfix minimo `9bb23ce`.
- Hotfix aplicado en backend (`api/views.py`):
  - tolera payload legacy de `foto_vencidos` en reintentos offline,
  - evita bloquear `POST /api/ventas-ruta/` por validacion de archivo invalido.
- Resultado reportado en campo:
  - ventas offline sincronizaron al volver internet (prueba manual de 5 ventas),
  - disminuye riesgo de pendientes pegadas en barra naranja para caso ID5.
- Migraciones `0090-0094` siguen pendientes para ventana nocturna cuando toda la fuerza comercial este en APK nueva.

**Última actualización global**: 27 de Febrero de 2026
