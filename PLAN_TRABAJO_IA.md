# 📋 PLAN DE TRABAJO - MÓDULO DE IA
**Fecha de creación:** 2025-12-16  
**Estado:** PENDIENTE DE IMPLEMENTACIÓN  
**Prioridad:** ALTA  

---

## 🎯 OBJETIVO GENERAL

Implementar un sistema completo de Inteligencia Artificial que:
1. Predice demanda real de productos por vendedor (ID1-ID6) y POS
2. Reduce devoluciones y desperdicio (objetivo: -65%)
3. Optimiza producción basándose en ventas históricas reales
4. Proporciona una interfaz gráfica para monitorear y ajustar modelos

---

## 📊 SITUACIÓN ACTUAL

### Problema Identificado:
```
ANTES:
- Vendedor solicita: 10 unidades
- Producción: 10 unidades
- Venta real: 2 unidades
- Devoluciones: 8 unidades (80% desperdicio) ❌

CAUSA:
- Red neuronal actual aprende de TODOS los IDs combinados
- No diferencia patrones por vendedor
- Predicción genérica e imprecisa
```

---

## ✅ SOLUCIÓN PROPUESTA

### 1. Red Neuronal por ID + Producto
```
ANTES: 
- 1 modelo por producto (ej: AREPA_TIPO_OBLEA.keras)

DESPUÉS:
- 1 modelo por ID+producto (ej: ID1_AREPA_TIPO_OBLEA.keras)
- 1 modelo por POS+producto (ej: POS_AREPA_TIPO_OBLEA.keras)
- Total: 7 modelos por producto (ID1-ID6 + POS)
```

### 2. Fuentes de Datos Múltiples
```
CARGUE (Prioridad 1):
├─ CargueIDx tables
├─ Venta Real = cantidad - devoluciones - vencidas
└─ Por ID, producto, fecha, día

POS (Prioridad 1):
├─ Tabla Venta + DetalleVenta
├─ Ventas de tienda/punto de venta
└─ Por cajero, producto, fecha

VENTAS APP (Prioridad 2 - Futuro):
├─ Tabla VentaRuta (por implementar)
├─ Ventas registradas en app móvil
└─ Por vendedor, producto, fecha

PONDERACIÓN:
- CARGUE:     60%
- POS:        30%
- VENTAS APP: 10%
```

### 3. Tolerancia Ajustada
```
Predicción base × 1.20 (+20% margen de seguridad)

Ejemplo:
- Venta promedio histórica: 2.5 unidades
- Predicción final: 2.5 × 1.20 = 3 unidades
```

---

## 🛠️ TAREAS DE IMPLEMENTACIÓN

### FASE 1: MODIFICAR BACKEND - IA Service ⭐ ALTA PRIORIDAD

#### Archivo: `api/services/ia_service.py`

##### TAREA 1.1: Agregar campo id_vendedor
```python
# Línea 36-94: obtener_historial_ventas()

MODIFICAR:
- Identificar de qué modelo viene cada registro (ID1, ID2, etc.)
- Agregar columna 'id_vendedor' al DataFrame

CÓDIGO:
for modelo, id_nombre in zip(
    [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6],
    ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']
):
    cargues = modelo.objects.filter(activo=True).values(...)
    for c in cargues:
        registros.append({
            'id_vendedor': id_nombre,  # 🆕 NUEVO
            'fecha': c['fecha'],
            'producto': c['producto'],
            'venta': venta_neta,
            'devoluciones': c['devoluciones'],
            'vencidas': c['vencidas']
        })

# Agregar datos de POS
ventas_pos = DetalleVenta.objects.select_related('venta').filter(...)
for detalle in ventas_pos:
    registros.append({
        'id_vendedor': 'POS',  # 🆕 POS como vendedor
        'fecha': detalle.venta.fecha,
        'producto': detalle.producto.nombre,
        'venta': detalle.cantidad,
        'devoluciones': 0,
        'vencidas': 0
    })
```

##### TAREA 1.2: Modificar preparar_datos_para_ml()
```python
# Línea 96-140: preparar_datos_para_ml()

MODIFICAR FIRMA:
def preparar_datos_para_ml(self, df, id_vendedor, producto_nombre):
    # Filtrar SOLO datos de ese ID específico
    df_filtrado = df[
        (df['id_vendedor'] == id_vendedor) & 
        (df['producto'] == producto_nombre)
    ].copy()
    
    if len(df_filtrado) < 10:
        return None, None, None, None
    
    # ... resto del código
```

##### TAREA 1.3: Modificar entrenar_modelo_producto()
```python
# Línea 171-217: entrenar_modelo_producto()

MODIFICAR FIRMA:
def entrenar_modelo_producto(self, id_vendedor, producto_nombre):
    print(f"\n🧠 Entrenando: {id_vendedor}_{producto_nombre}")
    
    df = self.obtener_historial_ventas()
    X, y, scaler, df_producto = self.preparar_datos_para_ml(
        df, id_vendedor, producto_nombre
    )
    
    # Guardar con nombre específico
    modelo_path = os.path.join(
        self.models_dir, 
        f'{id_vendedor}_{producto_nombre.replace(" ", "_")}.keras'
    )
```

##### TAREA 1.4: Modificar predecir_con_red_neuronal()
```python
# Línea 237-283: predecir_con_red_neuronal()

MODIFICAR FIRMA:
def predecir_con_red_neuronal(self, id_vendedor, producto_nombre, fecha_objetivo):
    # Cargar modelo específico del ID
    modelo, scaler = self.cargar_modelo_producto(id_vendedor, producto_nombre)
    
    # ... predicción
    
    # 🆕 Aplicar tolerancia 20%
    prediccion_base = modelo.predict(features_scaled, verbose=0)[0][0]
    prediccion_final = max(0, int(prediccion_base * 1.20))
    
    return prediccion_final
```

##### TAREA 1.5: Crear predecir_produccion_para_planeacion()
```python
# 🆕 NUEVA FUNCIÓN

def predecir_produccion_para_planeacion(self, fecha_objetivo):
    """
    Genera predicciones para todos los IDs y productos.
    Usado en PLANEACIÓN.
    """
    predicciones = []
    
    df = self.obtener_historial_ventas()
    productos_unicos = df['producto'].unique()
    ids_vendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6', 'POS']
    
    for id_vendedor in ids_vendedores:
        for producto in productos_unicos:
            try:
                prediccion = self.predecir_con_red_neuronal(
                    id_vendedor, 
                    producto, 
                    fecha_objetivo
                )
                
                if prediccion is not None:
                    predicciones.append({
                        'id_vendedor': id_vendedor,
                        'producto': producto,
                        'ia_sugerido': prediccion,
                        'confianza': 'IA (Red Neuronal)'
                    })
            except Exception as e:
                print(f"⚠️ Error: {id_vendedor}_{producto}: {e}")
    
    return predicciones
```

##### TAREA 1.6: Modificar entrenar_todos_los_modelos()
```python
# Línea 381-413: entrenar_todos_los_modelos()

MODIFICAR:
def entrenar_todos_los_modelos(self):
    df = self.obtener_historial_ventas()
    productos_unicos = df['producto'].unique()
    ids_vendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6', 'POS']
    
    entrenados = 0
    fallidos = 0
    
    for id_vendedor in ids_vendedores:
        print(f"\n📊 Entrenando modelos para {id_vendedor}...")
        for producto in productos_unicos:
            try:
                resultado = self.entrenar_modelo_producto(id_vendedor, producto)
                if resultado is not None:
                    entrenados += 1
                else:
                    fallidos += 1
            except Exception as e:
                print(f"❌ Error: {id_vendedor}_{producto}: {e}")
                fallidos += 1
    
    print(f"\n✅ Total entrenados: {entrenados}")
    print(f"⚠️ Total fallidos: {fallidos}")
```

---

### FASE 2: CREAR ENDPOINTS DE API ⭐ ALTA PRIORIDAD

#### Archivo: `api/views.py`

##### ENDPOINT 2.1: Dashboard de IA
```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.services.ia_service import IAService
import os

@api_view(['GET'])
def ia_dashboard(request):
    """Estadísticas generales del sistema de IA"""
    ia_service = IAService()
    
    # Contar modelos entrenados
    models_dir = ia_service.models_dir
    modelos = [f for f in os.listdir(models_dir) if f.endswith('.keras')]
    
    # Calcular precisión promedio (mock por ahora)
    precision_promedio = 85.3
    
    return Response({
        'total_modelos': len(modelos),
        'ultima_actualizacion': '2025-12-16 22:00',
        'precision_promedio': precision_promedio,
        'estado': 'Activo'
    })
```

##### ENDPOINT 2.2: Listar Modelos
```python
@api_view(['GET'])
def ia_modelos_lista(request):
    """Lista todos los modelos entrenados con métricas"""
    ia_service = IAService()
    models_dir = ia_service.models_dir
    
    modelos = []
    for archivo in os.listdir(models_dir):
        if archivo.endswith('.keras'):
            nombre = archivo.replace('.keras', '')
            partes = nombre.split('_', 1)
            
            if len(partes) == 2:
                id_vendedor = partes[0]
                producto = partes[1].replace('_', ' ')
                
                modelos.append({
                    'id': nombre,
                    'id_vendedor': id_vendedor,
                    'producto': producto,
                    'precision': 87.5,  # Mock - calcular real
                    'mae': 2.3,  # Mock
                    'registros': 145  # Mock
                })
    
    return Response(modelos)
```

##### ENDPOINT 2.3: Re-entrenar Modelos
```python
@api_view(['POST'])
def ia_reentrenar(request):
    """Re-entrena modelos seleccionados"""
    modelos_seleccionados = request.data.get('modelos', [])
    
    ia_service = IAService()
    
    if 'todos' in modelos_seleccionados:
        # Entrenar todos
        ia_service.entrenar_todos_los_modelos()
        return Response({'mensaje': 'Todos los modelos re-entrenados'})
    
    # Entrenar específicos
    entrenados = []
    for modelo in modelos_seleccionados:
        partes = modelo.split('_', 1)
        if len(partes) == 2:
            id_vendedor = partes[0]
            producto = partes[1].replace('_', ' ')
            ia_service.entrenar_modelo_producto(id_vendedor, producto)
            entrenados.append(modelo)
    
    return Response({
        'mensaje': f'{len(entrenados)} modelos re-entrenados',
        'modelos': entrenados
    })
```

##### ENDPOINT 2.4: Predecir para Planeación
```python
@api_view(['POST'])
def ia_predecir_planeacion(request):
    """Genera predicciones para planeación"""
    fecha_objetivo = request.data.get('fecha')
    
    ia_service = IAService()
    predicciones = ia_service.predecir_produccion_para_planeacion(fecha_objetivo)
    
    return Response({
        'fecha': fecha_objetivo,
        'predicciones': predicciones,
        'total': len(predicciones)
    })
```

##### ENDPOINT 2.5: Chat con IA
```python
@api_view(['POST'])
def ia_chat(request):
    """Procesa preguntas en lenguaje natural"""
    pregunta = request.data.get('pregunta')
    
    # TODO: Implementar NLP para convertir pregunta a SQL
    # Por ahora respuesta mock
    
    respuesta = "Esta funcionalidad estará disponible próximamente."
    
    return Response({
        'pregunta': pregunta,
        'respuesta': respuesta
    })
```

#### Archivo: `api/urls.py`
```python
# Agregar rutas
from api.views import (
    ia_dashboard,
    ia_modelos_lista,
    ia_reentrenar,
    ia_predecir_planeacion,
    ia_chat
)

urlpatterns = [
    # ... rutas existentes
    
    # Rutas de IA
    path('ia/dashboard/', ia_dashboard, name='ia-dashboard'),
    path('ia/modelos/', ia_modelos_lista, name='ia-modelos-lista'),
    path('ia/reentrenar/', ia_reentrenar, name='ia-reentrenar'),
    path('ia/predecir-planeacion/', ia_predecir_planeacion, name='ia-predecir'),
    path('ia/chat/', ia_chat, name='ia-chat'),
]
```

---

### FASE 3: FRONTEND - MÓDULO DE IA ⭐ MEDIA PRIORIDAD

#### Estructura de archivos:
```
frontend/src/components/IA/
├── Dashboard.jsx          # Panel principal
├── ListaModelos.jsx       # Lista de modelos
├── DetalleModelo.jsx      # Detalles de modelo
├── Reentrenar.jsx         # Re-entrenamiento
├── ConfigAvanzada.jsx     # Configuración avanzada
├── ChatIA.jsx             # Chat inteligente
├── MetricasGlobales.jsx   # Métricas del sistema
├── Diagnostico.jsx        # Análisis y diagnóstico
└── IA.css                 # Estilos
```

#### TAREA 3.1: Crear Dashboard Principal
```jsx
// frontend/src/components/IA/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import ChatIA from './ChatIA';
import ListaModelos from './ListaModelos';

const Dashboard = () => {
  const [estadoIA, setEstadoIA] = useState({
    totalModelos: 0,
    ultimaActualizacion: '',
    precisionPromedio: 0,
    estado: 'Cargando...'
  });

  useEffect(() => {
    cargarEstadoIA();
  }, []);

  const cargarEstadoIA = async () => {
    const response = await fetch('http://localhost:8000/api/ia/dashboard/');
    const data = await response.json();
    setEstadoIA(data);
  };

  const handleReentrenar = () => {
    // Navegar a componente de re-entrenamiento
  };

  return (
    <div className="ia-dashboard p-4">
      <h2 className="mb-4">🧠 Inteligencia Artificial - Panel de Control</h2>
      
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">📊 Estado de Modelos</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <strong>Total modelos:</strong>
              <h3>{estadoIA.totalModelos}</h3>
            </Col>
            <Col md={3}>
              <strong>Precisión promedio:</strong>
              <h3>{estadoIA.precisionPromedio}%</h3>
            </Col>
            <Col md={3}>
              <strong>Estado:</strong>
              <h3 className="text-success">✅ {estadoIA.estado}</h3>
            </Col>
            <Col md={3}>
              <strong>Última actualización:</strong>
              <p>{estadoIA.ultimaActualizacion}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col md={4}>
          <Button 
            variant="primary" 
            className="w-100 py-3"
            onClick={handleReentrenar}
          >
            🔄 Reentrenar Modelos
          </Button>
        </Col>
        <Col md={4}>
          <Button variant="info" className="w-100 py-3">
            📈 Ver Métricas
          </Button>
        </Col>
        <Col md={4}>
          <Button variant="success" className="w-100 py-3">
            💾 Exportar Datos
          </Button>
        </Col>
      </Row>

      <ChatIA />
      <ListaModelos />
    </div>
  );
};

export default Dashboard;
```

#### TAREA 3.2: Crear Lista de Modelos
```jsx
// frontend/src/components/IA/ListaModelos.jsx

import React, { useState, useEffect } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const ListaModelos = () => {
  const [modelos, setModelos] = useState([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarModelos();
  }, []);

  const cargarModelos = async () => {
    const response = await fetch('http://localhost:8000/api/ia/modelos/');
    const data = await response.json();
    setModelos(data);
  };

  const modelosFiltrados = modelos.filter(m => 
    m.producto.toLowerCase().includes(filtro.toLowerCase()) ||
    m.id_vendedor.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="lista-modelos mt-4">
      <h4>📋 Modelos Entrenados</h4>
      
      <Form.Control
        type="text"
        placeholder="🔍 Buscar modelo..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="mb-3"
      />

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID Vendedor</th>
            <th>Producto</th>
            <th>Precisión</th>
            <th>MAE</th>
            <th>Registros</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {modelosFiltrados.map(modelo => (
            <tr key={modelo.id}>
              <td><strong>{modelo.id_vendedor}</strong></td>
              <td>{modelo.producto}</td>
              <td>
                <span className={`badge ${modelo.precision > 85 ? 'bg-success' : 'bg-warning'}`}>
                  {modelo.precision}%
                </span>
              </td>
              <td>{modelo.mae}</td>
              <td>{modelo.registros}</td>
              <td>
                <Button size="sm" variant="info">Ver</Button>{' '}
                <Button size="sm" variant="primary">Reentrenar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ListaModelos;
```

#### TAREA 3.3: Integrar en Módulo "Otros"
```jsx
// frontend/src/components/Otros/Otros.jsx

import Dashboard from '../IA/Dashboard';

// Agregar opción en el menú de "Otros"
<Tab eventKey="ia" title="🧠 Inteligencia Artificial">
  <Dashboard />
</Tab>
```

---

### FASE 4: INTEGRACIÓN CON PLANEACIÓN ⭐ ALTA PRIORIDAD

#### TAREA 4.1: Agregar columna "IA" en tabla Planeación
```python
# Ya existe en modelo Planeacion:
# ia = models.IntegerField(default=0)
```

#### TAREA 4.2: Botón "Calcular con IA" en Frontend
```jsx
// En componente de Planeación

const calcularConIA = async () => {
  const fechaObjetivo = '2025-12-17';  // Fecha seleccionada
  
  const response = await fetch('http://localhost:8000/api/ia/predecir-planeacion/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha: fechaObjetivo })
  });
  
  const data = await response.json();
  
  // Actualizar tabla con predicciones IA
  data.predicciones.forEach(pred => {
    // Actualizar campo "ia" en tabla
    console.log(`${pred.id_vendedor} - ${pred.producto}: ${pred.ia_sugerido}`);
  });
};
```

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Tareas | Tiempo Estimado | Prioridad |
|------|--------|-----------------|-----------|
| **FASE 1** | Modificar ia_service.py | 2-3 días | ⭐⭐⭐ ALTA |
| **FASE 2** | Crear endpoints API | 1-2 días | ⭐⭐⭐ ALTA |
| **FASE 3** | Frontend módulo IA | 3-4 días | ⭐⭐ MEDIA |
| **FASE 4** | Integración con Planeación | 1 día | ⭐⭐⭐ ALTA |
| **Testing** | Pruebas y ajustes | 2 días | ⭐⭐⭐ ALTA |

**Total estimado:** 9-12 días de desarrollo

---

## 🧪 PLAN DE PRUEBAS

### 1. Entrenar Modelos Iniciales
```bash
# Ejecutar comando de entrenamiento
python manage.py entrenar_ia

# Verificar que se crearon archivos .keras
ls api/ml_models/

# Debe mostrar:
# ID1_AREPA_TIPO_OBLEA.keras
# ID1_CANASTILLA.keras
# ID2_AREPA_TIPO_OBLEA.keras
# ...
```

### 2. Probar Predicción
```python
from api.services.ia_service import IAService

ia = IAService()
prediccion = ia.predecir_con_red_neuronal('ID1', 'AREPA TIPO OBLEA', '2025-12-17')
print(f"Predicción: {prediccion} unidades")
```

### 3. Verificar Precisión
```
Comparar predicciones vs. ventas reales:
- Tolerancia aceptable: ±20%
- Objetivo de precisión: >80%
```

---

## 📝 NOTAS IMPORTANTES

1. **TensorFlow Requerido**: Verificar que TensorFlow esté instalado
   ```bash
   pip install tensorflow
   ```

2. **Datos Mínimos**: Cada modelo requiere mínimo 10 registros históricos

3. **Re-entrenamiento**: Ejecutar semanalmente para mantener precisión

4. **Tolerancia Ajustable**: Puede modificarse desde la interfaz (por defecto 20%)

5. **Backup de Modelos**: Guardar carpeta `api/ml_models/` regularmente

---

## 🎯 MÉTRICAS DE ÉXITO

| Métrica | Antes | Objetivo | Medición |
|---------|-------|----------|----------|
| Devoluciones | 35% | 12% | % del cargue |
| Precisión predicción | N/A | 85%+ | MAE < 3 unidades |
| Ahorro mensual | $0 | $2,450,000 | Costos evitados |
| Tiempo planeación | 3 horas | 1 hora | Tiempo manual |

---

## 🔗 DOCUMENTOS RELACIONADOS

- `PLAN_MEJORA_IA.md` - Plan de mejora de red neuronal
- `PLAN_MODULO_IA.md` - Diseño del módulo de IA
- `api/services/ia_service.py` - Código actual de IA
- `api/management/commands/entrenar_ia.py` - Comando de entrenamiento

---

**Última actualización:** 2025-12-16 23:19  
**Creado por:** Antigravity AI  
**Estado:** ✅ DOCUMENTADO - PENDIENTE DE APROBACIÓN
