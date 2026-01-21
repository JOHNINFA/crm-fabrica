
import glob
import os

print("--- ESCANEANDO TODO EL PROYECTO EN BUSCA DE SLASHES MALOS ---")

files = glob.glob('frontend/src/**/*.css', recursive=True)

found_any = False

for archivo in files:
    try:
        with open(archivo, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for i, line in enumerate(lines):
            l = line.strip()
            if not l: continue
            
            # Buscar slashes fuera de lugar
            if '/' in l:
                # Ignorar comentarios validos (o parte de ellos)
                if '/*' in l or '*/' in l: continue
                 # Ignorar urls
                if 'url(' in l: continue
                # Ignorar calcs validos (con espacios)
                if 'calc' in l and ' / ' in l: continue
                # Ignorar propiedades que usan /
                if any(prop in l for prop in ['font:', 'grid:', 'grid-template', 'border-radius:', 'aspect-ratio:', 'background:']): continue
                
                # Ignorar variables CSS que podrian tener / ?? raro pero posible
                
                # Si llegamos aqui, es sospechoso.
                # Especimen común: calc(100%/3) -> falla
                # Especimen común: / suelto
                
                print(f"!!! SOSPECHOSO en {archivo}:{i+1}")
                print(f"    > {l}")
                found_any = True

    except Exception as e:
        print(f"Error leyendo {archivo}: {e}")

if not found_any:
    print("No se encontraron errores obvios con este filtro.")
else:
    print("Revisa las líneas marcadas arriba.")
