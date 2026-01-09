# 📚 ÍNDICE MAESTRO - DOCUMENTACIÓN CRM FÁBRICA

## 📅 Actualización: 2026-01-05
## 🎯 Guía de lectura de toda la documentación

---

## 🗂️ **DOCUMENTOS DISPONIBLES**

### **1. ESTE ARCHIVO** (INDICE_DOCUMENTACION.md)
**Tiempo de lectura:** 5 minutos  
**Propósito:** Guía de navegación por toda la documentación

---

### **2. RESUMEN_ANALISIS.md** ⭐ **EMPEZAR AQUÍ**
**Tiempo de lectura:** 15 minutos  
**Propósito:** Overview rápido de TODO el sistema

**Contenido:**
- ✅ Resumen ejecutivo del proyecto
- ✅ Métricas generales (código, componentes, endpoints)
- ✅ Estado del sistema (completo, funcionando)
- ✅ Sistema de IA (dónde está, dónde NO está)
- ✅ Aclaraciones importantes
- ✅ Próximos pasos
- ✅ Quick links

**Leer si:**
- Es tu primer acercamiento al proyecto
- Necesitas entender qué hace el sistema
- Quieres saber el estado actual
- Necesitas aclaraciones rápidas

---

### **3. ARQUITECTURA_SISTEMA_CRM.md**
**Tiempo de lectura:** 30 minutos  
**Propósito:** Mapa general del sistema

**Contenido:**
- ✅ Diagrama de arquitectura
- ✅ Backend + Frontend + App + BD
- ✅ Sistema de IA (resumen)
- ✅ App móvil (resumen)
- ✅ Flujos de negocio
- ✅ Zonas críticas (qué NO tocar)
- ✅ Referencias a otros documentos

**Leer si:**
- Necesitas entender la estructura general
- Vas a modificar componentes
- Necesitas conocer flujos de datos
- Buscas dónde está cada funcionalidad

---

### **4. DOCUMENTACION_APP_MOVIL.md**
**Tiempo de lectura:** 45 minutos  
**Propósito:** Detalle completo de la app React Native

**Contenido:**
- ✅ Arquitectura de la app (AP GUERRERO)
- ✅ Navegación detallada
- ✅ Cada módulo explicado CORRECTAMENTE:
  - Ventas (registro en ruta)
  - Cargue (consultar y marcar checks)
  - Sugerido (crear cargue MANUAL, NO IA)
  - Rendimiento (ver estadísticas)
  - Rutas (gestión de clientes)
- ✅ Servicios de la app
- ✅ Endpoints que utiliza
- ✅ Flujo diario completo
- ✅ Aclaraciones sobre nombres confusos

**Leer si:**
- Vas a modificar la app móvil
- Necesitas entender cómo funciona "Sugerido"
- Quieres saber qué hace cada pantalla
- Necesitas integrar app ↔ web

---

### **5. PLAN_INTEGRACION_IA.md**
**Tiempo de lectura:** 30 minutos  
**Propósito:** Estado y plan de mejora del módulo de IA

**Contenido:**
- ✅ Aclaración: IA solo en WEB (no en app)
- ✅ Estado actual (5 modelos entrenados)
- ✅ Arquitectura de red neuronal (64→32→16→1)
- ✅ Qué hace el servicio `ia_service.py`
- ✅ Cómo funciona la integración con Planeación
- ✅ Plan de mejora en 4 fases:
  1. Entrenar 67 modelos restantes
  2. Tracking de precisión
  3. Panel de administración
  4. Optimización
- ✅ Código de ejemplo
- ✅ Métricas de éxito

**Leer si:**
- Vas a trabajar con el módulo de IA
- Necesitas entrenar nuevos modelos
- Quieres crear el panel admin de IA
- Necesitas optimizar predicciones

---

### **6. REFERENCIA_MODELOS_API.md** 📖 **REFERENCIA TÉCNICA**
**Tiempo de lectura:** 60-90 minutos  
**Propósito:** Detalle completo de modelos de BD y endpoints

**Contenido:**
- ✅ 40+ modelos de Django documentados
- ✅ Cada modelo con:
  - Todos los campos
  - Tipos de datos
  - Relaciones FK
  - Métodos save() automáticos ⚠️
  - Unique constraints
  - Usos
- ✅ 50+ endpoints API documentados
- ✅ Cada endpoint con:
  - Método HTTP
  - Parámetros
  - Body de ejemplo
  - Response de ejemplo
  - Comportamientos especiales
- ✅ Resumen rápido al final

**Leer si:**
- Vas a crear/modificar modelos de BD
- Necesitas usar un endpoint específico
- Quieres entender las relaciones de BD
- Necesitas saber qué save() son automáticos

**Secciones principales:**
1. Productos e Inventario
2. Ventas (POS)
3. Clientes
4. Cargue (6 vendedores)
5. Planeación (con IA)
6. Pedidos
7. Turnos y Caja
8. App Móvil
9. Otros modelos

---

### **7. REFERENCIA_FRONTEND.md** 📖 **REFERENCIA TÉCNICA**
**Tiempo de lectura:** 60-90 minutos  
**Propósito:** Detalle completo del frontend React

**Contenido:**
- ✅ 40 páginas documentadas
- ✅ 141 componentes organizados
- ✅ 13 contextos explicados
- ✅ 24 servicios documentados
- ✅ Flujos de datos
- ✅ Sincronización app ↔ web
- ✅ Hooks personalizados
- ✅ Guía para nuevo desarrollador

**Leer si:**
- Vas a modificar el frontend
- Necesitas crear un nuevo componente
- Quieres usar un contexto existente
- Necesitas llamar a un endpoint
- Buscas dónde está una funcionalidad

**Secciones principales:**
1. Páginas (40)
2. Componentes (141)
3. Contextos (13)
4. Servicios (24)
5. Estilos (CSS)
6. Hooks personalizados
7. Flujos de datos

---

## 🎯 **ORDEN DE LECTURA RECOMENDADO**

### **Si es tu PRIMERA VEZ:**
```
1. RESUMEN_ANALISIS.md (15 min)
   → Entender qué es el sistema

2. ARQUITECTURA_SISTEMA_CRM.md (30 min)
   → Ver el mapa general

3. DOCUMENTACION_APP_MOVIL.md (45 min)
   → Entender la app móvil

4. PLAN_INTEGRACION_IA.md (30 min)
   → Conocer el módulo de IA

Total: ~2 horas
```

### **Si vas a MODIFICAR EL BACKEND:**
```
1. ARQUITECTURA_SISTEMA_CRM.md (30 min)
2. REFERENCIA_MODELOS_API.md (90 min)
   → Enfocarse en sección de modelos

Total: 2 horas
```

### **Si vas a MODIFICAR EL FRONTEND:**
```
1. ARQUITECTURA_SISTEMA_CRM.md (30 min)
2. REFERENCIA_FRONTEND.md (90 min)
   → Enfocarse en páginas y componentes

Total: 2 horas
```

### **Si vas a MODIFICAR LA APP MÓVIL:**
```
1. DOCUMENTACION_APP_MOVIL.md (45 min)
2. REFERENCIA_MODELOS_API.md (30 min)
   → Solo sección "App Móvil" y endpoints usados

Total: 1.5 horas
```

### **Si vas a TRABAJAR CON IA:**
```
1. PLAN_INTEGRACION_IA.md (30 min)
2. REFERENCIA_MODELOS_API.md (15 min)
   → Solo modelo Planeacion y endpoint IA
3. REFERENCIA_FRONTEND.md (20 min)
   → Solo InventarioPlaneacion.jsx

Total: 1 hora
```

---

## 🔍 **BÚSQUEDA RÁPIDA**

### **¿Qué hace el módulo "Sugerido" de la app?**
→ `DOCUMENTACION_APP_MOVIL.md` → Sección "3. SUGERIDO"

### **¿Cómo funciona la IA?**
→ `PLAN_INTEGRACION_IA.md` → Sección "Sistema de IA"

### **¿Qué campos tiene el modelo Producto?**
→ `REFERENCIA_MODELOS_API.md` → Sección "1. PRODUCTOS" → Producto

### **¿Qué endpoints hay disponibles?**
→ `REFERENCIA_MODELOS_API.md` → Sección "ENDPOINTS API"

### **¿Qué componentes tiene el frontend?**
→ `REFERENCIA_FRONTEND.md` → Sección "COMPONENTES PRINCIPALES"

### **¿Cómo funciona la sincronización app ↔ web?**
→ `DOCUMENTACION_APP_MOVIL.md` → Sección "FLUJO DIARIO COMPLETO"  
→ `REFERENCIA_FRONTEND.md` → Sección "SINCRONIZACIÓN APP ↔ WEB"

### **¿Qué NO debo tocar?**
→ `ARQUITECTURA_SISTEMA_CRM.md` → Sección "ZONAS CRÍTICAS"  
→ `REFERENCIA_MODELOS_API.md` → Buscar "⚠️ CRÍTICO"

### **¿Dónde está el código de X?**
→ `RESUMEN_ANALISIS.md` → Sección "QUICK LINKS"

---

## ⚠️ **ACLARACIONES IMPORTANTES**

### **1. "Sugerido" en la app ≠ IA**
**Dónde leer:** `DOCUMENTACION_APP_MOVIL.md` → Sección "3. SUGERIDO"

El módulo "Sugerido" de la app móvil:
- ❌ NO usa IA
- ❌ NO tiene predicciones  automáticas
- ✅ Es entrada MANUAL por el vendedor
- ✅ Crea registros en CargueIDX
- ✅ Debería llamarse "Solicitar Cargue"

### **2. IA solo está en el FRONTEND WEB**
**Dónde leer:** `PLAN_INTEGRACION_IA.md` → Sección "ACLARACIÓN IMPORTANTE"

La IA funciona así:
- ✅ Backend: `ia_service.py` (redes neuronales)
- ✅ Frontend WEB: `InventarioPlaneacion.jsx`
- ✅ Endpoint: `POST /api/planeacion/prediccion_ia/`
- ❌ NO está en app móvil

### **3. Hay 6 tablas de Cargue (una por vendedor)**
**Dónde leer:** `REFERENCIA_MODELOS_API.md` → Sección "4. CARGUE"

- CargueID1 (Vendedor 1)
- CargueID2 (Vendedor 2)
- ...
- CargueID6 (Vendedor 6)

Todas tienen la misma estructura.

### **4. Save() automáticos (⚠️ PELIGRO)**
**Dónde leer:** `REFERENCIA_MODELOS_API.md` → Buscar "⚠️ CRÍTICO - save()"

Estos modelos tienen lógica automática en save():
- Producto → Auto-crea/actualiza Stock
- MovimientoInventario → Auto-actualiza stock
- DetalleVenta → Auto-crea MovimientoInventario
- CargueID1-6 → Auto-calcula totales
- ArqueoCaja → Auto-calcula diferencias

¡NO modificar sin entender!

---

## 📋 **CHECKLIST DE COMPRENSIÓN**

### **Nivel 1: Básico** (RESUMEN + ARQUITECTURA)
- [ ] Sé qué es CRM Fábrica
- [ ] Entiendo que tiene Backend + Frontend + App + BD
- [ ] Sé que hay IA en el web (no en app)
- [ ] Conozco el flujo diario general
- [ ] Sé qué NO tocar (zonas críticas)

### **Nivel 2: Intermedio** (+ APP + PLAN IA)
- [ ] Entiendo cómo funciona cada módulo de la app
- [ ] Sé qué hace "Sugerido" (manual, no IA)
- [ ] Conozco la arquitectura de IA
- [ ] Sé cuántos modelos hay entrenados (5/72)
- [ ] Entiendo el flujo app ↔ web

### **Nivel 3: Avanzado** (+ REFERENCIAS TÉCNICAS)
- [ ] Conozco todos los modelos de BD
- [ ] Sé qué save() son automáticos
- [ ] Conozco todos los endpoints
- [ ] Entiendo la estructura del frontend
- [ ] Sé usar contextos y servicios
- [ ] Puedo modificar cualquier parte del código

---

## 🎯 **PRÓXIMOS PASOS DESPUÉS DE LEER**

### **Si vas a desarrollar:**
1. ✅ Lee los documentos recomendados
2. ✅ Explora el código fuente
3. ✅ Haz cambios pequeños primero
4. ✅ Prueba en local antes de producción

### **Si vas a desplegar:**
1. ✅ Lee RESUMEN_ANALISIS.md
2. ✅ Verifica dependencias (requirements.txt, package.json)
3. ✅ Configura variables de entorno
4. ✅ Ejecuta migraciones
5. ✅ Entrena modelos de IA (opcional)

### **Si vas a mantener:**
1. ✅ Marca esta carpeta de documentación
2. ✅ Actualiza documentos cuando cambies cosas importantes
3. ✅ Usa REFERENCIA_MODELOS_API.md como guía
4. ✅ Consulta ARQUITECTURA ante dudas

---

## 📞 **SOPORTE**

Si después de leer toda la documentación aún tienes dudas:

1. **Revisa el código directamente** - Los documentos son guías, el código es la verdad
2. **Busca en los documentos** - Usa Ctrl+F en cada archivo
3. **Consulta los Quick Links** - RESUMEN_ANALISIS.md tiene enlaces directos

---

## ✅ **VERIFICACIÓN DE DOCUMENTACIÓN**

**Última revisión:** 2026-01-05

**Estado de cada documento:**
- ✅ RESUMEN_ANALISIS.md - Completo y verificado
- ✅ ARQUITECTURA_SISTEMA_CRM.md - Completo y verificado
- ✅ DOCUMENTACION_APP_MOVIL.md - Completo y verificado
- ✅ PLAN_INTEGRACION_IA.md - Completo y verificado
- ✅ REFERENCIA_MODELOS_API.md - Completo y verificado
- ✅ REFERENCIA_FRONTEND.md - Completo y verificado
- ✅ INDICE_DOCUMENTACION.md - Este archivo

**Total:** 7 documentos, ~150 páginas de documentación

---

## 🚀 **¡EMPECEMOS!**

**Recomendación:** Empieza por **RESUMEN_ANALISIS.md**

¡Buena lectura! 📚

---

**FIN DEL ÍNDICE** ✅
