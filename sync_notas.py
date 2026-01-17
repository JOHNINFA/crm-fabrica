from api.models import Cliente, ClienteRuta
from django.db.models import Q

print("Iniciando sincronización masiva de notas...")
clientes_con_nota = Cliente.objects.exclude(nota__isnull=True).exclude(nota='')
count = 0

for cliente in clientes_con_nota:
    # Buscar coincidencias en ClienteRuta por nombre de negocio o contacto
    matches = ClienteRuta.objects.filter(
        Q(nombre_negocio__iexact=cliente.alias) | 
        Q(nombre_negocio__iexact=cliente.nombre_completo) |
        Q(nombre_contacto__iexact=cliente.nombre_completo)
    )
    
    if matches.exists():
        for cr in matches:
            if cr.nota != cliente.nota:
                cr.nota = cliente.nota
                cr.save()
                print(f"✅ Nota sincronizada para: {cr.nombre_negocio}")
                count += 1

print(f"\nProceso terminado. Se actualizaron {count} registros en Rutas.")
