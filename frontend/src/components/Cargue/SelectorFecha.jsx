import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';

const SelectorFecha = ({ onFechaChange, fechaActual }) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');

  useEffect(() => {
    // Establecer fecha actual por defecto
    const hoy = new Date().toISOString().split('T')[0];
    setFechaSeleccionada(fechaActual || hoy);
  }, [fechaActual]);

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    setFechaSeleccionada(nuevaFecha);
    onFechaChange(nuevaFecha);
  };

  const irAHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaSeleccionada(hoy);
    onFechaChange(hoy);
  };

  return (
    <div className="d-flex align-items-center gap-3 mb-3 p-2 bg-light rounded">
      <div className="d-flex align-items-center gap-2">
        <label className="fw-bold mb-0">Fecha:</label>
        <Form.Control
          type="date"
          value={fechaSeleccionada}
          onChange={handleFechaChange}
          style={{ width: '150px' }}
        />
      </div>
      
      <Button 
        variant="outline-primary" 
        size="sm" 
        onClick={irAHoy}
        disabled={fechaSeleccionada === new Date().toISOString().split('T')[0]}
      >
        Hoy
      </Button>
      
      <small className="text-muted">
        {fechaSeleccionada === new Date().toISOString().split('T')[0] 
          ? '(Fecha actual)' 
          : '(Fecha histórica)'}
      </small>
    </div>
  );
};

export default SelectorFecha;