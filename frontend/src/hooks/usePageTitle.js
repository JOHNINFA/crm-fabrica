import { useEffect } from 'react';

/**
 * Hook para cambiar el título de la página dinámicamente
 * @param {string} title - Título del módulo (ej: "POS", "Inventario")
 */
const usePageTitle = (title) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} - Arepas Guerrero` : 'Arepas Guerrero';
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default usePageTitle;
