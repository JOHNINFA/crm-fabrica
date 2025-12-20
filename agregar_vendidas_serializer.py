#!/usr/bin/env python3
import re

# Leer el archivo
with open('/home/john/Escritorio/crm-fabrica/api/serializers.py', 'r') as f:
    content = f.read()

# Patrón para encontrar la lista de fields que contiene "devoluciones', 'vencidas'"
# y agregar 'vendidas' entre ellas
pattern = r"'devoluciones', 'vencidas'"
replacement = "'devoluciones', 'vendidas', 'vencidas'"

# Aplicar el reemplazo
new_content = content.replace(pattern, replacement)

# Guardar el archivo
with open('/home/john/Escritorio/crm-fabrica/api/serializers.py', 'w') as f:
    f.write(new_content)

print("✅ Campo 'vendidas' agregado a todos los serializers CargueIDx")
