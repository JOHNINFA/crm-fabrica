# Instrucciones para Completar el Ordenamiento de Productos

## ✅ Cambios Realizados

### 1. Backend (Django)
- ✅ Agregado campo `orden` al modelo `Producto` en `api/models.py`
- ✅ Agregado `ordering = ['orden', 'id']` en Meta del modelo
- ⏳ **PENDIENTE**: Ejecutar migración

### 2. Frontend (React)
- ✅ Agregada librería `react-beautiful-dnd` en `package.json`
- ✅ Actualizado `UnifiedProductContext` con función `reorderProducts()`
- ✅ Actualizado `useUnifiedProducts` hook para incluir `reorderProducts`
- ✅ Actualizado `ProductFormScreen` con drag & drop
- ✅ Agregados estilos CSS para drag & drop
- ⏳ **PENDIENTE**: Instalar dependencias

---

## 📋 Pasos para Completar

### Paso 1: Ejecutar Migraciones del Backend

```bash
# Ya ejecutaste:
python3 manage.py makemigrations api --name add_orden_to_producto

# Ahora ejecuta:
python3 manage.py migrate
```

Esto creará el campo `orden` en la tabla de productos.

### Paso 2: Instalar Dependencias del Frontend

```bash
cd frontend
npm install
```

Esto instalará `react-beautiful-dnd` que es necesario para el drag & drop.

### Paso 3: Inicializar el Orden de Productos Existentes (Opcional)

Si ya tienes productos en la base de datos, puedes ejecutar este script para asignarles un orden inicial:

```python
# En el shell de Django:
python3 manage.py shell

# Ejecutar:
from api.models import Producto

productos = Producto.objects.all().order_by('id')
for index, producto in enumerate(productos):
    producto.orden = index
    producto.save(update_fields=['orden'])

print(f"✅ {productos.count()} productos ordenados")
```

### Paso 4: Reiniciar el Servidor

```bash
# Backend
python3 manage.py runserver

# Frontend (en otra terminal)
cd frontend
npm start
```

---

## 🎯 Cómo Funciona

### En la Página de Productos:

1. **Ver productos ordenados**: Los productos se muestran en el orden personalizado
2. **Arrastrar para reordenar**: 
   - Haz clic y mantén presionado en el ícono de grip (☰) a la izquierda
   - Arrastra la fila hacia arriba o abajo
   - Suelta para colocar en la nueva posición
3. **Guardado automático**: El orden se guarda automáticamente en el backend
4. **Sincronización global**: El nuevo orden se refleja en todos los módulos

### En Otros Módulos (POS, Pedidos, Inventario, Cargue):

- Los productos aparecen automáticamente en el orden personalizado
- No requiere ninguna acción adicional
- Se sincroniza en tiempo real

---

## 🔍 Verificación

### 1. Verificar que el campo existe en la BD:

```bash
python3 manage.py dbshell

# En SQLite:
PRAGMA table_info(api_producto);

# Deberías ver el campo 'orden' en la lista
```

### 2. Verificar en el Frontend:

1. Ve a `/productos`
2. Deberías ver:
   - Un mensaje azul: "Arrastra las filas para reordenar..."
   - Un ícono de grip (☰) en la primera columna
   - Las filas se pueden arrastrar

### 3. Probar el Reordenamiento:

1. Arrastra un producto a una nueva posición
2. Abre la consola del navegador (F12)
3. Deberías ver logs:
   ```
   🔄 Reordenando productos...
   ✅ Productos reordenados en todos los módulos
   ```
4. Ve a POS o Pedidos
5. Los productos deberían aparecer en el nuevo orden

---

## 🐛 Solución de Problemas

### Error: "Cannot read property 'orden' of undefined"
**Solución**: Ejecuta la migración del backend

### Error: "react-beautiful-dnd not found"
**Solución**: Ejecuta `npm install` en la carpeta frontend

### Los productos no se reordenan
**Solución**: 
1. Verifica que la migración se ejecutó correctamente
2. Revisa la consola del navegador para errores
3. Verifica que el backend esté corriendo

### El orden no se guarda
**Solución**:
1. Verifica que el endpoint de actualización funcione
2. Revisa los logs del backend
3. Verifica permisos de escritura en la BD

---

## 📊 Estructura de Datos

### Campo `orden` en el Backend:

```python
orden = models.IntegerField(default=0, db_index=True)
```

- **Tipo**: Entero
- **Default**: 0
- **Indexado**: Sí (para búsquedas rápidas)
- **Uso**: Determina el orden de visualización

### Ordenamiento en Queries:

```python
# Automático gracias a Meta.ordering
productos = Producto.objects.all()  # Ya ordenados por 'orden', luego 'id'
```

### En el Frontend:

```javascript
{
  id: 1,
  name: "AREPA TIPO OBLEA",
  orden: 0,  // ← Nuevo campo
  // ... otros campos
}
```

---

## 🎨 Personalización

### Cambiar el Ícono de Drag:

En `ProductFormScreen.jsx`, línea con `<i className="bi bi-grip-vertical">`:

```jsx
<i className="bi bi-arrows-move"></i>  // Flechas
<i className="bi bi-list"></i>          // Lista
<i className="bi bi-grip-horizontal"></i> // Grip horizontal
```

### Cambiar el Color al Arrastrar:

En `ProductFormScreen.jsx`, en el estilo del `<tr>`:

```jsx
backgroundColor: snapshot.isDragging ? '#e3f2fd' : 'white',  // Azul claro
backgroundColor: snapshot.isDragging ? '#fff3cd' : 'white',  // Amarillo
backgroundColor: snapshot.isDragging ? '#d1ecf1' : 'white',  // Cyan
```

### Deshabilitar Drag & Drop Temporalmente:

```jsx
<DragDropContext onDragEnd={handleDragEnd} isDragDisabled={true}>
```

---

## 📝 Notas Importantes

1. **Orden Inicial**: Los productos nuevos tendrán `orden = 0` por defecto
2. **Conflictos**: Si dos productos tienen el mismo orden, se ordenan por ID
3. **Performance**: El índice en `orden` hace las consultas muy rápidas
4. **Sincronización**: El orden se sincroniza automáticamente entre pestañas
5. **Backup**: Considera hacer backup de la BD antes de la migración

---

## 🚀 Próximos Pasos (Opcional)

1. **Botón "Resetear Orden"**: Para volver al orden por ID
2. **Orden por Categoría**: Permitir ordenar dentro de cada categoría
3. **Drag & Drop en POS**: Agregar reordenamiento en la vista de POS
4. **Historial de Cambios**: Registrar quién cambió el orden y cuándo
5. **Orden Favorito**: Guardar múltiples configuraciones de orden

---

**Fecha**: 11 de Agosto, 2025
**Versión**: 1.0.0
