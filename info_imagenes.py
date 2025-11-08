#!/usr/bin/env python
"""
Script simple para ver información de imágenes
Ejecutar desde la raíz del proyecto: python info_imagenes.py
"""
import os

def contar_archivos(ruta):
    """Cuenta archivos en una carpeta"""
    if not os.path.exists(ruta):
        return 0, "❌ No existe"
    
    try:
        archivos = [f for f in os.listdir(ruta) if os.path.isfile(os.path.join(ruta, f))]
        return len(archivos), "✅ OK"
    except Exception as e:
        return 0, f"❌ Error: {e}"

def calcular_tamano(ruta):
    """Calcula el tamaño total de archivos en una carpeta"""
    if not os.path.exists(ruta):
        return 0
    
    total = 0
    try:
        for archivo in os.listdir(ruta):
            filepath = os.path.join(ruta, archivo)
            if os.path.isfile(filepath):
                total += os.path.getsize(filepath)
    except:
        pass
    
    return total

def formatear_bytes(bytes):
    """Formatea bytes a formato legible"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes < 1024.0:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.2f} TB"

def main():
    print("\n" + "="*60)
    print("📸 INFORMACIÓN DE IMÁGENES DE PRODUCTOS")
    print("="*60 + "\n")
    
    # Rutas
    media_path = os.path.join('media', 'productos')
    frontend_path = os.path.join('frontend', 'public', 'images', 'productos')
    
    # Contar archivos
    media_count, media_status = contar_archivos(media_path)
    frontend_count, frontend_status = contar_archivos(frontend_path)
    
    # Calcular tamaños
    media_size = calcular_tamano(media_path)
    frontend_size = calcular_tamano(frontend_path)
    
    # Mostrar información
    print(f"📁 CARPETA MEDIA:")
    print(f"   Ruta: {os.path.abspath(media_path)}")
    print(f"   Estado: {media_status}")
    print(f"   Archivos: {media_count}")
    print(f"   Tamaño: {formatear_bytes(media_size)}\n")
    
    print(f"📁 CARPETA FRONTEND:")
    print(f"   Ruta: {os.path.abspath(frontend_path)}")
    print(f"   Estado: {frontend_status}")
    print(f"   Archivos: {frontend_count}")
    print(f"   Tamaño: {formatear_bytes(frontend_size)}\n")
    
    print("="*60)
    print(f"📊 TOTAL:")
    print(f"   Archivos: {media_count + frontend_count}")
    print(f"   Tamaño: {formatear_bytes(media_size + frontend_size)}")
    print("="*60 + "\n")
    
    # Listar algunos archivos
    if media_count > 0:
        print("📋 ARCHIVOS EN MEDIA (primeros 10):")
        try:
            archivos = sorted(os.listdir(media_path))[:10]
            for i, archivo in enumerate(archivos, 1):
                filepath = os.path.join(media_path, archivo)
                size = os.path.getsize(filepath)
                print(f"   {i:2d}. {archivo} ({formatear_bytes(size)})")
            if media_count > 10:
                print(f"   ... y {media_count - 10} más")
        except Exception as e:
            print(f"   ❌ Error al listar: {e}")
        print()
    
    if frontend_count > 0:
        print("📋 ARCHIVOS EN FRONTEND (primeros 10):")
        try:
            archivos = sorted(os.listdir(frontend_path))[:10]
            for i, archivo in enumerate(archivos, 1):
                filepath = os.path.join(frontend_path, archivo)
                size = os.path.getsize(filepath)
                print(f"   {i:2d}. {archivo} ({formatear_bytes(size)})")
            if frontend_count > 10:
                print(f"   ... y {frontend_count - 10} más")
        except Exception as e:
            print(f"   ❌ Error al listar: {e}")
        print()
    
    print("💡 Para verificar imágenes huérfanas, ejecuta:")
    print("   python verificar_imagenes.py\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelado")
    except Exception as e:
        print(f"\n❌ Error: {e}")
