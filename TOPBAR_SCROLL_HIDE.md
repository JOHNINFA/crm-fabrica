# 📜 OCULTAR TOPBAR AL HACER SCROLL

## 🎯 Funcionalidad Implementada

Ahora tanto el **botón hamburguesa + logo** como el **Topbar** se ocultan al hacer scroll hacia abajo, dando más espacio para ver los productos.

---

## 🎨 Comportamiento Visual

### 1. En el Top de la Página
```
┌─────────────────────────────────┐
│ ☰ 🏠                            │ ← Botón y logo VISIBLES
├─────────────────────────────────┤
│ Informes | Caja | 🔍 | 📊      │ ← Topbar VISIBLE
├─────────────────────────────────┤
│                                 │
│   📦 PRODUCTOS (Grid)           │
│                                 │
└─────────────────────────────────┘
```

### 2. Scroll Hacia Abajo (> 100px)
```
┌─────────────────────────────────┐
│                                 │ ← TODO OCULTO
│                                 │
│   📦 PRODUCTOS (Grid)           │
│   (Mucho más espacio)           │
│                                 │
│   Más productos visibles        │
│                                 │
└─────────────────────────────────┘
```

### 3. Scroll Hacia Arriba
```
┌─────────────────────────────────┐
│ ☰ 🏠                            │ ← Botón y logo APARECEN
├─────────────────────────────────┤
│ Informes | Caja | 🔍 | 📊      │ ← Topbar APARECE
├─────────────────────────────────┤
│                                 │
│   📦 PRODUCTOS (Grid)           │
└─────────────────────────────────┘
```

---

## 💻 Implementación

### 1. Hook Compartido (useScrollVisibility.js)
```jsx
export const useScrollVisibility = (isExpanded = false) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Si sidebar abierto, siempre visible
      if (isExpanded) {
        setIsVisible(true);
        return;
      }
      
      // Mostrar si scroll arriba o en top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } 
      // Ocultar si scroll abajo
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isExpanded]);

  return isVisible;
};
```

### 2. Sidebar.jsx
```jsx
import { useScrollVisibility } from '../../hooks/useScrollVisibility';

export default function Sidebar({ onWidthChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Usar el hook
  const isVisible = useScrollVisibility(isExpanded);
  
  return (
    <div style={{
      top: isVisible ? '10px' : '-60px',
      opacity: isVisible ? 1 : 0,
      transition: 'top 0.3s ease'
    }}>
      {/* Botón hamburguesa y logo */}
    </div>
  );
}
```

### 3. Topbar.jsx
```jsx
import { useScrollVisibility } from '../../hooks/useScrollVisibility';

export default function Topbar() {
  // Usar el hook
  const isVisible = useScrollVisibility(false);
  
  return (
    <nav 
      className="topbar-bg"
      style={{
        position: 'fixed',
        top: isVisible ? '0' : '-80px',
        left: 0,
        right: 0,
        zIndex: 998,
        transition: 'top 0.3s ease',
        opacity: isVisible ? 1 : 0
      }}
    >
      {/* Contenido del topbar */}
    </nav>
  );
}
```

### 4. PosScreen.jsx
```jsx
<div style={{
  paddingTop: '60px'  // ← Espacio para el topbar fijo
}}>
  <Topbar />
  <main>
    {/* Contenido */}
  </main>
</div>
```

---

## 📋 Archivos Creados/Modificados

### Nuevos Archivos
```
✅ frontend/src/hooks/useScrollVisibility.js
   └─ Hook compartido para detectar scroll

✅ frontend/src/components/Pos/Topbar.css
   └─ Estilos del topbar
```

### Archivos Modificados
```
✅ frontend/src/components/Pos/Sidebar.jsx
   ├─ Usa useScrollVisibility hook
   └─ Código más limpio

✅ frontend/src/components/Pos/Topbar.jsx
   ├─ Importa useScrollVisibility
   ├─ position: fixed
   ├─ Animación de ocultamiento
   └─ Importa Topbar.css

✅ frontend/src/pages/PosScreen.jsx
   └─ paddingTop: '60px' para el topbar fijo
```

---

## 🎯 Ventajas

### 1. Más Espacio para Productos
```
ANTES (topbar siempre visible):
┌─────────────────────────────────┐
│ Topbar (60px)                   │ ← Ocupa espacio
├─────────────────────────────────┤
│                                 │
│   📦 Productos                  │
│   (Espacio limitado)            │
│                                 │
└─────────────────────────────────┘

AHORA (topbar se oculta):
┌─────────────────────────────────┐
│                                 │ ← 60px más de espacio
│   📦 Productos                  │
│   (Más productos visibles)      │
│                                 │
│   📦 📦 📦                      │
└─────────────────────────────────┘
```

### 2. Mejor Experiencia de Usuario
- ✅ Más productos visibles en pantalla
- ✅ Menos scroll necesario
- ✅ Fácil acceso a controles (scroll arriba)
- ✅ Interfaz limpia al navegar

### 3. Código Reutilizable
- ✅ Hook compartido entre componentes
- ✅ Lógica centralizada
- ✅ Fácil de mantener
- ✅ Consistente en toda la app

---

## 🎬 Flujo de Interacción

```
Usuario en top de página
    ↓
☰ 🏠 VISIBLE
Topbar VISIBLE
    ↓
Usuario scrollea hacia abajo > 100px
    ↓
☰ 🏠 SE OCULTA (0.3s)
Topbar SE OCULTA (0.3s)
    ↓
MÁS ESPACIO PARA PRODUCTOS
    ↓
Usuario scrollea hacia arriba
    ↓
☰ 🏠 APARECE (0.3s)
Topbar APARECE (0.3s)
    ↓
Fácil acceso a controles
```

---

## 🎨 Z-Index Layers

```
1001 - Botón hamburguesa (siempre encima)
1000 - Sidebar (sobre overlay)
999  - Overlay (sobre contenido)
998  - Topbar (bajo botón hamburguesa)
```

---

## 📊 Comparación Antes/Después

### ANTES
```
Altura visible: 100vh
- Topbar: 60px (fijo)
- Contenido: 100vh - 60px
= Productos visibles: ~85vh
```

### DESPUÉS (con scroll)
```
Altura visible: 100vh
- Topbar: 0px (oculto)
- Contenido: 100vh
= Productos visibles: ~100vh
```

**Ganancia: +15vh de espacio (~150px en pantalla 1080p)**

---

## 🔧 Configuración

### Cambiar Velocidad de Animación
```jsx
// En Topbar.jsx y Sidebar.jsx
transition: 'top 0.3s ease'  // ← Cambiar duración
```

### Cambiar Umbral de Scroll
```jsx
// En useScrollVisibility.js
currentScrollY > 100  // ← Cambiar valor
```

### Cambiar Altura del Topbar
```jsx
// En PosScreen.jsx
paddingTop: '60px'  // ← Ajustar según altura real
```

---

## ✅ Resultado Final

Ahora tienes:
- ✅ Botón hamburguesa que se oculta al scroll
- ✅ Logo que se oculta al scroll
- ✅ Topbar que se oculta al scroll
- ✅ Más espacio para ver productos
- ✅ Animaciones suaves y consistentes
- ✅ Código reutilizable y mantenible

---

**Última actualización:** 2025-01-11
**Versión:** 2.3
