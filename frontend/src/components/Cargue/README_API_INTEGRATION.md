# 🚀 INTEGRACIÓN CON API - MÓDULO CARGUE

## 📋 ESTADO ACTUAL

**⚠️ IMPORTANTE: La integración con API está PREPARADA pero NO ACTIVA**

- ✅ Todos los servicios y componentes están creados
- ✅ La funcionalidad está completamente implementada
- ❌ **NO está activada** para evitar conflictos durante desarrollo
- 🔄 Se activará cuando se complete la integración con React Native

## 🏗️ ARQUITECTURA DE LA INTEGRACIÓN

### **Flujo de Datos Completo:**
```
React Native App → Django API → React Web App
     (móvil)         ↓            (escritorio)
                 PostgreSQL
                     ↓
                localStorage (cache)
```

### **Componentes Creados:**

1. **`cargueApiService.js`** - Servicio principal de API
2. **`ApiIntegrationWrapper.jsx`** - Wrapper para componentes
3. **`useCargueApi.js`** - Hook personalizado
4. **`ApiStatusIndicator.jsx`** - Indicadores visuales
5. **`cargueApiUtils.js`** - Utilidades y herramientas

## 🔧 SERVICIOS IMPLEMENTADOS

### **1. cargueApiService.js**

```javascript
// Cargar datos desde servidor
await cargueApiService.cargarDatosDesdeServidor(dia, idSheet, fecha);

// Sincronizar datos al servidor  
await cargueApiService.sincronizarDatosAlServidor(dia, idSheet, fecha, productos);

// Verificar conexión
await cargueApiService.verificarConexion();
```

### **2. cargueHybridService.js**

```javascript
// Sistema híbrido: localStorage + API
await cargueHybridService.cargarDatos(dia, idSheet, fecha);
await cargueHybridService.guardarDatos(dia, idSheet, fecha, productos);
```

### **3. Configuración**

```javascript
// Estado actual (DESACTIVADO)
cargueApiConfig.USAR_API = false;

// Para activar más adelante:
cargueApiConfig.activarIntegracion();
```

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### **✅ Carga Automática de Datos**
- Detecta automáticamente si hay datos en el servidor
- Carga datos desde React Native → Django → React Web
- Cache local en localStorage para mejor rendimiento

### **✅ Sincronización Bidireccional**
- React Web → Django: Checkboxes V/D, ajustes, cumplimiento
- Django → React Web: Cantidades desde React Native
- Sincronización automática con debounce de 3 segundos

### **✅ Sistema Híbrido**
- **localStorage**: Almacenamiento inmediato y cache local
- **PostgreSQL**: Persistencia permanente y sincronización
- **Fallback inteligente**: localStorage → API → datos vacíos

### **✅ Gestión de Estados**
- Indicadores visuales de conexión
- Manejo de errores y reintentos
- Logs detallados para debugging

### **✅ Migración de Datos**
- Herramientas para migrar datos existentes de localStorage a servidor
- Verificación de integridad de datos
- Utilidades de desarrollo y testing

## 🚀 CÓMO ACTIVAR LA INTEGRACIÓN

### **Paso 1: Activar la configuración**
```javascript
// En cargueApiService.js cambiar:
USAR_API: false  →  USAR_API: true

// O usar la función:
cargueApiConfig.activarIntegracion();
```

### **Paso 2: Verificar endpoints del backend**
```javascript
// Asegurar que estos endpoints estén disponibles:
GET/POST /api/cargues/
GET/POST /api/detalle-cargues/  
GET/POST /api/lotes-vencidos/
GET/POST /api/control-cumplimiento/
```

### **Paso 3: Integrar en PlantillaOperativa**
```javascript
// Envolver componente con ApiIntegrationWrapper
<ApiIntegrationWrapper 
  dia={dia} 
  idSheet={idSheet} 
  fechaSeleccionada={fechaSeleccionada}
>
  <PlantillaOperativa />
</ApiIntegrationWrapper>
```

### **Paso 4: Usar el hook en componentes**
```javascript
const { 
  datos, 
  cargarDatos, 
  guardarDatos, 
  conectado 
} = useCargueApi(dia, idSheet, fechaSeleccionada);
```

## 📊 ENDPOINTS DE API REQUERIDOS

### **Cargues Operativos**
```
GET    /api/cargues/?dia=LUNES&vendedor=1&fecha=2025-01-22
POST   /api/cargues/
PATCH  /api/cargues/{id}/
```

### **Detalles de Cargue**
```
GET    /api/detalle-cargues/?cargue_operativo={id}
POST   /api/detalle-cargues/
PATCH  /api/detalle-cargues/{id}/
```

### **Lotes Vencidos**
```
GET    /api/lotes-vencidos/?detalle_cargue={id}
POST   /api/lotes-vencidos/
```

### **Control de Cumplimiento**
```
GET    /api/control-cumplimiento/?dia=LUNES&id_sheet=ID1&fecha=2025-01-22
POST   /api/control-cumplimiento/
PATCH  /api/control-cumplimiento/{id}/
```

## 🔍 HERRAMIENTAS DE DESARROLLO

### **Utilidades disponibles en consola:**
```javascript
// Activar API temporalmente (solo desarrollo)
devUtils.activarApiTemporal();

// Simular datos del servidor
devUtils.simularDatosServidor('LUNES', 'ID1', '2025-01-22');

// Mostrar estadísticas
devUtils.mostrarEstadisticas();

// Migrar datos existentes
migracionUtils.migrarDatosAServidor();

// Verificar integridad
migracionUtils.verificarIntegridad();
```

### **Componentes de monitoreo:**
```javascript
// Indicador de estado en tiempo real
<ApiStatusIndicator position="top-right" showDetails={true} />

// Badge para menús
<ApiStatusBadge />

// Panel de control completo
<ApiControlPanel />
```

## ⚡ BENEFICIOS DE LA INTEGRACIÓN

### **🚀 Para el Usuario:**
- Datos automáticos desde React Native
- Sincronización en tiempo real
- Sin pérdida de datos
- Mejor experiencia de usuario

### **🔧 Para el Desarrollo:**
- Sistema híbrido robusto
- Fallback automático
- Logs detallados
- Herramientas de debugging

### **📊 Para la Operación:**
- Datos centralizados en PostgreSQL
- Backup automático
- Trazabilidad completa
- Reportes unificados

## 🎯 PRÓXIMOS PASOS

1. **Completar backend Django** con todos los endpoints
2. **Probar integración** con datos simulados
3. **Conectar con React Native** para flujo completo
4. **Activar en producción** cuando esté todo listo
5. **Migrar datos existentes** de localStorage a servidor

## 📝 NOTAS IMPORTANTES

- **No activar hasta completar backend**: Evita errores de conexión
- **Mantener localStorage**: Sigue siendo el cache principal
- **Probar con datos simulados**: Usar devUtils para testing
- **Monitorear logs**: DEBUG_LOGS está activado por defecto
- **Backup antes de migrar**: Los datos existentes son importantes

---

**🎯 RESUMEN: Todo está listo para activar, solo falta completar la integración con React Native y activar la configuración.**