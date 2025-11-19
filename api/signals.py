# signals.py - Señales para actualizar Planeación automáticamente
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MovimientoInventario, Planeacion, Stock
from datetime import date


@receiver(post_save, sender=MovimientoInventario)
def actualizar_existencias_planeacion(sender, instance, created, **kwargs):
    """
    Actualiza las existencias en Planeación cuando hay un movimiento de inventario.
    Funciona como un Kardex: actualiza todas las fechas futuras desde el movimiento.
    """
    if not created:
        return  # Solo procesar movimientos nuevos
    
    try:
        # Obtener el stock actual del producto
        stock_actual = Stock.objects.filter(producto_nombre=instance.producto_nombre).first()
        if not stock_actual:
            return
        
        cantidad_actual = stock_actual.cantidad_actual
        
        # Actualizar TODAS las planeaciones futuras desde hoy
        fecha_hoy = date.today()
        
        planeaciones = Planeacion.objects.filter(
            producto_nombre=instance.producto_nombre,
            fecha__gte=fecha_hoy
        ).order_by('fecha')
        
        for planeacion in planeaciones:
            # Actualizar existencias con el stock actual
            planeacion.existencias = cantidad_actual
            planeacion.save()
            print(f"✅ Planeación actualizada: {planeacion.producto_nombre} - {planeacion.fecha} - Existencias: {cantidad_actual}")
        
    except Exception as e:
        print(f"❌ Error actualizando planeación: {e}")


@receiver(post_save, sender=Stock)
def actualizar_existencias_desde_stock(sender, instance, **kwargs):
    """
    Actualiza las existencias en Planeación cuando cambia el stock directamente.
    """
    try:
        # Actualizar TODAS las planeaciones futuras desde hoy
        fecha_hoy = date.today()
        
        planeaciones = Planeacion.objects.filter(
            producto_nombre=instance.producto_nombre,
            fecha__gte=fecha_hoy
        )
        
        cantidad_actual = instance.cantidad_actual
        
        for planeacion in planeaciones:
            planeacion.existencias = cantidad_actual
            planeacion.save()
            print(f"✅ Planeación actualizada desde Stock: {planeacion.producto_nombre} - {planeacion.fecha} - Existencias: {cantidad_actual}")
        
    except Exception as e:
        print(f"❌ Error actualizando planeación desde stock: {e}")
