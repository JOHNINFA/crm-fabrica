# 🔧 MANTENIMIENTO DEL RAG

## Cuándo Re-indexar

Re-indexa el RAG después de:

- ✅ Agregar nuevos modelos Django
- ✅ Crear nuevos endpoints de API
- ✅ Agregar componentes React importantes
- ✅ Cambios en la estructura de carpetas
- ✅ Actualizaciones de configuración
- ✅ Cambios en la base de datos

## Cómo Re-indexar

```bash
python3 .kiro/rag/indexer.py
```

Toma ~30 segundos y actualiza `.kiro/rag/database.json`

## Actualizar Documentación

Después de cambios importantes, actualiza:

1. `.kiro/docs/ARCHITECTURE.md` - Si cambia la arquitectura
2. `.kiro/steering/rag-context.md` - Si cambian conceptos clave
3. `.kiro/docs/API.md` - Si se agregan/modifican endpoints
4. `.kiro/docs/FRONTEND.md` - Si se agregan componentes
5. `.kiro/docs/MOBILE.md` - Si se agregan funcionalidades

## Checklist de Cambios

Cuando hagas cambios importantes:

```
[ ] Realizar cambios en el código
[ ] Ejecutar tests
[ ] Actualizar documentación relevante
[ ] Re-indexar: python3 .kiro/rag/indexer.py
[ ] Verificar que database.json se actualizó
[ ] Probar búsquedas en el RAG
[ ] Commit a git
```

## Monitoreo

Para verificar que el RAG está actualizado:

```bash
# Ver estadísticas
python3 .kiro/rag/retriever.py

# Buscar algo específico
python3 .kiro/rag/retriever.py "tu búsqueda"
```

## Troubleshooting

### El RAG no encuentra información reciente

**Solución**: Re-indexa
```bash
python3 .kiro/rag/indexer.py
```

### La búsqueda es lenta

**Solución**: Normal con 559 archivos. Usa búsquedas más específicas.

### database.json está corrupto

**Solución**: Elimina y re-indexa
```bash
rm .kiro/rag/database.json
python3 .kiro/rag/indexer.py
```

## Automatización (Opcional)

Puedes crear un hook en Kiro para re-indexar automáticamente:

1. Abre Command Palette: `Ctrl+Shift+P`
2. Busca: "Open Kiro Hook UI"
3. Crea un hook que ejecute: `python3 .kiro/rag/indexer.py`
4. Configura para que se ejecute después de guardar archivos

## Mejoras Futuras

- [ ] Crear `.kiro/docs/API.md` con endpoints detallados
- [ ] Crear `.kiro/docs/FRONTEND.md` con componentes
- [ ] Crear `.kiro/docs/MOBILE.md` con funcionalidades
- [ ] Crear `.kiro/docs/DATABASE.md` con esquema completo
- [ ] Crear hook automático para re-indexar
- [ ] Agregar búsqueda por tipo de archivo
- [ ] Agregar búsqueda por componente específico

## Notas

- El RAG indexa automáticamente: `.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.css`, `.scss`, `.sql`, `.md`, `.json`
- Excluye automáticamente: `node_modules`, `.git`, `__pycache__`, `.venv`, `dist`, `build`
- La base de datos es un archivo JSON simple, fácil de versionar en git

---

**Última actualización**: 2026-02-10
