#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_fabrica.settings')
django.setup()

from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6

modelos = [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]

for modelo in modelos:
    registros = modelo.objects.all()
    for reg in registros:
        # Forzar recálculo de total
        reg.save()
    print(f"✅ {modelo.__name__}: {registros.count()} registros actualizados")

print("✅ Totales recalculados correctamente")
