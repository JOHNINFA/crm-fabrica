from api.models import Cliente
count = Cliente.objects.exclude(nota__isnull=True).exclude(nota='').count()
print(f"Total clientes con nota: {count}")
if count > 0:
    print("Ejemplos:")
    for c in Cliente.objects.exclude(nota__isnull=True).exclude(nota='')[:5]:
        print(f"- {c.nombre_completo}: '{c.nota}'")
