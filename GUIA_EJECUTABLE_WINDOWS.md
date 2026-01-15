# 🚀 GUÍA COMPLETA: Generar Ejecutable Windows desde Linux

## ✅ **Archivos Configurados:**

1. ✅ `public/electron.js` - Proceso principal
2. ✅ `electron-builder.json` - Configuración del builder
3. ✅ `package.json` - Scripts y dependencias
4. ✅ `build-windows.sh` - Script helper automático

---

## 📋 **PASO 1: Instalar Dependencias**

```bash
cd /home/john/Escritorio/crm-fabrica/frontend

# Instalar dependencias de Electron
npm install
```

---

## 📋 **PASO 2: Obtener IP del Servidor Linux**

```bash
# Ver la IP de tu máquina Linux
ip addr show

# O más simple:
hostname -I
```

**Ejemplo de salida:**
```
192.168.1.10 
```

---

## 📋 **PASO 3A: Construir Ejecutable (Método Automático)**

```bash
# Dar permisos al script
chmod +x build-windows.sh

# Ejecutar (reemplazar con TU IP)
./build-windows.sh 192.168.1.10

# Esperar... (puede tardar 5-10 minutos)
```

---

## 📋 **PASO 3B: Construir Ejecutable (Método Manual)**

```bash
# 1. Crear archivo .env.production
cat > .env.production << EOF
SERVER_IP=192.168.1.10
SERVER_PORT=3000
EOF

# 2. Construir
npm run electron:build:win
```

---

## 📦 **PASO 4: Ubicar el Ejecutable**

```bash
cd dist

# Deberías ver:
# CRM Fabrica Setup 1.0.0.exe  (instalador)
# o
# CRM Fabrica-1.0.0.exe  (portable)
```

---

## 💾 **PASO 5: Transferir a Windows**

### **Opción A: USB**
```bash
# Copiar a USB
cp "dist/CRM Fabrica Setup 1.0.0.exe" /media/tu-usb/
```

### **Opción B: Red (Si hay carpeta compartida)**
```bash
# Copiar a carpeta de red
smbclient //WINDOWS-PC/Compartida -U usuario
put "dist/CRM Fabrica Setup 1.0.0.exe"
```

### **Opción C: SSH/SCP**
```bash
scp "dist/CRM Fabrica Setup 1.0.0.exe" usuario@192.168.1.20:C:/Descargas/
```

---

## 🪟 **PASO 6: Instalar en Windows**

**En el equipo Windows:**

1. Ejecutar `CRM Fabrica Setup 1.0.0.exe`
2. Seguir el asistente de instalación
3. Elegir carpeta de instalación
4. Crear acceso directo en escritorio
5. Finalizar

---

## 🎯 **PASO 7: Configurar Primera Vez**

**Al abrir la aplicación por primera vez:**

1. La app se conectará automáticamente a `http://192.168.1.10:3000`
2. Verifica que el backend Django esté corriendo en Linux
3. Verifica que el firewall permita conexiones al puerto 3000

---

## 🔧 **Si Necesitas Cambiar la IP Después:**

### **Windows:**

Crear archivo `.env` en:
```
C:\Users\TuUsuario\AppData\Local\crm-fabrica\
```

Contenido:
```
SERVER_IP=192.168.1.15
SERVER_PORT=3000
```

---

## ⚡ **Comandos Rápidos:**

```bash
# Ver IP del servidor
hostname -I

# Construir ejecutable Windows
./build-windows.sh $(hostname -I | awk '{print $1}')

# Construir ejecutable Linux
npm run electron:build:linux

# Desarrollo local
npm run electron:dev
```

---

## 🧪 **Probar Todo el Flujo:**

### **En Linux (Servidor):**
```bash
# Terminal 1: Backend
cd /home/john/Escritorio/crm-fabrica
python3 manage.py runserver 0.0.0.0:8000

# Terminal 2: Frontend
cd /home/john/Escritorio/crm-fabrica/frontend
npm start
```

### **En Windows (Cliente):**
```
1. Abrir CRM Fabrica (icono del escritorio)
2. Conectarse automáticamente
3. Probar apertura de cajón con el botón verde
```

---

## 🐛 **Solución de Problemas:**

### **Error: "No se puede conectar al servidor"**
```bash
# En Linux, verificar que el firewall permita conexiones
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# Verificar que Django esté escuchando en 0.0.0.0
python3 manage.py runserver 0.0.0.0:8000
```

### **Error: "electron-builder no encontrado"**
```bash
npm install --save-dev electron-builder
```

### **Error al construir: "No space left on device"**
```bash
# Limpiar archivos temporales
npm run build  # Solo construir React primero
rm -rf node_modules/.cache
```

---

## 📊 **Arquitectura Final:**

```
┌──────────────────────┐
│   LINUX (Servidor)   │
│                      │
│  Django: :8000       │ ←─────┐
│  React:  :3000       │       │
└──────────────────────┘       │
                               │ HTTP
┌──────────────────────┐       │
│  WINDOWS (Cliente)   │ ──────┘
│                      │
│  Electron App        │
│  Impresora POS       │
│  Cajón Monedero      │
└──────────────────────┘
```

---

## ✅ **Checklist Final:**

- [ ] Dependencias instaladas
- [ ] IP del servidor identificada
- [ ] Ejecutable generado
- [ ] Ejecutable copiado a Windows
- [ ] Instalación completada
- [ ] Backend corriendo en Linux
- [ ] Frontend corriendo en Linux
- [ ] Firewall configurado
- [ ] Aplicación conectada
- [ ] Impresora configurada
- [ ] Cajón funciona

---

**¿Todo listo? ¡Ahora puedes construir el ejecutable!** 🎉
