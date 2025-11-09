# Contexto Unificado de Productos

## 📋 Resumen

Se ha implementado un **contexto unificado de productos** (`UnifiedProductContext`) que reemplaza y unifica los contextos anteriores:
- `ProductContext` (usado en POS y Pedidos)
- `ProductosContext` (usado en Inventario)

Este cambio garantiza que **cualquier modificación en productos se refleje automáticamente en todos los módulos**: POS, Pedidos, Inventario y Cargue.

---

## 🎯 Objetivo

**Sincronización automática y en tiempo real** de productos entre todos los módulos del sistema cuando se:
- ✅ Crea un producto
- ✅ Edita un producto
- ✅ Elimina un producto
- ✅ Actualiza el stock/existencias

---

## 🏗️ Arquitectura

### Antes (Contextos Separados)

```
┌─────────────────┐     ┌──────────────────┐
│ ProductContext  │     │ ProductosContext │
│  (POS/Pedidos)  │     │   (Inventario)   │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         ├─ localStorage         ├─ localStorage
         │  'products'           │  'productos'
         │                       │
         └───────────────────────┘
              ⚠️ Sincronización manual
```

### Después (Contexto Unificado)

```
┌──────────────────────────────────────┐
│     UnifiedProductContext            │
│  (Todos los módulos)                 │
└──────────────┬───────────────────────┘
               │
               ├─ Backend (Django API)
               │  └─ Fuente de verdad
               │
               ├─ localStorage 'products'
               │  └─ Formato POS/Pedidos
               │
               ├─ localStorage 'productos'
               │  └─ Formato Inventario/Cargue
               │
               └─ Eventos de sincronización
                  ├─ 'storage'
                  ├─ 'productosUpdated'
                  └─ 'unifiedProductsUpdated'
```

---

## 📁 Archivos Creados

### 1. `frontend/src/context/UnifiedProductContext.jsx`
Contexto principal que maneja:
- Estado unificado de productos
- Operaciones CRUD (crear, leer, actualizar, eliminar)
- Sincronización con backend
- Conversión entre formatos
- Gestión de categorías
- Actualización de existencias

### 2. `frontend/src/hooks/useUnifiedProducts.js`
Hook personalizado que proporciona:
- `useUnifiedProducts()` - Hook principal
- `useProducts()` - Alias compatible con ProductContext
- `useProductos()` - Alias compatible con ProductosContext

---

## 🔄 Flujo de Sincronización

### Cuando se CREA o EDITA un producto:

```
Usuario crea/edita producto
    ↓
UnifiedProductContext.addProduct()
    ↓
┌─────────────────────────────────────────┐
│ 1. Guardar en Backend (Django API)     │
│    - POST/PATCH /api/productos/         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Actualizar estado React              │
│    - setProducts(updatedProducts)       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Sincronizar localStorage             │
│    - 'products' (formato POS)           │
│    - 'productos' (formato Inventario)   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Disparar eventos                     │
│    - window.dispatchEvent('storage')    │
│    - 'productosUpdated'                 │
│    - 'unifiedProductsUpdated'           │
└─────────────────────────────────────────┘
    ↓
✅ Todos los módulos se actualizan automáticamente
```

---

## 📦 Formatos de Datos

### Formato POS/Pedidos (`products`)
```javascript
{
  id: 1,
  name: "AREPA TIPO OBLEA 500GR",
  price: 1600,
  stock: 100,
  category: "Arepas",
  brand: "GENERICA",
  tax: "IVA(0%)",
  image: "/images/productos/arepa.jpg",
  purchasePrice: 1200
}
```

### Formato Inventario/Cargue (`productos`)
```javascript
{
  id: 1,
  nombre: "AREPA TIPO OBLEA 500GR",
  existencias: 100,
  categoria: "Arepas",
  precio: 1600,
  cantidad: 0
}
```

El contexto unificado **convierte automáticamente** entre ambos formatos.

---

## 🔧 Cambios Realizados

### 1. App.js
```javascript
// ANTES
<UsuariosProvider>
  <Router>
    ...
  </Router>
</UsuariosProvider>

// DESPUÉS
<UsuariosProvider>
  <UnifiedProductProvider>
    <Router>
      ...
    </Router>
  </UnifiedProductProvider>
</UsuariosProvider>
```

### 2. Componentes actualizados
Se actualizaron **todos** los componentes que usaban:

**POS:**
- ✅ PosScreen.jsx
- ✅ ProductList.jsx
- ✅ ProductsModal.jsx
- ✅ AddProductModal.jsx
- ✅ CategoryManager.jsx
- ✅ SyncButton.jsx
- ✅ ProductForm.jsx
- ✅ ProductManager.jsx
- ✅ ProductsSection.jsx

**Pedidos:**
- ✅ PedidosScreen.jsx
- ✅ ProductList.jsx
- ✅ ProductsModal.jsx
- ✅ AddProductModal.jsx
- ✅ CategoryManager.jsx
- ✅ SyncButton.jsx
- ✅ InformePedidosScreen.jsx

**Inventario:**
- ✅ InventarioScreen.jsx
- ✅ InventarioProduccion.jsx
- ✅ InventarioMaquilas.jsx
- ✅ TablaKardex.jsx

**Cargue:**
- ✅ MenuSheets.jsx
- ✅ PlantillaOperativa.jsx
- ✅ Produccion.jsx

**Productos:**
- ✅ ProductFormScreen.jsx

### 3. Imports actualizados

```javascript
// ANTES
import { useProducts } from '../../context/ProductContext';
import { useProductos } from '../../context/ProductosContext';

// DESPUÉS
import { useProducts } from '../../hooks/useUnifiedProducts';
import { useProductos } from '../../hooks/useUnifiedProducts';
```

---

## ✨ Características del Contexto Unificado

### 1. Sincronización Automática
- ⏱️ Cada 60 segundos con el backend
- 🔄 Al enfocar la ventana del navegador
- 📡 Al detectar cambios en localStorage de otras pestañas

### 2. Conversión Automática de Formatos
- 🔀 Convierte entre formato POS y formato Inventario
- 💾 Guarda en ambos formatos en localStorage
- 🎯 Cada módulo lee el formato que necesita

### 3. Gestión de Categorías
- ➕ Crear categorías automáticamente
- 🗑️ Eliminar categorías (reasigna productos)
- 🔄 Sincronizar con backend

### 4. Actualización de Stock
- 📦 Actualizar existencias desde cualquier módulo
- 🔄 Sincronizar con backend automáticamente
- 📊 Reflejar cambios en todos los módulos

### 5. Manejo de Errores
- 🌐 Funciona offline (guarda localmente)
- 🔄 Sincroniza cuando vuelve la conexión
- ⚠️ Logs detallados para debugging

---

## 🚀 Ventajas

1. **Consistencia de datos**: Un solo estado de verdad
2. **Sincronización automática**: No requiere intervención manual
3. **Compatibilidad**: Funciona con código existente
4. **Escalabilidad**: Fácil agregar nuevos módulos
5. **Mantenibilidad**: Un solo contexto para mantener
6. **Performance**: Sincronización optimizada
7. **Offline-first**: Funciona sin conexión

---

## 📝 Uso en Componentes

### Ejemplo en POS/Pedidos
```javascript
import { useProducts } from '../../hooks/useUnifiedProducts';

function MyComponent() {
  const { 
    products,           // Lista de productos
    categories,         // Lista de categorías
    addProduct,         // Crear/editar producto
    deleteProduct,      // Eliminar producto
    updateStock,        // Actualizar stock
    isSyncing          // Estado de sincronización
  } = useProducts();

  // Usar productos...
}
```

### Ejemplo en Inventario
```javascript
import { useProductos } from '../../hooks/useUnifiedProducts';

function MyComponent() {
  const { 
    productos,              // Lista en formato inventario
    actualizarExistencias,  // Actualizar existencias
    sincronizarConBackend  // Sincronizar manualmente
  } = useProductos();

  // Usar productos...
}
```

---

## 🔍 Debugging

El contexto unificado incluye logs detallados:

```javascript
// Logs de inicialización
🚀 Inicializando contexto unificado de productos...
✅ 45 productos cargados desde backend
✅ Contexto unificado inicializado

// Logs de operaciones
➕ Agregando producto: AREPA NUEVA
📁 Creando categoría: Nuevas
✅ Producto creado: 123
✅ Producto sincronizado en todos los módulos

// Logs de sincronización
🔄 Sincronización automática...
🔄 Ventana enfocada, sincronizando...
✅ Productos sincronizados al backend
```

---

## ⚠️ Notas Importantes

1. **No eliminar contextos antiguos todavía**: Se mantienen por compatibilidad, pero ya no se usan
2. **localStorage**: Se mantienen ambos formatos para compatibilidad con código legacy
3. **Backend**: Sigue siendo la fuente de verdad
4. **Eventos**: Los módulos pueden escuchar eventos personalizados si necesitan reaccionar a cambios

---

## 🧪 Testing

Para verificar que funciona correctamente:

1. **Crear producto en POS** → Verificar que aparece en Pedidos, Inventario y Cargue
2. **Editar producto en Productos** → Verificar cambios en todos los módulos
3. **Actualizar stock en Inventario** → Verificar en POS y Pedidos
4. **Eliminar producto** → Verificar que desaparece de todos los módulos
5. **Abrir múltiples pestañas** → Verificar sincronización entre pestañas

---

## 🔮 Futuras Mejoras

1. **WebSockets**: Para sincronización en tiempo real entre usuarios
2. **Optimistic Updates**: Actualizar UI antes de confirmar con backend
3. **Caché inteligente**: Reducir llamadas al backend
4. **Versionado**: Detectar y resolver conflictos de versión
5. **Audit log**: Registrar todos los cambios de productos

---

## 📞 Soporte

Si encuentras algún problema con la sincronización:
1. Revisa los logs en la consola del navegador
2. Verifica que el backend esté funcionando
3. Limpia localStorage si hay datos corruptos: `localStorage.clear()`
4. Recarga la página para forzar sincronización

---

**Fecha de implementación**: 11 de Agosto, 2025
**Versión**: 1.0.0
