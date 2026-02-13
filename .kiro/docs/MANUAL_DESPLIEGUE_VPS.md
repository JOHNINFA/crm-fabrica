# 🚀 GUÍA RÁPIDA DE DESPLIEGUE EN VPS (Sin Errores)

Esta guía te dice exactamente qué comando usar según lo que hayas modificado.

---

## 1. PASO OBLIGATORIO (Siempre hacer esto primero)
Antes de actualizar cualquier cosa, conecta al VPS y baja el código nuevo:

```bash
ssh root@76.13.96.225
cd ~/crm-fabrica
git pull origin main
```

---

## 2. ELIGE TU AVENTURA (Usa solo el comando que necesites)

### 🎨 CASO A: Solo toqué Frontend (React, HTML, CSS, Pantallas)
*Usar cuando:* Cambiaste colores, botones, textos o arreglaste algo visual.
```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### 🧠 CASO B: Solo toqué Backend (Python, API, Vistas, Lógica)
*Usar cuando:* Cambiaste lógica de negocio, fórmulas matemáticas o archivos `.py` (sin tocar modelos).
```bash
docker compose -f docker-compose.prod.yml up -d --build backend
```

### �️ CASO C: Toqué Base de Datos (Models.py, Tablas, Columnas)
*Usar cuando:* Agregaste un campo nuevo a un modelo o creaste una tabla nueva.
**(Son 2 pasos obligatorios)**
```bash
# Paso 1: Aplicar los cambios en la estructura de la BD
docker exec crm_backend_prod python manage.py migrate

# Paso 2: Reiniciar el cerebro para que use la nueva estructura
docker compose -f docker-compose.prod.yml up -d --build backend
```

### 🤷‍♂️ CASO D: Toqué de todo un poco o NO ESTOY SEGURO
*Usar cuando:* Hiciste muchos cambios mezclados y quieres asegurarte de que todo quede actualizado.
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS COMUNES

### 🛑 Error: "FATAL: password authentication failed"
*Causa:* Probablemente usaste el comando sin `-f ...prod.yml` y se mezclaron las claves.
*Solución:* Restablece la conexión de producción forzando el reinicio:
```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

### 🛑 Error: Pantalla blanca o "403 Forbidden"
*Causa:* Nginx se mareó o no encuentra los archivos nuevos del frontend.
*Solución:* Reconstruye el frontend limpiando caché:
```bash
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### 🛑 Error: "Connection Timed Out" (Sitio caído)
*Causa:* El servidor de producción se detuvo.
*Solución:* Levántalo de nuevo:
```bash
docker compose -f docker-compose.prod.yml up -d
```
