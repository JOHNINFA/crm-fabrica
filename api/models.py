from django.db import models

# Modelo para el Inventario General
class Producto(models.Model):
    nombre = models.CharField(max_length=255, unique=True)  # Nombre del producto
    stock_total = models.IntegerField(default=0)  # Cantidad total en inventario

    def __str__(self):
        return f"{self.nombre} - Stock: {self.stock_total}"



class Registro(models.Model):
    DIAS = [
        ('LUNES','LUNES'), ('MARTES','MARTES'),
        ('MIERCOLES','MIERCOLES'), ('JUEVES','JUEVES'),
        ('VIERNES','VIERNES'), ('SABADO','SABADO'),
    ]
    IDS = [(f'ID{i}',f'ID{i}') for i in range(1,7)]
    dia      = models.CharField(max_length=10, choices=DIAS, default='LUNES')
    id_sheet = models.CharField(max_length=4,  choices=IDS, default='ID1')

  
    id_usuario = models.IntegerField()
    v_vendedor = models.BooleanField(default=False)
    d_despachador = models.BooleanField(default=False)
    producto = models.ForeignKey('Producto', on_delete=models.CASCADE)
    cantidad   = models.IntegerField(default=0)
    descuentos = models.IntegerField(default=0)
    adicional  = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas   = models.IntegerField(default=0)
    valor      = models.IntegerField(default=0)
    total      = models.IntegerField(default=0)
    neto       = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        self.total = (
            self.cantidad
            - self.descuentos
            + self.adicional
            - self.devoluciones
            - self.vencidas
        )
        self.neto = self.total * self.valor
        # Actualiza stock si es nuevo
        if self.pk is None:
            self.producto.stock_total -= self.total
            self.producto.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.dia}/{self.id_sheet} – {self.producto.nombre} – Usuario {self.id_usuario}"
