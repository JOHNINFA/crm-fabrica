import React from 'react';
import { Button } from 'react-bootstrap';

const BotonLimpiar = ({ onLimpiar }) => {
  const handleLimpiar = () => {
    if (window.confirm('¿Está seguro de limpiar todos los datos? Esta acción no se puede deshacer.')) {
      onLimpiar();
    }
  };

  return (
    <div className="d-flex justify-content-end mt-3">
      <Button 
        variant="warning" 
        onClick={handleLimpiar}
        className="btn-limpiar"
      >
        <span className="material-icons me-2" style={{fontSize: '16px'}}>clear_all</span>
        Limpiar Datos
      </Button>
    </div>
  );
};

export default BotonLimpiar;