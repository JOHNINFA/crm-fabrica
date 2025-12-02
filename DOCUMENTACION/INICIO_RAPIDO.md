# 🚀 Guía de Inicio Rápido

## ⏱️ 5 Minutos para Entender el Sistema

### 1. ¿Qué es este sistema?
Es una **aplicación empresarial completa** que gestiona:
- 🛒 **POS**: Ventas en mostrador
- 📦 **CARGUE**: Operativo de vendedores en ruta
- 📊 **INVENTARIO**: Gestión de stock
- 📋 **PEDIDOS**: Gestión de pedidos de clientes
- 🔍 **TRAZABILIDAD**: Seguimiento de productos

---

## 2. Arquitectura en 30 Segundos

```
┌─────────────────────────────────────────┐
│  FRONTEND (React)                       │
│  ├─ POS Screen                          │
│  ├─ Cargue Screen                       │
│  ├─ Inventario Screen                   │
│  ├─ Pedidos Screen                      │
│  └─ Trazabilidad Screen                 │
└─────────────────────────────────────────┘
              ↕ REST API
┌─────────────────────────────────────────┐
│  BACKEND (Django)                       │
│  ├─ Modelos (Producto, Venta, etc.)    │
│  ├─ Vistas/Endpoints                    │
│  ├─ Serializers                         │
│  └─ Lógica de negocio                   │
└─────────────────────────────────────────┘
              ↕
┌─────────────────────────────────────────┐
│  BASE DE DATOS (PostgreSQL)             │
│  └─ Tablas de datos                     │
└─────────────────────────────────────────┘
```

---

## 3. Instalación Rápida

### Backend (Django)
```bash
# 1. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 2. Instalar dependencias
pip install django djangorestframework django-cors-headers psycopg2-binary

# 3. Configurar base de datos en settings.py
# Cambiar credenciales PostgreSQL

# 4. Ejecutar migraciones
python manage.py migrate

# 5. Crear superusuario
python manage.py createsuperuser

# 6. Ejecutar servidor
python manage.py runserver
# Acceder a: http://localhost:8000/api/
```

### Frontend (React)
```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Configurar API en src/config/api.js
# Cambiar URL del backend si es necesario

# 3. Ejecutar servidor
npm start
# Acceder a: http://localhost:3000
```

---

## 4. Flujo de Venta en 1 Minuto

```
1. Cajero abre POS
   ↓
2. Busca y selecciona productos
   ↓
3. Agrega al carrito
   ↓
4. Selecciona método de pago
   ↓
5. Genera factura
   ↓
6. Sistema actualiza:
   - Stock del producto (SALIDA)
   - Registro de venta
   - Movimiento de caja
```

**Código clave**:
```javascript
// Frontend: Crear venta
const response = await fetch('/api/ventas/', {
  method: 'POST',
  body: JSON.stringify({
    vendedor: 'Juan',
    cliente: 'CONSUMIDOR FINAL',
    metodo_pago: 'EFECTIVO',
    total: 50000,
    detalles: [{ producto: 1, cantidad: 2, precio_unitario: 25000 }]
  })
});
```

---

## 5. Endpoints Principales

### Productos
```
GET    /api/productos/              # Listar
POST   /api/productos/              # Crear
GET    /api/productos/{id}/         # Obtener
PUT    /api/productos/{id}/         # Actualizar
DELETE /api/productos/{id}/         # Eliminar
```

### Ventas
```
GET    /api/ventas/                 # Listar
POST   /api/ventas/                 # Crear
GET    /api/ventas/{id}/            # Obtener
```

### Cargue
```
GET    /api/cargue-id1/             # Listar
POST   /api/cargue-id1/             # Crear
GET    /api/cargue-id1/{id}/        # Obtener
```

### Pedidos
```
GET    /api/pedidos/                # Listar
POST   /api/pedidos/                # Crear
GET    /api/pedidos/{id}/           # Obtener
```

### Inventario
```
GET    /api/productos/              # Stock
POST   /api/movimientos-inventario/ # Movimiento
GET    /api/lotes/                  # Lotes
```

---

## 6. Estructura de Carpetas

### Backend
```
backend_crm/
├── settings.py          # Configuración
├── urls.py              # Rutas principales
└── wsgi.py              # Servidor

api/
├── models.py            # Modelos (Producto, Venta, etc.)
├── views.py             # Endpoints
├── serializers.py       # Serializadores
├── urls.py              # Rutas de API
└── migrations/          # Migraciones BD
```

### Frontend
```
frontend/src/
├── pages/               # Pantallas (POS, Cargue, etc.)
├── components/          # Componentes reutilizables
├── services/            # Servicios API
├── context/             # Estado global
├── hooks/               # Custom hooks
├── utils/               # Utilidades
└── styles/              # Estilos CSS
```

---

## 7. Modelos de Datos Principales

### Producto
```python
{
  "id": 1,
  "nombre": "Producto A",
  "precio": 5000,
  "stock_total": 100,
  "categoria": 1,
  "activo": true
}
```

### Venta
```python
{
  "id": 1,
  "numero_factura": "F12345678",
  "vendedor": "Juan",
  "cliente": "CONSUMIDOR FINAL",
  "total": 50000,
  "estado": "PAGADO",
  "detalles": [...]
}
```

### Cargue
```python
{
  "id": 1,
  "dia": "LUNES",
  "fecha": "2025-11-17",
  "responsable": "Juan",
  "producto": "Producto A",
  "cantidad": 50,
  "total": 42,
  "neto": 210000
}
```

### Pedido
```python
{
  "id": 1,
  "numero_pedido": "PED001",
  "vendedor": "Juan",
  "destinatario": "Cliente XYZ",
  "fecha_entrega": "2025-11-20",
  "total": 100000,
  "estado": "PENDIENTE"
}
```

---

## 8. Validaciones Clave

### Stock
```javascript
if (cantidad > producto.stock_total) {
  throw new Error('Stock insuficiente');
}
```

### Pago
```javascript
if (dinero_entregado < total) {
  throw new Error('Dinero insuficiente');
}
```

### Carrito
```javascript
if (cartItems.length === 0) {
  throw new Error('Carrito vacío');
}
```

---

## 9. Flujos de Integración

### POS → Inventario
```
Venta → DetalleVenta → MovimientoInventario (SALIDA)
  ↓
Stock actualizado
```

### Cargue → Planeación
```
Cargue → Actualización de despacho
  ↓
Planeación actualizada
```

### Pedido → Inventario
```
Pedido → Reserva de stock
  ↓
Disponibilidad actualizada
```

---

## 10. Primeros Pasos

### Paso 1: Clonar/Descargar
```bash
git clone <repositorio>
cd proyecto
```

### Paso 2: Configurar Backend
```bash
cd backend_crm
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Paso 3: Configurar Frontend
```bash
cd frontend
npm install
npm start
```

### Paso 4: Crear Datos de Prueba
```bash
# En Django shell
python manage.py shell

from api.models import Categoria, Producto
cat = Categoria.objects.create(nombre="Bebidas")
prod = Producto.objects.create(
    nombre="Gaseosa",
    precio=2000,
    stock_total=100,
    categoria=cat
)
```

### Paso 5: Probar en Frontend
- Ir a http://localhost:3000
- Seleccionar producto
- Agregar al carrito
- Procesar venta

---

## 11. Troubleshooting Rápido

### Error: "CORS policy"
**Solución**: Verificar `CORS_ALLOWED_ORIGINS` en `settings.py`

### Error: "Database connection refused"
**Solución**: Verificar credenciales PostgreSQL en `settings.py`

### Error: "Module not found"
**Solución**: Ejecutar `npm install` o `pip install -r requirements.txt`

### Error: "Port already in use"
**Solución**: Cambiar puerto: `python manage.py runserver 8001`

---

## 12. Documentación Completa

Para más detalles, consulta:
- **README_GENERAL.md** - Arquitectura completa
- **README_POS.md** - Módulo POS
- **README_CARGUE.md** - Módulo Cargue
- **README_INVENTARIO.md** - Módulo Inventario
- **README_PEDIDOS.md** - Módulo Pedidos
- **README_TRAZABILIDAD.md** - Módulo Trazabilidad

---

## 13. Comandos Útiles

### Backend
```bash
# Crear migración
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell interactivo
python manage.py shell

# Ejecutar tests
python manage.py test

# Recolectar archivos estáticos
python manage.py collectstatic
```

### Frontend
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start

# Build para producción
npm run build

# Ejecutar tests
npm test

# Limpiar cache
npm cache clean --force
```

---

## 14. Variables de Entorno

### Backend (.env)
```
DEBUG=True
SECRET_KEY=tu-clave-secreta
DATABASE_URL=postgresql://user:pass@localhost/fabrica
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

---

## 15. Próximos Pasos

1. ✅ Instalar backend y frontend
2. ✅ Crear datos de prueba
3. ✅ Probar flujo de venta
4. ✅ Explorar otros módulos
5. ✅ Leer documentación completa
6. ✅ Personalizar según necesidades
7. ✅ Desplegar a producción

---

## 📞 Ayuda

- Revisar documentación en `DOCUMENTACION/`
- Consultar código en repositorio
- Contactar al equipo de desarrollo

---

**¡Listo para empezar! 🎉**

**Última actualización**: 17 de Noviembre de 2025
