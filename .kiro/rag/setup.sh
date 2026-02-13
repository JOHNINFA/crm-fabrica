#!/bin/bash
# Setup RAG - Inicializar sistema RAG

echo "🚀 Configurando RAG para CRM Fábrica..."

# Crear directorios
mkdir -p .kiro/rag
mkdir -p .kiro/steering
mkdir -p .kiro/docs

# Ejecutar indexador
echo "📚 Indexando proyecto..."
python3 .kiro/rag/indexer.py

echo "✅ RAG configurado correctamente"
echo ""
echo "Próximos pasos:"
echo "1. Ejecutar indexador: python3 .kiro/rag/indexer.py"
echo "2. Buscar información: python3 .kiro/rag/retriever.py 'tu búsqueda'"
echo "3. Ver contexto completo: python3 .kiro/rag/retriever.py"
