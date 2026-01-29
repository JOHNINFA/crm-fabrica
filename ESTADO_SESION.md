# Estado de la Sesión - 28 Enero 2026

## 🔄 EN PROGRESO: Ajustes de Impresión de Tickets POS y Pedidos (28 Enero 2026)

### Cambios realizados hoy:

**1. Aumento de tamaño de fuente para Epson TM-T20II:**
- Tamaño general: de 9px a **14px**
- Nombre del negocio: de 11px a **18px**
- Info (cliente, fecha, etc.): de 8px a **13px**
- Tabla de productos: de 8px a **13px**
- Totales: de 9px a **14px**

**2. Cambio de fuente:**
- De `Roboto Mono` a `Courier New, Courier, monospace`
- Font-weight del body cambiado a `bold` para mejor contraste
- Fuente forzada directamente (no depende de configuración del backend)

**3. Unificación de estilos entre POS y Pedidos:**
- Ambos archivos ahora tienen los mismos estilos CSS
- Mismo formato de información del cliente (con flex y alineación)
- Mismo espaciado entre elementos
- Misma estructura de HTML

**Archivos modificados:**
- `frontend/src/components/Pos/PaymentModal.jsx`
- `frontend/src/components/Print/TicketPreviewModal.jsx`

### ⚠️ PENDIENTE PARA MAÑANA: Continuar ajustes de tickets

**Estado actual:**
- ✅ **Pedidos**: La impresión está perfecta, no requiere cambios
- ❌ **POS**: Requiere ajustes para que se vea igual que Pedidos

**Problemas detectados en POS:**
- Se encontraron errores en la impresión (detalles pendientes de documentar)
- El formato no se ve igual que el de Pedidos

**Tareas para la próxima sesión:**
- Usar el ticket de **Pedidos como referencia** (ese está bien)
- Ajustar el ticket de **POS** para que se vea idéntico al de Pedidos
- Identificar y corregir los errores específicos encontrados
- Probar impresión en Epson TM-T20II hasta que quede igual

**Archivos a revisar:**
- ✅ `frontend/src/components/Print/TicketPreviewModal.jsx` - NO TOCAR (está perfecto)
- ❌ `frontend/src/components/Pos/PaymentModal.jsx` - AJUSTAR mañana

---

## ✅ COMPLETADO: Mejoras de Impresión de Tickets POS y Pedidos (28 Enero 2026 - Sesión anterior)

### Cambios realizados en `PaymentModal.jsx` (POS):

1. **Fuente cambiada**: De `Courier New` a `Roboto Mono` (más delgada y legible)

2. **Negritas ajustadas**:
   - Cliente: **CONSUMIDOR FINAL** → en negrita
   - Atendido por: **CAJERO POS** → en negrita
   - Subtotal: etiqueta y valor en negrita
   - TOTAL: en negrita
   - Método de Pago: solo el valor (**Efectivo**) en negrita
   - Efectivo Recibido: solo el valor (**$X.XXX**) en negrita
   - Cambio: solo el valor (**$X**) en negrita

3. **Espaciado reducido** para aprovechar mejor el ancho del papel:
   - Body padding: de 15px a 5px
   - Container padding: de 5mm a 2mm

4. **Columnas de tabla ajustadas**:
   - Columna Cantidad: alineada a la izquierda, ancho 25px
   - Columna Producto (encabezado): centrado
   - Columna Total: ancho reducido de 60px a 50px

---

### Cambios realizados en `TicketPreviewModal.jsx` (Pedidos):

1. **Fuente cambiada**: A `Roboto Mono` (igual que POS)

2. **Espaciado reducido**:
   - Body padding: de 15px a 5px
   - Container padding: de 5mm a 2mm

3. **Columnas de tabla ajustadas**:
   - Columna Cantidad: alineada a la izquierda, ancho 25px
   - Columna Producto (encabezado): centrado
   - Columna P.Unit: ancho reducido de 70px a 55px
   - Columna Total: ancho reducido de 70px a 50px

4. **CUENTA DE COBRO y Fecha**: Alineados a la izquierda (antes centrados)

5. **Productos en tabla**: Sin negrita (font-weight: normal)

6. **Sección de datos del cliente**:
   - Etiquetas (Cliente:, Teléfono:, Vendedor:, Dirección:, Barrio/Zona:, Fecha Entrega:, Atendido por:) → sin negrita
   - Valores → en negrita

---

## 🔄 PENDIENTE: Aplicar mismos estilos a App Móvil

**Archivo a modificar**: `AP GUERRERO/services/printerService.js`

### Cambios pendientes para igualar con POS/Pedidos:

1. **Fuente**: Cambiar de `Lucida Console, Monaco, Consolas` a `Roboto Mono`
2. **Body padding**: Reducir de `15px` a `5px`
3. **Columna Cantidad**: Cambiar de `30px centrada` a `25px izquierda`
4. **Columna Total**: Reducir de `60px` a `50px`
5. **Encabezado Producto**: Centrar (actualmente a la izquierda)

### ⚠️ PROBLEMA IDENTIFICADO: ID del Ticket

En el ticket de la app aparece:
```
Ticket: #ID1-ANDROID-TECNO-CM7-OIY7TH-1769145824250-PU1DNO
```

Este es el ID interno del dispositivo + timestamp. Es muy largo y feo.

**Solución propuesta**: Cambiar para mostrar un número de ticket más corto/amigable.

### ⚠️ PROBLEMA IDENTIFICADO: Ubicación de "CAMBIOS REALIZADOS"

Actualmente los productos vencidos (cambios) aparecen **al final** del ticket, después del TOTAL.

**Cambio requerido**:
1. Mover sección "CAMBIOS REALIZADOS" **antes** de la sección "Art"
2. Mostrar con valor $0 (no suma al total)
3. Agregar separador/divisor para distinguirlo de los productos vendidos

**Estructura deseada del ticket**:
```
[Productos vendidos]
----------------
CAMBIOS REALIZADOS
2 AREPA TIPO PINCHO    $0
----------------
Art                    3
Cant.Art              20
Subtotal         $32.250
Descuento            $0
TOTAL           $32.250
```

### 📱 Cómo funciona la impresión en AP GUERRERO:

**Archivo**: `AP GUERRERO/services/printerService.js`

**Tecnología**: 
- Usa `expo-print` para generar PDF
- Usa `expo-sharing` para compartir (WhatsApp, etc.)

**Flujo**:
1. `VentasScreen.js` → Confirma venta → Llama a `imprimirTicket(venta)`
2. `printerService.js` → Obtiene configuración del backend
3. Genera HTML con `generarTicketHTML()`
4. Convierte a PDF con `Print.printToFileAsync()`
5. Abre selector de compartir con `Sharing.shareAsync()`

**Datos del ticket**:
- ID de venta (problema: muestra ID interno)
- Fecha
- Cliente nombre y negocio
- Vendedor
- Productos con cantidad y subtotal
- Subtotal, Descuento, Total
- Productos vencidos (si hay)
- Mensaje de agradecimiento

**Diferencias con POS/Pedidos**:
- No tiene columna P.Unit (solo Total por producto)
- Incluye sección de "Cambios Realizados" (vencidas)
- Ancho fijo de 300px (no usa 80mm)

### 🚀 Para subir cambios a la App:

La app AP GUERRERO es una aplicación **Expo/React Native** separada.

**Pasos para actualizar**:
1. Hacer cambios en `AP GUERRERO/services/printerService.js`
2. Desde la carpeta `AP GUERRERO`:
   ```bash
   cd "AP GUERRERO"
   npx expo publish
   ```
   O si usa EAS:
   ```bash
   eas update
   ```
3. Los usuarios deben actualizar la app o recargar si usa Expo Go

---

## 📋 Documentación del Sistema de Impresión

### Archivos principales:
- `frontend/src/components/Pos/PaymentModal.jsx` - Impresión POS (ventas)
- `frontend/src/components/Print/TicketPreviewModal.jsx` - Impresión Pedidos
- `AP GUERRERO/services/printerService.js` - Impresión App Móvil

### Configuración compartida:
Todos usan `configuracionImpresionService.getActiva()` del backend con campos:
- Tamaños de fuente configurables
- Logo en base64
- Nombre negocio, NIT, dirección, teléfono
- Mensaje de agradecimiento
- Encabezado y pie de página personalizados


---

## 📋 TAREAS PENDIENTES (Próximas sesiones)

### 1. 🔄 Sincronización en tiempo real (WebSockets)

**Descripción**: Implementar actualización automática entre múltiples equipos sin necesidad de recargar.

**Funcionalidades deseadas**:
- Notificar cuando otro usuario hace una venta
- Actualizar lista de pedidos en tiempo real
- Actualizar inventario automáticamente
- Opcional: Restringir un usuario a una sola sesión activa

**Tecnología sugerida**:
- Django Channels (WebSockets)
- Redis para mensajería

**Prioridad**: MEDIA (revisar más adelante)

---

### 2. 📤 Carga masiva de clientes por Excel

**Descripción**: Crear opción para importar lista de clientes desde archivo Excel.

**Alcance**:
- Clientes de pedidos (módulo Remisiones/Pedidos)
- Validar datos antes de insertar
- Evitar duplicados

**Archivos a crear/modificar**:
- Backend: Nuevo endpoint para recibir Excel
- Frontend: Botón de importar en gestión de clientes

---

### 3. 💾 Sistema de Backup automático

**Descripción**: Crear opción para realizar backup de toda la información.

**Datos a respaldar**:
- Clientes
- Ventas
- Pedidos
- Productos
- Configuraciones

**Funcionalidades**:
- Backup manual (botón)
- Backup automático periódico (opcional)
- Exportar a archivo descargable

---

### 4. 🔧 Optimización de Base de Datos

**Descripción**: Revisar y optimizar tablas para evitar fallos en consultas.

**Tareas**:
- Revisar índices en tablas principales
- Identificar consultas lentas
- Agregar índices donde sea necesario
- Limpiar datos huérfanos si existen

**Prioridad**: BAJA (dejar de último)

---
