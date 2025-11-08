"""
Comando de Django para limpiar imágenes huérfanas de productos
Uso: python manage.py limpiar_imagenes [--confirmar]
"""
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from api.models import Producto


class Command(BaseCommand):
    help = 'Limpia imágenes huérfanas de productos que no están en la base de datos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirmar',
            action='store_true',
            help='Confirma el borrado de imágenes (sin esto solo simula)',
        )

    def handle(self, *args, **options):
        confirmar = options['confirmar']
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('🔧 LIMPIEZA DE IMÁGENES HUÉRFANAS'))
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
        
        # Obtener imágenes de la BD
        imagenes_bd = []
        productos = Producto.objects.all()
        
        for producto in productos:
            if producto.imagen:
                imagenes_bd.append(os.path.basename(producto.imagen.name))
        
        self.stdout.write(f"📊 Productos con imagen en BD: {len(imagenes_bd)}\n")
        
        # Verificar carpeta media
        media_path = os.path.join(settings.MEDIA_ROOT, 'productos')
        huerfanas_media = []
        
        if os.path.exists(media_path):
            archivos_media = [f for f in os.listdir(media_path) 
                            if os.path.isfile(os.path.join(media_path, f))]
            huerfanas_media = [f for f in archivos_media if f not in imagenes_bd]
            
            self.stdout.write(f"📁 Archivos en media/productos/: {len(archivos_media)}")
            self.stdout.write(f"⚠️  Imágenes huérfanas en media: {len(huerfanas_media)}\n")
        else:
            self.stdout.write(self.style.WARNING(f"⚠️ Carpeta no existe: {media_path}\n"))
        
        # Verificar carpeta frontend
        frontend_path = os.path.join(settings.BASE_DIR, 'frontend', 'public', 'images', 'productos')
        huerfanas_frontend = []
        
        if os.path.exists(frontend_path):
            archivos_frontend = [f for f in os.listdir(frontend_path) 
                               if os.path.isfile(os.path.join(frontend_path, f))]
            huerfanas_frontend = [f for f in archivos_frontend if f not in imagenes_bd]
            
            self.stdout.write(f"📁 Archivos en frontend/public/images/productos/: {len(archivos_frontend)}")
            self.stdout.write(f"⚠️  Imágenes huérfanas en frontend: {len(huerfanas_frontend)}\n")
        else:
            self.stdout.write(self.style.WARNING(f"⚠️ Carpeta no existe: {frontend_path}\n"))
        
        total_huerfanas = len(huerfanas_media) + len(huerfanas_frontend)
        
        if total_huerfanas == 0:
            self.stdout.write(self.style.SUCCESS('✅ No hay imágenes huérfanas para limpiar\n'))
            return
        
        # Mostrar imágenes huérfanas
        if huerfanas_media:
            self.stdout.write(self.style.WARNING('\n🗑️ Imágenes huérfanas en MEDIA:'))
            for archivo in huerfanas_media:
                self.stdout.write(f"   - {archivo}")
        
        if huerfanas_frontend:
            self.stdout.write(self.style.WARNING('\n🗑️ Imágenes huérfanas en FRONTEND:'))
            for archivo in huerfanas_frontend:
                self.stdout.write(f"   - {archivo}")
        
        self.stdout.write(f"\n📊 Total de imágenes huérfanas: {total_huerfanas}\n")
        
        # Confirmar o simular
        if not confirmar:
            self.stdout.write(self.style.WARNING('⚠️ MODO SIMULACIÓN - No se borrarán archivos'))
            self.stdout.write(self.style.WARNING('Para borrar realmente, ejecuta:'))
            self.stdout.write(self.style.WARNING('python manage.py limpiar_imagenes --confirmar\n'))
            return
        
        # Borrar imágenes
        self.stdout.write(self.style.WARNING('\n🗑️ Borrando imágenes huérfanas...\n'))
        
        borradas = 0
        errores = 0
        
        # Borrar de media
        for archivo in huerfanas_media:
            filepath = os.path.join(media_path, archivo)
            try:
                os.remove(filepath)
                self.stdout.write(self.style.SUCCESS(f"✅ Eliminado de media: {archivo}"))
                borradas += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error al eliminar {archivo}: {e}"))
                errores += 1
        
        # Borrar de frontend
        for archivo in huerfanas_frontend:
            filepath = os.path.join(frontend_path, archivo)
            try:
                os.remove(filepath)
                self.stdout.write(self.style.SUCCESS(f"✅ Eliminado de frontend: {archivo}"))
                borradas += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error al eliminar {archivo}: {e}"))
                errores += 1
        
        # Resumen
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS(f'✅ Limpieza completada'))
        self.stdout.write(self.style.SUCCESS(f'📊 Imágenes borradas: {borradas}'))
        if errores > 0:
            self.stdout.write(self.style.ERROR(f'❌ Errores: {errores}'))
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
