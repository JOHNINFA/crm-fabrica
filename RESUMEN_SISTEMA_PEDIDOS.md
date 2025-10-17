# 📦 SISTEMA DE GESTIÓN DE PEDIDOS - RESUMEN EJECUTIVO

## Descripción General
Sistema completo para gestionar pedidos de clientes organizados por día de entrega, con integración automática a Planeación de Inventario y Cargue de Vendedores.

---

## 🎯 Características Principales

### ✅ Gestión de Pedidos
- Creación de pedidos por cliente y fecha de entrega
- Organización por día de la semana (Lunes-Sábado)
- Estados: PENDIENTE, PAGADO, CANCELADO, ANULADA
- Tipos: ENTREGA, TRASLADO, DEVOLUCIÓN, MUESTRA

### ✅ Integración Automática
- **Planeación**: Suma cantidades en columna "Pedidos"
- **Cargue**: Suma dinero en "Total Pedidos"
- **Actualización en tiempo real** al crear/anular pedidos

### ✅ Interfaz de Usuario
- Selector de días de la semana
- Vista de clientes por día con estado de pedido
- Formulario de creación con datos precargados
- Drag & drop para reordenar clientes
- Anulación de pedidos con reversión automática

---

## 🔄 Flujo de Trabajo

### Crear Pedido
```
1. Seleccionar día (ej: SABADO)
2. Ver clientes con dia_entrega = SABADO
3. Hacer clic en "Crear Pedido"
4. Agregar productos al carrito
5. Confirmar pedido
6. Sistema automáticamente:
   ✅ Crea pedido en BD
   ✅ Suma cantidades en Planeación
   ✅ Suma dinero en Cargue
```

### Anular Pedido
```
1. Ver pedido en estado "Realizado"
2. Hacer clic en botón "Anular"
3. Confirmar anulación
4. Sistema automáticamente:
   ✅ Cambia estado a ANULADA
   ✅ Resta cantidades en Planeación
   ✅ Resta dinero en Cargue
```

---

## 📊 Integración con Otros Módulos

### Planeación de Inventario
```
Pedido creado → Planeación carga pedidos por fecha
              → Suma cantidades por producto
              → Muestra en columna "Pedidos"
              → Total = Solicitadas + Pedidos
```

**Código Frontend:**
```javascript
// InventarioPlaneacion.jsx
const pedidosFecha = pedidos.filter(p => 
  p.fecha_entrega === fechaFormateada && p.estado !== 'ANULADA'
);

const pedidosMap = {};
pedidosFecha.forEach(pedido => {
  pedido.detalles.forEach(detalle => {
    pedidosMap[detalle.producto_nombre] = 
      (pedidosMap[detalle.producto_nombre] || 0) + detalle.cantidad;
  });
});
```

**Código Backend:**
```python
# PedidoSerializer.create()
planeacion, created = Planeacion.objects.get_or_create(
    fecha=pedido.fecha_entrega,
    producto_nombre=producto.nombre
)
planeacion.pedidos += detalle_data['cantidad']
planeacion.save()  # total se calcula automáticamente
```

### Cargue de Vendedores
```
Pedido creado → Cargue carga pedidos por fecha y vendedor
              → Suma totales por vendedor
              → Muestra en "TOTAL PEDIDOS"
              → Total Efectivo = Venta - Total Pedidos
```

**Código Frontend:**
```javascript
// PlantillaOperativa.jsx
const pedidosFiltrados = pedidos.filter(pedido => {
  const coincideFecha = pedido.fecha_entrega === fechaFormateada;
  const noAnulado = pedido.estado !== 'ANULADA';
  const coincideVendedor = pedido.vendedor === nombreVendedor;
  return coincideFecha && coincideVendedor && noAnulado;
});

const totalPedidos = pedidosFiltrados.reduce((sum, pedido) => 
  sum + parseFloat(pedido.total || 0), 0
);
```

**Código Backend:**
```python
# PedidoSerializer.create()
for cargue in cargues:
    if pedido.vendedor.lower() in cargue.responsable.lower():
        cargue.total_pedidos += float(pedido.total)
        cargue.total_efectivo = float(cargue.venta) - float(cargue.total_pedidos)
        cargue.save()
```

---

## 🗂️ Estructura de Archivos

### Backend
```
api/
├── models.py
│   ├── Pedido                    # Modelo principal de pedidos
│   ├── DetallePedido             # Detalles de productos
│   ├── Planeacion                # Integración con planeación
│   └── CargueID1-ID6             # Integración con cargue
├── serializers.py
│   ├── PedidoSerializer          # Lógica de creación con integración
│   └── DetallePedidoSerializer   # Serialización de detalles
├── views.py
│   ├── PedidoViewSet             # CRUD + anulación
│   └── DetallePedidoViewSet      # Gestión de detalles
└── urls.py
    └── /api/pedidos/             # Endpoints REST
```

### Frontend
```
frontend/src/
├── pages/
│   ├── PedidosScreen.jsx                    # Formulario de creación
│   ├── SelectorDiasPedidosScreen.jsx        # Selector de días
│   ├── PedidosDiaScreen.jsx                 # Vista de clientes por día
│   └── InformePedidosScreen.jsx             # Informe general
├── components/Pedidos/
│   ├── Cart.jsx                             # Carrito de compras
│   ├── PaymentModal.jsx                     # Modal de confirmación
│   ├── ConsumerForm.jsx                     # Formulario de destinatario
│   ├── ProductList.jsx                      # Lista de productos
│   └── ModalDetallePedido.jsx               # Detalle de pedido
├── components/inventario/
│   └── InventarioPlaneacion.jsx             # Integración con planeación
├── components/Cargue/
│   └── PlantillaOperativa.jsx               # Integración con cargue
└── services/
    └── api.js                               # pedidoService
```

---

## 🔧 API Endpoints

### GET /api/pedidos/
Obtiene todos los pedidos

**Parámetros opcionales:**
- `destinatario`: Filtrar por nombre de destinatario
- `estado`: Filtrar por estado (PENDIENTE, PAGADO, ANULADA)
- `fecha_desde`: Filtrar desde fecha
- `fecha_hasta`: Filtrar hasta fecha
- `transportadora`: Filtrar por transportadora

**Respuesta:**
```json
[
  {
    "id": 11,
    "numero_pedido": "PED-000011",
    "fecha": "2025-10-17T14:30:00",
    "vendedor": "Carlos",
    "destinatario": "PRUEBA3",
    "direccion_entrega": "Cll 134 no18-20",
    "telefono_contacto": "3001234567",
    "fecha_entrega": "2025-10-18",
    "tipo_pedido": "ENTREGA",
    "transportadora": "Propia",
    "subtotal": 4500.00,
    "impuestos": 0.00,
    "descuentos": 0.00,
    "total": 4500.00,
    "estado": "PENDIENTE",
    "nota": "",
    "detalles": [
      {
        "id": 21,
        "producto": 1,
        "producto_nombre": "AREPA TIPO OBLEA 500Gr",
        "cantidad": 1,
        "precio_unitario": 2500.00,
        "subtotal": 2500.00
      },
      {
        "id": 22,
        "producto": 2,
        "producto_nombre": "AREPA MEDIANA 330Gr",
        "cantidad": 1,
        "precio_unitario": 2000.00,
        "subtotal": 2000.00
      }
    ]
  }
]
```

### POST /api/pedidos/
Crea un nuevo pedido

**Request Body:**
```json
{
  "fecha": "2025-10-17T14:30:00",
  "vendedor": "Carlos",
  "destinatario": "PRUEBA3",
  "direccion_entrega": "Cll 134 no18-20",
  "telefono_contacto": "3001234567",
  "fecha_entrega": "2025-10-18",
  "tipo_pedido": "ENTREGA",
  "transportadora": "Propia",
  "subtotal": 4500.00,
  "impuestos": 0.00,
  "descuentos": 0.00,
  "total": 4500.00,
  "estado": "PENDIENTE",
  "nota": "",
  "detalles": [
    {
      "producto": 1,
      "cantidad": 1,
      "precio_unitario": 2500.00
    },
    {
      "producto": 2,
      "cantidad": 1,
      "precio_unitario": 2000.00
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": 11,
  "numero_pedido": "PED-000011",
  "fecha": "2025-10-17T14:30:00",
  "vendedor": "Carlos",
  "destinatario": "PRUEBA3",
  "total": 4500.00,
  "estado": "PENDIENTE"
}
```

**Efectos secundarios:**
- ✅ Crea registro en tabla `api_pedido`
- ✅ Crea registros en tabla `api_detallepedido`
- ✅ Actualiza tabla `api_planeacion` (suma cantidades)
- ✅ Actualiza tabla `api_cargueid1-6` (suma dinero)

### POST /api/pedidos/{id}/anular/
Anula un pedido existente

**Request Body:**
```json
{
  "motivo": "Cliente canceló el pedido"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Pedido anulado exitosamente",
  "pedido": {
    "id": 11,
    "numero_pedido": "PED-000011",
    "estado": "ANULADA",
    "nota": "[ANULADO] Estado anterior: PENDIENTE - Cliente canceló el pedido - 2025-10-17 15:30"
  }
}
```

**Efectos secundarios:**
- ✅ Cambia `estado` a 'ANULADA'
- ✅ Actualiza tabla `api_planeacion` (resta cantidades)
- ✅ Actualiza tabla `api_cargueid1-6` (resta dinero)
- ✅ Agrega nota con motivo y fecha

---

## ⚠️ Consideraciones Importantes

### 1. Filtrado de Pedidos Anulados
**CRÍTICO:** Siempre filtrar pedidos anulados al calcular totales

**Frontend:**
```javascript
// ✅ CORRECTO
const pedidosActivos = pedidos.filter(p => p.estado !== 'ANULADA');

// ❌ INCORRECTO
const pedidosActivos = pedidos; // Incluye anulados
```

**Ubicaciones donde aplicar:**
- `InventarioPlaneacion.jsx` - Línea ~48
- `PlantillaOperativa.jsx` - Línea ~227

### 2. Transacciones Atómicas
Todas las operaciones usan `transaction.atomic()` para garantizar consistencia:
- Si falla la actualización de Planeación, se revierte todo
- Si falla la actualización de Cargue, se revierte todo

### 3. Conversión de Precios
**IMPORTANTE:** Convertir precios a números antes de enviar:
```javascript
precio_unitario: parseFloat(item.price)  // ✅ CORRECTO
precio_unitario: item.price              // ❌ INCORRECTO (puede ser string)
```

### 4. Formato de Fecha
**IMPORTANTE:** Usar formato YYYY-MM-DD para fecha_entrega:
```javascript
const fechaFormateada = `${year}-${month}-${day}`;  // ✅ CORRECTO
const fechaFormateada = date.toLocaleDateString();  // ❌ INCORRECTO
```

---

## 🐛 Troubleshooting

### Problema: Pedidos anulados se siguen sumando
**Causa:** Frontend no filtra por estado
**Solución:** Agregar filtro `pedido.estado !== 'ANULADA'` en:
- `InventarioPlaneacion.jsx` (línea ~48)
- `PlantillaOperativa.jsx` (línea ~227)

### Problema: Total de pedidos duplicado en Cargue
**Causa:** Múltiples registros de Cargue para la misma fecha
**Solución:** El código ya tiene `break` para solo actualizar un registro por modelo

### Problema: Pedido no aparece en Planeación
**Causa:** Fecha de entrega no coincide con fecha seleccionada
**Solución:** Verificar que `pedido.fecha_entrega` sea igual a la fecha en Planeación

### Problema: Pedido no suma en Cargue
**Causa:** Nombre del vendedor no coincide con responsable
**Solución:** Verificar que `pedido.vendedor` contenga el nombre del responsable en Cargue

### Problema: Datos del cliente no se precargan
**Causa:** URL params mal formateados
**Solución:** Usar `encodeURIComponent(JSON.stringify(clienteData))`

---

## 📈 Mejoras Futuras

1. **Validación de duplicados:** Evitar crear múltiples pedidos para el mismo cliente y fecha
2. **Historial de anulaciones:** Guardar log de quién anuló y por qué
3. **Notificaciones:** Alertar al vendedor cuando se crea/anula un pedido
4. **Reportes:** Dashboard con estadísticas de pedidos por vendedor/fecha
5. **Exportación:** Generar PDF/Excel de pedidos del día
6. **Firma digital:** Capturar firma del cliente al entregar pedido
7. **Tracking:** Seguimiento en tiempo real del estado del pedido
8. **Integración con WhatsApp:** Enviar confirmación de pedido al cliente

---

## 📝 Changelog

### 2025-10-17
- ✅ Implementada lógica de creación de pedidos con integración a Planeación y Cargue
- ✅ Implementada lógica de anulación de pedidos con reversión automática
- ✅ Agregado filtro de pedidos anulados en Planeación
- ✅ Agregado filtro de pedidos anulados en Cargue
- ✅ Documentación completa del sistema

---

## 👥 Contacto y Soporte

Para preguntas o soporte sobre el sistema de pedidos:
- Revisar documentación completa en `DOCUMENTACION_COMPLETA_PROYECTO.md`
- Revisar documentación de backend en `DOCUMENTACION_BACKEND_COMPLETA.md`
- Revisar documentación de frontend en `DOCUMENTACION_FRONTEND_COMPLETA.md`
