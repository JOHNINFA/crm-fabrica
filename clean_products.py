#!/usr/bin/env python3
"""
Script para eliminar productos sin imagen de localStorage.
"""

import json
import os

# Ruta al archivo localStorage.json (que crearemos)
LOCALSTORAGE_FILE = "localStorage.json"

def clean_products():
    """Elimina productos sin imagen de localStorage."""
    print("Limpiando productos sin imagen...")
    
    # Crear un archivo temporal con el contenido de localStorage
    print("Por favor, copia y pega el siguiente código en la consola del navegador:")
    print("--------------------------------------------------------------------")
    print("const fs = require('fs');")
    print("const localStorage_data = {};")
    print("for (let i = 0; i < localStorage.length; i++) {")
    print("  const key = localStorage.key(i);")
    print("  localStorage_data[key] = localStorage.getItem(key);")
    print("}")
    print(f"fs.writeFileSync('{LOCALSTORAGE_FILE}', JSON.stringify(localStorage_data, null, 2));")
    print("console.log('localStorage exportado correctamente');")
    print("--------------------------------------------------------------------")
    
    input("Presiona Enter cuando hayas exportado localStorage...")
    
    # Verificar si existe el archivo
    if not os.path.exists(LOCALSTORAGE_FILE):
        print(f"Error: No se encontró el archivo {LOCALSTORAGE_FILE}")
        return
    
    # Cargar datos de localStorage
    try:
        with open(LOCALSTORAGE_FILE, 'r') as f:
            local_storage = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: El archivo {LOCALSTORAGE_FILE} no es un JSON válido")
        return
    
    # Obtener productos
    products_data = local_storage.get('products')
    if not products_data:
        print("No se encontraron productos en localStorage")
        return
    
    try:
        products = json.loads(products_data)
    except json.JSONDecodeError:
        print("Error: No se pudieron decodificar los productos")
        return
    
    # Filtrar productos sin imagen
    print(f"Total de productos antes: {len(products)}")
    products_with_image = [
        product for product in products 
        if product.get('image') and isinstance(product['image'], str) and 
        (product['image'].startswith('data:') or product['image'].startswith('/'))
    ]
    print(f"Productos con imagen: {len(products_with_image)}")
    print(f"Productos sin imagen eliminados: {len(products) - len(products_with_image)}")
    
    # Actualizar localStorage
    local_storage['products'] = json.dumps(products_with_image)
    
    # Guardar localStorage actualizado
    with open(LOCALSTORAGE_FILE, 'w') as f:
        json.dump(local_storage, f, indent=2)
    
    print("\nProductos sin imagen eliminados correctamente.")
    print("Ahora, copia y pega el siguiente código en la consola del navegador:")
    print("--------------------------------------------------------------------")
    print(f"fetch('/{LOCALSTORAGE_FILE}')")
    print("  .then(response => response.json())")
    print("  .then(data => {")
    print("    Object.keys(data).forEach(key => {")
    print("      localStorage.setItem(key, data[key]);")
    print("    });")
    print("    console.log('localStorage actualizado correctamente');")
    print("    window.dispatchEvent(new Event('storage'));")
    print("    window.dispatchEvent(new Event('productosUpdated'));")
    print("    location.reload();")
    print("  })")
    print("  .catch(error => console.error('Error al cargar localStorage:', error));")
    print("--------------------------------------------------------------------")

if __name__ == "__main__":
    clean_products()