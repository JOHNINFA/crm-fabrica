# Instrucciones para Colaborador - Windows

## Requisitos Previos
- **Docker Desktop** instalado y corriendo en Windows
  - Descargar de: https://www.docker.com/products/docker-desktop/
  - Asegurarse de que esté corriendo (ícono en la barra de tareas)
- **Git** instalado
  - Descargar de: https://git-scm.com/download/win

## Configuración Inicial

### 1. Clonar el Repositorio
Abre PowerShell o CMD y ejecuta:

```bash
# Navega a la carpeta donde quieres clonar el proyecto
cd C:\Users\TuUsuario\Documents

# Clona el repositorio
git clone https://github.com/JOHNINFA/crm-fabrica.git

# Entra a la carpeta del proyecto
cd crm-fabrica
```

### 2. Corregir Problema de Finales de Línea (IMPORTANTE)
Windows usa finales de línea diferentes a Linux. Necesitas modificar el Dockerfile:

```bash
# Abre el Dockerfile con Notepad
notepad Dockerfile
```

Busca estas líneas (alrededor de la línea 37-39):
```dockerfile
# Script de entrada
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
```

Y cámbialas por:
```dockerfile
# Script de entrada
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
```

**Guarda el archivo (Ctrl+S) y cierra el editor.**

### 3. Levantar los Contenedores Docker
```bash
docker-compose up -d
```

Este comando descargará las imágenes necesarias (puede tardar 10-15 minutos la primera vez) y levantará 3 contenedores:
- Frontend (React)
- Backend (Django)
- PostgreSQL

**Nota:** La primera vez es lento porque descarga todas las imágenes. Las siguientes veces será mucho más rápido.

### 4. Verificar que Todo Esté Corriendo
```bash
docker-compose ps
```

Deberías ver 3 contenedores activos:
- `crm_backend` - Up
- `crm_frontend` - Up  
- `crm_postgres` - Up (healthy)

### 5. Acceder a la Aplicación
Espera 1-2 minutos después de levantar los contenedores para que todo inicie completamente.

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **Base de datos:** localhost:5432

---

## Actualizar Cambios del Proyecto

Cuando haya nuevos cambios en el repositorio:

### 1. Descargar los Cambios
```bash
git pull
```

### 2. Reconstruir y Reiniciar los Contenedores
```bash
docker-compose up -d --build
```

El flag `--build` reconstruye las imágenes con los nuevos cambios.

---

## Comandos Útiles

### Ver logs de los contenedores
```bash
# Todos los contenedores
docker-compose logs

# Solo un contenedor específico
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres
```

### Detener los contenedores
```bash
docker-compose down
```

### Reiniciar los contenedores
```bash
docker-compose restart
```

### Ver contenedores corriendo
```bash
docker ps
```

### Entrar a un contenedor (para debugging)
```bash
docker exec -it crm-fabrica_backend bash
docker exec -it crm-fabrica_frontend sh
```

---

## Solución de Problemas

### Si el backend no inicia (error "exec /docker-entrypoint.sh: no such file or directory"):
Esto significa que no aplicaste el paso 2 correctamente. Verifica que el Dockerfile tenga la línea:
```dockerfile
RUN sed -i 's/\r$//' /docker-entrypoint.sh
```

Luego reconstruye:
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

### Si los contenedores no inician correctamente:
```bash
docker-compose down
docker-compose up -d --build
```

### Si hay problemas con la base de datos:
```bash
docker-compose down -v
docker-compose up -d
```
⚠️ Esto eliminará los datos de la base de datos.

### Ver errores específicos:
```bash
docker-compose logs -f

# O ver logs de un contenedor específico:
docker-compose logs backend
docker-compose logs frontend
```

### Si el frontend o backend se quedan cargando:
Espera 2-3 minutos. La primera vez que inician pueden tardar. Luego recarga la página.

---

## Notas Importantes

- **Docker Desktop debe estar corriendo** antes de ejecutar cualquier comando
- Los puertos **3000, 8000 y 5432** deben estar libres en tu máquina
- Siempre haz `git pull` antes de empezar a trabajar para tener la última versión
- Si modificas código, los cambios se reflejarán automáticamente (hot reload)
- **La primera vez es lento** (10-15 minutos), las siguientes veces será rápido (30 segundos)
- No uses `sudo` en Windows, los comandos de Docker funcionan directamente
- Si clonas el proyecto de nuevo, **debes repetir el paso 2** (modificar el Dockerfile)

---

## Contacto
Si tienes problemas, contacta al equipo de desarrollo.
