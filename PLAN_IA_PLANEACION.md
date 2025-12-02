# 🧠 Plan Maestro: Inteligencia Artificial para Planeación de Producción

## 🎯 Objetivo Principal
Implementar un sistema de **Predicción Inteligente** en el módulo de "Planeación de Producción". El sistema analizará el historial de ventas para sugerir automáticamente la cantidad a producir (columna "IA"), respetando el orden de productos establecido y asistiendo en la toma de decisiones.

---

## 📅 Fase 1: El Cerebro (Backend & Lógica) ✅ COMPLETADO
*Objetivo: Crear el servicio capaz de analizar datos históricos y generar predicciones.*

### 1.1. Servicio de Análisis de Datos (`api/services/ia_service.py`) ✅
- [x] **Recolección de Datos**: Funciones para extraer el historial de ventas de todas las tablas `CargueIDx`.
- [x] **Normalización**: Unificar los datos por fecha y producto (sumar ventas de todos los vendedores).
- [x] **Algoritmo de Predicción (V2 - Contextual)**:
    - Implementado algoritmo que considera **EXISTENCIAS**, **SOLICITADAS**, **PEDIDOS** y **Histórico**.
    - Fórmula Inteligente: `IA = max(0, (Demanda - Stock) * 1.10)`
    - Demanda = max(Solicitadas + Pedidos, Promedio Histórico)

### 1.2. API Endpoints ✅
- [x] Endpoint `GET /api/prediccion-ia/`:
    - **Input**: Fecha objetivo (ej: `2025-05-24`).
    - **Output**: JSON con predicciones contextuales por producto.
    - Incluye: `{ia_sugerido, confianza, detalle: {existencias, solicitadas, pedidos, motivo}}`

---

## 💻 Fase 2: Integración Frontend (Visualización) ✅ COMPLETADO
*Objetivo: Mostrar la inteligencia en la pantalla de Planeación original.*

### 2.1. Conexión en `InventarioPlaneacion.jsx` ✅
- [x] **Consumo de API**: Al cargar una fecha, consulta automatic
amente el endpoint de predicción.
- [x] **Mapeo de Datos**: Asignar la predicción correcta a cada fila de la tabla.
- [x] **Visualización**: Números con badge morado (`#6f42c1`) cuando hay sugerencias > 0.

### 2.2. Interfaz de Usuario (UI) ✅
- [x] **Columna IA**:
    - Muestra el valor sugerido en color morado distintivo.
    - Tooltip muestra "Sugerencia de IA".
- [x] **Botón "🤖 Aplicar IA"**:
    - Funcionalidad para copiar masivamente los valores de la columna "IA" a la columna "ORDEN" con un solo clic.
    - Guardado automático en BD.

---

## 🔮 Fase 3: Aprendizaje y Ajuste (En Desarrollo)
*Objetivo: Que el sistema aprenda de las correcciones del usuario y mejore con el tiempo.*

- [ ] **Registro de Feedback**: Si la IA sugiere 100 y el usuario corrige a 120, guardar esa discrepancia para ajustar el algoritmo futuro.
- [ ] **Detección de Anomalías**: Alertas automáticas si la predicción difiere drásticamente del stock actual (ej: "Posible sobre-stock").
- [ ] **Modelo de Machine Learning**: Evolucionar de estadística a un modelo de ML que aprenda patrones complejos.

---

## 📝 Notas Técnicas
- **Algoritmo V2 (Actual)**: Considera contexto real (existencias, solicitadas, pedidos) + histórico.
- **Datos de Prueba**: El sistema está funcionando con datos reales limitados. La precisión mejorará automáticamente a medida que se registren más días.
- **Librerías**: `pandas`, `numpy` para análisis de datos.
