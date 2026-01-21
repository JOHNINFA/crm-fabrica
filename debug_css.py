
import glob
import re

print("Buscando errores en archivos CSS...")

files = glob.glob("frontend/src/**/*.css", recursive=True)

for file_path in files:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for i, line in enumerate(lines):
                # Check for bad comments
                # Regex: // that is not preceded by : (to avoid http://)
                if re.search(r'(?<!:)\/\/.*', line):
                    print(f"POSIBLE ERROR (Comentario //) en {file_path}:{i+1}")
                    print(f"  > {line.strip()}")
                
                # Check for unescaped slashes in data URIs
                if 'data:image/svg+xml' in line:
                     # Remove the initial part to avoid matching the first slash
                     content_part = line.split('data:image/svg+xml')[1]
                     if '/' in content_part and '%2F' not in content_part.upper(): # Simple heurística
                         # If it has literal / inside the data part
                         # But wait, closing tags like </svg> are often %3c/svg%3e or </svg>
                         # Minifiers hate </svg> literal sometimes? No, they hate / inside attributes
                         print(f"POSIBLE ERROR (SVG sin escapar) en {file_path}:{i+1}")
                         print(f"  > {line.strip()}")

    except Exception as e:
        print(f"No se pudo leer {file_path}: {e}")
