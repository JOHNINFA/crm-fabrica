import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ModalEditarExistencias = ({ show, onHide, producto, onEditar }) => {
  const [nuevasExistencias, setNuevasExistencias] = useState(0);

  useEffect(() => {
    if (producto) {
      setNuevasExistencias(producto.existencias);
    }
  }, [producto]);

  const handleSubmit = () => {
    if (producto) {
      onEditar(producto.id, nuevasExistencias);
      onHide();
    }
  };

  if (!producto) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar Existencias</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Producto</Form.Label>
            <Form.Control
              type="text"
              value={producto.nombre}
              disabled
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Existencias Actuales</Form.Label>
            <Form.Control
              type="text"
              value={`${producto.existencias} unidades`}
              disabled
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Nuevas Existencias</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={nuevasExistencias}
              onChange={(e) => setNuevasExistencias(Number.parseInt(e.target.value) || 0)}
              className="cantidad-input"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          <i className="bi bi-save" /> Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEditarExistencias;