#!/bin/bash

# 🤖 Script para Verificar Documentación Automáticamente
# Uso: bash scripts/verificar-documentacion.sh

echo "================================"
echo "📚 VERIFICACIÓN DE DOCUMENTACIÓN"
echo "================================"
echo ""

# 1. Verificar que existan todos los archivos
echo "✅ 1. Verificando archivos de documentación..."
echo ""

archivos=(
    "DOCUMENTACION/README_GENERAL.md"
    "DOCUMENTACION/README_POS.md"
    "DOCUMENTACION/README_CARGUE.md"
    "DOCUMENTACION/README_INVENTARIO.md"
    "DOCUMENTACION/README_PEDIDOS.md"
    "DOCUMENTACION/README_OTROS.md"
    "DOCUMENTACION/INDICE.md"
    "DOCUMENTACION/INICIO_RAPIDO.md"
    "README.md"
)

for archivo in "${archivos[@]}"; do
    if [ -f "$archivo" ]; then
        tamaño=$(du -h "$archivo" | cut -f1)
        echo "✅ $archivo ($tamaño)"
    else
        echo "❌ $archivo (NO ENCONTRADO)"
    fi
done

echo ""
echo "================================"
echo "📊 ESTADÍSTICAS"
echo "================================"
echo ""

# 2. Contar líneas totales
echo "📝 Líneas totales de documentación:"
wc -l DOCUMENTACION/*.md README.md | tail -1

echo ""

# 3. Contar palabras
echo "📄 Palabras totales:"
wc -w DOCUMENTACION/*.md README.md | tail -1

echo ""

# 4. Listar archivos con tamaño
echo "📦 Tamaño de archivos:"
ls -lh DOCUMENTACION/*.md README.md | awk '{print $9, "(" $5 ")"}'

echo ""
echo "================================"
echo "✅ VERIFICACIÓN COMPLETADA"
echo "================================"
