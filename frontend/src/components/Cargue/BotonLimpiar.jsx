import React from 'react';
import { Button } from 'react-bootstrap';

const BotonLimpiar = ({ onLimpiar }) => {
  const handleGuardar = () => {
    // El guardado ya es automático, solo mostrar confirmación
    alert('Datos guardados correctamente');
  };

  return (
    <div className="d-flex justify-content-start mt-3">
      <Button 
        variant="success" 
        onClick={handleGuardar}
        className="btn-guardar"
      >
        <span className="material-icons me-2" style={{fontSize: '16px'}}>save</span>
        Guardar
      </Button>
    </div>
  );
};

export default BotonLimpiar;