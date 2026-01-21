
import glob
import re
import os

print("--- INICIANDO BÚSQUEDA DE ERRORES CSS ---")

# Buscar en src recursivamente
archivos = glob.glob('frontend/src/**/*.css', recursive=True)

errores_encontrados = 0

for archivo in archivos:
    try:
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
            lines = contenido.split('\n')
            
        for i, linea in enumerate(lines):
            num_linea = i + 1
            
            # 1. Buscar calc() sin espacios alrededor del operador /
            # Regex explica: calc seguido de cualquier cosa, luego un digito/%, luego / pegado a algo, o algo pegado a /
            # Es complejo, empecemos buscando 'calc(' y viendo si tiene '/' sin espacios ' / '
            
            if 'calc(' in linea:
                # Extraer el contenido del calc
                # Esto es rudimentario, asume que no hay calc anidados complejos en una linea
                partes = linea.split('calc(')
                for parte in partes[1:]:
                    contenido_calc = parte.split(')')[0]
                    if '/' in contenido_calc:
                        if ' / ' not in contenido_calc:
                            print(f"[ERROR POSIBLE] calc() sin espacios en {archivo}:{num_linea}")
                            print(f"  > {linea.strip()}")
                            errores_encontrados += 1

            # 2. Buscar comentarios tipo // (que no sean url http://)
            if '//' in linea:
                if 'http://' not in linea and 'https://' not in linea and 'url(' not in linea:
                     print(f"[SOSPECHOSO] Comentario // en {archivo}:{num_linea}")
                     print(f"  > {linea.strip()}")
                     errores_encontrados += 1

            # 3. Buscar barras / sueltas que no esten en calc o url
            # Esto da muchos falsos positivos (ej: font: 16px/20px), asi que lo omitimos por ahora salvo casos obvios

    except Exception as e:
        print(f"No se pudo leer {archivo}: {e}")

if errores_encontrados == 0:
    print("--- NO SE ENCONTRARON ERRORES OBVIOS DE CALC O COMENTARIOS ---")
    print("Prueba buscando: grep -r \"calc\" frontend/src")
else:
    print(f"--- SE ENCONTRARON {errores_encontrados} POSIBLES ERRORES ---")
