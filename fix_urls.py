
import glob
import os

print("--- INICIANDO REEMPLAZO MASIVO DE URLS (VERSIÓN 2) ---")

# Buscar archivos JS y JSX por separado
files_js = glob.glob('frontend/src/**/*.js', recursive=True)
files_jsx = glob.glob('frontend/src/**/*.jsx', recursive=True)
files = files_js + files_jsx

print(f"Archivos encontrados para analizar: {len(files)}")

# Targets posibles (comillas simples y dobles)
# No incluimos las comillas en el reemplazo, buscamos la cadena dentro
search_string = "http://localhost:8000/api"
replacement = "/api"

search_string_root = "http://localhost:8000"
# Si encontramos http://localhost:8000 SIN /api, lo reemplazamos por nada o relativo
# Pero con cuidado.

count = 0
files_changed = 0

for archivo in files:
    try:
        with open(archivo, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified = False
        
        # Reemplazo principal
        if search_string in content:
            content = content.replace(search_string, replacement)
            modified = True
            count += 1
            
        # Reemplazo secundario (localhost:8000 suelto, si existe y no es parte de la anterior)
        # Esto es más arriesgado, mejor solo si está explícito.
        # Por ahora solo atacamos la API que es la que da el error.
        
        if modified:
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Corregido: {archivo}")
            files_changed += 1
            
    except Exception as e:
        print(f"Error en {archivo}: {e}")

print(f"\n--- RESUMEN ---")
print(f"Archivos modificados: {files_changed}")
