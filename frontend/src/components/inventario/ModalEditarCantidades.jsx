import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';

const ModalEditarCantidades = ({ show, onHide, productos, onGuardar }) => {
  const [existencias, setExistencias] = useState({});

  // Inicializar existencias cuando se abre el modal
  useEffect(() => {
    if (show) {
      const initialExistencias = {};
      productos.forEach(producto => {
        initialExistencias[producto.id] = producto.existencias || 0;
      });
      setExistencias(initialExistencias);
    }
  }, [show, productos]);

  const handleExistenciasChange = (id, value) => {
    setExistencias({
      ...existencias,
      [id]: parseInt(value) || 0
    });
  };

  const handleGuardar = () => {
    onGuardar(existencias);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Existencias</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <ListGroup variant="flush">
          {productos.map(producto => (
            <ListGroup.Item key={producto.id} className="py-2">
              <div className="fw-medium mb-1">{producto.nombre}</div>
              <div className="d-flex align-items-center">
                <span className="me-2">Existencias:</span>
                <Form.Control
                  type="number"
                  min="0"
                  value={existencias[producto.id] || 0}
                  onChange={(e) => handleExistenciasChange(producto.id, e.target.value)}
                  className="cantidad-input-modal"
                  style={{ width: '80px' }}
                />
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleGuardar}>
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEditarCantidades;