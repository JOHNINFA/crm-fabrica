# 📱 Sistema Integrado de Gestión - Documentación Completa

## 🎯 Bienvenido

Este es un **sistema empresarial completo** construido con **Django REST Framework** (backend) y **React** (frontend) que integra múltiples módulos de negocio para una fábrica/distribuidora de productos.

---

## 📚 Documentación

Toda la documentación está disponible en la carpeta `DOCUMENTACION/`:

### 🚀 Comienza Aquí
- **[INICIO_RAPIDO.md](DOCUMENTACION/INICIO_RAPIDO.md)** - Guía de 5 minutos para entender el sistema
- **[INDICE.md](DOCUMENTACION/INDICE.md)** - Índice completo de documentación

### 📖 Documentación General
- **[README_GENERAL.md](DOCUMENTACION/README_GENERAL.md)** - Arquitectura, estructura y flujos generales

### 🔧 Módulos Específicos
- **[README_POS.md](DOCUMENTACION/README_POS.md)** - Módulo de Punto de Venta
- **[README_CARGUE.md](DOCUMENTACION/README_CARGUE.md)** - Módulo de Cargue Operativo
- **[README_INVENTARIO.md](DOCUMENTACION/README_INVENTARIO.md)** - Módulo de Inventario
- **[README_PEDIDOS.md](DOCUMENTACION/README_PEDIDOS.md)** - Módulo de Pedidos
- **[README_OTROS.md](DOCUMENTACION/README_OTROS.md)** - Módulo de Administración y Configuración

---

## 🏗️ Estructura del Proyecto

```
proyecto/
├── DOCUMENTACION/                 # 📚 Documentación completa
│   ├── INICIO_RAPIDO.md          # Guía rápida
│   ├── INDICE.md                 # Índice de documentación
│   ├── README_GENERAL.md         # Visión general
│   ├── README_POS.md             # Módulo POS
│   ├── README_CARGUE.md          # Módulo Cargue
│   ├── README_INVENTARIO.md      # Módulo Inventario
│   ├── README_PEDIDOS.md         # Módulo Pedidos
│   └── README_OTROS.md           # Módulo Otros (Administración)
│
├── backend_crm/                   # 🔧 Backend Django
│   ├── settings.py               # Configuración
│   ├── urls.py                   # Rutas principales
│   ├── wsgi.py                   # Servidor WSGI
│   └── asgi.py                   # Servidor ASGI
│
├── api/                           # 📡 API REST
│   ├── models.py                 # Modelos de datos
│   ├── views.py                  # Endpoints
│   ├── serializers.py            # Serializadores
│   ├── urls.py                   # Rutas de API
│   ├── admin.py                  # Panel administrativo
│   └── migrations/               # Migraciones BD
│
├── frontend/                      # 🎨 Frontend React
│   ├── src/
│   │   ├── pages/                # Pantallas principales
│   │   ├── components/           # Componentes
│   │   ├── services/             # Servicios API
│   │   ├── context/              # Estado global
│   │   ├── hooks/                # Custom hooks
│   │   ├── utils/                # Utilidades
│   │   └── styles/               # Estilos CSS
│   ├── public/                   # Archivos estáticos
│   └── package.json              # Dependencias
│
├── manage.py                      # Gestor de Django
└── README.md                      # Este archivo
```

---

## 🚀 Inicio Rápido

### Backend
```bash
# 1. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar base de datos
# Editar backend_crm/settings.py con credenciales PostgreSQL

# 4. Ejecutar migraciones
python manage.py migrate

# 5. Crear superusuario
python manage.py createsuperuser

# 6. Ejecutar servidor
python manage.py runserver
# Acceder a: http://localhost:8000/api/
```

### Frontend
```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Configurar API
# Editar frontend/src/config/api.js si es necesario

# 3. Ejecutar servidor
npm start
# Acceder a: http://localhost:3000
```

---

## 📊 Módulos Principales

### 🛒 POS (Punto de Venta)
- Búsqueda y selección de productos
- Carrito de compras
- Múltiples métodos de pago
- Generación de facturas
- **Gestión de Caja**: Apertura/cierre de turno, arqueo
- **Historial de Ventas**: Registro de transacciones

### 📦 CARGUE (Operativo de Vendedores)
- Registro de productos despachados
- Control de devoluciones y vencidas
- Registro de pagos
- Control de cumplimiento
- Múltiples rutas (ID1-ID6)

### 📊 INVENTARIO
- Visualización de stock
- Movimientos de entrada/salida
- Gestión de lotes
- **Kardex**: Historial de movimientos (trazabilidad)
- Planeación de producción

### 📋 PEDIDOS
- Creación de pedidos
- **Gestión de Clientes**: Información y configuración
- **Historial de Pedidos**: Seguimiento de estado
- Generación de remisiones
- Integración con inventario

---

## 🔌 Endpoints API Principales

### Productos
```
GET    /api/productos/
POST   /api/productos/
GET    /api/productos/{id}/
PUT    /api/productos/{id}/
DELETE /api/productos/{id}/
```

### Ventas
```
GET    /api/ventas/
POST   /api/ventas/
GET    /api/ventas/{id}/
```

### Cargue
```
GET    /api/cargue-id1/
POST   /api/cargue-id1/
GET    /api/cargue-id1/{id}/
```

### Pedidos
```
GET    /api/pedidos/
POST   /api/pedidos/
GET    /api/pedidos/{id}/
```

### Inventario
```
GET    /api/movimientos-inventario/
POST   /api/movimientos-inventario/
GET    /api/lotes/
```

---

## 🛠️ Tecnologías

### Backend
- **Django 5.1.7** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de datos
- **Python 3.x** - Lenguaje

### Frontend
- **React 19.1.0** - Framework UI
- **React Router 7.5.0** - Enrutamiento
- **Bootstrap 5.3.6** - Framework CSS
- **Node.js** - Runtime

---

## 📖 Guía de Lectura

### Para Desarrolladores
1. Leer [INICIO_RAPIDO.md](DOCUMENTACION/INICIO_RAPIDO.md)
2. Leer [README_GENERAL.md](DOCUMENTACION/README_GENERAL.md)
3. Seleccionar módulo y leer su README
4. Revisar código en repositorio
5. Implementar cambios

### Para Product Managers
1. Leer [INICIO_RAPIDO.md](DOCUMENTACION/INICIO_RAPIDO.md)
2. Leer [README_GENERAL.md](DOCUMENTACION/README_GENERAL.md)
3. Revisar funcionalidades en cada módulo

### Para QA/Testers
1. Leer [INICIO_RAPIDO.md](DOCUMENTACION/INICIO_RAPIDO.md)
2. Leer funcionalidades de cada módulo
3. Revisar validaciones
4. Probar flujos de negocio

---

## 🔐 Seguridad

- Validación en cliente y servidor
- CORS configurado
- Autenticación token-based (en producción)
- Encriptación de contraseñas
- Auditoría de cambios

---

## 📞 Soporte

Para reportar bugs, sugerencias o preguntas:
- Contactar al equipo de desarrollo
- Crear issue en el repositorio
- Revisar la documentación en `DOCUMENTACION/`

---

## 📝 Licencia

[Especificar licencia]

---

## 👥 Contribuidores

[Listar contribuidores]

---

## 📅 Última Actualización

17 de Noviembre de 2025

---

## ✅ Estado del Proyecto

- ✅ Documentación completa
- ✅ Módulos implementados
- ✅ API funcional
- ✅ Frontend operativo
- ⏳ Tests en progreso
- ⏳ Deployment en progreso

---

**¡Gracias por usar nuestro sistema! 🎉**

Para más información, consulta la [documentación completa](DOCUMENTACION/INDICE.md).
