#!/usr/bin/env python3
"""
RAG Retriever - Busca información relevante en la base de datos indexada
Usa búsqueda semántica simple sin dependencias externas
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Any
from difflib import SequenceMatcher


class RAGRetriever:
    """Recuperador de información para RAG"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.db_path = self.project_root / ".kiro" / "rag" / "database.json"
        self.documents = []
        self.load_database()
    
    def load_database(self):
        """Cargar base de datos"""
        if self.db_path.exists():
            with open(self.db_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.documents = data.get('documents', [])
    
    def similarity_score(self, query: str, text: str) -> float:
        """Calcular similitud entre query y texto"""
        query_lower = query.lower()
        text_lower = text.lower()
        
        # Búsqueda exacta
        if query_lower in text_lower:
            return 1.0
        
        # Búsqueda de palabras clave
        query_words = set(query_lower.split())
        text_words = set(text_lower.split())
        
        if not query_words:
            return 0.0
        
        matches = len(query_words & text_words)
        return matches / len(query_words)
    
    def search(self, query: str, limit: int = 5, file_type: str = None) -> List[Dict]:
        """Buscar documentos relevantes"""
        results = []
        
        for doc in self.documents:
            # Filtrar por tipo si se especifica
            if file_type and doc['type'] != file_type:
                continue
            
            # Buscar en path
            path_score = self.similarity_score(query, doc['path'])
            
            # Buscar en contenido preview
            content_score = self.similarity_score(query, doc['content_preview'])
            
            # Buscar en secciones
            section_scores = []
            for section in doc.get('sections', []):
                section_score = self.similarity_score(query, section['name'])
                if section_score > 0:
                    section_scores.append((section_score, section))
            
            # Calcular score total
            max_section_score = max([s[0] for s in section_scores], default=0)
            total_score = (path_score * 0.2 + content_score * 0.3 + max_section_score * 0.5)
            
            if total_score > 0:
                results.append({
                    'score': total_score,
                    'document': doc,
                    'top_section': section_scores[0][1] if section_scores else None,
                    'all_sections': [s[1] for s in sorted(section_scores, reverse=True)[:3]]
                })
        
        # Ordenar por score
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def search_by_type(self, query: str, file_type: str, limit: int = 5) -> List[Dict]:
        """Buscar en un tipo de archivo específico"""
        return self.search(query, limit=limit, file_type=file_type)
    
    def get_context(self, query: str, context_size: int = 3) -> str:
        """Obtener contexto formateado para inyectar en prompt"""
        results = self.search(query, limit=context_size)
        
        if not results:
            return "No se encontró contexto relevante."
        
        context = "📚 CONTEXTO DEL PROYECTO:\n\n"
        
        for i, result in enumerate(results, 1):
            doc = result['document']
            context += f"[{i}] {doc['path']} ({doc['type']})\n"
            context += f"    Líneas: {doc['lines']} | Tamaño: {doc['size']} bytes\n"
            
            if result['top_section']:
                section = result['top_section']
                context += f"    Sección: {section['type']} - {section['name']}\n"
                context += f"    Contenido: {section['content'][:300]}...\n"
            else:
                context += f"    Preview: {doc['content_preview'][:300]}...\n"
            
            context += "\n"
        
        return context
    
    def get_architecture_context(self) -> str:
        """Obtener contexto de arquitectura del proyecto"""
        context = "🏗️ ARQUITECTURA DEL PROYECTO:\n\n"
        
        # Agrupar por tipo
        by_type = {}
        for doc in self.documents:
            file_type = doc['type']
            if file_type not in by_type:
                by_type[file_type] = []
            by_type[file_type].append(doc)
        
        # Backend
        if 'py' in by_type:
            context += "🔧 BACKEND (Python/Django):\n"
            py_files = [d for d in by_type['py'] if 'backend_crm' in d['path'] or 'api' in d['path']]
            for doc in py_files[:5]:
                context += f"  - {doc['path']} ({doc['lines']} líneas)\n"
            context += "\n"
        
        # Frontend
        if 'jsx' in by_type or 'tsx' in by_type:
            context += "🎨 FRONTEND (React):\n"
            react_files = [d for d in by_type.get('jsx', []) + by_type.get('tsx', []) if 'frontend' in d['path']]
            for doc in react_files[:5]:
                context += f"  - {doc['path']} ({doc['lines']} líneas)\n"
            context += "\n"
        
        # Mobile
        if 'js' in by_type:
            context += "📱 APP MÓVIL (React Native):\n"
            mobile_files = [d for d in by_type['js'] if 'AP GUERRERO' in d['path']]
            for doc in mobile_files[:5]:
                context += f"  - {doc['path']} ({doc['lines']} líneas)\n"
            context += "\n"
        
        # Configuración
        if 'yml' in by_type or 'yaml' in by_type:
            context += "⚙️ CONFIGURACIÓN:\n"
            config_files = by_type.get('yml', []) + by_type.get('yaml', [])
            for doc in config_files[:3]:
                context += f"  - {doc['path']}\n"
            context += "\n"
        
        return context
    
    def get_database_schema(self) -> str:
        """Obtener esquema de base de datos"""
        context = "🗄️ ESQUEMA DE BASE DE DATOS:\n\n"
        
        # Buscar modelos Django
        models_docs = [d for d in self.documents if 'models.py' in d['path']]
        
        for doc in models_docs:
            context += f"Archivo: {doc['path']}\n"
            for section in doc.get('sections', []):
                if section['type'] == 'class':
                    context += f"  📦 Modelo: {section['name']}\n"
            context += "\n"
        
        return context
    
    def get_api_endpoints(self) -> str:
        """Obtener endpoints de API"""
        context = "🔌 ENDPOINTS DE API:\n\n"
        
        # Buscar en views.py y urls.py
        api_docs = [d for d in self.documents if 'views.py' in d['path'] or 'urls.py' in d['path']]
        
        for doc in api_docs:
            context += f"Archivo: {doc['path']}\n"
            for section in doc.get('sections', []):
                if section['type'] == 'class' or section['type'] == 'function':
                    context += f"  🔗 {section['name']}\n"
            context += "\n"
        
        return context
    
    def get_component_structure(self) -> str:
        """Obtener estructura de componentes"""
        context = "🧩 ESTRUCTURA DE COMPONENTES:\n\n"
        
        # Frontend
        context += "🎨 FRONTEND (React):\n"
        frontend_docs = [d for d in self.documents if 'frontend/src' in d['path'] and d['type'] in ['jsx', 'tsx']]
        for doc in frontend_docs[:10]:
            context += f"  - {doc['path']}\n"
        
        context += "\n📱 APP MÓVIL (React Native):\n"
        mobile_docs = [d for d in self.documents if 'AP GUERRERO' in d['path'] and d['type'] == 'js']
        for doc in mobile_docs[:10]:
            context += f"  - {doc['path']}\n"
        
        return context


def generate_rag_context(query: str = None) -> str:
    """Generar contexto RAG completo"""
    retriever = RAGRetriever()
    
    context = "=" * 80 + "\n"
    context += "🤖 CONTEXTO RAG - CRM FÁBRICA\n"
    context += "=" * 80 + "\n\n"
    
    # Arquitectura general
    context += retriever.get_architecture_context()
    context += "\n"
    
    # Esquema de BD
    context += retriever.get_database_schema()
    context += "\n"
    
    # Endpoints
    context += retriever.get_api_endpoints()
    context += "\n"
    
    # Componentes
    context += retriever.get_component_structure()
    context += "\n"
    
    # Si hay query, agregar búsqueda específica
    if query:
        context += "=" * 80 + "\n"
        context += f"🔍 BÚSQUEDA: {query}\n"
        context += "=" * 80 + "\n\n"
        context += retriever.get_context(query)
    
    return context


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(generate_rag_context(query))
    else:
        print(generate_rag_context())
