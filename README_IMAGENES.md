# 📸 Gestión de Imágenes - Guía Rápida

## 🎯 ¿Qué hace el sistema?

Cuando editas un producto y cambias su imagen:
- ✅ **SÍ se borra** la imagen antigua automáticamente
- ✅ Se borra de `media/productos/`
- ✅ Se borra de `frontend/public/images/productos/`
- ✅ Se guarda la nueva imagen en ambos lugares

## 🔧 Herramientas Disponibles

### 1. Ver información básica (sin Django)
```bash
python info_imagenes.py
```
**Muestra:**
- Cuántos archivos hay en cada carpeta
- Tamaño total de las imágenes
- Lista de archivos

### 2. Verificar imágenes huérfanas (requiere Django)
```bash
python verificar_imagenes.py
```
**Muestra:**
- Productos en base de datos
- Archivos en disco
- Imágenes huérfanas (archivos sin producto asociado)

### 3. Limpiar imágenes huérfanas (comando Django)
```bash
# Ver qué se borraría (simulación)
python manage.py limpiar_imagenes

# Borrar realmente
python manage.py limpiar_imagenes --confirmar
```

## 📋 Casos de Uso

### Caso 1: Quiero ver cuántas imágenes tengo
```bash
python info_imagenes.py
```

### Caso 2: Quiero saber si hay imágenes huérfanas
```bash
python verificar_imagenes.py
```

### Caso 3: Quiero limpiar imágenes huérfanas
```bash
# Primero ver qué se borraría
python manage.py limpiar_imagenes

# Si estás seguro, borrar
python manage.py limpiar_imagenes --confirmar
```

### Caso 4: Quiero hacer backup antes de limpiar
```bash
# Backup de media
tar -czf backup_media_$(date +%Y%m%d).tar.gz media/productos/

# Backup de frontend
tar -czf backup_frontend_$(date +%Y%m%d).tar.gz frontend/public/images/productos/
```

## ⚠️ Importante

### ¿Cuándo aparecen imágenes huérfanas?
- Cuando se interrumpe una actualización
- Cuando hay errores en el servidor
- Cuando se edita la base de datos directamente
- Cuando falla la sincronización

### ¿Es seguro borrar imágenes huérfanas?
✅ **SÍ**, son archivos que no están asociados a ningún producto

### ¿Con qué frecuencia debo limpiar?
📅 Recomendado: **Una vez al mes** o cuando notes que el espacio en disco crece mucho

## 🔄 Flujo de Actualización de Imagen

```
Usuario edita producto y sube nueva imagen
    ↓
Frontend envía imagen al backend
    ↓
Backend detecta que hay una imagen antigua
    ↓
🗑️ BORRA imagen antigua de media/productos/
    ↓
🗑️ BORRA imagen antigua de frontend/public/images/productos/
    ↓
✅ Guarda nueva imagen en media/productos/
    ↓
✅ Guarda nueva imagen en frontend/public/images/productos/
    ↓
✅ Actualiza referencia en base de datos
```

## 📊 Ejemplo de Salida

### info_imagenes.py
```
============================================================
📸 INFORMACIÓN DE IMÁGENES DE PRODUCTOS
============================================================

📁 CARPETA MEDIA:
   Ruta: /home/proyecto/media/productos
   Estado: ✅ OK
   Archivos: 45
   Tamaño: 2.34 MB

📁 CARPETA FRONTEND:
   Ruta: /home/proyecto/frontend/public/images/productos
   Estado: ✅ OK
   Archivos: 45
   Tamaño: 2.34 MB

============================================================
📊 TOTAL:
   Archivos: 90
   Tamaño: 4.68 MB
============================================================
```

### verificar_imagenes.py
```
======================================================================
🔍 VERIFICACIÓN DE IMÁGENES DE PRODUCTOS
======================================================================

📊 ESTADÍSTICAS DE BASE DE DATOS:
   Total de productos: 50
   Productos con imagen: 45
   Productos sin imagen: 5

📁 CARPETA MEDIA: /home/proyecto/media/productos
   ✅ Carpeta existe
   📊 Total de archivos: 47
   ⚠️  Imágenes huérfanas: 2

   🗑️  ARCHIVOS HUÉRFANOS EN MEDIA:
      1. producto_123_old.jpg (45,234 bytes)
      2. producto_456_backup.jpg (38,912 bytes)

======================================================================
📊 RESUMEN FINAL
======================================================================
Productos en BD:              50
Productos con imagen:         45
Archivos en media:            47
Archivos en frontend:         47
Imágenes huérfanas en media:  2
Imágenes huérfanas en frontend: 2
TOTAL HUÉRFANAS:              4
======================================================================

⚠️  HAY IMÁGENES HUÉRFANAS QUE PUEDEN SER ELIMINADAS

Para limpiarlas, ejecuta:
   python manage.py limpiar_imagenes --confirmar
```

## 🚀 Inicio Rápido

1. **Ver información básica:**
   ```bash
   python info_imagenes.py
   ```

2. **Si quieres más detalles:**
   ```bash
   python verificar_imagenes.py
   ```

3. **Si hay imágenes huérfanas y quieres limpiar:**
   ```bash
   python manage.py limpiar_imagenes --confirmar
   ```

## 📞 Soporte

Si tienes dudas o problemas:
1. Revisa `GESTION_IMAGENES_PRODUCTOS.md` para documentación completa
2. Ejecuta `python info_imagenes.py` para diagnóstico básico
3. Ejecuta `python verificar_imagenes.py` para diagnóstico completo

---

**Última actualización:** 2025-01-11
