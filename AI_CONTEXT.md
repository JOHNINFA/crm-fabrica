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

#### Arquitectura No-Bloqueante y Sincronización Resiliente (Final Marzo 2026)
- **Timeouts Optimizados (30s-45s)**: Se redujeron los timeouts de 60s a **30 segundos** para JSON y **45 segundos** para fotos. Esto permite un "Fallo Rápido" (Fast-Fail): si la red es muy mala, el sistema no bloquea al usuario y pasa la tarea inmediatamente a la cola de sincronización de fondo.
- **Estrategia "Danza del Vendedor" (Race 6s)**: Implementada en **todas** las operaciones críticas que interactúan con el backend:
    - **Entregas de Pedidos**: Al entregar un pedido, se espera máximo 6s. Si el servidor no responde, la UI se libera, el pedido se marca como "Entregado" localmente y la sincronización real ocurre en segundo plano.
    - **Anulaciones de Venta**: Mismo comportamiento; la anulación es instantánea para el vendedor, mientras que el aviso al servidor se garantiza mediante la cola de pendientes.
    - **Ediciones de Venta**: El modal se cierra al instante, permitiendo continuar la ruta sin esperar al backend.
- **Motor de Sincronización Unificado (Sync Loop)**:
    - Se expandió `sincronizarVentasPendientes` en `ventasService.js` para ser el cerebro central de la app. Ahora detecta automáticamente si el elemento en cola es un **Pedido**, una **Edición** o una **Venta Nueva**, llamando al endpoint correcto de forma asíncrona.
    - Soporte para **Vencidas con Fotos**: Las imágenes base64 se persisten en la cola local, asegurando que no se pierdan si la app se cierra o reinicia antes de sincronizar.
- **Manejo de Conflictos y Duplicados**:
    - **Verificación de Duplicados**: Antes de reintentar un POST, el sistema consulta silenciosamente al backend (con timeout de 12s) para ver si la venta ya existe, evitando duplicar registros por timeouts de red previos.
    - **Bridge de Errores**: Uso de `window.__ultimoErrorEdicion` para que el motor de sincronización entienda códigos de error específicos (ej: `VENTA_YA_MODIFICADA`) y sepa cuándo limpiar la cola automáticamente sin reportar error al usuario.
- **Refresco de Stock y Badges**: Tras cualquier operación (incluso en background), se disparan refrescos de estado locales (`refrescarStockSilencioso`) para que los indicadores de "VENDIDO" o "ENTREGADO" en la lista de clientes sean siempre precisos.

#### Optimización de Timeouts para Conexión Intermitente (Marzo 2026)
- **Problema detectado**: Con conexión intermitente, los timeouts largos (25-30s) causaban que el usuario esperara mucho tiempo sin feedback claro, y el botón "CONFIRMAR PEDIDO" quedaba bloqueado.
- **Solución implementada**: Se redujeron los timeouts de operaciones críticas para mejorar la UX:
  - **Marcar pedido entregado**: 25s → **8s** (operación simple)
  - **Reportar novedad (no entregado)**: 25s → **8s** (operación simple)
  - **Abrir turno**: 25s → **10s** (operación con validaciones)
  - **Cargar stock de cargue**: 30s → **15s** (carga de datos)
  - **Precargar clientes**: 25s → **15s** (carga de datos)
  - **Anular venta (background)**: 30s → **12s** (operación crítica)
- **Mensaje de error mejorado**: Se reemplazó el toast pequeño por un Alert claro y visible:
  ```
  ⚠️ Sin Conexión
  
  No se pudo conectar con el servidor.
  
  El pedido se guardará localmente y se 
  sincronizará cuando tengas internet.
  ```
- **Comportamiento offline preservado**: Todo el sistema offline sigue funcionando igual (guarda local, agrega a cola, sincroniza automáticamente).
- **Archivo modificado**: `AP GUERRERO/components/Ventas/VentasScreen.js`
- **Fecha de implementación**: 24 de Marzo de 2026

#### Límite de Anulaciones por Venta (Marzo 2026)
- **Problema detectado**: Sin límite de anulaciones, los vendedores podían anular y recrear ventas repetidamente, dificultando la auditoría y ocultando errores.
- **Solución implementada**: Límite de **1 anulación por venta**:
  - Nuevo campo en modelo `VentaRuta`: `intentos_anulacion` (IntegerField, default=0)
  - Validación en app móvil antes de anular (verifica contador local)
  - Validación en backend (doble seguridad)
  - Mensaje claro sugiriendo usar "Editar" después del límite
  - Funciona offline (validación local + sincronización)
- **Mensaje al usuario**:
  ```
  ⚠️ Límite Alcanzado
  
  Esta venta ya fue anulada anteriormente.
  
  💡 ¿Necesitas corregir algo?
  Usa el botón "✏️ Editar" en vez de anular.
  
  Editar mantiene el registro y es más rápido.
  ```
- **Beneficios**:
  - Previene abuso de anulaciones
  - Facilita auditoría (máximo 1 anulación por venta)
  - Promueve uso de "Editar" (mejor trazabilidad)
  - Permite corregir errores honestos (1 vez)
- **Archivos modificados**: 
  - `AP GUERRERO/components/Ventas/VentasScreen.js` (validación y contador)
  - `api/models.py` (nuevo campo `intentos_anulacion`)
  - `api/views.py` (validación en endpoint de anulación)
- **Migración requerida**: `python manage.py makemigrations && python manage.py migrate`
- **Fecha de implementación**: 24 de Marzo de 2026

#### Mejoras de UX y Fluidez de Modales (Abril 2026)

##### Animaciones de modales: `slide` → `fade`
- **Problema**: Los modales con `animationType="slide"` se sentían lentos en Android porque animaban entrando desde abajo.
- **Solución**: Cambiados a `"fade"` en todos los modales para respuesta instantánea.
- **Archivos modificados**:
  - `AP GUERRERO/components/Ventas/ResumenVentaModal.js`
  - `AP GUERRERO/components/Ventas/ClienteModal.js`
  - `AP GUERRERO/components/Ventas/ConfirmarEntregaModal.js`
  - `AP GUERRERO/components/Ventas/VentasScreen.js` (modal pedidos asignados + historial ventas)

##### Modal Editar Venta — posición y tamaño
- Se agregó `statusBarTranslucent={true}` al Modal de edición para que cubra toda la pantalla incluyendo la barra de estado Android (sin recortar).
- `paddingTop: 23` en Android para dejar espacio visual bajo la barra de estado.
- `paddingBottom: 0` y `padding: 0` en el overlay para eliminar el espacio inferior innecesario.
- Header del modal con `paddingTop: 8` y `paddingBottom: 6` para separar título de los bordes.
- Botones Cancelar/Guardar más compactos: `padding: 6`, `fontSize: 13`.

##### Apertura rápida del modal de edición
- **Problema**: Al tocar "Editar" desde el historial, el modal tardaba porque React procesaba el cierre del historial y la apertura del editor en renders separados.
- **Solución**: `setMostrarHistorialVentas(false)` se ejecuta **primero** antes de todos los `setState` del modal de edición, agrupando todo en un solo render.

##### Fix: botón "Solo Entregar" en lista de pedidos no abría modal
- **Problema**: Al tocar "Solo Entregar" desde el modal de pedidos asignados, no pasaba nada.
- **Causa 1**: `ConfirmarEntregaModal` retornaba `null` cuando `pedido` aún no estaba seteado (race condition entre `setPedidoParaEntregar` y `setMostrarResumenEntrega`).
- **Causa 2**: El modal de pedidos (`modalPedidosVisible`) seguía abierto encima, bloqueando el modal de confirmación.
- **Fix**:
  1. `ConfirmarEntregaModal.js`: `return null` → `return <Modal visible={false} />` para no destruir el árbol de componentes.
  2. `VentasScreen.js`: cerrar `setModalPedidosVisible(false)` primero y abrir `marcarPedidoEntregado` con `setTimeout 150ms`.
- **Archivos**: `AP GUERRERO/components/Ventas/ConfirmarEntregaModal.js`, `VentasScreen.js`

##### Fix: `netInfo is not defined` en cambio de método de pago
- **Error**: `ReferenceError: Property 'netInfo' doesn't exist` en `confirmarCambioMetodoPagoDesdeCard`.
- **Causa**: Variable `netInfo` usada en el `catch` sin haber sido declarada en ese scope (solo existe en `refrescarStockSilencioso`).
- **Fix**: Reemplazado `!netInfo.isConnected` por `error?.message?.includes('fetch')` — detecta error de red por mensaje sin necesitar `NetInfo.fetch()`.
- **Archivo**: `AP GUERRERO/components/Ventas/VentasScreen.js` línea ~2497.

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

### Modo Tablet en Cargue (Marzo 2026)

#### Objetivo de la implementación
- En tablet, la tabla de `Cargue` debía seguir siendo usable en horizontal y vertical sin perder contexto visual.
- El enfoque actual separa la UX tablet de la UX desktop:
  - desktop usa comportamiento más cercano al `sticky` tradicional del `thead`
  - tablet usa capas fijas sincronizadas para evitar inconsistencias durante scroll táctil

#### Arquitectura actual
- `frontend/src/components/Cargue/MenuSheets.jsx`
  - Detecta layout tablet con `TABLET_LAYOUT_MEDIA_QUERY`.
  - Controla `isTabletLayout`, `showTabletHeader` y la medición de columnas de la tabla.
  - Renderiza una **cabecera fija clonada** (`cargue-tablet-fixed-header`) solo en tablet.
  - Renderiza una **barra inferior fija de IDs** (`cargue-tablet-fixed-ids`) solo en tablet.
- `frontend/src/components/Cargue/PlantillaOperativa.jsx`
  - Expone el ancla visual `cargue-tablet-header-anchor`.
  - Monta la tabla dentro de `tabla-productos-scroll-shell`, que es el contenedor real del scroll horizontal.
- `frontend/src/components/Cargue/TablaProductos.jsx`
  - Define la tabla real y el orden/anchos base de columnas consumidos por la cabecera visual tablet.
- `frontend/src/components/Cargue/PlantillaOperativa.css`
  - Contiene la media query de tablet.
  - Define estilos de `tabla-productos-scroll-shell`, `cargue-tablet-fixed-header` y `cargue-tablet-fixed-ids`.

#### Cómo funciona la cabecera superior en tablet
- La cabecera que ve el usuario en tablet **no es el `thead` nativo pegado**.
- `MenuSheets.jsx` mide las columnas reales del `thead` con `getBoundingClientRect()`.
- Cuando el ancla superior sale de la pantalla y la tabla sigue visible, se activa `showTabletHeader`.
- La cabecera clonada:
  - se posiciona fija arriba
  - replica el ancho de cada columna
  - sincroniza su `scrollLeft` con el scroll horizontal de `tabla-productos-scroll-shell`
- Esto evita perder títulos al hacer scroll vertical en tablets y mantiene alineación con la tabla real.

#### Cómo funciona la barra inferior de IDs en tablet
- La barra de IDs visible en tablet es una capa independiente de la barra inferior desktop.
- Se usa para mantener siempre accesibles los botones `ID1` a `ID6` mientras se navega por la tabla.
- En tablet, la barra desktop normal (`cargue-bottom-bar`) se oculta y se reemplaza por `cargue-tablet-fixed-ids`.
- La barra permite interacción solo en sus botones (`pointer-events: auto`), manteniendo el contenedor externo aislado.

#### Ajuste importante: rebote visual de la barra de IDs (producción Android)
- Problema observado en tablets Android en producción:
  - durante scroll táctil vertical, la barra inferior de IDs parecía “subir” o quedarse momentáneamente flotando
  - luego regresaba a su posición inferior
- Causa más probable:
  - la barra estaba anclada con `position: fixed` usando `top: calc(100vh/100dvh - ...)`
  - en Android, `vh/dvh` puede variar durante el gesto táctil y producir un salto visual
- Solución aplicada:
  - se eliminó el anclaje por `top: calc(...)`
  - la barra quedó anclada con `bottom: 0` y `top: auto`
- Archivo del fix:
  - `frontend/src/components/Cargue/PlantillaOperativa.css`
- Resultado esperado:
  - la barra de IDs permanece estable en el borde inferior durante el scroll táctil
  - se reduce el “rebote” o salto momentáneo en tablets Samsung/Android

#### Regla práctica para futuros cambios
- No tocar la UX tablet de `Cargue` asumiendo que funciona igual que desktop.
- Si se modifica cualquiera de estos puntos, probar en tablet real:
  - `tabla-productos-scroll-shell`
  - `cargue-tablet-fixed-header`
  - `cargue-tablet-fixed-ids`
  - media query `TABLET_LAYOUT_MEDIA_QUERY`
- Cualquier ajuste visual en tablet debe validarse con:
  - scroll vertical largo
  - scroll horizontal de la tabla
  - cambio entre IDs
  - interacción táctil real en Android
  - presencia de barra del sistema / `safe-area-inset-bottom`

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

El Modal de Auditoría es una vista especial dentro de `PlantillaOperativa.jsx` que el despachador puede abrir para revisar, **en tiempo real**, una referencia operativa entre el cargue liquidable y lo reportado por la App Móvil. Se abre con el botón **"⚖️ Auditoría"** en el encabezado de la plantilla.

### Flujo al Abrir el Modal

Al hacer clic en "⚖️ Auditoría", se ejecuta `abrirAuditoria()`:

1. El botón muestra un spinner "Sincronizando..." y se deshabilita
2. Hace `fetch` a `/api/obtener-cargue/?vendedor_id=IDx&dia=...&fecha=...`
3. Construye `productosAuditoria` con datos frescos del servidor (`total`, `vendidas`, `vencidas`, etc.)
4. Calcula `restante_esperado = total_liquidable - vendidas_app`
5. Abre el modal con una referencia consistente entre App y cargue

```javascript
const abrirAuditoria = async () => {
    setSincronizandoAuditoria(true);
    // ... fetch al servidor ...
    setProductosAuditoria(productosEnriquecidos);
    setMostrarModalVendidas(true);
};
```

### Vista del Modal

- Muestra productos donde **`vendidas > 0`** o **`vencidas > 0`**
- Columnas actuales:
  - PRODUCTO
  - TOTAL LIQ. (`total` que ya descuenta vencidas/devoluciones/dctos/adicional)
  - APP (VEND.)
  - APP (VENC.)
  - RESTANTE
  - ESTADO
- Importante:
  - ya no se presenta `total` como “FÍSICO”, porque ese modal no usa conteo físico real del despachador
  - el modal sirve como **referencia operativa** entre cargue liquidable y App, no como auditoría física definitiva
- Badge de estado semántico:
  - `Liquidado` si `restante_esperado = 0`
  - `Pendiente por entregar` si `restante_esperado > 0`
- `thead` y `tfoot` con `position: sticky` para scroll interno sin perder encabezados ni totales
- Footer muestra si aún hay unidades pendientes por cerrar según App + cargue liquidable

### Protección del Polling

Mientras el modal está abierto, el polling (3 seg) está pausado para evitar que `cargarDatosGuardados()` sobreescriba la referencia de auditoría con valores viejos de localStorage:

```javascript
const pollingInterval = setInterval(async () => {
    if (mostrarModalVendidas) return; // 🛡️ Pausa mientras modal abierto
    // ... lógica normal de polling ...
}, 3000);
```

El `useEffect` del polling incluye `mostrarModalVendidas` en sus dependencias para recrearse correctamente.

### Posicionamiento Responsivo

Se inyecta un `<style>` dinámico con media query para esquivar el menú lateral:

### Ajustes posteriores (19 Mar 2026)

- El modal dejó de usar semántica engañosa tipo `FÍSICO vs APP`; ahora el foco operativo es:
  - `TOTAL LIQ.`
  - `APP VEND.`
  - `APP VENC.`
  - `RESTANTE`
  - `DEV. FIS. / ESTADO`
- El campo de físico del modal terminó enfocado en `devoluciones físicas`, no en un “físico total” ambiguo.
  - el input se autocompleta desde `devoluciones`
  - puede sobreescribirse manualmente si el despachador quiere corregirlo
- La auditoría ya no intenta explicar todo con múltiples badges por fila.
  - se simplificó a un solo estado principal por producto para lectura rápida
  - la idea operativa final es detectar si el `ID` está reportando bien o no, sin recargar el modal
- Estado principal final por fila:
  - `OK`: el flujo reportado por app/cargue cuadra para esa fila
  - `Pendiente`: todavía hay restante por cerrar, pero sin evidencia clara de mala reportería
  - `Ajustado manualmente`: el despachador corrigió manualmente `devoluciones` o `vencidas` en esa fila
  - `No reporto vencida`: la app no reportó la vencida y esta apareció en CRM/cargue
  - `Ajusto dev. y vencida`: caso combinado donde la app no reportó vencida y además el despachador ajustó manualmente la devolución/vencida
- Regla de lectura acordada con usuario:
  - el modal no necesita acusar explícitamente `No reporto venta`
  - si en la tabla principal de Cargue el número quedó en rojo, eso ya indica que el despachador intervino manualmente esa fila
  - con esa combinación:
    - `rojo en Cargue` = el despachador tocó la fila
    - `No reporto vencida` = la app omitió la vencida
    - `Ajusto dev. y vencida` = el despachador corrigió ambas
    - `Pendiente` = aún falta clasificar/cerrar algo
    - `OK` = cuadra
- El modal también se abrió para incluir filas donde la app no reportó nada, pero sí existen:
  - `devoluciones`
  - `vencidas`
  - o conteo/ajuste manual del despachador
  Esto evita que queden invisibles productos que el despachador sí recibió/corrigió.
- Se compactó la UI del modal para escritorio/tablet horizontal:
  - ancho mayor,
  - tabla más compacta,
  - estado corto y único por fila,
  - posición más arriba en pantalla.
- Se agregó una marca visual en la tabla principal de Cargue:
  - si el despachador cambia manualmente `devoluciones` o `vencidas` durante la fase operativa de despacho/finalización, ese input se pinta en rojo.
  - La marca se guarda en `localStorage` con la clave `cargue_despachador_overrides_<dia>_<id>_<fecha>`.
  - Si el valor vuelve al original, la marca roja se elimina.

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
| `productosAuditoria` | `array` | Snapshot enriquecido desde backend para el modal |
| `productosFiltradosAudit` | computed | `productosAuditoria.filter(p => vendidas > 0 || vencidas > 0)` |
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

#### Productos Vencidos - Ajuste de Stock en Tiempo Real (24 Mar 2026)

**Problema resuelto**: Cuando el usuario agregaba productos vencidos en el modal "Productos Vencidos", el stock disponible NO se actualizaba en tiempo real. El stock solo se ajustaba al confirmar la venta completa.

**Solución implementada**:

1. **Ajuste de stock local inmediato** (`VentasScreen.js` - `handleGuardarVencidas`):
   - Cuando se guardan productos vencidos, se actualiza `stockCargue` inmediatamente
   - Restaura el stock de vencidas anteriores (si se estaban editando)
   - Descuenta las nuevas vencidas del stock disponible
   - Esto permite que el usuario vea el stock real disponible al instante

```javascript
const handleGuardarVencidas = (productosVencidos, foto) => {
    // Calcular diferencia con vencidas anteriores
    const vencidasAnteriores = vencidas || [];
    
    setVencidas(productosVencidos);
    setFotoVencidas(foto);

    // Ajustar stock localmente
    setStockCargue(prevStock => {
        const nuevoStock = { ...prevStock };
        
        // 1. Restaurar stock de vencidas anteriores
        vencidasAnteriores.forEach(item => {
            const nombreProducto = (item.nombre || '').toUpperCase().trim();
            const cantidadAnterior = parseInt(item.cantidad || 0, 10);
            if (nombreProducto && cantidadAnterior > 0) {
                nuevoStock[nombreProducto] = (nuevoStock[nombreProducto] || 0) + cantidadAnterior;
            }
        });
        
        // 2. Descontar nuevas vencidas
        (productosVencidos || []).forEach(item => {
            const nombreProducto = (item.nombre || '').toUpperCase().trim();
            const cantidadVencida = parseInt(item.cantidad || 0, 10);
            if (nombreProducto && cantidadVencida > 0) {
                nuevoStock[nombreProducto] = Math.max(0, (nuevoStock[nombreProducto] || 0) - cantidadVencida);
            }
        });
        
        return nuevoStock;
    });
};
```

2. **Stock disponible en tiempo real dentro del modal** (`DevolucionesVencidas.js`):
   - El "Stock disponible" mostrado en cada producto resta la cantidad que el usuario está escribiendo EN ESE MOMENTO
   - Usa `useMemo` para pre-calcular todos los stocks de una vez (optimización de rendimiento)
   - Actualización instantánea sin demoras

```javascript
// Pre-calcular stocks disponibles para todos los productos
const stocksDisponibles = useMemo(() => {
    const stocks = {};
    productos.forEach(producto => {
        const cantidad = cantidades[producto.id] || 0;
        const stockDisponibleRaw = obtenerStockDisponibleProducto(producto?.nombre || '');
        const stockDisponibleBase = Math.max(0, parseInt(stockDisponibleRaw, 10) || 0);
        
        // Restar la cantidad actual que el usuario está escribiendo
        stocks[producto.id] = Math.max(0, stockDisponibleBase - cantidad);
    });
    return stocks;
}, [productos, cantidades, obtenerStockDisponibleProducto]);
```

**Comportamiento actual**:
- Stock inicial: 100
- Usuario agrega 1 vencido → Stock disponible: 99 (actualización instantánea)
- Usuario cambia a 5 vencidos → Stock disponible: 95 (actualización instantánea)
- Usuario borra todo → Stock disponible: 100 (se restaura)
- Al guardar, el stock se ajusta en `VentasScreen` para reflejarse en toda la app

**Optimizaciones de rendimiento implementadas**:
- `React.memo`: El componente `DevolucionesVencidas` solo se re-renderiza cuando cambian sus props
- `useMemo` para productos: Solo se cargan cuando el modal es visible
- `useMemo` para stocks: Pre-cálculo de todos los stocks en una sola pasada
- `useCallback` para `renderProducto`: Función de render optimizada

**Archivos modificados**:
- `AP GUERRERO/components/Ventas/VentasScreen.js` - Función `handleGuardarVencidas`
- `AP GUERRERO/components/Ventas/DevolucionesVencidas.js` - Cálculo de stock en tiempo real + optimizaciones

#### Modal de Productos Vencidos - Estilo Flotante Unificado (24 Mar 2026)

**Problema detectado**: El modal de "Productos Vencidos" se veía diferente dependiendo de dónde se abriera:
- Desde "Adjuntar vencidas" (modal de editar): Se veía como modal flotante con fondo oscuro, no se encogía con el teclado
- Desde botón "Vencidas" (venta normal): Ocupaba toda la pantalla y se encogía cuando salía el teclado

**Solución implementada**:

Unificado el estilo del modal para que siempre se vea como modal flotante, independientemente de dónde se abra:

```javascript
<Modal
    visible={visible}
    animationType="fade"           // Animación suave (antes: "slide")
    transparent={true}              // Fondo transparente (antes: false)
    onRequestClose={handleCancelar}
>
    <KeyboardAvoidingView
        style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Fondo oscuro semitransparente
            justifyContent: 'flex-start',           // Posición fija arriba
            paddingTop: Platform.OS === 'android' ? 2 : 34,
            paddingHorizontal: 8,
            paddingBottom: Platform.OS === 'android' ? 2 : 20,
        }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
    >
        <View style={{
            backgroundColor: '#fff',
            borderRadius: 20,                       // Bordes redondeados
            width: '100%',
            maxHeight: Platform.OS === 'android' ? '93%' : '88%',  // Altura máxima fija
            minHeight: Platform.OS === 'android' ? '64%' : '70%',
            flexShrink: 1,
            overflow: 'hidden',
            flex: 1,
        }}>
            {/* Contenido del modal */}
        </View>
    </KeyboardAvoidingView>
</Modal>
```

**Mejoras visuales adicionales**:
- Tamaño de texto del stock aumentado: `fontSize: 11` → `fontSize: 13`
- Peso de fuente aumentado: `fontWeight: '600'` → `fontWeight: '700'`
- Mejor legibilidad del stock disponible

**Comportamiento actual**:
- ✅ Modal flotante con fondo oscuro en ambos casos
- ✅ Bordes redondeados (20px)
- ✅ NO se encoge cuando sale el teclado (altura máxima fija)
- ✅ Animación suave de entrada (fade)
- ✅ Posición fija en la parte superior
- ✅ Consistencia visual total entre venta normal y editar venta

**Archivos modificados**:
- `AP GUERRERO/components/Ventas/DevolucionesVencidas.js` - Estructura del Modal y KeyboardAvoidingView

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

### Fix Crítico: Sincronización Completa de Cargue (24 Marzo 2026)

**Problema detectado**: Al editar una venta desde la app móvil (cambiar método de pago a NEQUI o agregar vencidas), los cambios NO se reflejaban en el resumen de Cargue. Solo se actualizaban las "vendidas" pero NO los métodos de pago ni las vencidas.

**Solución implementada** (`api/views.py` - `VentaRutaViewSet.update`):

El backend ahora hace una sincronización completa en 2 fases:

**Fase 1 - Reversión**:
1. Resta vendidas anteriores de cada producto
2. Resta nequi/daviplata del método de pago anterior
3. Resta vencidas anteriores de cada producto

**Fase 2 - Aplicación**:
1. Suma vendidas nuevas de cada producto
2. Suma nequi/daviplata del método de pago nuevo
3. Suma vencidas nuevas de cada producto

**Ejemplo práctico**:
```
Venta original: DON CARNES GRECO
- Total: $13,000
- Método: DAVIPLATA
- Vencidas: 0

Edición:
- Total: $36,600
- Método: NEQUI
- Vencidas: 2 unidades de AREPA

Resultado en Cargue:
✅ Daviplata: -$13,000 (revertido)
✅ Nequi: +$36,600 (aplicado)
✅ Vencidas AREPA: +2 (aplicado)
```

**Archivos modificados**:
- `api/views.py` - Función `update()` de `VentaRutaViewSet`

**Riesgo**: Medio - Requiere validación en producción con datos reales

---

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
- **Teclado Constante sobre Lista (Anti-Empuje)**: La base vigente para `Ventas` quedó con `softwareKeyboardLayoutMode: "resize"` en `AP GUERRERO/app.json`, junto con el colchón de lista de `VentasScreen` (`listaContentNormal = 260` y `listaContentConTeclado = 220`). Esta combinación es la referencia actual confirmada por pruebas para que el teclado no empuje el contenido ni en `Ventas` ni en `Sugeridos`.

**Fix aplicado (24 de marzo 2026)**: Se corrigió `ProductList.js` (Sugeridos) que tenía `paddingBottom: 220` fijo, causando que el teclado empujara el contenido. Se cambió a `paddingBottom: 260` para igualar el comportamiento de Ventas. Ahora ambas pantallas usan el mismo valor base de 260, garantizando que el teclado se superponga sin empujar.

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

## 🔒 Cargue - Persistencia Offline y Protección Anti-Borrado (19 Mar 2026)

### Problema atacado
Despachadores reportaban que, cuando fallaba internet o el backend quedaba temporalmente inaccesible, algunos datos escritos en CRM Web se “borraban” visualmente o eran reemplazados por valores viejos al recargar, al hacer polling o al reconectar.

### Objetivo de la corrección
Garantizar que los datos manuales del módulo de Cargue:
- se guarden localmente al instante,
- sobrevivan refresh / pérdida de internet / caída de backend,
- no sufran “rebote” cuando llega data remota vieja,
- se reintenten sincronizar automáticamente al volver la conexión,
- y se limpien correctamente al finalizar la jornada.

### Alcance implementado

#### 1. PlantillaOperativa.jsx
- Archivo: `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- Se normalizó la fecha a `YYYY-MM-DD` para todas las claves locales.
- Se consolidó la clave principal:
  - `cargue_${dia}_${idSheet}_${fecha}`
- Se agregó cola pendiente por columnas editables:
  - `cargue_pending_${dia}_${idSheet}_${fecha}`
- Campos protegidos:
  - `dctos`
  - `adicional`
  - `devoluciones`
  - `vencidas`
- Comportamiento nuevo:
  - al editar, el valor se guarda de inmediato en snapshot local,
  - además se marca como pendiente,
  - al recargar o volver a leer desde backend, los pendientes se re-aplican antes de pintar,
  - al volver internet, se reintenta sincronización cada 10s y también en evento `online`,
  - si la sincronización responde OK, el pendiente se limpia.
- También se protege el caso de `snapshot local exacto` cuando el backend falla o responde con error HTTP.

#### 2. ResumenVentas.jsx
- Archivo: `frontend/src/components/Cargue/ResumenVentas.jsx`
- Se agregaron claves específicas por vendedor/fecha:
  - `conceptos_pagos_${dia}_${idSheet}_${fecha}`
  - `base_caja_${dia}_${idSheet}_${fecha}`
- Se agregó cola pendiente del bloque completo:
  - `resumen_pending_${dia}_${idSheet}_${fecha}`
- Cobertura:
  - `CONCEPTO`
  - `DESCUENTOS`
  - `NEQUI`
  - `DAVIPLATA`
  - `base_caja`
- Comportamiento nuevo:
  - snapshot local inmediato al editar,
  - protección contra rebote al cargar desde `cargue-pagos` o desde `CargueIDx`,
  - reintento automático al volver internet,
  - sincronización de pagos al endpoint dedicado `/api/cargue-pagos/sync_pagos/`,
  - sincronización retrocompatible de totales globales en `CargueIDx`.

#### 3. ControlCumplimiento.jsx
- Archivo: `frontend/src/components/Cargue/ControlCumplimiento.jsx`
- Se mantuvo snapshot local:
  - `cumplimiento_${dia}_${idSheet}_${fecha}`
- Se agregó cola pendiente:
  - `cumplimiento_pending_${dia}_${idSheet}_${fecha}`
- Cada selección se guarda localmente, se protege contra rebote y se reintenta sincronizar automáticamente cuando vuelve internet.

#### 4. RegistroLotes.jsx
- Archivo: `frontend/src/components/Cargue/RegistroLotes.jsx`
- Se mantuvo snapshot local:
  - `lotes_${dia}_${idSheet}_${fecha}`
- Se agregó cola pendiente:
  - `lotes_pending_${dia}_${idSheet}_${fecha}`
- Cada alta/borrado de lote:
  - guarda local primero,
  - se protege al recargar,
  - se reintenta sincronizar solo cuando haya conexión.

#### 5. BotonLimpiar.jsx
- Archivo: `frontend/src/components/Cargue/BotonLimpiar.jsx`
- Se corrigió limpieza con fecha normalizada `YYYY-MM-DD`.
- Ahora al finalizar/limpiar también elimina:
  - `cargue_pending_*`
  - `resumen_pending_*`
  - `cumplimiento_pending_*`
  - `lotes_pending_*`
  - además de snapshots locales asociados (`cargue_*`, `conceptos_pagos_*`, `base_caja_*`, `cumplimiento_*`, `lotes_*`).
- Esto evita que reaparezcan valores pendientes viejos al reabrir el mismo día/ID.

### Regla operativa actual
- Mientras exista snapshot local, el frontend prioriza preservar lo editado manualmente.
- La BD sigue siendo la fuente de verdad final, pero el navegador protege temporalmente los cambios manuales hasta poder confirmarlos contra backend.
- El patrón aplicado es:
  1. editar,
  2. persistir local,
  3. marcar pendiente,
  4. rehidratar desde pendiente si backend todavía no refleja el cambio,
  5. limpiar pendiente al sincronizar con éxito.

### Estado de validación
- Validado localmente en CRM Web:
  - caída de backend,
  - recarga con datos editados,
  - preservación de columnas editables,
  - compilación frontend OK (`npm run build`).
- Validado también en VPS/producción:
  - se desplegó el commit `a6aec81` (`feat(cargue): preserve local edits during outages`) solo en frontend,
  - en pruebas reales de `Cargue`, al cortar internet los datos editados siguieron visibles,
  - al restaurar la conexión, los datos continuaron presentes y no se borraron de las columnas editables,
  - con esto se da por corregido el reporte principal de despachadores sobre borrado intermitente de datos en columnas editables.
- Pendiente/variable según operación real:
  - seguir observando uso normal de despachadores en producción para detectar casos residuales no reproducidos,
  - la línea aparte de trabajo sobre coherencia App Guerrero vs Auditoría de Liquidación sigue separada de esta corrección.

### Estado real actual en VPS (19 Mar 2026, tarde)
- El VPS quedó estable con:
  - commit activo en producción: `3854266`
  - mensaje: `Revert "feat(cargue): improve audit tracking and route sale signals"`
- Lectura práctica:
  - sigue activo `a6aec81` (`feat(cargue): preserve local edits during outages`)
  - NO quedó activo `a804259` en ese momento, porque fue revertido temporalmente durante la contingencia
- Importante:
  - esto preserva la corrección ya validada de persistencia offline/anti-borrado en `Cargue`
  - la línea nueva de auditoría, badges y refuerzo backend quedó pausada momentáneamente hasta reactivarla de forma controlada

### Incidente real detectado en producción al desplegar `a804259`
- Síntoma observado:
  - login mostraba `Error de conexión con el servidor`
  - `Cargue` aparecía vacío o con valores default (`RESPONSABLE`, tablas en blanco, etc.)
- Diagnóstico confirmado:
  - el problema NO fue pérdida de datos ni daño directo del commit
  - `crm_backend_prod` estaba arriba y Gunicorn arrancó normalmente
  - `crm_nginx` quedó apuntando a una IP vieja del contenedor backend (`172.18.0.4:8000`)
  - al recrearse `backend`, Docker cambió la IP interna y `nginx` siguió usando el upstream viejo
- Evidencia en logs:
  - `connect() failed (113: Host is unreachable) while connecting to upstream`
  - múltiples respuestas `502`
- Corrección operativa:
  - reiniciar `nginx` después de recrear `backend`
  - si no basta, forzar recreación de `nginx`
- Comandos que resolvieron / deben ejecutarse después de un redeploy de frontend+backend:
  - `docker compose -f docker-compose.prod.yml restart nginx`
  - si sigue mal: `docker compose -f docker-compose.prod.yml up -d --force-recreate nginx`

### Backup preventivo tomado en VPS antes de reactivar auditoría nueva
- Se generó respaldo SQL directo de tablas de `Cargue` en producción:
  - archivo: `backups/backup_cargue_2026-03-19.sql`
  - tamaño validado: `~1.7M`
- Tablas incluidas:
  - `api_cargueid1`
  - `api_cargueid2`
  - `api_cargueid3`
  - `api_cargueid4`
  - `api_cargueid5`
  - `api_cargueid6`
  - `api_cargue_productos`
  - `api_cargue_resumen`
  - `api_cargue_pagos`
  - `api_cargue_cumplimiento`
- Objetivo:
  - tener punto de recuperación antes de reactivar el commit `a804259`

### Procedimiento seguro acordado para reactivar `a804259`
- Si se quiere volver a activar la auditoría nueva en producción:
  1. confirmar que el VPS siga sobre `3854266`
  2. ejecutar `git revert --no-edit 3854266`
  3. ejecutar `docker compose -f docker-compose.prod.yml up -d --build`
  4. ejecutar inmediatamente `docker compose -f docker-compose.prod.yml restart nginx`
  5. si aparece cualquier `502`, ejecutar `docker compose -f docker-compose.prod.yml up -d --force-recreate nginx`
  6. validar login, `Cargue`, `Ventas Ruta` y modal de auditoría
- Nota:
  - no requiere migraciones
  - no afecta la APK actual de `AP GUERRERO`

### Ajuste adicional detectado en pruebas App vs Auditoría (19 Mar 2026)
- Síntoma observado:
  - en `AP GUERRERO`, algunos productos seguían mostrando stock disponible como si las `vencidas` no se hubieran descontado,
  - mientras la auditoría web mostraba el restante correcto según `total`.
- Caso real detectado:
  - ejemplo tipo `AREPA TIPO OBLEA`: app mostraba `5`, auditoría mostraba `3`,
  - el desfase coincidía exactamente con `2` unidades reportadas como `vencidas`.
- Causa raíz:
  - en backend, varios flujos actualizaban `vencidas` o `devoluciones` con `update()` / `bulk_update()`,
  - esos caminos NO ejecutan `save()` del modelo `CargueIDx`,
  - por eso el campo `total` quedaba viejo aunque `vencidas`/`devoluciones` sí cambiaban.
- Impacto:
  - `obtener_cargue()` usa `reg.total - reg.vendidas` para enviar `quantity` a la app,
  - si `total` no se recalcula, la app muestra más stock del real,
  - la auditoría puede verse “mejor” o distinta si está trabajando con otro snapshot/estado local.
- Corrección aplicada:
  - se creó helper backend `recalcular_totales_cargue_queryset()` en `api/models.py`,
  - ahora se recalculan `total` y `neto` después de cambios por `update()`/`bulk_update()` en:
    - sincronización de vencidas desde ventas ruta,
    - sincronización de vencidas desde pedidos,
    - cierre de turno,
    - anulación de ventas con vencidas,
    - reapertura/reset de turno.
- Validación técnica:
  - `python3 manage.py check` OK.

### Archivos clave tocados en esta línea de trabajo
- `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- `frontend/src/components/Cargue/ResumenVentas.jsx`
- `frontend/src/components/Cargue/ControlCumplimiento.jsx`
- `frontend/src/components/Cargue/RegistroLotes.jsx`
- `frontend/src/components/Cargue/BotonLimpiar.jsx`
- `api/models.py`
- `api/views.py`
- `api/serializers.py`

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

## 🏷️ Ventas Ruta - Badge de Vencidas en listado principal (19 Mar 2026)

### Objetivo
Hacer visible desde la tabla principal de `Ventas de Ruta` cuándo una venta reportó `productos_vencidos`, sin obligar a abrir el detalle.

### Implementación
- Archivo: `frontend/src/components/rutas/ReporteVentasRuta.jsx`
  - Se agregó helper `obtenerTotalVencidasVenta(venta)`.
  - En la columna `TOTAL` se muestra badge `VENCIDAS X` cuando la venta trae `productos_vencidos`.
  - El badge `EDITADA` existente se mantiene.
  - Total + badges quedaron en layout horizontal con `wrap`, para convivir sin montarse.
- Archivo: `frontend/src/components/rutas/ReporteVentasRuta.css`
  - Se agregaron estilos de soporte para la celda del total:
    - `ventas-ruta-total-cell`
    - `ventas-ruta-total-wrap`
    - `ventas-ruta-total-amount`
    - `ventas-ruta-total-badges`

### Lectura operativa
- `EDITADA`:
  la venta fue modificada luego de creada.
- `VENCIDAS X`:
  esa venta reportó vencidas y la cantidad total es visible desde el listado.

### Alcance
- Solo frontend web CRM.
- No cambia backend ni API.
- No requiere APK nueva.

### Estado de despliegue
- Este bloque hace parte del commit `a804259` (`feat(cargue): improve audit tracking and route sale signals`).
- Durante despliegue inicial en VPS coincidió con el incidente de `nginx` apuntando al upstream viejo del backend, por lo que no pudo validarse limpiamente en ese primer intento.
- No quedó demostrado como fallo funcional propio del badge; el problema confirmado fue de infraestructura (`502` por upstream viejo).

### Ajuste adicional en auditoría: detección de sobre-reporte de app (19 Mar 2026)
- Problema detectado en pruebas reales:
  - había filas donde `APP VEND.` quedaba por encima de `TOTAL LIQ.`
  - ejemplo real observado: `TOTAL LIQ. = 100` y `APP VEND. = 200`
  - el modal anterior recortaba `RESTANTE` a `0` y podía terminar mostrando `OK`, lo cual ocultaba una inconsistencia grave
- Ajuste aplicado:
  - en `frontend/src/components/Cargue/PlantillaOperativa.jsx`
  - se calculó `excesoVendidasApp = max(0, APP_VEND - TOTAL_LIQ)`
  - si `excesoVendidasApp > 0`:
    - `RESTANTE` se muestra en negativo (`-X`)
    - el estado ya NO puede salir como `OK`
    - el badge muestra `App sobre reporto X`
- Lectura operativa:
  - no implica automáticamente que la app sí permitiera vender físicamente más producto
  - sí indica que la reportería/acumulado de ventas de app quedó por encima del total liquidable del cargue
  - posibles causas: duplicidad, edición/anulación mal reflejada, histórico contaminado o acumulado inconsistente
- Validación técnica:
  - frontend compiló bien con `npm run build`

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

## 🛡️ App Guerrero + Ventas Ruta - Ajuste quirúrgico anti-duplicados y modal de detalle (20 Mar 2026)

### Problema detectado en pruebas locales
- Se implementó un blindaje anti-duplicados para `AP GUERRERO`, pero la primera versión quedó demasiado agresiva.
- Caso real de prueba:
  - se hizo una venta válida a un cliente,
  - luego otra venta válida al mismo cliente con el mismo producto,
  - la segunda venta no aparecía en `Ventas Ruta`,
  - pero el stock local sí se descontaba.
- Conclusión:
  - la app estaba reutilizando una `venta similar reciente` aunque fuera una segunda venta legítima,
  - el stock se seguía descontando desde `VentasScreen`, generando desface visual/operativo.

### Hallazgo técnico
- Archivo: `AP GUERRERO/services/ventasService.js`
  - existía una búsqueda de `venta local similar reciente` basada en una huella (`huella_duplicado`) y ventana amplia.
  - eso servía para detectar duplicados, pero también se tragaba ventas reales hechas segundos después al mismo cliente.
- Archivo: `api/views.py`
  - el backend tenía una detección de `DUPLICADO_SOSPECHOSO` dentro de `120s`.
  - esa ventana también era demasiado amplia para operación real.

### Ajuste aplicado
- Archivo: `AP GUERRERO/services/ventasService.js`
  - se eliminó la reutilización automática de `venta similar reciente`.
  - la `huella_duplicado` se conserva solo para trazabilidad/diagnóstico.
  - la app ya no debe esconder una segunda venta válida al mismo cliente.
- Archivo: `AP GUERRERO/components/Ventas/ResumenVentaModal.js`
  - se mantiene el bloqueo inmediato por `double tap` en `Confirmar`.
  - este sí sigue siendo el blindaje correcto para evitar doble toque real antes del re-render.
- Archivo: `api/views.py`
  - la ventana de detección de `DUPLICADO_SOSPECHOSO` se redujo de `120s` a `15s`.
  - objetivo:
    - bloquear doble submit casi instantáneo,
    - permitir ventas reales repetidas hechas poco después.

### Resultado esperado después del ajuste
- Si el vendedor toca `Confirmar` dos veces casi al mismo tiempo:
  - debe quedar una sola venta.
- Si el vendedor hace una segunda venta legítima al mismo cliente/producto:
  - debe guardarse también,
  - debe verse en `Ventas Ruta`,
  - y el stock debe descontarse coherentemente con ambas ventas visibles.
- Ajuste posterior solicitado por operación:
  - cuando el cliente ya tiene una venta en el día, la app ya no debe invitar a `Continuar` con otra venta.
  - en `AP GUERRERO/components/Ventas/VentasScreen.js` la alerta ahora ofrece:
    - `Cancelar`
    - `Editar venta`
  - objetivo:
    - empujar una sola venta por cliente por día,
    - reducir duplicados operativos,
    - y usar la edición como camino principal si necesitan corregir algo.

### Validación técnica
- `python3 manage.py check` OK después del cambio backend.

### Ajuste adicional en CRM Web (`Ventas Ruta`)
- Archivo: `frontend/src/components/rutas/ReporteVentasRuta.jsx`
  - se eliminó el botón de impresora de la tabla principal de `Ventas Ruta`.
  - se eliminó el botón `Imprimir Ticket` del modal de detalle.
  - el modal ahora muestra explícitamente:
    - `Ticket: #<id_venta>`
- Lectura operativa:
  - el módulo queda enfocado en consulta/auditoría,
  - no en reimpresión desde web.

### Validación técnica
- frontend compiló bien con `npm run build`.

---

## 🔄 App Guerrero + Backend - Refresh automático de stock y tope contra Cargue (20 Mar 2026)

### Problema operativo detectado
- Había dos riesgos distintos:
  - la app podía quedar con `stockCargue` viejo si desde la web agregaban mercancía o ajustaban cargue mientras el vendedor ya estaba trabajando;
  - el backend todavía no frenaba explícitamente una venta que superara el stock real restante del `Cargue`.
- En campo eso se veía así:
  - la app mostraba que aún había unidades,
  - pero físicamente ya no había producto,
  - o el vendedor terminaba reportando ventas por encima de lo que llevaba.

### Ajuste en App Guerrero
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
  - la anulación devuelve stock usando la misma resolución robusta de nombre que la edición.
  - después de anular, la app hace una reconciliación silenciosa contra backend.
  - se agregó refresh automático del stock:
    - cuando la app vuelve al frente (`AppState = active`)
    - y cada `45s` mientras el turno esté abierto
- Objetivo:
  - que el vendedor no dependa solo de arrastrar manualmente para ver cambios de cargue/adicional hechos desde web.

### Ajustes adicionales en App Guerrero
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
  - cuando el cliente ya tiene una venta en el día, la alerta ya no ofrece `Continuar`.
  - ahora ofrece:
    - `Cancelar`
    - `Editar venta`
  - objetivo:
    - empujar una sola venta por cliente por día,
    - reducir duplicados operativos,
    - y usar edición como camino principal si necesitan corregir una venta ya hecha.
- Archivo: `AP GUERRERO/components/Ventas/DevolucionesVencidas.js`
  - se agregó estado `guardando` para bloquear doble toque al registrar vencidas.
  - mientras toma foto o procesa `Guardar`, el modal muestra:
    - `Guardando...` o `Registrando...`
    - `spinner`
  - y desactiva temporalmente:
    - `Guardar`
    - `Cancelar`

### Aclaración importante del flujo de vencidas
- En flujo normal de venta:
  - el modal `Vencidas` no envía nada todavía al backend.
  - solo prepara:
    - `productos_vencidos`
    - `foto_vencidos`
  - esos datos se envían después junto con la venta al hacer `Completar venta`.
- Solo en `modoSoloRegistro`:
  - las vencidas sí se registran directamente al backend sin esperar una venta.

### Blindaje definitivo en backend
- Archivo: `api/views.py`
  - `VentaRutaViewSet` ahora valida por producto contra el `CargueIDx` antes de crear o editar.
  - La regla aplicada es:
    - `disponible = max(0, total - vendidas)`
  - Si la venta intenta superar ese disponible:
    - responde `400`
    - código: `STOCK_CARGUE_INSUFICIENTE`
    - e incluye detalle por producto
- También cubre estos casos:
  - producto que no existe en el cargue del día para ese `ID`
  - edición de venta que intenta aumentar cantidades por encima del restante real

### Comportamiento esperado
- Si el vendedor lleva `300`, el backend no debe permitir reportar más de `300` en total.
- Si la app quedó con stock viejo pero el backend ya no tiene disponible:
  - la venta se rechaza,
  - evitando que entre una reportería imposible.
- Esto no debe romper ventas válidas repetidas al mismo cliente:
  - el control es por stock restante del cargue,
  - no por cliente ni por negocio.

### Validación técnica
- `python3 manage.py check` OK después del ajuste backend.

---

## 📦 Ventas Ruta - `Control de Stock` por ID (20 Mar 2026)

### Objetivo operativo
- Complementar `Ventas del Día` con una vista read-only de monitoreo por `ID`.
- La idea no es reemplazar la auditoría, sino permitir seguimiento más en vivo de:
  - con cuánto salió el vendedor,
  - cuánto ha vendido,
  - cuánto ha reportado como vencida,
  - cuánto saldo teórico le queda,
  - y si ya existen devoluciones físicas registradas al cierre.

### Implementación backend
- Archivo: `api/views.py`
  - se agregó el endpoint `control_stock_tiempo_real(request, id_vendedor, fecha)`.
  - fuente de verdad:
    - `CargueIDx` del vendedor/fecha ya sincronizado con ventas y vencidas.
  - respuesta por producto:
    - `salio_con = cantidad - dctos + adicional`
    - `vendidas`
    - `vencidas`
    - `saldo_teorico = salio_con - vendidas - vencidas`
    - `devoluciones`
    - `diferencia_cierre = saldo_teorico - devoluciones`
  - también retorna:
    - `totales`
    - bandera `cerrado` si ya hay devoluciones registradas
- Archivo: `api/urls.py`
  - nuevo endpoint:
    - `GET /api/cargue/control-stock/<id_vendedor>/<fecha>/`

### Implementación frontend
- Archivo: `frontend/src/services/rutasService.js`
  - nuevo método:
    - `obtenerControlStockRuta(vendedorId, fecha)`
- Archivo: `frontend/src/components/rutas/ReporteVentasRuta.jsx`
  - inicialmente se planteó como pestaña nueva, pero quedó mejor integrado en la misma fila de acciones de `Ventas de Ruta (App Móvil)`.
  - ahora se abre desde el botón:
    - `Stock`
    - ubicado al lado de `Recargar` y `Anuladas`
  - usa los mismos filtros de fecha + vendedor/ID que `Ventas del Día`
  - comportamiento:
    - exige seleccionar un `ID`
    - abre un modal read-only con el resumen y el detalle por producto
    - carga KPIs de resumen:
      - `Salió Con`
      - `Vendidas`
      - `Vencidas`
      - `Saldo Teórico`
      - `Dev. Físicas`
    - tabla por producto con columnas:
      - `Producto`
      - `Salió Con`
      - `Vendidas`
      - `Vencidas`
      - `Saldo Teórico`
      - `Dev. Fís.`
      - `Estado`
  - reglas visuales del estado:
    - `Sobre reportado X` si el saldo teórico queda negativo
    - `Cierre OK` si devoluciones coincide con saldo teórico
    - `Descuadre X` si ya hay devoluciones pero no cuadran
    - `Agotado` si el saldo teórico es `0`
    - `En ruta` si hay movimiento pero aún no cierre
    - `Sin movimiento` si el producto sigue intacto
- Archivo: `frontend/src/components/rutas/ReporteVentasRuta.css`
  - estilos nuevos para KPIs, tabla y layout del modal
  - el layout visual se cerró así:
    - en escritorio el cuadro quedó ligeramente cargado a la derecha, como pidió operación
    - en tablet se aplica una regla específica para que el modal quede visualmente centrado / balanceado y no se vea corrido a la izquierda
    - se redujo el ancho del modal para que no se sintiera tan invasivo

### Decisión de diseño importante
- Este control **no** bloquea ventas ni reemplaza la lógica de seguridad.
- El control real para no vender de más sigue siendo:
  - app con refresh automático de stock
  - backend validando contra `Cargue`
- `Control de Stock` es una vista de monitoreo operativo, no una fuente alterna de verdad.

### Validación técnica
- `python3 manage.py check` OK
- `npm run build` OK

### Hallazgo adicional en pruebas App Guerrero
- Se detectó un rebote visual al cancelar desde el modal de edición de venta: el historial/reimpresión podía reabrirse mostrando resumen en `$0` y `0 transacciones`, aunque al salir y volver a entrar las ventas sí aparecían.
- Conclusión: no parecía problema de internet sino de estado local del historial.
- Se verificó que las 3 salidas del modal de edición ya quedaron forzando recarga del historial:
  - `onRequestClose`
  - botón `X`
  - botón `Cancelar`
- En las 3 rutas ahora se ejecuta nuevamente:
  - `setMostrarHistorialVentas(true)`
  - `cargarHistorialReimpresion()`
- La prueba correcta para confirmar el fix es: recargar Expo, abrir historial, entrar a editar una venta y cancelar; el historial debe volver con datos reales y no con resumen en cero.

---

---

## Operacion Produccion - Nota Transitoria (27 Feb 2026)

- Se detectó en VPS (caso ID5, 26/02/2026) múltiples `400` en `POST /api/ventas-ruta/` por validación de `foto_vencidos` durante reintentos offline.
- Se aplicará hotfix transitorio backend para tolerar payload legacy de `foto_vencidos` y no bloquear sincronización de ventas.
- Migraciones `0090` a `0094` quedan pendientes para despliegue nocturno cuando todos los vendedores estén en APK nueva.

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


## Linea Base Buena - Ventas y Sugeridos (20 Mar 2026)

### Contexto
- Durante las pruebas finales de `AP GUERRERO` se detectaron dos regresiones visuales/operativas:
  - en `VentasScreen`, el teclado volvió a empujar la pantalla al tocar cantidades en modo `scroll`.
  - en el modal de edición de venta, el bloque de `Sugeridos` se sintió alterado respecto al comportamiento histórico bueno.
- Para cerrar rápido la brecha se comparó el código actual contra un repositorio de referencia que el usuario confirmó como `bueno`.

### 1. VentasScreen - Base correcta del teclado / scroll
- Archivos base:
  - `AP GUERRERO/components/Ventas/VentasScreen.js`
  - `AP GUERRERO/app.json`
- La línea base buena quedó así:
  - `listaContentNormal.paddingBottom = 260`
  - `listaContentConTeclado.paddingBottom = 220`
  - `softwareKeyboardLayoutMode = "resize"`
- Esta combinación quedó confirmada en pruebas como la referencia válida del flujo de ventas y sugeridos.
- Si vuelve a aparecer el empuje del contenido al tocar cantidades, esta es la primera comparación que se debe hacer.
- También se confirmó que en modo `scroll` siguen vigentes estas reglas:
  - no hacer scroll automático agresivo al enfocar cantidad
  - no usar empuje manual del bloque superior en venta normal
  - el `FlatList` mantiene el colchón inferior como defensa principal

#### 🔧 Cómo arreglar si el teclado vuelve a empujar el contenido (30 Mar 2026)

**Commit de referencia bueno**: `61a1490` (25-03-2026)

**Configuración correcta que NO empuja el contenido**:

1. **`app.json`**:
   ```json
   "softwareKeyboardLayoutMode": "resize"
   ```

2. **`VentasScreen.js` - Función `preAjusteListaAntesDeTecladoCantidad`**:
   ```javascript
   const preAjusteListaAntesDeTecladoCantidad = useCallback((index) => {
       // NO hacer nada - dejar que el usuario haga scroll manual si es necesario
       return;
   }, []);
   ```
   ✅ Esta función debe estar DESACTIVADA (solo return)

3. **`VentasScreen.js` - Listener `keyboardDidShow`**:
   ```javascript
   // 🔧 DESACTIVADO: NO empujar nada en lista principal
   // if (focoCantidadPrincipal) {
   //     empujarSoloListaCantidad(indiceCantidadEnFocoRef.current, altura);
   //     actualizarCompensacionBloqueSuperior();
   //     iniciarCompensacionAnimada(760);
   // }
   ```
   ✅ Las funciones de empuje deben estar COMENTADAS

4. **`VentasScreen.js` - Funciones auxiliares**:
   - `asegurarVisibilidadInputCantidad`: Puede estar activa, hace scroll DENTRO del FlatList (no empuja header)
   - `empujarSoloListaCantidad`: Puede estar activa, solo hace nudge suave si es necesario
   - `preAjusteListaAntesDeTecladoCantidad`: DEBE estar desactivada (solo return)

**Regla de oro**: 
- `softwareKeyboardLayoutMode: "resize"` + funciones de empuje desactivadas = teclado NO empuja contenido
- El FlatList con `paddingBottom: 260/220` es la defensa principal
- El usuario hace scroll manual si necesita ver productos debajo del teclado

**Si se rompe**: Comparar contra commit `61a1490` y restaurar estas configuraciones.

### 2. Sugeridos en edición - Base correcta del bloque visual
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- El bloque `productosSugeridosEdicion` quedó restaurado a un render simple del repo bueno:
  - nombre del producto
  - precio
  - botón `Agregar`
- Se retiró la capa extra que se había metido dentro de ese bloque para mostrar:
  - `Stock X`
  - `Sin stock`
  - deshabilitado visual del botón dentro del propio listado de sugeridos
- Conclusión: el daño percibido en `Sugeridos` no venía del módulo clásico de sugeridos, sino de ajustes colaterales en el modal de edición de ventas.

### 3. Modulo clasico de Sugeridos - Confirmado sano
- Se compararon estos archivos contra el repo bueno y quedaron equivalentes:
  - `AP GUERRERO/components/ProductList.js`
  - `AP GUERRERO/components/Product.js`
- No se detectó divergencia útil en esos dos archivos.
- Por tanto, si `Sugeridos` vuelve a sentirse raro, primero revisar:
  - caché de Expo
  - cambios colaterales alrededor del flujo de ventas/edición
  - no asumir de entrada que `ProductList.js` o `Product.js` están dañados

### 4. Regla operativa para futuras regresiones
- Si vuelve a romperse `Ventas` o `Sugeridos`, comparar primero contra esta línea base:
  - `VentasScreen.js`
    - `listaContentNormal = 260`
    - `listaContentConTeclado = 220`
    - render simple de `productosSugeridosEdicion`
  - `app.json`
    - `softwareKeyboardLayoutMode = "resize"`
  - `ProductList.js` y `Product.js`
    - tomarlos como sanos salvo evidencia contraria
- Esto evita sobrecorregir y tocar módulos que en realidad no estaban dañados.

**Última actualización global**: 20 de Marzo de 2026

## 🧾 App Guerrero - Flujo Final Editar Venta + Vencidas (20 Mar 2026)

### Objetivo operativo
- Se confirmó como flujo final que las vencidas olvidadas **no** se adjuntan desde una alerta separada de `Cliente con venta`.
- La ruta correcta quedó así:
  - entrar a `Editar venta`
  - usar CTA roja `Adjuntar vencidas`
  - volver al modal de edición
  - guardar una sola vez la edición completa
- Motivo:
  - es más coherente para el vendedor,
  - evita abrir un subflujo paralelo,
  - y deja todo asociado a la misma venta ya existente.

### App móvil - UX final en edición
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- En el modal `Editar venta` quedó un CTA rojo `Adjuntar vencidas` al lado del título.
- Ese CTA muestra badge numérico con el total de vencidas adjuntas en la edición.
- El flujo quedó así:
  - abre el mismo modal `DevolucionesVencidas`
  - permite adjuntar cantidades y fotos
  - vuelve al modal de edición conservando los datos
  - al pulsar `Guardar edición` envía juntos:
    - `detalles`
    - `metodo_pago`
    - `productos_vencidos`
    - `foto_vencidos`
- El ticket reimpreso debe tomar vencidas desde:
  - `venta.vencidas`
  - o fallback `venta.productos_vencidos`

### Modal de vencidas - mejoras finales
- Archivo: `AP GUERRERO/components/Ventas/DevolucionesVencidas.js`
- Se agregó validación de stock **antes** de abrir cámara o terminar guardado.
- La alerta previa quedó con opciones:
  - `Cancelar`
  - `Continuar`
- Esto aplica tanto en:
  - venta normal
  - edición de venta
- También se añadió una línea informativa por producto:
  - `Stock disponible: X`
- Ese dato se calcula desde `VentasScreen.js` y se pasa al modal para que refleje el contexto real:
  - venta normal: stock restante descontando lo que ya está en el carrito actual
  - edición: stock restante considerando venta original + vencidas originales + nueva edición

### Backend - edición con vencidas
- Archivo: `api/views.py`
- La edición de `VentaRuta` quedó aceptando y persistiendo:
  - `productos_vencidos`
  - `foto_vencidos`
- Al editar una venta con vencidas:
  - ajusta `vencidas` en `CargueIDx`
  - recalcula `total/neto` del cargue con `recalcular_totales_cargue_queryset()`
  - guarda evidencia principal y registros en `EvidenciaVenta`
- Fix importante:
  - si el vendedor entra a `Editar venta` y **no cambia los detalles**, pero sí agrega vencidas,
  - el backend ya no vuelve a validar stock de venta como si la venta hubiera cambiado otra vez,
  - evitando el error falso:
    - `La venta supera el stock disponible del cargue.`

### Stock visual después de editar
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó un rebote visual:
  - al guardar edición con vencidas, el stock local se ajustaba bien,
  - pero el `refresh` silencioso automático podía recargar el cargue y devolver temporalmente el stock anterior.
- Fix aplicado:
  - después de guardar una edición con impacto en stock, se bloquea por unos minutos el `refresh` silencioso automático.
- Objetivo:
  - evitar que el vendedor vea el stock correcto por un instante y luego lo vea “rebotar” al valor anterior.
- Este bloqueo solo protege el auto-refresh silencioso; no cambia estilos ni layout.

### Integración visual en web y reimpresión
- Archivo: `frontend/src/components/rutas/ReporteVentasRuta.jsx`
  - debe tomar evidencias también desde `selectedVenta.evidencias` para ventas editadas con vencidas.
- Archivo: `AP GUERRERO/services/printerService.js`
  - la reimpresión debe mostrar vencidas aunque vengan solo en `productos_vencidos`.
- Resultado esperado:
  - al revisar la venta en web se ve badge/registro de vencidas y foto
  - al reimprimir ticket vuelven a salir las vencidas adjuntas

### Validación operativa recomendada
- Caso completo a repetir si vuelve a fallar:
  - abrir una venta ya hecha
  - entrar a `Editar venta`
  - adjuntar vencidas
  - guardar edición
  - revisar stock en app
  - reimprimir ticket
  - revisar detalle de la venta en web
- Si reaparece un rebote de stock, revisar primero:
  - `refrescarStockSilencioso`
  - `cargarStockCargue`
  - ajuste local de `setStockCargue` después de `confirmarEdicionVenta`

**Última actualización global**: 20 de Marzo de 2026

### Ajuste fino - stock visible al filtrar productos
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó que al usar la barra de búsqueda/filtro de productos en `Ventas`, el producto sí aparecía pero el stock no se alcanzaba a percibir bien.
- Solución final adoptada:
  - mantener el stock visible también durante el filtrado,
  - pero **sin** agrandar la card del producto.
- Implementación final:
  - el stock quedó en el mismo renglón del precio:
    - `Precio: ...  Stock: X`
  - se resaltó visualmente para que siga siendo legible incluso en resultados filtrados.
- Decisión importante:
  - no dejar el stock en una línea aparte, porque eso aumenta la altura de cada card y cambia demasiado la densidad visual del listado.


### Fix - cliente con venta debe abrir la venta correcta y bloquear segunda edición
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó un caso donde el alert de `Cliente con Venta` tomaba una coincidencia vieja del cliente en lugar de la venta más reciente.
- Efectos del bug:
  - permitía entrar otra vez a `Editar venta` aunque la venta ya hubiera sido editada desde el historial/modal de impresión
  - cargaba cantidades antiguas en el modal (por ejemplo, productos con cantidades previas a la edición real)
- Solución aplicada:
  - se creó un selector único de `ventaPrevia` que combina `ventasDelDia` + `ventasBackendDia`
  - prioriza:
    - venta ya modificada
    - venta persistida en backend
    - venta con timestamp más reciente (`fecha_ultima_edicion`, `fecha_actualizacion`, `fecha`)
- Refuerzo adicional:
  - al abrir `Editar venta`, si la venta es de backend, primero se refresca el detalle completo desde `/api/ventas-ruta/<id>/`
  - solo después de eso se decide si la venta ya fue modificada y debe bloquearse
- Resultado esperado:
  - si la venta ya fue editada una vez, el usuario vuelve a ver el bloqueo correcto de `ya fue modificada`
  - si la venta todavía es editable, el modal abre con los detalles reales más recientes y no con cantidades viejas

### Fix - venta rápida debe volver al cliente anterior de ruta
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó un caso de UX donde, si el vendedor estaba parado en un cliente de ruta y abría `Venta rápida / Cliente ocasional`, al terminar la venta el flujo común lo mandaba al primer cliente de la lista.
- Causa:
  - al finalizar la venta rápida, el cliente seleccionado seguía siendo el ocasional
  - luego `avanzarAlSiguienteCliente(...)` no encontraba ese cliente en `clientesOrdenDia`
  - y caía al primer cliente como fallback
- Solución aplicada:
  - se guarda en `clienteAntesVentaRapidaRef` el cliente de ruta activo antes de abrir la venta rápida
  - al cerrar/imprimir/enviar la venta rápida, el flujo restaura ese cliente anterior en lugar de avanzar al primero
- Resultado esperado:
  - la venta rápida se completa normal
  - pero el vendedor vuelve a quedar parado en el cliente de ruta donde estaba trabajando
  - no se rompe el orden del día ni se pierde el contexto operativo

### Fix - Ventas debe recordar el último cliente al reingresar
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó un problema operativo: si el vendedor estaba trabajando un cliente, salía de `Ventas` o cerraba la app, y luego volvía a entrar, la pantalla regresaba a `Seleccionar cliente` en lugar de retomar el punto donde iba.
- Causa real:
  - el último cliente sí se guardaba en `AsyncStorage`
  - pero al restaurar el turno, `cargarDatos()` consultaba esa referencia usando una fecha que aún no siempre coincidía con la fecha operativa restaurada del turno
  - por eso no encontraba la llave correcta y caía al estado vacío
- Solución aplicada:
  - se guarda el último cliente por `vendedor + fecha operativa`
  - `cargarDatos(fechaObjetivo)` ahora recibe explícitamente la fecha exacta del turno restaurado (`date` / `fechaTurno`)
  - si el cliente existe en la lista local, se reconstruye desde esa lista
  - si no existe en la lista local, se restaura directamente desde el objeto guardado
- Resultado esperado:
  - si el vendedor sale a almorzar o cierra la app y luego vuelve a `Ventas`, queda parado en el último cliente donde estaba trabajando
  - no tiene que volver a abrir `Seleccionar cliente` y buscarlo manualmente entre toda la ruta
  - al cerrar turno, esa referencia se limpia para no arrastrarse a otro día


### Fix - Confirmar Entrega debe mantener layout estable
- Archivo: `AP GUERRERO/components/Ventas/ConfirmarEntregaModal.js`
- Se detectó un colapso visual intermitente del modal de `Confirmar Entrega`: a veces abría completo y otras veces reaparecía casi solo con header y botones.
- Causa probable:
  - el `ScrollView` y el footer competían por altura dentro de un contenedor con `maxHeight`, y en reaperturas Android reciclaba la medición.
- Solución aplicada:
  - se dejó una altura mínima del modal
  - se separó mejor el cuerpo scrolleable del footer fijo
  - se añadió `contentContainerStyle` estable al `ScrollView`
- Ajuste adicional:
  - el texto de precio unitario en el detalle del pedido quedó sin decimales (`$3.200` en vez de `$3200.00`).

### Fix - cliente restaurado con pedido debe re-chequear pedidos al volver a Ventas
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó que, al reingresar a `Ventas`, la app sí restauraba el último cliente pero a veces lo mostraba como `Sin pedido` hasta que el usuario volvía a tocar manualmente ese mismo cliente.
- Causa:
  - `seleccionarClienteDirecto(cliente)` corría `verificarPedidoCliente(cliente)` inmediatamente,
  - pero en algunos casos `pedidosPendientes` todavía no había terminado de cargar del backend.
- Solución aplicada:
  - se agregó una revalidación automática cuando cambian `pedidosPendientes`
  - si ya hay `clienteSeleccionado`, se vuelve a ejecutar `verificarPedidoCliente(clienteSeleccionado)`.
- Resultado esperado:
  - al volver a entrar a `Ventas`, si el último cliente tenía pedido pendiente, ese pedido aparece sin necesidad de re-seleccionar el cliente.

### Fix - entregar pedido online debe dejar estado entregado y avanzar al siguiente cliente
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó que en la rama online del flujo `confirmarEntregaPedido` el backend sí marcaba el pedido como entregado, pero la UI local no siempre:
  - lo agregaba a `pedidosEntregadosHoy`
  - lo marcaba como `ENTREGADO` en `pedidosPendientes`
  - limpiaba `pedidoClienteSeleccionado`
  - avanzaba al siguiente cliente.
- Efectos visibles:
  - el pedido podía seguir apareciendo para entregar otra vez al volver al mismo cliente
  - no siempre saltaba automáticamente al siguiente cliente.
- Solución aplicada:
  - la rama online quedó alineada con la rama offline
  - ahora actualiza estado local + limpia selección + llama `avanzarAlSiguienteCliente(...)`.

### Mejora - restaurar turno offline sin esperar todos los reintentos remotos
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó una espera molesta en `Verificando turno...` al volver a entrar a `Ventas`, aun cuando ya existía un turno local reciente en `AsyncStorage`.
- Causa:
  - `verificarTurnoActivo()` hacía hasta `3` intentos remotos con timeout de `5s` antes de restaurar el turno offline.
- Solución aplicada:
  - si la verificación falla por timeout o red y ya existe un turno local reciente, la app lo restaura inmediatamente
  - no espera a consumir los 3 intentos completos.
- Resultado esperado:
  - menos tiempo congelado en `Verificando turno...`
  - fallback offline mucho más rápido cuando el problema es conectividad intermitente.

### Estado actual - qué queda realmente disponible offline al abrir turno
- Archivo principal observado: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Con el estado actual del código, sí queda persistido/localmente:
  - `@turno_activo_<userId>`: turno abierto y fecha operativa
  - caché de clientes de ruta por vendedor/día (`precargarClientesEnCache`)
  - stock/catálogo local de productos (`productos_cache` + `cargarStockCargue`)
  - ventas locales y cola offline de sincronización (`ventas`, `ventas_pendientes_sync`)
  - acciones offline sobre pedidos (`pedidos_acciones_pendientes`), por ejemplo entregar o marcar novedades sin internet.
- Pero **no** existe hoy una caché persistente equivalente de `pedidosPendientes` ya descargados.
- Implicación práctica:
  - si el turno ya estaba abierto y luego se va internet, el vendedor puede seguir vendiendo y las acciones sobre pedidos pueden quedar en cola offline
  - pero si reabre `Ventas` sin internet, los pedidos pendientes pueden no verse de inmediato hasta que vuelva la conexión y `verificarPedidosPendientes()` logre consultar backend.
- Recomendación operativa actual:
  - se puede dejar así si en producción los IDs casi siempre tienen internet
  - si más adelante se quiere blindar totalmente pedidos offline, el siguiente paso sería cachear también el snapshot de `pedidosPendientes` por `vendedor + fecha`.


### Fix - clientes de ruta no deben heredar listas viejas de precios al restaurarse
- Archivo: `AP GUERRERO/components/Ventas/VentasScreen.js`
- Se detectó un caso donde un cliente de ruta sin lista vigente podía terminar vendiéndose con precio especial por arrastre de datos guardados (`lista_precio_nombre` / `tipo_lista_precio`) desde una sesión previa.
- Caso que permitió detectarlo:
  - `EL REPOLLO` no tenía lista activa en backend/serializer
  - pero apareció una venta con precio de lista (`DOMICILIOS`) en la app.
- Causa:
  - al restaurar o recombinar un cliente, el código podía priorizar datos persistidos de `ultimoCliente`/`clientePre` sobre el cliente fresco traído de la ruta.
- Solución aplicada:
  - si existe cliente fresco de ruta, prevalece siempre su lista actual del backend
  - ya no se reinyectan listas viejas guardadas sobre un cliente que hoy viene sin lista
  - solo si no existe cliente fresco se restaura lo mínimo del cliente guardado.
- Resultado esperado:
  - los clientes normales de ruta se quedan con `Precio Cargue/App`
  - solo los clientes que realmente traigan una lista válida siguen aplicando precio especial.


### Mejora visual - botón amarillo de precio especial en Cargue
- Archivo: `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- Se agregó una alerta **solo visual** para casos esporádicos donde una venta se hizo por encima de `Precio Cargue/App`.
- Ubicación solicitada:
  - en la barra superior de `Cargue`, inmediatamente después del botón `📱 Ventas`.
- Condición de aparición:
  - solo aparece si existe `datosResumen.novedad`
  - y además se detectó al menos una venta con diferencia positiva frente a `Precio Cargue/App`.
- Qué hace:
  - muestra un botón amarillo `💰 Precio especial`
  - al tocarlo abre un modal informativo con:
    - cliente
    - número de venta
    - total real vendido
    - total equivalente a `Precio Cargue/App`
    - diferencia total
    - desglose por producto cuando aplica.
- Importante:
  - no modifica backend
  - no altera `total_despacho`, `venta`, auditoría ni stock
  - solo sirve para que el usuario identifique rápido qué venta tuvo precio especial y cuánto extra debe tener presente al cobrar/revisar.

### Ajuste web - Informe de Pedidos más rápido y más limpio
- Archivos:
  - `frontend/src/pages/InformePedidosScreen.jsx`
  - `frontend/src/components/Pedidos/Topbar.jsx`
- Se hizo un paquete quirúrgico solo para la vista web de `Informes de Pedidos`, sin tocar backend ni la app móvil.
- Cambios aplicados en `InformePedidosScreen.jsx`:
  - el rango inicial por defecto ya no carga desde el día 1 del mes
  - ahora abre solo con los últimos `3` días para acelerar la consulta inicial en VPS
  - los filtros `Desde/Hasta` siguen libres para buscar cualquier otra fecha manualmente
  - el formato de `TOTAL` quedó sin decimales
  - se corrigió el formateo para convertir primero el valor a número, porque varios totales llegaban como string y seguían mostrando `.00`
  - se ajustó solo la tabla de esta pantalla para que se vea completa y no se estire raro en producción
  - se dieron anchos específicos a columnas y se permitió wrap en columnas largas (`Destinatario`, `Vendedor`, `Dirección`)
  - se afinó la separación visual entre `ESTADO` y `TOTAL`
  - la columna `TOTAL` quedó con aire suficiente para montos grandes pero sin verse demasiado separada.
- Cambio aplicado en `Topbar.jsx`:
  - se retiró el botón `Historial`
  - se mantuvieron intactos `Informes de Pedidos` y `Gestionar`
  - no se alteró el layout general del topbar.
- Objetivo logrado:
  - mejorar velocidad inicial de carga
  - dejar la tabla más legible en VPS
  - limpiar la interfaz sin romper estilos de otras pantallas de `Pedidos`.

### Fix backend - Informe de Pedidos lento en VPS por filtros ignorados
- Archivo: `api/views.py`
- Problema detectado:
  - al abrir `Informes de Pedidos` en producción, la pantalla tardaba demasiado cargando
  - aunque el frontend ya enviaba un rango corto por defecto (`últimos 3 días`), el backend seguía devolviendo muchísimos pedidos.
- Causa real:
  - el frontend consultaba `/api/pedidos/` con `fecha_inicio` y `fecha_fin`
  - pero `PedidoViewSet.get_queryset()` estaba leyendo `fecha_desde` y `fecha_hasta`
  - resultado: el filtro inicial se ignoraba y el endpoint devolvía prácticamente todo el histórico.
- Solución aplicada:
  - `PedidoViewSet` ahora acepta ambos nombres:
    - `fecha_desde` / `fecha_hasta`
    - `fecha_inicio` / `fecha_fin`
  - además se agregó `prefetch_related('detalles__producto', 'evidencias')` para reducir consultas extra al serializar la lista.
- Impacto esperado:
  - el VPS ya no debe traer todo el histórico al entrar a `Informes de Pedidos`
  - la carga inicial debe bajar notablemente al respetar el rango corto enviado por frontend.
- Riesgo:
  - bajo
  - no cambia creación, anulación ni entrega de pedidos
  - solo corrige el filtrado y optimiza la consulta del listado.

## Mejora web - Informe de Pedidos con busqueda global sin romper carga rapida
- Se mantuvo la carga inicial rapida de `Informe de Pedidos` en ultimos 3 dias para no volver lenta la pantalla.
- Se agrego una busqueda global util para validacion puntual: si el usuario escribe `N° pedido`, cliente o vendedor y pulsa `Consultar`, el frontend consulta por `search` al backend y ya no esconde el resultado por rango de fecha.
- Esto sirve como respaldo cuando quieren confirmar si un pedido ya fue montado aunque quede fuera del rango inicial visible.
- Flujo operativo recomendado sigue siendo:
  - si la encargada monta pedido para hoy/manana, normalmente revisar por fecha en `Cargue` o en `Informe de Pedidos`
  - si hay duda puntual y no aparece por rango, usar el buscador global por cliente o numero de pedido
- Archivos tocados para esta mejora:
  - `frontend/src/pages/InformePedidosScreen.jsx`
  - `api/views.py` (`PedidoViewSet` acepta `search` por `numero_pedido`, `destinatario`, `vendedor`)

## Ajuste final - Fecha por defecto en Pedidos vs fecha heredada desde Gestion
- Se detecto una confusion entre dos flujos distintos de `Pedidos`:
  - si el usuario entra a `Remisiones` de forma suelta, la fecha por defecto debe ser la fecha real de hoy
  - si el usuario entra desde `Gestion de Pedidos` y toca un cliente de una fecha ya seleccionada, la remision si debe heredar esa fecha de gestion
- Solucion final aplicada en `frontend/src/pages/PedidosScreen.jsx`:
  - se mantiene fecha real de hoy como default general
  - pero si viene `clienteParam` desde Gestion de Pedidos con `clienteData.fecha`, esa fecha si se respeta
  - ya no se usa la `fecha` de la URL para pisar automaticamente la fecha cuando se entra a `Remisiones` sin cliente
- Resultado esperado:
  - `Gestion de Pedidos -> cliente -> Remisiones`: conserva la fecha de trabajo de la gestion
  - `Remisiones` abierto sin cliente/contexto: arranca en la fecha real de hoy


## Tarea pendiente - Carga ocasional de imagenes en Pedidos
- Se observo que en `Remisiones` / `Pedidos`, a veces las tarjetas del catalogo aparecen rapido pero algunas imagenes tardan un poco en cargar, sobre todo al volver desde pantallas mas pesadas como `Informe de Pedidos`.
- Diagnostico actual:
  - la UI/card renderiza bien
  - el retraso parece estar solo en la resolucion/carga de imagenes
  - `Pedidos` depende de `product.image`, cache en memoria e `IndexedDB`
  - `POS` tiene un comportamiento mas estable porque si usa precarga de imagenes
  - `Pedidos` hoy no reutiliza esa misma precarga
- Conclusion:
  - no parece un bug critico ni un problema de datos
  - si el retardo es corto y ocasional, se puede dejar asi por ahora
- Mejora futura sugerida:
  - evaluar que `Pedidos` use la misma estrategia de precarga de imagenes que `POS`, para hacer mas estable la carga visual del catalogo.


## Ajuste visual - Cargue escritorio con columnas mas compactas
- Se ajusto solo la vista de escritorio de `Cargue` para aprovechar mejor el ancho de la tabla sin afectar tablet.
- Archivo tocado:
  - `frontend/src/components/Cargue/PlantillaOperativa.css`
- Cambios aplicados:
  - columna `PRODUCTOS` reducida en escritorio de `24rem/28rem` a `16rem/18rem`
  - columna `LOTES VENCIDOS` reducida en escritorio de `10rem` a `7.5rem`
- Consideraciones:
  - no se toco logica
  - no se cambio el comportamiento del boton `+ Lote`
  - no se modifico el bloque responsive de tablet, que ya tenia sus propias reglas
- Objetivo:
  - hacer la tabla de `Cargue` mas compacta en escritorio
  - liberar espacio horizontal para el resto de columnas sin desordenar la interfaz.


## Ajuste UX - Resalte manual de fila en Cargue
- Se agrego un modo visual `Resaltar fila` en `Cargue` para identificar con claridad la fila activa durante la revision.
- Archivos tocados:
  - `frontend/src/components/Cargue/TablaProductos.jsx`
  - `frontend/src/components/Cargue/PlantillaOperativa.css`
- Comportamiento final:
  - el modo queda desactivado por defecto al entrar
  - al activarlo aparece una fila activa con borde azul oscuro `#052c65` y fondo azul grisaceo suave
  - la fila activa se mueve tanto con click del mouse como con navegacion por flechas dentro de los inputs
  - cuando el modo esta activo, se deshabilita el hover visual normal para que no compita con el resalte azul
  - cuando el modo esta desactivado, vuelve el hover normal de la tabla
- Alcance:
  - funciona en escritorio
  - tambien se habilito en tablet con un boton mas compacto
  - no se altero la logica de datos ni el layout general de la tabla
- Objetivo:
  - facilitar la lectura y seguimiento de la fila que se esta revisando en `Cargue` sin depender solo del hover momentaneo.

## Fix web + app - Tope diario de clientes ocasionales
- Fecha de trabajo: 2026-03-23
- Archivos tocados:
  - `frontend/src/components/rutas/GestionRutas.jsx`
  - `AP GUERRERO/components/Ventas/VentasScreen.js`
- Problema reportado:
  - en web, el input `Tope de Venta (Diario)` de `Clientes Ocasionales` no dejaba editar/reemplazar el numero con fluidez
  - en app, al cambiar el tope desde web, `Ventas` podia seguir validando con un tope anterior si el vendedor ya estaba dentro de la pantalla
- Ajuste aplicado en web (`GestionRutas.jsx`):
  - el input del tope quedo con estado local propio (`topeVentaRutaInput`)
  - ahora permite seleccionar todo, borrar y escribir el nuevo valor sin que el control lo reescriba mientras el usuario edita
  - al guardar (`onBlur`), el tope ya no se aplica solo a la ruta seleccionada: se replica a todas las rutas del mismo vendedor para mantener coherencia con la lectura que hace la app
- Ajuste aplicado en app (`VentasScreen.js`):
  - `verificarFlagsRuta()` sigue consultando `/api/rutas/?vendedor_id=...`
  - la app ahora toma el tope mas alto disponible entre las rutas del vendedor consultadas en ese momento
  - antes de bloquear una venta ocasional, `Ventas` vuelve a refrescar la configuracion de ruta para intentar usar el tope mas reciente del backend
- Regla funcional final en linea:
  - la venta ocasional se valida antes de guardar
  - si `ventas ocasionales previas del dia + venta nueva > tope`, la app bloquea la venta
  - si no supera el tope, la venta si se deja completar
- Comportamiento de refresco del tope:
  - si el tope se cambia en web y el vendedor vuelve a abrir `Ventas` o reingresa al flujo de `Venta rapida`, la app consulta de nuevo y toma el valor actualizado
  - si el vendedor ya estaba dentro de `Ventas` y no hubo refresco de esa configuracion, puede seguir operando temporalmente con el tope que ya tenia cargado en esa sesion
- Consideracion offline:
  - si la app alcanzo a sincronizar la ruta en esa sesion antes de quedarse sin internet, puede seguir usando ese tope en memoria
  - si la app arranca ya offline y no pudo consultar la ruta, no se garantiza que vea el ultimo tope cambiado en web
  - hoy no existe persistencia formal del `ultimo tope sincronizado` en `AsyncStorage`; el comportamiento offline depende de lo que ya se haya cargado en la sesion activa
- Recomendacion operativa:
  - si se va a subir o bajar el tope, preferir hacerlo en momentos controlados (idealmente en la noche o cuando el vendedor no este operando dentro de `Ventas`)
  - despues del cambio, pedir al vendedor salir y volver a entrar a `Ventas` para asegurar que el ID refresque el tope nuevo
  - si se baja el tope mientras el vendedor sigue dentro de `Ventas` y no refresca, existe riesgo de que una venta ocasional se valide contra el tope anterior cargado en memoria

## Ajustes quirurgicos - Ventas / Selector / Reimpresion (23 Mar 2026)
- Archivos trabajados:
  - `AP GUERRERO/components/Ventas/VentasScreen.js`
  - `AP GUERRERO/components/Ventas/ClienteSelector.js`
- Problemas detectados en pruebas finales:
  - algunos clientes disparaban alerta de `ya tiene venta` aunque no correspondia a la seleccion actual
  - al seleccionar un cliente con pedido, a veces no aparecia `Pedido #...` en el encabezado superior de `Ventas`
  - el selector de clientes y el boton de reimpresion a veces exigian doble toque
  - si no habia internet, el modal de reimpresion podia quedarse mostrando estado de carga/sincronizacion en vez de caer directo al historial local
  - la ultima venta del historial podia quedar sin boton `Anular` aunque ya tuviera ID real de backend, sobre todo despues de editarla
  - al corregir el doble toque del selector, reaparecio una regresion donde el teclado del buscador podia quedar vivo al volver a `Ventas` y eso reactivaba el empuje visual del contenido
- Ajustes aplicados:
  - `cargarVentasDelDia()` vuelve a refrescar `ventasBackendDia` con la respuesta real del backend para evitar falsos positivos de cliente vendido por datos viejos en memoria
  - `verificarPedidoCliente()` ahora prioriza `cliente.__pedidoVista` cuando la seleccion viene desde una card de pedido, para conservar el numero visible correcto en el encabezado
  - `ClienteSelector.handleSelectCliente()` se simplifico para evitar el flujo de doble toque y el `FlatList` quedo con `keyboardShouldPersistTaps="always"`
  - el selector ahora hace `Keyboard.dismiss()` justo antes de devolver el cliente a `Ventas`; esto cierra el teclado del buscador y evita que la transicion reactive el empuje del contenido en la pantalla principal
  - `abrirHistorialReimpresion()` ahora cierra teclado antes de abrir el modal
  - `avanzarAlSiguienteCliente()` (flechita ▶️ en Ventas) ahora hace `Keyboard.dismiss()` al inicio para evitar que cambiar de cliente con el buscador activo regenere permanentemente el empuje del contenido hacia arriba
  - `verificarPedidoCliente()` ahora unifica los arreglos `pedidosPendientes` y `pedidosEntregadosHoy` para que el pedido local se capture adecuadamente aunque ya esté entregado y el cliente sea seleccionado mediante navegación por flechas.
  - se unificó la UI de `VentasScreen` para que al mostrar un pedido ya entregado, despliegue siempre `✅ Pedido #XXXX - ENTREGADO` y los badges flotantes ("Entregado" en verde o "Pendiente" en naranja) coincidiendo con el diseño del Selector.
  - los botones `Editar` y `Entregar` ahora se inhabilitan visualmente usando `opacity: 0.3` sobre sus colores originales rojos/verdes, logrando un efecto de "deshabilitado suave" sobre el fondo blanco, y cuentan con guards lógicos internos para evitar ejecuciones duplicadas.
  - `cargarHistorialReimpresion()` hace fallback inmediato al historial local si no hay internet, sin esperar backend
  - en las cards del historial, las acciones bloqueadas por `preview/sincronizando` ahora solo se bloquean para ventas realmente locales/sin ID persistido; si la ultima venta ya tiene ID real, mantiene boton `Anular`
- Regla operativa actual confirmada:
  - la linea base buena del teclado sigue siendo la misma documentada antes:
    - `softwareKeyboardLayoutMode = "resize"` en `AP GUERRERO/app.json`
    - `listaContentNormal = 260`
    - `listaContentConTeclado = 220`
  - si vuelve a aparecer el empuje del contenido, revisar primero transiciones donde quede abierto el teclado del selector/buscador antes de asumir que se daño la base de `Ventas`
- Comportamiento esperado despues de este paquete:
  - seleccionar cliente debe responder al primer toque
  - clientes con pedido deben mostrar `Pedido #...` arriba si la card seleccionada correspondia a ese pedido
  - reimpresion offline debe abrir con historial local sin quedarse pegada en `Cargando historial...` o `SINCRONIZANDO...`
  - la ultima venta del historial, si ya fue persistida y luego editada, debe seguir pudiendo anularse

- Ajuste adicional de reimpresion (23 Mar 2026, noche):
  - se detecto un caso nuevo donde una venta recien creada online seguia apareciendo en el historial con su `id local` y por eso no mostraba `Anular`, aunque ya existiera su equivalente en backend
  - causa real: `guardarVenta()` retorna primero la venta local y la sincronizacion ocurre en segundo plano; durante esa ventana, la card del historial puede quedar representando el item local aunque el backend ya la haya recibido
  - solucion quirurgica aplicada en `VentasScreen.js`:
    - se agrego `resolverVentaBackendAsociada(venta)` para mapear una venta local reciente contra su venta backend equivalente usando cliente + total + cercania horaria
    - el boton `Anular` del historial ahora usa esa venta backend asociada cuando existe, en vez de depender solo del `id` presente en la card renderizada
    - el cambio rapido de metodo de pago desde la card tambien usa esa misma resolucion para mantener consistencia
  - alcance: este ajuste toca solo el modal de reimpresion/historial; no modifica la base del teclado, no toca `app.json` y no altera `listaContentNormal/ConTeclado`

---

## 🔥 Solución Final: Sincronización de Ventas y Anulación Híbrida (24 Mar 2026)
Consolidación de la arquitectura de sincronización para ventas de ruta, garantizando que el botón de anular esté disponible siempre y las ediciones se propaguen correctamente.

### Problemas Resueltos:
- **Discrepancia en Colas Sync**: `syncService.js` usaba una clave (`ventas_pendientes`) y `ventasService.js` otra (`ventas_pendientes_sync`), causando que ventas editadas no se sincronizaran.
- **Ventas "Fantasmas" en POST**: El bucle de sincronización intentaba crear (`POST`) ventas que ya existían en el backend pero habían sido editadas.
- **ID Real Ausente**: Al sincronizar una venta en segundo plano, la app mantenía el ID local temporal en su historial, impidiendo acciones que requieren ID numérico (como anular).
- **Botón Anular Intermitente**: Desaparecía si el desfase horario entre teléfono y servidor era mayor a 15 min o si la venta aún no terminaba de sincronizar.

### Mejoras Aplicadas:

#### 1. Arquitectura de Sincronización Unificada
- **Clave Única**: Se estandarizó el uso de `ventas_pendientes_sync` en todos los archivos del sistema (`syncService.js`, `ventasService.js`, `VentasScreen.js`).
- **Soporte PATCH Automático**: `ventasService.sincronizarVentasPendientes` ahora detecta si la venta tiene un ID numérico (ya persiste en backend). Si lo tiene, usa `editarVentaRuta` (PATCH) en vez de `enviarVentaRuta` (POST).
- **Persistencia de ID Real**: Tras un éxito de `enviarVentaRuta` en segundo plano, la app ahora actualiza el objeto en `AsyncStorage` con el `id` real retornado por el servidor y marca `sincronizada: true`.

#### 2. Lógica de Anulación Híbrida (Local/Remota)
- **Visibilidad Total**: El botón **Anular (Círculo Rojo)** en `VentasScreen` ahora es visible para **todas** las ventas de ruta (no anuladas), sin importar si ya sincronizaron o no.
- **Anulación con ID Temporal (Local)**: Si el usuario anula una venta que aún no sube al servidor:
  - Se elimina de la cola `ventas_pendientes_sync` de inmediato (para que no se envíe después).
  - Se elimina del historial local (`ventas`).
  - Se **restituye el stock** localmente de forma instantánea.
- **Anulación con ID Real (Remota)**: Si ya está en el servidor, dispara el flujo estándar de la API.
- **Margen de Robusted (2 horas)**: Se amplió el margen de búsqueda en `resolverVentaBackendAsociada` a 120 minutos para compensar cualquier desfase de zona horaria o reloj entre el dispositivo y el servidor.

#### 3. Refresco Reactivo del Historial
- `abrirHistorialReimpresion()` ahora sincroniza forzosamente `ventasBackendDia` al abrirse, asegurando que las ventas recién creadas que acaban de subir sean reconocidas por su ID de servidor.

### Archivos Clave Actualizados:
- `AP GUERRERO/services/syncService.js` (unificación de claves)
- `AP GUERRERO/services/ventasService.js` (ID real + logic PATCH)
- `AP GUERRERO/components/Ventas/VentasScreen.js` (anulación híbrida + UI visible)
- `AP GUERRERO/services/rutasApiService.js` (método PATCH verificado)

---

## 🐛 BUG FIX: Cierre de Turno requería dos intentos (2026-03-31)

### Problema
Los vendedores tenían que cerrar el turno **dos veces** para que las devoluciones aparecieran en Cargue. Reportado en producción con cierres entre 7 PM y 9 PM hora Colombia.

### Causa Raíz
**Bug de timezone en JavaScript.** El `DatePicker` de la app guarda la fecha seleccionada con la hora actual del dispositivo. Al usar `.toISOString()` para formatear, JavaScript convierte a UTC. Colombia es UTC-5, entonces después de las 7 PM local = medianoche UTC = **fecha del día siguiente**.

Ejemplo:
- Vendedor cierra turno a las 8 PM del 27/10/2025
- App envía `fecha = 2025-10-28` (incorrecto, +1 día)
- Backend no encuentra cargue para ese día → cierra "turno vacío"
- Vendedor reingresa → app re-verifica turno con `T12:00:00` (correcto) → segundo cierre funciona

### Fixes Aplicados

#### Backend (`api/views.py`) — commits `0f46368` + `8043d8e`
En `cerrar_turno_vendedor`, antes de buscar el cargue, se valida la fecha usando el **TurnoVendedor ABIERTO** como fuente de verdad:

```python
# Si la fecha enviada por la app no coincide con el turno abierto → usar la del turno
_turno_activo = TurnoVendedor.objects.filter(vendedor_id=_v_id_num, estado='ABIERTO').first()
if _turno_activo and str(_turno_activo.fecha) != fecha:
    fecha = str(_turno_activo.fecha)  # Corrección silenciosa
```

Esto cubre todos los casos incluyendo cuando el vendedor **ya envió el cargue del día siguiente** antes de cerrar.

#### Frontend (`AP GUERRERO/VentasScreen.js`) — pendiente de publicar en app
Reemplazadas 5 ocurrencias de `.toISOString().split('T')[0]` sobre `fechaSeleccionada` por métodos locales:
```javascript
// Antes (bug):
const fechaFormateada = fechaSeleccionada.toISOString().split('T')[0];
// Después (fix):
const fechaFormateada = `${fechaSeleccionada.getFullYear()}-${String(fechaSeleccionada.getMonth()+1).padStart(2,'0')}-${String(fechaSeleccionada.getDate()).padStart(2,'0')}`;
```
Líneas corregidas: 733, 1729, 2829, 3994, 5595.

### Fix adicional: Vencidas post-cierre (`api/views.py`) — commit `1d478de`
Se detectó que el botón de vencidas en la app podía enviar datos después del cierre del turno. Se agregó validación en `VentaRutaViewSet.create`:
- Si el turno está `CERRADO` Y la venta es solo vencidas (sin productos vendidos) → retorna `409`
- No afecta ventas normales del queue offline que incluyan vencidas adjuntas

### Estado en VPS (2026-03-31) — ESTADO FINAL ESTABLE
El VPS tiene aplicado via `cherry-pick` **únicamente**:
- `8043d8e` — fix timezone mejorado (TurnoVendedor fuente de verdad) → hash VPS: `626e62b`

Base: `904afe9` (bloquear reapertura de turnos cerrados)

**El fix de vencidas post-cierre fue REVERTIDO** (ver sección de lecciones aprendidas abajo).

**Commits pendientes de subir al VPS** (no cherry-pickeados):
- `07fbf88` — fix error 403→409 compatibilidad app producción
- `920868d` — fix vencidas 201 silencioso (necesario si se vuelve a implementar el bloqueo)
- `f80b6fd` — docs
- Todos los commits de trabajo local en AP GUERRERO

---

### ⚠️ LECCIONES APRENDIDAS — SESIÓN 2026-03-31

#### 1. Docker imagen bakeada — SIEMPRE hacer rebuild
**CRÍTICO:** El VPS corre la imagen Docker con el código bakeado en el build, **no montado como volumen**. Esto significa:
- `docker compose restart backend` → **NO recarga el código**
- `docker compose stop/start backend` → **NO recarga el código**
- Para que cambios en `api/views.py` tomen efecto hay que hacer:
```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d --no-deps backend
```

#### 2. Fix de vencidas post-cierre causó problemas en cascada
Se intentaron aplicar los commits `1d478de` y `920868d` para bloquear vencidas post-cierre. Resultado:
- Cherry-pick de `1d478de` tuvo conflicto y la resolución borró el método `_resolver_fecha_operativa` de la clase `VentaRutaViewSet`
- Esto causó `500 Internal Server Error` en **todas** las ventas (`/api/ventas-ruta/`)
- La app quedaba con "1 venta pendiente de sincronizar" sin poder sincronizar
- Solución: `git reset --hard 904afe9` + cherry-pick limpio solo de `8043d8e` + **rebuild de imagen**

#### 3. Estado de vencidas post-cierre (pendiente)
Actualmente las vencidas enviadas después del cierre del turno **sí llegan** al Cargue.
El fix correcto requiere coordinar backend + nueva versión de app. Queda pendiente para cuando se publique la nueva app.

#### 4. Procedimiento correcto para cherry-pick al VPS
```bash
# 1. Fetch
git fetch origin
# 2. Cherry-pick
git cherry-pick <hash>
# Si hay conflicto, resolver con python y hacer cherry-pick --continue
# 3. Rebuild imagen (OBLIGATORIO)
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d --no-deps backend
# 4. Verificar logs
docker compose -f docker-compose.prod.yml logs backend --tail=20 -f
```

### ⚠️ Importante al subir commits pendientes al VPS
El VPS tiene el cherry-pick `626e62b` (equivale a `8043d8e` local) encima de `904afe9`. Hacer `git pull` normal causaría conflictos. Opciones al momento de sincronizar:
1. Revisar `git log` en VPS primero
2. Considerar hacer `git reset --hard origin/main` si todos los commits pendientes ya están en main
3. Siempre hacer **rebuild de imagen** después de cualquier cambio de código

---

### ⚠️ LECCIONES APRENDIDAS — SESIÓN 2026-03-31 (continuación)

#### 5. Modal DevolucionesVencidas — Solución definitiva para Android

**Problema:** El modal de Productos Vencidos se encogía cuando el teclado abría en Android (por `softwareKeyboardLayoutMode: "resize"`).

**Causa:** El contenedor usaba `position: 'absolute'` con `bottom: 0` — cuando Android hace resize del window, `bottom: 0` se mueve hacia arriba y el modal se encoge.

**Solución que funcionó** (basada en el patrón del Modal de Edición de VentasScreen):

```javascript
// OUTER KeyboardAvoidingView — flex: 1 (NO position:absolute)
<KeyboardAvoidingView
    style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        paddingTop: Platform.OS === 'android' ? 0 : 34,
        paddingHorizontal: Platform.OS === 'android' ? 0 : 8,
        paddingBottom: Platform.OS === 'android' ? 0 : 20,
    }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    enabled={Platform.OS === 'ios'}
>
// INNER View — flex: 1, SIN flexShrink
<View style={{
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    flex: 1,
    overflow: 'hidden',
}}>
```

**Puntos clave:**
- `flex: 1` en outer (flexible) → no rompe teclado de VentasScreen
- `flex: 1` sin `flexShrink` en inner → ocupa todo el espacio disponible sin encogerse
- `position: absolute` con altura fija → SIEMPRE rompe el teclado de VentasScreen
- `statusBarTranslucent={true}` en `<Modal>` → modal sube hasta la status bar en Android

#### 6. Hot reload de Expo — Causa falsos positivos en teclado

**CRÍTICO:** Cada vez que se edita `DevolucionesVencidas.js` y Expo hace hot reload, el estado nativo de los listeners del teclado en VentasScreen queda corrupto. Síntoma: el teclado "empuja" el contenido de VentasScreen hacia arriba.

**Esto NO es un conflicto de código** — es estado sucio del hot reload.

**Solución:** Después de cualquier edición a DevolucionesVencidas, forzar cierre completo de la app:
- Mantener presionado ícono AP GUERRERO → Información de app → **Forzar detención** → reabrir

**NO usar el hot reload de Expo** para probar cambios de DevolucionesVencidas que involucren teclado.

#### 7. Footer del modal — Animación con Animated.View

El footer (Cancelar/Guardar) usa `Animated.View` con `opacity` + `maxHeight` para colapsar instantáneamente cuando el teclado abre y aparecer suavemente cuando cierra:

```javascript
// Valor animado (useNativeDriver: false para animar layout)
const footerAnim = useRef(new Animated.Value(1)).current;

// Listeners del teclado
Keyboard.addListener(showEvent, () => {
    setTecladoVisible(true);
    footerAnim.setValue(0); // instantáneo al abrir — sin salto visual
});
Keyboard.addListener(hideEvent, () => {
    setTecladoVisible(false);
    Animated.timing(footerAnim, { toValue: 1, duration: 120, useNativeDriver: false }).start(); // suave al cerrar (120ms = balance entre rapidez y suavidad)
});

// JSX
<Animated.View style={[styles.footer, {
    opacity: footerAnim,
    maxHeight: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }),
    overflow: 'hidden',
}]}>
```

**Comportamiento:** teclado abre → footer colapsa instantáneamente (sin animación, sin salto, sin espacio blanco) → lista de productos ocupa todo el espacio. Teclado cierra → footer aparece suavemente con fade in + expansión.

**IMPORTANTE:** `useNativeDriver: false` es obligatorio cuando se animan propiedades de layout (`maxHeight`). Con `useNativeDriver: true` solo funciona `opacity`.

#### 8. Estilos compactos del modal

Header y footer reducidos para maximizar espacio de lista:
```javascript
header: { paddingTop: 12, paddingBottom: 4 }  // antes: 22/10
footer: { padding: 10, paddingBottom: 10 }     // antes: 15/30
btnCancelar/btnGuardar: { padding: 10 }        // antes: 15
```

#### 9. Configuración final del modal DevolucionesVencidas (estado definitivo)

```javascript
<Modal
    visible={visible}
    animationType="fade"
    transparent={true}
    statusBarTranslucent={true}  // ← modal sube hasta la status bar
    onRequestClose={handleCancelar}
>
    <KeyboardAvoidingView style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        paddingTop: 0,           // Android: 0 (statusBarTranslucent lo maneja)
        paddingHorizontal: 0,    // Android: 0 (modal ocupa ancho completo)
        paddingBottom: 0,
    }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            width: '100%',
            flex: 1,             // ← ocupa todo el espacio disponible
            overflow: 'hidden',
        }}>
            {/* Header compacto */}
            {/* Lista de productos con flex:1 */}
            {/* Footer animado con Animated.View */}
        </View>
    </KeyboardAvoidingView>
</Modal>
```

#### 9. Fix sincronización — Edición rechazada por servidor queda en loop infinito

**Problema:** Si el servidor rechaza una edición pendiente con el error "Esta venta ya fue modificada una vez. No se permiten más ediciones", la app reintentaba infinitamente (contador de 1 pendiente nunca bajaba).

**Causa:** `esErrorPermanenteDeSincronizacion()` en `AP GUERRERO/services/ventasService.js` solo reconocía errores de stock como permanentes.

**Fix aplicado:**
```javascript
// ventasService.js — esErrorPermanenteDeSincronizacion()
return texto.includes('STOCK DISPONIBLE DEL CARGUE') ||
    texto.includes('STOCK_INSUFICIENTE_CARGUE') ||
    texto.includes('YA FUE MODIFICADA') ||     // ← NUEVO
    texto.includes('NO SE PERMITEN') ||         // ← NUEVO
    texto.includes('YA FUE EDITADA');           // ← NUEVO
```

Ahora ese tipo de errores se marcan como `requiere_revision: true` y dejan de reintentarse.

---

---

## Sesión 2026-03-31 — Segunda venta, método de pago independiente, badges, fixes de anulación y cargue

### 1. Cambio de método de pago — independiente de `editada`

**Contexto:** Al cambiar el método de pago desde el historial, la venta se marcaba como "EDITADA" (card roja, badge). Se quiso separar completamente.

**Cambios backend (`api/models.py`):**
```python
editada = models.BooleanField(default=False)              # True si productos/cantidades fueron modificados
metodo_pago_cambiado = models.BooleanField(default=False) # True si solo se cambió el método de pago
```

**Migración:** `api/migrations/0100_add_metodo_pago_cambiado_ventaruta.py` — aplicada en local. **Pendiente aplicar en VPS con `python3 manage.py migrate`.**

**Cambios backend (`api/views.py` — `VentaRutaViewSet.partial_update`):**
- Si la actualización es solo cambio de método de pago → verifica `metodo_pago_cambiado`, bloquea si ya fue cambiado (código `METODO_PAGO_YA_CAMBIADO`)
- Si la actualización incluye productos → verifica `editada`, bloquea si ya fue editada (código `VENTA_YA_MODIFICADA`)
- Al guardar: `venta.metodo_pago_cambiado = True` solo si cambió método, `venta.editada = True` solo si cambió productos

**Cambios frontend (`AP GUERRERO/components/Ventas/VentasScreen.js`):**
- `ventaYaCambioMetodoPago(venta)` — nueva función, lee `metodo_pago_cambiado`
- `puedeCambiarMetodoDesdeCard` usa `ventaYaCambioMetodoPago` en vez de `ventaYaFueModificada`
- `actualizarMetodoPagoDesdeCard` marca `metodo_pago_cambiado: true`, NO `editada: true`
- La card NO se pone roja al cambiar método de pago

### 2. Segunda venta al mismo cliente

**Regla implementada:**
- 1 venta activa → al intentar segunda → alerta "¿Deseas hacer una segunda venta?" con botones **Cancelar / Continuar**
- 2 ventas activas → bloqueo total "Ya realizaste 2 ventas"
- Ventas ANULADAS no cuentan (se liberan slots)

**Función `contarVentasActivasCliente(clienteObjetivo)`:**
- Busca en `ventasDelDia` + `ventasBackendDia` (deduplicadas por ID)
- Paso 1: recopila todos los IDs con estado ANULADA de ambas listas
- Paso 2: filtra ventas activas excluyendo esos IDs (evita el bug de stale backend data)
- Retorna count de ventas activas únicas del cliente

**Dos puntos de validación actualizados** (~línea 4490 y ~línea 5040 en VentasScreen.js)

### 3. Badge "2ª VENTA"

**Mobile (VentasScreen.js — historial):**
```javascript
const idsSegundaVenta = (() => {
    const porCliente = {};
    ventasAMostrar.forEach(v => { /* agrupar por nombre cliente */ });
    // Las ventas del índice 1 en adelante (ordenadas por fecha) → set de IDs
})();
// Badge morado en la card si esSegundaVenta
```

**Web (`frontend/src/components/rutas/ReporteVentasRuta.jsx`):**
- IIFE dentro del render que detecta 2ª venta por cliente y muestra `<span>` morado "2ª VENTA"

### 4. Fix: anulación de 2ª venta bloqueada incorrectamente

**Problema:** Al anular la 2ª venta de un cliente, el sistema decía "Ya anulada" aunque la venta era nueva.

**Causa:** `resolverVentaBackendAsociada()` buscaba en el backend una venta del mismo cliente dentro de 2h de margen — encontraba la 1ª venta (ya anulada en backend) y la retornaba. El botón de anular recibía esa venta ANULADA y bloqueaba.

**Fix (`VentasScreen.js` ~línea 2060):**
```javascript
// Excluir ventas ANULADAS del backend como candidatas
if (String(venta?.estado || '').toUpperCase() === 'ANULADA') return false;
```

### 5. Fix: método de pago no se refleja en la card tras cambio

**Problema:** Al cambiar el método desde el modal del historial, la card no actualizaba el método visualmente.

**Causas:**
1. `esMismaVenta` estaba definida dentro de `aplicarMetodoEnMemoria` pero se usaba fuera → ReferenceError silencioso, localStorage no se actualizaba
2. `setHistorialResumenPreview` no se llamaba → si el modal estaba en vista previa, la card no refrescaba

**Fix (`VentasScreen.js` ~línea 2357):**
- `esMismaVenta` movida al scope externo de `actualizarMetodoPagoDesdeCard`
- `aplicarMetodoEnMemoria` ahora actualiza `ventasDelDia`, `historialReimpresion` Y `historialResumenPreview`

### 6. Fix: modal de edición de venta tenía botones de método de pago

**Problema:** El modal de edición de productos tenía botones EFECTIVO/NEQUI/DAVIPLATA que permitían cambiar el método de pago. Esto creaba confusión y conflicto con el cambio independiente desde la card. Al guardar la edición con método diferente, la venta quedaba marcada como EDITADA (roja) aunque el usuario solo quería cambiar el método.

**Fix:** Eliminados los botones de método de pago del modal de edición. El método de pago **solo se cambia desde la card del historial** (botón dedicado, independiente).

### 7. Fix: tabla NEQUI/DAVIPLATA en Cargue desaparece al cambiar de vendedor

**Problema:** Al cambiar de vendedor en Cargue y volver, la tabla CONCEPTO/NEQUI/DAVIPLATA quedaba vacía.

**Causas (`frontend/src/components/Cargue/PlantillaOperativa.jsx`):**
1. `pagosDetallados` no estaba en el estado inicial de `datosResumen` → `undefined` en primer render
2. El cache solo se guardaba si `totalPedidos > 0 || venta > 0 || totalDespacho > 0` → si el vendedor solo tenía ventas ruta digitales sin pedidos, el cache nunca se persistía

**Fixes:**
```javascript
// Estado inicial — agregado pagosDetallados: []
return { ..., nequi: 0, daviplata: 0, pagosDetallados: [] };

// Condición de cache — ahora incluye nequi y daviplata
if (datosResumen.totalPedidos > 0 || datosResumen.venta > 0 || 
    datosResumen.totalDespacho > 0 || datosResumen.nequi > 0 || datosResumen.daviplata > 0) {
```

### 8. Pendiente VPS

Ejecutar en el servidor:
```bash
python3 manage.py migrate
```
Aplica migración `0100_add_metodo_pago_cambiado_ventaruta` que agrega la columna `metodo_pago_cambiado` a `api_ventaruta`. Sin esto el endpoint `GET /api/ventas-ruta/` retorna 500.

---

## Sesión 2026-04-01 — Fixes Cargue tabla pagos + card método pago + diagnóstico offline

### 1. Fix: Card historial no actualizaba método de pago visualmente

**Problema:** Al cambiar EFECTIVO → NEQUI desde el modal del historial, la card seguía mostrando EFECTIVO.

**Causa:** `esMismaVenta()` en `actualizarMetodoPagoDesdeCard` comparaba IDs campo a campo. El item del historial tiene `id = UUID` (local) y `ventaBackendAsociada` tiene `id = numérico` + `id_local = UUID`. El match cruzado no existía → ningún item se actualizaba.

**Fix (`VentasScreen.js` ~línea 2357):**
```javascript
const esMismaVenta = (v) => {
    if (v.id && venta.id && v.id === venta.id) return true;
    if (v.id_local && venta.id_local && v.id_local === venta.id_local) return true;
    // Match cruzado: item local (id=UUID) vs backend (id_local=UUID)
    if (v.id && venta.id_local && String(v.id) === String(venta.id_local)) return true;
    if (v.id_local && venta.id && String(v.id_local) === String(venta.id)) return true;
    if (v._key && venta._key && v._key === venta._key) return true;
    return false;
};
```

### 2. Fix: Tabla NEQUI/DAVIPLATA en Cargue vacía al cambiar de vendedor

**Problema:** Al cambiar de ID (ID1→ID2→ID1) la tabla CONCEPTO/NEQUI/DAVIPLATA quedaba vacía. Solo aparecía al presionar el botón de sincronizar.

**Causas:**
1. `cargarDatosDesdeDB()` (flujo principal al montar) no extraía `pagosDetallados` del resultado de `cargarPedidosVendedor` → se sobreescribía con `undefined`
2. El cache no se persistía de forma inmediata — si el usuario cambiaba de tab antes de que el `useEffect` de persistencia corriera, el cache quedaba sin `pagosDetallados`
3. Si el fetch al montar devolvía vacío (race condition), borraba los datos del cache previo

**Fixes (`PlantillaOperativa.jsx`):**

a) `cargarDatosDesdeDB()` ahora extrae y pasa `pagosDetallados`:
```javascript
const pagosDetalladosReal = typeof resultadoPedidos === 'object' ? (resultadoPedidos.pagosDetallados || []) : [];
const valoresForzados = { ..., pagosDetallados: pagosDetalladosReal };
```

b) Cache persistido inmediatamente al recibir datos del fetch:
```javascript
setDatosResumen(prev => {
    // Si backend devuelve vacío pero hay datos previos, preservarlos
    const hayDatosNuevos = nequi > 0 || daviplata > 0 || total > 0 || pagosDetallados.length > 0;
    const pagosFinales = hayDatosNuevos ? pagosDetallados : (prev.pagosDetallados || []);
    // ...
    localStorage.setItem(cacheKey, JSON.stringify(nuevoEstado)); // Persistir inmediato
});
```

c) `useEffect` de carga añade `dia` y `fechaFormateadaLS` a dependencias para evitar closures stale.

### 3. Diagnóstico offline AP GUERRERO — Todo OK

Revisado el sistema de sync offline. Resultado: **robusto, no se pierden datos**.

| Operación | Sin internet | Stock | Sincronización |
|-----------|:-----------:|:-----:|:--------------:|
| Venta normal | ✅ guarda local | ✅ ajusta | ✅ automático |
| Vencidas + fotos | ✅ fotos en base64 | ✅ ajusta | ✅ automático |
| Anular | ✅ marca local | ✅ devuelve | ✅ automático |
| Editar | ✅ guarda local | ✅ recalcula | ✅ automático |
| Cambio método pago | ✅ guarda local | N/A | ✅ automático |
| Venta rápida | ✅ igual venta normal | ✅ ajusta | ✅ automático |

**Mecanismo de seguridad:** `rehidratarColaDesdeVentasLocales()` corre en cada sync — recupera ventas locales que no quedaron en la cola.

**Límites intencionados (no bugs):**
- 1 edición por venta
- 1 anulación por venta  
- 1 cambio de método de pago por venta

**Sin resolución de conflictos multi-dispositivo** — si dos usuarios editan la misma venta offline, gana el último en sincronizar.

---

## Pendiente futuro — ID Auxiliar por vendedor

**Contexto:** Cada vendedor puede ir acompañado de un auxiliar que también vende. Actualmente no existe un ID para el auxiliar.

**Solución ideal:** Crear un ID auxiliar (ej: ID1AUX) que comparta el stock del vendedor principal (ID1) pero registre sus ventas de forma independiente.

**Beneficios:**
- Sin conflictos de edición entre vendedor y auxiliar
- Trazabilidad de quién vendió qué
- Stock compartido del mismo cargue

**No implementado aún** — requiere cambios en backend (stock compartido), app móvil y cargue web.

**Pendiente definir:** Si el auxiliar también usa la app móvil para vender o solo acompaña al vendedor. Esto determina el diseño de la solución.

---

## Bug fix 2026-04-01 — Stock app desaparece cuando hay devoluciones en cargue

**Síntoma:** El stock de un vendedor (ID5) desapareció en la app móvil en medio de la jornada. Los demás IDs estaban bien.

**Causa raíz:** En `api/views.py` función `obtener_cargue()` había esta lógica:
```python
turno_cerrado = registros.filter(devoluciones__gt=0).exists()
if turno_cerrado:
    stock_disponible = 0
```
Si cualquier producto tenía `devoluciones > 0`, ponía el stock en 0 para TODOS los productos del vendedor. En este caso alguien puso 10 en devoluciones de CANASTAS y eso bloqueó todo el stock de ID5.

**Por qué era incorrecta:** Las devoluciones ya están descontadas en el campo `total` del cargue:
`total = cantidad + adicional - dctos - devoluciones - vencidas`
El stock disponible se calcula como `total - vendidas`, por lo que las devoluciones ya están incluidas. No hay razón para poner el stock en 0.

**Fix aplicado (`api/views.py`):**
- Eliminada la lógica `turno_cerrado = devoluciones > 0`
- El stock siempre se calcula como `total - vendidas`
- `turno_cerrado` en la respuesta siempre es `False`

**Solución de emergencia usada en producción:** Editar la celda de devoluciones en el cargue web y ponerla en 0 para que el vendedor pudiera seguir trabajando mientras se subía el fix.

**Pendiente:** Subir fix al VPS con:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build backend
```

---

## Tareas Pendientes — 2026-04-02

### 1. Cargue - Modal pedidos: Check de entrega en card cliente
**Descripción:** En el modal de pedidos del cargue web, donde se ve la card del cliente con su pedido, agregar un **check** en la esquina superior izquierda de la card. Sirve como guía visual para que el despachador sepa que ya entregó el pedido.

**Estado:** Pendiente de implementar.

---

### 2. Inventario - Fecha vencimiento suma 1 día al grabar
**Descripción:** Al agregar un lote en inventario y grabar la fecha de vencimiento, la fecha guardada aparece con un día más del seleccionado.

**Causa probable:** Bug de timezone — mismo patrón visto antes: `DatePicker` guarda con hora local, al convertir a ISO string con `.toISOString()` JavaScript convierte a UTC y si es después de las 7 PM Colombia (UTC-5) la fecha avanza al día siguiente.

**Estado:** Pendiente de investigar y corregir.

---

### 3. Pedidos - Fecha de entrega sale con día anterior antes de las 6 AM
**Descripción:** Al montar un pedido para entregar el mismo día, la fecha de entrega sale con la fecha del día anterior. Solo sucede antes de las 6 AM.

**Causa probable:** Mismo bug de timezone UTC-5 — antes de las 6 AM Colombia el UTC ya es el día siguiente, y al calcular "hoy" desde el servidor o con `.toISOString()` devuelve el día anterior.

**Estado:** Pendiente de investigar y corregir.


---

## Sesión 2026-04-03 — Fixes app móvil + cargue web + inventario

### Fix: Anulación no marcaba ANULADA en historial de reimpresión (app móvil)

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema:** Al anular una venta, las funciones `marcarAnuladaUI` y `marcarAnulada` no encontraban la venta en `historialReimpresion` porque no tenían cross-matching de IDs. La venta seguía apareciendo como activa en el historial.

**Fix:** Agregado cross-matching completo en ambas funciones:
```javascript
const misma = (v.id && venta.id && String(v.id) === String(venta.id)) ||
              (v.id_local && venta.id_local && String(v.id_local) === String(venta.id_local)) ||
              (v.id && venta.id_local && String(v.id) === String(venta.id_local)) ||  // cross
              (v.id_local && venta.id && String(v.id_local) === String(venta.id)) ||  // cross
              (v._key && venta._key && v._key === venta._key);
```

---

### Fix: Fecha vencimiento inventario suma 1 día (bug timezone)

**Archivo:** `frontend/src/components/inventario/TablaConfirmacionProduccion.jsx`

**Problema:** `new Date("YYYY-MM-DD")` parsea como UTC midnight → en Colombia (UTC-5) aparece el día anterior.

**Fix:** Parsear extrayendo año/mes/día del string sin conversión UTC:
```javascript
const soloFecha = String(fecha).split("T")[0];
const [anio, mes, dia] = soloFecha.split("-");
return new Date(Number(anio), Number(mes) - 1, Number(dia)).toLocaleDateString("es-ES");
```

**También corregido:** `RegistroLotes.jsx` línea 16 — clave localStorage usaba `toISOString()`. Fix: usar `getFullYear()/getMonth()/getDate()`.

---

### Fix: Fecha de entrega pedidos sale día anterior antes de las 6 AM

**Archivo:** `frontend/src/components/Pedidos/PaymentModal.jsx`

**Problema:** La fecha de entrega por defecto usaba `mañana.toISOString().split('T')[0]` — antes de las 6 AM Colombia, UTC ya es el día siguiente y la fecha queda desplazada.

**Fix:** Reemplazado en 2 lugares (init y reset del modal):
```javascript
const y = mañana.getFullYear();
const m = String(mañana.getMonth() + 1).padStart(2, '0');
const d = String(mañana.getDate()).padStart(2, '0');
setFechaEntrega(`${y}-${m}-${d}`);
```

---

### Feature: Check de entrega en modal pedidos (cargue web)

**Archivo:** `frontend/src/components/Cargue/BotonVerPedidos.jsx`

**Descripción:** Checkbox 22x22px en la esquina superior izquierda de cada card de pedido en el modal. Permite al despachador marcar visualmente que entregó el pedido.

**Persistencia:** Campo `verificado_despachador` (BooleanField) en modelo `Pedido`. Endpoint `POST /api/pedidos/{id}/verificar_despacho/` (toggle). Migración `0101_add_verificado_despachador_pedido`.

**Comportamiento:**
- Al cargar el modal, inicializa los checks desde `verificado_despachador` del backend
- Al hacer click, llama al endpoint inmediatamente (optimistic update)
- Visible para cualquier despachador en cualquier dispositivo

---

### Feature: Tabla confirmación inventario rediseñada (Producción y Maquila)

**Archivos:** `frontend/src/components/inventario/TablaConfirmacionProduccion.jsx`, `InventarioProduccion.jsx`, `InventarioMaquilas.jsx`

**Cambios:**
- Nueva tabla con columnas: **PRODUCTO | CANTIDAD | LOTE | VENCIMIENTO | REGISTRADO | ESTADO**
- Cada producto lleva su propio lote, fecha de vencimiento y hora registrada
- En Maquila con múltiples lotes por sesión: cada fila muestra su lote y fecha independiente
- Columna ESTADO muestra ✅ normal o ⚠️ si fue editado (clickeable con SweetAlert mostrando cantidad original → nueva, fecha y motivo)
- Aplica para Producción y Maquila con la misma estética

**Estructura de datos:** `datosParaConfirmacion.productos` ahora incluye por producto:
```javascript
{ nombre, cantidad, lote, fechaVencimiento, lotesDetalle: [{numero, fechaVencimiento}], fechaRegistro }
```

**`combinarDatosConfirmacion`** simplificada: ya no acumula por nombre, concatena filas de distintas sesiones.

---

### Feature: Offline resiliente en inventario (Producción y Maquila)

**Archivos:** `frontend/src/services/pendingInventarioService.js` (nuevo), `InventarioProduccion.jsx`, `InventarioMaquilas.jsx`

**Descripción:** Si se va el internet al grabar producción o maquila, el payload queda en localStorage como pendiente. Al volver la conexión se sincroniza automáticamente sin recargar.

**Flujo:**
1. Antes de llamadas al backend → `pendingInventarioService.guardar(tipo, fecha, payload)`
2. Al terminar exitosamente → `pendingInventarioService.borrar(tipo, fecha)`
3. `window.addEventListener('online', flushPendientes)` reintenta automáticamente
4. También reintenta al montar el componente (recarga de página)

**Keys localStorage:** `pending_inventario_produccion_FECHA` y `pending_inventario_maquila_FECHA`

---

### Pendiente: Subir al VPS

```bash
cd ~/crm-fabrica
git fetch origin
git reset --hard origin/main  # VPS tiene cherry-picks divergentes
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d --no-deps backend
docker exec crm_backend_prod python manage.py migrate
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
```

**Migraciones nuevas a aplicar:**
- `0101_add_verificado_despachador_pedido`


---

## Sesión 2026-04-04

### Dashboard Integral — Filtros de Tiempo por Período

**Archivo:** `frontend/src/pages/ReportesAvanzados/DashboardIntegral.jsx`

**Qué se hizo:** Se agregaron 4 modos de filtro de tiempo al Dashboard de Inteligencia/Optimización.

**Modos implementados:**
- **Día** — fecha puntual (comportamiento original)
- **Semana** — selecciona cualquier día, calcula lunes→domingo automáticamente
- **Mes** — selector mes/año, calcula primer y último día del mes
- **Rango** — dos fechas libres

**Lógica de acumulación para rangos:**
- `ventas-ruta`: llamada única con `?fecha_inicio=&fecha_fin=` (ya soportado en backend)
- `pedidos`: llamada única con `?fecha_desde=&fecha_hasta=`, filtro adicional client-side por `fecha_entrega`
- `turnos`: llamada única con `?fecha_desde=&fecha_hasta=`
- `obtener-cargue`: loop por cada fecha del rango × 6 IDs, acumulando cantidades/neto/nequi/daviplata por producto

**Estados nuevos:** `modoFiltro`, `fechaInicio`, `fechaFin`, `mesConsulta`, `labelPeriodo`

**Helpers nuevos:** `getRango()`, `getDatesInRange()`, `formatFechaCorta()`

**Badge** ahora muestra el período: `✅ Semana 30/03 — 05/04`, `✅ Abril 2026`, etc.

---

### Dashboard Integral — Tabla Comparativa entre IDs

**Archivo:** `frontend/src/pages/ReportesAvanzados/DashboardIntegral.jsx`

**Qué se hizo:** Se agregó tabla comparativa de todos los IDs en la pestaña "Total Consolidado".

**Columnas:** ID | Estado | Despacho Inicial | Venta Ruta | Pedidos | Venta Total | Efectivo | Nequi | Daviplata | Vencidas | Cumpl.%

**Features:**
- Fila de TOTALES al final (suma de todos los IDs)
- Click en fila navega directamente al detalle del ID
- Badge de estado: ✅ OK (jornada completa) / ⚠️ Parcial (en proceso)
- Badge de cumplimiento: verde ≥80%, amarillo ≥50%, rojo <50%
- Scroll horizontal en pantallas pequeñas (`minWidth: 700px`)

---

### Fix Dashboard Integral — Precio NETO incorrecto (usa precio histórico en lugar de catálogo actual)

**Archivo:** `frontend/src/pages/ReportesAvanzados/DashboardIntegral.jsx`

**Problema:** El NETO en el Dashboard no coincidía con el NETO del módulo Cargue (PlantillaOperativa).
- Ejemplo: AREPA TIPO OBLEA el 12/01/2026 → Dashboard mostraba $2,100, Cargue mostraba $1,900.
- El Dashboard usaba `datos.valor` (precio histórico guardado en el registro de cargue en esa fecha) como fuente primaria de precio.
- PlantillaOperativa usa `precio_cargue` del catálogo actual de productos como fuente primaria.

**Causa raíz:** El Dashboard y el Cargue usaban fuentes de precio distintas:
| Fuente | Dónde vive | Quién la usaba |
|--------|-----------|----------------|
| `datos.valor` (`reg.valor` en CargueID1) | BD registro de cargue — congelado al día del despacho | Dashboard (incorrecto) |
| `precio_cargue` en modelo `Producto` | BD tabla `api_producto` — precio actual del catálogo | PlantillaOperativa (correcto) |

**Fix aplicado:**

1. **`preciosMap` ahora usa `precio_cargue`** (antes usaba `p.precio`):
```javascript
productosArr.forEach(p => {
    const nombre = normalizeName(p.nombre || p.name || '');
    let precio;
    if (p.precio_cargue !== null && p.precio_cargue !== undefined) {
        precio = parseFloat(p.precio_cargue) || 0;
    } else {
        const precioBase = parseFloat(p.precio || p.price || 0);
        precio = precioBase > 0 ? Math.round(precioBase * 0.65) : 0;
    }
    if (nombre && precio > 0) preciosMap[nombre] = precio;
});
```

2. **Orden de prioridad de precio invertido** — ahora catálogo primero:
```javascript
// 1. Catálogo actual (precio_cargue) — fuente de verdad
let precio = preciosMap[nombreNorm] || 0;
// 2. precios_alternos del cargue
if (precio === 0 && datos.precios_alternos) { ... }
// 3. datos.valor histórico como último recurso
if (precio === 0) precio = parseFloat(datos.valor || 0);
```

**Regla:** El Dashboard es una vista organizada del mismo cargue → debe usar la misma fuente de precio que PlantillaOperativa (`precio_cargue` del catálogo actual).

---

### Fix AP GUERRERO — Sync cola bloqueada + botones con bloqueos de red

**Archivos:**
- `AP GUERRERO/services/ventasService.js`
- `AP GUERRERO/services/rutasApiService.js`
- `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema 1 — Cola sincronización bloqueada (`sincronizandoCola`):**
Con internet intermitente, `sincronizarVentasPendientes` colgaba porque:
- `verificarVentaExiste` esperaba hasta **12s** (timeout interno)
- `enviarVentaRuta` esperaba hasta **30s** (JSON) o **45s** (fotos)
- Total: hasta **42s** con `sincronizandoCola = true`, bloqueando todos los reintentos
- El safety timeout de la UI (15s) limpiaba el banner pero `sincronizandoCola` seguía bloqueado

**Fix timeouts:**
| Operación | Antes | Ahora |
|-----------|-------|-------|
| `verificarVentaExiste` | 12s | 5s |
| `enviarVentaRuta` JSON | 30s | 10s |
| `enviarVentaRuta` FormData | 45s | 25s |

**Fix `sincronizandoCola` auto-liberación:**
Si lleva más de 20s bloqueado se fuerza a `false` (con timestamp de inicio):
```javascript
if (sincronizandoCola && Date.now() - sincronizandoColaDesde >= 20000) {
    sincronizandoCola = false; // liberar lock colgado
}
```

**Problema 2 — Duplicate keys en listas React Native:**
Error "Encountered two children with the same key" causaba glitches de UI (taps no respondían). Fuente: productos con IDs duplicados en catálogo.

**Fix:** keys con índice para garantizar unicidad:
- `FlatList` productos: `prod-${item.id}-${index}`
- Modal edición sugerencias: `edit-add-${prod.id}-${idx}`
- Modal pedidos pendientes: `pedido-pendiente-${p.id}-${idx}`

**Problema 3 — Botón "Cerrar turno" bloqueaba UI:**
Hacía `await verificarPedidosPendientes()` + `await cargarVentasDelDia()` ANTES de abrir el modal. Con red lenta, el botón parecía no responder.

**Fix:** abrir modal inmediatamente, recargar en background:
```javascript
onPress={() => {
    setMostrarModalCerrarTurno(true); // inmediato
    verificarPedidosPendientes();     // background
    cargarVentasDelDia(fechaSeleccionada); // background
}}
```

**Regla general:** Ningún botón debe hacer `await` de red antes de responder al usuario. La UI siempre abre primero, los datos se actualizan en segundo plano.

---

### Fix AP GUERRERO — Stock no se descontaba en tiempo real al agregar al carrito

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `renderProducto` (~línea 5849)

**Problema:** Al agregar productos al carrito, el stock mostrado no cambiaba hasta completar la venta. El usuario no podía ver cuánto stock le quedaba disponible mientras armaba el pedido.

**Causa:** El stock se leía directo de `stockCargue` sin restar lo que ya estaba en el carrito:
```javascript
// Antes (incorrecto)
const stock = stockCargue[item.nombre.toUpperCase()] || 0;
```

**Fix:** Restar la cantidad en carrito al stock base:
```javascript
// Ahora (correcto)
const stockBase = stockCargue[item.nombre.toUpperCase()] || 0;
const stock = Math.max(0, stockBase - cantidad); // cantidad = lo que está en carrito
```

**Comportamiento:** Inmediato, local, sin red. Funciona con internet cortado o intermitente. Al agregar 2 unidades de AREPA TIPO OBLEA (stock 8), el stock baja a 6 al instante.

---

### Fix — Ventas de Ruta web: mostrar hora de edición en tabla

**Archivos:**
- `api/models.py` — modelo `VentaRuta`
- `api/views.py` — endpoint PATCH edición de venta
- `api/migrations/0102_add_fecha_ultima_edicion_venta_ruta.py` — migración generada
- `frontend/src/components/rutas/ReporteVentasRuta.jsx` — tabla de ventas

**Problema:** La tabla web mostraba solo la hora de creación de la venta. Para ventas editadas, no se veía a qué hora se hizo la edición (solo aparecía el badge EDITADA).

**Fix:**
1. Nuevo campo en modelo: `fecha_ultima_edicion = DateTimeField(null=True, blank=True)`
2. Backend guarda `venta.fecha_ultima_edicion = timezone.now()` al editar productos o vencidas (no al cambiar solo método de pago)
3. Frontend muestra debajo de la hora de creación: `Edit: 2:18 a.m.` en rojo, solo si `venta.editada && venta.fecha_ultima_edicion`

**Pendiente en VPS:** Aplicar migración `0102` con `python3 manage.py migrate`

**Nota:** Ventas editadas antes de este cambio tendrán `fecha_ultima_edicion = null` y no mostrarán la hora de edición — solo las nuevas ediciones la registran.

---

### Fix AP GUERRERO — Editar venta: producto nuevo arranca en 0 y muestra stock en búsqueda

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema 1:** Al agregar un producto nuevo en modo edición, arrancaba en cantidad 1 sin que el vendedor pudiera ver el stock disponible primero.

**Fix:** `agregarProductoEdicion` ahora agrega nuevos productos con cantidad 0. El vendedor ve el stock, luego presiona + para definir la cantidad:
```javascript
// Si ya está en carrito sumar 1, si es nuevo arrancar en 0
const cantidadNueva = itemActual ? (itemActual.cantidad || 0) + 1 : 0;
```

**Problema 2:** Presionar − en cantidad 0 no quitaba el producto (el regex `/[^\d]/g` borraba el signo `-` convirtiendo -1 en 1).

**Fix:** `cambiarCantidadEdicion` detecta valores negativos antes del regex y elimina el producto del carrito:
```javascript
if (parseInt(nuevaCantidad) < 0) {
    // quitar del carrito
    delete updated[nombreProducto];
    return;
}
```

**Problema 3:** La lista de búsqueda en edición no mostraba el stock, el vendedor no sabía si valía la pena agregar el producto.

**Fix:** Se agregó stock junto al precio en cada resultado de búsqueda (verde si hay, rojo si agotado), usando `obtenerMaximoEditableProducto` que ya calcula el stock correcto para edición.

**Comportamiento final:**
- Buscas producto → ves precio + Stock en color
- Tocas Agregar → aparece en lista con cantidad 0
- Presionas + → sube a 1, 2, 3...
- Presionas − en 0 → se elimina de la lista
- Al guardar → items con cantidad 0 se filtran y no se envían al backend

---

### Fix AP GUERRERO — Icono rayo (venta rápida) se bloqueaba con internet intermitente

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `abrirClienteOcasionalRapido`

**Problema:** Al tocar el icono del rayo, el modal de venta rápida no abría de inmediato con internet intermitente. La función hacía `await verificarFlagsRuta()` (llamada de red) antes de abrir el modal — si la red tardaba o fallaba, el usuario quedaba esperando sin feedback.

**Fix:** `Promise.race` con timeout de 2 segundos. Si la red no responde en 2s, usa los valores ya cargados en estado (`flagVentaRapida`, `topeVentaRutaOcasional`) y abre el modal de inmediato:
```javascript
const fallbackInmediato = {
    rapida: flagVentaRapida,
    crear: flagCrearCliente,
    tope: topeVentaRutaOcasional,
};
const configRuta = await Promise.race([
    verificarFlagsRuta(),
    new Promise(resolve => setTimeout(() => resolve(fallbackInmediato), 2000)),
]);
```

**Regla:** Mismo patrón que ventas normales — offline-first, sin bloqueos. La red es opcional para abrir el modal.

---

### Fix AP GUERRERO — Sincronización offline intermitente

**Archivos:**
- `AP GUERRERO/services/ventasService.js`
- `AP GUERRERO/components/Ventas/VentasScreen.js`

**Bugs corregidos:**

1. **TypeError `window` → `global`** (`ventasService.js:553`): `window.__ultimoErrorEdicion` no existe en React Native. Cambiado a `global.__ultimoErrorEdicion`. Causaba que el loop de sync de ediciones se interrumpiera mostrando toast de error.

2. **Banner "X ventas pendientes" tapaba flecha de avanzar** (`VentasScreen.js` estilos): Se agregó `position: 'absolute'`, `top: 0`, `left: 0`, `right: 0`, `zIndex: 100`, `elevation: 10` al estilo `pendientesBar`.

3. **Banner "Sincronizando..." quedaba pegado con internet intermitente** (`VentasScreen.js:622`): Se agregó timeout de seguridad de 15 segundos — si el banner no resuelve en 15s, se limpia automáticamente.

**Comportamiento confirmado:** Las ventas (incluyendo vencidas, ediciones y anulaciones) nunca se pierden — van a cola AsyncStorage y se sincronizan automáticamente al recuperar conexión. No se generan duplicados (verificación previa en backend).

---

### Fix AP GUERRERO — Editar venta bloqueaba cambio de método de pago desde historial

**Archivos:**
- `api/views.py` — endpoint PATCH `/api/ventas-ruta/{id}/editar/`
- `AP GUERRERO/components/Ventas/VentasScreen.js` — `metaEdicionConfirmada`

**Problema:** Después de editar una venta (cambiar productos/cantidades), el botón de cambio de método de pago en la card del historial quedaba desactivado (texto plano sin el `▼` interactivo). El usuario no podía cambiar el método de pago aunque nunca lo hubiera cambiado explícitamente.

**Causa raíz (backend):** El payload de edición siempre incluye `metodo_pago`. El backend tenía:
```python
if metodo_pago_normalizado is not None:
    venta.metodo_pago = metodo_pago_normalizado
    venta.metodo_pago_cambiado = True  # ← se ejecutaba SIEMPRE
```
Esto marcaba `metodo_pago_cambiado = True` incluso cuando la edición era de productos (no un cambio explícito del método de pago), consumiendo el slot del cambio posterior.

**Fix backend (`views.py`):**
```python
if metodo_pago_normalizado is not None:
    venta.metodo_pago = metodo_pago_normalizado
    if solo_cambio_metodo_pago:   # ← solo cuando es cambio explícito desde historial
        venta.metodo_pago_cambiado = True
```

**Fix frontend (`VentasScreen.js`):** `metaEdicionConfirmada` ahora sincroniza `metodo_pago_cambiado` desde la respuesta del backend para mantener consistencia si el flag ya estaba en `True` antes de editar.

**Regla de negocio confirmada:**
- `editada` y `metodo_pago_cambiado` son flags independientes.
- Editar productos → `editada = True`, `metodo_pago_cambiado` intacto.
- Cambiar método desde historial → `metodo_pago_cambiado = True` (una sola vez).
- Una venta editada puede tener el método cambiado una vez desde el historial.

---

### Fix AP GUERRERO — Pedido entregado podía registrarse dos veces en offline

**Archivos:**
- `AP GUERRERO/components/Ventas/VentasScreen.js` — `confirmarEntregaPedido`
- `api/views.py` — endpoint `marcar_entregado`

**Problema:** Con internet intermitente, al marcar un pedido como entregado:
1. El frontend guardaba la acción en cola `pedidos_acciones_pendientes` sin verificar si ya existía → podía quedar duplicada.
2. El backend no verificaba si el pedido ya estaba en `ENTREGADO` → si el sync ejecutaba dos veces, procesaba ambas, acumulando notas duplicadas en el pedido.

**Fix frontend (`VentasScreen.js`):**
```javascript
const yaExiste = pendientes.some(a => a.id === accionPendiente.id && a.tipo === 'ENTREGADO');
if (!yaExiste) {
    pendientes.push(accionPendiente);
    await AsyncStorage.setItem('pedidos_acciones_pendientes', JSON.stringify(pendientes));
}
```

**Fix backend (`views.py`) — idempotente:**
```python
if pedido.estado in ('ENTREGADO', 'ENTREGADA'):
    return Response({'success': True, 'message': 'Pedido ya estaba marcado como entregado'})
```

**Resultado:** No importa cuántas veces reintente la cola de sync, el pedido se entrega exactamente una vez.

---

### Fix AP GUERRERO — Stock offline incorrecto: vencidas se descontaban dos veces

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema:** En modo offline, al agregar vencidas y luego confirmar la venta, el stock quedaba con una deducción doble. Ejemplo: stock 145, carrito 10, vencidas 5 → el stock quedaba en 125 en vez de 130.

**Causa raíz — doble deducción:**
1. `handleGuardarVencidas` (línea ~5583): descuenta las vencidas de `stockCargue` inmediatamente al guardarlas en el modal ✓
2. `confirmarVenta` (línea ~4798): las volvía a descontar al confirmar la venta ✗

Al volver internet el stock se corregía porque el backend tenía el valor real.

**Fix:** Eliminada la segunda deducción en `confirmarVenta`. Las vencidas solo se descuentan una vez — en `handleGuardarVencidas`.

**Flujo correcto offline:**
- Stock inicial: 145
- Agrega 10 al carrito → lista muestra `145 - 10 = 135`
- Abre vencidas → ve 135 disponibles
- Guarda 5 vencidas → `stockCargue = 140`, lista muestra `140 - 10 = 130`
- Confirma venta → `stockCargue = 140 - 10 = 130` (correcto)

---

### Despliegue Abril 2026 — Commits y VPS

**Archivos a commitear (2 commits):**

**Commit 1 — fixes funcionales:**
- `AP GUERRERO/` — todos los fixes de esta sesión (VentasScreen.js, config.js PROD, rutasApiService.js, ConfirmarEntregaModal.js, etc.)
- `api/models.py`, `api/serializers.py`, `api/views.py`
- `api/migrations/0101_add_verificado_despachador_pedido.py`
- `api/migrations/0102_add_fecha_ultima_edicion_venta_ruta.py`
- `frontend/src/components/` (Cargue, Pedidos, inventario, rutas)
- `frontend/src/pages/ReportesAvanzadosScreen.jsx`
- `frontend/src/pages/ReportesAvanzados/` (DashboardIntegral, cargueOrden)
- `frontend/src/services/rutasService.js`, `pendingInventarioService.js`

**Commit 2 — documentación:**
- `AI_CONTEXT.md`

**Ignorar:** `api/__pycache__/`, archivos markdown sueltos (ANALISIS_*, CHECKLIST_*, README_*, PENDIENTES_*, STICKY_*, SUBIR_*, RESUMEN_*, DESPLIEGUE_*), `ia_models/`, `optimizacion_completar_venta.js`, `.kiro/docs/`

**En el VPS después del push:**
```bash
git pull origin main
python3 manage.py migrate   # aplica 0101 y 0102
# reiniciar docker/gunicorn
```

---

### Fix AP GUERRERO — Botones cortados en APK (SafeArea) + teclado modal vencidas

**Archivos:**
- `AP GUERRERO/App.js`
- `AP GUERRERO/components/Ventas/VentasScreen.js`
- `AP GUERRERO/components/Cargue.js`
- `AP GUERRERO/components/ProductList.js`
- `AP GUERRERO/components/Ventas/DevolucionesVencidas.js`

**Problema 1 — Botones cortados en APK:**
En Expo Go los botones del footer se veían bien, pero en el APK real quedaban debajo de la barra de navegación de Android porque no se respetaban los insets del sistema.

**Fix:**
- `App.js`: envuelto con `SafeAreaProvider` de `react-native-safe-area-context`
- `VentasScreen.js`: botón "Completar Venta" usa `useSafeAreaInsets` → `paddingBottom: Math.max(insets.bottom, 16)`
- `Cargue.js`: botón "Recargar" usa `insets.bottom` en `marginBottom`
- `ProductList.js`: botón "Enviar Sugerido" (position: absolute) usa `insets.bottom` en `bottom`

**Regla:** Siempre usar `useSafeAreaInsets` para botones fijos en la parte inferior en APK. `marginBottom: 40` fijo no es suficiente en todos los dispositivos.

**Problema 2 — Modal vencidas: botones Cancelar/Guardar inaccesibles con teclado:**
Al abrir el teclado en el modal de vencidas, los botones del footer quedaban debajo del teclado y no se podía guardar.

**Fix:** `DevolucionesVencidas.js` — `KeyboardAvoidingView` cambiado de `behavior={undefined}` a `behavior="height"` en Android (antes solo funcionaba en iOS con `"padding"`).

---

### Fix: Tabla confirmación inventario — responsive tablet

**Archivo:** `frontend/src/components/inventario/TablaConfirmacionProduccion.jsx`

**Problema:** En tablet las columnas de Maquila se apretaban y los badges de CANTIDAD quedaban cortados.

**Fix:**
- Fuente reducida a `0.78rem`
- Padding reducido a `6px 8px`
- Encabezados abreviados: CANT. / VENCE / HORA / EST.
- `minWidth: 520px` + `overflowX: auto` — scroll horizontal en pantallas pequeñas
- `whiteSpace: nowrap` en columnas de datos

---

## Sesión 2026-04-05 — Backfill asignado_a_id + Dashboard filtro vendedor

### Contexto
El Dashboard de Reportes Avanzados mostraba `TOTAL PEDIDOS: $0` para todos los vendedores. Causa: todos los pedidos históricos tienen `asignado_a_id = null` porque el sistema siempre usó el campo `vendedor` (texto/nombre) en lugar de un ID explícito.

---

### Fix: Dashboard — TOTAL PEDIDOS $0 por asignado_a_id null

**Archivo:** `frontend/src/pages/ReportesAvanzados/DashboardIntegral.jsx`

**Problema:** El filtro de pedidos por vendedor usaba solo `p.asignado_a_id === idSheet`. Como todos los pedidos históricos tienen `asignado_a_id = null`, el resultado siempre era 0.

**Fix — filtro con fallback por nombre:**

1. Se agregó fetch a `/api/vendedores-cargue/` para obtener el mapa `ID → nombre`:
```javascript
const resV = await fetch(`${API_URL}/api/vendedores-cargue/`);
const vendedoresArr = await resV.json();
const nombrePorId = {};
vendedoresArr.forEach(v => {
    nombrePorId[v.id] = v.nombre.trim().toUpperCase();
});
```

2. Filtro de pedidos ahora usa nombre como fallback:
```javascript
const nombreVendedorId = nombrePorId[idSheet] || '';
const pedidosID = pedidosData.filter(p => {
    if (p.estado === 'ANULADA') return false;
    if (p.asignado_a_id && p.asignado_a_id === idSheet) return true;
    if (nombreVendedorId && p.vendedor &&
        p.vendedor.trim().toUpperCase() === nombreVendedorId) return true;
    return false;
});
```

**Endpoint usado:** `GET /api/vendedores-cargue/` — ya existía, retorna `[{id: "ID1", nombre: "JHONATHAN ONOFRE"}, ...]`

---

### Fix backend: serializers.py — auto-fill asignado_a_id al crear pedido

**Archivo:** `api/serializers.py` — `PedidoSerializer.create()`

**Problema:** Nuevos pedidos creados desde la web también quedaban con `asignado_a_id = null`.

**Fix:** Auto-fill automático al crear pedido si viene `vendedor` (nombre) pero no `asignado_a_id`:
```python
if not validated_data.get('asignado_a_id') and validated_data.get('vendedor'):
    try:
        from .models import Vendedor as VendedorModel
        nombre_vendedor = str(validated_data['vendedor']).strip().lower()
        vendedor_obj = VendedorModel.objects.filter(
            activo=True, nombre__iexact=nombre_vendedor
        ).first()
        if vendedor_obj:
            validated_data['asignado_a_id'] = vendedor_obj.id_vendedor
            validated_data['asignado_a_tipo'] = 'VENDEDOR'
    except Exception:
        pass
```

**Resultado:** Pedidos nuevos ya quedan con `asignado_a_id` correcto desde el momento de creación.

---

### Script: Backfill asignado_a_id en pedidos históricos

**Archivo:** `api/management/commands/backfill_asignado_a_id.py` (nuevo)

**Propósito:** Rellena `asignado_a_id` en los 2394 pedidos históricos que tienen `vendedor` (nombre) pero `asignado_a_id = null`.

**Uso:**
```bash
# Simulación (no guarda)
python manage.py backfill_asignado_a_id

# Aplicar cambios reales
python manage.py backfill_asignado_a_id --apply
```

**Lógica:** Construye mapa `nombre_lower → id_vendedor` con vendedores activos. Para cada pedido sin `asignado_a_id`, busca por nombre normalizado (strip + lower).

**Resultado en VPS (2026-04-05):**
```
✅ Actualizados: 2391 | Sin match: 3 | Total: 2394
```
Los 3 sin match corresponden a vendedores inactivos/viejos (WILSON, CARLOS) — esos pedidos permanecen con `asignado_a_id = null` sin impacto operativo.

**Comando ejecutado en VPS:**
```bash
docker exec crm_backend_prod python manage.py backfill_asignado_a_id --apply
```

---

### Despliegue VPS — Sincronización después de divergencia

**Problema:** El VPS tenía 1 commit extra (`626e62b` = cherry-pick de `8043d8e` que ya estaba en main). Esto causaba que `git pull` fallara por historias divergentes.

**Solución aplicada:**
```bash
# En VPS
git reset --hard origin/main  # seguro: solo código, sin datos de BD
git pull origin main           # ya no hay divergencia
```

**Comandos completos de despliegue usados:**
```bash
cd ~/crm-fabrica
git reset --hard origin/main
git pull origin main
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d --no-deps backend
docker exec crm_backend_prod python manage.py migrate
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d --no-deps frontend
docker compose -f docker-compose.prod.yml restart nginx
```

**Migraciones aplicadas:**
- `0101_add_verificado_despachador_pedido`
- `0102_add_fecha_ultima_edicion_venta_ruta`

---

### AP GUERRERO — Modo PROD para APK

**Archivo:** `AP GUERRERO/config.js`

**Cambio:** `ENV = 'DEV'` → `ENV = 'PROD'`

**Propósito:** La app ahora apunta a `https://aglogistics.tech` en vez de la IP local. Necesario para generar el APK de distribución.

**Para volver a DEV:** cambiar `ENV = 'PROD'` → `ENV = 'DEV'` antes de probar en local con el servidor local corriendo.

---

### Reglas de negocio confirmadas (asignado_a_id)

| Campo | Descripción |
|-------|-------------|
| `vendedor` | Texto/nombre del vendedor (ej: "JAVIER TIBAVIJA") — campo legacy siempre presente |
| `asignado_a_id` | ID del vendedor (ej: "ID2") — antes siempre null, ahora se llena automáticamente |
| `asignado_a_tipo` | Siempre "VENDEDOR" cuando se llena |

El Dashboard ahora funciona con ambos campos: si `asignado_a_id` existe lo usa directamente; si es null usa el nombre del campo `vendedor` como fallback.

**Fecha de implementación:** 5 de Abril de 2026

---

## Sesión 2026-04-05 (continuación) — Fixes APK: alertas edición + race conditions

### Fix 1: Alerta cuando edición falla permanentemente

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `sincronizarPendientesAutomatico` (~línea 646)

**Problema:** Si el backend rechazaba una edición (cualquier error permanente), la venta quedaba marcada como `requiere_revision=true` y era removida de la cola **silenciosamente**. El usuario no recibía ningún aviso.

**Fix:** Después de sincronizar, se detectan items con `requiere_revision=true` y se muestra un Alert con el cliente afectado y el motivo del error. Al presionar "Entendido", se llama `descartarVentaEnRevision(id)` para limpiar la cola.

```javascript
const enRevision = pendientesDespues.filter(v => v?.requiere_revision === true);
if (enRevision.length > 0) {
    // ... clasifica motivo (conflicto edición, stock insuficiente, otro)
    Alert.alert('⚠️ Edición no guardada', `... ${filas} ...`, [{
        text: 'Entendido',
        onPress: async () => {
            for (const v of enRevision) {
                await descartarVentaEnRevision(id);
            }
        }
    }]);
}
```

---

### Fix 2: Race condition en anulación — historial muestra venta activa tras anular

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — bloque `finally` de anulación (~línea 3455)

**Problema:** El bloque `finally` llamaba `cargarHistorialReimpresion()` inmediatamente después de anular. Esto recargaba el historial desde el backend antes de que el backend procesara la anulación, sobreescribiendo el estado `ANULADA` que `marcarAnulada` ya había aplicado localmente.

**Fix:** Eliminar `cargarHistorialReimpresion()` del `finally`. La función `marcarAnulada` ya actualiza el estado local correctamente — no es necesario recargar desde backend.

```javascript
// Antes (causaba race condition):
} finally {
    setCargandoAnulacion(false);
    try { cargarHistorialReimpresion(); } catch (_) { }
}

// Después (fix):
} finally {
    setCargandoAnulacion(false);
    // marcarAnulada ya actualizó el estado local — no recargar aquí.
}
```

---

### Fix 3: Flash de stock incorrecto al hacer venta (doble deducción temporal)

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `confirmarVenta` (~línea 4805)

**Síntoma:** Al hacer una venta, el stock bajaba al número correcto (ej. 7→6), pero por un momento breve mostraba un valor incorrecto (5) antes de volver al correcto (6).

**Causa — race condition:**
```
1. confirmarVenta: setStockCargue(6)  ← correcto
2. Auto-sync: envía venta al backend → backend descuenta → stock backend = 6
3. refrescarStockSilencioso se dispara:
   - Carga stock del backend = 6
   - reconciliarStockConVentasLocales ve la venta con sincronizada=false (aún no actualizado)
   - Descuenta de nuevo: 6 - 1 = 5  ← incorrecto (doble deducción)
4. Cuando sincronizada se actualiza a true → próximo refresh vuelve a 6
```

**Fix:** Agregar `bloqueoRefreshStockHastaRef.current = Date.now() + 30 * 1000` antes de `setStockCargue` en `confirmarVenta`. Esto bloquea `refrescarStockSilencioso` por 30 segundos — tiempo suficiente para que la venta quede marcada como `sincronizada=true`.

El mismo mecanismo ya existía para ediciones (línea 3070), solo faltaba aplicarlo a ventas nuevas.

---

### Estado de bugs anteriores (actualizados)

- **Bug historial reimpresión tras anulación** → **RESUELTO** con Fix 2 (arriba)
- **Bug edición silenciosa sin alerta** → **RESUELTO** con Fix 1 (arriba)
- **Bug flash stock incorrecto** → **RESUELTO** con Fix 3 (arriba) — detectado en pruebas APK segunda ronda
- **Bug flash stock = 0 al confirmar venta** → **RESUELTO** con Fix 4 (abajo) — detectado en pruebas APK tercera ronda

**Archivos modificados (solo APK):** `AP GUERRERO/components/Ventas/VentasScreen.js`
**Backend/Frontend web:** sin cambios

---

### Fix 4: Flash de stock = 0 al confirmar venta (cargarStockCargue en vuelo)

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `cargarStockCargue` (~línea 3963)

**Síntoma:** Al hacer una venta de 2 unidades con 4 en stock, durante el modal de impresión el stock mostraba 0 por un instante y luego se ajustaba al correcto (2).

**Causa:** El Fix 3 bloqueó que `refrescarStockSilencioso` *llamara* a `cargarStockCargue`, pero no evitaba que una llamada a `cargarStockCargue` que ya estaba *en vuelo* aplicara su resultado. Esa llamada llegaba, veía el stock del backend (aún sin descontar porque la sync era simultánea), hacía `reconciliarStockConVentasLocales` que tampoco restaba bien, y terminaba llamando `setStockCargue({})` al no encontrar cargue o `setStockCargue(valorIncorrecto)`.

**Fix:** Dentro de `cargarStockCargue`, antes de cada `setStockCargue`, verificar si el bloqueo está activo. Si sí, descartar el resultado y retornar sin modificar el estado:

```javascript
// Path normal (fetch exitoso):
if (Date.now() < (bloqueoRefreshStockHastaRef.current || 0)) {
    console.log('⏸️ cargarStockCargue: bloqueo activo, descartando recarga.');
    return { hayCargue: true, totalProductos, estado: estadoCargue };
}
setStockCargue(stockReconciliado);

// Path offline (usando caché):
if (Date.now() < (bloqueoRefreshStockHastaRef.current || 0)) {
    console.log('⏸️ cargarStockCargue (caché): bloqueo activo, descartando recarga.');
    return { ... };
}
setStockCargue(stockReconciliado);
```

**Resultado:** El stock se queda en el valor correcto calculado en `confirmarVenta` (ej. 4→2) sin ningún flash de 0 ni valor incorrecto.

---

## Bug Pendiente — Historial reimpresión no se actualiza al anular venta editada (APK)

**Detectado:** 5 de Abril de 2026 en pruebas APK

**Síntoma:** Al anular una venta que previamente fue editada (`EDITADA x1`), la anulación funciona correctamente (stock devuelto, total en $0, backend actualizado), pero el modal de reimpresión (🧾 historial) sigue mostrando la venta como activa. Solo al salir de Ventas y volver a entrar el historial muestra la venta como anulada.

**Causa probable:** La venta editada tiene IDs mezclados (ID local + ID backend). El cross-matching de `marcarAnuladaUI` (fix 2026-04-03) cubre casos normales pero puede no cubrir el caso específico de venta editada antes de ser anulada.

**Workaround actual:** Salir y re-entrar a Ventas — muestra el estado correcto sin pérdida de datos.

**Requiere modificación:** APK + backend (coordinar nuevo build y despliegue).

**Archivos a revisar:**
- `AP GUERRERO/components/Ventas/VentasScreen.js` — funciones `marcarAnuladaUI`, `marcarAnulada`, `abrirHistorialReimpresion`

**Estado:** Pendiente para próxima sesión de desarrollo.

---

## Bug Crítico Pendiente — Edición de venta falla silenciosamente sin notificar al usuario (APK)

**Detectado:** 5 de Abril de 2026 en pruebas APK

**Síntoma:** El usuario edita una venta con buena señal 4G. La app muestra localmente "EDITADA x1" y el nuevo total. Sin embargo:
- No aparece banner naranja de pendientes
- Al salir y volver a entrar a Ventas, la venta regresa a su estado original sin editar
- El backend nunca recibió la edición actualizada
- El usuario no recibió ningún aviso de error

**Causa raíz:** El PATCH al backend fue rechazado (posiblemente `STOCK_CARGUE_INSUFICIENTE`, `VENTA_YA_MODIFICADA` u otro error 400/500). La función `esErrorPermanenteDeSincronizacion` en `ventasService.js` detectó el error como permanente, lo removió de la cola **silenciosamente** y no notificó al usuario. El estado local se actualizó pero no se persistió en AsyncStorage → al recargar, la app vuelve al estado del backend (original).

**Flujo del bug:**
```
Usuario edita venta → PATCH enviado → Backend rechaza (error permanente)
→ ventasService marca como requiere_revision → remueve de cola
→ SIN alerta al usuario
→ Usuario sale/entra → app recarga desde backend → edición perdida
```

**Fix requerido (APK + backend):**
- `AP GUERRERO/services/ventasService.js`: cuando `esErrorPermanenteDeSincronizacion` se activa para una **edición**, emitir evento o guardar flag en AsyncStorage con el error
- `AP GUERRERO/components/Ventas/VentasScreen.js`: leer ese flag al recargar y mostrar alerta: *"La edición de [venta] no pudo guardarse: [motivo]. La venta quedó con sus valores originales."*
- Investigar qué error específico retorna el backend para esta edición (revisar logs del VPS)

**Prioridad:** Alta — el usuario pierde ediciones sin saberlo.

**Requiere modificación:** APK + posible ajuste backend.

**Archivos a revisar:**
- `AP GUERRERO/services/ventasService.js` — función `esErrorPermanenteDeSincronizacion` y manejo de ediciones
- `AP GUERRERO/components/Ventas/VentasScreen.js` — flujo post-sincronización de ediciones
- `api/views.py` — logs del endpoint PATCH para identificar el error exacto

---

## Sesión 2026-04-05/06 — Fixes edición ventas app móvil + UX stock + scroll clientes

### Fix 1: Error de edición sin internet — no marca permanente si es falla de red

**Archivos:** `AP GUERRERO/services/ventasService.js`

**Problema:** `_esEdicion ? true` marcaba TODO error de edición como permanente (`requiere_revision`), incluyendo errores de red. Sin internet, la edición se marcaba como revisión → el usuario descartaba → edición perdida.

**Fix:**
```javascript
const hayRespuestaServidor = error?.status != null || resultadoEnvio?.status != null;
const errorPermanente = _esEdicion
    ? hayRespuestaServidor  // solo permanente si el servidor rechazó explícitamente
    : esErrorPermanenteDeSincronizacion(resultadoEnvio, error);
```
- Error de red (sin status HTTP) → reintentable → queda en cola para cuando vuelva señal
- Error del servidor (400/409) → permanente → alerta al usuario

---

### Fix 2: foto_vencidos nunca se incluía en el reintento de edición desde cola

**Archivo:** `AP GUERRERO/services/ventasService.js`

**Problema:** El check `String(ventaNormalizada.foto_vencidos).startsWith('data:')` siempre daba `false` porque `foto_vencidos` es un objeto `{productoId: [uri]}`, no string. `String({...})` = `"[object Object]"`.

**Fix:**
```javascript
if (ventaNormalizada.foto_vencidos &&
    typeof ventaNormalizada.foto_vencidos === 'object' &&
    Object.keys(ventaNormalizada.foto_vencidos).length > 0) {
    payloadEdicionClean.foto_vencidos = ventaNormalizada.foto_vencidos;
}
```

---

### Fix 3: editarVentaRuta — timeout reducido + soporte FormData para fotos

**Archivo:** `AP GUERRERO/services/rutasApiService.js`

**Problema:** `editarVentaRuta` siempre usaba JSON con timeout de 30s. Con foto nueva en edición: JSON con base64 de 2-4MB → timeout o rechazo. Las ventas nuevas con foto funcionaban porque `enviarVentaRuta` usaba FormData con archivos reales.

**Fix — misma lógica que `enviarVentaRuta`:**
- Detecta si `foto_vencidos` tiene URIs de archivo (`file:///`, no `data:`)
- Si sí → **FormData** con archivos reales adjuntos + timeout 25s
- Si no → **JSON** + timeout 10s (fallo rápido, alert en ~10s)

```javascript
const hayFotosArchivo = hayFotos && Object.values(datosActualizados.foto_vencidos).some((fotosProducto) =>
    Array.isArray(fotosProducto) &&
    fotosProducto.some((foto) => typeof foto === 'string' && !foto.startsWith('data:'))
);
const timeoutMs = hayFotosArchivo ? 25000 : 10000;
```

---

### Fix 4: Promise.race en edición — 6s insuficiente para subir foto

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema:** El `Promise.race` de 6s en `confirmarEdicionVenta` cancelaba la subida de foto antes de completar. Las ventas nuevas con foto no tenían este límite (se subían en background con 25s). En edición, la foto siempre fallaba el intento directo → iba a cola → cola con JSON base64 grande → también fallaba.

**Fix:**
```javascript
const hayFotoEnEdicion = Object.keys(fotosLocalesEdicion).length > 0;
const timeoutRace = hayFotoEnEdicion ? 20000 : 6000;
await Promise.race([promiseSync, new Promise(resolve => setTimeout(resolve, timeoutRace))]);
```
- Con foto: espera 20s (señal lenta tiene margen)
- Sin foto: 6s (respuesta rápida)

**Nota:** `payloadEdicion.foto_vencidos` ahora pasa URIs directas (no base64) al llamado directo, para que `editarVentaRuta` use FormData. La cola de reintento sigue usando base64 para durabilidad.

---

### Fix 5: Spinner de stock en vez de flash de 0

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema:** Al confirmar venta, el stock mostraba 0 brevemente mientras se procesaba (fórmula `stockCargue - carrito` daba 0 en el instante de transición).

**Fix:** Estado `stockOculto` que dura 1.5 segundos al confirmar venta. Mientras activo, muestra `<ActivityIndicator>` azul en vez del número de stock.

```javascript
setStockOculto(true);
setTimeout(() => setStockOculto(false), 1500);
```

En `renderProducto`:
```javascript
{stockOculto
    ? <ActivityIndicator size="small" color="#1d4ed8" style={{ marginLeft: 8 }} />
    : <Text style={[styles.stockTextoInline, ...]}>{`  Stock: ${stock}`}</Text>
}
```

---

### Fix 6: elevation manija revelar turno — sombra visible en lados

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js`

**Problema:** `elevation: 10` en `manijaRevelarTurno` generaba sombra visible en los lados, haciendo que la barrita gris pareciera enmarcada.

**Fix:** `elevation: 10 → elevation: 2` — suficiente para quedar encima del badge flotante sin sombra visible.

---

### Fix 7: Scroll con saltos en lista de clientes

**Archivo:** `AP GUERRERO/components/Ventas/ClienteSelector.js`

**Problema:** `getItemLayout` con `ITEM_HEIGHT_ESTIMADO = 96` asumía altura fija para todos los ítems. Los ítems tienen alturas variables (cliente normal, con pedido pendiente, con pedido entregado, etc.). Cuando la altura real ≠ 96 → FlatList posiciona mal → saltos al scrollear.

**Fix:** Eliminar `getItemLayout`. FlatList mide los ítems solo. Sin saltos, leve impacto en render inicial pero imperceptible con los demás parámetros de optimización (`removeClippedSubviews`, `windowSize`, `maxToRenderPerBatch`).

---

## Sesión 2026-04-06 — Simplificación edición ventas + fix conteo vencidas

### Fix 1: Quitar vencidas del modal de edición

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js`

**Decisión:** Después de múltiples intentos fallidos de hacer que editar + vencidas + foto llegara confiablemente al servidor, se decidió simplificar: el modal de edición solo permite cambiar productos y método de pago. Las vencidas se reportan únicamente desde la venta normal.

**Eliminado:**
- Estados: `mostrarVencidasEdicion`, `vencidasEdicion`, `fotoVencidasEdicion`
- Funciones: `normalizarVencidasVentaEdicion`, `normalizarFotosVentaEdicion`, `abrirModalVencidasDesdeEdicion`, `handleGuardarVencidasEdicion`, `obtenerCantidadOriginalVencidaEdicion`, `construirAdvertenciasVencidasEdicion`, `obtenerAdvertenciasStockVencidasEdicion`, `obtenerStockDisponibleVencidaEdicion`, `totalItemsVencidasEdicion`
- JSX: botón "📷 Adjuntar vencidas" del header del modal de edición, `<DevolucionesVencidas>` de edición
- Payload: `productos_vencidos` y `foto_vencidos` eliminados de `confirmarEdicionVenta`
- Timeout race simplificado a 6s fijo

**No tocado:** Flujo de venta normal — vencidas siguen funcionando igual al crear venta nueva.

### Fix 2: Reporte de vencidas (total=0) no cuenta como venta del cliente

**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `contarVentasActivasCliente`

**Problema:** Al reportar solo vencidas (total=$0), el sistema lo contaba como venta real del cliente. Si luego se hacía la venta real, avisaba "segunda venta" o bloqueaba al llegar al límite de 2.

**Fix:**
```javascript
if (parseFloat(venta?.total || 0) === 0) return false; // reporte puro de vencidas, no cuenta como venta
```

**Resultado:** Reportar vencidas no consume el slot de venta. El cliente sigue disponible para 1ª y 2ª venta normal.

**Commit:** `29ecf22`

---

## Sesión 2026-04-06 — Fix Pedidos VPS (Integridad Referencial)

### Fix 1: Error FK (producto_id) al generar pedido en VPS

**Archivos:** `api/serializers.py`, `frontend/src/components/Pedidos/PaymentModal.jsx`

**Problema:** Al generar pedidos en el VPS, se reportaba el error `Key (producto_id)=(X) is not present in table api_producto`.
- **Causa:** Clientes migrados desde entornos locales o bases de datos anteriores conservaban listas de "Productos Frecuentes" con IDs obsoletos (ej: ID=1). En el VPS, los productos comienzan desde el ID 17.
- **Síntoma:** El carrito del frontend cargaba el ID viejo del caché y lo enviaba al servidor, causando una violación de llave foránea (FK IntegrityError).

**Solución aplicada (Plan de Respaldo):**
1.  **Backend (`PedidoSerializer.create`):** Lógica que verifica si el `producto_id` existe. Si no, intenta resolverlo por **nombre exacto** (`producto_nombre`) y actualiza el ID al correcto del VPS (ej: 1 → 17). 
2.  **Frontend (`PaymentModal.jsx`):** El payload de `detalles` ahora incluye `producto_nombre` para el fallback del servidor.

**Conclusión:** Crear un **cliente nuevo** directamente en el VPS soluciona el problema de raíz para ese cliente.

**Commit:** `f884dd3`

---


---



---

## 🎨 Fix Tabla Gestión de Clientes - Balance de Columnas (6 Abril 2026)

### Problema Detectado

En el VPS (aglogistics.tech), la tabla de Gestión de Clientes mostraba problemas de distribución de espacio:

1. **Columna "Teléfono"**: Tenía demasiado espacio vacío a los lados
2. **Columna "Días Visita"**: Estaba muy comprimida (max-width: 160px) y se sobreponía visualmente con la columna "Ciudad"
3. **Columnas "Estado" y "Acciones"**: Se salían de la pantalla hacia la derecha debido al empuje de las columnas anteriores

**Causa raíz**: Los datos en el VPS tienen textos más largos en "Días Visita" (ej: "Lunes, Miércoles, Jueves, Viernes, Martes, Sábado") comparado con local (ej: "Lunes"), lo que causaba que esa columna empujara las demás fuera de la vista.

### Solución Implementada

Se ajustaron los anchos de las columnas para un mejor balance visual:

**Archivo modificado**: `frontend/src/pages/ListaClientesScreen.jsx`

**Cambios aplicados**:

1. **Columna Teléfono**:
   - Antes: Sin límite de ancho
   - Ahora: `maxWidth: '140px'` con `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'`
   - Resultado: Números largos se cortan con `...` para no ocupar espacio innecesario

2. **Columna Días Visita**:
   - Antes: `maxWidth: '160px'`
   - Ahora: `minWidth: '180px'`, `maxWidth: '200px'`
   - Resultado: Más espacio para mostrar múltiples días sin sobreponerse con Ciudad

3. **Columna Ciudad**:
   - Antes: Sin límite
   - Ahora: `minWidth: '100px'`
   - Resultado: Mantiene un ancho mínimo para no comprimirse demasiado

### Resultado Final

- ✅ Todas las columnas (Identificación, Negocio/Contacto, Teléfono, Días Visita, Ciudad, Estado, Acciones) son visibles sin scroll horizontal
- ✅ No hay sobreposición entre columnas
- ✅ El espacio está balanceado según la importancia y longitud típica de cada dato
- ✅ Los textos largos se manejan con ellipsis (`...`) en lugar de empujar otras columnas

### Commits Relacionados

1. `05b8c81` - "fix: Abreviar días visita en tabla clientes para evitar scroll horizontal" (primer intento)
2. `9b79cf9` - "fix: Ajustar anchos de columnas en tabla clientes (Teléfono más compacto, Días Visita más espacio)" (solución final)

### Despliegue

```bash
# En VPS
cd ~/crm-fabrica
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build frontend
docker compose -f docker-compose.prod.yml restart nginx
```

**Fecha de implementación**: 6 de Abril de 2026

---


---

## 🎯 Fix Tabla Ventas Ruta - Optimización de Columnas y Scroll Horizontal (6 Abril 2026)

### Problema Detectado

En el VPS (aglogistics.tech), la tabla de "Ventas de Ruta (App Móvil)" presentaba problemas de distribución de espacio:

1. **Columna "TOTAL"**: Ocupaba demasiado espacio debido a los badges (EDITADA, VENCIDAS, 2ª VENTA) que se mostraban junto al monto
2. **Columna "ACCIONES"**: Tenía mucho espacio vacío a pesar de solo contener un ícono de ojo
3. **Columna "ACCIONES" cortada**: En algunos casos, la columna se salía de la pantalla hacia la derecha
4. **Sin scroll horizontal**: No había forma de desplazarse horizontalmente con el mouse para ver todas las columnas

### Solución Implementada

Se optimizaron los anchos de las columnas y se agregó funcionalidad de scroll horizontal con el mouse.

**Archivo modificado**: `frontend/src/components/rutas/ReporteVentasRuta.jsx`

**Cambios aplicados**:

1. **Columna TOTAL**:
   - Antes: Sin límite de ancho
   - Ahora: `minWidth: '140px'`, `maxWidth: '180px'`
   - Resultado: Espacio controlado para el monto y los badges sin empujar otras columnas

2. **Columna ACCIONES**:
   - Antes: Sin límite de ancho
   - Ahora: `width: '80px'` fijo con `padding: '0.5rem'`
   - Resultado: Columna compacta que solo ocupa el espacio necesario para el ícono del ojo

3. **Scroll Horizontal con Mouse (Drag to Scroll)**:
   - Se agregó funcionalidad de "arrastrar para hacer scroll" en el contenedor `.table-responsive`
   - El cursor cambia a `grab` (mano abierta) al pasar sobre la tabla
   - Al hacer clic y arrastrar, el cursor cambia a `grabbing` (mano cerrada)
   - El usuario puede desplazarse horizontalmente arrastrando con el mouse
   - Velocidad de scroll: `2x` (multiplicador de desplazamiento)

**Código del scroll horizontal**:
```javascript
<div className="table-responsive" 
     style={{ overflowX: 'auto', cursor: 'grab' }} 
     onMouseDown={(e) => {
         const ele = e.currentTarget;
         ele.style.cursor = 'grabbing';
         const startX = e.pageX - ele.offsetLeft;
         const scrollLeft = ele.scrollLeft;
         const onMouseMove = (e) => {
             const x = e.pageX - ele.offsetLeft;
             const walk = (x - startX) * 2; // Velocidad 2x
             ele.scrollLeft = scrollLeft - walk;
         };
         const onMouseUp = () => {
             ele.style.cursor = 'grab';
             document.removeEventListener('mousemove', onMouseMove);
             document.removeEventListener('mouseup', onMouseUp);
         };
         document.addEventListener('mousemove', onMouseMove);
         document.addEventListener('mouseup', onMouseUp);
     }}>
```

### Resultado Final

- ✅ Columna TOTAL más compacta (140-180px) con espacio controlado para badges
- ✅ Columna ACCIONES reducida a 80px (solo el espacio necesario)
- ✅ Todas las columnas visibles sin que ACCIONES se corte
- ✅ Scroll horizontal funcional con el mouse (drag to scroll)
- ✅ Mejor aprovechamiento del espacio en pantalla
- ✅ UX mejorada: el usuario puede navegar la tabla arrastrando con el mouse

### Columnas de la Tabla

| Columna | Ancho | Contenido |
|---------|-------|-----------|
| Hora | Auto | Hora de la venta + hora de edición (si aplica) |
| Vendedor | Auto | Nombre del vendedor |
| Negocio | Auto | Nombre del negocio |
| Cliente | Auto | Nombre del cliente |
| Total | 140-180px | Monto + badges (EDITADA, VENCIDAS, 2ª VENTA) |
| Acciones | 80px | Ícono de ojo para ver detalle |

### Commits Relacionados

- `2715606` - "fix: Optimizar columnas TOTAL y ACCIONES en Ventas Ruta + scroll horizontal con mouse"

### Despliegue

```bash
# En VPS
cd ~/crm-fabrica
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build frontend
docker compose -f docker-compose.prod.yml restart nginx
```

**Fecha de implementación**: 6 de Abril de 2026

---

## 🖨️ PROBLEMA: Impresora térmica imprime caracteres basura (garbled output)

**Fecha:** 7 de Abril de 2026

### Descripción
La impresora móvil **Digital POS DIG-M324** imprime caracteres aleatorios/basura de forma intermitente después de imprimir un ticket normal.

### Stack de impresión
- **App CRM (AP Guerrero)** genera el ticket como HTML y llama `window.print()` vía iframe
- **Android** intercepta el trabajo de impresión
- **App ESC POS (Looped Labs)** actúa como servicio de impresión, convierte el HTML a comandos ESC/POS
- **Bluetooth** transmite los comandos a la impresora DIG-M324

### Causa principal identificada
El campo **"Establecer retraso de desconexión de la impresora"** estaba en **4 segundos**. Cuando el ticket tarda más de 4 segundos en transmitirse por Bluetooth, la conexión se cierra antes de terminar, dejando el buffer de la impresora corrompido y causando la impresión de basura.

### Solución aplicada (primer paso)
- En la app **ESC POS (Looped Labs)**: cambiar el retraso de desconexión de **4 segundos → 15 segundos**
- Ruta: Configuración → "Establecer retraso de desconexión de la impresora"

### Si el problema persiste — causas adicionales a investigar
1. **Caracteres especiales en nombres de productos**: tildes (á é í ó ú), ñ, símbolos (® © °) pueden ser interpretados como comandos ESC/POS por la impresora
2. **Tickets muy largos**: muchos productos en una venta pueden saturar el buffer Bluetooth
3. **Distancia/interferencia Bluetooth**: el celular estaba lejos de la impresora al imprimir
4. **Batería baja de la impresora**: señal Bluetooth inestable con batería descargada

### Nota sobre el código
El HTML generado por el CRM ya incluye `<meta charset="UTF-8">` correctamente en `frontend/src/components/Pos/PaymentModal.jsx`. El problema **no está en el código de la app** sino en la configuración del servicio de impresión ESC POS.

---

## 📅 BUG: fecha_entrega de pedidos salía con el día anterior al crear a las 5am

**Fecha:** 7 de Abril de 2026
**Commit:** `16eea5e`
**Archivo:** `frontend/src/components/Pedidos/PaymentModal.jsx`

### Descripción
Al crear pedidos temprano en la mañana (ej. 5:55am), la `fecha_entrega` quedaba guardada con el día anterior en lugar del día actual. Ejemplo: pedido creado el 6/4 a las 5:55am → `fecha_entrega = 2026-04-05` (incorrecto).

### Causa
En `PaymentModal.jsx` (Pedidos), dentro del `useEffect` que carga datos del cliente:
```js
if (clientData.fecha) setFechaEntrega(clientData.fecha);
```
Esta línea sobreescribía la `fechaEntrega` con la fecha histórica de la última gestión del cliente (que podía ser del día anterior), ignorando la fecha seleccionada en PedidosScreen.

### Solución
Se eliminó la línea que sobreescribía la fecha. Ahora la `fecha_entrega` siempre respeta la fecha seleccionada en PedidosScreen (`date` prop), que por defecto es hoy (`getFechaLocal()`).

### Flujo correcto después del fix
| Escenario | Resultado |
|-----------|-----------|
| Crear pedido hoy sin cambiar fecha | `fecha_entrega = hoy` ✓ |
| Crear pedido esta noche para mañana (cambiar fecha manualmente) | `fecha_entrega = mañana` ✓ |

### Contexto adicional
Un fix anterior (`63ec10d`) ya había removido `setDate(clienteData.fecha)` en `PedidosScreen.jsx`, pero el mismo bug persistía en `PaymentModal.jsx` donde la fecha del cliente seguía sobreescribiendo `fechaEntrega`.

---

## 🏭 FIX: Lotes de Producción y Maquila mezclados en tabla de confirmación

**Fecha:** 7 de Abril de 2026
**Commit:** `4595c3c`

### Descripción
La tabla "Producción Registrada" y "Maquila Registrada" mostraban los mismos lotes para todos los productos porque se guardaban en la misma tabla `Lote` sin distinción de origen. Al consultar por fecha (`getByFecha`), aparecían lotes de ambos módulos mezclados.

Problema adicional: el año de las fechas de vencimiento aparecía como `1926` o `0026` en vez de `2026`, causado por el constructor `new Date(año, mes, dia)` de JavaScript que interpreta años menores a 100 como `1900 + año`.

### Solución aplicada

**Backend:**
- Agregado campo `tipo_origen` (choices: `PRODUCCION` / `MAQUILA`, default: `PRODUCCION`) al modelo `Lote`
- Migración: `0103_add_tipo_origen_to_lote.py`
- `LoteViewSet` filtra por `tipo_origen` cuando se pasa como query param

**Frontend:**
- `loteService.create()` acepta `tipoOrigen` en el payload
- `loteService.getByFecha()` acepta segundo parámetro `tipoOrigen` para filtrar
- `InventarioProduccion`: guarda y consulta lotes con `tipoOrigen: 'PRODUCCION'`
- `InventarioMaquilas`: guarda y consulta lotes con `tipoOrigen: 'MAQUILA'`
- `TablaConfirmacionProduccion`: `formatearFecha` corregida — ya no usa `new Date(año, mes, dia)`, convierte años < 100 sumando 2000

### Comportamiento correcto
| Módulo | Lotes que muestra |
|--------|-------------------|
| Producción | Solo lotes de producción del día. Si hay 1 lote → todos los productos muestran ese lote. Si hay varios → se listan con su fecha. |
| Maquila | Solo lotes de maquila del día. Cada producto muestra el lote activo al momento de su registro. |

### Nota sobre datos históricos
Los lotes registrados **antes** del deploy del 7 de abril tienen `tipo_origen='PRODUCCION'` por defecto (no se puede saber si eran de Maquila o Producción). Los registros **nuevos** funcionan correctamente desde el 7 de abril en adelante.

---

## 🐛 BUG: Pedido incorrecto al entregar desde AP Guerrero (9 Abr 2026)

### Síntoma
En la app AP Guerrero, al abrir Ventas y ver la lista de clientes con pedidos, el número de pedido mostrado en la tarjeta del cliente era incorrecto (pertenecía a otro cliente). Al dar "Entregar", el modal de confirmación mostraba el cliente y productos del pedido equivocado.

**Ejemplo:**
- CRM Web: CARNES Y SOPAS PLAZA IMPERIAL → PED-002554 ✅
- App AP Guerrero: CARNES Y SOPAS PLAZA IMPERIAL → PED-002564 ❌ (de MASTER PIZZA)
- Al confirmar entrega: mostraba MASTER PIZZA con PED-002564 ❌

Reportado como falla en todos los pedidos del vendedor.

### Causa raíz
**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `verificarPedidoCliente()` (línea ~5264)

Cuando el cliente tenía un `__pedidoVista` (pedido preferido asignado por `ClienteSelector`), el código construía la lista así:
```javascript
// ❌ BUG
pedidosCliente = [pedidoPreferido, ...pedidosPendientes.filter(
    (pedido) => String(pedido?.id || '') !== String(pedidoPreferido?.id || '')
)];
```
Esto agregaba **todos los demás pedidos del vendedor** (de otros clientes) a la lista. Luego el sort ordenaba por número de pedido mayor primero, eligiendo el pedido de otro cliente con número más alto.

### Fix aplicado
```javascript
// ✅ FIX
pedidosCliente = [pedidoPreferido];
```
El `ClienteSelector` ya asigna el pedido correcto en `__pedidoVista`. No es necesario agregar pedidos de otros clientes.

- **Archivo modificado:** `AP GUERRERO/components/Ventas/VentasScreen.js`
- **Commit:** fix(ventas): corregir pedido incorrecto en entrega y crash al guardar edicion

---

## 🐛 BUG: App AP Guerrero cierra al guardar edición de venta (9 Abr 2026)

### Síntoma
Al editar una venta en AP Guerrero (agregar producto, poner cantidad, dar "Guardar Edición"), la app se cerraba abruptamente y la edición no se guardaba.

### Causa raíz
**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `confirmarEdicionVenta()` (línea ~2942)

Al recalcular el stock después de la edición, el código intentaba iterar sobre `vencidasOriginales`:
```javascript
vencidasOriginales.forEach((item) => { ... });
```
`vencidasOriginales` nunca fue definida en ese scope porque las vencidas fueron **removidas del flujo de edición** en un cambio anterior, pero este bloque de código quedó huérfano. Iterar sobre `undefined` causa un crash en React Native.

### Fix aplicado
Se eliminó el bloque completo de `vencidasOriginales.forEach(...)` ya que las vencidas no forman parte del flujo de edición.

- **Archivo modificado:** `AP GUERRERO/components/Ventas/VentasScreen.js`
- **Commit:** fix(ventas): corregir pedido incorrecto en entrega y crash al guardar edicion

---

## 🐛 BUG: Stock no bajaba en tiempo real al editar venta (9 Abr 2026)

### Síntoma
Al editar una venta en AP Guerrero y agregar un producto o cambiar su cantidad, el número de **Stock** visible al lado de cada producto no cambiaba. Si el stock era 33 y se ponía 1, seguía mostrando 33. Esto impedía saber cuánto quedaba disponible mientras se editaba.

### Causa raíz
**Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — función `obtenerMaximoEditableProducto()`

El cálculo del stock disponible era:
```javascript
return Math.max(0, stockActual + cantidadOriginal);
```
No restaba `cantidadEnCarrito` (lo que el vendedor ya puso en el carritoEdicion). Quedó así al remover las vencidas del flujo de edición en commit `29ecf22`.

### Fix aplicado
```javascript
const cantidadEnCarrito = parseInt(
    Object.entries(carritoEdicion).find(([k]) => normalizarNombreStockEdicion(k) === nombreNorm)?.[1]?.cantidad || 0
, 10) || 0;
return Math.max(0, stockActual + cantidadOriginal - cantidadEnCarrito);
```
- **Archivo modificado:** `AP GUERRERO/components/Ventas/VentasScreen.js`
- **Commit:** `da969bf` fix(ventas): stock en tiempo real en edicion y timeout edicion 20s

---

## 🐛 BUG: Edición de venta no llegaba al servidor (9-10 Abr 2026)

### Síntoma
Al guardar una edición en AP Guerrero, la edición no aparecía en Ventas Ruta del CRM. El backend nunca recibía el PATCH. Ventas sin vencidas/foto a veces funcionaban, ventas con vencidas nunca.

### Causa raíz (3 problemas encadenados)

**Problema 1 — Promise.race tragaba errores (commit `da969bf`, `75939d5`)**
`confirmarEdicionVenta()` usaba `Promise.race` con timeout de 6s. El `.catch()` tragaba errores silenciosamente y `respuestaEdicion` quedaba null.
- Fix intermedio: timeout subido a 20s (`da969bf`)
- Fix definitivo: Promise.race eliminado, reemplazado con `await editarVentaRuta()` directo (`75939d5`)

**Problema 2 — ID backend no se propagaba al estado React (commit `b8a2d37`)**
Cuando una venta se sincronizaba al backend, `AsyncStorage` recibía el ID numérico pero `ventasDelDia` (estado React) quedaba con el ID local (ej: `ID4-20261023-001`). `esVentaBackendPersistida()` verificaba si el ID era numérico → retornaba `false` → nunca entraba al `if` que envía el PATCH.
- **Archivo:** `VentasScreen.js` — `sincronizarPendientesAutomatico()` y `abrirEdicionVenta()`
- Fix: Tras sync exitoso, actualizar IDs en `ventasDelDia` desde AsyncStorage. Al abrir edición, resolver ID backend desde AsyncStorage como respaldo.

**Problema 3 — `id_local` no se preservaba en AsyncStorage (commit `e16c6a6`)**
El fix anterior buscaba por `id_local` en AsyncStorage, pero al sincronizar la venta en `guardarVenta()`, se sobreescribía `nuevaVenta.id` con el ID numérico sin guardar el ID local original. La búsqueda fallaba.
- **Archivo:** `services/ventasService.js` — `guardarVenta()` línea 1159
- Fix: `nuevaVenta.id_local = nuevaVenta.id` antes de sobreescribir con el ID del backend.

### Flujo corregido
1. Venta creada → ID local en React state + AsyncStorage
2. Venta sincronizada → AsyncStorage tiene `id` (numérico) + `id_local` (original)
3. `sincronizarPendientesAutomatico` exitoso → actualiza `ventasDelDia` con IDs numéricos
4. Abrir edición → si ID no es numérico, busca por `id_local` en AsyncStorage → resuelve ID backend
5. `esVentaBackendPersistida()` → `true` → `await editarVentaRuta()` envía PATCH directamente

### Archivos modificados
- `AP GUERRERO/components/Ventas/VentasScreen.js` — confirmarEdicionVenta, sincronizarPendientesAutomatico, abrirEdicionVenta
- `AP GUERRERO/services/ventasService.js` — guardarVenta

### Commits
- `da969bf` fix(ventas): stock en tiempo real en edicion y timeout edicion 20s
- `75939d5` fix(ventas): edicion llega al servidor de inmediato sin Promise.race
- `b8a2d37` fix(ventas): resolver ID backend en ventasDelDia para que edición se envíe al servidor
- `e16c6a6` fix(ventas): preservar id_local en AsyncStorage tras sincronización

---

## 🐛 BUG: Anulación no se reflejaba de inmediato en historial app (10 Abr 2026)

### Síntoma
Al anular una venta desde AP Guerrero, la anulación llegaba al servidor correctamente y el stock se devolvía, pero en el historial de reimpresión la venta seguía apareciendo como activa en vez de pasar a "Anuladas" de inmediato.

### Causa raíz
Mismo problema de IDs locales: `historialReimpresion` y `historialResumenPreview` mantenían IDs locales (ej: `ID4-20261023-001`) mientras `marcarAnulada()` comparaba con el ID numérico del backend. El match fallaba.

### Fix aplicado
Al resolver IDs del backend tras sincronización exitosa, también actualizar `historialReimpresion` y `historialResumenPreview` (antes solo se actualizaba `ventasDelDia`).

- **Archivo:** `AP GUERRERO/components/Ventas/VentasScreen.js` — `sincronizarPendientesAutomatico()`
- **Commit:** `00d85d4` fix(ventas): actualizar IDs backend en historial y resumen tras sincronización

---

## 🏷️ Badge "2ª VENTA" incorrecto en ventas de solo vencidas (10 Abr 2026)

### Problema
Cuando un vendedor reporta **solo vencidas** (sin vender productos, total $0) a un cliente que ya tiene una venta del día, el sistema marcaba esa entrada como "2ª VENTA" tanto en la app como en Ventas Ruta web. Esto generaba confusión porque no es una venta real, sino un reporte adicional de vencidas.

### Causa raíz
La detección de "segunda venta" agrupaba por cliente y marcaba toda entrada posterior como "2ª VENTA", sin importar si tenía total $0 (solo vencidas).

### Solución
Filtrar ventas con `total > 0` antes de determinar si hay segunda venta:
```javascript
const ventasReales = grupo.filter(v => parseFloat(v.total || 0) > 0);
if (ventasReales.length < 2) return; // no hay segunda venta real
```

### Archivos modificados
1. **`AP GUERRERO/components/Ventas/VentasScreen.js`** — Badge en historial de app (línea ~6867)
2. **`frontend/src/components/rutas/ReporteVentasRuta.jsx`** — Badge en Ventas Ruta web (línea ~826)

### Nota
`contarVentasActivasCliente()` (línea 2227) ya excluía ventas con total $0 del conteo — por eso el aviso "Cliente Ya Atendido" no bloqueaba. Solo faltaba el badge.

### Commits
- `c1506d6` fix(ventas): no marcar como 2ª VENTA cuando solo se reportan vencidas ($0)
- `7aeda48` fix(ventas-ruta): no marcar como 2ª VENTA cuando solo se reportan vencidas ($0)

---

## 🔨 Build APK Local — Configuración Android (10 Abr 2026)

### Contexto
EAS Build (tier gratuito) se agotó. Se configuró build local con Gradle.

### Requisitos instalados
- Java 17: `/usr/lib/jvm/java-17-openjdk-amd64`
- Android SDK: `$HOME/Android/Sdk`
- NDK: `27.1.12297006`
- ninja-build + cmake (para compilar nativas)

### Configuración `gradle.properties`
- `org.gradle.jvmargs=-Xmx4096m` (subido de 2048m para evitar OOM)
- `reactNativeArchitectures=armeabi-v7a,arm64-v8a` (quitamos x86/x86_64 para reducir memoria y peso del APK)

### Comando de build
```bash
cd ~/Escritorio/AP\ GUERRERO/android
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
./gradlew assembleRelease --no-daemon
```

### Output
`android/app/build/outputs/apk/release/app-release.apk` (~71 MB vs ~177 MB de EAS con 4 arquitecturas)

---
