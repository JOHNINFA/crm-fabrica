from django.db import models

# Modelo para el Inventario General
class Producto(models.Model):
    nombre = models.CharField(max_length=255, unique=True)  # Nombre del producto
    stock_total = models.IntegerField(default=0)  # Cantidad total en inventario

    def __str__(self):
        return f"{self.nombre} - Stock: {self.stock_total}"

# Modelo para las transacciones de los usuarios
class Registro(models.Model):
    # Puedes cambiar id_usuario a un ForeignKey a User si manejas autenticación
    id_usuario = models.IntegerField()  
    v_vendedor = models.BooleanField(default=False)  
    d_despachador = models.BooleanField(default=False)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)  # Relación con Producto

    # Datos ingresados desde React (algunos vienen de React Native y otros de la interfaz web)
    cantidad = models.IntegerField(default=0)
    descuentos = models.IntegerField(default=0)
    adicional = models.IntegerField(default=0)
    devoluciones = models.IntegerField(default=0)
    vencidas = models.IntegerField(default=0)
    valor = models.IntegerField(default=0)

    # Campos calculados
    total = models.IntegerField(default=0)
    neto = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        """
        Calcular total y neto antes de guardar.
        total: cantidad - descuentos + adicional - devoluciones - vencidas.
        neto: total * valor.
        Además, actualiza el inventario (stock_total) del producto restando el total.
        """
        self.total = self.cantidad - self.descuentos + self.adicional - self.devoluciones - self.vencidas
        self.neto = self.total * self.valor

        # Si es una nueva transacción, actualizamos el stock del producto
        if self.pk is None:
            self.producto.stock_total -= self.total
            self.producto.save()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.producto.nombre} - Usuario {self.id_usuario}"
