#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🤖 Script para Verificar Documentación Automáticamente
Uso: python scripts/verificar-documentacion.py
"""

import os
import sys
from pathlib import Path

def verificar_archivos():
    """Verificar que existan todos los archivos de documentación"""
    print("\n" + "="*50)
    print("✅ 1. VERIFICANDO ARCHIVOS DE DOCUMENTACIÓN")
    print("="*50 + "\n")
    
    archivos = [
        "DOCUMENTACION/README_GENERAL.md",
        "DOCUMENTACION/README_POS.md",
        "DOCUMENTACION/README_CARGUE.md",
        "DOCUMENTACION/README_INVENTARIO.md",
        "DOCUMENTACION/README_PEDIDOS.md",
        "DOCUMENTACION/README_OTROS.md",
        "DOCUMENTACION/INDICE.md",
        "DOCUMENTACION/INICIO_RAPIDO.md",
        "README.md"
    ]
    
    encontrados = 0
    no_encontrados = 0
    
    for archivo in archivos:
        if os.path.exists(archivo):
            tamaño = os.path.getsize(archivo)
            tamaño_kb = tamaño / 1024
            print(f"✅ {archivo} ({tamaño_kb:.1f} KB)")
            encontrados += 1
        else:
            print(f"❌ {archivo} (NO ENCONTRADO)")
            no_encontrados += 1
    
    print(f"\n📊 Resultado: {encontrados} encontrados, {no_encontrados} no encontrados")
    return encontrados == len(archivos)

def contar_estadisticas():
    """Contar líneas y palabras"""
    print("\n" + "="*50)
    print("📊 2. ESTADÍSTICAS DE DOCUMENTACIÓN")
    print("="*50 + "\n")
    
    archivos = Path("DOCUMENTACION").glob("*.md")
    archivos = list(archivos) + [Path("README.md")]
    
    total_lineas = 0
    total_palabras = 0
    total_caracteres = 0
    
    for archivo in sorted(archivos):
        if archivo.exists():
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
                lineas = len(contenido.split('\n'))
                palabras = len(contenido.split())
                caracteres = len(contenido)
                
                total_lineas += lineas
                total_palabras += palabras
                total_caracteres += caracteres
                
                print(f"📄 {archivo.name}")
                print(f"   - Líneas: {lineas}")
                print(f"   - Palabras: {palabras}")
                print(f"   - Caracteres: {caracteres}")
                print()
    
    print("📊 TOTALES:")
    print(f"   - Líneas totales: {total_lineas}")
    print(f"   - Palabras totales: {total_palabras}")
    print(f"   - Caracteres totales: {total_caracteres}")

def verificar_contenido():
    """Verificar que los archivos tengan contenido"""
    print("\n" + "="*50)
    print("🔍 3. VERIFICANDO CONTENIDO")
    print("="*50 + "\n")
    
    archivos = {
        "DOCUMENTACION/README_GENERAL.md": ["Módulos Principales", "Arquitectura"],
        "DOCUMENTACION/README_POS.md": ["POS", "Caja", "Venta"],
        "DOCUMENTACION/README_CARGUE.md": ["CARGUE", "Despacho"],
        "DOCUMENTACION/README_INVENTARIO.md": ["INVENTARIO", "Kardex", "Stock"],
        "DOCUMENTACION/README_PEDIDOS.md": ["PEDIDOS", "Clientes"],
        "DOCUMENTACION/README_OTROS.md": ["OTROS", "Sucursales", "Usuarios"],
        "DOCUMENTACION/INDICE.md": ["Índice", "Módulos"],
        "DOCUMENTACION/INICIO_RAPIDO.md": ["Inicio Rápido"],
        "README.md": ["Sistema Integrado"]
    }
    
    for archivo, palabras_clave in archivos.items():
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
                encontradas = sum(1 for palabra in palabras_clave if palabra in contenido)
                print(f"✅ {archivo}")
                print(f"   - Palabras clave encontradas: {encontradas}/{len(palabras_clave)}")
        else:
            print(f"❌ {archivo} (NO EXISTE)")

def main():
    """Función principal"""
    print("\n" + "🤖 "*20)
    print("VERIFICACIÓN AUTOMÁTICA DE DOCUMENTACIÓN")
    print("🤖 "*20)
    
    # Verificar archivos
    archivos_ok = verificar_archivos()
    
    # Contar estadísticas
    contar_estadisticas()
    
    # Verificar contenido
    verificar_contenido()
    
    # Resumen final
    print("\n" + "="*50)
    print("✅ VERIFICACIÓN COMPLETADA")
    print("="*50 + "\n")
    
    if archivos_ok:
        print("✅ Todos los archivos están presentes y correctos")
        return 0
    else:
        print("❌ Faltan algunos archivos")
        return 1

if __name__ == "__main__":
    sys.exit(main())
