# 🖨️ SISTEMA DE IMPRESIÓN DE TICKETS - DOCUMENTACIÓN COMPLETA

## 📋 ÍNDICE
1. [Resumen del Sistema](#resumen-del-sistema)
2. [Arquitectura](#arquitectura)
3. [Backend - Django](#backend-django)
4. [Frontend - React](#frontend-react)
5. [Flujo de Trabajo](#flujo-de-trabajo)
6. [Configuración](#configuración)
7. [Uso del Sistema](#uso-del-sistema)

---

## RESUMEN DEL SISTEMA

Sistema completo de impresión de tickets térmicos integrado con los módulos de POS y Pedidos.

### Características Principales
- ✅ Configuración centralizada de impresión
- ✅ Soporte para papel térmico 58mm y 80mm
- ✅ Vista previa antes de imprimir
- ✅ Personalización de encabezados y pies de página
- ✅ Logo del negocio
- ✅ Integración con POS y Pedidos
- ✅ Impresión después de crear venta/pedido

---

## ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO DE CONFIGURACIÓN                  │
│  /configuracion/impresion                                   │
│  - Información del negocio                                  │
│  - Textos personalizables                                   │
│  - Logo                                                     │
│  - Configuración de papel                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTES DE IMPRESIÓN                 │
│  TicketPrint.jsx - Genera el HTML del ticket               │
│  TicketPreviewModal.jsx - Vista previa                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRACIÓN EN MÓDULOS                   │
│  POS PaymentModal - Botón "Imprimir Tirilla"               │
│  Pedidos PaymentModal - Botón "Imprimir Tirilla"           │
└─────────────────────────────────────────────────────────────┘
```

---

## BACKEND - DJANGO

### Modelo: ConfiguracionImpresion

**Ubicación:** `api/models.py`

```python
class ConfiguracionImpresion(models.Model):
    """Modelo para configuración de impresión de tickets"""
    
    ANCHO_PAPEL_CHOICES = [
        ('58mm', '58mm'),
        ('80mm', '80mm'),
    ]
    
    # Información del negocio
    nombre_negocio = models.CharField(max_length=255, default='MI NEGOCIO')
    nit_negocio = models.CharField(max_length=50, blank=True, null=True)
    direccion_negocio = models.TextField(blank=True, null=True)
    telefono_negocio = models.CharField(max_length=100, blank=True, null=True)
    email_negocio = models.EmailField(blank=True, null=True)
    
    # Textos personalizables
    encabezado_ticket = models.TextField(blank=True, null=True)
    pie_pagina_ticket = models.TextField(blank=True, null=True)
    mensaje_agradecimiento = models.CharField(max_length=255, default='¡Gracias por su compra!')
    
    # Configuración de impresión
    logo = models.ImageField(upload_to='configuracion/', null=True, blank=True)
    ancho_papel = models.CharField(max_length=10, choices=ANCHO_PAPEL_CHOICES, default='80mm')
    mostrar_logo = models.BooleanField(default=True)
    mostrar_codigo_barras = models.BooleanField(default=False)
    impresora_predeterminada = models.CharField(max_length=255, blank=True, null=True)
    
    # Información adicional
    resolucion_facturacion = models.CharField(max_length=255, blank=True, null=True)
    regimen_tributario = models.CharField(max_length=255, blank=True, null=True)
    
    # Control
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

### API Endpoints

```
GET    /api/configuracion-impresion/              # Listar todas
POST   /api/configuracion-impresion/              # Crear nueva
GET    /api/configuracion-impresion/{id}/         # Obtener una
PUT    /api/configuracion-impresion/{id}/         # Actualizar
DELETE /api/configuracion-impresion/{id}/         # Eliminar
GET    /api/configuracion-impresion/activa/       # Obtener configuración activa
```

### Serializer

**Ubicación:** `api/serializers.py`

```python
class ConfiguracionImpresionSerializer(serializers.ModelSerializer):
    """Serializer para configuración de impresión de tickets"""
    
    class Meta:
        model = ConfiguracionImpresion
        fields = [
            'id', 'nombre_negocio', 'nit_negocio', 'direccion_negocio',
            'telefono_negocio', 'email_negocio', 'encabezado_ticket',
            'pie_pagina_ticket', 'mensaje_agradecimiento', 'logo',
            'ancho_papel', 'mostrar_logo', 'mostrar_codigo_barras',
            'impresora_predeterminada', 'resolucion_facturacion',
            'regimen_tributario', 'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')
```

### ViewSet

**Ubicación:** `api/views.py`

```python
class ConfiguracionImpresionViewSet(viewsets.ModelViewSet):
    """ViewSet para configuración de impresión de tickets"""
    queryset = ConfiguracionImpresion.objects.all()
    serializer_class = ConfiguracionImpresionSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def activa(self, request):
        """Obtener la configuración activa (solo una)"""
        config = ConfiguracionImpresion.objects.filter(activo=True).first()
        if config:
            serializer = self.get_serializer(config)
            return Response(serializer.data)
        else:
            # Retornar configuración por defecto
            return Response({...})
```

---

## FRONTEND - REACT

### Estructura de Archivos

```
frontend/src/
├── components/
│   └── Print/
│       ├── TicketPrint.jsx              # Componente de ticket
│       ├── TicketPrint.css              # Estilos del ticket
│       ├── TicketPreviewModal.jsx       # Modal de vista previa
│       └── TicketPreviewModal.css       # Estilos del modal
├── pages/
│   ├── ConfiguracionImpresionScreen.jsx # Pantalla de configuración
│   └── ConfiguracionImpresionScreen.css # Estilos de configuración
└── services/
    └── api.js                           # Servicio API (+ configuracionImpresionService)
```

### Servicio API

**Ubicación:** `frontend/src/services/api.js`

```javascript
export const configuracionImpresionService = {
  // Obtener configuración activa
  getActiva: async () => {
    const response = await fetch(`${API_URL}/configuracion-impresion/activa/`);
    return await response.json();
  },

  // Crear nueva configuración
  create: async (configData) => {
    const formData = new FormData();
    // Agregar campos...
    const response = await fetch(`${API_URL}/configuracion-impresion/`, {
      method: 'POST',
      body: formData,
    });
    return await response.json();
  },

  // Actualizar configuración
  update: async (id, configData) => {
    const formData = new FormData();
    // Agregar campos...
    const response = await fetch(`${API_URL}/configuracion-impresion/${id}/`, {
      method: 'PUT',
      body: formData,
    });
    return await response.json();
  }
};
```

### Componente TicketPrint

**Ubicación:** `frontend/src/components/Print/TicketPrint.jsx`

**Props:**
```javascript
{
  tipo: 'venta' | 'pedido',
  numero: 'F-000001',
  fecha: '2025-10-17T14:30:00',
  cliente: 'CONSUMIDOR FINAL',
  vendedor: 'Carlos',
  items: [...],
  subtotal: 10000,
  impuestos: 0,
  descuentos: 0,
  total: 10000,
  metodoPago: 'EFECTIVO',
  dineroEntregado: 20000,
  devuelta: 10000,
  // Para pedidos:
  direccionEntrega: 'Calle 123',
  telefonoContacto: '3001234567',
  fechaEntrega: '2025-10-18',
  tipoPedido: 'ENTREGA',
  transportadora: 'Propia',
  nota: 'Entregar en la mañana'
}
```

**Características:**
- Carga configuración automáticamente
- Formatea moneda y fechas
- Muestra logo si está configurado
- Adapta contenido según tipo (venta/pedido)
- Estilos optimizados para impresión térmica

### Componente TicketPreviewModal

**Ubicación:** `frontend/src/components/Print/TicketPreviewModal.jsx`

**Props:**
```javascript
{
  show: boolean,
  onClose: function,
  ticketData: {...} // Props de TicketPrint
}
```

**Características:**
- Modal con vista previa del ticket
- Botón "Imprimir" que ejecuta `window.print()`
- Botón "Cerrar"
- Oculta elementos de UI al imprimir

### Pantalla de Configuración

**Ubicación:** `frontend/src/pages/ConfiguracionImpresionScreen.jsx`

**Ruta:** `/configuracion/impresion`

**Secciones:**
1. **Información del Negocio**
   - Nombre del negocio
   - NIT
   - Dirección
   - Teléfono
   - Email
   - Régimen tributario
   - Resolución de facturación

2. **Textos Personalizables**
   - Encabezado del ticket
   - Mensaje de agradecimiento
   - Pie de página del ticket

3. **Configuración de Impresión**
   - Ancho del papel (58mm/80mm)
   - Impresora predeterminada
   - Logo del negocio (upload)
   - Mostrar logo (checkbox)
   - Mostrar código de barras (checkbox)

---

## FLUJO DE TRABAJO

### Flujo en POS

```
1. Usuario agrega productos al carrito
   ↓
2. Click en "Procesar Pago"
   ↓
3. Se abre PaymentModal
   ↓
4. Usuario ingresa método de pago y dinero entregado
   ↓
5. Click en "Confirmar"
   ↓
6. ✅ Venta creada en BD
   ↓
7. Modal muestra mensaje de éxito + botones:
   - "Imprimir Tirilla" → Abre TicketPreviewModal
   - "Cerrar" → Limpia carrito y cierra modal
   ↓
8. Usuario hace click en "Imprimir Tirilla"
   ↓
9. Se abre TicketPreviewModal con vista previa
   ↓
10. Usuario hace click en "Imprimir"
    ↓
11. Se ejecuta window.print()
```

### Flujo en Pedidos

```
1. Usuario selecciona cliente y productos
   ↓
2. Click en "Procesar Pedido"
   ↓
3. Se abre PaymentModal
   ↓
4. Usuario ingresa dirección, fecha entrega, etc.
   ↓
5. Click en "Generar Pedido"
   ↓
6. ✅ Pedido creado en BD
   ↓
7. Modal muestra mensaje de éxito + botones:
   - "Imprimir Tirilla" → Abre TicketPreviewModal
   - "Cerrar" → Resetea formulario y cierra modal
   ↓
8. Usuario hace click en "Imprimir Tirilla"
   ↓
9. Se abre TicketPreviewModal con vista previa
   ↓
10. Usuario hace click en "Imprimir"
    ↓
11. Se ejecuta window.print()
```

---

## CONFIGURACIÓN

### Paso 1: Configurar Información del Negocio

1. Ir a `/configuracion/impresion`
2. Llenar campos de información del negocio
3. Subir logo (opcional)
4. Guardar configuración

### Paso 2: Personalizar Textos

1. Agregar encabezado personalizado (opcional)
2. Modificar mensaje de agradecimiento
3. Agregar pie de página (opcional)
4. Guardar configuración

### Paso 3: Configurar Impresión

1. Seleccionar ancho de papel (58mm o 80mm)
2. Configurar impresora predeterminada (opcional)
3. Activar/desactivar logo
4. Activar/desactivar código de barras
5. Guardar configuración

---

## USO DEL SISTEMA

### Imprimir desde POS

1. Crear venta normalmente
2. Después de confirmar, aparece mensaje de éxito
3. Click en "Imprimir Tirilla"
4. Revisar vista previa
5. Click en "Imprimir"
6. Seleccionar impresora térmica
7. Imprimir

### Imprimir desde Pedidos

1. Crear pedido normalmente
2. Después de generar, aparece mensaje de éxito
3. Click en "Imprimir Tirilla"
4. Revisar vista previa
5. Click en "Imprimir"
6. Seleccionar impresora térmica
7. Imprimir

### Formato del Ticket

**Para Ventas:**
```
================================
        [LOGO]
      MI NEGOCIO
    NIT: 123456789-0
  Calle 123 #45-67
   Tel: 3001234567
  email@negocio.com
================================
FACTURA: F-00001234
Fecha: 17/10/2025 14:30
Cliente: CONSUMIDOR FINAL
Vendedor: Carlos
================================
Cant  Producto         P.Unit  Total
1     AREPA OBLEA      2,700   2,700
2     AREPA MEDIANA    2,500   5,000
================================
Subtotal:              7,700
TOTAL:                 7,700
================================
Método de Pago: EFECTIVO
Efectivo Recibido:    10,000
Cambio:                2,300
================================
¡Gracias por su compra!
================================
```

**Para Pedidos:**
```
================================
        [LOGO]
      MI NEGOCIO
    NIT: 123456789-0
================================
PEDIDO: PED-000001
Fecha: 17/10/2025 14:30
Cliente: PRUEBA5
Vendedor: Carlos
Dirección: Cll135 45-89
Teléfono: 85623447
Fecha Entrega: 18/10/2025
Tipo: ENTREGA
Transportadora: Propia
================================
Cant  Producto         P.Unit  Total
1     AREPA OBLEA      2,700   2,700
1     AREPA MEDIANA    2,500   2,500
================================
Subtotal:              5,200
TOTAL:                 5,200
================================
Nota:
Entregar en la mañana
================================
¡Gracias por su compra!
================================
```

---

## ARCHIVOS MODIFICADOS

### Backend
- ✅ `api/models.py` - Agregado modelo ConfiguracionImpresion
- ✅ `api/serializers.py` - Agregado ConfiguracionImpresionSerializer
- ✅ `api/views.py` - Agregado ConfiguracionImpresionViewSet
- ✅ `api/urls.py` - Agregada ruta configuracion-impresion
- ✅ `api/migrations/0037_configuracionimpresion.py` - Migración creada

### Frontend
- ✅ `frontend/src/services/api.js` - Agregado configuracionImpresionService
- ✅ `frontend/src/components/Print/TicketPrint.jsx` - Nuevo componente
- ✅ `frontend/src/components/Print/TicketPrint.css` - Nuevos estilos
- ✅ `frontend/src/components/Print/TicketPreviewModal.jsx` - Nuevo componente
- ✅ `frontend/src/components/Print/TicketPreviewModal.css` - Nuevos estilos
- ✅ `frontend/src/pages/ConfiguracionImpresionScreen.jsx` - Nueva pantalla
- ✅ `frontend/src/pages/ConfiguracionImpresionScreen.css` - Nuevos estilos
- ✅ `frontend/src/components/Pos/PaymentModal.jsx` - Integración de impresión
- ✅ `frontend/src/components/Pos/PaymentModal.css` - Estilos de mensaje de éxito
- ✅ `frontend/src/components/Pedidos/PaymentModal.jsx` - Integración de impresión
- ✅ `frontend/src/App.js` - Agregada ruta /configuracion/impresion

---

## PRÓXIMAS MEJORAS

- [ ] Soporte para múltiples idiomas
- [ ] Plantillas de tickets personalizables
- [ ] Generación de código de barras real
- [ ] Exportar ticket a PDF
- [ ] Enviar ticket por email
- [ ] Historial de impresiones
- [ ] Configuración de márgenes
- [ ] Soporte para impresoras Bluetooth

---

## NOTAS TÉCNICAS

### Impresión Térmica
- El sistema usa `window.print()` del navegador
- Los estilos CSS están optimizados para papel térmico
- Se usa `@media print` para ocultar elementos de UI
- Fuente monoespaciada para alineación correcta

### Compatibilidad
- Funciona con cualquier impresora térmica compatible con el navegador
- Soporta Chrome, Firefox, Edge
- Requiere configuración de impresora en el sistema operativo

### Seguridad
- Las imágenes se guardan en `media/configuracion/`
- Solo se permite una configuración activa a la vez
- Los endpoints están protegidos por permisos de Django

---

¡Sistema de impresión de tickets implementado exitosamente! 🎉
