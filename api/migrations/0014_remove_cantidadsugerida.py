# Generated manually on 2025-09-22 - Eliminación de tabla CantidadSugerida

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_controlcumplimiento'),
    ]

    operations = [
        # Esta migración registra la eliminación manual de la tabla api_cantidadsugerida
        # La tabla ya fue eliminada directamente de la base de datos
        migrations.RunSQL(
            "SELECT 1;",  # Operación dummy que no hace nada pero es válida
            reverse_sql="SELECT 1;"
        ),
    ]