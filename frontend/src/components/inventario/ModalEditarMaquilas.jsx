import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const ModalEditarMaquilas = ({ show, onHide, producto, onEditar }) => {
  const [existencias, setExistencias] = useState(0);
  const [lote, setLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  useEffect(() => {
    if (producto) {
      setExistencias(producto.existencias || 0);
      setLote(producto.lote || '');
      setFechaVencimiento(producto.fechaVencimiento || '');
    }
  }, [producto]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!producto) return;
    
    // Notificar al componente padre
    onEditar(producto.id, existencias, lote, fechaVencimiento);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar {producto?.nombre || 'Producto'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Existencias:</Form.Label>
            <Col sm={8}>
              <Form.Control
                type="number"
                min="0"
                value={existencias}
                onChange={(e) => setExistencias(parseInt(e.target.value) || 0)}
                required
              />
            </Col>
          </Form.Group>
          
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Lote:</Form.Label>
            <Col sm={8}>
              <Form.Control
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Número de lote"
              />
            </Col>
          </Form.Group>
          
          <Form.Group as={Row} className="mb-3">
            <Form.Label column sm={4}>Fecha Vencimiento:</Form.Label>
            <Col sm={8}>
              <Form.Control
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </Col>
          </Form.Group>
          
          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit"
            >
              Guardar Cambios
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalEditarMaquilas;