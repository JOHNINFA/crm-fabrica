import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';

const ModalEditarMaquilas = ({ show, onHide, productos, onGuardar }) => {
  const [productosEditados, setProductosEditados] = useState([]);

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (show) {
      setProductosEditados(JSON.parse(JSON.stringify(productos)));
    }
  }, [show, productos]);

  const handleCantidadChange = (id, value) => {
    setProductosEditados(prevProductos => 
      prevProductos.map(producto => 
        producto.id === id ? { ...producto, cantidad: parseInt(value) || 0 } : producto
      )
    );
  };

  const handleLoteChange = (id, value) => {
    setProductosEditados(prevProductos => 
      prevProductos.map(producto => 
        producto.id === id ? { ...producto, lote: value } : producto
      )
    );
  };

  const handleFechaVencimientoChange = (id, value) => {
    setProductosEditados(prevProductos => 
      prevProductos.map(producto => 
        producto.id === id ? { ...producto, fechaVencimiento: value } : producto
      )
    );
  };

  const handleGuardar = () => {
    onGuardar(productosEditados);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Editar Productos</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <ListGroup variant="flush">
          {productosEditados.map(producto => (
            <ListGroup.Item key={producto.id} className="py-3">
              <div className="fw-medium mb-2">{producto.nombre}</div>
              <div className="row mb-2">
                <div className="col-md-4 mb-2 mb-md-0">
                  <Form.Label>Cantidad:</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={producto.cantidad || 0}
                    onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                    className="form-control-sm"
                  />
                </div>
                <div className="col-md-4 mb-2 mb-md-0">
                  <Form.Label>Lote:</Form.Label>
                  <Form.Control
                    type="text"
                    value={producto.lote || ''}
                    onChange={(e) => handleLoteChange(producto.id, e.target.value)}
                    className="form-control-sm"
                    placeholder="Lote"
                  />
                </div>
                <div className="col-md-4">
                  <Form.Label>Vencimiento:</Form.Label>
                  <Form.Control
                    type="date"
                    value={producto.fechaVencimiento || ''}
                    onChange={(e) => handleFechaVencimientoChange(producto.id, e.target.value)}
                    className="form-control-sm"
                  />
                </div>
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

export default ModalEditarMaquilas;