import os
import django
import sys
from django.db import transaction

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

NOMBRE_INCORRECTO = 'AREPA DE MAIZ CON SEMILLA DE CHIA450g'
NOMBRE_CORRECTO = 'AREPA DE MAIZ CON SEMILLA DE CHIA450Gr'

print(f"🔧 Corrigiendo nombre: '{NOMBRE_INCORRECTO}' -> '{NOMBRE_CORRECTO}'")

registros_incorrectos = CargueID1.objects.filter(producto=NOMBRE_INCORRECTO)

if not registros_incorrectos.exists():
    print("❌ No se encontraron registros con el nombre incorrecto.")
else:
    print(f"📊 Se encontraron {registros_incorrectos.count()} registros para corregir.")
    
    with transaction.atomic():
        for reg in registros_incorrectos:
            print(f"\nProcessing ID: {reg.id} - Fecha: {reg.fecha}")
            
            # Verificar si ya existe el correcto
            existente = CargueID1.objects.filter(fecha=reg.fecha, producto=NOMBRE_CORRECTO).first()
            
            if existente:
                print(f"   ⚠️ YA EXISTE el destino (ID: {existente.id}). Fusionando...")
                
                # Sumar cantidades
                existente.cantidad = (existente.cantidad or 0) + (reg.cantidad or 0)
                existente.dctos = (existente.dctos or 0) + (reg.dctos or 0)
                existente.adicional = (existente.adicional or 0) + (reg.adicional or 0)
                existente.devoluciones = (existente.devoluciones or 0) + (reg.devoluciones or 0)
                existente.vencidas = (existente.vencidas or 0) + (reg.vencidas or 0)
                
                # Combinar checks
                if reg.v: existente.v = True
                if reg.d: existente.d = True
                
                existente.save()
                print(f"   ✅ Fusionado en ID {existente.id}")
                reg.delete()
                print(f"   🗑️ Registro incorrecto eliminado")
                
            else:
                reg.producto = NOMBRE_CORRECTO
                reg.save()
                print(f"   ✅ Nombre actualizado correctamente")

print("\n🏁 Proceso finalizado.")
