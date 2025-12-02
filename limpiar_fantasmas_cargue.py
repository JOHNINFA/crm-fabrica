#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6

print("🔍 Buscando datos fantasmas (cantidad=0 y total=0)...\n")

modelos = {
    'ID1': CargueID1,
    'ID2': CargueID2,
    'ID3': CargueID3,
    'ID4': CargueID4,
    'ID5': CargueID5,
    'ID6': CargueID6,
}

total_fantasmas = 0

for nombre, modelo in modelos.items():
    fantasmas = modelo.objects.filter(cantidad=0, total=0)
    count = fantasmas.count()
    total_fantasmas += count
    
    if count > 0:
        print(f"📊 {nombre}: {count} registros fantasmas encontrados")
        for reg in fantasmas[:3]:
            print(f"   - {reg.dia} {reg.fecha} {reg.producto}")
        print()

print(f"\n📈 TOTAL FANTASMAS: {total_fantasmas} registros\n")

# Preguntar si eliminar
respuesta = input("¿Deseas eliminar estos datos fantasmas? (s/n): ")

if respuesta.lower() == 's':
    eliminados = 0
    for nombre, modelo in modelos.items():
        fantasmas = modelo.objects.filter(cantidad=0, total=0)
        count = fantasmas.count()
        fantasmas.delete()
        eliminados += count
        if count > 0:
            print(f"✅ {nombre}: {count} registros eliminados")
    
    print(f"\n✅ TOTAL ELIMINADOS: {eliminados} registros")
else:
    print("❌ No se eliminaron datos")
