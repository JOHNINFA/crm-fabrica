import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Alert, Table } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

/**
 * Componente extremadamente simple para gestionar productos
 * Solo trabaja con localStorage, sin intentar sincronizar con el backend
 */
const SimpleProductManager = ({ show, onHide }) => {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, category: 'General' });
  const [message, setMessage] = useState('');

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (show) {
      loadProducts();
    }
  }, [show]);

  // Cargar productos desde localStorage
  const loadProducts = () => {
    try {
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  // Guardar productos en localStorage
  const saveProducts = (newProducts) => {
    try {
      localStorage.setItem('products', JSON.stringify(newProducts));
      setProducts(newProducts);
      return true;
    } catch (error) {
      console.error('Error al guardar productos:', error);
      return false;
    }
  };

  // Agregar producto
  const handleAddProduct = () => {
    if (!newProduct.name.trim()) {
      setMessage('El nombre es obligatorio');
      return;
    }

    const productToAdd = {
      id: uuidv4(),
      name: newProduct.name.trim(),
      price: parseFloat(newProduct.price) || 0,
      category: newProduct.category || 'General',
      stock: 0,
      brand: 'GENERICA',
      tax: 'IVA(0%)'
    };

    const updatedProducts = [...products, productToAdd];
    if (saveProducts(updatedProducts)) {
      setMessage('Producto agregado');
      setNewProduct({ name: '', price: 0, category: 'General' });
    }
  };

  // Eliminar productos seleccionados
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    const updatedProducts = products.filter(p => !selectedIds.includes(p.id));
    if (saveProducts(updatedProducts)) {
      setMessage(`${selectedIds.length} productos eliminados`);
      setSelectedIds([]);
    }
  };

  // Manejar selección de productos
  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Productos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message && (
          <Alert variant="info" onClose={() => setMessage('')} dismissible>
            {message}
          </Alert>
        )}

        <div className="mb-3 p-3 border rounded">
          <h5>Agregar Producto</h5>
          <Form.Group className="mb-2">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Categoría</Form.Label>
            <Form.Control
              type="text"
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Precio</Form.Label>
            <Form.Control
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
            />
          </Form.Group>
          <Button variant="primary" onClick={handleAddProduct}>
            Agregar
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <div className="mb-3">
            <Button variant="danger" onClick={handleDeleteSelected}>
              Eliminar Seleccionados ({selectedIds.length})
            </Button>
          </div>
        )}

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelection(product.id)}
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center">No hay productos</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SimpleProductManager;