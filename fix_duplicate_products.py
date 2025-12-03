import os
import django
import sys
import re
from django.db import transaction
from django.db.models import Q

# Configurar entorno Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import CargueID1

def normalizar_nombre(nombre):
    if not nombre:
        return ""
    return re.sub(r'\s+', ' ', nombre).strip()

def fusionar_registros(principal, duplicado):
    """Fusiona datos del duplicado en el principal y borra el duplicado"""
    cambios = []
    
    # Sumar cantidades numéricas
    campos_numericos = ['cantidad', 'dctos', 'adicional', 'devoluciones', 'vencidas']
    for campo in campos_numericos:
        val_duplicado = getattr(duplicado, campo) or 0
        if val_duplicado > 0:
            val_principal = getattr(principal, campo) or 0
            setattr(principal, campo, val_principal + val_duplicado)
            cambios.append(f"{campo}: {val_principal} -> {val_principal + val_duplicado}")

    # Combinar checks (OR lógico)
    campos_bool = ['v', 'd']
    for campo in campos_bool:
        val_duplicado = getattr(duplicado, campo)
        val_principal = getattr(principal, campo)
        if val_duplicado and not val_principal:
            setattr(principal, campo, True)
            cambios.append(f"{campo}: False -> True")

    # Guardar principal
    principal.save()
    
    # Borrar duplicado
    duplicado.delete()
    
    return cambios

print("🧹 Iniciando limpieza de nombres de productos en CargueID1...")

# Buscar productos que tengan espacios dobles o espacios al inicio/final
# Nota: La búsqueda exacta de regex depende del motor de BD, así que iteraremos para ser seguros
registros = CargueID1.objects.all()
procesados = 0
corregidos = 0
fusionados = 0

with transaction.atomic():
    for registro in registros:
        nombre_original = registro.producto
        nombre_normalizado = normalizar_nombre(nombre_original)
        
        if nombre_original != nombre_normalizado:
            print(f"\n🔍 Encontrado: '{nombre_original}' (ID: {registro.id})")
            print(f"   Normalizado: '{nombre_normalizado}'")
            
            # Verificar si ya existe un registro con el nombre normalizado para la misma fecha
            existente = CargueID1.objects.filter(
                fecha=registro.fecha, 
                producto=nombre_normalizado
            ).exclude(id=registro.id).first()
            
            if existente:
                print(f"   ⚠️ YA EXISTE registro destino (ID: {existente.id})")
                cambios = fusionar_registros(existente, registro)
                print(f"   ✅ FUSIONADO. Cambios: {', '.join(cambios)}")
                fusionados += 1
            else:
                registro.producto = nombre_normalizado
                registro.save()
                print(f"   ✅ NOMBRE CORREGIDO")
                corregidos += 1
                
        procesados += 1
        if procesados % 1000 == 0:
            print(f"   ... procesados {procesados} registros ...")

print(f"\n🏁 Finalizado.")
print(f"   Total procesados: {procesados}")
print(f"   Nombres corregidos: {corregidos}")
print(f"   Registros fusionados (duplicados eliminados): {fusionados}")
