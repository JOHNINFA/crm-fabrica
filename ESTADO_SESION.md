# Estado de la Sesión - 29 Enero 2026

## ✅ COMPLETADO: Sistema de Login y Turnos Unificado (29 Enero 2026)

### Cambios realizados:

**1. Sincronización automática de login POS con sistema general:**
- El POS ahora usa automáticamente el usuario del sistema general (AuthContext)
- No es necesario hacer login separado en el POS
- El cajero se sincroniza automáticamente entre equipos
- Un solo login para todo el sistema

**2. Modal automático para abrir turno:**
- Cuando entras al POS sin turno activo, aparece modal pidiendo solo la **base inicial**
- El modal aparece solo UNA VEZ por sesión (usa sessionStorage)
- No pide usuario ni contraseña (ya estás logueado en el sistema)
- El modal se cierra automáticamente después de 2 segundos si ya tienes turno

**3. Validación de turno para ventas:**
- NO puedes realizar ventas sin turno activo
- Al intentar vender sin turno, muestra alerta: "Turno No Iniciado"
- Esto asegura que todas las ventas estén asociadas a un turno

**4. Indicador visual de estado en Topbar:**
- Botón "Logout" cambia a **verde** cuando tienes turno activo
- Fácil identificar visualmente si hay turno abierto
- Color verde = Turno activo ✓

**5. Módulo de Caja mejorado:**
- Si NO hay turno activo, muestra mensaje: "No hay turno activo"
- NO muestra tarjetas de ventas/totales sin turno activo
- Evita confusión con datos incorrectos

**6. Fix de fecha en arqueos de caja:**
- Corregido problema de zona horaria en fechas de arqueos
- Antes: Los arqueos se guardaban con fecha del día anterior (28/1 en lugar de 29/1)
- Ahora: La fecha se envía con hora del mediodía (12:00:00) para evitar conversión UTC
- Los arqueos ahora se guardan con la fecha correcta del día actual

**Archivos modificados:**
- `frontend/src/context/CajeroContext.jsx` - Sincronización con AuthContext
- `frontend/src/services/cajeroService.js` - Método getTurnoActivo agregado
- `frontend/src/components/Pos/LoginCajeroModal.jsx` - Modal simplificado
- `frontend/src/components/Pos/Topbar.jsx` - Indicador visual y control de modal
- `frontend/src/components/Pos/Cart.jsx` - Validación de turno para ventas
- `frontend/src/pages/CajaScreen.jsx` - Validación de turno activo
- `frontend/src/pages/PosScreen.jsx` - Integración de modal

**Flujo completo:**
1. Login en el sistema (una sola vez)
2. Entras al POS → Modal pide base inicial
3. Ingresas base → Turno abierto (botón verde)
4. Puedes vender normalmente
5. Vas a Caja → Ves el corte del turno actual
6. Cierras turno → Haces corte de caja
7. Vuelves al POS → Modal pide nueva base para nuevo turno

---

## ✅ COMPLETADO: Unificación completa de estilos de tickets POS y Pedidos (29 Enero 2026)

### Problema identificado:
- Los tickets de POS y Pedidos se veían diferentes
- En POS algunas letras salían muy claras (font-weight: normal)
- El contenido de la tabla de productos se veía débil
- La línea separadora de los encabezados de la tabla era inconsistente
- La fuente era diferente entre POS y Pedidos
- El contraste general era bajo en impresoras térmicas
- El logo se veía muy oscuro con el filtro de contraste aplicado a todo

### Cambios realizados:

**1. Unificación de font-weight (POS y Pedidos):**
- `.ticket-business-info`: `font-weight: 900` (más oscuro)
- `.ticket-table th`: `font-weight: 900` (encabezados más oscuros)
- `.ticket-table td`: `font-weight: bold` (contenido más oscuro)
- `body`: `font-weight: bold` (base oscura)

**2. Separador de encabezados de tabla:**
- Cambiado de borde CSS (`border-bottom`) a línea de texto con puntos
- Agregada fila en `<thead>` con puntos: `................................................`
- Estilo: `font-size: 10px; letter-spacing: -0.8px; overflow: hidden`
- Ahora se ve suave y consistente como los demás separadores del ticket

**3. Unificación de fuente:**
- POS ahora usa: `configImpresion?.fuente_ticket || 'Courier New, Courier, monospace'`
- Antes estaba forzado a `'Courier New, Courier, monospace'`
- Ahora ambos (POS y Pedidos) leen la fuente desde la configuración del backend

**4. Contraste diferenciado para logo y texto:**
- **Logo**: `filter: grayscale(100%) contrast(1.2)` - Se ve suave con detalles visibles
- **Texto**: `filter: contrast(3)` - Letra muy oscura y definida para impresoras térmicas
- Aplicado selectivamente a cada sección: `.ticket-business-name`, `.ticket-business-info`, `.ticket-divider`, `.ticket-info`, `.ticket-table`, `.ticket-totals`, `.ticket-payment`, `.ticket-footer`

**5. Estilos finales unificados:**
```css
body { 
  font-weight: bold; 
}
.ticket-logo {
  filter: grayscale(100%) contrast(1.2);
}
.ticket-table th { 
  font-weight: 900; 
  border-bottom: none; 
}
.ticket-table td { 
  font-weight: bold; 
}
.ticket-business-info { 
  font-weight: 900; 
}
.ticket-totals { 
  font-weight: bold; 
}
.ticket-payment { 
  font-weight: bold; 
}
.ticket-footer { 
  font-weight: bold; 
}
/* Contraste selectivo para texto */
.ticket-business-name,
.ticket-business-info,
.ticket-divider,
.ticket-info,
.ticket-table,
.ticket-totals,
.ticket-payment,
.ticket-footer {
  filter: contrast(3);
}
```

**Estructura HTML de la tabla:**
```html
<thead>
  <tr>
    <th>Cant</th>
    <th>Producto</th>
    <th>P.Unit</th>
    <th>Total</th>
  </tr>
  <tr>
    <td colspan="4" style="padding: 0; font-size: 10px; font-weight: normal; text-align: center; letter-spacing: -0.8px; line-height: 1; overflow: hidden;">................................................</td>
  </tr>
</thead>
```

**Resultado:**
- ✅ Tickets de POS y Pedidos ahora se ven idénticos
- ✅ Letra muy oscura y pareja en toda la impresión (contraste 3.0)
- ✅ Logo suave con detalles visibles (contraste 1.2)
- ✅ Separadores suaves y consistentes
- ✅ Excelente contraste para impresoras térmicas Epson TM-T20II
- ✅ Fuente unificada desde configuración del backend

**Archivos modificados:**
- `frontend/src/components/Pos/PaymentModal.jsx`
- `frontend/src/components/Print/TicketPreviewModal.jsx`

---

## ✅ COMPLETADO: Fix modal de cajero en recarga de página (29 Enero 2026)

### Problema identificado:
- Al recargar la página en POS, aparecía automáticamente el modal "Cajero Logueado"
- Este modal solo debería aparecer cuando el usuario hace clic en el botón "Logout"

### Solución implementada:
- Eliminado el `useEffect` automático que mostraba el modal al detectar cajero logueado sin turno
- Eliminado el estado `modalMostrado` y el uso de `sessionStorage` para controlar la visualización
- Ahora el modal solo se abre cuando el usuario hace clic explícitamente en el botón "Logout"

**Código eliminado:**
```javascript
// ❌ ANTES: Modal se abría automáticamente
const [modalMostrado, setModalMostrado] = useState(() => {
  return sessionStorage.getItem('modalTurnoMostrado') === 'true';
});

useEffect(() => {
  if (isAuthenticated && cajeroLogueado && !turnoActivo && !modalMostrado) {
    setShowLoginModal(true);
    setModalMostrado(true);
    sessionStorage.setItem('modalTurnoMostrado', 'true');
  }
}, [isAuthenticated, cajeroLogueado, turnoActivo, modalMostrado]);
```

**Código actual:**
```javascript
// ✅ AHORA: Modal solo se abre con clic en botón
const handleLoginClick = () => {
  setShowLoginModal(true);
};
```

**Archivos modificados:**
- `frontend/src/components/Pos/Topbar.jsx`

---

## ✅ COMPLETADO: Quitar hover rojo del botón Logout (29 Enero 2026)

### Problema identificado:
- Al pasar el mouse sobre el botón "Logout", se mostraba un fondo rojo (comportamiento por defecto de Bootstrap)
- Esto no era deseado, se prefiere mantener el botón transparente en hover

### Solución implementada:
- Agregados estilos CSS para sobrescribir el hover por defecto de `.btn-outline-danger`
- El botón mantiene su color de borde y texto en hover, sin fondo
- Funciona tanto para el estado rojo (sin turno) como verde (con turno activo)

**Estilos agregados:**
```css
/* Quitar hover rojo del botón Logout */
.topbar-bg .btn-outline-danger:hover {
    background-color: transparent !important;
    border-color: #dc3545 !important;
    color: #dc3545 !important;
}

/* Cuando tiene turno activo (verde) */
.topbar-bg .btn-outline-danger:hover[style*="color: rgb(40, 167, 69)"] {
    background-color: transparent !important;
    border-color: #28a745 !important;
    color: #28a745 !important;
}
```

**Archivos modificados:**
- `frontend/src/components/Pos/Topbar.css`

---

**Comandos para aplicar todos los cambios:**
```bash
# En local
git add .
git commit -m "Fix: Unificar tickets, contraste diferenciado logo/texto, modal cajero y hover logout"
git push origin main

# En VPS
ssh root@76.13.96.225
cd ~/crm-fabrica
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build frontend
```

**Nota importante:** Siempre hacer `Ctrl + Shift + R` en el navegador después de aplicar cambios para limpiar la caché y ver los estilos actualizados.

---

## ✅ COMPLETADO: Fix de reimpresión de tickets desde historial (29 Enero 2026)

### Problema identificado:
- Al reimprimir un ticket desde "Informes de Ventas", el ticket se veía muy básico
- No mostraba el logo del negocio
- No usaba la configuración del backend (fuente, tamaños, etc.)
- No tenía los estilos unificados con POS (contraste, separadores, etc.)
- Se veía como texto plano sin formato

### Solución implementada:
- En lugar de usar una función `generarHTMLTicket` propia, ahora usa el componente `TicketPreviewModal`
- Este es el mismo componente que usa Pedidos, que ya tiene todos los estilos actualizados
- El componente lee la configuración del backend y aplica logo, fuente, contraste, etc.

### Cambios realizados:

**1. Import del componente:**
```javascript
import TicketPreviewModal from '../components/Print/TicketPreviewModal';
```

**2. Estados agregados:**
```javascript
const [showTicketModal, setShowTicketModal] = useState(false);
const [ticketData, setTicketData] = useState(null);
```

**3. Botón de imprimir modificado:**
- Antes: Llamaba a `imprimirTicket(ticketData)`
- Ahora: Prepara los datos y abre el modal con `setTicketData(data); setShowTicketModal(true);`
- Los datos se mapean con `tipo: 'venta'` para que el modal sepa que es una venta POS

**4. Componente agregado al JSX:**
```jsx
{ticketData && (
  <TicketPreviewModal
    show={showTicketModal}
    onClose={() => setShowTicketModal(false)}
    ticketData={ticketData}
    autoPrint={true}
  />
)}
```

**Resultado:**
- ✅ La reimpresión desde historial ahora se ve igual que la impresión original de POS
- ✅ Muestra el logo del negocio
- ✅ Usa la configuración del backend (fuente, tamaños, etc.)
- ✅ Tiene contraste diferenciado (logo 1.2, texto 3.0)
- ✅ Separadores de puntos suaves
- ✅ Código más limpio y mantenible (reutiliza componente existente)

**Archivos modificados:**
- `frontend/src/pages/InformeVentasGeneral.jsx`

**Nota:** Las funciones `imprimirTicket` y `generarHTMLTicket` todavía existen en el archivo pero ya no se usan. Se pueden eliminar en una limpieza futura.

---

## 🔄 EN PROGRESO: Mejorar oscuridad de encabezados de tabla en tickets (29 Enero 2026)

### Problema identificado:
- Los encabezados de la tabla (Cant, Producto, P.Unit, Total) se ven muy claros en la impresora térmica
- El filtro `contrast(3)` no es suficiente para hacer el texto más oscuro
- Necesitan destacar más del resto del contenido (como en la imagen de referencia)

### Intentos realizados:

**1. Aumentar tamaño de fuente (+2px, luego +4px):**
- Resultado: El tamaño más grande no hace que se vea más oscuro

**2. Agregar text-stroke y text-shadow:**
- `text-stroke: 0.5px` - No se notó diferencia
- `text-stroke: 1px` + `text-shadow` x3 - Se notó más oscuro
- `text-stroke: 1.2px` + `text-shadow` x3 - Muy oscuro pero letras muy gruesas
- `text-stroke: 0.5px` + `text-shadow: 0.5px` x2 - Balance entre oscuridad y grosor (probando)

### Estilos actuales de los encabezados:
```css
.ticket-table th {
  text-align: left;
  border-bottom: none;
  padding: 4px 2px 2px 2px;
  font-weight: 900;
  font-size: ${tamanioTabla + 1}px;
  color: #000;
  text-shadow: 0 0 0.5px #000, 0 0 0.5px #000;
  -webkit-text-stroke: 0.5px #000;
}
```

### Objetivo:
- Que los títulos (Cant, Producto, P.Unit, Total) se vean oscuros como en la imagen de referencia
- Pero sin que las letras se vean demasiado gruesas/gordas

**Archivos modificados:**
- `frontend/src/components/Pos/PaymentModal.jsx`
- `frontend/src/components/Print/TicketPreviewModal.jsx`

**Estado:** Probando balance entre oscuridad y grosor de letras

---

---

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

### 1. 🔧 Fix de zona horaria en fechas de arqueos (Backend)

**Descripción**: Los arqueos se guardan con fecha del día anterior debido a conversión UTC.

**Problema actual:**
- Frontend envía fecha en formato YYYY-MM-DD (ej: 2026-01-29)
- Backend interpreta como UTC medianoche (2026-01-29T00:00:00Z)
- Al convertir a hora local Colombia (UTC-5), queda como día anterior (2026-01-28T19:00:00)
- En el historial aparece con fecha incorrecta

**Solución requerida:**
- Ajustar el backend para que interprete la fecha como hora local, no UTC
- O modificar el modelo para usar DateField en lugar de DateTimeField
- Archivo backend a modificar: modelo de ArqueoCaja

**Prioridad**: MEDIA (no afecta funcionalidad, solo visualización)

---

### 2. 🔄 Sincronización en tiempo real (WebSockets)

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
