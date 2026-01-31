
from PIL import Image
import os

def process_icon():
    source_path = 'frontend/src/assets/images/icono.png'
    public_dir = 'frontend/public'
    
    if not os.path.exists(source_path):
        print(f"Error: {source_path} no encontrado")
        return

    try:
        img = Image.open(source_path)
        print(f"Original specs: {img.size} {img.mode}")
        
        # 1. Hacerla cuadrada
        size = max(img.size)
        new_img = Image.new('RGBA', (size, size), (255, 255, 255, 0)) # Transparente
        
        # Centrar
        left = (size - img.width) // 2
        top = (size - img.height) // 2
        new_img.paste(img, (left, top))
        
        # 2. Generar tamaños
        sizes = {
            'logo512.png': (512, 512),
            'logo192.png': (192, 192),
            'favicon.png': (64, 64)
        }
        
        # Compatibilidad con versiones viejas de Pillow
        resample_method = getattr(Image, 'Resampling', Image).LANCZOS if hasattr(Image, 'Resampling') or hasattr(Image, 'LANCZOS') else Image.ANTIALIAS
        
        for filename, dims in sizes.items():
            resized = new_img.resize(dims, resample_method)
            out_path = os.path.join(public_dir, filename)
            resized.save(out_path)
            print(f"Generado: {out_path} ({dims})")
            
        print("✅ Iconos generados correctamente en formato cuadrado.")
        
    except Exception as e:
        print(f"❌ Error procesando imagenes: {e}")

if __name__ == "__main__":
    process_icon()
