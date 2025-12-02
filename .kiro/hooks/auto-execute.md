# 🤖 Kiro Hook - Auto Ejecutar Comandos

## Descripción
Este hook ejecuta comandos automáticamente cuando se guarda un archivo o se dispara un evento.

## Configuración
- **Evento**: Guardar archivo
- **Acción**: Ejecutar comando en terminal
- **Automático**: Sí

## Comandos Disponibles

### 1. Verificar Documentación
```bash
ls -lah DOCUMENTACION/
```

### 2. Contar líneas de documentación
```bash
wc -l DOCUMENTACION/*.md
```

### 3. Buscar en documentación
```bash
grep -r "README" DOCUMENTACION/
```

### 4. Validar estructura
```bash
find DOCUMENTACION/ -name "*.md" -type f
```

## Cómo Usar

### Opción 1: Usar Kiro Hooks (Recomendado)
1. Abre la paleta de comandos: **Ctrl + Shift + P**
2. Busca: **"Open Kiro Hook UI"**
3. Crea un nuevo hook
4. Configura:
   - **Evento**: `onSave` (al guardar)
   - **Acción**: Ejecutar comando
   - **Comando**: El que necesites

### Opción 2: Ejecutar en Terminal
1. Abre la terminal integrada: **Ctrl + `**
2. Ejecuta el comando directamente

### Opción 3: Usar Ctrl + Enter
1. Escribe el comando en el Command Box
2. Presiona **Ctrl + Enter**

## Ejemplos de Hooks

### Hook 1: Verificar documentación al guardar
```
Evento: onSave
Archivo: DOCUMENTACION/*.md
Comando: ls -lah DOCUMENTACION/
```

### Hook 2: Validar sintaxis Markdown
```
Evento: onSave
Archivo: DOCUMENTACION/*.md
Comando: find DOCUMENTACION/ -name "*.md" -type f
```

### Hook 3: Contar cambios
```
Evento: onSave
Archivo: DOCUMENTACION/*.md
Comando: wc -l DOCUMENTACION/*.md
```

## Ventajas
✅ Automático - No necesitas hacer nada
✅ Rápido - Se ejecuta al guardar
✅ Confiable - No depende de la flecha verde
✅ Flexible - Puedes crear múltiples hooks

## Desventajas
❌ Requiere configuración inicial
❌ Solo funciona con eventos específicos

---

**Última actualización**: 17 de Noviembre de 2025
