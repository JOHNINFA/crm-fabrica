#!/usr/bin/env python3
"""
Script para exportar imágenes base64 desde localStorage a archivos.

Este script lee el archivo localStorage.json (que debe ser exportado desde el navegador)
y guarda las imágenes base64 como archivos PNG en la carpeta de imágenes.
"""

import json
import os
import base64
import re
from pathlib import Path

# Configuración
LOCALSTORAGE_FILE = "localStorage.json"  # Archivo exportado desde el navegador
IMAGES_DIR = "frontend/public/images/productos"  # Carpeta donde se guardarán las imágenes

def ensure_dir(directory):
    """Asegura que el directorio exista."""
    Path(directory).mkdir(parents=True, exist_ok=True)

def extract_base64_data(data_url):
    """Extrae los datos base64 de una URL de datos."""
    if not data_url or not data_url.startswith('data:'):
        return None, None
    
    # Extraer el tipo MIME y los datos base64
    match = re.match(r'data:([^;]+);base64,(.+)', data_url)
    if not match:
        return None, None
    
    mime_type, base64_data = match.groups()
    extension = mime_type.split('/')[-1]
    
    return base64_data, extension

def save_image(product_id, product_name, image_data, output_dir):
    """Guarda una imagen base64 como archivo."""
    base64_data, extension = extract_base64_data(image_data)
    if not base64_data:
        print(f"  Error: Formato de imagen no válido para {product_name}")
        return False
    
    # Crear nombre de archivo
    filename = f"producto_{product_id}.{extension}"
    filepath = os.path.join(output_dir, filename)
    
    try:
        # Decodificar y guardar la imagen
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(base64_data))
        print(f"  ✓ Imagen guardada: {filename}")
        return True
    except Exception as e:
        print(f"  ✗ Error al guardar imagen {filename}: {e}")
        return False

def main():
    """Función principal."""
    print("Exportando imágenes de productos...")
    
    # Asegurar que la carpeta de imágenes exista
    ensure_dir(IMAGES_DIR)
    
    # Verificar si existe el archivo localStorage.json
    if not os.path.exists(LOCALSTORAGE_FILE):
        print(f"Error: No se encontró el archivo {LOCALSTORAGE_FILE}")
        print("Por favor, exporta localStorage desde el navegador:")
        print("1. Abre las herramientas de desarrollo (F12)")
        print("2. Ve a la pestaña 'Application' o 'Storage'")
        print("3. Expande 'Local Storage' y selecciona tu dominio")
        print("4. Haz clic derecho y selecciona 'Export All'")
        print("5. Guarda el archivo como 'localStorage.json' en la raíz del proyecto")
        return
    
    # Cargar datos de localStorage
    try:
        with open(LOCALSTORAGE_FILE, 'r') as f:
            local_storage = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: El archivo {LOCALSTORAGE_FILE} no es un JSON válido")
        return
    
    # Buscar productos con imágenes
    products_data = local_storage.get('products')
    if not products_data:
        print("No se encontraron productos en localStorage")
        return
    
    try:
        products = json.loads(products_data)
    except json.JSONDecodeError:
        print("Error: No se pudieron decodificar los productos")
        return
    
    # Exportar imágenes
    count = 0
    for product in products:
        if product.get('image') and isinstance(product['image'], str) and product['image'].startswith('data:'):
            print(f"Procesando: {product.get('name', 'Producto sin nombre')}")
            if save_image(product['id'], product.get('name', ''), product['image'], IMAGES_DIR):
                count += 1
    
    print(f"\nExportación completada: {count} imágenes guardadas en {IMAGES_DIR}")

if __name__ == "__main__":
    main()