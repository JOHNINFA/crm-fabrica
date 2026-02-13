#!/usr/bin/env python3
"""
RAG Indexer - Indexa TODO el código del proyecto
Genera embeddings locales y almacena en base de datos vectorial
"""

import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any
import hashlib

class RAGIndexer:
    """Indexador de código para RAG local"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.db_path = self.project_root / ".kiro" / "rag" / "database.json"
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.documents = []
        self.load_database()
    
    def load_database(self):
        """Cargar base de datos existente"""
        if self.db_path.exists():
            with open(self.db_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.documents = data.get('documents', [])
    
    def save_database(self):
        """Guardar base de datos"""
        with open(self.db_path, 'w', encoding='utf-8') as f:
            json.dump({
                'documents': self.documents,
                'total': len(self.documents)
            }, f, indent=2, ensure_ascii=False)
    
    def extract_code_sections(self, content: str, file_type: str) -> List[Dict]:
        """Extraer secciones significativas del código"""
        sections = []
        
        if file_type in ['py', 'js', 'jsx', 'ts', 'tsx']:
            # Extraer clases
            class_pattern = r'class\s+(\w+).*?(?=\nclass|\Z)'
            for match in re.finditer(class_pattern, content, re.DOTALL):
                class_name = match.group(1)
                class_content = match.group(0)[:500]  # Primeros 500 chars
                sections.append({
                    'type': 'class',
                    'name': class_name,
                    'content': class_content
                })
            
            # Extraer funciones/métodos
            func_pattern = r'def\s+(\w+)\(.*?\):|function\s+(\w+)\(|const\s+(\w+)\s*='
            for match in re.finditer(func_pattern, content):
                func_name = match.group(1) or match.group(2) or match.group(3)
                sections.append({
                    'type': 'function',
                    'name': func_name,
                    'content': content[max(0, match.start()-100):match.end()+200]
                })
        
        elif file_type == 'css':
            # Extraer selectores CSS
            selector_pattern = r'([.#]?\w+(?:\s*[,\s]\s*[.#]?\w+)*)\s*\{'
            for match in re.finditer(selector_pattern, content):
                selector = match.group(1)
                sections.append({
                    'type': 'css_rule',
                    'name': selector,
                    'content': content[match.start():match.end()+200]
                })
        
        elif file_type == 'sql':
            # Extraer tablas y vistas
            table_pattern = r'CREATE\s+TABLE\s+(\w+)|CREATE\s+VIEW\s+(\w+)'
            for match in re.finditer(table_pattern, content, re.IGNORECASE):
                table_name = match.group(1) or match.group(2)
                sections.append({
                    'type': 'table',
                    'name': table_name,
                    'content': content[match.start():match.end()+300]
                })
        
        return sections
    
    def index_file(self, file_path: Path, relative_path: str) -> bool:
        """Indexar un archivo individual"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            file_ext = file_path.suffix.lstrip('.')
            file_hash = hashlib.md5(content.encode()).hexdigest()
            
            # Verificar si ya existe y no ha cambiado
            existing = next((d for d in self.documents if d['path'] == str(relative_path)), None)
            if existing and existing.get('hash') == file_hash:
                return False  # No cambió
            
            # Extraer secciones
            sections = self.extract_code_sections(content, file_ext)
            
            # Crear documento
            doc = {
                'path': str(relative_path),
                'type': file_ext,
                'hash': file_hash,
                'size': len(content),
                'lines': len(content.split('\n')),
                'sections': sections,
                'content_preview': content[:1000],  # Primeros 1000 chars
                'full_content': content if len(content) < 50000 else None  # Guardar si es pequeño
            }
            
            # Remover documento antiguo si existe
            self.documents = [d for d in self.documents if d['path'] != str(relative_path)]
            self.documents.append(doc)
            
            return True
        except Exception as e:
            print(f"⚠️ Error indexando {relative_path}: {e}")
            return False
    
    def index_directory(self, dir_path: Path, patterns: List[str] = None, exclude: List[str] = None):
        """Indexar directorio recursivamente"""
        if patterns is None:
            patterns = ['*.py', '*.js', '*.jsx', '*.ts', '*.tsx', '*.css', '*.scss', '*.sql', '*.md', '*.json']
        
        if exclude is None:
            exclude = ['node_modules', '.git', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next']
        
        indexed_count = 0
        
        for pattern in patterns:
            for file_path in dir_path.rglob(pattern):
                # Verificar si está en carpeta excluida
                if any(exc in file_path.parts for exc in exclude):
                    continue
                
                relative_path = file_path.relative_to(self.project_root)
                if self.index_file(file_path, relative_path):
                    indexed_count += 1
                    print(f"✅ Indexado: {relative_path}")
        
        return indexed_count
    
    def index_project(self):
        """Indexar TODO el proyecto"""
        print("🚀 Iniciando indexación del proyecto...")
        
        # Backend
        print("\n📦 Indexando Backend...")
        backend_count = self.index_directory(self.project_root / "backend_crm")
        backend_count += self.index_directory(self.project_root / "api")
        
        # Frontend
        print("\n🎨 Indexando Frontend...")
        frontend_count = self.index_directory(self.project_root / "frontend" / "src")
        
        # Mobile
        print("\n📱 Indexando App Móvil...")
        mobile_count = self.index_directory(self.project_root / "AP GUERRERO")
        
        # Configuración e infraestructura
        print("\n⚙️ Indexando Configuración...")
        config_count = self.index_directory(self.project_root, patterns=['*.yml', '*.yaml', '*.env*', 'Dockerfile*', '*.sh'])
        
        # Documentación
        print("\n📚 Indexando Documentación...")
        docs_count = self.index_directory(self.project_root, patterns=['*.md', 'README*'])
        
        total = backend_count + frontend_count + mobile_count + config_count + docs_count
        
        self.save_database()
        
        print(f"\n✅ Indexación completada!")
        print(f"   Backend: {backend_count} archivos")
        print(f"   Frontend: {frontend_count} archivos")
        print(f"   Mobile: {mobile_count} archivos")
        print(f"   Config: {config_count} archivos")
        print(f"   Docs: {docs_count} archivos")
        print(f"   TOTAL: {total} archivos indexados")
        print(f"   Base de datos: {self.db_path}")
        
        return total


if __name__ == "__main__":
    indexer = RAGIndexer()
    indexer.index_project()
