# INSTRUCCIONES PARA AGREGAR COLUMNA "vendidas"

## PASO 1: Ejecutar en terminal

```bash
cd /home/john/Escritorio/crm-fabrica
python3 manage.py makemigrations
python3 manage.py migrate
```

## PASO 2: Verificar que se agregó correctamente

Abre el shell de Django:
```bash
python3 manage.py shell
```

Y ejecuta:
```python
from api.models import CargueID1
print([f.name for f in CargueID1._meta.get_fields()])
```

Deberías ver 'vendidas' en la lista.

## PASO 3: Si NO funciona automáticamente

Ejecuta este comando para crear la migración manual:

```bash
python3 manage.py makemigrations api --empty --name add_vendidas_field
```

Luego edita el archivo creado en `api/migrations/` y agrega:

```python
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('api', 'XXXX_previous_migration'),  # Cambia por la migración anterior
    ]
    
    operations = [
        migrations.AddField(
            model_name='cargueid1',
            name='vendidas',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='cargueid2',
            name='vendidas',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='cargueid3',
            name='vendidas',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='cargueid4',
            name='vendidas',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='cargueid5',
            name='vendidas',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='cargueid6',
            name='vendidas',
            field=models.IntegerField(default=0),
        ),
    ]
```

Luego ejecuta:
```bash
python3 manage.py migrate
```

---

**AVÍSAME CUANDO TERMINES ESTE PASO Y CONTINÚO CON EL FRONTEND**
