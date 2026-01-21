
import re

archivo = 'frontend/src/styles/CajaScreen.css'

print(f"Limpiando comentarios de {archivo}...")

try:
    with open(archivo, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Expresión regular para eliminar comentarios /* ... */
    # \/\* coincide con /*
    # [\s\S]*? coincide con cualquier caracter (incluyendo saltos de linea) de forma no codiciosa
    # \*\/ coincide con */
    contenido_limpio = re.sub(r'/\*[\s\S]*?\*/', '', contenido)
    
    # También asegurarnos de que no queden cosas raras como calc(100%/3)
    # Reemplazar calc(A/B) por calc(A / B) es dificil con regex, pero intentemos un fix comun
    # Buscar patrones de division sin espacios
    # contenido_limpio = re.sub(r'calc\(([^)]*?)/([^)]*?)\)', r'calc(\1 / \2)', contenido_limpio)
    
    with open(archivo, 'w', encoding='utf-8') as f:
        f.write(contenido_limpio)
        
    print("¡Archivo limpiado con éxito!")
    
except Exception as e:
    print(f"Error: {e}")
