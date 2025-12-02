#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Domiciliario

# Crear domiciliarios de ejemplo
domiciliarios_data = [
    {
        'codigo': 'DOM1', 
        'nombre': 'Carlos Rodríguez', 
        'telefono': '3001234567', 
        'vehiculo': 'Moto', 
        'placa': 'ABC123', 
        'zona_asignada': 'Norte',
        'activo': True
    },
    {
        'codigo': 'DOM2', 
        'nombre': 'María González', 
        'telefono': '3009876543', 
        'vehiculo': 'Moto', 
        'placa': 'XYZ789', 
        'zona_asignada': 'Sur',
        'activo': True
    },
    {
        'codigo': 'DOM3', 
        'nombre': 'Juan Pérez', 
        'telefono': '3005555555', 
        'vehiculo': 'Bicicleta', 
        'zona_asignada': 'Centro',
        'activo': True
    },
]

print("🚀 Creando domiciliarios de ejemplo...\n")

for data in domiciliarios_data:
    dom, created = Domiciliario.objects.get_or_create(
        codigo=data['codigo'], 
        defaults=data
    )
    if created:
        print(f'✅ Creado: {dom.codigo} - {dom.nombre} ({dom.zona_asignada})')
    else:
        print(f'ℹ️  Ya existe: {dom.codigo} - {dom.nombre} ({dom.zona_asignada})')

print(f'\n📊 Total domiciliarios activos en BD: {Domiciliario.objects.filter(activo=True).count()}')
print("✅ Proceso completado\n")
