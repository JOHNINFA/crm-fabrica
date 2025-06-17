#!/bin/bash
# Script para exportar imágenes desde IndexedDB a archivos

# Crear carpeta de imágenes si no existe
mkdir -p frontend/public/images/productos

echo "Para exportar las imágenes de los productos a una carpeta física:"
echo ""
echo "1. Abre la aplicación en el navegador"
echo "2. Haz clic en el botón 'Imágenes' en la esquina inferior derecha"
echo "3. Haz clic en 'Exportar todas'"
echo "4. Guarda las imágenes en la carpeta: frontend/public/images/productos/"
echo ""
echo "Alternativamente, puedes exportar localStorage desde el navegador:"
echo "1. Abre las herramientas de desarrollo (F12)"
echo "2. Ve a la pestaña 'Application' o 'Storage'"
echo "3. Expande 'Local Storage' y selecciona tu dominio"
echo "4. Haz clic derecho y selecciona 'Export All'"
echo "5. Guarda el archivo como 'localStorage.json' en la raíz del proyecto"
echo "6. Ejecuta: python3 export_images.py"
echo ""
echo "Las imágenes estarán disponibles en: frontend/public/images/productos/"