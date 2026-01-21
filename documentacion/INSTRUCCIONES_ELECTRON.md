# 📦 Configuración de Electron para Apertura del Cajón Monedero

## ✅ **Archivos Creados:**

### 1. `/frontend/public/electron.js`
- ✅ Proceso principal de Electron
- ✅ Handler `imprimir-raw`: Envía comandos ESC/POS a la impresora
- ✅ Handler `listar-impresoras`: Lista impresoras disponibles
- ✅ Soporte para Windows y Linux

### 2. `/frontend/src/services/cajonService.js`
- ✅ Servicio para abrir el cajón
- ✅ Usa IPC de Electron para comunicarse con el proceso principal

---

## 📋 **Pasos para Habilitar Electron:**

### **1️⃣ Instalar Dependencias:**

```bash
cd /home/john/Escritorio/crm-fabrica/frontend

# Instalar Electron y dependencias
npm install --save-dev electron electron-is-dev concurrently wait-on cross-env
```

### **2️⃣ Modificar `package.json`:**

Agregar estas líneas al archivo `/frontend/package.json`:

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "main": "public/electron.js",  // ← AGREGAR ESTA LÍNEA
  "homepage": "./",               // ← AGREGAR ESTA LÍNEA
  "private": true,
  "dependencies": {
    // ... dependencias existentes ...
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    // ← AGREGAR ESTOS SCRIPTS:
    "electron:dev": "concurrently \"cross-env BROWSER=none npm start\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron": "electron ."
  },
  "devDependencies": {  // ← AGREGAR ESTA SECCIÓN
    "electron": "^28.0.0",
    "electron-is-dev": "^2.0.0",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0",
    "cross-env": "^7.0.3",
    "electron-builder": "^24.9.1"
  }
}
```

### **3️⃣ Ejecutar en Modo Electron:**

```bash
# Modo desarrollo (con DevTools)
npm run electron:dev
```

### **4️⃣ Construir Aplicación de Escritorio:**

```bash
# Construir ejecutable
npm run electron:build
```

---

## 🔧 **Cómo Funciona:**

### **Flujo de Apertura del Cajón:**

```
┌─────────────────────┐
│   React Frontend    │
│  (cajonService.js)  │
└──────────┬──────────┘
           │ ipcRenderer.invoke
           │ ('imprimir-raw')
           ▼
┌─────────────────────┐
│  Electron Main      │
│   (electron.js)     │
└──────────┬──────────┘
           │ Comando ESC/POS
           │ \x1B\x70\x00\x19\xFA
           ▼
┌─────────────────────┐
│   Impresora POS     │
│  (Puerto USB/Red)   │
└──────────┬──────────┘
           │ Pulso eléctrico
           ▼
┌─────────────────────┐
│  Cajón Monedero     │
│    (Se abre 🔓)     │
└─────────────────────┘
```

---

## ⚠️ **Requisitos:**

1. **Sistema Operativo:**
   - ✅ Windows 10/11
   - ✅ Linux (Ubuntu, Debian, etc.)
   - ⚠️ macOS (requiere configuración adicional)

2. **Hardware:**
   - ✅ Impresora térmica POS conectada (USB o Red)
   - ✅ Cajón monedero conectado a la impresora (puerto RJ11/RJ12)

3. **Configuración:**
   - ✅ Impresora debe estar instalada en el sistema
   - ✅ Driver de impresora debe soportar comandos RAW/ESC-POS

---

## 🎯 **Resultado:**

**Después de configurar Electron:**

1. ✅ **Botón manual** en POS funciona
2. ✅ **Apertura automática** cuando NO se imprime
3. ✅ **Impresión + apertura** cuando SÍ se imprime

---

## 🐛 **Solución de Problemas:**

### **Problema: "Cannot find module 'electron'"**
```bash
npm install electron --save-dev
```

### **Problema: "Impresora no responde"**
- Verificar que la impresora esté encendida
- Verificar que el nombre de la impresora sea correcto
- En Linux: `lpstat -p` para ver impresoras

### **Problema: "Cajón no abre"**
- Verificar conexión física del cajón a la impresora
- Verificar que el cajón esté en el puerto correcto (pin 2 o pin 5)
- Probar cambiar el comando: `\x1B\x70\x01\x19\xFA` (pin 5)

---

## 📝 **Notas:**

- El comando ESC/POS `\x1B\x70\x00\x19\xFA` es estándar para la mayoría de impresoras térmicas
- Algunos modelos pueden requerir comandos diferentes
- El cajón debe estar conectado al puerto de la impresora (no directo a la PC)

---

**¿Listo para instalar Electron?** 🚀
