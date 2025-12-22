# 🏭 CRM Fábrica - Sistema de Gestión Integral para Distribución de Alimentos

<p align="center">
  <img src="https://img.shields.io/badge/Django-4.x-green?style=for-the-badge&logo=django" alt="Django">
  <img src="https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Expo-React%20Native-black?style=for-the-badge&logo=expo" alt="Expo">
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/TensorFlow-IA-FF6F00?style=for-the-badge&logo=tensorflow" alt="TensorFlow">
</p>

---

## 📋 Descripción

**CRM Fábrica** es un sistema integral de gestión diseñado específicamente para empresas de distribución de alimentos perecederos (como arepas). El sistema conecta la **planeación de producción**, los **vendedores en ruta**, el **punto de venta (POS)** y el **inventario** en tiempo real.

### 🎯 Problema que Resuelve
- Control de inventario en tiempo real
- Gestión de múltiples vendedores en ruta
- Reducción de pérdidas por productos vencidos
- Trazabilidad completa de lotes
- Sincronización entre producción y ventas
- **Predicción inteligente de demanda con IA** (en desarrollo)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CRM FÁBRICA                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │   FRONTEND   │    │   BACKEND    │    │      APP MÓVIL           │  │
│  │   (React)    │◄──►│   (Django)   │◄──►│   (React Native/Expo)    │  │
│  │   Puerto:3000│    │  Puerto:8000 │    │        AP GUERRERO       │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│         │                   │                        │                  │
│         └───────────────────┼────────────────────────┘                  │
│                             │                                            │
│                    ┌────────▼────────┐                                  │
│                    │    SQLite DB    │                                  │
│                    │   + Modelos IA  │                                  │
│                    └─────────────────┘                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.10+ | Lenguaje principal |
| Django | 4.x | Framework web |
| Django REST Framework | 3.x | API REST |
| SQLite | 3.x | Base de datos |
| TensorFlow/Keras | 2.x | Redes neuronales (IA) |

### Frontend Web
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.x | Framework UI |
| React Router | 6.x | Navegación SPA |
| Bootstrap | 5.x | Estilos y componentes |
| Chart.js | 4.x | Gráficos y visualizaciones |

### App Móvil
| Tecnología | Versión | Uso |
|------------|---------|-----|
| React Native | 0.72+ | Framework móvil |
| Expo | 49+ | Desarrollo y build |
| AsyncStorage | - | Almacenamiento local |

---

## 📁 Estructura del Proyecto

```
crm-fabrica/
├── 📂 api/                      # Backend Django
│   ├── models.py               # Modelos de datos
│   ├── views.py                # Vistas y endpoints API
│   ├── serializers.py          # Serializadores REST
│   ├── urls.py                 # Rutas de la API
│   └── services/               # Servicios (IA, etc.)
│
├── 📂 backend_crm/              # Configuración Django
│   ├── settings.py             # Configuración general
│   └── urls.py                 # URLs principales
│
├── 📂 frontend/                 # Aplicación Web React
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── Cargue/        # Módulo de Cargue
│   │   │   ├── Pedidos/       # Módulo de Pedidos
│   │   │   ├── inventario/    # Control de Inventario
│   │   │   └── IA/            # Módulo de IA (próximo)
│   │   ├── pages/             # Pantallas principales
│   │   ├── services/          # Servicios y API calls
│   │   └── styles/            # Estilos CSS
│   └── public/
│
├── 📂 AP GUERRERO/              # App Móvil (Expo)
│   ├── components/             # Componentes móviles
│   │   ├── Ventas/            # Módulo de ventas
│   │   └── Cargue.js          # Pantalla de cargue
│   ├── services/              # Servicios móviles
│   └── App.js                 # Entrada principal
│
├── 📂 modelos_ia/               # Modelos de IA entrenados
│   └── *.keras                 # Archivos de modelos
│
├── 📂 docs/                     # Documentación
│
├── 📄 manage.py                 # CLI Django
├── 📄 requirements.txt          # Dependencias Python
└── 📄 README.md                 # Este archivo
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Python 3.10+
- Node.js 18+
- npm o yarn
- Expo CLI (para app móvil)

### 1️⃣ Backend (Django)

```bash
# Clonar repositorio
cd crm-fabrica

# Crear entorno virtual (opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o: venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Ejecutar servidor
python manage.py runserver 0.0.0.0:8000
```

### 2️⃣ Frontend Web (React)

```bash
# En otra terminal
cd frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start
```

### 3️⃣ App Móvil (Expo)

```bash
# En otra terminal
cd "AP GUERRERO"

# Instalar dependencias
npm install

# Ejecutar con Expo
npx expo start
```

---

## 📱 Módulos del Sistema

### 1. 📦 Módulo de Cargue
Gestiona el despacho diario de productos a los vendedores.

**Funcionalidades:**
- Registro de cargue por vendedor (ID1-ID6)
- Control de fechas y días de la semana
- Validación de lotes vencidos
- Sincronización con inventario
- Cierre global de turno

### 2. 🛒 Módulo de Pedidos
Gestión de pedidos de clientes.

**Funcionalidades:**
- Registro de pedidos por cliente
- Asignación de rutas
- Estados: Pendiente, Entregado, Anulado
- Ordenamiento drag & drop
- Historial de pedidos

### 3. 📊 Módulo de Inventario
Control de stock y kardex.

**Funcionalidades:**
- Stock en tiempo real
- Kardex de movimientos
- Alertas de stock bajo
- Trazabilidad de lotes

### 4. 💰 Módulo de Ventas (App Móvil)
Aplicación para vendedores en ruta.

**Funcionalidades:**
- Apertura/Cierre de turno
- Registro de ventas
- Sincronización en tiempo real
- Cuadre de caja
- Reporte de vencidas/devoluciones

### 5. 📈 Módulo de Reportes
Informes y estadísticas.

**Funcionalidades:**
- Informe de ventas por vendedor
- Reporte de vencidas
- Análisis de rentabilidad
- Exportación a Excel/PDF

### 6. 🧠 Módulo de IA (En Desarrollo)
Inteligencia artificial para predicción de demanda.

**Funcionalidades Planeadas:**
- Dashboard de modelos entrenados
- Predicción de ventas por producto/vendedor
- Sugerido inteligente de pedidos
- Análisis de patrones de vencidas
- Chat con IA para consultas

---

## 🧠 Sistema de Inteligencia Artificial

### Objetivo
Crear un **sugeridor inteligente** que prediga cuánto debería pedir cada vendedor, aprendiendo del historial real de:
- Ventas (POS + App)
- Pedidos anteriores
- Devoluciones
- Vencidas
- Día de la semana
- Tendencias estacionales

### Arquitectura de la Red Neuronal
```
ENTRADA (Features):
├── Día de la semana (0-6)
├── Día del mes (1-31)
├── Mes (1-12)
├── Semana del año (1-52)
├── Venta del día anterior
├── Promedio últimas 4 semanas
├── Devoluciones promedio
└── Vencidas promedio

RED NEURONAL:
├── Capa 1: 64 neuronas (ReLU) + Dropout 20%
├── Capa 2: 32 neuronas (ReLU) + Dropout 20%
├── Capa 3: 16 neuronas (ReLU)
└── Salida: 1 neurona (Linear) → Predicción

SALIDA:
└── Cantidad sugerida para el producto
```

### Modelos
- **72 modelos** entrenados (6 vendedores × 12 productos)
- Precisión objetivo: **85%+**
- Actualización: Semanal automática

---

## 🔌 API Endpoints Principales

### Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/productos/` | Listar productos |
| POST | `/api/productos/` | Crear producto |

### Cargue
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/cargue-id1/` | Cargue vendedor 1 |
| POST | `/api/cargue-id1/` | Registrar cargue |
| GET | `/api/cargue-id2/` | Cargue vendedor 2 |
| ... | ... | ... |

### Inventario
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/inventario/` | Stock actual |
| POST | `/api/inventario/ajustar/` | Ajuste de inventario |
| GET | `/api/kardex/` | Movimientos |

### Ventas (App Móvil)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/turno/abrir/` | Abrir turno |
| POST | `/api/turno/cerrar/` | Cerrar turno |
| POST | `/api/ventas/registrar/` | Registrar venta |

### IA (Próximamente)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ia/dashboard/` | Dashboard IA |
| GET | `/api/ia/modelos/` | Lista de modelos |
| POST | `/api/ia/predecir/` | Obtener predicción |
| POST | `/api/ia/entrenar/` | Reentrenar modelos |

---

## 👥 Vendedores del Sistema

| ID | Nombre | Ruta |
|----|--------|------|
| ID1 | WILSON | Principal |
| ID2 | VENDEDOR 2 | Secundaria |
| ID3 | VENDEDOR 3 | Terciaria |
| ID4 | VENDEDOR 4 | Cuarta |
| ID5 | VENDEDOR 5 | Quinta |
| ID6 | VENDEDOR 6 | Sexta |

---

## 📊 Flujo de Operación Diario

```
🌅 INICIO DEL DÍA
│
├── 1️⃣ PLANEACIÓN (Día anterior)
│   ├── Vendedores hacen pedidos
│   ├── Clientes hacen pedidos
│   └── 🤖 IA sugiere cantidades (próximamente)
│
├── 2️⃣ PRODUCCIÓN
│   ├── Se programa según pedidos
│   └── Se registra en sistema
│
├── 3️⃣ DESPACHO (Mañana)
│   ├── Se carga a cada vendedor
│   ├── Se registra en CARGUE
│   └── Se descuenta de inventario
│
├── 4️⃣ VENTAS EN RUTA (Durante el día)
│   ├── Vendedor abre turno (App)
│   ├── Registra ventas
│   └── Sincroniza en tiempo real
│
├── 5️⃣ CIERRE DE TURNO (Fin del día)
│   ├── Reporta devoluciones
│   ├── Reporta vencidas + lotes
│   ├── Cuadre de caja
│   └── Cierra turno
│
└── 6️⃣ CONSOLIDACIÓN (Web)
    ├── Cierre global de todos los vendedores
    ├── Actualización de inventario
    └── Generación de reportes
```

---

## 🔧 Configuración

### Variables de Entorno

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:8000/api
```

**Backend (settings.py)**
```python
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True
```

---

## 🐛 Solución de Problemas Comunes

### Error: "No hay datos de cargue"
El sistema ahora detecta automáticamente turnos abiertos de días anteriores.

### Error: Turno no se cierra
Verificar que no haya turnos "zombie" en la BD con el script:
```bash
python check_open_shifts.py
```

### Error: Vencidas sin lote
El sistema ahora valida y solicita confirmación antes de cerrar.

---

## 📝 Licencia

Este proyecto es propietario de **Arepas Guerrero**.

---

## 👨‍💻 Desarrollo

**Stack:** Django + React + Expo + TensorFlow

**Última actualización:** Diciembre 2025

---

<p align="center">
  <strong>🏭 CRM Fábrica</strong><br>
  Sistema de Gestión Integral para Distribución de Alimentos
</p>
