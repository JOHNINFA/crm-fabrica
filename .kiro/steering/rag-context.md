---
inclusion: always
---

# 🤖 CONTEXTO RAG - CRM FÁBRICA

## Instrucciones para la IA

Eres un asistente experto en el proyecto **CRM Fábrica**. Tienes acceso a toda la información del proyecto a través de este contexto RAG.

### Reglas Importantes:

1. **Siempre consulta el contexto** antes de responder preguntas sobre el proyecto
2. **Sé específico** - Referencia archivos, modelos, componentes exactos
3. **Mantén la documentación actualizada** - Si sugieres cambios, actualiza la documentación
4. **Entiende la arquitectura** - El proyecto tiene 3 capas: Backend (Django), Frontend (React), Mobile (React Native)
5. **Respeta la estructura** - Sigue los patrones existentes en el código

---

## 📋 Estructura del Proyecto

### Backend (Django/Python)
- **Ubicación**: `backend_crm/` + `api/`
- **Modelos principales**: Producto, Cliente, Venta, Cargue, Stock
- **APIs**: REST Framework con endpoints para todas las operaciones
- **Base de datos**: PostgreSQL con esquema normalizado

### Frontend (React)
- **Ubicación**: `frontend/src/`
- **Componentes**: Modular, reutilizable
- **Estado**: Redux para gestión global
- **Estilos**: CSS/SCSS con Bootstrap

### App Móvil (React Native)
- **Ubicación**: `AP GUERRERO/`
- **Framework**: Expo
- **Funcionalidades**: Cargue, Ventas, Rutas, Sincronización
- **Almacenamiento**: AsyncStorage + Firebase

---

## 🔑 Conceptos Clave

### Modelos de Datos

**Producto**
- Nombre, descripción, precio, stock
- Categoría, marca, código de barras
- Disponibilidad por módulo (POS, Cargue, App, etc.)

**Cliente**
- Información personal y de contacto
- Tipo de negocio, régimen fiscal
- Productos frecuentes por día
- Cupo de crédito

**Venta**
- Número de factura único
- Detalles de productos vendidos
- Método de pago, estado
- Trazabilidad completa

**Cargue** (ID1, ID2, ID3, ID4, ID5)
- Registro diario de vendedores
- Productos cargados, vendidos, devueltos
- Control de cumplimiento
- Resumen de pagos

**Stock**
- Cantidad actual por producto
- Sincronización con Producto.stock_total
- Historial de movimientos

### Flujos Principales

1. **Cargue**: Vendedor carga productos → Sistema registra → App sincroniza
2. **Venta**: Cliente compra → POS registra → Stock se actualiza
3. **Devolución**: Producto devuelto → Stock se incrementa → Reporte
4. **Sincronización**: App ↔ Backend en tiempo real

---

## 🔄 Sincronización en Tiempo Real (Cargue)

### Arquitectura de Sincronización

El módulo de Cargue implementa un sistema de sincronización bidireccional entre:
- **CRM Web** (frontend/src/components/Cargue/)
- **Base de Datos** (tablas CargueID1-6)
- **App Móvil** (React Native)

### Componentes Clave

**1. Polling Inteligente (Frontend)**
- **Archivo**: `frontend/src/components/Cargue/PlantillaOperativa.jsx`
- **Frecuencia**: Cada 4 segundos
- **Endpoint**: `/api/cargue/verificar-actualizaciones/`
- **Función**: Detecta cambios en la BD comparando timestamps

**2. Sincronización en Tiempo Real (Frontend)**
- **Servicio**: `frontend/src/services/cargueRealtimeService.js`
- **Debounce**: 1.5 segundos (evita saturar el servidor)
- **Método**: PATCH parcial (solo actualiza campos modificados)

**3. Endpoint de Verificación (Backend)**
- **Archivo**: `api/views.py` → función `verificar_actualizaciones`
- **Método**: GET ultraligero
- **Respuesta**: `{ last_update: "2026-02-13T04:25:30.123Z" }`

### Flujo de Sincronización

#### Escenario 1: Usuario escribe en CRM Web
```
1. Usuario escribe "devoluciones: 5" en navegador normal
2. Estado local se actualiza inmediatamente (UX instantánea)
3. Se activa bandera cambioManualRef = true (pausa polling)
4. Después de 1.5s → Debounce sincroniza con BD (PATCH)
5. Campo fecha_actualizacion se actualiza automáticamente
6. Después de 3s → Bandera se resetea (polling se reactiva)
7. Navegador incógnito detecta cambio en máximo 4s
8. Carga datos frescos desde BD → Ve "devoluciones: 5" ✅
```

#### Escenario 2: App Móvil envía datos
```
1. App envía: cantidad=10, adicional=2, dctos=1
2. Backend hace PATCH en tabla CargueID1
3. Campo fecha_actualizacion se actualiza automáticamente
4. CRM Web detecta cambio en máximo 4s (polling)
5. Carga datos frescos desde BD
6. Muestra: cantidad=10, adicional=2, dctos=1
7. Preserva: devoluciones y vencidas (si fueron escritas en CRM) ✅
```

### Protección Anti-Rebote

**Problema**: El polling recargaba datos antes de que se sincronizaran, causando parpadeos.

**Solución**:
```javascript
// Cuando usuario edita
cambioManualRef.current = true; // Pausa polling

// Después de 3 segundos
setTimeout(() => {
    cambioManualRef.current = false; // Reactiva polling
}, 3000);
```

**Resultado**: El polling espera a que el debounce (1.5s) sincronice antes de recargar.

### Campos Exclusivos por Origen

| Campo | CRM Web | App Móvil | Notas |
|-------|---------|-----------|-------|
| cantidad | ❌ | ✅ | Solo desde app |
| adicional | ✅ | ✅ | Ambos pueden modificar |
| dctos | ✅ | ✅ | Ambos pueden modificar |
| devoluciones | ✅ | ❌ | Solo desde CRM |
| vencidas | ✅ | ❌ | Solo desde CRM |
| lotes_vencidos | ✅ | ❌ | Solo desde CRM |
| v (vendedor check) | ❌ | ✅ | Solo desde app |
| d (despachador check) | ✅ | ❌ | Solo desde CRM |

### Regla de Oro

**El último que escribe gana. La BD es la fuente de verdad.**

- Si CRM escribe devoluciones=20 y luego App envía devoluciones=10 → Queda en 10
- Si App envía cantidad=10 y luego CRM escribe cantidad=5 → Queda en 5
- Django REST Framework hace PATCH parcial: solo actualiza campos enviados

### Tiempos de Sincronización

- **CRM → BD**: 1.5 segundos (debounce)
- **BD → CRM**: Máximo 4 segundos (polling)
- **Latencia total**: Máximo 6 segundos entre ventanas

### Debugging

Para verificar sincronización, revisar logs en consola del navegador:
```
🔍 Polling URL: /api/cargue/verificar-actualizaciones/...
📡 Respuesta polling: { last_update: "..." }
⏰ Comparando tiempos: Local=... Remoto=...
🚀 CAMBIO REMOTO DETECTADO
🔄 ID1 - Sincronizando datos frescos...
📦 AREPA TIPO OBLEA: devoluciones=5, vencidas=6
✅ Datos locales están actualizados
```

### Archivos Relacionados

- `frontend/src/components/Cargue/PlantillaOperativa.jsx` - Componente principal
- `frontend/src/services/cargueRealtimeService.js` - Sincronización en tiempo real
- `api/views.py` - Endpoints de verificación y actualización
- `api/models.py` - Modelos CargueID1-6 con fecha_actualizacion

---

## 🛠️ Tecnologías

### Backend
- Django 4.2.2
- Django REST Framework
- PostgreSQL
- Gunicorn (producción)

### Frontend
- React 18+
- Redux
- Bootstrap
- Axios

### Mobile
- React Native
- Expo
- Firebase
- AsyncStorage

### Infraestructura
- Docker (desarrollo y producción)
- Nginx (proxy reverso)
- VPS (aglogistics.tech)
- SSL/TLS

---

## 📚 Cómo Usar Este Contexto

### Para Entender el Proyecto
```
"¿Cómo funciona el flujo de cargue?"
"¿Cuál es la estructura de la base de datos?"
"¿Cómo se sincroniza la app móvil?"
```

### Para Implementar Cambios
```
"Necesito agregar un nuevo campo a Producto"
"¿Cómo creo un nuevo endpoint de API?"
"¿Dónde debo actualizar el componente de ventas?"
```

### Para Debugging
```
"¿Por qué no se sincroniza el stock?"
"¿Cuál es el flujo de autenticación?"
"¿Cómo se manejan los errores?"
```

---

## 🔄 Actualización Automática

Este contexto se actualiza automáticamente cuando:
- Se indexa el código (ejecutar `python .kiro/rag/indexer.py`)
- Se modifica la documentación
- Se agregan nuevos archivos al proyecto

**Última actualización**: Generada automáticamente por RAG Indexer

---

## 📞 Contacto y Soporte

Para preguntas sobre:
- **Arquitectura**: Revisar `backend_crm/settings.py` y `api/models.py`
- **APIs**: Revisar `api/views.py` y `api/urls.py`
- **Frontend**: Revisar `frontend/src/components/` y `frontend/src/pages/`
- **Mobile**: Revisar `AP GUERRERO/components/` y `AP GUERRERO/services/`

---

## ✅ Checklist para Cambios

Cuando hagas cambios al proyecto:

- [ ] Actualizar modelos si es necesario
- [ ] Crear/actualizar migraciones
- [ ] Actualizar APIs si cambian endpoints
- [ ] Actualizar componentes frontend/mobile
- [ ] Ejecutar tests
- [ ] Actualizar documentación
- [ ] Ejecutar indexador RAG: `python .kiro/rag/indexer.py`
- [ ] Verificar que el contexto se actualice

---

**🚀 Recuerda**: Este contexto es tu fuente de verdad sobre el proyecto. Úsalo para tomar decisiones informadas y mantener la consistencia.
