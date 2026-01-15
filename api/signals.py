# signals.py - Señales para actualizar Planeación automáticamente
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import MovimientoInventario, Planeacion, Stock, Producto, CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6
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
        producto_nombre = instance.producto.nombre  # MovimientoInventario usa FK producto
        stock_actual = Stock.objects.filter(producto_nombre=producto_nombre).first()
        if not stock_actual:
            return
        
        cantidad_actual = stock_actual.cantidad_actual
        
        # Actualizar TODAS las planeaciones futuras desde hoy
        fecha_hoy = date.today()
        
        planeaciones = Planeacion.objects.filter(
            producto_nombre=producto_nombre,
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


@receiver(pre_save, sender=Producto)
def actualizar_nombre_en_cargue(sender, instance, **kwargs):
    """
    Cuando se cambia el nombre de un producto, actualiza automáticamente
    ese nombre en TODAS las tablas que usan producto_nombre.
    """
    # Solo procesar si el producto ya existe (no es nuevo)
    if not instance.pk:
        return
    
    try:
        # Obtener el nombre anterior del producto
        producto_anterior = Producto.objects.get(pk=instance.pk)
        nombre_anterior = producto_anterior.nombre
        nombre_nuevo = instance.nombre
        
        # Si el nombre no cambió, no hacer nada
        if nombre_anterior == nombre_nuevo:
            return
        
        print(f"🔄 Actualizando nombre de producto en TODO el sistema:")
        print(f"   Anterior: {nombre_anterior}")
        print(f"   Nuevo: {nombre_nuevo}")
        
        total_general = 0
        
        # ========== 1. CARGUE (ID1-ID6) ==========
        modelos_cargue = [CargueID1, CargueID2, CargueID3, CargueID4, CargueID5, CargueID6]
        for Modelo in modelos_cargue:
            count = Modelo.objects.filter(producto=nombre_anterior).update(producto=nombre_nuevo)
            if count > 0:
                print(f"   ✅ {Modelo.__name__}: {count} registros")
                total_general += count
        
        # ========== 2. STOCK ==========
        count = Stock.objects.filter(producto_nombre=nombre_anterior).update(producto_nombre=nombre_nuevo)
        if count > 0:
            print(f"   ✅ Stock: {count} registros")
            total_general += count
        
        # ========== 3. PLANEACIÓN ==========
        count = Planeacion.objects.filter(producto_nombre=nombre_anterior).update(producto_nombre=nombre_nuevo)
        if count > 0:
            print(f"   ✅ Planeacion: {count} registros")
            total_general += count
        
        # ========== 4. REGISTRO INVENTARIO ==========
        from .models import RegistroInventario
        count = RegistroInventario.objects.filter(producto_nombre=nombre_anterior).update(producto_nombre=nombre_nuevo)
        if count > 0:
            print(f"   ✅ RegistroInventario: {count} registros")
            total_general += count
        
        # ========== 5. REGISTROS PLANEACION DIA ==========
        try:
            from .models import RegistrosPlaneacionDia
            count = RegistrosPlaneacionDia.objects.filter(producto_nombre=nombre_anterior).update(producto_nombre=nombre_nuevo)
            if count > 0:
                print(f"   ✅ RegistrosPlaneacionDia: {count} registros")
                total_general += count
        except:
            pass  # Modelo puede no existir
        
        # ========== 6. PRODUCCION SOLICITADA ==========
        try:
            from .models import ProduccionSolicitada
            count = ProduccionSolicitada.objects.filter(producto_nombre=nombre_anterior).update(producto_nombre=nombre_nuevo)
            if count > 0:
                print(f"   ✅ ProduccionSolicitada: {count} registros")
                total_general += count
        except:
            pass  # Modelo puede no existir
        
        # ========== RESUMEN ==========
        if total_general > 0:
            print(f"   📊 TOTAL: {total_general} registros actualizados en todo el sistema")
        else:
            print(f"   ℹ️ No se encontraron registros con el nombre anterior")
            
    except Producto.DoesNotExist:
        # El producto es nuevo, no hacer nada
        pass
    except Exception as e:
        print(f"❌ Error actualizando nombre: {e}")
