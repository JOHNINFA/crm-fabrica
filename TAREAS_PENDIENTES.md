# 📋 TAREAS PENDIENTES - CRM FÁBRICA AREPAS EL GUERRERO

## 🎯 PRIORIDAD ALTA

### 1. 📱 Organización de Clientes por Día (App Móvil)
**Módulo:** App Móvil - Ventas
**Descripción:** Implementar funcionalidad de drag & drop para que los vendedores puedan organizar el orden de visita de sus clientes según el día de la ruta.

**Tareas:**
- [ ] Implementar drag & drop en selector de clientes
- [ ] Guardar orden personalizado por vendedor y día
- [ ] Sincronizar orden con backend
- [ ] Persistir orden en base de datos
- [ ] UI/UX para arrastrar clientes
- [ ] Testear en Android/iOS

**Endpoint requerido:** `POST /api/vendedor/orden-clientes/`

---

### 2. 👥 Unificación de Gestión de Usuarios
**Módulo:** Frontend - Administración
**Descripción:** Crear un sistema unificado para gestionar vendedores, administradores y otros tipos de usuarios con sus contraseñas.

**Tareas:**
- [ ] Crear pantalla única de "Gestión de Usuarios"
- [ ] Fusionar tablas de usuarios si es necesario
- [ ] Sistema de roles y permisos
- [ ] Cambio de contraseñas
- [ ] Activar/desactivar usuarios
- [ ] Historial de accesos
- [ ] Recuperación de contraseñas

**Archivos a modificar:**
- `frontend/src/pages/VendedoresScreen.jsx`
- `frontend/src/pages/ConfiguracionScreen.jsx`
- `backend/usuarios/models.py`
- `backend/usuarios/views.py`

---

### 3. 💾 Sistema de Guardado Multi-Dispositivo
**Módulo:** App Móvil + Backend
**Descripción:** Implementar sistema robusto para evitar colisiones cuando múltiples dispositivos envían datos simultáneamente.

**Tareas:**
- [ ] Implementar sistema de bloqueo optimista (timestamps)
- [ ] Manejo de conflictos de sincronización
- [ ] Queue de procesamiento en backend
- [ ] Logs de sincronización por dispositivo
- [ ] Retry automático en caso de conflicto
- [ ] Notificaciones de conflictos al usuario

**Tecnologías sugeridas:**
- Redis para queue
- Django Celery para procesamiento asíncrono

---

## 📊 REPORTES

### 4. Nuevos Reportes Requeridos
**Módulo:** Frontend - Reportes

#### 4.1 Pedidos por Ruta
- [ ] Crear pantalla de reporte de pedidos por ruta
- [ ] Filtros por fecha, vendedor, estado
- [ ] Exportar a Excel/PDF
- [ ] Gráficas de desempeño

#### 4.2 Pedidos por Transportadora
- [ ] Crear pantalla de reporte de pedidos por transportadora
- [ ] Tracking de entregas
- [ ] Estados de pedidos
- [ ] Exportar a Excel/PDF

#### 4.3 Estado de Entregas
- [ ] Dashboard de estado de entregas
- [ ] Métricas: Entregados, Pendientes, No Entregados, Devoluciones
- [ ] Gráfica de tendencias
- [ ] Alertas de pedidos atrasados

#### 4.4 Devoluciones de Pedidos
- [ ] Reporte detallado de devoluciones
- [ ] Motivos de devolución
- [ ] Productos más devueltos
- [ ] Clientes con más devoluciones

#### 4.5 Reportes de Vendedores
- [ ] Reporte de ventas por vendedor (día/mes/año)
- [ ] Productos vencidos por vendedor
- [ ] Desempeño de rutas
- [ ] Comparativa entre vendedores
- [ ] Efectividad de entregas
- [ ] Seguimiento de metas

**Archivos a crear:**
- `frontend/src/pages/ReportePedidosRuta.jsx`
- `frontend/src/pages/ReportePedidosTransportadora.jsx`
- `frontend/src/pages/ReporteEstadoEntregas.jsx`
- `frontend/src/pages/ReporteDevolucionesPedidos.jsx`
- `frontend/src/pages/ReporteVendedores.jsx`

---

## 🤖 REDES NEURONALES

### 5. Integración de IA para Predicción
**Módulo:** Backend + Frontend
**Descripción:** Activar y mejorar redes neuronales para predicción de producción en diferentes módulos.

#### 5.1 Planeación
- [ ] Activar modelo guardado en Reportes Avanzados
- [ ] Integrar predicción en pantalla de Planeación
- [ ] Mostrar sugerencias basadas en IA
- [ ] Ajustar modelo con datos históricos
- [ ] Validar precisión del modelo

#### 5.2 Cargue
- [ ] Crear modelo de predicción para cargue por vendedor
- [ ] Entrenar con histórico de ventas y devoluciones
- [ ] Sugerencias inteligentes de cantidades
- [ ] Dashboard de precisión del modelo

#### 5.3 Ventas (App Móvil)
- [ ] Predicción de demanda por cliente
- [ ] Sugerencias de productos más vendidos
- [ ] Alertas de productos con baja rotación
- [ ] Optimización de rutas con IA

**Tecnologías:**
- TensorFlow/PyTorch
- Scikit-learn
- API REST para predicciones

**Archivos:**
- `backend/ml/prediccion_planeacion.py`
- `backend/ml/prediccion_cargue.py`
- `backend/ml/prediccion_ventas.py`

---

## 🖨️ IMPRESIÓN

### 6. Revisión de Impresión Móvil
**Módulo:** App Móvil - Printer Service
**Descripción:** Corregir problema de ícono oscuro en tickets impresos desde la app móvil.

**Tareas:**
- [ ] Revisar `printerService.js`
- [ ] Verificar formato de logo/icono
- [ ] Ajustar contraste de impresión
- [ ] Testear en diferentes modelos de impresoras
- [ ] Validar en Android/iOS

**Archivo:**
- `AP GUERRERO/services/printerService.js`

---

## 🗄️ BASE DE DATOS Y DESPLIEGUE

### 7. Revisión General del Proyecto
**Descripción:** Revisión exhaustiva antes de despliegue final en producción.

#### 7.1 Base de Datos
- [ ] Revisar esquema de todas las tablas
- [ ] Optimizar índices
- [ ] Eliminar campos obsoletos
- [ ] Normalización de datos
- [ ] Migraciones pendientes
- [ ] Backups automáticos configurados

#### 7.2 Despliegue en VPS Hostinger
- [ ] Configurar entorno de producción
- [ ] Variables de entorno
- [ ] SSL/HTTPS
- [ ] Nginx configuración
- [ ] Gunicorn/uWSGI
- [ ] Servicio systemd para backend
- [ ] PM2 para frontend (si aplica)
- [ ] Logs centralizados
- [ ] Monitoreo con Sentry o similar
- [ ] Backup automático de BD
- [ ] Plan de rollback

**Checklist Pre-Despliegue:**
- [ ] Todas las APIs documentadas
- [ ] Tests unitarios pasando
- [ ] Tests de integración
- [ ] Variables sensibles en .env
- [ ] DEBUG = False en producción
- [ ] ALLOWED_HOSTS configurado
- [ ] CORS configurado correctamente
- [ ] Archivos estáticos compilados
- [ ] Migraciones aplicadas

---

## 📝 NOTAS IMPORTANTES

### Orden de Implementación Sugerido:
1. **Guardado Multi-Dispositivo** (crítico para estabilidad)
2. **Gestión de Usuarios** (seguridad)
3. **Impresión Móvil** (bug crítico de UX)
4. **Organización de Clientes** (mejora de productividad)
5. **Reportes** (por prioridad de negocio)
6. **Redes Neuronales** (optimización avanzada)
7. **Revisión y Despliegue** (producción)

### Estimaciones de Tiempo:
- Guardado Multi-Dispositivo: 2-3 días
- Gestión de Usuarios: 3-4 días
- Impresión Móvil: 1 día
- Organización de Clientes: 2-3 días
- Reportes (todos): 1-2 semanas
- Redes Neuronales: 2-3 semanas
- Revisión y Despliegue: 1 semana

**Total estimado: 6-8 semanas**

---

## 🔗 Enlaces Útiles

- [Documentación Django](https://docs.djangoproject.com/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Hostinger VPS Docs](https://www.hostinger.com/tutorials/vps)

---

**Última actualización:** 17 de enero de 2026
**Responsable:** Equipo de Desarrollo CRM
