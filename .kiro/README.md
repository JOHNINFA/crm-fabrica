# 🤖 RAG SYSTEM - CRM FÁBRICA

## ¿Qué es esto?

Un sistema RAG (Retrieval-Augmented Generation) que indexó **559 archivos** de tu proyecto y los pone a disposición de la IA automáticamente.

Ahora cuando hagas una pregunta en Kiro, la IA tendrá acceso a:
- Todo el código del backend (Django)
- Todo el código del frontend (React)
- Todo el código de la app móvil (React Native)
- Toda la configuración e infraestructura
- Toda la documentación

## 🚀 Cómo Usar

### En Kiro (Automático)
Solo haz preguntas. El contexto se inyecta automáticamente:

```
"¿Cómo funciona el flujo de cargue?"
"¿Dónde está el modelo de Producto?"
"¿Cuál es la estructura de la BD?"
"¿Cómo creo un nuevo endpoint?"
```

### Desde Terminal (Manual)
```bash
# Ver contexto completo
python3 .kiro/rag/retriever.py

# Buscar algo específico
python3 .kiro/rag/retriever.py "cargue"
```

## 📊 Estadísticas

```
✅ 559 archivos indexados
✅ 116 archivos Backend
✅ 278 archivos Frontend
✅ 53 archivos Mobile
✅ 22 archivos Configuración
✅ 90 archivos Documentación
```

## 📁 Estructura

```
.kiro/
├── rag/
│   ├── indexer.py           # Script para indexar
│   ├── retriever.py         # Script para buscar
│   └── database.json        # Base de datos (559 archivos)
├── steering/
│   └── rag-context.md       # Contexto inyectado en Kiro
├── docs/
│   └── ARCHITECTURE.md      # Arquitectura del proyecto
├── RAG_README.md            # Guía completa
├── QUICK_START.md           # Inicio rápido
├── MAINTENANCE.md           # Cómo mantenerlo actualizado
└── README.md                # Este archivo
```

## 🔄 Importante: Re-indexar

Después de cambios importantes al código:

```bash
python3 .kiro/rag/indexer.py
```

Esto asegura que la IA siempre tenga información actualizada.

## 📚 Documentación

- **RAG_README.md** - Guía completa del sistema
- **QUICK_START.md** - Cómo empezar rápido
- **MAINTENANCE.md** - Cómo mantenerlo actualizado
- **docs/ARCHITECTURE.md** - Arquitectura del proyecto

## 💡 Ejemplos

### Entender el proyecto
```
"¿Cuál es la arquitectura?"
"¿Cómo se sincroniza la app?"
"¿Cuál es el flujo de ventas?"
```

### Implementar cambios
```
"Necesito agregar un campo a Producto"
"¿Cómo creo un endpoint?"
"¿Dónde actualizo el componente?"
```

### Debugging
```
"¿Por qué no sincroniza el stock?"
"¿Cuál es el flujo de autenticación?"
"¿Cómo se manejan los errores?"
```

## ✅ Checklist

- [x] RAG indexado (559 archivos)
- [x] Contexto inyectado en Kiro
- [x] Documentación creada
- [ ] Re-indexar después de cambios
- [ ] Actualizar docs en `.kiro/docs/`

## 🎯 Próximos Pasos

1. **Usa el RAG** - Haz preguntas en Kiro
2. **Re-indexa regularmente** - Después de cambios importantes
3. **Actualiza documentación** - En `.kiro/docs/`
4. **Crea skills** - En `IA_SKILLS/` usando el RAG

---

**¡El RAG está listo! La IA ahora sabe todo sobre tu proyecto.** 🎉

Fecha: 2026-02-10 | Estado: ✅ OPERATIVO
