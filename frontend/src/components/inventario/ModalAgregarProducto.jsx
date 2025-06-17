import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { productoService } from '../../services/api';

const ModalAgregarProducto = ({ show, onHide, onAgregar }) => {
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    existencias: 0,
    categoria: 'General'
  });
  const [productosExistentes, setProductosExistentes] = useState([]);
  const [nombreError, setNombreError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar productos existentes cuando se abre el modal
  useEffect(() => {
    if (show) {
      cargarProductos();
    }
  }, [show]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const productos = await productoService.getAll();
      setProductosExistentes(productos);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarNombre = (nombre) => {
    // Verificar si ya existe un producto con nombre similar
    const nombreNormalizado = nombre.trim().toUpperCase();
    const productoExistente = productosExistentes.find(p => 
      p.nombre.trim().toUpperCase() === nombreNormalizado ||
      p.nombre.trim().toUpperCase().includes(nombreNormalizado) ||
      nombreNormalizado.includes(p.nombre.trim().toUpperCase())
    );
    
    if (productoExistente) {
      setNombreError(`Ya existe un producto similar: "${productoExistente.nombre}". Usa exactamente este nombre para mantener consistencia.`);
      return false;
    }
    
    setNombreError('');
    return true;
  };

  const handleSubmit = () => {
    // Validar que el nombre no esté vacío
    if (!newProduct.nombre.trim()) {
      setNombreError('El nombre del producto es obligatorio');
      return;
    }
    
    // Validar que no exista un producto con nombre similar
    if (!validarNombre(newProduct.nombre)) {
      return;
    }
    
    // Normalizar el nombre (mayúsculas para consistencia)
    const productoNormalizado = {
      ...newProduct,
      nombre: newProduct.nombre.trim().toUpperCase()
    };
    
    onAgregar(productoNormalizado);
    setNewProduct({ nombre: '', existencias: 0, categoria: 'General' });
    setNombreError('');
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
              onChange={(e) => {
                const nuevoNombre = e.target.value;
                setNewProduct({ ...newProduct, nombre: nuevoNombre });
                if (nuevoNombre.trim()) {
                  validarNombre(nuevoNombre);
                } else {
                  setNombreError('');
                }
              }}
              isInvalid={!!nombreError}
            />
            <Form.Control.Feedback type="invalid">
              {nombreError}
            </Form.Control.Feedback>
          </Form.Group>
          
          {loading && <Alert variant="info">Cargando productos existentes...</Alert>}
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