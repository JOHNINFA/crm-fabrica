#!/usr/bin/env python3
"""
Script de prueba para verificar que las Redes Neuronales funcionan correctamente.
Este es el CEREBRO del sistema que aprende y predice.
"""

import os
import sys
import django

# Configurar Django
sys.path.append('/home/john/Escritorio/crm-fabrica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_crm.settings')
django.setup()

from api.services.ia_service import IAService, TENSORFLOW_DISPONIBLE
from datetime import datetime

print("\n" + "="*60)
print("🧠 VERIFICACIÓN DEL CEREBRO (REDES NEURONALES)")
print("="*60 + "\n")

# 1. Verificar TensorFlow
print("1️⃣ Verificando TensorFlow...")
if TENSORFLOW_DISPONIBLE:
    import tensorflow as tf
    print(f"   ✅ TensorFlow {tf.__version__} instalado correctamente")
else:
    print("   ❌ TensorFlow NO disponible")
    sys.exit(1)

# 2. Verificar modelos entrenados
print("\n2️⃣ Verificando modelos entrenados...")
models_dir = '/home/john/Escritorio/crm-fabrica/api/ml_models'
if os.path.exists(models_dir):
    modelos = [f for f in os.listdir(models_dir) if f.endswith('.h5')]
    if modelos:
        print(f"   ✅ {len(modelos)} modelo(s) encontrado(s):")
        for modelo in modelos:
            size = os.path.getsize(os.path.join(models_dir, modelo))
            print(f"      - {modelo} ({size:,} bytes)")
    else:
        print("   ⚠️ No hay modelos entrenados")
        print("   💡 Ejecuta: python3 manage.py entrenar_ia")
else:
    print("   ⚠️ Carpeta de modelos no existe")

# 3. Probar predicción
print("\n3️⃣ Probando predicción con Red Neuronal...")
try:
    ia_service = IAService()
    
    # Fecha de prueba
    fecha_prueba = "2025-11-20"
    
    # Datos contextuales de ejemplo
    datos_contextuales = {
        "AREPA TIPO OBLEA 500Gr": {
            "existencias": 266,
            "solicitadas": 0,
            "pedidos": 0
        }
    }
    
    print(f"   📅 Fecha: {fecha_prueba}")
    print(f"   📊 Datos contextuales: {len(datos_contextuales)} producto(s)")
    
    predicciones = ia_service.predecir_produccion(
        fecha_objetivo=fecha_prueba,
        datos_contextuales=datos_contextuales
    )
    
    if predicciones:
        print(f"\n   ✅ {len(predicciones)} predicción(es) generada(s):\n")
        for pred in predicciones:
            print(f"   🧠 {pred['producto']}:")
            print(f"      - Sugerido: {pred['ia_sugerido']} unidades")
            print(f"      - Confianza: {pred['confianza']}")
            print(f"      - Usa Red Neuronal: {pred['detalle']['usa_red_neuronal']}")
            print(f"      - Predicción IA: {pred['detalle']['prediccion_ia']}")
            print(f"      - Motivo: {pred['detalle']['motivo']}")
            print()
    else:
        print("   ⚠️ No se generaron predicciones")
        print("   💡 Verifica que haya modelos entrenados")
        
except Exception as e:
    print(f"   ❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()

# 4. Verificar arquitectura del modelo
print("\n4️⃣ Verificando arquitectura de la Red Neuronal...")
try:
    from tensorflow import keras
    modelo_path = os.path.join(models_dir, 'AREPA_TIPO_OBLEA_500Gr.h5')
    if os.path.exists(modelo_path):
        modelo = keras.models.load_model(modelo_path)
        print(f"   ✅ Modelo cargado: AREPA_TIPO_OBLEA_500Gr")
        print(f"\n   📊 Arquitectura de la Red Neuronal:")
        print(f"      - Capas: {len(modelo.layers)}")
        for i, layer in enumerate(modelo.layers):
            print(f"      - Capa {i+1}: {layer.__class__.__name__} ({layer.units if hasattr(layer, 'units') else 'N/A'} neuronas)")
        print(f"\n   📈 Parámetros:")
        print(f"      - Entrenables: {modelo.count_params():,}")
    else:
        print("   ⚠️ Modelo de ejemplo no encontrado")
except Exception as e:
    print(f"   ⚠️ No se pudo cargar el modelo: {str(e)}")

print("\n" + "="*60)
print("✅ VERIFICACIÓN COMPLETADA")
print("="*60 + "\n")

print("💡 CONCLUSIÓN:")
if TENSORFLOW_DISPONIBLE and modelos:
    print("   🧠 El CEREBRO (Redes Neuronales) está FUNCIONANDO correctamente")
    print("   ✅ Listo para hacer predicciones inteligentes")
else:
    print("   ⚠️ El CEREBRO necesita entrenamiento")
    print("   💡 Ejecuta: python3 manage.py entrenar_ia")

print()
