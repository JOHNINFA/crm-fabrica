# 🧠 PLAN DE TRABAJO - Módulo de Inteligencia Artificial

## Sistema de Predicción de Demanda para CRM Fábrica

**Fecha de inicio:** Diciembre 2025  
**Estado:** 🟡 En Planificación

---

## 📋 RESUMEN EJECUTIVO

### El Problema
Los vendedores de ruta piden productos **basándose en intuición**, lo que genera:
- **Exceso de pedido** → Productos que no se venden → **VENCIDAS** (pérdida económica)
- **Déficit de pedido** → Clientes sin atender → **VENTAS PERDIDAS** (oportunidad perdida)

### La Solución
Implementar un **sistema de predicción con redes neuronales** que:
1. Analice el historial de ventas, pedidos, devoluciones y vencidas
2. Aprenda patrones por vendedor, producto y día de la semana
3. **Sugiera cantidades óptimas** antes de que el vendedor haga su pedido

### Resultado Esperado
```
┌─────────────────────────────────────────────────────────────┐
│  ANTES (Sin IA)                 │  DESPUÉS (Con IA)         │
├─────────────────────────────────┼───────────────────────────┤
│  Vendedor pide: 100 unidades    │  IA sugiere: 75 unidades  │
│  Vende: 70 unidades             │  Vende: 73 unidades       │
│  Vencidas: 30 unidades ❌       │  Vencidas: 2 unidades ✅  │
│  Pérdida: $150,000              │  Pérdida: $10,000         │
└─────────────────────────────────┴───────────────────────────┘
```

---

## 🎯 OBJETIVO DEL MÓDULO

> Crear un sistema de **sugerido inteligente** que prediga cuánto debe pedir cada vendedor para cada producto, minimizando vencidas y maximizando ventas.

---

## 📊 DATOS QUE ALIMENTAN LA IA

### Fuentes de Datos (ya existentes en el sistema):

| Fuente | Tabla/Endpoint | Información |
|--------|----------------|-------------|
| **Cargue** | `CargueID1`, `CargueID2`... | Cantidad despachada por vendedor |
| **Ventas App** | `Venta`, `DetalleVenta` | Ventas en ruta (app móvil) |
| **Ventas POS** | `VentaPOS` | Ventas en punto fijo |
| **Pedidos** | `Pedido` | Pedidos de clientes |
| **Vencidas** | Campo en Cargue | Productos que expiraron |
| **Devoluciones** | Campo en Cargue | Productos devueltos |

### Features (Variables de Entrada para la Red):

```python
FEATURES = [
    'dia_semana',           # 0=Lunes, 6=Domingo
    'dia_mes',              # 1-31
    'mes',                  # 1-12
    'semana_año',           # 1-52
    'venta_dia_anterior',   # Venta del mismo día semana pasada
    'promedio_4_semanas',   # Promedio de ventas últimas 4 semanas
    'devoluciones_prom',    # Promedio de devoluciones
    'vencidas_prom',        # Promedio de vencidas
    'es_quincena',          # 0/1 (días de pago = más ventas)
    'es_fin_mes',           # 0/1
]
```

### Target (Variable a Predecir):
```python
TARGET = 'cantidad_optima'  # Cantidad que debería pedir
```

---

## 🏗️ ARQUITECTURA TÉCNICA

### Red Neuronal (por modelo)

```
┌─────────────────────────────────────────────────────────────┐
│  ARQUITECTURA DE RED NEURONAL                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INPUT LAYER (10 features)                                  │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────┐                │
│  │ Dense Layer 1: 64 neuronas              │                │
│  │ Activación: ReLU                        │                │
│  │ Dropout: 20%                            │                │
│  └─────────────────────────────────────────┘                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────┐                │
│  │ Dense Layer 2: 32 neuronas              │                │
│  │ Activación: ReLU                        │                │
│  │ Dropout: 20%                            │                │
│  └─────────────────────────────────────────┘                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────┐                │
│  │ Dense Layer 3: 16 neuronas              │                │
│  │ Activación: ReLU                        │                │
│  └─────────────────────────────────────────┘                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────┐                │
│  │ OUTPUT Layer: 1 neurona                 │                │
│  │ Activación: Linear                      │                │
│  │ Salida: Cantidad predicha               │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Cantidad de Modelos
```
6 Vendedores × 12 Productos = 72 modelos independientes
```

Cada combinación Vendedor + Producto tiene su propio modelo entrenado.

---

## 🖥️ INTERFAZ GRÁFICA (Frontend)

### Pantallas a Desarrollar:

#### 1. Dashboard Principal
```
┌─────────────────────────────────────────────────────────────┐
│  🧠 PANEL DE INTELIGENCIA ARTIFICIAL                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 72 Modelos   │  │ 85.3%        │  │ ✅ Activo    │      │
│  │ Entrenados   │  │ Precisión    │  │ Estado       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  [🔄 Reentrenar]  [📈 Métricas]  [💬 Chat IA]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Lista de Modelos
- Ver todos los modelos entrenados
- Filtrar por vendedor/producto
- Ver precisión de cada uno

#### 3. Detalle de Modelo
- Gráfico de precisión histórica
- Comparativa Predicción vs Real
- Botón para reentrenar

#### 4. Sugerido de Pedidos
```
┌─────────────────────────────────────────────────────────────┐
│  📦 SUGERIDO PARA: ID1 - LUNES 23/12/2025                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PRODUCTO              │ SUGERIDO IA │ PEDIDO VENDEDOR      │
│  ──────────────────────┼─────────────┼────────────────────  │
│  AREPA TIPO OBLEA      │    85       │  [____]              │
│  CANASTILLA            │    120      │  [____]              │
│  AREPA MEDIANA         │    45       │  [____]              │
│  AREPA TIPO PINCHO     │    30       │  [____]              │
│                                                              │
│  [Aplicar Sugerido] [Guardar Pedido]                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 5. Chat con IA (Opcional)
- Consultas en lenguaje natural
- "¿Cuánto vendió ID1 la semana pasada?"
- "¿Qué producto tiene más devoluciones?"

---

## 📅 FASES DE IMPLEMENTACIÓN

### FASE 1: Backend - Infraestructura (2-3 días)
- [ ] Crear modelo Django `IAModeloInfo` para almacenar métricas
- [ ] Crear endpoints API:
  - `GET /api/ia/dashboard/` - Estadísticas generales
  - `GET /api/ia/modelos/` - Lista de modelos
  - `GET /api/ia/modelo/<id>/` - Detalle de modelo
  - `POST /api/ia/predecir/` - Obtener predicción
  - `POST /api/ia/entrenar/` - Reentrenar modelos
- [ ] Crear servicio `ia_service.py` con lógica de entrenamiento

### FASE 2: Entrenamiento de Modelos (2-3 días)
- [ ] Script para extraer datos históricos
- [ ] Preprocesamiento de features
- [ ] Entrenamiento de los 72 modelos
- [ ] Guardado de modelos en `/modelos_ia/`
- [ ] Registro de métricas en BD

### FASE 3: Frontend - Interfaz (3-4 días)
- [ ] Crear página `IADashboardScreen.jsx`
- [ ] Componente `ListaModelos.jsx`
- [ ] Componente `DetalleModelo.jsx`
- [ ] Componente `SugeridoPedidos.jsx`
- [ ] Gráficos con Chart.js
- [ ] Estilos CSS

### FASE 4: Integración con Flujo de Pedidos (1-2 días)
- [ ] Modificar pantalla de pedidos del vendedor
- [ ] Mostrar sugerido IA junto al campo de cantidad
- [ ] Botón "Aplicar sugerido"

### FASE 5: Pruebas y Ajustes (2 días)
- [ ] Validar predicciones con datos reales
- [ ] Ajustar hiperparámetros si es necesario
- [ ] Pruebas de usuario

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Objetivo |
|---------|----------|
| Precisión promedio | > 80% |
| Reducción de vencidas | > 50% |
| MAE (Error Medio Absoluto) | < 5 unidades |
| Adopción por vendedores | > 70% usan el sugerido |

---

## 🔧 REQUISITOS TÉCNICOS

### Dependencias Python (Backend)
```
tensorflow>=2.10.0
numpy>=1.21.0
pandas>=1.3.0
scikit-learn>=1.0.0
```

### Hardware Recomendado para Entrenamiento
- CPU: 4+ cores
- RAM: 8GB+
- GPU: Opcional (acelera entrenamiento)

---

## 📁 ESTRUCTURA DE ARCHIVOS A CREAR

```
crm-fabrica/
├── api/
│   ├── ia_views.py           # Endpoints de IA
│   ├── ia_urls.py            # URLs del módulo
│   └── services/
│       └── ia_service.py     # Lógica de entrenamiento/predicción
│
├── frontend/src/
│   ├── pages/
│   │   └── IADashboardScreen.jsx
│   └── components/IA/
│       ├── Dashboard.jsx
│       ├── ListaModelos.jsx
│       ├── DetalleModelo.jsx
│       ├── SugeridoPedidos.jsx
│       └── IA.css
│
├── modelos_ia/               # Modelos guardados
│   ├── ID1_AREPA_OBLEA.keras
│   ├── ID1_CANASTILLA.keras
│   └── ...
│
└── scripts/
    └── entrenar_modelos.py   # Script de entrenamiento manual
```

---

## ⏰ CRONOGRAMA ESTIMADO

| Semana | Fase | Entregable |
|--------|------|------------|
| Semana 1 | FASE 1 | Backend listo con endpoints |
| Semana 2 | FASE 2 | 72 modelos entrenados |
| Semana 2-3 | FASE 3 | Interfaz gráfica funcional |
| Semana 3 | FASE 4 | Integración con pedidos |
| Semana 4 | FASE 5 | Sistema en producción |

**Tiempo total estimado: 3-4 semanas**

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Alimentar datos**: Usar el sistema normalmente para generar historial
2. **Verificar tablas**: Confirmar que Cargue, Ventas, Pedidos tienen datos suficientes
3. **Iniciar FASE 1**: Crear estructura de backend

---

## 👥 EQUIPO

| Rol | Responsable |
|-----|-------------|
| Desarrollo Backend | Por asignar |
| Desarrollo Frontend | Por asignar |
| Data Science (IA) | Por asignar |
| Pruebas | Por asignar |

---

<p align="center">
  <strong>🧠 Módulo de IA - CRM Fábrica</strong><br>
  Predicción Inteligente de Demanda
</p>
