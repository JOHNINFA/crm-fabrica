#!/usr/bin/env python
"""
Script independiente para verificar imágenes de productos
Ejecutar: python verificar_imagenes.py
"""
import os
import sys

# Agregar el directorio del proyecto al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')

try:
    import django
    django.setup()
except Exception as e:
    print(f"❌ Error al configurar Django: {e}")
    print("Asegúrate de estar en el directorio raíz del proyecto")
    sys.exit(1)

from api.models import Producto
from django.conf import settings

def main():
    print("\n" + "="*70)
    print("🔍 VERIFICACIÓN DE IMÁGENES DE PRODUCTOS")
    print("="*70 + "\n")
    
    # 1. Contar productos con imagen en BD
    productos_con_imagen = Producto.objects.filter(imagen__isnull=False).exclude(imagen='')
    total_productos = Producto.objects.count()
    
    print(f"📊 ESTADÍSTICAS DE BASE DE DATOS:")
    print(f"   Total de productos: {total_productos}")
    print(f"   Productos con imagen: {productos_con_imagen.count()}")
    print(f"   Productos sin imagen: {total_productos - productos_con_imagen.count()}\n")
    
    # 2. Listar imágenes en BD
    imagenes_bd = []
    print("📸 IMÁGENES EN BASE DE DATOS:")
    for producto in productos_con_imagen[:10]:  # Mostrar solo las primeras 10
        nombre_archivo = os.path.basename(producto.imagen.name) if producto.imagen else 'N/A'
        imagenes_bd.append(nombre_archivo)
        print(f"   ID {producto.id:3d}: {producto.nombre[:40]:40s} → {nombre_archivo}")
    
    if productos_con_imagen.count() > 10:
        print(f"   ... y {productos_con_imagen.count() - 10} más")
    
    # Obtener todos los nombres de archivo
    imagenes_bd = [os.path.basename(p.imagen.name) for p in productos_con_imagen if p.imagen]
    
    print(f"\n   Total de imágenes únicas en BD: {len(set(imagenes_bd))}\n")
    
    # 3. Verificar carpeta media
    media_path = os.path.join(settings.MEDIA_ROOT, 'productos')
    print(f"📁 CARPETA MEDIA: {media_path}")
    
    if os.path.exists(media_path):
        archivos_media = [f for f in os.listdir(media_path) 
                         if os.path.isfile(os.path.join(media_path, f))]
        print(f"   ✅ Carpeta existe")
        print(f"   📊 Total de archivos: {len(archivos_media)}")
        
        # Buscar huérfanas
        huerfanas_media = [f for f in archivos_media if f not in imagenes_bd]
        if huerfanas_media:
            print(f"   ⚠️  Imágenes huérfanas: {len(huerfanas_media)}")
            print(f"\n   🗑️  ARCHIVOS HUÉRFANOS EN MEDIA:")
            for i, archivo in enumerate(huerfanas_media[:5], 1):
                size = os.path.getsize(os.path.join(media_path, archivo))
                print(f"      {i}. {archivo} ({size:,} bytes)")
            if len(huerfanas_media) > 5:
                print(f"      ... y {len(huerfanas_media) - 5} más")
        else:
            print(f"   ✅ No hay imágenes huérfanas")
    else:
        print(f"   ❌ Carpeta no existe")
        huerfanas_media = []
    
    print()
    
    # 4. Verificar carpeta frontend
    frontend_path = os.path.join(settings.BASE_DIR, 'frontend', 'public', 'images', 'productos')
    print(f"📁 CARPETA FRONTEND: {frontend_path}")
    
    if os.path.exists(frontend_path):
        archivos_frontend = [f for f in os.listdir(frontend_path) 
                            if os.path.isfile(os.path.join(frontend_path, f))]
        print(f"   ✅ Carpeta existe")
        print(f"   📊 Total de archivos: {len(archivos_frontend)}")
        
        # Buscar huérfanas
        huerfanas_frontend = [f for f in archivos_frontend if f not in imagenes_bd]
        if huerfanas_frontend:
            print(f"   ⚠️  Imágenes huérfanas: {len(huerfanas_frontend)}")
            print(f"\n   🗑️  ARCHIVOS HUÉRFANOS EN FRONTEND:")
            for i, archivo in enumerate(huerfanas_frontend[:5], 1):
                size = os.path.getsize(os.path.join(frontend_path, archivo))
                print(f"      {i}. {archivo} ({size:,} bytes)")
            if len(huerfanas_frontend) > 5:
                print(f"      ... y {len(huerfanas_frontend) - 5} más")
        else:
            print(f"   ✅ No hay imágenes huérfanas")
    else:
        print(f"   ❌ Carpeta no existe")
        huerfanas_frontend = []
    
    print()
    
    # 5. Resumen final
    total_huerfanas = len(huerfanas_media) + len(huerfanas_frontend)
    
    print("="*70)
    print("📊 RESUMEN FINAL")
    print("="*70)
    print(f"Productos en BD:              {total_productos}")
    print(f"Productos con imagen:         {productos_con_imagen.count()}")
    print(f"Archivos en media:            {len(archivos_media) if os.path.exists(media_path) else 0}")
    print(f"Archivos en frontend:         {len(archivos_frontend) if os.path.exists(frontend_path) else 0}")
    print(f"Imágenes huérfanas en media:  {len(huerfanas_media)}")
    print(f"Imágenes huérfanas en frontend: {len(huerfanas_frontend)}")
    print(f"TOTAL HUÉRFANAS:              {total_huerfanas}")
    print("="*70)
    
    if total_huerfanas > 0:
        print("\n⚠️  HAY IMÁGENES HUÉRFANAS QUE PUEDEN SER ELIMINADAS")
        print("\nPara limpiarlas, ejecuta:")
        print("   python manage.py limpiar_imagenes --confirmar")
    else:
        print("\n✅ TODO ESTÁ LIMPIO - No hay imágenes huérfanas")
    
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operación cancelada por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
