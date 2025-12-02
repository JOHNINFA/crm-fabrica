# ⚙️ Módulo OTROS (Administración y Configuración)

## 📋 Descripción General

El módulo OTROS es el centro de administración y configuración del sistema. Permite gestionar sucursales, usuarios, configuración de impresión y otras configuraciones generales del sistema.

---

## 🎯 Funcionalidades Principales

### 1. Gestión de Sucursales
- **Crear Sucursales**: Registrar nuevas sucursales del negocio
- **Información de Contacto**: Teléfono, email, dirección
- **Datos Geográficos**: Ciudad, departamento, código postal
- **Activar/Desactivar**: Control de sucursales activas
- **Sucursal Principal**: Designar sucursal principal del sistema
- **Editar**: Modificar información de sucursales
- **Eliminar**: Remover sucursales del sistema

### 2. Gestión de Usuarios
- **Crear Usuarios**: Registrar nuevos usuarios del sistema
- **Asignar Módulos**: 
  - **POS**: Usuario funciona como vendedor con capacidad de facturación
  - **Pedidos**: Usuario solo gestiona pedidos sin función de venta
  - **Ambos**: Usuario puede acceder a POS y Pedidos
- **Asignar Sucursal**: Vincular usuario a sucursal específica
- **Roles y Permisos**: Configurar permisos por usuario
- **Activar/Desactivar**: Control de usuarios activos
- **Editar**: Modificar información de usuarios
- **Eliminar**: Remover usuarios del sistema

### 3. Configuración de Impresión
- **Información del Negocio**:
  - Nombre del negocio
  - NIT
  - Dirección
  - Teléfono
  - Email
- **Personalización de Tickets**:
  - Encabezado personalizado
  - Pie de página personalizado
  - Mensaje de agradecimiento
  - Logo del negocio
- **Configuración Técnica**:
  - Ancho de papel (58mm, 80mm)
  - Mostrar/ocultar logo
  - Mostrar/ocultar código de barras
  - Impresora predeterminada
  - Resolución de facturación

### 4. Configuración General
- **Régimen Tributario**: Configurar régimen del negocio
- **Centros de Costo**: Gestionar centros de costo
- **Bancos**: Gestionar bancos y cuentas
- **Otras Configuraciones**: Parámetros generales del sistema

### 5. Reportes Avanzados
- **Reportes por Cajero**: Análisis de ventas por cajero
- **Reportes por Sucursal**: Análisis de ventas por sucursal
- **Reportes Detallados**: Información completa de transacciones
- **Exportación**: Descargar reportes en diferentes formatos

---

## 🏗️ Estructura de Componentes Frontend

### Componentes Principales

```
frontend/src/pages/
├── OtrosScreen.jsx              # Pantalla principal
├── SucursalesScreen.jsx         # Gestión de sucursales
├── CajerosScreen.jsx            # Gestión de usuarios/cajeros
├── ConfiguracionScreen.jsx      # Configuración general
└── ConfiguracionImpresionScreen.jsx  # Configuración de impresión

frontend/src/components/common/
├── GestionSucursales.jsx        # Componente de sucursales
├── GestionUsuarios.jsx          # Componente de usuarios
├── CrearSucursalModal.jsx       # Modal crear sucursal
├── EditarSucursalModal.jsx      # Modal editar sucursal
├── EliminarSucursalModal.jsx    # Modal eliminar sucursal
├── CrearCajeroModal.jsx         # Modal crear usuario
├── EditarCajeroModal.jsx        # Modal editar usuario
└── EliminarCajeroModal.jsx      # Modal eliminar usuario
```

---

## 💾 Modelos de Datos Backend

### Modelo: Sucursal
```python
class Sucursal(models.Model):
    nombre = models.CharField(max_length=255, unique=True)
    direccion = models.TextField(blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    departamento = models.CharField(max_length=100, blank=True, null=True)
    codigo_postal = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)
    es_principal = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

### Modelo: Cajero (Usuario)
```python
class Cajero(models.Model):
    ROLES = [
        ('CAJERO', 'Cajero'),
        ('VENDEDOR', 'Vendedor'),
        ('SUPERVISOR', 'Supervisor'),
        ('ADMIN', 'Administrador'),
    ]
    
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    password = models.CharField(max_length=255)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    rol = models.CharField(max_length=20, choices=ROLES, default='CAJERO')
    activo = models.BooleanField(default=True)
    puede_hacer_descuentos = models.BooleanField(default=False)
    limite_descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    puede_anular_ventas = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    ultimo_login = models.DateTimeField(null=True, blank=True)
```

### Modelo: ConfiguracionImpresion
```python
class ConfiguracionImpresion(models.Model):
    nombre_negocio = models.CharField(max_length=255, default='MI NEGOCIO')
    nit_negocio = models.CharField(max_length=50, blank=True, null=True)
    direccion_negocio = models.TextField(blank=True, null=True)
    telefono_negocio = models.CharField(max_length=20, blank=True, null=True)
    email_negocio = models.EmailField(blank=True, null=True)
    encabezado_ticket = models.TextField(blank=True, null=True)
    pie_pagina_ticket = models.TextField(blank=True, null=True)
    mensaje_agradecimiento = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    ancho_papel = models.CharField(max_length=10, choices=[('58mm', '58mm'), ('80mm', '80mm')], default='58mm')
    mostrar_logo = models.BooleanField(default=True)
    mostrar_codigo_barras = models.BooleanField(default=True)
    impresora_predeterminada = models.CharField(max_length=100, blank=True, null=True)
    resolucion_facturacion = models.CharField(max_length=50, default='300dpi')
    regimen_tributario = models.CharField(max_length=100, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
```

---

## 🔌 Endpoints API

### Sucursales
```
GET    /api/sucursales/                    # Listar
POST   /api/sucursales/                    # Crear
GET    /api/sucursales/{id}/               # Obtener
PUT    /api/sucursales/{id}/               # Actualizar
DELETE /api/sucursales/{id}/               # Eliminar
```

### Usuarios/Cajeros
```
GET    /api/cajeros/                       # Listar
POST   /api/cajeros/                       # Crear
GET    /api/cajeros/{id}/                  # Obtener
PUT    /api/cajeros/{id}/                  # Actualizar
DELETE /api/cajeros/{id}/                  # Eliminar
POST   /api/cajeros/login/                 # Login
```

### Configuración de Impresión
```
GET    /api/configuracion-impresion/       # Obtener
PUT    /api/configuracion-impresion/{id}/  # Actualizar
```

---

## 🔄 Flujo de Administración

### 1. Crear Sucursal
```javascript
// OtrosScreen.jsx → GestionSucursales.jsx
const handleCreateSucursal = async (sucursalData) => {
  const response = await fetch('/api/sucursales/', {
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Sucursal Centro',
      direccion: 'Calle 1 #123',
      telefono: '3001234567',
      email: 'centro@negocio.com',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      es_principal: false
    })
  });
  
  const sucursal = await response.json();
  // Actualizar lista de sucursales
};
```

### 2. Crear Usuario
```javascript
// OtrosScreen.jsx → GestionUsuarios.jsx
const handleCreateUsuario = async (usuarioData) => {
  const response = await fetch('/api/cajeros/', {
    method: 'POST',
    body: JSON.stringify({
      nombre: 'Juan Pérez',
      email: 'juan@negocio.com',
      telefono: '3001234567',
      password: 'contraseña_segura',
      sucursal: 1,
      rol: 'CAJERO',
      puede_hacer_descuentos: true,
      limite_descuento: 50000
    })
  });
  
  const usuario = await response.json();
  // Actualizar lista de usuarios
};
```

### 3. Configurar Impresión
```javascript
// ConfiguracionImpresionScreen.jsx
const handleSaveConfig = async (configData) => {
  const response = await fetch('/api/configuracion-impresion/1/', {
    method: 'PUT',
    body: JSON.stringify({
      nombre_negocio: 'Mi Negocio',
      nit_negocio: '123456789',
      direccion_negocio: 'Calle 1 #123',
      encabezado_ticket: 'Bienvenido',
      pie_pagina_ticket: 'Gracias por su compra',
      ancho_papel: '58mm',
      mostrar_logo: true
    })
  });
};
```

---

## 📊 Servicios Frontend

### sucursalService.js
```javascript
export const sucursalService = {
  // Listar sucursales
  getSucursales: async () => {
    return fetch('/api/sucursales/').then(r => r.json());
  },
  
  // Crear sucursal
  createSucursal: async (sucursalData) => {
    return fetch('/api/sucursales/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sucursalData)
    }).then(r => r.json());
  },
  
  // Actualizar sucursal
  updateSucursal: async (id, sucursalData) => {
    return fetch(`/api/sucursales/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sucursalData)
    }).then(r => r.json());
  },
  
  // Eliminar sucursal
  deleteSucursal: async (id) => {
    return fetch(`/api/sucursales/${id}/`, {
      method: 'DELETE'
    });
  }
};
```

### cajeroService.js
```javascript
export const cajeroService = {
  // Listar cajeros
  getCajeros: async () => {
    return fetch('/api/cajeros/').then(r => r.json());
  },
  
  // Crear cajero
  createCajero: async (cajeroData) => {
    return fetch('/api/cajeros/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cajeroData)
    }).then(r => r.json());
  },
  
  // Login
  login: async (nombre, password) => {
    return fetch('/api/cajeros/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, password })
    }).then(r => r.json());
  }
};
```

---

## 🎨 Estilos Principales

### OtrosScreen.css
```css
.otros-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.module-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.module-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.module-title {
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 10px;
}

.module-description {
  color: #666;
  font-size: 14px;
}
```

---

## 🔐 Validaciones

### Validación de Sucursal
```javascript
const validateSucursal = (sucursalData) => {
  if (!sucursalData.nombre) {
    throw new Error('Nombre de sucursal es requerido');
  }
  
  if (sucursalData.nombre.length < 3) {
    throw new Error('Nombre debe tener al menos 3 caracteres');
  }
  
  return true;
};
```

### Validación de Usuario
```javascript
const validateCajero = (cajeroData) => {
  if (!cajeroData.nombre) {
    throw new Error('Nombre es requerido');
  }
  
  if (!cajeroData.email) {
    throw new Error('Email es requerido');
  }
  
  if (!cajeroData.password || cajeroData.password.length < 6) {
    throw new Error('Contraseña debe tener al menos 6 caracteres');
  }
  
  if (!cajeroData.sucursal) {
    throw new Error('Sucursal es requerida');
  }
  
  return true;
};
```

---

## 📱 Pantalla Principal (OtrosScreen.jsx)

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import GestionSucursales from '../components/common/GestionSucursales';
import GestionUsuarios from '../components/common/GestionUsuarios';

export default function OtrosScreen() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('');
  
  const modules = [
    {
      id: 'sucursales',
      title: 'Gestión de Sucursales',
      description: 'Administrar sucursales del sistema',
      icon: 'business',
      action: () => setActiveModule('sucursales')
    },
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios para POS y Pedidos',
      icon: 'people',
      action: () => setActiveModule('usuarios')
    },
    {
      id: 'impresion',
      title: 'Configuración de Impresión',
      description: 'Configurar tickets, logo y datos del negocio',
      icon: 'print',
      route: '/configuracion/impresion'
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      description: 'Configuraciones generales del sistema',
      icon: 'settings',
      route: '/configuracion'
    }
  ];
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Container className="py-4">
        {activeModule === 'sucursales' ? (
          <GestionSucursales />
        ) : activeModule === 'usuarios' ? (
          <GestionUsuarios />
        ) : (
          <Row>
            {modules.map(module => (
              <Col md={6} lg={4} key={module.id} className="mb-4">
                <Card
                  className="h-100 shadow-sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => module.action ? module.action() : navigate(module.route)}
                >
                  <Card.Body className="text-center p-4">
                    <div className="mb-3">
                      <span className="material-icons" style={{ fontSize: 48 }}>
                        {module.icon}
                      </span>
                    </div>
                    <Card.Title className="h5 mb-3">
                      {module.title}
                    </Card.Title>
                    <Card.Text className="text-muted">
                      {module.description}
                    </Card.Text>
                    <Button variant="outline-primary" size="sm">
                      Acceder
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}
```

---

## 🔄 Integración con Otros Módulos

### Integración con POS
- Los usuarios creados en OTROS funcionan como vendedores en POS
- La sucursal asignada determina dónde opera el usuario

### Integración con PEDIDOS
- Los usuarios creados en OTROS pueden acceder a PEDIDOS
- La sucursal asignada determina qué pedidos ve el usuario

### Integración con INVENTARIO
- La configuración de sucursales afecta la visualización de inventario
- Cada sucursal puede tener su propio inventario

---

## 📊 Reportes

### Reporte de Usuarios por Sucursal
```javascript
const generateUserReport = async () => {
  const response = await fetch('/api/cajeros/');
  const usuarios = await response.json();
  
  return {
    total_usuarios: usuarios.length,
    por_sucursal: agruparPorSucursal(usuarios),
    por_rol: agruparPorRol(usuarios),
    activos: usuarios.filter(u => u.activo).length,
    inactivos: usuarios.filter(u => !u.activo).length
  };
};
```

---

## 🚀 Optimizaciones

1. **Caché de Sucursales**: Se cachean las sucursales
2. **Búsqueda Optimizada**: Búsqueda en cliente
3. **Validación en Cliente**: Validaciones antes de enviar
4. **Actualización Automática**: Los cambios se sincronizan

---

## 📝 Checklist de Implementación

- [ ] Crear componente OtrosScreen
- [ ] Implementar GestionSucursales
- [ ] Crear GestionUsuarios
- [ ] Implementar modales de sucursales
- [ ] Implementar modales de usuarios
- [ ] Integrar con API de sucursales
- [ ] Integrar con API de usuarios
- [ ] Agregar validaciones
- [ ] Crear reportes
- [ ] Optimizar rendimiento

---

**Última actualización**: 17 de Noviembre de 2025
