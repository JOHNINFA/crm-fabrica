# 🏭 SISTEMA CRM FÁBRICA DE AREPAS - DOCUMENTACIÓN COMPLETA

## 📋 ÍNDICE GENERAL

1. [ARQUITECTURA GENERAL](#arquitectura-general)
2. [TECNOLOGÍAS Y STACK](#tecnologías-y-stack)
3. [ESTRUCTURA DE ARCHIVOS](#estructura-de-archivos)
4. [SECCIÓN POS](#sección-pos)
5. [SECCIÓN CARGUE](#sección-cargue)
6. [SECCIÓN INVENTARIO](#sección-inventario)
7. [SECCIÓN CAJA](#sección-caja)
8. [BACKEND DJANGO](#backend-django)
9. [FRONTEND REACT](#frontend-react)
10. [BASE DE DATOS](#base-de-datos)

---

## ARQUITECTURA GENERAL

### Stack Tecnológico
```
Frontend: React 19.1.0 + Bootstrap 5.3.6
Backend: Django 5.1.7 + Django REST Framework
Base de Datos: PostgreSQL
Almacenamiento: Local Storage + API REST
```

### Estructura de Comunicación
```
Frontend React ←→ Django REST API ←→ PostgreSQL
     ↓
LocalStorage (Cache)
```

### Módulos Principales
- **POS**: Punto de venta con facturación
- **Cargue**: Operativo para 6 vendedores
- **Inventario**: Control de stock y movimientos
- **Caja**: Arqueo y movimientos de caja
- **Clientes**: Gestión de clientes y precios
- **Reportes**: Análisis de ventas

---## TECNOLOG
ÍAS Y STACK

### Frontend
- **React 19.1.0**: Framework principal
- **React Router DOM**: Navegación entre páginas
- **Bootstrap 5.3.6**: Framework CSS
- **React Bootstrap**: Componentes UI
- **Bootstrap Icons**: Iconografía
- **React Calendar**: Selector de fechas

### Backend
- **Django 5.1.7**: Framework web
- **Django REST Framework**: API REST
- **PostgreSQL**: Base de datos
- **CORS Headers**: Comunicación cross-origin
- **Pillow**: Manejo de imágenes

### Herramientas de Desarrollo
- **npm**: Gestor de paquetes frontend
- **pip**: Gestor de paquetes Python
- **Git**: Control de versiones

---

## ESTRUCTURA DE ARCHIVOS

```
proyecto/
├── backend_crm/           # Configuración Django
│   ├── settings.py        # Configuración principal
│   ├── urls.py           # URLs principales
│   └── wsgi.py           # Servidor WSGI
├── api/                  # Aplicación Django principal
│   ├── models.py         # Modelos de base de datos
│   ├── views.py          # Vistas/APIs
│   ├── serializers.py    # Serializers REST
│   ├── urls.py           # URLs de la API
│   └── migrations/       # Migraciones de BD
├── frontend/             # Aplicación React
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   │   ├── Pos/      # Componentes POS
│   │   │   ├── Cargue/   # Componentes Cargue
│   │   │   ├── inventario/ # Componentes Inventario
│   │   │   └── common/   # Componentes comunes
│   │   ├── pages/        # Páginas principales
│   │   ├── services/     # Servicios API
│   │   ├── context/      # Context API
│   │   ├── styles/       # Estilos CSS
│   │   └── utils/        # Utilidades
│   ├── public/           # Archivos públicos
│   └── package.json      # Dependencias npm
├── media/                # Archivos multimedia
└── manage.py             # Comando Django
```

---#
# SECCIÓN POS

### 🎯 Propósito
Sistema de punto de venta completo para facturación directa con pago inmediato, gestión de cajeros, arqueo de caja y control de inventario en tiempo real.

### 📁 Componentes Frontend

#### Componentes Principales
```
frontend/src/components/Pos/
├── PosScreen.jsx         # Pantalla principal del POS
├── Topbar.jsx           # Barra superior con cajero
├── Sidebar.jsx          # Menú lateral
├── ProductList.jsx      # Lista de productos
├── Cart.jsx             # Carrito de compras
├── ConsumerForm.jsx     # Formulario de cliente
├── PaymentModal.jsx     # Modal de pago
├── InvoiceModal.jsx     # Modal de factura
└── LoginCajeroModal.jsx # Login de cajeros
```

#### Funcionalidades Clave

**1. Gestión de Productos**
```javascript
// ProductList.jsx - Mostrar productos con filtros
const addProduct = (product, currentPrice = null) => {
  setCart((prev) => {
    const found = prev.find((item) => item.id === product.id);
    if (found) {
      return prev.map((item) =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      );
    }
    const priceToUse = currentPrice !== null ? currentPrice : product.price;
    return [...prev, { ...product, price: priceToUse, qty: 1 }];
  });
};
```

**2. Sistema de Cajeros**
```javascript
// CajeroContext.jsx - Gestión de autenticación
export const CajeroProvider = ({ children }) => {
  const [cajeroLogueado, setCajeroLogueado] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [turnoActual, setTurnoActual] = useState(null);
  
  const login = async (codigo, saldoInicial) => {
    const cajero = await cajeroService.login(codigo);
    if (cajero) {
      setCajeroLogueado(cajero);
      setIsAuthenticated(true);
      // Crear turno automáticamente
      const turno = await cajeroService.crearTurno(cajero.id, saldoInicial);
      setTurnoActual(turno);
    }
  };
};
```

**3. Procesamiento de Ventas**
```javascript
// PaymentModal.jsx - Procesar pago
const handlePayment = async () => {
  const ventaData = {
    vendedor: seller,
    cliente: client,
    metodo_pago: paymentMethod,
    subtotal: subtotal,
    impuestos: totalTax,
    descuentos: totalDiscount,
    total: total,
    dinero_entregado: parseFloat(cashReceived),
    devuelta: change,
    detalles: cart.map(item => ({
      producto_id: item.id,
      producto_nombre: item.nombre,
      cantidad: item.qty,
      precio_unitario: item.price,
      subtotal: item.price * item.qty
    }))
  };
  
  const result = await ventaService.create(ventaData);
  if (result && !result.error) {
    // Actualizar inventario automáticamente
    await updateInventoryAfterSale(cart);
    clearCart();
    showInvoice(result);
  }
};
```

### 🔧 Backend APIs

#### Modelos Principales
```python
# api/models.py
class Venta(models.Model):
    ESTADO_CHOICES = [
        ('PAGADO', 'Pagado'),
        ('PENDIENTE', 'Pendiente'),
        ('ANULADA', 'Anulada'),
    ]
    
    numero_factura = models.CharField(max_length=50, unique=True)
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100)
    cliente = models.CharField(max_length=255, default='CONSUMIDOR FINAL')
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PAGADO')

class Cajero(models.Model):
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10, unique=True)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)

class Turno(models.Model):
    cajero = models.ForeignKey(Cajero, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField(default=timezone.now)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    saldo_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    activo = models.BooleanField(default=True)
```

#### APIs REST
```python
# api/views.py
class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer
    
    @action(detail=True, methods=['patch'])
    def anular_venta(self, request, pk=None):
        venta = self.get_object()
        venta.estado = 'ANULADA'
        venta.save()
        
        # Devolver productos al inventario
        for detalle in venta.detalles.all():
            producto = detalle.producto
            producto.stock_total += detalle.cantidad
            producto.save()
        
        return Response({'success': True})
```

### 🎨 Estilos CSS

#### Estilos Principales
```css
/* frontend/src/components/Pos/ProductCard.css */
.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* frontend/src/components/Pos/Cart.css */
.cart-container {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  height: 100%;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #dee2e6;
}
```

### 🔄 Flujo de Datos POS

```
1. Login Cajero → CajeroContext → Crear Turno
2. Seleccionar Productos → ProductList → Cart
3. Configurar Cliente → ConsumerForm → State
4. Procesar Pago → PaymentModal → API Venta
5. Actualizar Inventario → ProductService → Stock
6. Generar Factura → InvoiceModal → PDF
```

### 🔗 Conexiones con Otros Módulos

- **Inventario**: Actualización automática de stock tras venta
- **Caja**: Registro de ventas para arqueo diario
- **Clientes**: Gestión de listas de precios
- **Reportes**: Datos para análisis de ventas

---## SECCIÓ
N CARGUE

### 🎯 Propósito
Sistema operativo para gestionar 6 vendedores independientes (ID1-ID6) con registro de productos, devoluciones, pagos, control de cumplimiento y sincronización con base de datos.

### 📁 Componentes Frontend

#### Componentes Principales
```
frontend/src/components/Cargue/
├── PlantillaOperativa.jsx    # Plantilla principal por vendedor
├── MenuSheets.jsx           # Selector de vendedores
├── TablaProductos.jsx       # Tabla de productos por vendedor
├── ControlCumplimiento.jsx  # Control de cumplimiento
├── ResumenVentas.jsx        # Resumen de pagos y totales
├── BotonLimpiar.jsx         # Guardado y limpieza
├── ResponsableManager.jsx   # Gestión de responsables
├── LotesVencidos.jsx        # Registro de lotes vencidos
└── Produccion.jsx           # Módulo de producción
```

#### Funcionalidades Clave

**1. Gestión de Vendedores**
```javascript
// MenuSheets.jsx - Selector de vendedores
const vendedores = [
  { id: 'ID1', nombre: 'Vendedor 1', color: '#007bff' },
  { id: 'ID2', nombre: 'Vendedor 2', color: '#28a745' },
  { id: 'ID3', nombre: 'Vendedor 3', color: '#ffc107' },
  { id: 'ID4', nombre: 'Vendedor 4', color: '#dc3545' },
  { id: 'ID5', nombre: 'Vendedor 5', color: '#6f42c1' },
  { id: 'ID6', nombre: 'Vendedor 6', color: '#fd7e14' }
];

const handleVendedorSelect = (vendedor) => {
  navigate(`/cargue/${dia}/${vendedor.id}`);
};
```

**2. Tabla de Productos Dinámica**
```javascript
// TablaProductos.jsx - Gestión de productos por vendedor
const TablaProductos = ({ productos, onProductoChange, fechaSeleccionada, idSheet }) => {
  const handleCantidadChange = (productoId, campo, valor) => {
    const nuevoValor = parseInt(valor) || 0;
    
    // Calcular total automáticamente
    const producto = productos.find(p => p.id === productoId);
    const cantidad = campo === 'cantidad' ? nuevoValor : producto.cantidad;
    const dctos = campo === 'dctos' ? nuevoValor : producto.dctos;
    const adicional = campo === 'adicional' ? nuevoValor : producto.adicional;
    const devoluciones = campo === 'devoluciones' ? nuevoValor : producto.devoluciones;
    const vencidas = campo === 'vencidas' ? nuevoValor : producto.vencidas;
    
    const total = cantidad - dctos + adicional - devoluciones - vencidas;
    const neto = total * producto.valor;
    
    onProductoChange(productoId, {
      [campo]: nuevoValor,
      total: total,
      neto: neto
    });
  };
  
  return (
    <Table striped bordered hover size="sm">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Dctos</th>
          <th>Adicional</th>
          <th>Devoluciones</th>
          <th>Vencidas</th>
          <th>Total</th>
          <th>Valor</th>
          <th>Neto</th>
        </tr>
      </thead>
      <tbody>
        {productos.map(producto => (
          <tr key={producto.id}>
            <td>{producto.nombre}</td>
            <td>
              <Form.Control
                type="number"
                value={producto.cantidad || 0}
                onChange={(e) => handleCantidadChange(producto.id, 'cantidad', e.target.value)}
              />
            </td>
            {/* Más campos... */}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
```

**3. Control de Cumplimiento**
```javascript
// ControlCumplimiento.jsx - Checkboxes de cumplimiento
const ControlCumplimiento = ({ dia, idSheet, fechaSeleccionada }) => {
  const [cumplimientos, setCumplimientos] = useState({
    licencia_transporte: '',
    soat: '',
    uniforme: '',
    no_locion: '',
    no_accesorios: '',
    capacitacion_carnet: '',
    higiene: '',
    estibas: '',
    desinfeccion: ''
  });
  
  const handleCumplimientoChange = (campo, valor) => {
    const nuevosCumplimientos = {
      ...cumplimientos,
      [campo]: valor
    };
    setCumplimientos(nuevosCumplimientos);
    
    // Guardar en localStorage
    const key = `cumplimiento_${dia}_${idSheet}_${fechaSeleccionada}`;
    localStorage.setItem(key, JSON.stringify(nuevosCumplimientos));
  };
  
  return (
    <Card>
      <Card.Header>Control de Cumplimiento</Card.Header>
      <Card.Body>
        {Object.entries(cumplimientos).map(([campo, valor]) => (
          <Row key={campo} className="mb-2">
            <Col md={6}>
              <label>{campo.replace(/_/g, ' ').toUpperCase()}</label>
            </Col>
            <Col md={6}>
              <ButtonGroup>
                <Button
                  variant={valor === 'SI' ? 'success' : 'outline-success'}
                  size="sm"
                  onClick={() => handleCumplimientoChange(campo, 'SI')}
                >
                  SI
                </Button>
                <Button
                  variant={valor === 'NO' ? 'danger' : 'outline-danger'}
                  size="sm"
                  onClick={() => handleCumplimientoChange(campo, 'NO')}
                >
                  NO
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        ))}
      </Card.Body>
    </Card>
  );
};
```

**4. Guardado Completo**
```javascript
// BotonLimpiar.jsx - Guardado integral
const guardarDatosCompletos = async () => {
  const datosParaGuardar = {
    dia_semana: dia,
    vendedor_id: id,
    fecha: fechaAUsar,
    responsable: responsableReal,
    
    // Datos de productos
    productos: productosParaGuardar,
    
    // Datos de pagos
    pagos: {
      concepto: pagosData.concepto || '',
      descuentos: pagosData.descuentos || 0,
      nequi: pagosData.nequi || 0,
      daviplata: pagosData.daviplata || 0
    },
    
    // Datos de resumen
    resumen: {
      base_caja: resumenData.base_caja || 0,
      total_despacho: resumenData.total_despacho || 0,
      total_pedidos: resumenData.total_pedidos || 0,
      total_dctos: resumenData.total_dctos || 0,
      venta: resumenData.venta || 0,
      total_efectivo: resumenData.total_efectivo || 0
    },
    
    // Control de cumplimiento
    cumplimiento: cumplimientoData,
    
    // Checkboxes V y D
    v: estadoV,
    d: estadoD
  };
  
  // Enviar a API
  const resultado = await cargueService.guardarCargueCompleto(datosParaGuardar);
  
  if (resultado.success) {
    // Limpiar localStorage
    limpiarLocalStorage();
    alert('✅ Datos guardados exitosamente en base de datos');
  }
};
```

### 🔧 Backend APIs

#### Modelos por Vendedor
```python
# api/models.py - Modelo para cada vendedor (ID1-ID6)
class CargueID1(models.Model):
    # Identificación
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    responsable = models.CharField(max_length=100, blank=True)
    
    # Checkboxes
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # Productos
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON
    total = models.IntegerField(default=0)  # Calculado
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Calculado
    
    # Pagos
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Resumen
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Control de cumplimiento
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    # ... más campos de cumplimiento
    
    def save(self, *args, **kwargs):
        # Cálculos automáticos
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)

# Similar para CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
```

#### APIs REST por Vendedor
```python
# api/views.py
class CargueID1ViewSet(viewsets.ModelViewSet):
    queryset = CargueID1.objects.all()
    serializer_class = CargueID1Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = CargueID1.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        # Procesar datos completos del cargue
        data = request.data
        
        # Transformar datos del frontend al formato del modelo
        transformed_data = {
            'dia': data.get('dia_semana'),
            'fecha': data.get('fecha'),
            'responsable': data.get('responsable'),
            'v': data.get('v', False),
            'd': data.get('d', False),
            
            # Datos de pagos
            'concepto': data.get('pagos', {}).get('concepto', ''),
            'descuentos': data.get('pagos', {}).get('descuentos', 0),
            'nequi': data.get('pagos', {}).get('nequi', 0),
            'daviplata': data.get('pagos', {}).get('daviplata', 0),
            
            # Datos de resumen
            'base_caja': data.get('resumen', {}).get('base_caja', 0),
            'total_despacho': data.get('resumen', {}).get('total_despacho', 0),
            'venta': data.get('resumen', {}).get('venta', 0),
            'total_efectivo': data.get('resumen', {}).get('total_efectivo', 0),
            
            # Control de cumplimiento
            **data.get('cumplimiento', {})
        }
        
        # Crear registros para cada producto
        productos = data.get('productos', [])
        for producto_data in productos:
            producto_record = {
                **transformed_data,
                'producto': producto_data.get('nombre'),
                'cantidad': producto_data.get('cantidad', 0),
                'dctos': producto_data.get('dctos', 0),
                'adicional': producto_data.get('adicional', 0),
                'devoluciones': producto_data.get('devoluciones', 0),
                'vencidas': producto_data.get('vencidas', 0),
                'valor': producto_data.get('valor', 0),
                'lotes_vencidos': json.dumps(producto_data.get('lotes_vencidos', []))
            }
            
            serializer = self.get_serializer(data=producto_record)
            if serializer.is_valid():
                serializer.save()
        
        return Response({'success': True, 'message': 'Cargue guardado exitosamente'})
```

### 🎨 Estilos CSS

```css
/* frontend/src/components/Cargue/PlantillaOperativa.css */
.plantilla-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

.vendedor-header {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.tabla-productos {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.input-cantidad {
  width: 80px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
}

.total-calculado {
  background: #e9ecef;
  font-weight: bold;
  text-align: center;
}

/* frontend/src/components/Cargue/ControlCumplimiento.css */
.cumplimiento-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.cumplimiento-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.btn-cumplimiento {
  min-width: 60px;
  margin: 0 5px;
}
```

### 🔄 Flujo de Datos Cargue

```
1. Seleccionar Día → SelectorDia → MenuSheets
2. Seleccionar Vendedor → MenuSheets → PlantillaOperativa
3. Cargar Datos → LocalStorage → Estado Componentes
4. Modificar Productos → TablaProductos → Cálculos Automáticos
5. Control Cumplimiento → ControlCumplimiento → LocalStorage
6. Resumen Pagos → ResumenVentas → Totales
7. Guardar Todo → BotonLimpiar → API CargueIDX → PostgreSQL
```

### 🔗 Conexiones con Otros Módulos

- **Inventario**: Datos de productos y valores
- **Producción**: Módulo independiente con congelado
- **Reportes**: Análisis de vendedores y cumplimiento
- **Base de Datos**: Persistencia completa de todos los datos

---#
# SECCIÓN INVENTARIO

### 🎯 Propósito
Sistema completo de gestión de inventario con control de stock, movimientos, kardex, producción, maquilas y sincronización automática con otros módulos.

### 📁 Componentes Frontend

#### Componentes Principales
```
frontend/src/components/inventario/
├── InventarioProduccion.jsx      # Inventario de producción
├── InventarioPlaneacion.jsx      # Planeación de inventario
├── InventarioMaquilas.jsx        # Gestión de maquilas
├── TablaInventario.jsx           # Tabla principal de inventario
├── TablaKardex.jsx              # Kardex de movimientos
├── TablaMovimientos.jsx         # Movimientos detallados
├── ModalEditarExistencias.jsx   # Editar cantidades
├── ModalAgregarProducto.jsx     # Agregar productos
└── TablaConfirmacionProduccion.jsx # Confirmación de producción
```

#### Funcionalidades Clave

**1. Gestión de Stock**
```javascript
// TablaInventario.jsx - Control de existencias
const TablaInventario = () => {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  
  const actualizarStock = async (productoId, nuevaCantidad, motivo) => {
    try {
      const resultado = await productoService.updateStock(
        productoId,
        nuevaCantidad,
        'Sistema',
        motivo
      );
      
      if (resultado && !resultado.error) {
        // Actualizar estado local
        setProductos(prev => 
          prev.map(p => 
            p.id === productoId 
              ? { ...p, stock_total: resultado.nuevo_stock }
              : p
          )
        );
        
        // Registrar movimiento
        registrarMovimiento(productoId, nuevaCantidad, 'AJUSTE', motivo);
      }
    } catch (error) {
      console.error('Error actualizando stock:', error);
    }
  };
  
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Stock Actual</th>
          <th>Precio</th>
          <th>Categoría</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productos.map(producto => (
          <tr key={producto.id}>
            <td>{producto.nombre}</td>
            <td>
              <Badge bg={producto.stock_total > 10 ? 'success' : 'warning'}>
                {producto.stock_total}
              </Badge>
            </td>
            <td>{formatCurrency(producto.precio)}</td>
            <td>{producto.categoria?.nombre}</td>
            <td>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => editarExistencias(producto)}
              >
                Editar Stock
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
```

**2. Kardex de Movimientos**
```javascript
// TablaKardex.jsx - Historial de movimientos
const TablaKardex = ({ productoId }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [saldoAcumulado, setSaldoAcumulado] = useState(0);
  
  useEffect(() => {
    cargarMovimientos();
  }, [productoId]);
  
  const cargarMovimientos = async () => {
    const data = await movimientoService.getByProducto(productoId);
    
    // Calcular saldos acumulados
    let saldo = 0;
    const movimientosConSaldo = data.map(mov => {
      if (mov.tipo === 'ENTRADA') {
        saldo += mov.cantidad;
      } else if (mov.tipo === 'SALIDA') {
        saldo -= mov.cantidad;
      }
      
      return {
        ...mov,
        saldo_acumulado: saldo
      };
    });
    
    setMovimientos(movimientosConSaldo);
    setSaldoAcumulado(saldo);
  };
  
  return (
    <div className="kardex-container">
      <h5>Kardex - Saldo Actual: {saldoAcumulado}</h5>
      <Table size="sm" striped>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Saldo</th>
            <th>Usuario</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map(mov => (
            <tr key={mov.id}>
              <td>{formatDate(mov.fecha)}</td>
              <td>
                <Badge bg={
                  mov.tipo === 'ENTRADA' ? 'success' : 
                  mov.tipo === 'SALIDA' ? 'danger' : 'warning'
                }>
                  {mov.tipo}
                </Badge>
              </td>
              <td className={mov.tipo === 'ENTRADA' ? 'text-success' : 'text-danger'}>
                {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
              </td>
              <td><strong>{mov.saldo_acumulado}</strong></td>
              <td>{mov.usuario}</td>
              <td>{mov.nota}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
```

**3. Gestión de Producción**
```javascript
// InventarioProduccion.jsx - Control de producción
const InventarioProduccion = () => {
  const [produccion, setProduccion] = useState([]);
  const [nuevaProduccion, setNuevaProduccion] = useState({
    producto: '',
    cantidad: 0,
    lote: '',
    fecha_produccion: getFechaLocal()
  });
  
  const registrarProduccion = async () => {
    try {
      const resultado = await produccionService.create(nuevaProduccion);
      
      if (resultado && !resultado.error) {
        // Actualizar inventario automáticamente
        await productoService.updateStock(
          nuevaProduccion.producto_id,
          nuevaProduccion.cantidad,
          'Producción',
          `Producción lote ${nuevaProduccion.lote}`
        );
        
        // Actualizar lista
        cargarProduccion();
        limpiarFormulario();
        
        alert('✅ Producción registrada y stock actualizado');
      }
    } catch (error) {
      console.error('Error registrando producción:', error);
    }
  };
  
  const congelarProduccion = async (produccionId) => {
    const confirmar = window.confirm('¿Está seguro de congelar esta producción?');
    if (!confirmar) return;
    
    try {
      const resultado = await produccionService.congelar(produccionId, 'Sistema');
      if (resultado.success) {
        cargarProduccion();
        alert('✅ Producción congelada exitosamente');
      }
    } catch (error) {
      console.error('Error congelando producción:', error);
    }
  };
  
  return (
    <Container>
      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>Nueva Producción</Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Producto</Form.Label>
                  <Form.Select
                    value={nuevaProduccion.producto}
                    onChange={(e) => setNuevaProduccion(prev => ({
                      ...prev,
                      producto: e.target.value
                    }))}
                  >
                    <option value="">Seleccionar producto...</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Cantidad</Form.Label>
                  <Form.Control
                    type="number"
                    value={nuevaProduccion.cantidad}
                    onChange={(e) => setNuevaProduccion(prev => ({
                      ...prev,
                      cantidad: parseInt(e.target.value) || 0
                    }))}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Lote</Form.Label>
                  <Form.Control
                    type="text"
                    value={nuevaProduccion.lote}
                    onChange={(e) => setNuevaProduccion(prev => ({
                      ...prev,
                      lote: e.target.value
                    }))}
                  />
                </Form.Group>
                
                <Button 
                  variant="success" 
                  onClick={registrarProduccion}
                  disabled={!nuevaProduccion.producto || !nuevaProduccion.cantidad}
                >
                  Registrar Producción
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card>
            <Card.Header>Producción Registrada</Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Lote</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {produccion.map(prod => (
                    <tr key={prod.id}>
                      <td>{formatDate(prod.fecha)}</td>
                      <td>{prod.producto}</td>
                      <td>{prod.cantidad}</td>
                      <td>{prod.lote}</td>
                      <td>
                        <Badge bg={prod.congelado ? 'secondary' : 'success'}>
                          {prod.congelado ? 'Congelado' : 'Activo'}
                        </Badge>
                      </td>
                      <td>
                        {!prod.congelado && (
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => congelarProduccion(prod.id)}
                          >
                            Congelar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
```

**4. Sincronización Automática**
```javascript
// services/syncService.js - Sincronización con otros módulos
export const syncService = {
  // Sincronizar inventario con POS
  syncWithPOS: async () => {
    try {
      const productos = await productoService.getAll();
      
      // Actualizar localStorage del POS
      localStorage.setItem('productos_pos', JSON.stringify(productos));
      
      // Disparar evento para actualizar componentes
      window.dispatchEvent(new CustomEvent('inventarioActualizado', {
        detail: { productos }
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Error sincronizando con POS:', error);
      return { success: false, error };
    }
  },
  
  // Sincronizar con módulo de cargue
  syncWithCargue: async () => {
    try {
      const productos = await productoService.getAll();
      
      // Actualizar datos para cargue operativo
      const productosParaCargue = productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        valor: p.precio,
        stock: p.stock_total
      }));
      
      localStorage.setItem('productos_cargue', JSON.stringify(productosParaCargue));
      
      return { success: true };
    } catch (error) {
      console.error('Error sincronizando con Cargue:', error);
      return { success: false, error };
    }
  },
  
  // Sincronización automática cada 5 minutos
  startAutoSync: () => {
    setInterval(async () => {
      await syncService.syncWithPOS();
      await syncService.syncWithCargue();
      console.log('🔄 Sincronización automática completada');
    }, 5 * 60 * 1000); // 5 minutos
  }
};
```

### 🔧 Backend APIs

#### Modelos de Inventario
```python
# api/models.py
class Producto(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_total = models.IntegerField(default=0)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    codigo_barras = models.CharField(max_length=100, blank=True, null=True)
    marca = models.CharField(max_length=100, default="GENERICA")
    impuesto = models.CharField(max_length=20, default="IVA(0%)")
    fecha_creacion = models.DateTimeField(default=timezone.now)
    activo = models.BooleanField(default=True)

class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
    ]
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField(default=timezone.now)
    usuario = models.CharField(max_length=100)
    nota = models.TextField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        # Actualizar stock automáticamente
        if self.tipo == 'ENTRADA':
            self.producto.stock_total += self.cantidad
        elif self.tipo == 'SALIDA':
            self.producto.stock_total -= self.cantidad
        elif self.tipo == 'AJUSTE':
            # Para ajustes, la cantidad puede ser positiva o negativa
            self.producto.stock_total += self.cantidad
            
        self.producto.save()
        super().save(*args, **kwargs)

class Produccion(models.Model):
    fecha = models.DateField(default=timezone.now)
    producto = models.CharField(max_length=255)
    cantidad = models.IntegerField(default=0)
    lote = models.CharField(max_length=100, blank=True)
    
    # Función de congelado
    congelado = models.BooleanField(default=False)
    fecha_congelado = models.DateTimeField(blank=True, null=True)
    usuario_congelado = models.CharField(max_length=100, blank=True)
    
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def congelar(self, usuario):
        self.congelado = True
        self.fecha_congelado = timezone.now()
        self.usuario_congelado = usuario
        self.save()
    
    def descongelar(self, usuario):
        self.congelado = False
        self.fecha_congelado = None
        self.usuario_congelado = ''
        self.save()
```

#### APIs REST
```python
# api/views.py
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=True, methods=['post'])
    def actualizar_stock(self, request, pk=None):
        try:
            producto = self.get_object()
            cantidad = int(request.data.get('cantidad', 0))
            usuario = request.data.get('usuario', 'Sistema')
            nota = request.data.get('nota', '')
            
            # Crear movimiento de inventario
            MovimientoInventario.objects.create(
                producto=producto,
                tipo='AJUSTE',
                cantidad=cantidad,
                usuario=usuario,
                nota=nota
            )
            
            return Response({
                'success': True,
                'nuevo_stock': producto.stock_total,
                'message': f'Stock actualizado. Nuevo stock: {producto.stock_total}'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class ProduccionViewSet(viewsets.ModelViewSet):
    queryset = Produccion.objects.all()
    serializer_class = ProduccionSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=True, methods=['post'])
    def congelar(self, request, pk=None):
        produccion = self.get_object()
        usuario = request.data.get('usuario', 'Sistema')
        
        if produccion.congelado:
            return Response({'error': 'La producción ya está congelada'})
        
        produccion.congelar(usuario)
        return Response({'success': True, 'congelado': True})
    
    @action(detail=True, methods=['post'])
    def descongelar(self, request, pk=None):
        produccion = self.get_object()
        usuario = request.data.get('usuario', 'Sistema')
        
        if not produccion.congelado:
            return Response({'error': 'La producción no está congelada'})
        
        produccion.descongelar(usuario)
        return Response({'success': True, 'congelado': False})
```

### 🎨 Estilos CSS

```css
/* frontend/src/styles/InventarioScreen.css */
.inventario-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

.stock-badge {
  font-size: 0.9em;
  padding: 8px 12px;
}

.stock-low {
  background-color: #dc3545 !important;
  color: white;
}

.stock-medium {
  background-color: #ffc107 !important;
  color: black;
}

.stock-high {
  background-color: #28a745 !important;
  color: white;
}

/* frontend/src/styles/TablaKardex.css */
.kardex-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.movimiento-entrada {
  background-color: #d4edda;
  border-left: 4px solid #28a745;
}

.movimiento-salida {
  background-color: #f8d7da;
  border-left: 4px solid #dc3545;
}

.movimiento-ajuste {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
}

/* frontend/src/styles/InventarioProduccion.css */
.produccion-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin: 15px 0;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1);
}

.produccion-congelada {
  opacity: 0.7;
  background: #f8f9fa;
  border: 2px dashed #6c757d;
}

.btn-congelar {
  background: linear-gradient(45deg, #6c757d, #495057);
  border: none;
  color: white;
}
```

### 🔄 Flujo de Datos Inventario

```
1. Cargar Productos → ProductoService → Estado Componentes
2. Mostrar Stock → TablaInventario → Badges de Estado
3. Editar Existencias → ModalEditarExistencias → API updateStock
4. Registrar Movimiento → MovimientoInventario → Kardex
5. Producción → InventarioProduccion → Actualizar Stock
6. Sincronización → SyncService → POS + Cargue
7. Congelar Producción → ProduccionService → Estado Congelado
```

### 🔗 Conexiones con Otros Módulos

- **POS**: Actualización automática de stock tras ventas
- **Cargue**: Sincronización de productos y valores
- **Producción**: Registro de producción y actualización de inventario
- **Reportes**: Datos para análisis de movimientos y stock

---## SECCIÓN
 CAJA

### 🎯 Propósito
Sistema completo de arqueo de caja con autenticación de cajeros, gestión de turnos, movimientos de caja (ingresos/egresos), y control de diferencias entre valores del sistema y valores físicos.

### 📁 Componentes Frontend

#### Componentes Principales
```
frontend/src/pages/CajaScreen.jsx          # Pantalla principal de caja
frontend/src/context/CajeroContext.jsx     # Context de cajeros
frontend/src/components/Pos/LoginCajeroModal.jsx  # Login de cajeros
frontend/src/components/Pos/CajaValidaciones.jsx  # Validaciones de caja
frontend/src/services/cajaService.js       # Servicios de caja
frontend/src/services/cajeroService.js     # Servicios de cajeros
```

#### Funcionalidades Clave

**1. Autenticación de Cajeros**
```javascript
// CajeroContext.jsx - Gestión de cajeros y turnos
export const CajeroProvider = ({ children }) => {
  const [cajeroLogueado, setCajeroLogueado] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [turnoActual, setTurnoActual] = useState(null);
  
  const login = async (codigo, saldoInicial) => {
    try {
      const cajero = await cajeroService.login(codigo);
      
      if (cajero && !cajero.error) {
        setCajeroLogueado(cajero);
        setIsAuthenticated(true);
        
        // Crear turno automáticamente
        const turno = await cajeroService.crearTurno(cajero.id, saldoInicial);
        if (turno && !turno.error) {
          setTurnoActual(turno);
          
          // Guardar en localStorage
          localStorage.setItem('cajero_logueado', JSON.stringify(cajero));
          localStorage.setItem('turno_actual', JSON.stringify(turno));
          
          return { success: true, cajero, turno };
        }
      }
      
      return { success: false, message: 'Código de cajero inválido' };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, message: 'Error de conexión' };
    }
  };
  
  const logout = async () => {
    if (turnoActual) {
      // Cerrar turno
      await cajeroService.cerrarTurno(turnoActual.id);
    }
    
    setCajeroLogueado(null);
    setIsAuthenticated(false);
    setTurnoActual(null);
    
    // Limpiar localStorage
    localStorage.removeItem('cajero_logueado');
    localStorage.removeItem('turno_actual');
  };
  
  const getSaldoInicialTurno = () => {
    return turnoActual ? parseFloat(turnoActual.saldo_inicial) : 0;
  };
  
  return (
    <CajeroContext.Provider value={{
      cajeroLogueado,
      isAuthenticated,
      turnoActual,
      login,
      logout,
      getSaldoInicialTurno
    }}>
      {children}
    </CajeroContext.Provider>
  );
};
```

**2. Arqueo de Caja**
```javascript
// CajaScreen.jsx - Arqueo principal
const CajaScreenContent = () => {
  const { cajeroLogueado, isAuthenticated, getSaldoInicialTurno } = useCajero();
  const saldoInicialTurno = getSaldoInicialTurno();
  
  // Estados para valores de caja
  const [valoresCaja, setValoresCaja] = useState({
    efectivo: 0,
    tarjetas: 0,
    transferencia: 0,
    consignacion: 0,
    qr: 0,
    rappipay: 0,
    bonos: 0
  });
  
  // Valores del sistema (desde ventas)
  const [valoresSistema, setValoresSistema] = useState({
    efectivo: 0,
    tarjetas: 0,
    transferencia: 0,
    consignacion: 0,
    qr: 0,
    rappipay: 0,
    bonos: 0
  });
  
  // Estados para movimientos de caja
  const [movimientosCaja, setMovimientosCaja] = useState([]);
  
  // Cargar datos de ventas del día
  const cargarDatosVentas = async () => {
    try {
      const ventasData = await ventaService.getAll();
      
      if (ventasData && Array.isArray(ventasData)) {
        // Filtrar ventas del día actual Y que NO estén anuladas
        const ventasHoy = ventasData.filter(venta => {
          const fechaVenta = venta.fecha.split('T')[0];
          const esDelDia = fechaVenta === fechaConsulta;
          const noEstaAnulada = venta.estado !== 'ANULADA';
          return esDelDia && noEstaAnulada;
        });
        
        // Calcular resumen por método de pago
        const resumenPorMetodo = {
          efectivo: 0,
          tarjetas: 0,
          transferencia: 0,
          consignacion: 0,
          qr: 0,
          rappipay: 0,
          bonos: 0
        };
        
        ventasHoy.forEach(venta => {
          const metodo = (venta.metodo_pago || 'efectivo').toLowerCase();
          const total = parseFloat(venta.total) || 0;
          
          switch (metodo) {
            case 'efectivo':
              resumenPorMetodo.efectivo += total;
              break;
            case 'tarjeta':
            case 't_credito':
            case 'tarjetas':
              resumenPorMetodo.tarjetas += total;
              break;
            case 'transf':
            case 'transferencia':
              resumenPorMetodo.transferencia += total;
              break;
            case 'qr':
              resumenPorMetodo.qr += total;
              break;
            case 'rappipay':
              resumenPorMetodo.rappipay += total;
              break;
            case 'bonos':
              resumenPorMetodo.bonos += total;
              break;
            default:
              resumenPorMetodo.efectivo += total;
          }
        });
        
        setValoresSistema(resumenPorMetodo);
      }
    } catch (error) {
      console.error('Error cargando datos de ventas:', error);
    }
  };
  
  // Calcular diferencias (incluyendo movimientos de caja)
  const calcularDiferencia = (metodo) => {
    if (metodo === 'efectivo') {
      // Para efectivo, incluir movimientos de caja
      const efectivoSistema = valoresSistema[metodo] + totalMovimientosCaja;
      return valoresCaja[metodo] - efectivoSistema;
    }
    return valoresCaja[metodo] - valoresSistema[metodo];
  };
  
  const totalMovimientosCaja = movimientosCaja.reduce((sum, mov) => sum + mov.monto, 0);
  const totalSistema = Object.values(valoresSistema).reduce((sum, val) => sum + val, 0) + totalMovimientosCaja;
  const totalCaja = Object.values(valoresCaja).reduce((sum, val) => sum + val, 0);
  const totalDiferencia = totalCaja - totalSistema;
  
  return (
    <Container fluid>
      {/* Tabla de arqueo */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Medio de Pago</th>
            <th>Sistema</th>
            <th>Saldo En Caja</th>
            <th>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {mediosPago.map((medio) => {
            const diferencia = calcularDiferencia(medio.key);
            const valorSistema = valoresSistema[medio.key];
            const valorCaja = valoresCaja[medio.key];
            
            return (
              <tr key={medio.key}>
                <td>{medio.label}</td>
                <td className="text-end">
                  {medio.key === 'efectivo' ? (
                    <div>
                      <span>{formatCurrency(valorSistema)}</span>
                      {totalMovimientosCaja !== 0 && (
                        <>
                          <br />
                          <small className={`text-${totalMovimientosCaja > 0 ? 'success' : 'danger'}`}>
                            {totalMovimientosCaja > 0 ? '+' : ''}{formatCurrency(totalMovimientosCaja)} mov.
                          </small>
                          <br />
                          <small className="text-muted">
                            = {formatCurrency(valorSistema + totalMovimientosCaja)}
                          </small>
                        </>
                      )}
                    </div>
                  ) : (
                    <span>{formatCurrency(valorSistema)}</span>
                  )}
                </td>
                <td className="text-center">
                  <Form.Control
                    type="number"
                    value={valorCaja}
                    onChange={(e) => handleInputChange(medio.key, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="text-end"
                  />
                </td>
                <td className="text-end">
                  <span className={
                    diferencia < 0 ? 'text-danger' : 
                    diferencia > 0 ? 'text-success' : 'text-secondary'
                  }>
                    {formatCurrency(diferencia)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="table-warning">
            <td className="fw-bold">Totales:</td>
            <td className="text-end fw-bold">{formatCurrency(totalSistema)}</td>
            <td className="text-end fw-bold">{formatCurrency(totalCaja)}</td>
            <td className="text-end fw-bold">
              <span className={
                totalDiferencia < 0 ? 'text-danger' : 
                totalDiferencia > 0 ? 'text-success' : 'text-secondary'
              }>
                {formatCurrency(totalDiferencia)}
              </span>
            </td>
          </tr>
        </tfoot>
      </Table>
    </Container>
  );
};
```

**3. Movimientos de Caja**
```javascript
// CajaScreen.jsx - Gestión de movimientos de caja
const handleAgregarMovimiento = () => {
  if (!montoMovimiento || !conceptoMovimiento) {
    alert('⚠️ Debe ingresar monto y concepto del movimiento');
    return;
  }
  
  const monto = parseFloat(montoMovimiento);
  if (isNaN(monto) || monto <= 0) {
    alert('⚠️ El monto debe ser un número válido mayor a 0');
    return;
  }
  
  const nuevoMovimiento = {
    id: Date.now(),
    tipo: tipoMovimiento,
    monto: tipoMovimiento === 'EGRESO' ? -monto : monto,
    concepto: conceptoMovimiento,
    fecha: new Date().toISOString(),
    hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    cajero: cajero
  };
  
  setMovimientosCaja(prev => [...prev, nuevoMovimiento]);
  
  // Limpiar formulario
  setMontoMovimiento('');
  setConceptoMovimiento('');
  
  alert(`✅ ${tipoMovimiento} de ${formatCurrency(monto)} registrado exitosamente`);
};

// Modal de movimientos de caja
<Modal show={showMovimientosBancarios} onHide={() => setShowMovimientosBancarios(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>
      <i className="bi bi-arrow-left-right me-2"></i>
      Movimientos de Caja - {getFechaLocal().split('-').reverse().join('/')}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {/* Formulario para agregar movimiento */}
    <Card className="mb-4">
      <Card.Header className="bg-primary text-white">
        <h6 className="mb-0">Agregar Nuevo Movimiento</h6>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Tipo</Form.Label>
              <Form.Select 
                value={tipoMovimiento} 
                onChange={(e) => setTipoMovimiento(e.target.value)}
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Monto</Form.Label>
              <Form.Control
                type="number"
                placeholder="0.00"
                value={montoMovimiento}
                onChange={(e) => setMontoMovimiento(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Concepto</Form.Label>
              <Form.Control
                type="text"
                placeholder="Descripción del movimiento"
                value={conceptoMovimiento}
                onChange={(e) => setConceptoMovimiento(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Button 
              variant="success" 
              onClick={handleAgregarMovimiento}
              disabled={!montoMovimiento || !conceptoMovimiento}
            >
              Agregar
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
    
    {/* Tabla de movimientos */}
    <Table striped bordered hover size="sm">
      <thead>
        <tr>
          <th>Hora</th>
          <th>Tipo</th>
          <th>Concepto</th>
          <th>Monto</th>
          <th>Saldo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {movimientosCaja.map((movimiento, index) => {
          const saldoAcumulado = movimientosCaja
            .slice(0, index + 1)
            .reduce((sum, mov) => sum + mov.monto, 0);
          
          return (
            <tr key={movimiento.id}>
              <td>{movimiento.hora}</td>
              <td>
                <Badge bg={movimiento.tipo === 'INGRESO' ? 'success' : 'danger'}>
                  {movimiento.tipo}
                </Badge>
              </td>
              <td>{movimiento.concepto}</td>
              <td className={`text-end ${movimiento.monto > 0 ? 'text-success' : 'text-danger'}`}>
                {movimiento.monto > 0 ? '+' : ''}{formatCurrency(Math.abs(movimiento.monto))}
              </td>
              <td className="text-end fw-bold">
                {formatCurrency(saldoAcumulado)}
              </td>
              <td>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => eliminarMovimiento(movimiento.id)}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  </Modal.Body>
</Modal>
```

**4. Validaciones de Caja**
```javascript
// CajaValidaciones.jsx - Validaciones automáticas
export const cajaValidaciones = {
  validarValoresCaja: (valoresCaja, valoresSistema) => {
    const diferencias = {};
    let totalDiferencia = 0;
    let alertas = [];
    
    Object.keys(valoresCaja).forEach(metodo => {
      const diferencia = valoresCaja[metodo] - valoresSistema[metodo];
      diferencias[metodo] = diferencia;
      totalDiferencia += diferencia;
      
      // Alertas por diferencias significativas
      if (Math.abs(diferencia) > 1000) {
        alertas.push({
          tipo: 'warning',
          metodo: metodo,
          diferencia: diferencia,
          mensaje: `Diferencia significativa en ${metodo}: ${formatCurrency(diferencia)}`
        });
      }
    });
    
    // Validación general
    let esValido = true;
    let mensaje = '';
    let tipo = 'success';
    
    if (Math.abs(totalDiferencia) > 5000) {
      esValido = false;
      tipo = 'danger';
      mensaje = `⚠️ Diferencia total muy alta: ${formatCurrency(totalDiferencia)}`;
    } else if (Math.abs(totalDiferencia) > 1000) {
      tipo = 'warning';
      mensaje = `⚠️ Diferencia moderada: ${formatCurrency(totalDiferencia)}`;
    } else {
      mensaje = `✅ Arqueo balanceado: ${formatCurrency(totalDiferencia)}`;
    }
    
    return {
      esValido,
      mensaje,
      tipo,
      diferencias,
      totalDiferencia,
      alertas
    };
  },
  
  generarRecomendaciones: (valoresCaja, valoresSistema, diferencias) => {
    const recomendaciones = [];
    
    Object.entries(diferencias).forEach(([metodo, diferencia]) => {
      if (diferencia > 0) {
        recomendaciones.push({
          tipo: 'sobrante',
          metodo: metodo,
          monto: diferencia,
          accion: `Verificar si hay dinero adicional en ${metodo}`
        });
      } else if (diferencia < 0) {
        recomendaciones.push({
          tipo: 'faltante',
          metodo: metodo,
          monto: Math.abs(diferencia),
          accion: `Revisar transacciones de ${metodo} del día`
        });
      }
    });
    
    return recomendaciones;
  }
};
```

### 🔧 Backend APIs

#### Modelos de Caja
```python
# api/models.py
class Sucursal(models.Model):
    nombre = models.CharField(max_length=100)
    direccion = models.TextField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    activo = models.BooleanField(default=True)

class Cajero(models.Model):
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10, unique=True)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)

class Turno(models.Model):
    cajero = models.ForeignKey(Cajero, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField(default=timezone.now)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    saldo_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    saldo_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    activo = models.BooleanField(default=True)

class ArqueoCaja(models.Model):
    cajero = models.CharField(max_length=100)
    fecha = models.DateField()
    banco = models.CharField(max_length=100, default='Caja General')
    
    # Valores del sistema
    efectivo_sistema = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tarjetas_sistema = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transferencia_sistema = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Valores físicos en caja
    efectivo_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tarjetas_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transferencia_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Totales y diferencias
    total_sistema = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_diferencia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Movimientos de caja
    movimientos_caja = models.JSONField(default=list, blank=True)
    total_movimientos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
```

#### APIs REST
```python
# api/views.py
class CajeroViewSet(viewsets.ModelViewSet):
    queryset = Cajero.objects.all()
    serializer_class = CajeroSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        codigo = request.data.get('codigo')
        
        try:
            cajero = Cajero.objects.get(codigo=codigo, activo=True)
            serializer = self.get_serializer(cajero)
            return Response(serializer.data)
        except Cajero.DoesNotExist:
            return Response({'error': 'Código de cajero inválido'}, status=400)

class TurnoViewSet(viewsets.ModelViewSet):
    queryset = Turno.objects.all()
    serializer_class = TurnoSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def crear_turno(self, request):
        cajero_id = request.data.get('cajero_id')
        saldo_inicial = request.data.get('saldo_inicial', 0)
        
        # Cerrar turno anterior si existe
        Turno.objects.filter(cajero_id=cajero_id, activo=True).update(
            activo=False,
            fecha_fin=timezone.now()
        )
        
        # Crear nuevo turno
        turno = Turno.objects.create(
            cajero_id=cajero_id,
            saldo_inicial=saldo_inicial
        )
        
        serializer = self.get_serializer(turno)
        return Response(serializer.data)

class ArqueoCajaViewSet(viewsets.ModelViewSet):
    queryset = ArqueoCaja.objects.all()
    serializer_class = ArqueoCajaSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        data = request.data
        
        # Calcular totales automáticamente
        total_sistema = (
            float(data.get('efectivo_sistema', 0)) +
            float(data.get('tarjetas_sistema', 0)) +
            float(data.get('transferencia_sistema', 0))
        )
        
---ta
 direcióno hay conex*: Nrio*ta- **Inven
ara análisis p de arqueoses**: Datosportnos
- **Re de tury gestiónación *: Autenticos**Cajer- *tema
es del sis para valorventasos de Obtiene dat**: POS- **

s Módulos Otroconones  🔗 Conexi

###`primir
`` Ime → PDF →obanterar ComprQL
7. Gen → PostgreSCajaService→ Arqueoar Arqueo rd
6. Guatossta Movimien Li →os → Modalovimientr MgaAgres
5. ar Resultadoión → Mostrunc→ FDiferencias Calcular Caja
4. Estado s → ut→ Inp Físicos sar Valoresre. Inga
3 Sistem Valoresce →rviaSes → Ventnta Ve
2. Cargarear Turnot → CrajeroContexjero → Cogin Ca
1. L`s Caja

``Dato de 
### 🔄 Flujo``

}
` #dc3545;olor:eft-c  border-lo {
gresovimiento-e;
}

.ma745: #28left-color  border-o {
-ingresento
.movimi007bff;
}
id #ft: 4px sol-le  border: 10px 0;
rgin;
  mang: 15pxpx;
  paddidius: 6rder-rae;
  bond: whit backgrou-item {
 .movimiento

;
} 15px 0
  margin:20px;: adding
  pdius: 8px;border-raf8f9fa;
  : #ckground{
  bar os-containent
.movimie
}
;123,255,.25)2rem rgba(0,ow: 0 0 0 0. box-shad
 7bff; #00-color:border {
  :focust-pageja-inpuca
}

.nter;-align: ce;
  textight: boldfont-we: 6px;
  iusadder-r boref;
  #e9ecx solider: 2p
  borde {-input-pagja

.ca
}ht: bold;font-weig
  !important;6c757d 
  color: #o {rencia-cer

.dife bold;
}font-weight:tant;
   !impor45lor: #dc35  coativa {
a-negerenci

.difd;
}eight: bolt-w
  fonimportant;a745 !lor: #28 cositiva {
 rencia-po

.diferem;
}e: 0.9t-siz
  fon7d;r: #6c75lol {
  coabe

.stat-l
}px;: 5gin-bottomold;
  marght: b-wei;
  font1.8rem font-size: 
 t-value {;
}

.sta,0,0,0.1)rgba(02px 10px adow: 0 ox-sh white;
  bbackground:: 8px;
  rder-radius
  bo0px;ng: 2
  paddi;n: center
  text-aligtat-card {.s.1);
}

0,0rgba(0,0, 15px : 0 4pxdow box-sha 0;
  20pxin:marg: 25px;
  dding 10px;
  paradius: border-e;
 ground: whit {
  backqueo-cardh;
}

.art: 100vmin-heighf8f9fa;
  : #ground0px;
  back padding: 2ainer {
 ntaja-con.css */
.cjaScreeyles/Ca/stntend/srcss
/* fro
```cSS
os C### 🎨 Estil)
```

=400s, statusor.errializerResponse(ser   return  
     
       =201)usata, statrializer.dponse(se Res   return  )
       save(ializer. ser   :
        _valid()ializer.isif ser)
        tadata=darializer(t_self.gealizer = seri   se           
  })
     
   ncial_diferea': tota_diferenci     'total,
       jaa': total_ca'total_caj       tema,
     isotal_s': ttal_sistema       'tote({
        data.updalados
     les calcuta to # Agregar             
 istema
  - total_sl_cajataia = toerenctal_difto          
           )
 ja', 0))
  erencia_cansfta.get('tra(da      float
      aja', 0)) +jetas_ctart(data.get('        floa) +
    ja', 0)ctivo_ca.get('efeat(data      flo
      al_caja = (
        tot## BACKEN
D DJANGO

### 🏗️ Configuración Principal

#### settings.py - Configuración del Proyecto
```python
# backend_crm/settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',      # API REST
    'corsheaders',         # CORS para React
    'api',                 # Aplicación principal
]

# Base de datos PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'fabrica',
        'USER': 'postgres',
        'PASSWORD': '12345',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# CORS para React
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React en desarrollo
]

# Configuración de archivos multimedia
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### 📊 Modelos de Base de Datos

#### Modelos Principales
```python
# api/models.py

# ===== PRODUCTOS E INVENTARIO =====
class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.nombre

class Producto(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock_total = models.IntegerField(default=0)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    codigo_barras = models.CharField(max_length=100, blank=True, null=True)
    marca = models.CharField(max_length=100, default="GENERICA")
    impuesto = models.CharField(max_length=20, default="IVA(0%)")
    fecha_creacion = models.DateTimeField(default=timezone.now)
    activo = models.BooleanField(default=True)

class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
    ]
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField(default=timezone.now)
    usuario = models.CharField(max_length=100)
    nota = models.TextField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        # Actualizar stock automáticamente
        if self.tipo == 'ENTRADA':
            self.producto.stock_total += self.cantidad
        elif self.tipo == 'SALIDA':
            self.producto.stock_total -= self.cantidad
        elif self.tipo == 'AJUSTE':
            self.producto.stock_total += self.cantidad
            
        self.producto.save()
        super().save(*args, **kwargs)

# ===== VENTAS Y POS =====
class Venta(models.Model):
    ESTADO_CHOICES = [
        ('PAGADO', 'Pagado'),
        ('PENDIENTE', 'Pendiente'),
        ('ANULADA', 'Anulada'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('T_CREDITO', 'T. Crédito'),
        ('QR', 'Qr'),
        ('TRANSF', 'Transf'),
        ('RAPPIPAY', 'RAPPIPAY'),
        ('BONOS', 'Bonos'),
    ]
    
    numero_factura = models.CharField(max_length=50, unique=True, blank=True)
    fecha = models.DateTimeField(default=timezone.now)
    vendedor = models.CharField(max_length=100, default='Sistema')
    cliente = models.CharField(max_length=255, default='CONSUMIDOR FINAL')
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    impuestos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dinero_entregado = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    devuelta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PAGADO')
    nota = models.TextField(blank=True, null=True)

class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    producto_nombre = models.CharField(max_length=255)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

# ===== CARGUE OPERATIVO (ID1-ID6) =====
class CargueID1(models.Model):
    DIAS_CHOICES = [
        ('LUNES', 'LUNES'), ('MARTES', 'MARTES'),
        ('MIERCOLES', 'MIERCOLES'), ('JUEVES', 'JUEVES'),
        ('VIERNES', 'VIERNES'), ('SABADO', 'SABADO'),
        ('DOMINGO', 'DOMINGO')
    ]
    
    CUMPLIMIENTO_CHOICES = [
        ('SI', 'SI'),
        ('NO', 'NO'),
    ]
    
    # Identificación
    dia = models.CharField(max_length=10, choices=DIAS_CHOICES)
    fecha = models.DateField()
    responsable = models.CharField(max_length=100, blank=True)
    
    # Checkboxes
    v = models.BooleanField(default=False)  # vendedor
    d = models.BooleanField(default=False)  # despachador
    
    # Productos
    producto = models.CharField(max_length=255, blank=True)
    cantidad = models.IntegerField(default=0)
    dctos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    lotes_vencidos = models.TextField(blank=True)  # JSON
    total = models.IntegerField(default=0)  # Calculado
    valor = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto = models.DecimalField(max_digits=12, decimal_places=2, default=0)  # Calculado
    
    # Pagos
    concepto = models.CharField(max_length=255, blank=True)
    descuentos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    nequi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    daviplata = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Resumen
    base_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_despacho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_pedidos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_dctos = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_efectivo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Control de cumplimiento
    licencia_transporte = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    soat = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    uniforme = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    no_locion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    no_accesorios = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    capacitacion_carnet = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    higiene = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    estibas = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    desinfeccion = models.CharField(max_length=2, choices=CUMPLIMIENTO_CHOICES, blank=True)
    
    # Metadatos
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # Cálculos automáticos
        self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vencidas
        self.neto = self.total * self.valor
        super().save(*args, **kwargs)

# Similar para CargueID2, CargueID3, CargueID4, CargueID5, CargueID6

# ===== PRODUCCIÓN =====
class Produccion(models.Model):
    fecha = models.DateField(default=timezone.now)
    producto = models.CharField(max_length=255)
    cantidad = models.IntegerField(default=0)
    lote = models.CharField(max_length=100, blank=True)
    
    # Función de congelado
    congelado = models.BooleanField(default=False)
    fecha_congelado = models.DateTimeField(blank=True, null=True)
    usuario_congelado = models.CharField(max_length=100, blank=True)
    
    usuario = models.CharField(max_length=100, default='Sistema')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    
    def congelar(self, usuario):
        self.congelado = True
        self.fecha_congelado = timezone.now()
        self.usuario_congelado = usuario
        self.save()
    
    def descongelar(self, usuario):
        self.congelado = False
        self.fecha_congelado = None
        self.usuario_congelado = ''
        self.save()

# ===== SISTEMA DE CAJA =====
class Sucursal(models.Model):
    nombre = models.CharField(max_length=100)
    direccion = models.TextField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    activo = models.BooleanField(default=True)

class Cajero(models.Model):
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=10, unique=True)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)

class Turno(models.Model):
    cajero = models.ForeignKey(Cajero, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField(default=timezone.now)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    saldo_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    saldo_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    activo = models.BooleanField(default=True)

class ArqueoCaja(models.Model):
    cajero = models.CharField(max_length=100)
    fecha = models.DateField()
    banco = models.CharField(max_length=100, default='Caja General')
    
    # Valores del sistema
    efectivo_sistema = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tarjetas_sistema = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Valores físicos
    efectivo_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tarjetas_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Totales
    total_sistema = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_caja = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_diferencia = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
```

### 🔌 APIs REST (ViewSets)

#### ViewSets Principales
```python
# api/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=True, methods=['post'])
    def actualizar_stock(self, request, pk=None):
        try:
            producto = self.get_object()
            cantidad = int(request.data.get('cantidad', 0))
            usuario = request.data.get('usuario', 'Sistema')
            nota = request.data.get('nota', '')
            
            # Crear movimiento de inventario
            MovimientoInventario.objects.create(
                producto=producto,
                tipo='AJUSTE',
                cantidad=cantidad,
                usuario=usuario,
                nota=nota
            )
            
            return Response({
                'success': True,
                'nuevo_stock': producto.stock_total,
                'message': f'Stock actualizado. Nuevo stock: {producto.stock_total}'
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Generar número de factura automático
        ultimo_numero = Venta.objects.count() + 1
        request.data['numero_factura'] = f"FAC-{ultimo_numero:06d}"
        
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == 201:
            venta = Venta.objects.get(id=response.data['id'])
            
            # Crear detalles de venta
            detalles = request.data.get('detalles', [])
            for detalle in detalles:
                DetalleVenta.objects.create(
                    venta=venta,
                    producto_id=detalle['producto_id'],
                    producto_nombre=detalle['producto_nombre'],
                    cantidad=detalle['cantidad'],
                    precio_unitario=detalle['precio_unitario'],
                    subtotal=detalle['subtotal']
                )
                
                # Actualizar stock automáticamente
                try:
                    producto = Producto.objects.get(id=detalle['producto_id'])
                    MovimientoInventario.objects.create(
                        producto=producto,
                        tipo='SALIDA',
                        cantidad=detalle['cantidad'],
                        usuario=request.data.get('vendedor', 'Sistema'),
                        nota=f"Venta {venta.numero_factura}"
                    )
                except Producto.DoesNotExist:
                    pass
        
        return response
    
    @action(detail=True, methods=['patch'])
    def anular_venta(self, request, pk=None):
        venta = self.get_object()
        
        if venta.estado == 'ANULADA':
            return Response({'error': 'La venta ya está anulada'})
        
        # Cambiar estado
        venta.estado = 'ANULADA'
        venta.save()
        
        # Devolver productos al inventario
        for detalle in venta.detalles.all():
            MovimientoInventario.objects.create(
                producto=detalle.producto,
                tipo='ENTRADA',
                cantidad=detalle.cantidad,
                usuario='Sistema',
                nota=f"Devolución por anulación {venta.numero_factura}"
            )
        
        return Response({'success': True, 'message': 'Venta anulada exitosamente'})

class CargueID1ViewSet(viewsets.ModelViewSet):
    queryset = CargueID1.objects.all()
    serializer_class = CargueID1Serializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = CargueID1.objects.all().order_by('-fecha', '-fecha_actualizacion')
        
        # Filtros opcionales
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        
        if dia:
            queryset = queryset.filter(dia=dia.upper())
        if fecha:
            queryset = queryset.filter(fecha=fecha)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        data = request.data
        
        # Procesar datos completos del cargue
        productos = data.get('productos', [])
        
        for producto_data in productos:
            # Crear registro por cada producto
            cargue_data = {
                'dia': data.get('dia_semana'),
                'fecha': data.get('fecha'),
                'responsable': data.get('responsable'),
                'v': data.get('v', False),
                'd': data.get('d', False),
                
                # Datos del producto
                'producto': producto_data.get('nombre'),
                'cantidad': producto_data.get('cantidad', 0),
                'dctos': producto_data.get('dctos', 0),
                'adicional': producto_data.get('adicional', 0),
                'devoluciones': producto_data.get('devoluciones', 0),
                'vencidas': producto_data.get('vencidas', 0),
                'valor': producto_data.get('valor', 0),
                
                # Datos de pagos
                'concepto': data.get('pagos', {}).get('concepto', ''),
                'descuentos': data.get('pagos', {}).get('descuentos', 0),
                'nequi': data.get('pagos', {}).get('nequi', 0),
                'daviplata': data.get('pagos', {}).get('daviplata', 0),
                
                # Datos de resumen
                'base_caja': data.get('resumen', {}).get('base_caja', 0),
                'total_despacho': data.get('resumen', {}).get('total_despacho', 0),
                'venta': data.get('resumen', {}).get('venta', 0),
                'total_efectivo': data.get('resumen', {}).get('total_efectivo', 0),
                
                # Control de cumplimiento
                **data.get('cumplimiento', {})
            }
            
            serializer = self.get_serializer(data=cargue_data)
            if serializer.is_valid():
                serializer.save()
        
        return Response({'success': True, 'message': 'Cargue guardado exitosamente'})

# Similar para CargueID2, CargueID3, CargueID4, CargueID5, CargueID6

class CajeroViewSet(viewsets.ModelViewSet):
    queryset = Cajero.objects.all()
    serializer_class = CajeroSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        codigo = request.data.get('codigo')
        
        try:
            cajero = Cajero.objects.get(codigo=codigo, activo=True)
            serializer = self.get_serializer(cajero)
            return Response(serializer.data)
        except Cajero.DoesNotExist:
            return Response({'error': 'Código de cajero inválido'}, status=400)
```

### 🛣️ URLs y Routing

```python
# api/urls.py
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

# APIs principales
router.register(r'productos', ProductoViewSet, basename='producto')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'movimientos', MovimientoInventarioViewSet, basename='movimiento')
router.register(r'ventas', VentaViewSet, basename='venta')
router.register(r'detalle-ventas', DetalleVentaViewSet, basename='detalle-venta')

# APIs de cargue (ID1-ID6)
router.register(r'cargue-id1', CargueID1ViewSet, basename='cargue-id1')
router.register(r'cargue-id2', CargueID2ViewSet, basename='cargue-id2')
router.register(r'cargue-id3', CargueID3ViewSet, basename='cargue-id3')
router.register(r'cargue-id4', CargueID4ViewSet, basename='cargue-id4')
router.register(r'cargue-id5', CargueID5ViewSet, basename='cargue-id5')
router.register(r'cargue-id6', CargueID6ViewSet, basename='cargue-id6')

# APIs de producción
router.register(r'produccion', ProduccionViewSet, basename='produccion')

# APIs de caja
router.register(r'cajeros', CajeroViewSet, basename='cajero')
router.register(r'turnos', TurnoViewSet, basename='turno')
router.register(r'arqueo-caja', ArqueoCajaViewSet, basename='arqueo-caja')

urlpatterns = router.urls
```

---#
# FRONTEND REACT

### ⚛️ Estructura de Componentes

#### Arquitectura General
```
frontend/src/
├── components/           # Componentes reutilizables
│   ├── Pos/             # Componentes del POS
│   ├── Cargue/          # Componentes del Cargue
│   ├── inventario/      # Componentes de Inventario
│   ├── common/          # Componentes comunes
│   └── modals/          # Modales del sistema
├── pages/               # Páginas principales
├── context/             # Context API para estado global
├── services/            # Servicios de API
├── styles/              # Estilos CSS
├── utils/               # Utilidades y helpers
└── hooks/               # Custom hooks
```

### 🎯 Context API - Gestión de Estado

#### ProductContext - Estado Global de Productos
```javascript
// context/ProductContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { productoService } from '../services/api';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar productos desde API
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productoService.getAll();
      if (data && !data.error) {
        setProducts(data);
        
        // Guardar en localStorage para cache
        localStorage.setItem('productos_cache', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError(error.message);
      
      // Cargar desde cache si hay error
      const cache = localStorage.getItem('productos_cache');
      if (cache) {
        setProducts(JSON.parse(cache));
      }
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto
  const addProduct = async (productData) => {
    try {
      const newProduct = await productoService.create(productData);
      if (newProduct && !newProduct.error) {
        setProducts(prev => [...prev, newProduct]);
        return { success: true, product: newProduct };
      }
      return { success: false, error: newProduct.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Actualizar producto
  const updateProduct = async (id, productData) => {
    try {
      const updatedProduct = await productoService.update(id, productData);
      if (updatedProduct && !updatedProduct.error) {
        setProducts(prev => 
          prev.map(p => p.id === id ? updatedProduct : p)
        );
        return { success: true, product: updatedProduct };
      }
      return { success: false, error: updatedProduct.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Actualizar stock
  const updateStock = async (id, cantidad, usuario, nota) => {
    try {
      const result = await productoService.updateStock(id, cantidad, usuario, nota);
      if (result && result.success) {
        setProducts(prev => 
          prev.map(p => 
            p.id === id 
              ? { ...p, stock_total: result.nuevo_stock }
              : p
          )
        );
        return result;
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Sincronización automática
  useEffect(() => {
    loadProducts();
    
    // Sincronizar cada 5 minutos
    const interval = setInterval(loadProducts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    products,
    categories,
    loading,
    error,
    loadProducts,
    addProduct,
    updateProduct,
    updateStock
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de ProductProvider');
  }
  return context;
};
```

#### CajeroContext - Gestión de Cajeros
```javascript
// context/CajeroContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { cajeroService } from '../services/cajeroService';

const CajeroContext = createContext();

export const CajeroProvider = ({ children }) => {
  const [cajeroLogueado, setCajeroLogueado] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [turnoActual, setTurnoActual] = useState(null);

  // Inicializar desde localStorage
  useEffect(() => {
    const cajeroGuardado = localStorage.getItem('cajero_logueado');
    const turnoGuardado = localStorage.getItem('turno_actual');
    
    if (cajeroGuardado && turnoGuardado) {
      setCajeroLogueado(JSON.parse(cajeroGuardado));
      setTurnoActual(JSON.parse(turnoGuardado));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (codigo, saldoInicial) => {
    try {
      const cajero = await cajeroService.login(codigo);
      
      if (cajero && !cajero.error) {
        setCajeroLogueado(cajero);
        setIsAuthenticated(true);
        
        // Crear turno
        const turno = await cajeroService.crearTurno(cajero.id, saldoInicial);
        if (turno && !turno.error) {
          setTurnoActual(turno);
          
          // Guardar en localStorage
          localStorage.setItem('cajero_logueado', JSON.stringify(cajero));
          localStorage.setItem('turno_actual', JSON.stringify(turno));
          
          return { success: true, cajero, turno };
        }
      }
      
      return { success: false, message: 'Código inválido' };
    } catch (error) {
      return { success: false, message: 'Error de conexión' };
    }
  };

  const logout = async () => {
    if (turnoActual) {
      await cajeroService.cerrarTurno(turnoActual.id);
    }
    
    setCajeroLogueado(null);
    setIsAuthenticated(false);
    setTurnoActual(null);
    
    localStorage.removeItem('cajero_logueado');
    localStorage.removeItem('turno_actual');
  };

  const getSaldoInicialTurno = () => {
    return turnoActual ? parseFloat(turnoActual.saldo_inicial) : 0;
  };

  const getTopbarInfo = () => {
    return {
      cajero: cajeroLogueado?.nombre || 'Sin cajero',
      sucursal: cajeroLogueado?.sucursal?.nombre || 'Sin sucursal',
      turno: turnoActual?.id || null
    };
  };

  return (
    <CajeroContext.Provider value={{
      cajeroLogueado,
      isAuthenticated,
      turnoActual,
      login,
      logout,
      getSaldoInicialTurno,
      getTopbarInfo
    }}>
      {children}
    </CajeroContext.Provider>
  );
};

export const useCajero = () => {
  const context = useContext(CajeroContext);
  if (!context) {
    throw new Error('useCajero debe usarse dentro de CajeroProvider');
  }
  return context;
};
```

### 🔧 Servicios de API

#### Servicio Principal de API
```javascript
// services/api.js
const API_URL = 'http://localhost:8000/api';

// Función helper para requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { error: error.message };
  }
};

// Servicio de productos
export const productoService = {
  getAll: async () => {
    return await apiRequest('/productos/');
  },

  getById: async (id) => {
    return await apiRequest(`/productos/${id}/`);
  },

  create: async (productData) => {
    // Manejar imágenes base64
    if (productData.imagen && productData.imagen.startsWith('data:')) {
      const formData = new FormData();
      
      // Convertir base64 a File
      const response = await fetch(productData.imagen);
      const blob = await response.blob();
      const file = new File([blob], 'producto.jpg', { type: 'image/jpeg' });
      
      formData.append('imagen', file);
      Object.keys(productData).forEach(key => {
        if (key !== 'imagen') {
          formData.append(key, productData[key]);
        }
      });

      return await fetch(`${API_URL}/productos/`, {
        method: 'POST',
        body: formData
      }).then(res => res.json());
    }

    return await apiRequest('/productos/', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  update: async (id, productData) => {
    return await apiRequest(`/productos/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  delete: async (id) => {
    return await apiRequest(`/productos/${id}/`, {
      method: 'DELETE'
    });
  },

  updateStock: async (id, cantidad, usuario, nota) => {
    return await apiRequest(`/productos/${id}/actualizar_stock/`, {
      method: 'POST',
      body: JSON.stringify({
        cantidad: cantidad,
        usuario: usuario,
        nota: nota
      })
    });
  }
};

// Servicio de ventas
export const ventaService = {
  getAll: async () => {
    return await apiRequest('/ventas/');
  },

  getById: async (id) => {
    return await apiRequest(`/ventas/${id}/`);
  },

  create: async (ventaData) => {
    return await apiRequest('/ventas/', {
      method: 'POST',
      body: JSON.stringify(ventaData)
    });
  },

  anularVenta: async (id) => {
    return await apiRequest(`/ventas/${id}/anular_venta/`, {
      method: 'PATCH'
    });
  }
};

// Servicio de categorías
export const categoriaService = {
  getAll: async () => {
    return await apiRequest('/categorias/');
  },

  create: async (categoriaData) => {
    return await apiRequest('/categorias/', {
      method: 'POST',
      body: JSON.stringify(categoriaData)
    });
  }
};
```

#### Servicio de Cargue
```javascript
// services/cargueService.js
import { apiRequest } from './api';

export const cargueService = {
  // Mapeo de IDs a endpoints
  getEndpoint: (vendedorId) => {
    const endpoints = {
      'ID1': '/cargue-id1/',
      'ID2': '/cargue-id2/',
      'ID3': '/cargue-id3/',
      'ID4': '/cargue-id4/',
      'ID5': '/cargue-id5/',
      'ID6': '/cargue-id6/'
    };
    return endpoints[vendedorId];
  },

  // Obtener datos de cargue por vendedor
  getCargueByVendedor: async (vendedorId, fecha = null, dia = null) => {
    const endpoint = cargueService.getEndpoint(vendedorId);
    if (!endpoint) return { error: 'Vendedor no válido' };

    let url = endpoint;
    const params = new URLSearchParams();
    
    if (fecha) params.append('fecha', fecha);
    if (dia) params.append('dia', dia);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return await apiRequest(url);
  },

  // Guardar cargue completo
  guardarCargueCompleto: async (vendedorId, datosCompletos) => {
    const endpoint = cargueService.getEndpoint(vendedorId);
    if (!endpoint) return { error: 'Vendedor no válido' };

    try {
      console.log('🚀 Enviando datos completos a:', endpoint);
      console.log('📦 Datos:', datosCompletos);

      const resultado = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(datosCompletos)
      });

      if (resultado && !resultado.error) {
        console.log('✅ Cargue guardado exitosamente');
        return { success: true, data: resultado };
      } else {
        console.error('❌ Error guardando cargue:', resultado);
        return { success: false, error: resultado.error };
      }
    } catch (error) {
      console.error('❌ Error en guardarCargueCompleto:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener resumen por vendedor
  getResumenVendedor: async (vendedorId, fechaInicio, fechaFin) => {
    const endpoint = cargueService.getEndpoint(vendedorId);
    if (!endpoint) return { error: 'Vendedor no válido' };

    const params = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });

    return await apiRequest(`${endpoint}?${params.toString()}`);
  }
};
```

### 🎨 Componentes Principales

#### MainMenu - Menú Principal
```javascript
// pages/MainMenu.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import '../styles/MainMenu.css';

export default function MainMenu() {
  const navigate = useNavigate();

  const menuItems = [
    {
      path: "/pos",
      icon: "bi bi-cart",
      title: "Punto de Venta (POS)",
      description: "Gestiona ventas y facturación en tiempo real.",
      color: "#007bff"
    },
    {
      path: "/inventario",
      icon: "bi bi-box",
      title: "Inventario",
      description: "Controla el stock y los movimientos de productos.",
      color: "#28a745"
    },
    {
      path: "/cargue",
      icon: "bi bi-people",
      title: "Cargue",
      description: "Registra la producción y devoluciones de los vendedores.",
      color: "#ffc107"
    },
    {
      path: "/pedidos",
      icon: "bi bi-file-text",
      title: "Remisiones",
      description: "Crea y administra las guías de remisión.",
      color: "#dc3545"
    },
    {
      path: "/caja",
      icon: "bi bi-calculator",
      title: "Caja",
      description: "Arqueo de caja y control de movimientos.",
      color: "#6f42c1"
    },
    {
      path: "/reportes",
      icon: "bi bi-graph-up",
      title: "Reportes",
      description: "Análisis y reportes de ventas.",
      color: "#fd7e14"
    }
  ];

  return (
    <div className="main-menu">
      <div className="menu-header">
        <h1>Sistema CRM Fábrica de Arepas</h1>
        <p>Selecciona un módulo para comenzar</p>
      </div>
      
      <div className="menu-grid">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => navigate(item.path)} 
            className="menu-card"
            style={{ '--card-color': item.color }}
          >
            <div className="card-icon">
              <i className={item.icon}></i>
            </div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Routing Principal
```javascript
// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import { CajeroProvider } from './context/CajeroContext';

// Páginas
import MainMenu from './pages/MainMenu';
import PosScreen from './pages/PosScreen';
import InventarioScreen from './pages/InventarioScreen';
import CajaScreen from './pages/CajaScreen';
import SelectorDia from './pages/SelectorDia';
import MenuSheets from './components/Cargue/MenuSheets';

function App() {
  return (
    <ProductProvider>
      <CajeroProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<MainMenu />} />
              <Route path="/pos" element={<PosScreen />} />
              <Route path="/inventario" element={<InventarioScreen />} />
              <Route path="/caja" element={<CajaScreen />} />
              <Route path="/cargue" element={<SelectorDia />} />
              <Route path="/cargue/:dia" element={<MenuSheets />} />
              {/* Más rutas... */}
            </Routes>
          </div>
        </Router>
      </CajeroProvider>
    </ProductProvider>
  );
}

export default App;
```

### 🔄 Hooks Personalizados

#### useLocalStorage - Persistencia Local
```javascript
// hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Obtener valor inicial del localStorage
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor
  const setValue = (value) => {
    try {
      // Permitir que value sea una función para la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Disparar evento personalizado para sincronización
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key, newValue: valueToStore }
      }));
      
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Escuchar cambios en localStorage desde otros componentes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.newValue);
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
};
```

#### useApi - Manejo de APIs
```javascript
// hooks/useApi.js
import { useState, useEffect } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction();
      
      if (result && !result.error) {
        setData(result);
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};
```

### 📱 Responsive Design

#### Breakpoints y Media Queries
```css
/* styles/responsive.css */
:root {
  --breakpoint-xs: 576px;
  --breakpoint-sm: 768px;
  --breakpoint-md: 992px;
  --breakpoint-lg: 1200px;
  --breakpoint-xl: 1400px;
}

/* Mobile First Approach */
.container-responsive {
  padding: 10px;
}

@media (min-width: 768px) {
  .container-responsive {
    padding: 20px;
  }
}

@media (min-width: 992px) {
  .container-responsive {
    padding: 30px;
  }
}

/* Grid responsivo para menú principal */
.menu-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 20px;
}

@media (min-width: 768px) {
  .menu-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 992px) {
  .menu-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tablas responsivas */
.table-responsive-custom {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 767px) {
  .table-responsive-custom table {
    font-size: 0.8rem;
  }
  
  .table-responsive-custom th,
  .table-responsive-custom td {
    padding: 0.5rem 0.25rem;
  }
}
```

---## BASE 
DE DATOS

### 🗄️ Esquema de Base de Datos PostgreSQL

#### Configuración de Conexión
```python
# backend_crm/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'fabrica',
        'USER': 'postgres',
        'PASSWORD': '12345',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 📊 Estructura de Tablas

#### Tablas Principales del Sistema

**1. Productos e Inventario**
```sql
-- Tabla de categorías
CREATE TABLE api_categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

-- Tabla principal de productos
CREATE TABLE api_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) DEFAULT 0,
    precio_compra DECIMAL(10,2) DEFAULT 0,
    stock_total INTEGER DEFAULT 0,
    categoria_id INTEGER REFERENCES api_categoria(id),
    imagen VARCHAR(100),
    codigo_barras VARCHAR(100),
    marca VARCHAR(100) DEFAULT 'GENERICA',
    impuesto VARCHAR(20) DEFAULT 'IVA(0%)',
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE
);

-- Movimientos de inventario
CREATE TABLE api_movimientoinventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES api_producto(id),
    tipo VARCHAR(10) CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad INTEGER NOT NULL,
    fecha TIMESTAMP DEFAULT NOW(),
    usuario VARCHAR(100) NOT NULL,
    nota TEXT
);
```

**2. Sistema POS y Ventas**
```sql
-- Tabla de ventas
CREATE TABLE api_venta (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE,
    fecha TIMESTAMP DEFAULT NOW(),
    vendedor VARCHAR(100) DEFAULT 'Sistema',
    cliente VARCHAR(255) DEFAULT 'CONSUMIDOR FINAL',
    metodo_pago VARCHAR(20) DEFAULT 'EFECTIVO',
    subtotal DECIMAL(10,2) DEFAULT 0,
    impuestos DECIMAL(10,2) DEFAULT 0,
    descuentos DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    dinero_entregado DECIMAL(10,2) DEFAULT 0,
    devuelta DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'PAGADO',
    nota TEXT
);

-- Detalles de venta
CREATE TABLE api_detalleventa (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES api_venta(id),
    producto_id INTEGER REFERENCES api_producto(id),
    producto_nombre VARCHAR(255),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2),
    subtotal DECIMAL(10,2)
);
```

**3. Sistema de Cargue (ID1-ID6)**
```sql
-- Tabla para vendedor ID1 (similar para ID2-ID6)
CREATE TABLE api_cargueid1 (
    id SERIAL PRIMARY KEY,
    
    -- Identificación
    dia VARCHAR(10) NOT NULL,
    fecha DATE NOT NULL,
    responsable VARCHAR(100),
    
    -- Checkboxes de control
    v BOOLEAN DEFAULT FALSE,
    d BOOLEAN DEFAULT FALSE,
    
    -- Datos de productos
    producto VARCHAR(255),
    cantidad INTEGER DEFAULT 0,
    dctos INTEGER DEFAULT 0,
    adicional INTEGER DEFAULT 0,
    devoluciones INTEGER DEFAULT 0,
    vencidas INTEGER DEFAULT 0,
    lotes_vencidos TEXT, -- JSON con lotes y motivos
    total INTEGER DEFAULT 0, -- Calculado automáticamente
    valor DECIMAL(10,2) DEFAULT 0,
    neto DECIMAL(12,2) DEFAULT 0, -- Calculado automáticamente
    
    -- Datos de pagos
    concepto VARCHAR(255),
    descuentos DECIMAL(10,2) DEFAULT 0,
    nequi DECIMAL(10,2) DEFAULT 0,
    daviplata DECIMAL(10,2) DEFAULT 0,
    
    -- Resumen de totales
    base_caja DECIMAL(10,2) DEFAULT 0,
    total_despacho DECIMAL(12,2) DEFAULT 0,
    total_pedidos DECIMAL(10,2) DEFAULT 0,
    total_dctos DECIMAL(10,2) DEFAULT 0,
    venta DECIMAL(12,2) DEFAULT 0,
    total_efectivo DECIMAL(12,2) DEFAULT 0,
    
    -- Control de cumplimiento
    licencia_transporte VARCHAR(2) CHECK (licencia_transporte IN ('SI', 'NO')),
    soat VARCHAR(2) CHECK (soat IN ('SI', 'NO')),
    uniforme VARCHAR(2) CHECK (uniforme IN ('SI', 'NO')),
    no_locion VARCHAR(2) CHECK (no_locion IN ('SI', 'NO')),
    no_accesorios VARCHAR(2) CHECK (no_accesorios IN ('SI', 'NO')),
    capacitacion_carnet VARCHAR(2) CHECK (capacitacion_carnet IN ('SI', 'NO')),
    higiene VARCHAR(2) CHECK (higiene IN ('SI', 'NO')),
    estibas VARCHAR(2) CHECK (estibas IN ('SI', 'NO')),
    desinfeccion VARCHAR(2) CHECK (desinfeccion IN ('SI', 'NO')),
    
    -- Metadatos
    usuario VARCHAR(100) DEFAULT 'Sistema',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_cargueid1_fecha ON api_cargueid1(fecha);
CREATE INDEX idx_cargueid1_dia ON api_cargueid1(dia);
CREATE INDEX idx_cargueid1_responsable ON api_cargueid1(responsable);
```

**4. Sistema de Producción**
```sql
-- Tabla de producción con función de congelado
CREATE TABLE api_produccion (
    id SERIAL PRIMARY KEY,
    fecha DATE DEFAULT CURRENT_DATE,
    producto VARCHAR(255),
    cantidad INTEGER DEFAULT 0,
    lote VARCHAR(100),
    
    -- Función de congelado
    congelado BOOLEAN DEFAULT FALSE,
    fecha_congelado TIMESTAMP,
    usuario_congelado VARCHAR(100),
    
    -- Metadatos
    usuario VARCHAR(100) DEFAULT 'Sistema',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_produccion_fecha ON api_produccion(fecha);
CREATE INDEX idx_produccion_producto ON api_produccion(producto);
CREATE INDEX idx_produccion_congelado ON api_produccion(congelado);
```

**5. Sistema de Caja y Cajeros**
```sql
-- Sucursales
CREATE TABLE api_sucursal (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE
);

-- Cajeros
CREATE TABLE api_cajero (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    sucursal_id INTEGER REFERENCES api_sucursal(id),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Turnos de cajeros
CREATE TABLE api_turno (
    id SERIAL PRIMARY KEY,
    cajero_id INTEGER REFERENCES api_cajero(id),
    fecha_inicio TIMESTAMP DEFAULT NOW(),
    fecha_fin TIMESTAMP,
    saldo_inicial DECIMAL(10,2) NOT NULL,
    saldo_final DECIMAL(10,2),
    activo BOOLEAN DEFAULT TRUE
);

-- Arqueos de caja
CREATE TABLE api_arqueocaja (
    id SERIAL PRIMARY KEY,
    cajero VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    banco VARCHAR(100) DEFAULT 'Caja General',
    
    -- Valores del sistema (calculados desde ventas)
    efectivo_sistema DECIMAL(10,2) DEFAULT 0,
    tarjetas_sistema DECIMAL(10,2) DEFAULT 0,
    transferencia_sistema DECIMAL(10,2) DEFAULT 0,
    consignacion_sistema DECIMAL(10,2) DEFAULT 0,
    qr_sistema DECIMAL(10,2) DEFAULT 0,
    rappipay_sistema DECIMAL(10,2) DEFAULT 0,
    bonos_sistema DECIMAL(10,2) DEFAULT 0,
    
    -- Valores físicos en caja
    efectivo_caja DECIMAL(10,2) DEFAULT 0,
    tarjetas_caja DECIMAL(10,2) DEFAULT 0,
    transferencia_caja DECIMAL(10,2) DEFAULT 0,
    consignacion_caja DECIMAL(10,2) DEFAULT 0,
    qr_caja DECIMAL(10,2) DEFAULT 0,
    rappipay_caja DECIMAL(10,2) DEFAULT 0,
    bonos_caja DECIMAL(10,2) DEFAULT 0,
    
    -- Totales calculados
    total_sistema DECIMAL(10,2) DEFAULT 0,
    total_caja DECIMAL(10,2) DEFAULT 0,
    total_diferencia DECIMAL(10,2) DEFAULT 0,
    
    -- Movimientos de caja (JSON)
    movimientos_caja JSONB DEFAULT '[]',
    total_movimientos DECIMAL(10,2) DEFAULT 0,
    
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Índices para arqueos
CREATE INDEX idx_arqueo_cajero_fecha ON api_arqueocaja(cajero, fecha);
CREATE INDEX idx_arqueo_fecha ON api_arqueocaja(fecha);
```

### 🔗 Relaciones entre Tablas

#### Diagrama de Relaciones
```
api_categoria (1) ←→ (N) api_producto
api_producto (1) ←→ (N) api_movimientoinventario
api_producto (1) ←→ (N) api_detalleventa
api_venta (1) ←→ (N) api_detalleventa
api_sucursal (1) ←→ (N) api_cajero
api_cajero (1) ←→ (N) api_turno

-- Tablas independientes (sin FK):
api_cargueid1, api_cargueid2, api_cargueid3, 
api_cargueid4, api_cargueid5, api_cargueid6
api_produccion
api_arqueocaja
```

### 📈 Triggers y Funciones Automáticas

#### Trigger para Actualización de Stock
```sql
-- Función para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION actualizar_stock_producto()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Actualizar stock según el tipo de movimiento
        IF NEW.tipo = 'ENTRADA' THEN
            UPDATE api_producto 
            SET stock_total = stock_total + NEW.cantidad 
            WHERE id = NEW.producto_id;
        ELSIF NEW.tipo = 'SALIDA' THEN
            UPDATE api_producto 
            SET stock_total = stock_total - NEW.cantidad 
            WHERE id = NEW.producto_id;
        ELSIF NEW.tipo = 'AJUSTE' THEN
            UPDATE api_producto 
            SET stock_total = stock_total + NEW.cantidad 
            WHERE id = NEW.producto_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
CREATE TRIGGER trigger_actualizar_stock
    AFTER INSERT ON api_movimientoinventario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_producto();
```

#### Función para Cálculos Automáticos en Cargue
```sql
-- Función para calcular totales en cargue
CREATE OR REPLACE FUNCTION calcular_totales_cargue()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular total automáticamente
    NEW.total = NEW.cantidad - NEW.dctos + NEW.adicional - NEW.devoluciones - NEW.vencidas;
    
    -- Calcular neto
    NEW.neto = NEW.total * NEW.valor;
    
    -- Actualizar fecha de modificación
    NEW.fecha_actualizacion = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas de cargue
CREATE TRIGGER trigger_calcular_totales_id1
    BEFORE INSERT OR UPDATE ON api_cargueid1
    FOR EACH ROW
    EXECUTE FUNCTION calcular_totales_cargue();

-- Repetir para ID2-ID6...
```

### 🔍 Consultas Optimizadas

#### Consultas Frecuentes del Sistema
```sql
-- 1. Obtener productos con stock bajo
SELECT 
    p.id,
    p.nombre,
    p.stock_total,
    c.nombre as categoria
FROM api_producto p
LEFT JOIN api_categoria c ON p.categoria_id = c.id
WHERE p.stock_total < 10 
    AND p.activo = TRUE
ORDER BY p.stock_total ASC;

-- 2. Resumen de ventas por día
SELECT 
    DATE(fecha) as fecha_venta,
    COUNT(*) as total_ventas,
    SUM(total) as total_facturado,
    AVG(total) as promedio_venta
FROM api_venta 
WHERE estado != 'ANULADA'
    AND fecha >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(fecha)
ORDER BY fecha_venta DESC;

-- 3. Kardex de producto específico
SELECT 
    m.fecha,
    m.tipo,
    m.cantidad,
    m.usuario,
    m.nota,
    SUM(
        CASE 
            WHEN m.tipo = 'ENTRADA' THEN m.cantidad
            WHEN m.tipo = 'SALIDA' THEN -m.cantidad
            WHEN m.tipo = 'AJUSTE' THEN m.cantidad
        END
    ) OVER (ORDER BY m.fecha, m.id) as saldo_acumulado
FROM api_movimientoinventario m
WHERE m.producto_id = $1
ORDER BY m.fecha DESC, m.id DESC;

-- 4. Resumen de cargue por vendedor y fecha
SELECT 
    responsable,
    fecha,
    COUNT(*) as productos_registrados,
    SUM(total) as total_productos,
    SUM(neto) as valor_total,
    BOOL_AND(v) as vendedor_completo,
    BOOL_AND(d) as despacho_completo
FROM api_cargueid1 
WHERE fecha BETWEEN $1 AND $2
    AND activo = TRUE
GROUP BY responsable, fecha
ORDER BY fecha DESC, responsable;

-- 5. Arqueos con diferencias significativas
SELECT 
    cajero,
    fecha,
    total_sistema,
    total_caja,
    total_diferencia,
    ABS(total_diferencia) as diferencia_absoluta
FROM api_arqueocaja
WHERE ABS(total_diferencia) > 1000
ORDER BY fecha DESC, ABS(total_diferencia) DESC;
```

### 🔧 Mantenimiento y Optimización

#### Scripts de Mantenimiento
```sql
-- 1. Limpiar datos antiguos (más de 1 año)
DELETE FROM api_movimientoinventario 
WHERE fecha < CURRENT_DATE - INTERVAL '1 year';

-- 2. Reindexar tablas principales
REINDEX TABLE api_producto;
REINDEX TABLE api_venta;
REINDEX TABLE api_cargueid1;

-- 3. Actualizar estadísticas
ANALYZE api_producto;
ANALYZE api_venta;
ANALYZE api_movimientoinventario;

-- 4. Verificar integridad de stock
SELECT 
    p.id,
    p.nombre,
    p.stock_total as stock_actual,
    COALESCE(SUM(
        CASE 
            WHEN m.tipo = 'ENTRADA' THEN m.cantidad
            WHEN m.tipo = 'SALIDA' THEN -m.cantidad
            WHEN m.tipo = 'AJUSTE' THEN m.cantidad
        END
    ), 0) as stock_calculado
FROM api_producto p
LEFT JOIN api_movimientoinventario m ON p.id = m.producto_id
GROUP BY p.id, p.nombre, p.stock_total
HAVING p.stock_total != COALESCE(SUM(
    CASE 
        WHEN m.tipo = 'ENTRADA' THEN m.cantidad
        WHEN m.tipo = 'SALIDA' THEN -m.cantidad
        WHEN m.tipo = 'AJUSTE' THEN m.cantidad
    END
), 0);
```

### 📊 Backup y Recuperación

#### Script de Backup Automático
```bash
#!/bin/bash
# backup_database.sh

DB_NAME="fabrica"
DB_USER="postgres"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear backup completo
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/fabrica_backup_$DATE.sql

# Comprimir backup
gzip $BACKUP_DIR/fabrica_backup_$DATE.sql

# Mantener solo los últimos 30 backups
find $BACKUP_DIR -name "fabrica_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completado: fabrica_backup_$DATE.sql.gz"
```

#### Restauración de Base de Datos
```bash
#!/bin/bash
# restore_database.sh

BACKUP_FILE=$1
DB_NAME="fabrica"
DB_USER="postgres"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <archivo_backup.sql.gz>"
    exit 1
fi

# Descomprimir si es necesario
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE > temp_restore.sql
    BACKUP_FILE="temp_restore.sql"
fi

# Restaurar base de datos
psql -U $DB_USER -h localhost -d $DB_NAME < $BACKUP_FILE

# Limpiar archivo temporal
if [ -f "temp_restore.sql" ]; then
    rm temp_restore.sql
fi

echo "Restauración completada desde: $1"
```

---## 
INSTALACIÓN Y CONFIGURACIÓN

### 🚀 Requisitos del Sistema

#### Requisitos de Software
```
Backend:
- Python 3.10+
- PostgreSQL 12+
- pip (gestor de paquetes Python)

Frontend:
- Node.js 18+
- npm 8+

Sistema Operativo:
- Linux (Ubuntu 20.04+ recomendado)
- Windows 10+ (con WSL2)
- macOS 11+
```

### 📦 Instalación Paso a Paso

#### 1. Configuración del Backend (Django)

**Clonar el repositorio:**
```bash
git clone <repository-url>
cd crm-fabrica
```

**Crear entorno virtual:**
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows
```

**Instalar dependencias:**
```bash
pip install -r requirements.txt
```

**Configurar PostgreSQL:**
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE fabrica;
CREATE USER postgres WITH PASSWORD '12345';
GRANT ALL PRIVILEGES ON DATABASE fabrica TO postgres;
\q
```

**Configurar variables de entorno:**
```bash
# Crear archivo .env
cat > .env << EOF
DEBUG=True
SECRET_KEY=django-insecure-^zvl@rxk@+w1^4-s!ncx9dhopbzmvry0a1ybp0k#h8vha^&px3
DB_NAME=fabrica
DB_USER=postgres
DB_PASSWORD=12345
DB_HOST=localhost
DB_PORT=5432
EOF
```

**Ejecutar migraciones:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Crear superusuario:**
```bash
python manage.py createsuperuser
```

**Iniciar servidor de desarrollo:**
```bash
python manage.py runserver
```

#### 2. Configuración del Frontend (React)

**Navegar al directorio frontend:**
```bash
cd frontend
```

**Instalar dependencias:**
```bash
npm install
```

**Configurar variables de entorno:**
```bash
# Crear archivo .env
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_MEDIA_URL=http://localhost:8000/media
EOF
```

**Iniciar servidor de desarrollo:**
```bash
npm start
```

### 🔧 Configuración de Producción

#### 1. Backend en Producción

**Configuración de settings.py:**
```python
# backend_crm/settings_production.py
import os
from .settings import *

DEBUG = False
ALLOWED_HOSTS = ['tu-dominio.com', 'www.tu-dominio.com']

# Base de datos de producción
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Configuración de archivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Configuración de archivos multimedia
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Seguridad
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS para producción
CORS_ALLOWED_ORIGINS = [
    "https://tu-dominio.com",
    "https://www.tu-dominio.com",
]
```

**Dockerfile para Backend:**
```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear directorio para archivos estáticos
RUN mkdir -p staticfiles media

# Exponer puerto
EXPOSE 8000

# Comando por defecto
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend_crm.wsgi:application"]
```

#### 2. Frontend en Producción

**Build de producción:**
```bash
cd frontend
npm run build
```

**Dockerfile para Frontend:**
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Servidor nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Configuración de Nginx:**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        # Configuración para React Router
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy para API
        location /api/ {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Archivos multimedia
        location /media/ {
            proxy_pass http://backend:8000;
        }
    }
}
```

#### 3. Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: fabrica
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 12345
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: .
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn --bind 0.0.0.0:8000 backend_crm.wsgi:application"
    volumes:
      - ./media:/app/media
      - ./staticfiles:/app/staticfiles
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DEBUG=False
      - DB_NAME=fabrica
      - DB_USER=postgres
      - DB_PASSWORD=12345
      - DB_HOST=db
      - DB_PORT=5432

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 🔐 Configuración de Seguridad

#### 1. Configuración de HTTPS

**Certificado SSL con Let's Encrypt:**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática
sudo crontab -e
# Agregar línea:
0 12 * * * /usr/bin/certbot renew --quiet
```

#### 2. Configuración de Firewall

**UFW (Ubuntu Firewall):**
```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP y HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Permitir PostgreSQL solo desde localhost
sudo ufw allow from 127.0.0.1 to any port 5432

# Ver estado
sudo ufw status
```

#### 3. Backup Automático

**Script de backup:**
```bash
#!/bin/bash
# /opt/scripts/backup_sistema.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="fabrica"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
docker exec crm-fabrica_db_1 pg_dump -U postgres $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos multimedia
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz ./media

# Limpiar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*backup_*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*backup_*.tar.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

**Cron job para backup automático:**
```bash
# Editar crontab
sudo crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * /opt/scripts/backup_sistema.sh >> /var/log/backup.log 2>&1
```

### 📊 Monitoreo y Logs

#### 1. Configuración de Logs

**Django logging:**
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/crm.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}
```

#### 2. Monitoreo de Sistema

**Script de monitoreo:**
```bash
#!/bin/bash
# /opt/scripts/monitor_sistema.sh

# Verificar servicios
systemctl is-active --quiet postgresql && echo "PostgreSQL: OK" || echo "PostgreSQL: ERROR"
systemctl is-active --quiet nginx && echo "Nginx: OK" || echo "Nginx: ERROR"

# Verificar espacio en disco
df -h | grep -E "/$|/var" | awk '{print $5 " " $6}' | while read output;
do
  usage=$(echo $output | awk '{print $1}' | sed 's/%//g')
  partition=$(echo $output | awk '{print $2}')
  if [ $usage -ge 80 ]; then
    echo "ALERTA: Partición $partition al $usage%"
  fi
done

# Verificar memoria
free -m | awk 'NR==2{printf "Memoria: %.2f%% usada\n", $3*100/$2 }'

# Verificar conexiones a base de datos
psql -U postgres -d fabrica -c "SELECT count(*) as conexiones_activas FROM pg_stat_activity WHERE state = 'active';"
```

### 🔄 Actualización del Sistema

#### Script de Actualización
```bash
#!/bin/bash
# /opt/scripts/update_sistema.sh

echo "Iniciando actualización del sistema..."

# Backup antes de actualizar
/opt/scripts/backup_sistema.sh

# Detener servicios
docker-compose down

# Actualizar código
git pull origin main

# Reconstruir contenedores
docker-compose build

# Ejecutar migraciones
docker-compose run --rm backend python manage.py migrate

# Recolectar archivos estáticos
docker-compose run --rm backend python manage.py collectstatic --noinput

# Reiniciar servicios
docker-compose up -d

echo "Actualización completada"
```

---

## GUÍA DE REPLICACIÓN

### 🎯 Para Otra IA - Cómo Replicar Este Sistema

#### 1. Entendimiento de la Arquitectura

**Conceptos Clave:**
- **Separación de responsabilidades:** Frontend React + Backend Django + PostgreSQL
- **Módulos independientes:** POS, Cargue, Inventario, Caja funcionan de forma autónoma
- **Sincronización:** LocalStorage + API REST para persistencia
- **Estado global:** Context API para compartir datos entre componentes

#### 2. Orden de Implementación Recomendado

**Fase 1: Base del Sistema (1-2 semanas)**
```
1. Configurar Django + PostgreSQL
2. Crear modelos básicos (Producto, Categoria)
3. Implementar APIs REST básicas
4. Configurar React + Bootstrap
5. Crear componentes base (MainMenu, routing)
```

**Fase 2: Módulo POS (2-3 semanas)**
```
1. Implementar ProductContext
2. Crear componentes POS (ProductList, Cart, PaymentModal)
3. Sistema de ventas completo
4. Integración con inventario
5. Generación de facturas
```

**Fase 3: Módulo Inventario (1-2 semanas)**
```
1. Gestión de stock y movimientos
2. Kardex de productos
3. Sistema de producción
4. Sincronización automática
```

**Fase 4: Módulo Cargue (3-4 semanas)**
```
1. Crear modelos CargueID1-ID6
2. Implementar PlantillaOperativa
3. Sistema de responsables
4. Control de cumplimiento
5. Guardado completo en BD
```

**Fase 5: Módulo Caja (2-3 semanas)**
```
1. Sistema de cajeros y turnos
2. Arqueo de caja
3. Movimientos de caja
4. Validaciones automáticas
```

#### 3. Patrones de Código Importantes

**Patrón de Servicios API:**
```javascript
// Siempre usar este patrón para APIs
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
};
```

**Patrón de Context:**
```javascript
// Siempre crear contexts para estado global
const SomeContext = createContext();
export const SomeProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  // ... lógica del context
  return (
    <SomeContext.Provider value={{ state, actions }}>
      {children}
    </SomeContext.Provider>
  );
};
```

**Patrón de Componentes:**
```javascript
// Estructura estándar de componentes
const Component = ({ props }) => {
  const [localState, setLocalState] = useState();
  const { globalState, actions } = useContext(SomeContext);
  
  useEffect(() => {
    // Efectos y carga inicial
  }, [dependencies]);
  
  const handleAction = () => {
    // Lógica de eventos
  };
  
  return (
    <div className="component-container">
      {/* JSX */}
    </div>
  );
};
```

#### 4. Configuraciones Críticas

**Django Settings:**
```python
# Siempre configurar CORS correctamente
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]

# Configurar zona horaria
TIME_ZONE = 'America/Bogota'
USE_TZ = True

# Configurar archivos multimedia
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

**React Package.json:**
```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-router-dom": "^6.x",
    "bootstrap": "^5.3.6",
    "react-bootstrap": "^2.x"
  }
}
```

#### 5. Puntos de Atención Especiales

**Manejo de Fechas:**
```javascript
// SIEMPRE usar esta función para fechas locales
const getFechaLocal = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

**Cálculos Automáticos:**
```javascript
// Siempre calcular totales automáticamente
const calcularTotal = (cantidad, dctos, adicional, devoluciones, vencidas) => {
  return cantidad - dctos + adicional - devoluciones - vencidas;
};
```

**Persistencia de Datos:**
```javascript
// Patrón para localStorage + API
const guardarDatos = async (datos) => {
  // 1. Guardar en localStorage inmediatamente
  localStorage.setItem(key, JSON.stringify(datos));
  
  // 2. Enviar a API
  const resultado = await apiService.save(datos);
  
  // 3. Limpiar localStorage si se guardó exitosamente
  if (resultado.success) {
    localStorage.removeItem(key);
  }
};
```

#### 6. Testing y Validación

**Checklist de Funcionalidades:**
```
□ POS: Crear venta, actualizar inventario, generar factura
□ Inventario: Agregar producto, actualizar stock, ver kardex
□ Cargue: Registrar datos por vendedor, guardar en BD
□ Caja: Login cajero, arqueo, movimientos de caja
□ Sincronización: LocalStorage ↔ API ↔ PostgreSQL
□ Responsive: Funciona en móvil y desktop
□ Errores: Manejo adecuado de errores de red
```

#### 7. Recursos y Referencias

**Documentación Oficial:**
- Django: https://docs.djangoproject.com/
- React: https://react.dev/
- Bootstrap: https://getbootstrap.com/
- PostgreSQL: https://www.postgresql.org/docs/

**Comandos Útiles:**
```bash
# Django
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# React
npm start
npm run build

# PostgreSQL
psql -U postgres -d fabrica
\dt  # Listar tablas
\d tabla_nombre  # Describir tabla
```

### 🎯 Conclusión

Este sistema CRM está diseñado para ser **modular, escalable y fácil de mantener**. Cada módulo funciona de forma independiente pero se integra perfectamente con los demás. La arquitectura permite agregar nuevos módulos sin afectar los existentes.

**Características principales que hacen este sistema único:**
- ✅ **Sincronización automática** entre módulos
- ✅ **Persistencia dual** (LocalStorage + PostgreSQL)
- ✅ **Cálculos automáticos** en tiempo real
- ✅ **Manejo robusto de errores**
- ✅ **Interfaz responsive** y moderna
- ✅ **Arquitectura escalable** y mantenible

Para replicar exitosamente este sistema, es crucial entender estos patrones y seguir el orden de implementación recomendado. La clave está en la **consistencia de patrones** y la **atención a los detalles** en cada módulo.

---

**📝 Nota Final:** Esta documentación contiene toda la información necesaria para entender, mantener y replicar el sistema completo. Cada sección incluye código real, configuraciones específicas y patrones probados en producción.
