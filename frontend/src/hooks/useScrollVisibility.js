import { useState, useEffect } from 'react';

/**
 * Hook personalizado para controlar la visibilidad de elementos según el scroll
 * @param {boolean} isExpanded - Si el sidebar está expandido (siempre visible)
 * @returns {boolean} isVisible - Si el elemento debe ser visible
 */
export const useScrollVisibility = (isExpanded = false) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Si el sidebar está abierto, siempre visible
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

  return isVisible;
};
