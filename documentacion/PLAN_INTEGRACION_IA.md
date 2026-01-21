# 🧠 ESTADO Y PLAN DE MEJORA DEL SISTEMA DE IA

## 📅 Fecha: 2026-01-05
## 🎯 Estado: IA FUNCIONANDO EN WEB - Planificando Expansión

---

## ⚠️ **ACLARACIÓN IMPORTANTE**

### **Dónde está la IA:**
- ✅ **Backend:** `api/services/ia_service.py` (15KB, funcionando)
- ✅ **Frontend WEB:** `InventarioPlaneacion.jsx` (42KB, integrada)
- ✅ **Base de Datos:** `Planeacion.ia` (campo para predicciones)
- ❌ **App Móvil:** NO tiene IA (ver `DOCUMENTACION_APP_MOVIL.md`)

### **Lo que NO es IA:**
- ❌ El módulo "Sugerido" de la app móvil es **entrada manual por el vendedor**
- ❌ NO hay sugerencias automáticas en la app
- ❌ NO hay predicciones en dispositivos móviles

### **La IA funciona:**
1. Usuario abre Planeación en **WEB**
2. Frontend llama `POST /api/planeacion/prediccion_ia/`
3. Backend usa redes neuronales entrenadas
4. Retorna predicciones por producto
5. Se muestra en columna "IA" editable
6. Usuario acepta o ajusta manualmente

---

## ✅ **LO QUE YA EXISTE Y FUNCIONA**

### **1. Infraestructura Completa de IA**

#### **Servicio Backend** (`api/services/ia_service.py` - 15KB)
```python
✅ Clase IAService completamente funcional
✅ Extracción de datos históricos (CargueID1-6)
✅ Preparación de features para ML
✅ Creación de modelo neuronal (64→32→16→1)
✅ Entrenamiento por producto
✅ Carga de modelos existentes
✅ Predicción con redes neuronales
✅ Entrenamiento masivo
```

#### **Arquitectura de Red Neuronal**
```python
modelo = keras.Sequential([
    layers.Dense(64, activation='relu', input_dim=5),
    layers.Dropout(0.2),
    layers.Dense(32, activation='relu'),
    layers.Dropout(0.2),
    layers.Dense(16, activation='relu'),
    layers.Dense(1, activation='linear')  # Regresión
])

Optimizador: Adam
Loss: MSE (Mean Squared Error)
Métrica: MAE (Mean Absolute Error)
Epochs: 50
Batch Size: 8
```

#### **Features de Entrada** (5 variables)
```python
1. dia_semana (0-6)
2. dia_mes (1-31)
3. mes (1-12)
4. semana_año (1-52)
5. venta_anterior (unidades vendidas día anterior)
```

#### **Modelos Ya Entrenados** (`api/ml_models/`)
```
1. AREPA_MEDIANA_330Gr.keras (70KB) + _scaler.pkl (569B)
2. AREPA_QUESO_CORRIENTE_450Gr.keras + _scaler.pkl
3. AREPA_QUESO_ESPECIAL_GRANDE_600Gr.keras + _scaler.pkl
4. AREPA_TIPO_OBLEA_500Gr.keras + _scaler.pkl
5. AREPA_TIPO_PINCHO_330Gr.keras + _scaler.pkl

Estado: 5 / 72 productos (6.9%)
Tamaño promedio: ~70KB por modelo
```

#### **Comando Django** (`api/management/commands/entrenar_ia.py`)
```bash
python manage.py entrenar_ia

# Entrena redes neuronales para todos los productos con datos suficientes
# Requiere: Mínimo 10 registros históricos por producto
```

#### **Endpoints API**
```python
GET/POST /api/prediccion-ia/?fecha=YYYY-MM-DD
  → Retorna predicciones con redes neuronales

POST /api/planeacion/prediccion_ia/
  Body: { fecha, datos_contextuales }
  → Usado por InventarioPlaneacion.jsx
```

### **2. Integración Frontend Completa**

#### **InventarioPlaneacion.jsx** (42KB, 1085 líneas)
```javascript
FUNCIONALIDADES:
✅ Consulta automática de IA al cargar datos
✅ Columna "IA" editable en tabla
✅ Guardar predicciones en BD (campo Planeacion.ia)
✅ Override manual (usuario puede ajustar)
✅ Sincronización en tiempo real
✅ Cache inteligente (30 segundos)
✅ Logs detallados de predicciones

FLUJO:
1. Usuario abre pantalla Planeación
2. Frontend llama POST /planeacion/prediccion_ia/
3. Backend consulta modelos entrenados
4. IA predice cantidades por producto
5. Se muestran en columna "IA"
6. Usuario acepta o ajusta
7. Se guarda en BD
```

### **3. Modelo de Datos**
```python
class Planeacion(models.Model):
    fecha = models.DateField()
    producto_nombre = models.CharField(max_length=255)
    existencias = models.IntegerField(default=0)
    solicitadas = models.IntegerField(default=0)
    pedidos = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    orden = models.IntegerField(default=0)
    ia = models.IntegerField(default=0)  # 🧠 CAMPO IA
    
    unique_together = ['fecha', 'producto_nombre']
```

---

## 📊 **ANÁLISIS DEL SISTEMA ACTUAL**

### **Fortalezas:**
- ✅ Arquitectura sólida (64→32→16→1)
- ✅ Dropout para evitar overfitting
- ✅ Integración completa con frontend
- ✅ Comando de entrenamiento automatizado
- ✅ Funciona sin tablas auxiliares (usa archivos .keras)
- ✅ Normalización con StandardScaler

### **Limitaciones Actuales:**
- ⚠️ Solo 5 modelos entrenados (6.9% cobertura)
- ⚠️ No hay tracking de precisión (predicho vs real)
- ⚠️ No hay panel de administración visual
- ⚠️ No hay reentrenamiento programado
- ⚠️ Sin optimización para hardware limitado
- ⚠️ Features básicas (5 variables)

### **Oportunidades de Mejora:**
- 🎯 Entrenar 67 modelos restantes
- 🎯 Agregar más features (devoluciones, vencidas, método pago)
- 🎯 Crear dashboard de métricas
- 🎯 Implementar tracking de precisión
- 🎯 Automatizar reentrenamiento semanal
- 🎯 Comprimir modelos (float16)

---

## 🚀 **PLAN DE MEJORA (4 FASES)**

### **FASE 1: Entrenamiento Masivo** (2-3 días)

**Objetivo:** Entrenar modelos para los 67 productos restantes

**Acciones:**
1. Verificar datos históricos por producto:
   ```python
   from api.services.ia_service import IAService
   service = IAService()
   df = service.obtener_historial_ventas()
   print(df.groupby('producto').size())
   ```

2. Ejecutar entrenamiento masivo:
   ```bash
   python manage.py entrenar_ia
   ```

3. Verificar modelos generados:
   ```bash
   ls -lh api/ml_models/
   ```

**Resultado Esperado:**
- 60-72 modelos entrenados (100% cobertura)
- ~5MB de modelos totales

---

### **FASE 2: Tracking de Precisión** (1 semana)

**Objetivo:** Medir y monitorear la precisión de los modelos

**Nuevas Tablas:**
```python
class IAModeloInfo(models.Model):
    """Metadatos de modelos entrenados"""
    producto_nombre = models.CharField(max_length=255, unique=True)
    version = models.IntegerField(default=1)
    fecha_entrenamiento = models.DateTimeField(auto_now_add=True)
    registros_entrenamiento = models.IntegerField()
    mae_entrenamiento = models.FloatField(null=True)
    activo = models.BooleanField(default=True)
    archivo = models.CharField(max_length=500)

class IAPrediccion(models.Model):
    """Histórico de predicciones vs realidad"""
    fecha_prediccion = models.DateField()
    producto_nombre = models.CharField(max_length=255)
    cantidad_predicha = models.IntegerField()
    cantidad_real = models.IntegerField(null=True)
    error_absoluto = models.FloatField(null=True)
    modelo_version = models.IntegerField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if self.cantidad_real is not None:
            self.error_absoluto = abs(self.cantidad_predicha - self.cantidad_real)
        super().save(*args, **kwargs)
```

**Nuevo Endpoint:**
```python
GET /api/ia/metricas/?producto=AREPA_MEDIANA_330Gr&dias=30

Response:
{
  "producto": "AREPA_MEDIANA_330Gr",
  "predicciones_evaluadas": 25,
  "mae_promedio": 2.8,
  "rmse": 3.5,
  "precision_10pct": 0.80,  // 80% dentro del 10%
  "mejor_dia": "LUNES",
  "peor_dia": "VIERNES"
}
```

**Modificar `predecir_produccion()`:**
```python
def predecir_produccion(self, fecha_objetivo, datos_contextuales=None):
    # ... código existente ...
    
    # 🆕 Guardar predicción en BD
    from api.models import IAPrediccion, IAModeloInfo
    
    for prediccion in predicciones:
        modelo_info = IAModeloInfo.objects.filter(
            producto_nombre=prediccion['producto']
        ).first()
        
        IAPrediccion.objects.create(
            fecha_prediccion=fecha_objetivo,
            producto_nombre=prediccion['producto'],
            cantidad_predicha=prediccion['ia_sugerido'],
            modelo_version=modelo_info.version if modelo_info else 1
        )
    
    return predicciones
```

**Script diario para actualizar realidad:**
```python
# api/management/commands/actualizar_reales_ia.py
from django.core.management.base import BaseCommand
from api.models import IAPrediccion, CargueID1, CargueID2, ...
from datetime import date, timedelta

class Command(BaseCommand):
    def handle(self, *args, **options):
        # Actualizar predicciones de ayer con ventas reales
        ayer = date.today() - timedelta(days=1)
        
        predicciones_ayer = IAPrediccion.objects.filter(
            fecha_prediccion=ayer,
            cantidad_real__isnull=True
        )
        
        for pred in predicciones_ayer:
            # Buscar ventas reales en Cargue
            total_vendido = 0
            for modelo in [CargueID1, CargueID2, ...]:
                ventas = modelo.objects.filter(
                    fecha=ayer,
                    producto=pred.producto_nombre
                ).aggregate(Sum('vendidas'))
                total_vendido += ventas['vendidas__sum'] or 0
            
            pred.cantidad_real = total_vendido
            pred.save()  # Calcula error_absoluto automáticamente
            
            print(f"✅ {pred.producto_nombre}: Predicho={pred.cantidad_predicha}, Real={total_vendido}, Error={pred.error_absoluto}")
```

---

### **FASE 3: Panel de Administración IA** (1-2 semanas)

**Objetivo:** Interfaz visual para gestionar modelos

**Nueva Página:** `ModuloIAScreen.jsx`

**Secciones:**

#### **A. Dashboard General**
```jsx
┌─────────────────────────────────────────────┐
│ 📊 RESUMEN DE MODELOS                       │
├─────────────────────────────────────────────┤
│  Modelos Activos: 72 / 72                  │
│  Última Actualización: 2026-01-04 12:30    │
│  MAE Promedio: 2.8 unidades                │
│  Precisión Promedio: 85%                    │
│                                              │
│  [🔄 Reentrenar Todos] [📊 Ver Reportes]    │
└─────────────────────────────────────────────┘
```

#### **B. Lista de Modelos**
```jsx
┌──────────────────────┬────┬─────┬────────┬────────────┐
│ PRODUCTO             │ V  │ MAE │ ESTADO │ ACCIONES   │
├──────────────────────┼────┼─────┼────────┼────────────┤
│ AREPA MEDIANA 330Gr  │ v2 │ 2.3 │ ✅ 85% │ Ver │ Edit │
│ ALMOJABANA          │ v1 │ 3.1 │ ✅ 78% │ Ver │ Edit │
│ PAN TAJADO           │ v1 │ 1.8 │ ✅ 92% │ Ver │ Edit │
└──────────────────────┴────┴─────┴────────┴────────────┘
```

#### **C. Detalle de Modelo**
```jsx
┌─────────────────────────────────────────────┐
│ 📈 AREPA MEDIANA 330Gr - v2                 │
├─────────────────────────────────────────────┤
│  Entrenado: 2026-01-04 12:30               │
│  Registros: 120 días                        │
│  MAE: 2.3 unidades                          │
│  Precisión ±10%: 85%                        │
│                                              │
│  [Gráfico: Predicho vs Real - Últimos 30]  │
│  ┌─────────────────────────────┐            │
│  │ 400│    ● real               │            │
│  │    │  ○ predicho             │            │
│  │ 350│   ○●                    │            │
│  │    │     ●○                  │            │
│  │ 300│       ○●                │            │
│  └─────────────────────────────┘            │
│                                              │
│  [🔄 Reentrenar] [📥 Descargar Modelo]      │
└─────────────────────────────────────────────┘
```

**Nuevos Endpoints:**
```python
GET /api/ia/modelos/
  → Lista todos los modelos
GET /api/ia/modelos/<producto>/
  → Detalle de un modelo
POST /api/ia/modelos/<producto>/reentrenar/
  → Reentrenar un modelo específico
GET /api/ia/modelos/<producto>/metricas/
  → Métricas de un modelo
```

---

### **FASE 4: Optimización y Automatización** (1 semana)

**Objetivos:**
1. Comprimir modelos para hardware limitado
2. Automatizar reentrenamiento
3. Optimizar inferencia

#### **A. Compresión de Modelos**
```python
def comprimir_modelo(modelo_path):
    """Convierte float32 → float16"""
    import tensorflow as tf
    
    modelo = tf.keras.models.load_model(modelo_path)
    
    converter = tf.lite.TFLiteConverter.from_keras_model(modelo)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    
    tflite_modelo = converter.convert()
    
    # Guardar versión comprimida
    with open(modelo_path.replace('.keras', '.tflite'), 'wb') as f:
        f.write(tflite_modelo)
    
    tamaño_original = os.path.getsize(modelo_path)
    tamaño_comprimido = os.path.getsize(modelo_path.replace('.keras', '.tflite'))
    
    print(f"✅ Reducción: {tamaño_original/1024:.1f}KB → {tamaño_comprimido/1024:.1f}KB ({(1-tamaño_comprimido/tamaño_original)*100:.1f}%)")
```

#### **B. Reentrenamiento Automático**
```python
# Usar cron o Celery
# Ejecutar cada domingo a las 2 AM:

# crontab -e
0 2 * * 0 cd /path/to/project && python manage.py entrenar_ia

# O con Celery:
from celery import shared_task

@shared_task
def reentrenar_modelos_semanalmente():
    from api.services.ia_service import IAService
    service = IAService()
    service.entrenar_todos_los_modelos()
```

#### **C. Cache de Predicciones**
```python
from django.core.cache import cache

def predecir_produccion_cached(self, fecha_objetivo, datos_contextuales=None):
    cache_key = f"prediccion_ia_{fecha_objetivo}"
    
    # Intentar obtener desde cache
    predicciones = cache.get(cache_key)
    
    if predicciones is None:
        # Generar predicciones
        predicciones = self.predecir_produccion(fecha_objetivo, datos_contextuales)
        
        # Guardar en cache por 1 hora
        cache.set(cache_key, predicciones, 3600)
    
    return predicciones
```

---

## 📐 **MÉTRICAS DE ÉXITO**

### **Objetivos Técnicos:**
```
1. Cobertura: 100% de productos con modelo (72/72)
2. MAE Promedio: < 5 unidades
3. Precisión ±10%: > 75%
4. Tiempo de inferencia: < 100ms por producto
5. Tamaño modelos: < 10MB total
```

### **Objetivos de Negocio:**
```
1. Reducir sobreprodución: 20%
2. Reducir desabastecimiento: 30%
3. Reducir vencidas: 15%
4. Mejorar rotación de inventario: 25%
```

---

## ⚡ **ACCIONES INMEDIATAS (HOY)**

```bash
# 1. Verificar datos disponibles
python manage.py shell
>>> from api.services.ia_service import IAService
>>> service = IAService()
>>> df = service.obtener_historial_ventas()
>>> print(df.groupby('producto').size().sort_values(ascending=False))

# 2. Identificar productos con datos suficientes (>10 registros)
>>> productos_listos = df.groupby('producto').size()
>>> productos_listos = productos_listos[productos_listos >= 10]
>>> print(f"Productos listos para entrenar: {len(productos_listos)}")

# 3. Entrenar modelos restantes
python manage.py entrenar_ia

# 4. Verificar modelos generados
ls -lh api/ml_models/

# 5. Probar predicción
python manage.py shell
>>> from api.services.ia_service import IAService
>>> service = IAService()
>>> preds = service.predecir_produccion('2026-01-10')
>>> print(f"Productos con predicción: {len(preds)}")
```

---

## 🎯 **CONCLUSIÓN**

**El sistema de IA está FUNCIONANDO** con:
- ✅ Servicio completo (`ia_service.py`)
- ✅ 5 modelos entrenados
- ✅ Integración frontend
- ✅ Endpoints API
- ✅ Comando de entrenamiento

**Próximos pasos:**
1. Entrenar 67 modelos restantes (2-3 días)
2. Implementar tracking de precisión (1 semana)
3. Crear panel de administración (1-2 semanas)
4. Optimizar y automatizar (1 semana)

**Total estimado:** 3-4 semanas para sistema IA completo y optimizado

---

**FIN DEL PLAN** 🎯
