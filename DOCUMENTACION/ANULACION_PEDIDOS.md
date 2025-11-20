# 🔴 Funcionalidad de Anulación de Pedidos

## 📋 Descripción

Se ha implementado la funcionalidad completa para anular pedidos desde el modal de detalle en el Informe de Pedidos.

## ✨ Características

### 1. Anulación desde Modal de Detalle
- Botón "Anular Pedido" visible en el modal de detalle
- Confirmación con diálogo antes de anular
- Solicitud de motivo de anulación
- Indicador visual cuando el pedido está anulado

### 2. Reversión Automática
Cuando se anula un pedido, el sistema automáticamente:

#### 📊 En Planeación:
- Resta las cantidades del campo `pedidos` para cada producto
- Recalcula el `total` automáticamente
- Busca por `fecha_entrega` y `producto_nombre`

#### 💰 En Cargue:
- Resta el monto del pedido del campo `total_pedidos`
- Recalcula el `total_efectivo` (venta - total_pedidos)
- Busca por `fecha_entrega` y `responsable` (vendedor)

### 3. Estados del Pedido
- **PENDIENTE**: Pedido creado, esperando procesamiento
- **EN_TRANSITO**: Pedido en camino
- **ENTREGADA**: Pedido entregado exitosamente
- **ANULADA**: Pedido anulado (no se puede modificar)

## 🔧 Implementación Técnica

### Backend (Django)

**Endpoint**: `POST /api/pedidos/{id}/anular/`

**Parámetros**:
```json
{
  "motivo": "Motivo de la anulación"
}
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "message": "Pedido anulado exitosamente. Se revirtieron las cantidades en Planeación y el dinero en Cargue.",
  "pedido": {
    "id": 1,
    "numero_pedido": "PED-000001",
    "estado": "ANULADA",
    ...
  }
}
```

**Código**: `api/views.py` - Método `anular()` en `PedidoViewSet`

### Frontend (React)

**Servicio**: `frontend/src/services/api.js`

```javascript
pedidoService.anularPedido(id, motivo)
```

**Componente**: `frontend/src/pages/InformePedidosScreen.jsx`

```javascript
const handleAnular = async (pedido) => {
  // Confirmación
  // Solicitud de motivo
  // Llamada al servicio
  // Actualización de la UI
}
```

## 🎨 Interfaz de Usuario

### Modal de Detalle

1. **Alerta de Anulación** (solo si está anulado):
   ```
   ⚠️ Pedido Anulado
   Este pedido ha sido anulado y no se puede modificar.
   ```

2. **Badge de Estado**:
   - 🟡 PENDIENTE (amarillo)
   - 🔵 EN_TRANSITO (azul)
   - 🟢 ENTREGADA (verde)
   - 🔴 ANULADA (rojo)

3. **Botón de Anulación**:
   - Visible solo si el estado NO es ANULADA
   - Color rojo para indicar acción destructiva
   - Deshabilitado si ya está anulado

### Flujo de Anulación

1. Usuario hace clic en "Anular Pedido"
2. Sistema muestra confirmación:
   ```
   ¿Está seguro que desea anular el pedido PED-000001?
   
   Esta acción:
   - Cambiará el estado del pedido a ANULADA
   - Revertirá las cantidades en Planeación
   - Revertirá los totales en Cargue
   
   Esta acción NO se puede deshacer.
   ```
3. Usuario confirma
4. Sistema solicita motivo:
   ```
   Ingrese el motivo de la anulación:
   [Anulado desde gestión de pedidos]
   ```
5. Usuario ingresa motivo
6. Sistema procesa la anulación
7. Sistema muestra resultado:
   - ✅ Éxito: "Pedido anulado exitosamente. Se revirtieron las cantidades en Planeación y el dinero en Cargue."
   - ❌ Error: "Error al anular el pedido: [mensaje de error]"
8. Sistema actualiza la lista de pedidos

## 📝 Logs del Sistema

El backend genera logs detallados durante la anulación:

```
============================================================
🔄 ANULANDO PEDIDO #PED-000001
============================================================
📋 Destinatario: CLIENTE XYZ
💰 Total: $100000
📅 Fecha entrega: 2025-11-21
👤 Vendedor: PEDIDOS
📦 Detalles: 2 productos

✅ Estado cambiado de PENDIENTE a ANULADA

📊 REVIRTIENDO EN PLANEACIÓN
============================================================
  ✅ PRODUCTO A:
     Pedidos: 10 → 8 (-2)
     Total: 15 → 13
  ✅ PRODUCTO B:
     Pedidos: 5 → 3 (-2)
     Total: 8 → 6

💰 REVIRTIENDO EN CARGUE
============================================================
  ✅ ID1 - PEDIDOS:
     Total Pedidos: $100,000 → $0 (-$100,000)
     Total Efectivo: $500,000 → $600,000

============================================================
✅ PEDIDO ANULADO EXITOSAMENTE
============================================================
```

## 🔒 Validaciones

1. **No se puede anular dos veces**: Si el pedido ya está anulado, retorna error
2. **Motivo obligatorio**: El usuario debe ingresar un motivo
3. **Confirmación requerida**: El usuario debe confirmar la acción
4. **Transacción atómica**: Si algo falla, se revierte todo

## 🧪 Pruebas

### Caso 1: Anular pedido exitosamente
1. Crear un pedido con productos
2. Verificar que se actualice Planeación y Cargue
3. Anular el pedido
4. Verificar que se revierta Planeación y Cargue
5. Verificar que el estado sea ANULADA

### Caso 2: Intentar anular pedido ya anulado
1. Anular un pedido
2. Intentar anularlo nuevamente
3. Verificar que muestre error "El pedido ya está anulado"

### Caso 3: Anular sin motivo
1. Intentar anular sin ingresar motivo
2. Verificar que muestre error "Debe ingresar un motivo"

## 📚 Referencias

- **Modelo Pedido**: `api/models.py` línea 1287
- **Modelo DetallePedido**: `api/models.py` línea 1360
- **ViewSet Pedido**: `api/views.py` línea 1304
- **Método anular**: `api/views.py` línea 1373
- **Servicio API**: `frontend/src/services/api.js` línea 896
- **Componente Informe**: `frontend/src/pages/InformePedidosScreen.jsx`

## 🎯 Próximas Mejoras

1. Agregar permisos de usuario para anular pedidos
2. Historial de anulaciones
3. Reporte de pedidos anulados
4. Notificaciones por email al anular
5. Opción de revertir anulación (con permisos especiales)

---

**Última actualización**: 20 de Noviembre de 2025
