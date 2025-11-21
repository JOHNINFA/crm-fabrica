#!/usr/bin/env python3
"""
Script de prueba para verificar predicción del cerebro para una fecha específica.
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.services.ia_service import IAService
from datetime import datetime

print("\n" + "="*60)
print("🧠 PRUEBA DE PREDICCIÓN - SÁBADO 22 NOV 2025")
print("="*60 + "\n")

ia_service = IAService()

# Fecha de prueba: Sábado 22 de Noviembre de 2025
fecha_prueba = "2025-11-22"

# Datos contextuales (simulando lo que hay en la tabla)
datos_contextuales = {
    "AREPA TIPO OBLEA 500Gr": {
        "existencias": 266,
        "solicitadas": 0,
        "pedidos": 0
    },
    "AREPA MEDIANA 330Gr": {
        "existencias": 632,
        "solicitadas": 0,
        "pedidos": 0
    },
    "AREPA TIPO PINCHO 330Gr": {
        "existencias": 847,
        "solicitadas": 0,
        "pedidos": 0
    },
    "AREPA QUESO CORRIENTE 450Gr": {
        "existencias": 1054,
        "solicitadas": 0,
        "pedidos": 0
    },
    "AREPA QUESO ESPECIAL GRANDE 600Gr": {
        "existencias": 563,
        "solicitadas": 0,
        "pedidos": 0
    }
}

print(f"📅 Fecha: {fecha_prueba} (Sábado)")
print(f"📊 Productos a analizar: {len(datos_contextuales)}\n")

predicciones = ia_service.predecir_produccion(
    fecha_objetivo=fecha_prueba,
    datos_contextuales=datos_contextuales
)

if predicciones:
    print(f"\n✅ {len(predicciones)} predicción(es) generada(s):\n")
    for pred in predicciones:
        print(f"🧠 {pred['producto']}:")
        print(f"   - Sugerido: {pred['ia_sugerido']} unidades")
        print(f"   - Confianza: {pred['confianza']}")
        print(f"   - Usa Red Neuronal: {pred['detalle']['usa_red_neuronal']}")
        print(f"   - Existencias: {pred['detalle']['existencias']}")
        print(f"   - Predicción venta: {pred['detalle']['prediccion_venta']}")
        print(f"   - Demanda total: {pred['detalle']['demanda_total']}")
        print(f"   - Faltante: {pred['detalle']['faltante']}")
        print(f"   - Motivo: {pred['detalle']['motivo']}")
        print()
else:
    print("⚠️ No se generaron predicciones")

print("="*60)
print()
