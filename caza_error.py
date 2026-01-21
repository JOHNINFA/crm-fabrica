
import re

archivo = 'frontend/src/styles/CajaScreen.css'
print(f"--- ANALIZANDO {archivo} ---")

try:
    with open(archivo, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    found = False
    for i, line in enumerate(lines):
        # Limpiar espacios
        l = line.strip()
        if not l: continue
        
        # Si tiene un /
        if '/' in l:
            # Ignorar si es calc con espacios correctos (aprox)
            if 'calc' in l and ' / ' in l: continue
            
            # Ignorar si es url(...)
            if 'url(' in l: continue
            
            # Ignorar si es propiedad compuesta conocida que usa /
            # font: 16px/24px
            # grid-template: ... / ...
            # border-radius: ... / ...
            # aspect-ratio: ... / ...
            if any(prop in l for prop in ['font:', 'grid:', 'grid-template', 'border-radius:', 'aspect-ratio:', 'background:']): 
                # Aún así, vamos a mostrarla por si acaso es un falso negativo
                print(f"INFO linea {i+1}: Contiene slash pero parece propiedad válida: {l}")
                continue

            # Si llegamos aquí, es un slash sospechoso
            print(f"!!! ALERTA ERROR linea {i+1}: Slash '/' sospechoso: {l}")
            found = True

    if not found:
        print("No se encontraron slashes obvios fuera de lugar.")
        print("Buscando 'calc' deformes...")
        for i, line in enumerate(lines):
             if 'calc(' in line and '/' in line and ' / ' not in line:
                 print(f"!!! ALERTA ERROR linea {i+1}: calc() sin espacios: {line.strip()}")

except Exception as e:
    print(f"Error: {e}")
