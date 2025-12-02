#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6, Planeacion

print("🗑️  LIMPIANDO DATOS DEL 2025-09-27\n")

fecha_objetivo = "2025-09-27"

# Limpiar tablas de Cargue
modelos_cargue = {
    'CargueID1': CargueID1,
    'CargueID2': CargueID2,
    'CargueID3': CargueID3,
    'CargueID4': CargueID4,
    'CargueID5': CargueID5,
    'CargueID6': CargueID6,
}

total_eliminados = 0

for nombre, modelo in modelos_cargue.items():
    registros = modelo.objects.filter(fecha=fecha_objetivo)
    count = registros.count()
    if count > 0:
        print(f"📊 {nombre}: {count} registros encontrados")
        registros.delete()
        total_eliminados += count
        print(f"   ✅ Eliminados")

# Limpiar tabla Planeacion
print(f"\n📊 Planeacion:")
registros_planeacion = Planeacion.objects.filter(fecha=fecha_objetivo)
count_planeacion = registros_planeacion.count()
if count_planeacion > 0:
    print(f"   {count_planeacion} registros encontrados")
    registros_planeacion.delete()
    total_eliminados += count_planeacion
    print(f"   ✅ Eliminados")
else:
    print(f"   No hay registros")

print(f"\n✅ TOTAL ELIMINADOS: {total_eliminados} registros de fecha {fecha_objetivo}")
print("🎯 Listo para pruebas!\n")
