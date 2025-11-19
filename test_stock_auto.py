#!/usr/bin/env python
"""Script para probar creación automática de Stock"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Producto, Stock, Categoria

print("🧪 PROBANDO CREACIÓN AUTOMÁTICA DE STOCK\n")

# 1. Crear un producto de prueba
print("1️⃣ Creando producto de prueba...")
categoria, _ = Categoria.objects.get_or_create(nombre='PRUEBA')

producto_test = Producto.objects.create(
    nombre='PRODUCTO TEST AUTO STOCK',
    descripcion='Producto para probar creación automática de stock',
    precio=5000,
    stock_total=100,
    categoria=categoria,
    ubicacion_inventario='PRODUCCION'
)

print(f"   ✅ Producto creado: {producto_test.nombre}")
print(f"   📦 Stock inicial: {producto_test.stock_total}")

# 2. Verificar que se creó el registro en Stock
print("\n2️⃣ Verificando registro en api_stock...")
try:
    stock_obj = Stock.objects.get(producto=producto_test)
    print(f"   ✅ Stock encontrado en api_stock")
    print(f"   📊 Cantidad actual: {stock_obj.cantidad_actual}")
    print(f"   🕐 Fecha actualización: {stock_obj.fecha_actualizacion}")
except Stock.DoesNotExist:
    print(f"   ❌ ERROR: No se creó registro en api_stock")

# 3. Actualizar stock del producto
print("\n3️⃣ Actualizando stock del producto...")
producto_test.stock_total = 150
producto_test.save()

print(f"   ✅ Stock actualizado a: {producto_test.stock_total}")

# 4. Verificar que se actualizó en api_stock
print("\n4️⃣ Verificando actualización en api_stock...")
stock_obj.refresh_from_db()
print(f"   📊 Cantidad actual en api_stock: {stock_obj.cantidad_actual}")

if stock_obj.cantidad_actual == 150:
    print(f"   ✅ Stock sincronizado correctamente")
else:
    print(f"   ❌ ERROR: Stock no sincronizado")

# 5. Limpiar (eliminar producto de prueba)
print("\n5️⃣ Limpiando producto de prueba...")
producto_test.delete()
print(f"   ✅ Producto eliminado")

# Verificar que también se eliminó el stock (CASCADE)
try:
    Stock.objects.get(producto_id=producto_test.id)
    print(f"   ❌ ERROR: Stock no se eliminó")
except Stock.DoesNotExist:
    print(f"   ✅ Stock eliminado automáticamente (CASCADE)")

print("\n✅ PRUEBA CO