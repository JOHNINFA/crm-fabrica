import React, { useState, useEffect } from 'react';

const HoverToggleButton = () => {
  // Inicializar estado desde localStorage o true por defecto
  const [hoverEnabled, setHoverEnabled] = useState(() => {
    const saved = localStorage.getItem('hoverEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleHover = () => {
    const newState = !hoverEnabled;
    setHoverEnabled(newState);
    
    // Guardar en localStorage
    localStorage.setItem('hoverEnabled', JSON.stringify(newState));
    
    // Agregar o quitar la clase que controla el hover
    if (newState) {
      document.body.classList.remove('hover-disabled');
    } else {
      document.body.classList.add('hover-disabled');
    }
  };

  // Inicializar al montar el componente
  useEffect(() => {
    // Verificar localStorage al cargar
    const savedState = localStorage.getItem('hoverEnabled');
    const isEnabled = savedState !== null ? JSON.parse(savedState) : true;
    
    // Actualizar estado y clase del body
    setHoverEnabled(isEnabled);
    
    if (!isEnabled) {
      document.body.classList.add('hover-disabled');
    } else {
      document.body.classList.remove('hover-disabled');
    }
    
    // No limpiar al desmontar para mantener consistencia entre páginas
  }, []);

  return (
    <button 
      onClick={toggleHover}
      className="hover-toggle-btn"
      title={hoverEnabled ? "Desactivar efecto hover" : "Activar efecto hover"}
      aria-label={hoverEnabled ? "Desactivar efecto hover" : "Activar efecto hover"}
    >
      <i className={`bi ${hoverEnabled ? 'bi-pencil' : 'bi-pencil-fill'}`}></i>
    </button>
  );
};

export default HoverToggleButton;