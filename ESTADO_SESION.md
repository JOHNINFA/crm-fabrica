# Estado de la Sesión - 23 Enero 2026

## ✅ Lo que ya hicimos y funciona:

1. **Frontend conectado a API local** - Creamos `frontend/.env` con `REACT_APP_API_URL=http://localhost:8000/api`

2. **Nombres de vendedores en Cargue** - Arreglamos `MenuSheets.jsx` y `PlantillaOperativa.jsx` para usar `API_URL`

3. **App móvil (AP GUERRERO)** - Corregimos `config.js` para que la lógica DEV/PROD tenga sentido

4. **Imágenes en app móvil** - Actualizamos `Productos.js` para usar IDs en vez de nombres (más robusto)

5. **BotonLimpiar.jsx** - Corregido completamente:
   - Agregamos `const API_URL = process.env.REACT_APP_API_URL || '/api';`
   - Reemplazamos TODAS las llamadas `fetch('/api/...')` y `fetch(\`/api/...\`)` por usar `${API_URL}`
   - El modal "Confirmar Descuento" ahora muestra los valores correctos en local (CARGUE, PEDIDOS, VENCIDAS)

6. **RegistroLotes.jsx** - Corregido:
   - Agregamos `const API_URL = process.env.REACT_APP_API_URL || '/api';`
   - Reemplazamos las URLs hardcodeadas para que funcione en local

---

## 🔄 En progreso:

- Probando la aplicación completa en local
- Pendiente subir cambios al VPS

---

## ❌ Pendiente - Revisar:

- El cliente reportó que hay módulos que no quedaron funcionando en el VPS (por especificar)
- **App móvil (Ventas)**: Aparecen turnos abiertos sin haber cargado productos ni realizado ventas - revisar lógica de turnos

---

## 🔧 Comandos útiles:

```bash
# Iniciar backend
python3 manage.py runserver 0.0.0.0:8000

# Iniciar frontend
cd frontend && npm start

# Iniciar app móvil
cd "AP GUERRERO" && npx expo start

# Subir cambios al VPS
git add .
git commit -m "Fix: URLs API para desarrollo local"
git push
# En VPS: git pull && docker-compose restart
```
