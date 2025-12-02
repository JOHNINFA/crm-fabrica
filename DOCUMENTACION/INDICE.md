# 📚 Índice de Documentación - Sistema Integrado de Gestión

## 📖 Documentos Disponibles

### 1. **README_GENERAL.md** - Visión General del Sistema
   - Arquitectura general
   - Estructura del proyecto
   - Flujo de comunicación
   - Módulos principales
   - Modelos de datos
   - Flujos de negocio
   - Autenticación y permisos
   - Instalación y configuración
   - Endpoints API principales
   - Estilos y temas
   - Reportes y análisis

**Lectura recomendada**: Comienza aquí para entender la arquitectura general.

---

### 2. **README_POS.md** - Módulo de Punto de Venta
   - Descripción del módulo POS
   - Funcionalidades principales
   - Estructura de componentes
   - Modelos de datos (Venta, DetalleVenta)
   - Endpoints API
   - Flujo de venta completo
   - Servicios frontend
   - Estilos CSS
   - Validaciones
   - Pantalla principal (código)
   - Integración con otros módulos
   - Reportes
   - Optimizaciones

**Lectura recomendada**: Para implementar o entender el sistema de ventas.

---

### 3. **README_CARGUE.md** - Módulo de Cargue Operativo
   - Descripción del módulo CARGUE
   - Funcionalidades principales
   - Estructura de componentes
   - Modelos de datos (CargueID1-ID6)
   - Endpoints API
   - Flujo de cargue completo
   - Servicios frontend
   - Estilos CSS
   - Validaciones
   - Pantalla principal (código)
   - Integración con otros módulos
   - Reportes
   - Optimizaciones

**Lectura recomendada**: Para implementar el sistema operativo de vendedores.

---

### 4. **README_INVENTARIO.md** - Módulo de Inventario
   - Descripción del módulo INVENTARIO
   - Funcionalidades principales
   - Estructura de componentes
   - Modelos de datos (Producto, MovimientoInventario, Lote, Planeación)
   - Endpoints API
   - Flujo de inventario completo
   - Servicios frontend
   - Estilos CSS
   - Validaciones
   - Pantalla principal (código)
   - Integración con otros módulos
   - Reportes
   - Optimizaciones

**Lectura recomendada**: Para gestionar stock y movimientos de inventario.

---

### 5. **README_PEDIDOS.md** - Módulo de Pedidos
   - Descripción del módulo PEDIDOS
   - Funcionalidades principales
   - Estructura de componentes
   - Modelos de datos (Pedido, DetallePedido)
   - Endpoints API
   - Flujo de pedido completo
   - Servicios frontend
   - Estilos CSS
   - Validaciones
   - Pantalla principal (código)
   - Integración con otros módulos
   - Reportes
   - Optimizaciones

**Lectura recomendada**: Para gestionar pedidos de clientes.

### 6. **README_OTROS.md** - Módulo de Administración y Configuración
   - Descripción del módulo OTROS
   - Funcionalidades principales (Sucursales, Usuarios, Impresión, Configuración)
   - Estructura de componentes
   - Modelos de datos (Sucursal, Cajero, ConfiguracionImpresion)
   - Endpoints API
   - Flujo de administración
   - Servicios frontend
   - Estilos CSS
   - Validaciones
   - Pantalla principal (código)
   - Integración con otros módulos
   - Reportes
   - Optimizaciones

**Lectura recomendada**: Para administrar sucursales, usuarios y configuración del sistema.

---



---

## 🗺️ Mapa de Navegación

```
DOCUMENTACION/
├── README_GENERAL.md          ← COMIENZA AQUÍ
├── README_POS.md              ← Módulo POS
├── README_CARGUE.md           ← Módulo CARGUE
├── README_INVENTARIO.md       ← Módulo INVENTARIO
├── README_PEDIDOS.md          ← Módulo PEDIDOS
├── README_TRAZABILIDAD.md     ← Módulo TRAZABILIDAD
└── INDICE.md                  ← Este archivo
```

---

## 🎯 Guía de Lectura por Rol

### Para Desarrollador Backend
1. **README_GENERAL.md** - Entender la arquitectura
2. **Modelos de datos** en cada README de módulo
3. **Endpoints API** en cada README de módulo
4. **Validaciones** en cada README de módulo

### Para Desarrollador Frontend
1. **README_GENERAL.md** - Entender la arquitectura
2. **Estructura de componentes** en cada README de módulo
3. **Servicios frontend** en cada README de módulo
4. **Estilos CSS** en cada README de módulo
5. **Pantalla principal (código)** en cada README de módulo

### Para Product Manager
1. **README_GENERAL.md** - Visión general
2. **Funcionalidades principales** en cada README de módulo
3. **Flujos de negocio** en README_GENERAL.md
4. **Reportes** en cada README de módulo

### Para QA/Tester
1. **README_GENERAL.md** - Entender el sistema
2. **Funcionalidades principales** en cada README de módulo
3. **Validaciones** en cada README de módulo
4. **Flujos de negocio** en README_GENERAL.md

### Para DevOps/Infraestructura
1. **README_GENERAL.md** - Instalación y configuración
2. **Variables de entorno** en README_GENERAL.md
3. **Base de datos** en README_GENERAL.md

---

## 📊 Matriz de Módulos

| Módulo | Usuarios | Funcionalidad Principal | Incluye |
|--------|----------|------------------------|---------|
| **POS** | Cajeros, Vendedores | Registrar ventas | Caja, Historial de ventas |
| **CARGUE** | Vendedores, Supervisores | Operativo en ruta | Despacho, Pagos, Cumplimiento |
| **INVENTARIO** | Almacenistas, Supervisores | Gestión de stock | Movimientos, Kardex (Trazabilidad), Lotes |
| **PEDIDOS** | Vendedores, Despachadores | Gestión de pedidos | Clientes, Historial de pedidos |
| **OTROS** | Administradores | Administración del sistema | Sucursales, Usuarios, Impresión, Configuración |

---

## 🔄 Flujos de Integración

### Flujo 1: Venta en POS
```
POS → Venta → DetalleVenta → MovimientoInventario (SALIDA)
  ↓
Inventario actualizado
  ↓
Planeación actualizada
  ↓
Trazabilidad registrada
```

### Flujo 2: Cargue de Vendedor
```
Cargue → Registro de despacho → Actualización de planeación
  ↓
Movimientos de inventario
  ↓
Resumen de ventas
  ↓
Trazabilidad registrada
```

### Flujo 3: Creación de Pedido
```
Pedido → DetallePedido → Actualización de planeación
  ↓
Reserva de stock
  ↓
Actualización de cargue
  ↓
Trazabilidad registrada
```

---

## 🛠️ Herramientas y Tecnologías

### Backend
- **Framework**: Django 5.1.7
- **API**: Django REST Framework
- **Base de Datos**: PostgreSQL
- **Autenticación**: Token-based
- **CORS**: django-cors-headers

### Frontend
- **Framework**: React 19.1.0
- **Enrutamiento**: React Router 7.5.0
- **UI**: Bootstrap 5.3.6
- **Iconos**: Bootstrap Icons, React Icons
- **Calendario**: React Calendar 5.0.0

### Desarrollo
- **Backend**: Python 3.x, pip
- **Frontend**: Node.js, npm
- **Control de versiones**: Git
- **Servidor de desarrollo**: Django runserver, npm start

---

## 📝 Convenciones de Código

### Backend (Python/Django)
- Nombres de modelos: PascalCase (ej: `Producto`, `MovimientoInventario`)
- Nombres de campos: snake_case (ej: `stock_total`, `fecha_creacion`)
- Nombres de métodos: snake_case (ej: `get_queryset()`, `save()`)
- Nombres de vistas: PascalCase + ViewSet (ej: `ProductoViewSet`)

### Frontend (React/JavaScript)
- Nombres de componentes: PascalCase (ej: `ProductList`, `CartItem`)
- Nombres de archivos: PascalCase para componentes (ej: `ProductList.jsx`)
- Nombres de funciones: camelCase (ej: `handleAddToCart`, `loadProducts`)
- Nombres de variables: camelCase (ej: `cartItems`, `selectedProduct`)

---

## 🔐 Seguridad

### Autenticación
- Endpoints públicos sin autenticación (desarrollo)
- En producción: implementar JWT o Token-based auth

### Validación
- Validación en cliente (UX)
- Validación en servidor (seguridad)
- Validación de tipos en serializers

### CORS
- Configurado en `settings.py`
- Permite localhost:3000 en desarrollo
- Configurar dominios específicos en producción

---

## 📞 Soporte y Contacto

Para reportar bugs, sugerencias o preguntas:
- Contactar al equipo de desarrollo
- Crear issue en el repositorio
- Revisar la documentación existente

---

## 📅 Historial de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-11-17 | 1.0 | Documentación inicial completa |

---

## ✅ Checklist de Implementación Completa

### Backend
- [ ] Modelos de datos
- [ ] Serializers
- [ ] ViewSets
- [ ] URLs/Rutas
- [ ] Validaciones
- [ ] Migraciones
- [ ] Tests

### Frontend
- [ ] Componentes
- [ ] Servicios API
- [ ] Context/Estado
- [ ] Estilos CSS
- [ ] Validaciones
- [ ] Tests

### Integración
- [ ] CORS configurado
- [ ] API funcionando
- [ ] Frontend conectado
- [ ] Flujos de negocio validados

### Deployment
- [ ] Variables de entorno
- [ ] Base de datos configurada
- [ ] Servidor backend corriendo
- [ ] Servidor frontend corriendo
- [ ] HTTPS configurado (producción)

---

## 🚀 Próximos Pasos

1. **Leer README_GENERAL.md** para entender la arquitectura
2. **Seleccionar un módulo** según tu rol
3. **Leer el README específico** del módulo
4. **Revisar el código** en el repositorio
5. **Implementar o modificar** según sea necesario
6. **Probar** los flujos de negocio
7. **Reportar** bugs o sugerencias

---

**Última actualización**: 17 de Noviembre de 2025

**Versión**: 1.0

**Estado**: ✅ Completo
