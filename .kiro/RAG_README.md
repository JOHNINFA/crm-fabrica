# 🤖 RAG - Sistema de Recuperación de Contexto

## ¿Qué es el RAG?

RAG (Retrieval-Augmented Generation) es un sistema que indexa TODO tu código y lo hace disponible para la IA. Así, cuando haces una pregunta, la IA tiene acceso a la información exacta del proyecto sin perder contexto.

## 🚀 Cómo Usar

### 1. Indexar el Proyecto (Primera vez)

```bash
python3 .kiro/rag/indexer.py
```

Esto:
- Escanea TODO el código (backend, frontend, mobile, estilos, BD, etc.)
- Extrae clases, funciones, componentes
- Crea una base de datos vectorial en `.kiro/rag/database.json`
- Toma ~30 segundos

### 2. Buscar Información

```bash
# Búsqueda específica
python3 .kiro/rag/retriever.py "¿cómo funciona el cargue?"

# Ver contexto completo
python3 .kiro/rag/retriever.py
```

### 3. Usar en Kiro

El contexto se inyecta automáticamente en Kiro gracias a `.kiro/steering/rag-context.md`.

Simplemente pregunta:
```
"¿Cómo creo un nuevo endpoint de API?"
"¿Dónde está el modelo de Producto?"
"¿Cuál es el flujo de sincronización?"
```

## 📁 Estructura RAG

```
.kiro/
├── rag/
│   ├── indexer.py           # Script para indexar código
│   ├── retriever.py         # Script para buscar información
│   ├── database.json        # Base de datos indexada
│   └── setup.sh             # Setup inicial
├── steering/
│   └── rag-context.md       # Contexto inyectado en Kiro
└── docs/
    ├── ARCHITECTURE.md      # Arquitectura del proyecto
    ├── API.md              # Endpoints (por crear)
    ├── FRONTEND.md         # Componentes React (por crear)
    ├── MOBILE.md           # Componentes React Native (por crear)
    └── DATABASE.md         # Esquema BD (por crear)
```

## 🔄 Actualización Automática

**Importante**: Cada vez que hagas cambios al proyecto, debes re-indexar:

```bash
python3 .kiro/rag/indexer.py
```

Esto asegura que:
- La IA siempre tiene información actualizada
- Los cambios se reflejan en el contexto
- No hay inconsistencias

## 📊 Qué Indexa

El RAG indexa automáticamente:

### Backend
- `backend_crm/settings.py` - Configuración
- `api/models.py` - Modelos de datos
- `api/views.py` - Endpoints
- `api/serializers.py` - Serializadores
- `api/urls.py` - Rutas
- `api/services/` - Servicios de negocio

### Frontend
- `frontend/src/components/` - Componentes React
- `frontend/src/pages/` - Páginas
- `frontend/src/services/` - Servicios API
- `frontend/src/styles/` - Estilos CSS/SCSS

### Mobile
- `AP GUERRERO/components/` - Componentes React Native
- `AP GUERRERO/services/` - Servicios
- `AP GUERRERO/App.js` - Configuración

### Infraestructura
- `Dockerfile`, `docker-compose.yml` - Docker
- `nginx/nginx.conf` - Configuración Nginx
- `.env`, `.env.example` - Variables de entorno
- `requirements.txt` - Dependencias Python

### Documentación
- `*.md` - Archivos Markdown
- `README*` - Archivos README

## 💡 Ejemplos de Uso

### Entender la Arquitectura
```
"¿Cuál es la estructura del proyecto?"
→ RAG devuelve: Arquitectura completa, modelos, endpoints, componentes
```

### Implementar Cambios
```
"Necesito agregar un nuevo campo a Producto"
→ RAG devuelve: Modelo Producto, migraciones, serializer, endpoint
```

### Debugging
```
"¿Por qué no se sincroniza el stock?"
→ RAG devuelve: Modelo Stock, flujo de sincronización, endpoints relacionados
```

### Crear Nuevas Funcionalidades
```
"¿Cómo creo un nuevo endpoint de API?"
→ RAG devuelve: Ejemplos de endpoints, estructura de views, serializers
```

## 🔍 Búsqueda Avanzada

### Por Tipo de Archivo
```python
from .kiro.rag.retriever import RAGRetriever

retriever = RAGRetriever()

# Buscar solo en Python
results = retriever.search_by_type("Producto", "py")

# Buscar solo en React
results = retriever.search_by_type("componente", "jsx")
```

### Obtener Contexto Específico
```python
# Arquitectura
context = retriever.get_architecture_context()

# Esquema de BD
context = retriever.get_database_schema()

# Endpoints de API
context = retriever.get_api_endpoints()

# Componentes
context = retriever.get_component_structure()
```

## 📈 Estadísticas

Después de indexar, verás algo como:

```
✅ Indexación completada!
   Backend: 45 archivos
   Frontend: 32 archivos
   Mobile: 28 archivos
   Config: 12 archivos
   Docs: 8 archivos
   TOTAL: 125 archivos indexados
```

## ⚙️ Configuración

### Cambiar Patrones de Indexación

Edita `indexer.py`:

```python
patterns = ['*.py', '*.js', '*.jsx', '*.ts', '*.tsx', '*.css', '*.scss', '*.sql', '*.md', '*.json']
```

### Cambiar Carpetas Excluidas

Edita `indexer.py`:

```python
exclude = ['node_modules', '.git', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next']
```

## 🐛 Troubleshooting

### "No se encontró contexto relevante"
- Ejecuta `python3 .kiro/rag/indexer.py` para re-indexar
- Verifica que los archivos existan

### "La búsqueda es lenta"
- La base de datos es grande, es normal
- Usa búsquedas más específicas

### "El contexto está desactualizado"
- Re-indexa después de cambios: `python3 .kiro/rag/indexer.py`
- Verifica que `database.json` se haya actualizado

## 🎯 Checklist de Uso

- [ ] Ejecutar indexador inicial: `python3 .kiro/rag/indexer.py`
- [ ] Verificar que `database.json` se creó
- [ ] Probar búsqueda: `python3 .kiro/rag/retriever.py "test"`
- [ ] Usar en Kiro: Hacer una pregunta sobre el proyecto
- [ ] Re-indexar después de cambios importantes
- [ ] Actualizar documentación en `.kiro/docs/`

## 📞 Soporte

Si el RAG no funciona:

1. Verifica que Python 3.8+ esté instalado
2. Ejecuta: `python3 .kiro/rag/indexer.py`
3. Revisa `database.json` para ver qué se indexó
4. Prueba búsquedas simples primero

## 🚀 Próximos Pasos

1. **Crear documentación adicional**:
   - `.kiro/docs/API.md` - Endpoints detallados
   - `.kiro/docs/FRONTEND.md` - Componentes React
   - `.kiro/docs/MOBILE.md` - Componentes React Native
   - `.kiro/docs/DATABASE.md` - Esquema BD

2. **Integrar con IA_SKILLS**:
   - Crear skills que usen el RAG
   - Automatizar tareas comunes

3. **Monitoreo**:
   - Crear hook para re-indexar automáticamente
   - Alertas si el contexto está desactualizado

---

**¡El RAG está listo! Ahora la IA siempre sabe qué hacer.** 🎉
