#!/usr/bin/env python
"""
Script para limpiar todos los pedidos de la base de datos
Útil para hacer pruebas desde cero
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Remision, DetalleRemision

# Eliminar todos los detalles de pedidos
detalles_count = DetalleRemision.objects.all().count()
DetalleRemision.objects.all().delete()
print(f"✅ Eliminados {detalles_count} detalles de pedidos")

# Eliminar todos los pedidos
pedidos_count = Remision.objects.all().count()
Remision.objects.all().delete()
print(f"✅ Eliminados {pedidos_count} pedidos")

print("\n🎉 Base de datos limpia. Puedes crear nuevos pedidos desde cero.")
