# 📄 Implementación del Botón "Corregir Cantidades"

**Fecha:** 12 de Febrero de 2026
**Estado:** Implementado y Desplegado
**Versión:** 1.0

## 🎯 Objetivo
Permitir al administrador corregir las cantidades de productos en el cargue desde el CRM web, asegurando la persistencia de datos incluso si el cargue original provino de la App Móvil, y garantizando la seguridad del proceso una vez el vendedor sale a ruta.

---

## 🛠️ Cambios Realizados

### 1. Backend (Django)
*   **Nuevo Endpoint:** `POST /api/cargue-corregir-cantidad/`
*   **Archivo:** `api/views.py`
*   **Lógica:**
    *   Busca el registro existente por `vendedor`, `dia`, `fecha` y `producto`.
    *   Actualiza la `cantidad` y recalcula el `total`.
    *   **Importante:** No modifica el campo `usuario` (mantiene "AppMovil" si fue creado por ella).
    *   Evita conflictos de unicidad que ocurrían con el endpoint de creación estándar.

### 2. Frontend (React)

#### A. Componente `BotonCorreccionNuevo.jsx`
*   **Ubicación:** `frontend/src/components/Cargue/BotonCorreccionNuevo.jsx`
*   **Funcionalidades:**
    1.  **Seguridad:** Al hacer clic, solicita una clave de seguridad.
        *   **Clave:** `201486`
        *   **UI:** Modal de Bootstrap estilizado (campo tipo password).
    2.  **Visibilidad Condicional (Seguridad Operativa):**
        *   El botón **SOLO** es visible en los estados: `SUGERIDO` y `ALISTAMIENTO`.
        *   Se **OCULTA** en: `ACTIVO`, `DESPACHO`, `ENTREGADO`, `CERRADO`.
        *   *Razón:* Evitar modificaciones una vez el vendedor ha iniciado su ruta.
    3.  **Reactividad en Tiempo Real:**
        *   Usa un `useEffect` con `setInterval` (500ms) para leer el estado desde `localStorage`.
        *   Si el estado cambia (ej. de Alistamiento a Activo), el botón desaparece instantáneamente sin necesidad de recargar la página (F5).

#### B. Componente `ModalCorreccionSimple.jsx`
*   **Ubicación:** `frontend/src/components/Cargue/ModalCorreccionSimple.jsx`
*   **Cambio:** Conecta al nuevo endpoint del backend en lugar de solo actualizar `localStorage`.
*   **Fix:** Usa `process.env.REACT_APP_API_URL` para asegurar conexión al puerto correcto (8000).

#### C. Componente `PlantillaOperativa.jsx`
*   **Cambio:** Pasa el estado inicial como *prop* al botón de corrección.

---

## 🚀 Despliegue en VPS

Pasos ejecutados para la puesta en producción:

1.  **Commit y Push** de los cambios a la rama `main`.
2.  **Backup preventivo** de datos del día (tablas CargueIDx) realizado en `/tmp/`.
3.  **Actualización en VPS:**
    ```bash
    cd ~/crm-fabrica
    git pull origin main
    docker compose -f docker-compose.prod.yml up -d --build
    ```

## 🔒 Claves y Credenciales
*   **Clave de Corrección:** `201486`
