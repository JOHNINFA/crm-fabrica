import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ModalAgregarProducto = ({ show, onHide, onAgregar }) => {
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    existencias: 0,
    categoria: 'General'
  });

  const handleSubmit = () => {
    onAgregar(newProduct);
    setNewProduct({ nombre: '', existencias: 0, categoria: 'General' });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Agregar Nuevo Producto</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Producto *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ingrese el nombre del producto"
              value={newProduct.nombre}
              onChange={(e) =>
                setNewProduct({ ...newProduct, nombre: e.target.value })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Existencias Iniciales</Form.Label>
            <Form.Control
              type="number"
              min="0"
              placeholder="0"
              value={newProduct.existencias}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  existencias: Number.parseInt(e.target.value) || 0
                })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Categoría</Form.Label>
            <Form.Control
              type="text"
              placeholder="Categoría del producto"
              value={newProduct.categoria}
              onChange={(e) =>
                setNewProduct({ ...newProduct, categoria: e.target.value })
              }
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleSubmit}>
          <i className="bi bi-plus-circle" /> Agregar Producto
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalAgregarProducto;