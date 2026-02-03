# Estado de la Sesión - 30 Enero 2026

## ✅ COMPLETADO: Método de pago vuelve a Efectivo después de cada venta (30 Enero 2026)

### Problema identificado:
- Después de hacer una venta con Transferencia u otro método, al abrir el modal de pago nuevamente quedaba seleccionado el método anterior
- Debería volver a "Efectivo" por defecto después de cada venta

### Solución implementada:
- Agregado `setMetodoPago("Efectivo")` después de completar la venta exitosamente
- El método de pago se resetea automáticamente a Efectivo

**Archivo modificado:**
- `frontend/src/components/Pos/PaymentModal.jsx`

---

## ✅ COMPLETADO: Eliminación de salto de precios en POS y Pedidos (30 Enero 2026)

### Problema identificado:
- Al recargar POS o Pedidos, los precios mostraban primero el precio base del producto
- Luego "saltaban" al precio correcto de la lista de precios (ej: 1.700 → 2.100)
- Esto causaba una mala experiencia visual

### Solución implementada:
- Modificado ProductCard en POS y Pedidos para ocultar el precio hasta que esté cargado
- El precio queda invisible (`visibility: hidden`) mientras carga
- Cuando llega el precio de la lista, aparece directamente el precio correcto
- No hay salto visual

**Archivos modificados:**
- `frontend/src/components/Pos/ProductCard.jsx`
- `frontend/src/components/Pedidos/ProductCard.jsx`
- `frontend/src/hooks/usePriceList.js` - Inicialización de loading y caché
- `frontend/src/pages/PosScreen.jsx` - Priorizar PRECIOS CAJA en inicialización

---

## ✅ COMPLETADO: Spinner de carga en Arqueo de Caja (30 Enero 2026)

### Problema identificado:
- La sección "Ventas del Turno / Monto Total / Diferencia" tardaba en cargar
- No había indicador visual de que estaba cargando

### Solución implementada:
- Agregado spinner mientras carga los datos del turno
- Muestra "Cargando datos del turno..." con spinner bonito
- Cuando termina, muestra los datos o mensaje de "No hay datos disponibles"

**Archivo modificado:**
- `frontend/src/pages/CajaScreen.jsx`

---

## ✅ COMPLETADO: Cierre Automático de Turno después del Arqueo (30 Enero 2026)

### Problema identificado:
- Después de hacer el arqueo de caja, el usuario podía seguir operando sin cerrar el turno
- No había control de que el turno se cerrara correctamente después del corte
- El usuario debería hacer logout y volver a loguearse para abrir nuevo turno

### Solución implementada:
- Modificado `handleGuardarArqueo` en CajaScreen.jsx
- Después de guardar el arqueo exitosamente:
  1. Se muestra confirmación al usuario
  2. Se ejecuta `logout()` que cierra el turno automáticamente
  3. Se redirige al POS (`/pos`) para abrir nuevo turno
- Para operar de nuevo, el usuario debe abrir nuevo turno

**Archivos modificados:**
- `frontend/src/pages/CajaScreen.jsx` - Agregado logout al destructuring del contexto y lógica de cierre automático

---

## ✅ COMPLETADO: Botón X resetea formulario y limpia URL en Pedidos (30 Enero 2026)

### Problema identificado:
- Al presionar la X para quitar un cliente seleccionado, solo se limpiaba el nombre del cliente
- Los demás campos (lista de precios, vendedor, fecha) quedaban con los valores del cliente anterior
- Al recargar la página, volvía a cargar el cliente porque la URL todavía tenía el parámetro `?cliente=...`

### Solución implementada:
- Modificado el botón X en ConsumerForm.jsx para resetear todos los campos
- Agregado `window.history.replaceState({}, '', '/#/remisiones')` para limpiar la URL

**Valores por defecto al presionar X:**
- Cliente: "DESTINATARIO GENERAL"
- Lista de Precios: "VENDEDORES"
- Vendedor: "PEDIDOS"
- Fecha: Fecha de hoy
- URL: Limpia sin parámetros

**Archivo modificado:**
- `frontend/src/components/Pedidos/ConsumerForm.jsx`

---

## ✅ COMPLETADO: Fix del "salto" de precios al cambiar pestañas (30 Enero 2026)

### Problema identificado:
- Al cambiar de pestaña o salir y volver a Pedidos, los precios del catálogo "saltaban"
- Esto ocurría porque el hook usePriceList tenía un listener de `focus` que limpiaba la caché

### Solución implementada:
- Eliminado el listener de `focus` que limpiaba la caché automáticamente
- La caché ahora se mantiene por 5 minutos sin interrupciones
- Solo se recarga cuando: expira el tiempo, cambias lista manualmente, o guardas nuevos precios

**Archivo modificado:**
- `frontend/src/hooks/usePriceList.js`

---

## ✅ COMPLETADO: Optimización de cambio de lista de precios en Pedidos (29 Enero 2026)

### Problema identificado:
- Al cambiar la lista de precios en Pedidos, el carrito se actualizaba rápido pero el catálogo de productos se demoraba mucho
- Cada tarjeta de producto hacía su propia llamada al API para obtener el precio (35 productos = 35 llamadas)
- Esto causaba lentitud visible al cambiar entre listas de precios

### Solución implementada:

**1. Refactorización de ProductCard.jsx:**
- Eliminadas las llamadas individuales al API (`listaPrecioService.getAll`, `precioProductoService.getAll`)
- Ahora usa el hook `usePriceList` que tiene caché compartida entre todas las tarjetas
- El precio se obtiene instantáneamente desde la caché con `getPrecio(product.id)`

**2. Nueva función `getPrecio` en usePriceList.js:**
- Agregada función `getPrecio(productId)` que busca el precio en la caché
- Usa `useCallback` para optimizar rendimiento
- Primero busca en la caché global, luego en el estado local

**Archivos modificados:**
- `frontend/src/components/Pedidos/ProductCard.jsx`
- `frontend/src/hooks/usePriceList.js`

**Resultado:**
- El cambio de lista de precios ahora es instantáneo en el catálogo
- Se eliminaron ~35 llamadas al API por cada cambio de lista
- Mejor experiencia de usuario

---

## ✅ COMPLETADO: Administrador puede ver todos los arqueos y movimientos (29 Enero 2026)

### Problema identificado:
- El usuario ADMINISTRADOR no podía ver los cortes de caja ni arqueos de otros cajeros
- El sistema filtraba por cajero específico, excluyendo al administrador

### Solución implementada:
- Modificadas las funciones de carga para detectar si el usuario es ADMINISTRADOR
- Si es admin, no se aplica filtro por cajero (ve todos los registros)
- Si es cajero normal, solo ve sus propios registros

**Funciones modificadas en CajaScreen.jsx:**
1. `cargarHistorialArqueos` - Ver todos los arqueos
2. `cargarMovimientosCaja` - Ver todos los movimientos
3. `cargarUltimoArqueo` - Ver último arqueo de cualquier cajero

**Código agregado:**
```javascript
const esAdmin = cajeroLogueado?.rol === 'ADMINISTRADOR' || cajeroLogueado?.rol === 'ADMIN';
const cajeroFiltro = esAdmin ? null : cajero;
```

**Archivos modificados:**
- `frontend/src/pages/CajaScreen.jsx`

---

## ✅ COMPLETADO: Sistema de Lista de Precios - Modal y Tabla (29 Enero 2026)

### Problema identificado:
- El modal de edición de precios no guardaba correctamente al hacer clic en "Guardar"
- Los precios se mostraban en $0 en el modal aunque existían en la base de datos
- Al cambiar de un input a otro, el modal "saltaba" y sacaba del input
- La columna "Precio Compra" no se usaba y ocupaba espacio innecesario

### Cambios realizados:

**1. Fix del botón "Guardar" en modal de precios:**
- Antes: El botón solo cerraba el modal sin guardar los precios pendientes
- Ahora: Guarda todos los precios editados antes de cerrar
- Se creó función `guardarPrecioSinRecargar` para guardado masivo sin recargar datos
- Se creó función `guardarTodosLosPrecios` que guarda en paralelo y cierra el modal

**2. Fix de carga de precios existentes en modal:**
- Problema: Comparación de tipos (string vs number) fallaba al buscar precios
- Solución: Usar `Number()` para comparar IDs de lista_precio
- Agregado console.log para debug: `📦 Precios del producto:` y `💰 Valores input calculados:`

**3. Fix del "salto" al cambiar entre inputs:**
- Problema: El `onBlur` llamaba a `cargarDatos()` que recargaba toda la tabla
- Solución: Eliminado el `onBlur` que guardaba automáticamente
- Ahora los precios solo se guardan al hacer clic en "Guardar"

**4. Selección automática de texto en inputs:**
- Agregado `onFocus={(e) => e.target.select()}` a los inputs de precio
- Al hacer clic en un input, se selecciona todo el texto para escribir directamente

**5. Eliminada columna "Precio Compra":**
- Quitada la columna de la tabla del informe de lista de precios
- No se estaba usando y ocupaba espacio innecesario
- Ajustado el colspan de las filas de carga y vacío

**Archivos modificados:**
- `frontend/src/components/modals/EditarProductoModal.jsx`
- `frontend/src/pages/InformeListaPreciosScreen.jsx`

**Estructura de datos:**
- **Listas de precios** → tabla `api_listaprecio` (nombre, tipo, sucursal, activo)
- **Precios por producto** → tabla `api_precioproducto` (producto_id, lista_precio_id, precio)
- Relación: Un producto puede tener un precio diferente para cada lista

**Flujo de uso:**
1. Ir a Informe Lista de Precios
2. Hacer clic en el botón $ de un producto
3. Se abre el modal con las listas de precios disponibles
4. Editar los precios (clic selecciona todo el texto)
5. Hacer clic en "Guardar" → guarda todos los cambios y cierra
6. La tabla se actualiza automáticamente con los nuevos precios

---

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

## ✅ COMPLETADO: Mejorar oscuridad y tamaño de texto en tickets (29 Enero 2026)

### Problema identificado:
- Los encabezados de la tabla (Cant, Producto, P.Unit, Total) se veían muy claros en la impresora térmica
- El filtro `contrast(3)` no era suficiente para hacer el texto más oscuro
- Todo el texto del ticket necesitaba ser más oscuro y un poco más grande
- El logo necesitaba ser un poco más grande

### Solución implementada:

**1. Logo del negocio:**
```css
.ticket-logo {
  max-width: 150px;
  max-height: 130px;
  filter: grayscale(100%) contrast(1);
}
```
- Tamaño aumentado de 135x115 a 150x130
- Contraste reducido de 1.2 a 1 (más natural)

**2. Encabezados de tabla (Cant, Producto, P.Unit, Total):**
```css
.ticket-table th {
  font-weight: 900;
  font-size: ${tamanioTabla + 2}px;
  text-shadow: 0 0 0.3px #000, 0 0 0.3px #000;
  -webkit-text-stroke: 0.3px #000;
}
```

**3. Resto del ticket (excepto contenido de tabla de productos):**
```css
.ticket-business-name,
.ticket-business-info,
.ticket-divider,
.ticket-info,
.ticket-totals,
.ticket-payment,
.ticket-footer,
.total-row {
  -webkit-filter: contrast(3);
  filter: contrast(3);
  text-shadow: 0 0 0.3px #000, 0 0 0.3px #000;
  -webkit-text-stroke: 0.3px #000;
  font-size: ${tamanioGeneral + 2}px;
}
```

**4. Contenido de tabla de productos (td):**
- Se mantiene con el tamaño original `${tamanioTabla}px`
- Esto crea contraste visual entre títulos/totales y los productos

### Resultado final:
- ✅ Logo más grande (150x130) y con contraste natural (1)
- ✅ Títulos de tabla oscuros y legibles con text-stroke: 0.3px
- ✅ Todo el texto del ticket (excepto productos) más oscuro
- ✅ Tamaño de fuente aumentado +2px para mejor legibilidad
- ✅ Contenido de productos se mantiene con tamaño original
- ✅ Similar a la imagen de referencia del ticket de Cuenti

**Archivos modificados:**
- `frontend/src/components/Pos/PaymentModal.jsx`
- `frontend/src/components/Print/TicketPreviewModal.jsx`

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

## ✅ COMPLETADO: Solución al logo de instalación PWA (icono "A") (30 Enero 2026)

### Problema identificado:
- Al intentar instalar la App como PWA en Chrome/Android, el icono aparecía como una letra "A" genérica en lugar del logo de "Arepas Guerrero".
- **Causa Técnica:** Google Chrome exige que los iconos definidos en `manifest.json` sean **cuadrados perfectos** (1:1 aspect ratio). El logo original (`icono.png`) era rectangular (632x395), por lo que Chrome lo descartaba y generaba uno por defecto.

### Solución implementada:
1.  **Script de corrección (`scripts/fix_icons.py`):**
    - Se creó un script en Python usando `Pillow` para procesar la imagen.
    - El script toma el logo rectangular y lo centra en un lienzo cuadrado transparente (sin deformar la imagen).
    - Genera automáticamente los tamaños requeridos: `192x192`, `512x512` y `64x64`.

2.  **Actualización de recursos:**
    - Se reemplazaron los archivos en `frontend/public/`:
        - `logo192.png` (Icono pantalla inicio)
        - `logo512.png` (Splash screen)
        - `favicon.png` y `favicon.ico` (Pestaña navegador)

3.  **Limpieza de Caché:**
    - Se instruyó borrar "Datos del sitio" en Chrome (Application > Storage > Clear site data) para forzar al navegador a leer el nuevo `manifest.json` y los nuevos íconos.

**Archivos modificados/creados:**
- `scripts/fix_icons.py` (Nuevo script de utilidad)
- `frontend/public/manifest.json` (Verificación)
- `frontend/public/*.png` (Archivos de imagen regenerados)

---

## 🛡️ CANCELADO/REVERTIDO: Parche de Seguridad de Precios (30 Enero 2026)

### Intento de blindaje:
- Se intentó implementar una validación estricta en el Backend (`api/views.py`) para rechazar ventas con discrepancias matemáticas o precios negativos.
- **Acción:** Se aplicó un parche que usaba `transaction.atomic()` y validaba `precio_unitario > 0` y consistencia de totales.

### Motivo de reversión:
- El parche interfirió con la lógica actual del Frontend en el manejo de decimales y ventas offline/cacheadas, causando que algunas ventas legítimas no se registraran en los informes.
- **Decisión:** Se revirtió el cambio completamente para garantizar la operatividad del negocio. El sistema volvió a su estado original (permisivo pero funcional).
- **Plan Futuro:** Implementar seguridad "silenciosa" (logging sin bloqueo) en una próxima iteración.

**Archivos afectados:**
- `api/views.py` (Modificado y luego restaurado a su estado original)
- `scripts/patch_views.py` (Creado y eliminado)
- `scripts/simular_ataque.py` (Creado y eliminado)

---

## ✅ COMPLETADO: Flexibilidad en Anulación de Ventas y Mejoras UX (30 Enero 2026)

### Problema identificado:
- La validación de seguridad impedía anular ventas si existía *cualquier* arqueo de caja en la misma fecha.
- Esto bloqueaba la operación de turnos múltiples (ej: cerrar turno mañana y luego intentar corregir una venta del turno tarde).
- El mensaje de error/éxito usaba `alert()` nativo del navegador, visualmente discordante con el resto del sistema.

### Solución implementada:
1.  **Validación Inteligente por Hora:**
    - Se modificó la lógica en `InformeVentasGeneral.jsx`.
    - Ahora el sistema compara la **Hora Exacta** de la venta con la **Hora de Creación** del último arqueo.
    - **Regla:** Si la venta es *posterior* al último cierre de caja, **SE PERMITE ANULAR** (pertenece al turno abierto).
    - Si la venta es *anterior* al último cierre, **SE BLOQUEA** (pertenece a un turno cerrado).

2.  **Mejora Visual (SweetAlert2):**
    - Se reemplazaron las alertas nativas por `Swal.fire()`.
    - Mensajes de éxito ahora muestran icono verde, formato HTML limpio y botón estilizado.
    - Mensajes de advertencia (offline) muestran icono amarillo.

**Archivos modificados:**
- `frontend/src/pages/InformeVentasGeneral.jsx`

**Impacto en Deploy:**
- Solo requiere reconstruir el contenedor **frontend**.
- No afecta lógica de precios, inventario ni base de datos.
- **Seguro para producción.**

---

## ✅ COMPLETADO: Estabilidad en Nombre de Responsable (Cargue)

### Problema identificado:
- En el módulo de Cargue, al entrar a una hoja (ej: SÁBADO), el nombre del vendedor a veces aparecía como "RESPONSABLE" (valor por defecto) incluso si ya estaba asignado en la base de datos.
- El sistema priorizaba el valor en caché local sobre el valor real de la API, causando inconsistencias visuales hasta recargar.

### Solución implementada:
- Se ajustó la lógica en `PlantillaOperativa.jsx`.
- Ahora, si el componente recibe un nombre válido desde la API (diferente a "RESPONSABLE"), **fuerza la actualización** inmediata del estado local y del almacenamiento interno.
- Esto elimina el "parpadeo" y asegura que siempre se muestre el nombre real asignado.

**Archivos modificados:**
- `frontend/src/components/Cargue/PlantillaOperativa.jsx`

**Impacto:**
- Mejora visual y de usabilidad para quien gestiona los cargues.
- Requiere rebuild del frontend.

---

# 📝 RESUMEN SESIÓN: Mantenimiento y Mejoras UX/UI (30/31 Enero 2026)

## 1. Iconos PWA (Corregido)
- **Problema:** La instalación de la App mostraba una "A" genérica en lugar del logo.
- **Causa:** Los iconos no eran cuadrados perfectos (requisito de Chrome/Android).
- **Solución:** Se generaron nuevos iconos (192x192, 512x512) con fondo transparente y centrados correctamente usando `scripts/fix_icons.py`.
- **Estado:** ✅ Solucionado.

## 2. Seguridad Backend (Revertido)
- **Acción:** Se intentó implementar validación estricta de precios en `VentaViewSet`.
- **Resultado:** Causó bloqueos en la operativa diaria (ventas offline/sincronización).
- **Decisión:** Se **REVIRTIÓ** el parche. El archivo `api/views.py` quedó en su estado original estables.
- **Estado:** 🔙 Revertido (Sin cambios en producción).

## 3. Anulación de Ventas (Mejorado)
- **Problema:** No se podía anular una venta de la tarde si ya se había cerrado un turno en la mañana (bloqueo por fecha).
- **Solución:** Se cambió la validación para comparar **HORA EXACTA**.
    - Si Venta > Último Arqueo ➡️ **Permite Anular** (Es del turno actual).
    - Si Venta < Último Arqueo ➡️ **Bloquea** (Ya fue arqueada).
- **Extra:** Se cambiaron las alertas nativas `alert()` por **SweetAlert2** para un diseño más profesional.
- **Estado:** ✅ Implementado en Frontend.

## 4. Módulo de Cargue: Nombre Responsable (Fix)
- **Problema:** Al entrar al cargue, a veces salía "RESPONSABLE" en vez del nombre real del vendedor hasta recargar.
- **Solución:** Se ajustó `PlantillaOperativa.jsx` para que acepte inmediatamente el nombre que viene de la API y actualice la memoria local, eliminando el "parpadeo" o datos incorrectos.
- **Estado:** ✅ Implementado en Frontend.

## 5. Limpieza del Repositorio
- Se eliminaron scripts de prueba de seguridad (`scripts/simular_ataque.py`).
- Se aseguró que no se subieran archivos basura (`__pycache__`).
- El repositorio quedó limpio y sincronizado.

---

## 🔜 PRÓXIMA SESIÓN: Auditoría y Fortalecimiento de Seguridad (Sin Riesgos)

**Objetivo:** Revisar y asegurar todo el proyecto (Backend, Frontend y App) aprendiendo de la experiencia previa: **La seguridad no debe detener la operación.**

**Estrategia:**
1.  **Enfoque "Observar y Reportar":**
    *   En lugar de bloquear ventas por validaciones estrictas (que rompen la operación offline), implementar un sistema de **Logging de Anomalías**.
    *   Si un precio es raro, **registrar la alerta** para auditoría, pero **permitir la venta** (a menos que sea /usr/bin/bash absoluto o negativo).

2.  **Revisión de Permisos Backend (Django):**
    *   Auditar el  en .
    *   Cerrar endpoints críticos que no necesitan acceso público.
    *   Asegurar que la sincronización de la App Móvil tenga un handshake seguro sin romper la compatibilidad con versiones viejas.

3.  **Seguridad en Frontend/App:**
    *   Revisar almacenamiento de tokens.
    *   Validar que la UI no permita acciones destructivas sin privilegios (aunque el backend es la autoridad final).

4.  **Meta:** Tener un sistema que nos avise de fraudes en tiempo real sin ser un obstáculo para que los vendedores trabajen, incluso con internet inestable.

---

## 🆕 TAREA PRIORITARIA: Carga Masiva de Clientes (Módulo Pedidos)

**Objetivo:** Permitir la importación masiva de clientes desde Excel/CSV para agilizar la gestión de Pedidos, evitando la creación manual uno a uno.

**Análisis Requerido (Mañana):**
1.  **Entender Flujo Actual:** Analizar cómo el módulo de Pedidos busca y crea clientes actualmente.
2.  **Diseño de la Solución:**
    *   Crear interfaz de "Importar Clientes" en la sección de Clientes o Pedidos.
    *   Definir formato de archivo (CSV/Excel) con columnas clave: (Nombre, Alias/Negocio, Dirección, Teléfono, Zona, etc.).
    *   **Validación:** Evitar duplicados (chequear por teléfono o nombre similar) para no ensuciar la base de datos.
3.  **Implementación:**
    *   Backend: Endpoint para recibir archivo y procesar bulk create.
    *   Frontend: Botón de carga y visualización previa antes de confirmar.

---

## ⚠️ PENDIENTE: Ajustes de Ticket App Móvil (Módulo Ventas)

### Problema 1: ID del Ticket muy largo
**Estado actual:**
```
Ticket: #ID1-ANDROID-TECNO-CM7-OIY7TH-1769145824250-PU1DNO
```

**Problema:** El ID incluye información interna del dispositivo + timestamp, haciéndolo muy largo y poco profesional.

**Solución propuesta:** Implementar contador secuencial simple
```javascript
// En printerService.js línea 216
// Antes:
<b>Ticket:</b> #${id}

// Después:
<b>Ticket:</b> #V-${obtenerNumeroTicket()}

// Función helper (agregar):
const obtenerNumeroTicket = () => {
  const counter = parseInt(localStorage.getItem('ticketCounter') || '1');
  localStorage.setItem('ticketCounter', (counter + 1).toString());
  return counter.toString().padStart(5, '0'); // Ejemplo: #V-00001
}
```

---

### Problema 2: Sección "CAMBIOS REALIZADOS" mal ubicada
**Estado actual:**
```
[Productos vendidos]
Art                    3
Subtotal         $32.250
TOTAL           $32.250

CAMBIOS REALIZADOS ← Al final (INCORRECTO ❌)
2 AREPA TIPO PINCHO    $0
```

**Debe quedar:**
```
[Productos vendidos]
--------------------------------
CAMBIOS REALIZADOS ← Antes de totales (CORRECTO ✅)
2 AREPA TIPO PINCHO    $0
--------------------------------
Art                    3
Subtotal         $32.250
TOTAL           $32.250
```

**Solución:** Mover línea 263 a la línea 237 (antes del divisor de totales)
```javascript
// En printerService.js
// Mover ${vencidasHTML} de línea 263 a línea 237
</table>

${vencidasHTML}  ← Insertar aquí

<div class="ticket-divider">...</div>
<div class="ticket-totals">
```

---

### Archivo a modificar:
- `AP GUERRERO/services/printerService.js`

### Configuración para desarrollo local:
1. Cambiar `config.js` línea 4: `const ENV = 'DEV';`
2. Verificar IP local en línea 7: `const LOCAL_IP = '192.168.1.19';`
3. Iniciar: `cd "AP GUERRERO" && npx expo start`
4. Escanear QR con Expo Go en celular

### Para publicar después de probar:
```bash
cd "AP GUERRERO"
# Cambiar config.js a ENV = 'PROD'
npx expo publish
# O con EAS:
eas update
```

---
