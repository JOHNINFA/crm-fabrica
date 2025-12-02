import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ModalCambiarUsuario = ({ show, onHide, usuarioActual, onCambiar }) => {
  const [nuevoUsuario, setNuevoUsuario] = useState('');

  const handleSubmit = () => {
    if (nuevoUsuario.trim()) {
      onCambiar(nuevoUsuario);
      setNuevoUsuario('');
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cambiar Usuario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Usuario Actual</Form.Label>
            <Form.Control
              type="text"
              value={usuarioActual}
              disabled
              className="bg-light"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Nuevo Usuario *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del usuario"
              value={nuevoUsuario}
              onChange={(e) => setNuevoUsuario(e.target.value)}
            />
            <Form.Text className="text-muted">
              Este nombre aparecerá en todos los movimientos que realice.
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          <i className="bi bi-person-check" /> Cambiar Usuario
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalCambiarUsuario;