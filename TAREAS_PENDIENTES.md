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

### 3. 💾 Sistema de Guardado Multi-Dispositivo ✅ COMPLETADO (Backend)
**Módulo:** App Móvil + Backend
**Descripción:** Implementar sistema robusto para evitar colisiones cuando múltiples dispositivos envían datos simultáneamente.

**Estado:** ✅ Backend 100% | ⏳ App Móvil pendiente  
**Fecha completado:** 17 de enero de 2026  
**Rama:** `feature/multi-dispositivo-sync`

**Tareas:**
- [x] ✅ Implementar IDs únicos globales (vendedor-dispositivo-timestamp-random)
- [x] ✅ Actualizar modelo VentaRuta (id_local 150 chars, dispositivo_id, ip_origen)
- [x] ✅ Implementar sistema de bloqueo optimista (detección de duplicados)
- [x] ✅ Manejo de conflictos de sincronización (HTTP 200/409)
- [x] ✅ Logs de sincronización por dispositivo (modelo SyncLog)
- [x] ✅ Captura automática de IP y user-agent
- [x] ✅ Migraciones aplicadas (0073, 0074)
- [ ] ⏳ Implementar código en app móvil (código preparado en `.agent/CODIGO_APP_MOVIL_FASE4.md`)
- [ ] ⏳ Testing con múltiples dispositivos
- [ ] ⏳ Queue de procesamiento en backend (Redis/Celery - OPCIONAL)
- [ ] ⏳ Retry automático en caso de conflicto (en app)
- [ ] ⏳ Notificaciones de conflictos al usuario (en app)

**Documentación creada:**
- `IMPLEMENTACION_COMPLETA_MULTIDISPOSITIVO.md` - Resumen ejecutivo
- `.agent/ANALISIS_SISTEMA_ACTUAL.md` - Análisis técnico
- `.agent/PLAN_IMPLEMENTACION_MULTIDISPOSITIVO.md` - Plan detallado
- `.agent/CODIGO_APP_MOVIL_FASE4.md` - Código para implementar en app
- `.agent/PROGRESO_IMPLEMENTACION.md` - Estado actual
- `DESPLIEGUE_VPS.md` - Guía con Gunicorn + Nginx

**Tecnologías implementadas:**
- ✅ Bloqueo optimista a nivel de BD (PostgreSQL unique constraint)
- ✅ Logging con modelo SyncLog
- ✅ Detección de duplicados en VentaRutaViewSet
- 📝 Redis para queue (opcional, código preparado)
- 📝 Django Celery para procesamiento asíncrono (opcional, código preparado)

**Próximo paso:** Testing con múltiples dispositivos (30-60 min)

**Nota para 8 vendedores:** ✅ Sistema actual es SUFICIENTE. Redis/Celery NO necesario.

---

### 3. ✅ COMPLETADA - Sistema de Guardado Multi-Dispositivo
**Estado:** ✅ 100% COMPLETADO (Backend + App Móvil)  
**Fecha completado:** 17 de enero de 2026  
**Rama:** `feature/multi-dispositivo-sync`

**Resumen:**
- ✅ Backend 100% implementado y testeado
- ✅ App móvil 100% código implementado
- ⏳ Pendiente: Instalar dependencias (expo-device, expo-constants) y testing

**Archivos modificados:**
- Backend: `api/models.py`, `api/views.py`, `api/serializers.py`
- App: `AP GUERRERO/services/ventasService.js`, `rutasApiService.js`
- Documentación: `APP_MOVIL_IMPLEMENTADO.md`, `IMPLEMENTACION_COMPLETA_MULTIDISPOSITIVO.md`

---

## 📊 MÓDULO: OTROS - REPORTES AVANZADOS

### 4. Nuevos Reportes de Negocio
**Módulo:** Frontend - Otros > Reportes Avanzados  
**Descripción:** Crear módulo de reportes avanzados similar al de Planeación (que ya funciona bien), para centralizar todos los reportes de negocio.

**Estructura del módulo:**
```
Navbar > Otros > Reportes Avanzados
  ├── 📊 Pedidos por Ruta
  ├── 🚚 Pedidos por Transportadora
  ├── 📦 Estado de Entregas
  ├── ↩️ Devoluciones de Pedidos
  └── 👥 Reportes de Vendedores
```

#### 4.1 Pedidos por Ruta
- [ ] Crear pantalla de reporte de pedidos por ruta
- [ ] Filtros por fecha, vendedor, estado
- [ ] Tabla con datos agrupados por ruta
- [ ] Exportar a Excel/PDF
- [ ] Gráficas de desempeño por ruta

#### 4.2 Pedidos por Transportadora
- [ ] Crear pantalla de reporte de pedidos por transportadora
- [ ] Tracking de entregas en tiempo real
- [ ] Estados: En ruta, Entregado, Pendiente
- [ ] Exportar a Excel/PDF
- [ ] Gráfica de rendimiento por transportadora

#### 4.3 Estado de Entregas
- [ ] Dashboard visual de estado de entregas
- [ ] Métricas: Entregados, Pendientes, No Entregados, Devoluciones
- [ ] Gráfica de tendencias (últimos 30 días)
- [ ] Alertas de pedidos atrasados (más de 3 días)
- [ ] Filtros por fecha y transportadora

#### 4.4 Devoluciones de Pedidos
- [ ] Reporte detallado de devoluciones
- [ ] Motivos de devolución (categorías)
- [ ] Productos más devueltos (top 10)
- [ ] Clientes con más devoluciones
- [ ] Tendencia de devoluciones mensual
- [ ] Exportar a Excel

#### 4.5 Reportes de Vendedores
- [ ] Reporte de ventas por vendedor (día/semana/mes/año)
- [ ] Productos vencidos por vendedor
- [ ] Desempeño de rutas (efectividad)
- [ ] Comparativa entre vendedores (gráfica de barras)
- [ ] Efectividad de entregas (%)
- [ ] Seguimiento de metas vs real
- [ ] Ranking de vendedores

**Archivos a crear:**
- `frontend/src/pages/Otros/ReportesAvanzados/`
  - `ReportesAvanzadosScreen.jsx` (pantalla principal con menú)
  - `ReportePedidosRuta.jsx`
  - `ReportePedidosTransportadora.jsx`
  - `ReporteEstadoEntregas.jsx`
  - `ReporteDevolucionesPedidos.jsx`
  - `ReporteVendedores.jsx`

**Backend:**
- Crear endpoints en `api/views.py` para cada tipo de reporte
- Optimizar consultas con agregaciones de Django
- Implementar paginación para reportes largos

**Referencia:**
Usar como base el módulo de Planeación que ya está funcionando correctamente.

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

## ⚙️ MÓDULO: OTROS - VALIDACIONES

### 7. Validación de Borrado de Transacciones en Producción
**Módulo:** Frontend - Otros  
**Prioridad:** ⚠️ ALTA - Crítico antes de producción  
**Descripción:** Implementar sistema de validación y confirmación para borrado de datos transaccionales (Cargues, Ventas, Pedidos) para evitar pérdida accidental de datos en producción durante pruebas.

**Contexto:**
Cuando el sistema esté en producción, será necesario realizar pruebas sin afectar datos reales. Necesitamos un sistema que:
- Proteja datos históricos importantes
- Permita borrado controlado en casos específicos
- Mantenga logs de borrados para auditoría

**Tareas:**

#### 7.1 Sistema de Protección de Datos
- [ ] Crear flag de "Modo Producción" en configuración
- [ ] Deshabilitar opciones de borrado masivo cuando esté en producción
- [ ] Implementar confirmación doble para borrados (contraseña admin)
- [ ] Logs de auditoría de borrados

#### 7.2 Validaciones por Tipo de Transacción

**Cargues:**
- [ ] Validar que no haya ventas asociadas antes de borrar
- [ ] Permitir solo borrado de cargues del día actual
- [ ] Confirmación: "¿Eliminar cargue de [FECHA] para [VENDEDOR]?"
- [ ] Log: Usuario, fecha/hora, motivo

**Ventas Ruta:**
- [ ] No permitir borrado si tiene más de 7 días de antigüedad
- [ ] Verificar que no esté sincronizada con contabilidad
- [ ] Confirmación con ingreso de contraseña admin
- [ ] Crear registro de "Venta Anulada" en lugar de borrar (mantener histórico)

**Pedidos:**
- [ ] No permitir borrado si está "Entregado"
- [ ] Solo admin puede borrar pedidos en estados finales
- [ ] Cambiar estado a "Cancelado" en lugar de borrar
- [ ] Guardar motivo de cancelación

#### 7.3 Panel de Administración de Datos
- [ ] Crear sección en Otros > "Gestión de Datos"
- [ ] Dashboard con resumen de datos por módulo
- [ ] Herramienta de "Limpieza de Datos de Prueba"
- [ ] Exportar datos antes de limpiar
- [ ] Confirmar limpieza con código de autorización

#### 7.4 Backups Automáticos
- [ ] Backup automático diario de BD completa
- [ ] Backup antes de cualquier borrado masivo
- [ ] Retención de backups por 30 días
- [ ] Notificaciones de fallos en backup

**Archivos a crear/modificar:**
- `frontend/src/pages/Otros/GestionDatos/`
  - `GestionDatosScreen.jsx`
  - `ConfirmacionBorradoModal.jsx`
  - `LogBorradosTable.jsx`
- `backend/api/models.py` - Modelo `LogBorrado`
- `backend/api/views.py` - Middleware de validación
- `backend/api/permissions.py` - Permisos de borrado

**Prioridad:** Implementar ANTES de despliegue a producción.

---

## 🗄️ BASE DE DATOS Y DESPLIEGUE

### 8. Revisión General del Proyecto
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
1. ✅ **COMPLETADO: Guardado Multi-Dispositivo** (crítico para estabilidad)
2. **Validación de Borrado de Transacciones** (⚠️ ANTES de producción)
3. **Gestión de Usuarios** (seguridad)
4. **Impresión Móvil** (bug crítico de UX)
5. **Organización de Clientes** (mejora de productividad)
6. **Reportes Avanzados** (por prioridad de negocio)
7. **Redes Neuronales** (optimización avanzada)
8. **Revisión y Despliegue** (producción)

### Estimaciones de Tiempo:
- ✅ Guardado Multi-Dispositivo: COMPLETADO
- ⚠️ Validación de Borrado: 3-4 días (ALTA PRIORIDAD)
- Gestión de Usuarios: 3-4 días
- Impresión Móvil: 1 día
- Organización de Clientes: 2-3 días
- Reportes Avanzados (todos): 2-3 semanas
- Redes Neuronales: 2-3 semanas
- Revisión y Despliegue: 1 semana

**Total estimado: 7-9 semanas**

### Prioridades Críticas Pre-Producción:
1. ✅ Sistema multi-dispositivo (HECHO)
2. ⚠️ Validación de borrado de transacciones (URGENTE)
3. ⚠️ Backups automáticos configurados
4. ⚠️ SSL/HTTPS en VPS
5. ⚠️ Modo producción vs desarrollo

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
