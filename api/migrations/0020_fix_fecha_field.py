# Generated manually to fix fecha field in CargueID models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0019_add_responsable_field'),
    ]

    operations = [
        # Remove default from fecha field in all CargueID models
        migrations.AlterField(
            model_name='cargueid1',
            name='fecha',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='cargueid2',
            name='fecha',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='cargueid3',
            name='fecha',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='cargueid4',
            name='fecha',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='cargueid5',
            name='fecha',
            field=models.DateField(),
        ),
        migrations.AlterField(
            model_name='cargueid6',
            name='fecha',
            field=models.DateField(),
        ),
    ]