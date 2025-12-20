# 🧠 PLAN DE MEJORA: RED NEURONAL POR ID

## PROBLEMA ACTUAL
La red neuronal aprende de TODOS los IDs combinados, generando predicciones genéricas.

**Ejemplo del problema:**
- ID1 pide 10 AREPA TIPO OBLEA → vende 2 (20% efectividad)
- ID3 pide 10 AREPA TIPO OBLEA → vende 8 (80% efectividad)
- Red neuronal predice: ~5 (promedio) ❌ INCORRECTO para ambos

## SOLUCIÓN PROPUESTA

### 1. APRENDIZAJE POR ID
```python
# ANTES: 1 modelo por producto
modelo_file = "AREPA_TIPO_OBLEA.keras"

# DESPUÉS: 1 modelo por ID+producto
modelo_file = "ID1_AREPA_TIPO_OBLEA.keras"
modelo_file = "ID2_AREPA_TIPO_OBLEA.keras"
modelo_file = "ID3_AREPA_TIPO_OBLEA.keras"
```

### 2. DATOS DE ENTRENAMIENTO
```python
# Histórico POR ID:
ID1 + Martes + AREPA TIPO OBLEA:
├─ Semana 1: pidió 10, vendió 2, devolvió 8
├─ Semana 2: pidió 10, vendió 3, devolvió 7
├─ Semana 3: pidió 12, vendió 2, devolvió 10
├─ Semana 4: pidió 10, vendió 3, devolvió 7
└─ Promedio real: 2.5 unidades

Predicción IA: 2.5 × 1.20 = 3 unidades (+20% tolerancia)
```

### 3. FEATURES (ENTRADAS)
```python
features = [
    id_vendedor,              # Codificado (ID1=1, ID2=2, etc.)
    dia_semana,               # 0=Lunes, 1=Martes, etc.
    mes,                      # 1-12
    semana_año,               # 1-52
    venta_promedio_4_semanas, # Promedio de últimas 4 semanas
    devoluciones_promedio,    # Promedio de devoluciones
    vencidas_promedio,        # Promedio de vencidas
]
```

### 4. TARGET (SALIDA)
```python
target = venta_real  # Cantidad - Devoluciones - Vencidas
```

### 5. PREDICCIÓN CON TOLERANCIA
```python
prediccion_base = modelo.predict(features)
prediccion_final = prediccion_base × 1.20  # +20% tolerancia
```

## FUENTES DE DATOS

### FASE 1: CARGUE (Implementar ahora)
```
Tabla: CargueIDx
├─ fecha, dia, producto
├─ cantidad (lo que se llevó)
├─ devoluciones (lo que NO vendió)
├─ vencidas (lo que expiró)
└─ Venta Real = cantidad - devoluciones - vencidas
```

### FASE 2: POS (Integrar ahora)
```
Tabla: Venta (ventas de POS)
├─ fecha, vendedor_id, producto
├─ cantidad (ventas registradas en POS)
├─ Ventas directas desde la tienda/punto de venta
└─ Fuente crítica: ventas reales confirmadas
```

### FASE 3: VENTAS APP (Integrar después)
```
Tabla: Venta (de la app móvil)
├─ fecha, vendedor_id, producto
├─ cantidad_vendida (registro directo del vendedor en ruta)
└─ Fuente adicional para validar y mejorar precisión
```

### COMBINACIÓN DE FUENTES
```
VENTA TOTAL REAL = 
  Venta calculada en CARGUE +
  Venta registrada en POS +
  Venta registrada en APP
  
Esto da la visión más completa y precisa de la demanda real.
```

## MODIFICACIONES A REALIZAR

### Archivo: `api/services/ia_service.py`

#### 1. Modificar `obtener_historial_ventas()`
```python
# AGREGAR:
- Identificar de qué modelo viene cada registro (ID1, ID2, etc.)
- Guardar id_vendedor en cada registro
- Incluir devoluciones y vencidas para análisis

# RESULTADO:
DataFrame con columnas: [fecha, id_vendedor, producto, venta_real, devoluciones, vencidas]
```

#### 2. Modificar `preparar_datos_para_ml()`
```python
# AGREGAR parámetro id_vendedor:
def preparar_datos_para_ml(self, df, id_vendedor, producto_nombre):
    # Filtrar SOLO datos de ese ID específico
    df_filtrado = df[(df['id_vendedor'] == id_vendedor) & 
                     (df['producto'] == producto_nombre)]
    
    # Features incluyen id_vendedor codificado
```

#### 3. Modificar `entrenar_modelo_producto()`
```python
# ANTES:
def entrenar_modelo_producto(self, producto_nombre):
    modelo_path = f'{producto_nombre}.keras'

# DESPUÉS:
def entrenar_modelo_producto(self, id_vendedor, producto_nombre):
    modelo_path = f'{id_vendedor}_{producto_nombre}.keras'
```

#### 4. Modificar `predecir_con_red_neuronal()`
```python
# AGREGAR parámetro id_vendedor:
def predecir_con_red_neuronal(self, id_vendedor, producto_nombre, fecha):
    # Cargar modelo específico del ID
    modelo = self.cargar_modelo_producto(id_vendedor, producto_nombre)
    
    # Predecir con datos históricos de ese ID
    prediccion = modelo.predict(...)
    
    # +20% tolerancia
    return prediccion * 1.20
```

#### 5. Modificar `predecir_produccion()`
```python
# Para PLANEACIÓN:
def predecir_produccion_para_planeacion(self, fecha_objetivo):
    predicciones = {}
    
    # Por cada ID
    for id_vendedor in ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']:
        # Por cada producto
        for producto in productos_activos:
            # Predecir específicamente para ese ID+producto
            prediccion = self.predecir_con_red_neuronal(
                id_vendedor, 
                producto, 
                fecha_objetivo
            )
            
            predicciones[f"{id_vendedor}_{producto}"] = prediccion
    
    return predicciones
```

## INTEGRACIÓN CON PLANEACIÓN

### Columna "ia" en tabla Planeacion
```python
# Cuando se hace la planeación:
1. Usuario revisa solicitadas + pedidos + existencias
2. IA calcula predicción basada en histórico real por ID
3. Se guarda en columna "ia"
4. Usuario puede ver:
   - Lo que pidió el vendedor (solicitadas)
   - Lo que realmente venderá según IA (ia)
   - Diferencia para tomar decisión
```

## PRÓXIMOS PASOS

### PASO 1: Modificar ia_service.py
- [ ] Agregar campo id_vendedor a obtener_historial_ventas()
- [ ] Entrenar modelos por ID+Producto
- [ ] Agregar tolerancia 20% a predicciones
- [ ] Probar con datos existentes

### PASO 2: Crear endpoint para Planeación
- [ ] Endpoint: /api/ia/predecir-planeacion/
- [ ] Input: fecha_objetivo
- [ ] Output: {id_vendedor, producto, ia_sugerido}

### PASO 3: Integrar con Frontend
- [ ] Mostrar columna "ia" en Planeación
- [ ] Comparar solicitadas vs. ia_sugerido
- [ ] Alertar cuando hay gran diferencia

### PASO 4: Entrenar modelos (comando)
```bash
python manage.py entrenar_ia
```

### PASO 5: FASE 2 - Integrar ventas APP
- [ ] Agregar tabla Venta como fuente adicional
- [ ] Combinar venta_cargue + venta_app para mayor precisión
- [ ] Re-entrenar modelos con ambas fuentes

## EJEMPLO DE USO

### Planeación para MARTES (ejecutada el LUNES noche):

```
Producto: AREPA TIPO OBLEA
Fecha objetivo: 2025-08-05 (Martes)

┌──────────┬─────────────┬──────────┬───────────────────┐
│ ID       │ SOLICITADAS │ IA       │ DIFERENCIA        │
├──────────┼─────────────┼──────────┼───────────────────┤
│ ID1      │ 10          │ 3        │ -7 (⚠️ sobre-pide)│
│ ID2      │ 8           │ 9        │ +1 (✅ bien)      │
│ ID3      │ 15          │ 12       │ -3 (⚠️ sobre-pide)│
│ ID4      │ 5           │ 4        │ -1 (✅ bien)      │
└──────────┴─────────────┴──────────┴───────────────────┘

Total Solicitadas: 38
Total IA: 28 ← Esto es lo que REALMENTE necesitas producir
Ahorro: 10 unidades (26% menos desperdicio)
```

## BENEFICIOS

1. ✅ **Reducción de devoluciones** (menos desperdicio)
2. ✅ **Producción más precisa** (20% tolerancia en lugar de sobre-pedir)
3. ✅ **Ahorro de costos** (producir solo lo necesario)
4. ✅ **Mejora continua** (aprende con cada venta)
5. ✅ **Personalizado por vendedor** (cada ID tiene su patrón)

---

**Fecha de creación:** 2025-12-16
**Autor:** Antigravity AI
**Estado:** PENDIENTE DE APROBACIÓN
