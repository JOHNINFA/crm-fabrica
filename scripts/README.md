# 🤖 Scripts de Automatización

## Descripción
Scripts para ejecutar comandos automáticamente sin depender de la flecha verde de Kiro.

---

## 📋 Scripts Disponibles

### 1. verificar-documentacion.sh (Bash)
**Descripción**: Verifica que toda la documentación esté presente y correcta.

**Uso**:
```bash
bash scripts/verificar-documentacion.sh
```

**Qué hace**:
- ✅ Verifica que existan todos los archivos
- ✅ Muestra el tamaño de cada archivo
- ✅ Cuenta líneas totales
- ✅ Cuenta palabras totales
- ✅ Lista archivos con tamaño

**Salida esperada**:
```
================================
📚 VERIFICACIÓN DE DOCUMENTACIÓN
================================

✅ DOCUMENTACION/README_GENERAL.md (15 KB)
✅ DOCUMENTACION/README_POS.md (18 KB)
...
```

---

### 2. verificar-documentacion.py (Python)
**Descripción**: Verificación más detallada con análisis de contenido.

**Uso**:
```bash
python scripts/verificar-documentacion.py
```

**Qué hace**:
- ✅ Verifica que existan todos los archivos
- ✅ Cuenta líneas, palabras y caracteres
- ✅ Verifica que contengan palabras clave
- ✅ Genera estadísticas detalladas

**Salida esperada**:
```
==================================================
✅ 1. VERIFICANDO ARCHIVOS DE DOCUMENTACIÓN
==================================================

✅ DOCUMENTACION/README_GENERAL.md (15.2 KB)
✅ DOCUMENTACION/README_POS.md (18.1 KB)
...

==================================================
📊 2. ESTADÍSTICAS DE DOCUMENTACIÓN
==================================================

📄 README_GENERAL.md
   - Líneas: 250
   - Palabras: 3500
   - Caracteres: 25000
...

TOTALES:
   - Líneas totales: 2500
   - Palabras totales: 35000
   - Caracteres totales: 250000
```

---

## 🚀 Cómo Usar

### Opción 1: Ejecutar en Terminal
```bash
# Bash
bash scripts/verificar-documentacion.sh

# Python
python scripts/verificar-documentacion.py
```

### Opción 2: Crear un Kiro Hook (Automático)
1. Abre la paleta de comandos: **Ctrl + Shift + P**
2. Busca: **"Open Kiro Hook UI"**
3. Crea un nuevo hook:
   - **Evento**: `onSave`
   - **Archivo**: `DOCUMENTACION/*.md`
   - **Comando**: `python scripts/verificar-documentacion.py`

### Opción 3: Ejecutar con Ctrl + Enter
1. Escribe en el Command Box: `python scripts/verificar-documentacion.py`
2. Presiona **Ctrl + Enter**

---

## 📝 Crear Tus Propios Scripts

### Ejemplo: Script personalizado
```bash
#!/bin/bash

echo "Mi script personalizado"
echo "Ejecutando comando..."

# Tu comando aquí
ls -lah DOCUMENTACION/

echo "¡Listo!"
```

**Guardar como**: `scripts/mi-script.sh`

**Ejecutar**:
```bash
bash scripts/mi-script.sh
```

---

## 🔧 Troubleshooting

### Error: "Permission denied"
```bash
# Dar permisos de ejecución
chmod +x scripts/verificar-documentacion.sh

# Luego ejecutar
bash scripts/verificar-documentacion.sh
```

### Error: "python: command not found"
```bash
# Usar python3 en lugar de python
python3 scripts/verificar-documentacion.py
```

### Error: "No such file or directory"
```bash
# Asegúrate de estar en la raíz del proyecto
cd /ruta/del/proyecto
python scripts/verificar-documentacion.py
```

---

## 💡 Tips

1. **Automatizar con Cron** (Linux/Mac):
```bash
# Ejecutar cada hora
0 * * * * cd /ruta/proyecto && python scripts/verificar-documentacion.py
```

2. **Ejecutar múltiples scripts**:
```bash
bash scripts/verificar-documentacion.sh && python scripts/verificar-documentacion.py
```

3. **Guardar salida en archivo**:
```bash
python scripts/verificar-documentacion.py > verificacion.log
```

---

## 📚 Documentación Relacionada

- [README_GENERAL.md](../DOCUMENTACION/README_GENERAL.md) - Arquitectura general
- [INDICE.md](../DOCUMENTACION/INDICE.md) - Índice de documentación
- [.kiro/hooks/auto-execute.md](../.kiro/hooks/auto-execute.md) - Configuración de Kiro Hooks

---

**Última actualización**: 17 de Noviembre de 2025
