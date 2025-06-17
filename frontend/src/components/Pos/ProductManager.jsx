import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import { Button, Modal, Form, Alert } from 'react-bootstrap';

/**
 * Componente para gestionar productos en el POS
 * Este componente permite ver, editar y eliminar productos
 */
const ProductManager = ({ show, onHide }) => {
  const { products, updateProducts, deleteProduct } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrar productos cuando cambia la búsqueda o la lista de productos
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredProducts(products);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredProducts(
        products.filter(p => 
          p.name.toLowerCase().includes(searchLower) || 
          p.category.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [search, products]);

  // Manejar selección de productos
  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Seleccionar todos los productos
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  // Eliminar productos seleccionados
  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      // Eliminar cada producto seleccionado
      for (const productId of selectedProducts) {
        await deleteProduct(productId);
      }
      
      // Mostrar mensaje de éxito
      setMessage({ text: 'Productos eliminados correctamente', type: 'success' });
      setSelectedProducts([]);
      
      // Forzar actualización de la lista
      const updatedProducts = products.filter(p => !selectedProducts.includes(p.id));
      updateProducts(updatedProducts);
    } catch (error) {
      console.error('Error al eliminar productos:', error);
      setMessage({ text: 'Error al eliminar productos', type: 'danger' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  // Guardar cambios
  const handleSave = () => {
    try {
      // Guardar productos actualizados
      updateProducts(products);
      setMessage({ text: 'Cambios guardados correctamente', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      setMessage({ text: 'Error al guardar cambios', type: 'danger' });
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Productos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message.text && (
          <Alert variant={message.type} dismissible onClose={() => setMessage({ text: '', type: '' })}>
            {message.text}
          </Alert>
        )}
        
        <div className="d-flex mb-3">
          <Form.Control
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="me-2"
          />
          <Button 
            variant="outline-primary" 
            onClick={handleSelectAll}
          >
            {selectedProducts.length === filteredProducts.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </Button>
        </div>
        
        {selectedProducts.length > 0 && (
          <div className="mb-3">
            <Button 
              variant="danger" 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : `Eliminar (${selectedProducts.length})`}
            </Button>
          </div>
        )}
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="table table-striped">
            <thead>
              <tr>
                <th></th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">No se encontraron productos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductManager;