"""
Script de prueba para verificar el borrado de imágenes al actualizar productos
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Producto
from django.conf import settings

def listar_imagenes_productos():
    """Lista todas las imágenes de productos en el sistema"""
    print("\n" + "="*60)
    print("📸 IMÁGENES DE PRODUCTOS EN BASE DE DATOS")
    print("="*60)
    
    productos = Producto.objects.all()
    imagenes_bd = []
    
    for producto in productos:
        if producto.imagen:
            imagenes_bd.append(producto.imagen.name)
            print(f"ID {producto.id}: {producto.nombre}")
            print(f"   └─ Imagen: {producto.imagen.name}")
    
    print(f"\n📊 Total productos con imagen: {len(imagenes_bd)}")
    
    return imagenes_bd

def listar_archivos_en_disco():
    """Lista todos los archivos de imagen en disco"""
    print("\n" + "="*60)
    print("💾 ARCHIVOS DE IMAGEN EN DISCO")
    print("="*60)
    
    # Ruta de media
    media_path = os.path.join(settings.MEDIA_ROOT, 'productos')
    archivos_media = []
    
    if os.path.exists(media_path):
        archivos_media = [f for f in os.listdir(media_path) if os.path.isfile(os.path.join(media_path, f))]
        print(f"\n📁 Media ({media_path}):")
        for archivo in archivos_media:
            print(f"   - {archivo}")
    else:
        print(f"⚠️ Carpeta no existe: {media_path}")
    
    # Ruta de frontend
    frontend_path = os.path.join(settings.BASE_DIR, 'frontend', 'public', 'images', 'productos')
    archivos_frontend = []
    
    if os.path.exists(frontend_path):
        archivos_frontend = [f for f in os.listdir(frontend_path) if os.path.isfile(os.path.join(frontend_path, f))]
        print(f"\n📁 Frontend ({frontend_path}):")
        for archivo in archivos_frontend:
            print(f"   - {archivo}")
    else:
        print(f"⚠️ Carpeta no existe: {frontend_path}")
    
    print(f"\n📊 Total archivos en media: {len(archivos_media)}")
    print(f"📊 Total archivos en frontend: {len(archivos_frontend)}")
    
    return archivos_media, archivos_frontend

def encontrar_imagenes_huerfanas():
    """Encuentra imágenes en disco que no están en la BD"""
    print("\n" + "="*60)
    print("🔍 BUSCANDO IMÁGENES HUÉRFANAS")
    print("="*60)
    
    imagenes_bd = listar_imagenes_productos()
    archivos_media, archivos_frontend = listar_archivos_en_disco()
    
    # Extraer solo los nombres de archivo de la BD
    nombres_bd = [os.path.basename(img) for img in imagenes_bd]
    
    # Encontrar huérfanas en media
    huerfanas_media = [f for f in archivos_media if f not in nombres_bd]
    
    # Encontrar huérfanas en frontend
    huerfanas_frontend = [f for f in archivos_frontend if f not in nombres_bd]
    
    if huerfanas_media:
        print(f"\n⚠️ Imágenes huérfanas en MEDIA ({len(huerfanas_media)}):")
        for archivo in huerfanas_media:
            print(f"   - {archivo}")
    else:
        print("\n✅ No hay imágenes huérfanas en MEDIA")
    
    if huerfanas_frontend:
        print(f"\n⚠️ Imágenes huérfanas en FRONTEND ({len(huerfanas_frontend)}):")
        for archivo in huerfanas_frontend:
            print(f"   - {archivo}")
    else:
        print("\n✅ No hay imágenes huérfanas en FRONTEND")
    
    return huerfanas_media, huerfanas_frontend

def limpiar_imagenes_huerfanas(confirmar=False):
    """Limpia las imágenes huérfanas del sistema"""
    huerfanas_media, huerfanas_frontend = encontrar_imagenes_huerfanas()
    
    total_huerfanas = len(huerfanas_media) + len(huerfanas_frontend)
    
    if total_huerfanas == 0:
        print("\n✅ No hay imágenes huérfanas para limpiar")
        return
    
    print(f"\n🗑️ Se encontraron {total_huerfanas} imágenes huérfanas")
    
    if not confirmar:
        print("\n⚠️ MODO SIMULACIÓN - No se borrarán archivos")
        print("Para borrar realmente, ejecuta: limpiar_imagenes_huerfanas(confirmar=True)")
        return
    
    # Borrar de media
    media_path = os.path.join(settings.MEDIA_ROOT, 'productos')
    for archivo in huerfanas_media:
        filepath = os.path.join(media_path, archivo)
        try:
            os.remove(filepath)
            print(f"✅ Eliminado de media: {archivo}")
        except Exception as e:
            print(f"❌ Error al eliminar {archivo}: {e}")
    
    # Borrar de frontend
    frontend_path = os.path.join(settings.BASE_DIR, 'frontend', 'public', 'images', 'productos')
    for archivo in huerfanas_frontend:
        filepath = os.path.join(frontend_path, archivo)
        try:
            os.remove(filepath)
            print(f"✅ Eliminado de frontend: {archivo}")
        except Exception as e:
            print(f"❌ Error al eliminar {archivo}: {e}")
    
    print(f"\n✅ Limpieza completada")

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🔧 HERRAMIENTA DE DIAGNÓSTICO DE IMÁGENES")
    print("="*60)
    
    # Ejecutar diagnóstico
    encontrar_imagenes_huerfanas()
    
    print("\n" + "="*60)
    print("💡 COMANDOS DISPONIBLES:")
    print("="*60)
    print("1. listar_imagenes_productos() - Lista imágenes en BD")
    print("2. listar_archivos_en_disco() - Lista archivos en disco")
    print("3. encontrar_imagenes_huerfanas() - Busca imágenes huérfanas")
    print("4. limpiar_imagenes_huerfanas() - Simula limpieza")
    print("5. limpiar_imagenes_huerfanas(confirmar=True) - Limpia realmente")
    print("="*60 + "\n")
