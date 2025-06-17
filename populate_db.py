#!/usr/bin/env python3
import os
import django
import json

# Configurar entorno Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.models import Categoria, Producto, Lote, MovimientoInventario
from django.utils import timezone

def populate_db():
    print("Poblando la base de datos...")
    
    # Crear categorías
    categorias = {
        "Arepas": Categoria.objects.create(nombre="Arepas"),
        "Servicios": Categoria.objects.create(nombre="Servicios"),
        "General": Categoria.objects.create(nombre="General")
    }
    print(f"Categorías creadas: {len(categorias)}")
    
    # Crear productos
    productos = [
        {
            "nombre": "AREPA TIPO OBLEA",
            "descripcion": "Arepa tipo oblea tradicional",
            "precio": 2500,
            "precio_compra": 1800,
            "stock_total": 100,
            "categoria": categorias["Arepas"],
            "marca": "GENERICA",
            "impuesto": "IVA(0%)"
        },
        {
            "nombre": "AREPA MEDIANA",
            "descripcion": "Arepa mediana tradicional",
            "precio": 3000,
            "precio_compra": 2200,
            "stock_total": 80,
            "categoria": categorias["Arepas"],
            "marca": "GENERICA",
            "impuesto": "IVA(0%)"
        },
        {
            "nombre": "AREPA TIPO PINCHO",
            "descripcion": "Arepa para pincho",
            "precio": 3500,
            "precio_compra": 2500,
            "stock_total": 60,
            "categoria": categorias["Arepas"],
            "marca": "GENERICA",
            "impuesto": "IVA(0%)"
        },
        {
            "nombre": "SERVICIO",
            "descripcion": "Servicio general",
            "precio": 5000,
            "precio_compra": 0,
            "stock_total": 0,
            "categoria": categorias["Servicios"],
            "marca": "GENERICA",
            "impuesto": "IVA(0%)"
        }
    ]
    
    productos_creados = []
    for producto_data in productos:
        producto = Producto.objects.create(**producto_data)
        productos_creados.append(producto)
    
    print(f"Productos creados: {len(productos_creados)}")
    
    # Crear lotes
    lotes = [
        {
            "producto": productos_creados[0],
            "codigo": "L001",
            "fecha_vencimiento": timezone.now() + timezone.timedelta(days=30),
            "cantidad": 50
        },
        {
            "producto": productos_creados[1],
            "codigo": "L002",
            "fecha_vencimiento": timezone.now() + timezone.timedelta(days=45),
            "cantidad": 40
        },
        {
            "producto": productos_creados[2],
            "codigo": "L003",
            "fecha_vencimiento": timezone.now() + timezone.timedelta(days=60),
            "cantidad": 30
        }
    ]
    
    lotes_creados = []
    for lote_data in lotes:
        lote = Lote.objects.create(**lote_data)
        lotes_creados.append(lote)
    
    print(f"Lotes creados: {len(lotes_creados)}")
    
    # Crear movimientos
    movimientos = [
        {
            "producto": productos_creados[0],
            "lote": lotes_creados[0],
            "tipo": "ENTRADA",
            "cantidad": 50,
            "usuario": "Admin",
            "nota": "Carga inicial"
        },
        {
            "producto": productos_creados[1],
            "lote": lotes_creados[1],
            "tipo": "ENTRADA",
            "cantidad": 40,
            "usuario": "Admin",
            "nota": "Carga inicial"
        },
        {
            "producto": productos_creados[2],
            "lote": lotes_creados[2],
            "tipo": "ENTRADA",
            "cantidad": 30,
            "usuario": "Admin",
            "nota": "Carga inicial"
        },
        {
            "producto": productos_creados[0],
            "tipo": "SALIDA",
            "cantidad": 5,
            "usuario": "Admin",
            "nota": "Venta"
        }
    ]
    
    movimientos_creados = []
    for movimiento_data in movimientos:
        movimiento = MovimientoInventario.objects.create(**movimiento_data)
        movimientos_creados.append(movimiento)
    
    print(f"Movimientos creados: {len(movimientos_creados)}")
    
    print("Base de datos poblada exitosamente.")

if __name__ == "__main__":
    populate_db()