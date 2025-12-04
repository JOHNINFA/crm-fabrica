# 🚀 GUÍA DE INSTALACIÓN - CRM FÁBRICA (WINDOWS)

Este proyecto está **Dockerizado**, lo que significa que puedes ejecutarlo en Windows sin instalar Python, Node.js ni PostgreSQL manualmente. Todo está incluido.

---

## 📋 1. REQUISITOS PREVIOS

Solo necesitas instalar una cosa:

1. **Docker Desktop para Windows**
   - Descárgalo aquí: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
   - Instálalo y asegúrate de que esté corriendo (verás el icono de la ballena en la barra de tareas).

---

## 🛠️ 2. INSTALACIÓN (3 Pasos)

### Paso 1: Descomprimir
Descomprime la carpeta del proyecto en una ubicación de tu preferencia (ej: `C:\Proyectos\crm-fabrica`).

### Paso 2: Abrir Terminal
1. Entra a la carpeta del proyecto.
2. En la barra de dirección del explorador de archivos, escribe `cmd` y presiona Enter.
3. Se abrirá una ventana negra (terminal) en esa carpeta.

### Paso 3: Iniciar el Sistema
Escribe el siguiente comando y presiona Enter:

```bash
docker-compose up -d --build
```

*(La primera vez tardará unos 10-15 minutos descargando e instalando todo. Ten paciencia).*

---

## 🌐 3. CÓMO ACCEDER

Una vez que termine, abre tu navegador (Chrome/Edge) y entra a:

- **💻 Sistema (Frontend):** [http://localhost:3000](http://localhost:3000)
- **🔧 API (Backend):** [http://localhost:8000/api/](http://localhost:8000/api/)
- **👤 Admin:** [http://localhost:8000/admin](http://localhost:8000/admin)
  - **Usuario:** `admin`
  - **Contraseña:** `admin`

---

## ❓ SOLUCIÓN DE PROBLEMAS

**1. "Docker no se reconoce como un comando..."**
> Reinicia tu computadora después de instalar Docker Desktop.

**2. "Ports are not available" (Puertos ocupados)**
> Asegúrate de no tener otro PostgreSQL o servidor web corriendo. Docker necesita los puertos 3000, 8000 y 5432 libres.

**3. ¿Cómo detengo el sistema?**
> En la misma terminal, ejecuta: `docker-compose stop`

**4. ¿Cómo veo si hay errores?**
> Ejecuta: `docker-compose logs -f`

---

*Generado automáticamente para facilitar el despliegue en Windows.*
