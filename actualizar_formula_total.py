#!/usr/bin/env python3
import re

# Leer el archivo
with open('/home/john/Escritorio/crm-fabrica/api/models.py', 'r') as f:
    content = f.read()

# Patrón para la fórmula antigua
pattern = r'self\.total = self\.cantidad - self\.dctos \+ self\.adicional - self\.devoluciones - self\.vencidas'
replacement = 'self.total = self.cantidad - self.dctos + self.adicional - self.devoluciones - self.vendidas - self.vencidas'

# Aplicar el reemplazo
new_content = content.replace(pattern, replacement)

# Guardar el archivo
with open('/home/john/Escritorio/crm-fabrica/api/models.py', 'w') as f:
    f.write(new_content)

print("✅ Fórmula de total actualizada en todos los modelos CargueIDx")
