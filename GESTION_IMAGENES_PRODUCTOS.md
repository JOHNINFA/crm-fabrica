# 📸 GESTIÓN DE IMÁGENES DE PRODUCTOS

## 🎯 Resumen

El sistema maneja imágenes de productos en **DOS ubicaciones**:
1. **Backend:** `media/productos/` (Django)
2. **Frontend:** `frontend/public/images/productos/` (React)

---

## ✅ FUNCIONALIDAD ACTUAL

### 1. Al CREAR un producto con imagen:
- ✅ Se guarda en `media/productos/`
- ✅ Se guarda en `frontend/public/images/productos/`

### 2. Al ACTUALIZAR un producto con nueva imagen:
- ✅ Se borra la imagen antigua de `media/productos/`
- ✅ Se borra la imagen antigua de `frontend/public/images/productos/`
- ✅ Se guarda la nueva imagen en ambas ubicaciones

### 3. Al ELIMINAR un producto:
- ✅ Se borra la imagen de `media/productos/`
- ✅ Se borra la imagen de `frontend/public/images/productos/`

---

## 🔧 MEJORAS IMPLEMENTADAS

### 1. Método `_delete_image_files()` en Modelo Producto

**Ubicación:** `api/models.py`

```python
def _delete_image_files(self, imagen):
    """Método auxiliar para eliminar archivos de imagen de ambas ubicaciones"""
    import os
    from django.conf import settings
    
    try:
        # Eliminar de media/productos/
        if os.path.isfile(imagen.path):
            os.remove(imagen.path)
            print(f"✅ Imagen eliminada de media: {imagen.path}")
        
        # Eliminar de frontend/public/images/productos/
        frontend_path = os.path.join(
            settings.BASE_DIR, 
            'frontend', 
            'public', 
            'images', 
            'productos',
            os.path.basename(imagen.name)
        )
        if os.path.isfile(frontend_path):
            os.remove(frontend_path)
            print(f"✅ Imagen eliminada de frontend: {frontend_path}")
    except Exception as e:
        print(f"⚠️ Error al eliminar archivos de imagen: {e}")
```

### 2. Método `delete()` mejorado

Ahora cuando se elimina un producto, también se eliminan sus imágenes:

```python
def delete(self, *args, **kwargs):
    """Eliminar imagen al borrar el producto"""
    if self.imagen:
        self._delete_image_files(self.imagen)
    super().delete(*args, **kwargs)
```

### 3. Comando de limpieza de imágenes huérfanas

**Ubicación:** `api/management/commands/limpiar_imagenes.py`

**Uso:**
```bash
# Ver imágenes huérfanas (simulación)
python manage.py limpiar_imagenes

# Borrar imágenes huérfanas (real)
python manage.py limpiar_imagenes --confirmar
```

**Funcionalidad:**
- 🔍 Busca imágenes en disco que no están en la BD
- 📊 Muestra estadísticas
- 🗑️ Borra imágenes huérfanas (con confirmación)

---

## 🧪 HERRAMIENTA DE DIAGNÓSTICO

**Ubicación:** `test_image_deletion.py`

**Uso:**
```bash
python test_image_deletion.py
```

**Funciones disponibles:**
```python
# 1. Listar imágenes en BD
listar_imagenes_productos()

# 2. Listar archivos en disco
listar_archivos_en_disco()

# 3. Buscar imágenes huérfanas
encontrar_imagenes_huerfanas()

# 4. Simular limpieza
limpiar_imagenes_huerfanas()

# 5. Limpiar realmente
limpiar_imagenes_huerfanas(confirmar=True)
```

---

## 📋 CASOS DE USO

### Caso 1: Actualizar imagen de un producto

**Frontend:**
```javascript
const productoData = {
  nombre: "Producto X",
  precio: 1000,
  imagen: "data:image/jpeg;base64,/9j/4AAQ..." // Nueva imagen
};

await productoService.update(productoId, productoData);
```

**Backend:**
1. Recibe la actualización
2. Detecta que hay una nueva imagen
3. Borra la imagen antigua de ambas ubicaciones
4. Guarda la nueva imagen en ambas ubicaciones

### Caso 2: Eliminar un producto

**Frontend:**
```javascript
await productoService.delete(productoId);
```

**Backend:**
1. Antes de eliminar el producto
2. Borra la imagen de ambas ubicaciones
3. Elimina el producto de la BD

### Caso 3: Limpiar imágenes huérfanas

**Situación:** Hay imágenes en disco que no están en la BD

**Solución:**
```bash
# 1. Ver qué imágenes están huérfanas
python manage.py limpiar_imagenes

# 2. Confirmar y borrar
python manage.py limpiar_imagenes --confirmar
```

---

## ⚠️ CONSIDERACIONES

### 1. Imágenes huérfanas pueden aparecer si:
- Se interrumpe el proceso de actualización
- Hay errores en la red
- Se edita la BD directamente
- Fallos en el servidor

### 2. Recomendaciones:
- ✅ Ejecutar `limpiar_imagenes` periódicamente (semanal/mensual)
- ✅ Hacer backup de imágenes antes de limpiar
- ✅ Revisar logs de errores en producción

### 3. Backup de imágenes:
```bash
# Backup de media
tar -czf backup_media_productos_$(date +%Y%m%d).tar.gz media/productos/

# Backup de frontend
tar -czf backup_frontend_productos_$(date +%Y%m%d).tar.gz frontend/public/images/productos/
```

---

## 🔄 FLUJO COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│                    CREAR PRODUCTO                           │
│                                                             │
│  Frontend envía imagen base64                               │
│    ↓                                                        │
│  Backend recibe y convierte a archivo                       │
│    ↓                                                        │
│  Guarda en media/productos/                                 │
│    ↓                                                        │
│  Guarda en frontend/public/images/productos/                │
│    ↓                                                        │
│  Guarda referencia en BD                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  ACTUALIZAR PRODUCTO                        │
│                                                             │
│  Frontend envía nueva imagen base64                         │
│    ↓                                                        │
│  Backend detecta cambio de imagen                           │
│    ↓                                                        │
│  Borra imagen antigua de media/productos/                   │
│    ↓                                                        │
│  Borra imagen antigua de frontend/public/images/productos/  │
│    ↓                                                        │
│  Guarda nueva imagen en ambas ubicaciones                   │
│    ↓                                                        │
│  Actualiza referencia en BD                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   ELIMINAR PRODUCTO                         │
│                                                             │
│  Frontend solicita eliminación                              │
│    ↓                                                        │
│  Backend ejecuta delete()                                   │
│    ↓                                                        │
│  Borra imagen de media/productos/                           │
│    ↓                                                        │
│  Borra imagen de frontend/public/images/productos/          │
│    ↓                                                        │
│  Elimina producto de BD                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 ESTADÍSTICAS Y MONITOREO

### Ver estadísticas de imágenes:
```bash
# Contar productos con imagen
python manage.py shell
>>> from api.models import Producto
>>> Producto.objects.filter(imagen__isnull=False).count()

# Contar archivos en disco
>>> import os
>>> from django.conf import settings
>>> media_path = os.path.join(settings.MEDIA_ROOT, 'productos')
>>> len([f for f in os.listdir(media_path) if os.path.isfile(os.path.join(media_path, f))])
```

---

## ✅ RESPUESTA A TU PREGUNTA

**"¿Cuando edito un producto o cambio imagen, la imagen que ya está en el servidor se borra?"**

**Respuesta:** ✅ **SÍ, se borra automáticamente**

**Cómo funciona:**
1. Cuando actualizas un producto con una nueva imagen
2. Django detecta que la imagen cambió
3. Borra la imagen antigua de `media/productos/`
4. Borra la imagen antigua de `frontend/public/images/productos/`
5. Guarda la nueva imagen en ambas ubicaciones

**Mejoras implementadas:**
- ✅ Ahora también se borran las imágenes al eliminar un producto
- ✅ Comando para limpiar imágenes huérfanas
- ✅ Herramienta de diagnóstico
- ✅ Método centralizado para borrar imágenes

---

## 🚀 PRÓXIMOS PASOS

1. **Probar el comando de limpieza:**
   ```bash
   python manage.py limpiar_imagenes
   ```

2. **Verificar que no hay imágenes huérfanas:**
   ```bash
   python test_image_deletion.py
   ```

3. **Configurar limpieza automática (opcional):**
   - Crear tarea cron/celery para ejecutar semanalmente
   - Agregar al proceso de deployment

4. **Monitoreo:**
   - Agregar logs de borrado de imágenes
   - Dashboard con estadísticas de almacenamiento
