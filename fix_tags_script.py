import os
import django
import sys

# Setup Django environment
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Cliente, ClienteRuta
from django.db.models import Q

print("--- Iniciando Sincronización de Etiquetas de Origen ---")

# Obtener todos los clientes de ruta activos
rutas_clientes = ClienteRuta.objects.filter(activo=True)
updated_count = 0

for cr in rutas_clientes:
    match_found = False
    
    # 1. Buscar coincidencia por TÉLEFONO (si tiene)
    if cr.telefono and len(str(cr.telefono)) > 6:
        clientes = Cliente.objects.filter(Q(movil=str(cr.telefono)) | Q(telefono_1=str(cr.telefono)))
        if clientes.exists():
            match_found = True
            
    # 2. Buscar coincidencia por NOMBRE NEGOCIO (Exacta)
    if not match_found and cr.nombre_negocio:
        clientes = Cliente.objects.filter(alias__iexact=cr.nombre_negocio)
        if clientes.exists():
            match_found = True
            
    # 3. Buscar coincidencia por NOMBRE CONTACTO (Exacta)
    if not match_found and cr.nombre_contacto:
        clientes = Cliente.objects.filter(nombre_completo__iexact=cr.nombre_contacto)
        if clientes.exists():
            match_found = True

    # Si encontramos match en el sistema central, ETIQUETAR
    if match_found:
        current_type = cr.tipo_negocio or "Comercio"
        
        # Solo actualizar si no tiene ya la etiqueta
        if "PEDIDOS" not in current_type:
            # Limpiar etiqueta anterior si existiera una mal formada
            base_type = current_type.split(' | ')[0]
            new_type = f"{base_type} | PEDIDOS"
            
            cr.tipo_negocio = new_type
            cr.save()
            print(f"✅ [ACTUALIZADO]: {cr.nombre_negocio} -> {new_type}")
            updated_count += 1
        else:
            print(f"ℹ️ [YA ETIQUETADO]: {cr.nombre_negocio}")
    else:
        # Si NO tiene match, asegurarse de que NO tenga la etiqueta (opcional, por si acaso)
        pass

print(f"\n--- Proceso Terminado. Total actualizados: {updated_count} ---")
