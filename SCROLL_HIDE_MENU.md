# 📜 OCULTAR MENÚ AL HACER SCROLL

## 🎯 Funcionalidad Implementada

El botón hamburguesa y el logo ahora se ocultan/muestran automáticamente según el scroll:

### Comportamiento

```
Scroll hacia ABAJO (↓)
    ↓
Botón y logo se OCULTAN hacia arriba
    ↓
Más espacio en pantalla

Scroll hacia ARRIBA (↑)
    ↓
Botón y logo APARECEN
    ↓
Fácil acceso al menú
```

---

## 🎨 Estados Visuales

### 1. En el Top de la Página
```
┌─────────────────────────────────┐
│ ☰ 🏠                            │ ← Botón y logo VISIBLES
│                                 │
│      CONTENIDO POS              │
│                                 │
└─────────────────────────────────┘
```

### 2. Scroll Hacia Abajo (> 100px)
```
┌─────────────────────────────────┐
│                                 │ ← Botón y logo OCULTOS
│                                 │
│      CONTENIDO POS              │
│   (Más espacio visible)         │
└─────────────────────────────────┘
```

### 3. Scroll Hacia Arriba
```
┌─────────────────────────────────┐
│ ☰ 🏠                            │ ← Botón y logo APARECEN
│                                 │
│      CONTENIDO POS              │
│                                 │
└─────────────────────────────────┘
```

### 4. Sidebar Abierto
```
┌──────────────┬──────────────────┐
│   🏠 Logo    │░░░░░░░░░░░░░░░░░│
├──────────────┤░░ OVERLAY ░░░░░░│
│ 🏠 Inicio    │░░░░░░░░░░░░░░░░░│
│ 📦 Productos │░░░░░░░░░░░░░░░░░│
└──────────────┴──────────────────┘
                    ↑
              ☰ Botón SIEMPRE visible
```

---

## 💻 Código Implementado

### 1. Estados de React
```jsx
const [isVisible, setIsVisible] = useState(true);
const [lastScrollY, setLastScrollY] = useState(0);
```

### 2. Detector de Scroll
```jsx
React.useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    // Si el sidebar está abierto, no ocultar el botón
    if (isExpanded) {
      setIsVisible(true);
      return;
    }
    
    // Mostrar si scrollea hacia arriba o está en el top
    if (currentScrollY < lastScrollY || currentScrollY < 10) {
      setIsVisible(true);
    } 
    // Ocultar si scrollea hacia abajo
    else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsVisible(false);
    }
    
    setLastScrollY(currentScrollY);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, [lastScrollY, isExpanded]);
```

### 3. Contenedor con Animación
```jsx
<div
  style={{
    position: 'fixed',
    top: isVisible ? '10px' : '-60px',  // ← Se mueve fuera de la pantalla
    left: isExpanded ? '220px' : '10px',
    zIndex: 1001,
    transition: 'top 0.3s ease, left 0.3s ease',
    opacity: isVisible ? 1 : 0  // ← Fade out
  }}
>
  <button>☰</button>
  <img src={logo} />
</div>
```

---

## 🎨 Estilos CSS

### Logo Junto al Botón
```css
.hamburger-logo {
    height: 36px;
    width: auto;
    cursor: pointer;
    transition: transform 0.2s ease, opacity 0.2s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.hamburger-logo:hover {
    transform: scale(1.05);
    opacity: 0.9;
}

.hamburger-logo:active {
    transform: scale(0.95);
}
```

---

## 📋 Reglas de Comportamiento

### Mostrar Botón y Logo Cuando:
1. ✅ Scroll hacia arriba (cualquier cantidad)
2. ✅ Está en el top de la página (< 10px)
3. ✅ El sidebar está abierto (siempre visible)
4. ✅ Se abre/cierra el sidebar (forzar visible)

### Ocultar Botón y Logo Cuando:
1. ✅ Scroll hacia abajo (> 100px)
2. ✅ El sidebar está cerrado
3. ✅ No está en el top de la página

### Excepciones:
- ⚠️ Si el sidebar está abierto, el botón SIEMPRE es visible
- ⚠️ Al abrir/cerrar el sidebar, se fuerza la visibilidad

---

## 🎯 Ventajas

### 1. Más Espacio en Pantalla
```
ANTES (botón siempre visible):
┌─────────────────────────────────┐
│ ☰ 🏠                            │ ← Ocupa espacio
│                                 │
│      CONTENIDO                  │
│                                 │
└─────────────────────────────────┘

AHORA (botón se oculta):
┌─────────────────────────────────┐
│                                 │ ← Más espacio
│                                 │
│      CONTENIDO                  │
│      (Más visible)              │
└─────────────────────────────────┘
```

### 2. Mejor UX
- ✅ No interfiere con el contenido al hacer scroll
- ✅ Fácil acceso al menú (scroll arriba)
- ✅ Comportamiento intuitivo
- ✅ Animación suave

### 3. Diseño Moderno
- ✅ Patrón común en apps modernas
- ✅ Maximiza espacio de contenido
- ✅ Transiciones elegantes

---

## 🔧 Parámetros Configurables

### Umbral de Scroll para Ocultar
```jsx
currentScrollY > 100  // ← Cambiar este valor
```
- **100px:** Oculta después de 100px de scroll
- Aumentar: Oculta más tarde
- Disminuir: Oculta más rápido

### Umbral para Mostrar en Top
```jsx
currentScrollY < 10  // ← Cambiar este valor
```
- **10px:** Considera "top" si está a menos de 10px
- Aumentar: Zona de "top" más grande
- Disminuir: Zona de "top" más pequeña

### Velocidad de Animación
```jsx
transition: 'top 0.3s ease'  // ← Cambiar duración
```
- **0.3s:** Animación de 300ms
- Aumentar: Más lento
- Disminuir: Más rápido

---

## 📱 Responsive

El comportamiento funciona en todas las resoluciones:

### Desktop
- ✅ Oculta al scroll hacia abajo
- ✅ Muestra al scroll hacia arriba

### Tablet
- ✅ Mismo comportamiento
- ✅ Más espacio aprovechado

### Mobile
- ✅ Mismo comportamiento
- ✅ Crítico para pantallas pequeñas

---

## 🎬 Secuencia de Animación

### Ocultar (Scroll Down)
```
1. Usuario scrollea hacia abajo > 100px
   ↓
2. isVisible = false
   ↓
3. top: 10px → -60px (0.3s)
   ↓
4. opacity: 1 → 0 (0.3s)
   ↓
5. Botón y logo fuera de vista
```

### Mostrar (Scroll Up)
```
1. Usuario scrollea hacia arriba
   ↓
2. isVisible = true
   ↓
3. top: -60px → 10px (0.3s)
   ↓
4. opacity: 0 → 1 (0.3s)
   ↓
5. Botón y logo visibles
```

---

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────┐
│ Usuario en top de página                        │
│ ☰ 🏠 VISIBLE                                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Usuario scrollea hacia ABAJO > 100px            │
│ ☰ 🏠 SE OCULTA (top: -60px, opacity: 0)        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Usuario scrollea hacia ARRIBA                   │
│ ☰ 🏠 APARECE (top: 10px, opacity: 1)           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ Usuario hace clic en ☰                          │
│ Sidebar se abre                                 │
│ ☰ SIEMPRE VISIBLE (isExpanded = true)          │
└─────────────────────────────────────────────────┘
```

---

## ✅ Características

### Performance
- ✅ Event listener con `{ passive: true }`
- ✅ Cleanup en useEffect
- ✅ Transiciones CSS (GPU accelerated)

### Accesibilidad
- ✅ Siempre accesible con scroll arriba
- ✅ Visible cuando el sidebar está abierto
- ✅ Animación suave (no abrupta)

### UX
- ✅ Comportamiento predecible
- ✅ Feedback visual claro
- ✅ No interfiere con la navegación

---

## 📊 Comparación Antes/Después

### ANTES
```
Scroll ↓ → Botón SIEMPRE visible
Scroll ↑ → Botón SIEMPRE visible
```
- ❌ Ocupa espacio constantemente
- ❌ Puede interferir con el contenido

### DESPUÉS
```
Scroll ↓ → Botón SE OCULTA
Scroll ↑ → Botón APARECE
```
- ✅ Maximiza espacio de contenido
- ✅ Acceso fácil cuando se necesita
- ✅ Diseño limpio y moderno

---

## 🚀 Archivos Modificados

### 1. frontend/src/components/Pos/Sidebar.jsx
```jsx
// Estados agregados
const [isVisible, setIsVisible] = useState(true);
const [lastScrollY, setLastScrollY] = useState(0);

// useEffect para detectar scroll
React.useEffect(() => {
  const handleScroll = () => { ... };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [lastScrollY, isExpanded]);

// Contenedor con animación
<div style={{
  top: isVisible ? '10px' : '-60px',
  opacity: isVisible ? 1 : 0,
  transition: 'top 0.3s ease'
}}>
```

### 2. frontend/src/components/Pos/Sidebar.css
```css
/* Logo junto al botón */
.hamburger-logo {
    height: 36px;
    cursor: pointer;
    transition: transform 0.2s ease;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.hamburger-logo:hover {
    transform: scale(1.05);
}
```

---

**Última actualización:** 2025-01-11
**Versión:** 2.2
