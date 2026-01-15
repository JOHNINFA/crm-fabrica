# 🔓 GUÍA: Ejecutable Cajón Monedero (0% Papel)

## 📋 Descripción

Este ejecutable permite abrir el cajón monedero **SIN gastar papel**, enviando comandos ESC/POS RAW directamente a la impresora.

Funciona como **puente HTTP** para que el navegador pueda abrir el cajón.

---

## 🎯 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    NAVEGADOR WEB                        │
│        http://192.168.1.19:3000/pos                    │
│                                                         │
│    [Usuario confirma venta SIN impresión]              │
│                        │                                │
│                        ▼                                │
│    fetch("http://127.0.0.1:3002/abrir-cajon")          │
└────────────────────────│────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              CajonServer.exe (este programa)            │
│              Escucha en puerto 3002                     │
│                        │                                │
│                        ▼                                │
│    Envía bytes RAW: 1B 70 00 32 FA                     │
│    (Sin imprimir documento)                             │
└────────────────────────│────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              IMPRESORA EPSON TM-T88V                    │
│                        │                                │
│                        ▼                                │
│              CAJÓN SE ABRE ✅                           │
│              SIN GASTAR PAPEL                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Requisitos

- Windows 10/11
- Visual Studio 2019 o superior (Community es gratis)
- .NET Framework 4.7.2 o superior

---

## 📁 Estructura del Proyecto

```
CajonServer/
├── CajonServer.sln          (Solución de Visual Studio)
├── CajonServer/
│   ├── CajonServer.csproj   (Proyecto)
│   ├── Program.cs           (Código principal)
│   └── Properties/
│       └── AssemblyInfo.cs
└── README.md
```

---

## 🔨 Pasos para Compilar

### PASO 1: Abrir Visual Studio

1. Abre **Visual Studio 2019/2022**
2. Click en **"Crear un proyecto nuevo"**

### PASO 2: Crear Proyecto

1. Busca **"Aplicación de consola (.NET Framework)"**
2. Click **Siguiente**
3. Nombre: `CajonServer`
4. Ubicación: donde quieras
5. Framework: **.NET Framework 4.7.2** (o superior)
6. Click **Crear**

### PASO 3: Reemplazar Código

1. Abre el archivo `Program.cs`
2. **Borra TODO** el contenido
3. **Pega** el código del archivo `CajonServer_Program.cs` (incluido abajo)

### PASO 4: Agregar Referencia

1. Click derecho en **Referencias** (panel derecho)
2. Click **Agregar referencia...**
3. Busca y marca: **System.Drawing**
4. Click **Aceptar**

### PASO 5: Compilar

1. Menú **Compilar** → **Compilar solución** (o Ctrl+Shift+B)
2. Debe decir: **Compilación correcta**

### PASO 6: Obtener Ejecutable

El ejecutable estará en:
```
CajonServer\bin\Release\CajonServer.exe
```

---

## 🧪 Probar el Ejecutable
# 💰 Solución Final: Cajón Monedero Sin Papel (v4.0 Universal)

Esta solución permite abrir el cajón monedero automáticamente desde el POS (Chrome/Navegador) **sin imprimir papel**, usando un pequeño servidor local escrito en C#.

## 🚀 Componentes

1.  **`CajonServer.exe` (v4.0 Universal)**:
    *   Servidor HTTP en puerto `3001`.
    *   Detecta automáticamente impresoras EPSON / TM.
    *   Usa comando **Real-Time Pulse** (`10 14 01 00 05`) que funciona incluso si la impresora tiene error o falta de papel.
2.  **`INSTALAR_CAJON.bat`**:
    *   Script de instalación automática.
    *   Configura el inicio automático con Windows.

## 📦 Instalación en Cliente (Windows)

1.  Copiar la carpeta `CajonServer` al PC del cliente (Ej: en Documentos o C:\POS).
2.  Conectar la impresora EPSON y verificar que esté encendida.
3.  Dar **Click Derecho** en `INSTALAR_CAJON.bat` y seleccionar **"Ejecutar como Administrador"**.
4.  Esperar a que se cierre la ventana negra.
5.  **¡Listo!** El servidor ya está corriendo y se iniciará solo al reiniciar.

## ⚙️ Configuración Impresora (Opcional pero Recomendada)

Para evitar que el cajón se abra dos veces al imprimir ticket:
1.  Ir a **Panel de Control > Dispositivos e Impresoras**.
2.  Click derecho en la impresora EPSON > **Propiedades de Impresora**.
3.  Pestaña **Configuración del Dispositivo** (o Periféricos/Cajón).
4.  En "Cash Drawer #1", seleccionar **"No Open" (No abrir)**.
    *   *Dejamos que nuestro software controle la apertura, no el driver.*

## 🛠️ Uso en Desarrollo

El frontend llama a:
`POST http://127.0.0.1:3001/abrir-cajon`

## 📄 Archivos Fuente
*   Código C#: `frontend/CajonServer_Program.cs`
*   Script Instalador: `frontend/INSTALAR_CAJON.bat`
---

## ✅ Resultado

- ✅ **0% gasto de papel**
- ✅ **Servidor HTTP** para navegador
- ✅ **Comando ESC/POS correcto** (1B 70 00 32 FA)
- ✅ **Compatible con EPSON TM-T88V y TM-T20II**
