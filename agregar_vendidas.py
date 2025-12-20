#!/usr/bin/env python3
import re

# Leer el archivo
with open('/home/john/Escritorio/crm-fabrica/api/models.py', 'r') as f:
    content = f.read()

# Patrón para encontrar las definiciones de devoluciones seguidas de vencidas
# en los modelos CargueID2-6 (ya hicimos ID1)
pattern = r'(class CargueID[2-6]\(models\.Model\):.*?devoluciones = models\.IntegerField\(default=0\)\n)(    vencidas = models\.IntegerField\(default=0\))'

def replace_func(match):
    return match.group(1) + '    vendidas = models.IntegerField(default=0)  # 🆕 Cantidades vendidas en el día\n' + match.group(2)

# Aplicar el reemplazo
new_content = re.sub(pattern, replace_func, content, flags=re.DOTALL)

# Guardar el archivo
with open('/home/john/Escritorio/crm-fabrica/api/models.py', 'w') as f:
    f.write(new_content)

print("✅ Campo 'vendidas' agregado a CargueID2-6")
