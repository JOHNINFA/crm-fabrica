#!/usr/bin/env python3
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

# Borrar fechas fantasma (todas las que no sean la fecha actual de trabajo)
from datetime import date
hoy = date.today()

# Obtener todas las fechas únicas
fechas_en_bd = CargueID1.objects.values_list('fecha', flat=True).distinct()
print(f'📊 Fechas en BD: {list(fechas_en_bd)}')

# Borrar fechas específicas problemáticas
fechas_fantasma = ['2025-09-27', '2025-10-11', '2025-09-06']

total = 0
for fecha in fechas_fantasma:
    registros = CargueID1.objects.filter(fecha=fecha)
    count = registros.count()
    if count > 0:
        print(f'🔍 Fecha {fecha}: {count} registros')
        registros.delete()
        total += count
        print(f'   ✅ Eliminados')

print(f'\n✅ TOTAL: {total} registros eliminados de api_cargueid1')
