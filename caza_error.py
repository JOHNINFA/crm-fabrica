
import glob
import os

print("--- ESCANEO FINAL DE SINTAXIS CSS ---")

# Buscar en frontend/src
files = glob.glob('frontend/src/**/*.css', recursive=True)
count = 0

for archivo in files:
    try:
        with open(archivo, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for i, line in enumerate(lines):
            l = line.strip()
            # 1. Buscar el error maldito: / * (slash espacio asterisco)
            if '/ *' in l:
                print(f"🚨 ERROR CRÍTICO en {archivo}:{i+1}")
                print(f"   > {l}")
                count += 1
            
            # 2. Buscar el inverso: * / (asterisco espacio slash, raro pero posible)
            if '* /' in l:
                print(f"🚨 ERROR CRÍTICO en {archivo}:{i+1}")
                print(f"   > {l}")
                count += 1

    except Exception as e:
        print(f"Error leyendo {archivo}: {e}")

if count == 0:
    print("✅ No se encontraron patrones '/ *' ni '* /'.")
else:
    print(f"❌ SE ENCONTRARON {count} ERRORES. ¡ARREGLALOS!")
