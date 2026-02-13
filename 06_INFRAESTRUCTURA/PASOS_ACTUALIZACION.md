# 🚀 Flujo de Trabajo Diario: Local -> VPS

Esta es tu "Hoja de Trucos" rápida para actualizar el sistema día a día.

---

## 💻 1. En tu Computador (Local)
Cada vez que termines un cambio y quieras subirlo:

1.  **Guarda y Sube:**
    Abre tu terminal en la carpeta del proyecto y ejecuta:
    ```bash
    git add .
    git commit -m "Escribe aquí qué arreglaste o agregaste"
    git push origin main
    ```

---

## ☁️ 2. En el Servidor (VPS)
Ahora que el código está en la nube (GitHub), bájalo al servidor:

1.  **Conéctate:**
    ```bash
    ssh root@76.13.96.225
    ```

2.  **Baja los cambios:**
    ```bash
    cd ~/crm-fabrica
    git pull origin main
    ```
    *(Deberías ver una lista de archivos que se actualizaron)*

3.  **Aplica los cambios (Reconstruye):**
    Elige el comando según lo que modificaste:

    *   **Opción A: Modifiqué cosas visuales (React, CSS, HTML)**
        ```bash
        docker compose -f docker-compose.prod.yml up -d --build frontend
        ```

    *   **Opción B: Modifiqué lógica o backend (Python, Views)**
        ```bash
        docker compose -f docker-compose.prod.yml up -d --build backend
        ```

    *   **Opción C: No estoy seguro o cambié ambos** (Más seguro, tarda un poco más)
        ```bash
        docker compose -f docker-compose.prod.yml up -d --build
        ```

---

## ⚠️ Caso Especial: Cambios en Base de Datos
Si modificaste archivos `models.py` (agregaste columnas o tablas), necesitas un paso extra en el VPS **antes** de reconstruir:

1.  Baja el código: `git pull origin main`
2.  Ejecuta migraciones dentro del contenedor:
    ```bash
    docker exec crm_backend_prod python manage.py migrate
    ```
3.  Luego sí reconstruye:
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build backend
    ```
