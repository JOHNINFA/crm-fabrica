import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Alert } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

/**
 * Componente simplificado para gestionar productos en el POS
 * Este componente trabaja directamente con localStorage sin depender del backend
 */
const ProductManagerSimple = ({ show, onHide }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    category: 'General',
    stock: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Cargar productos desde localStorage
  useEffect(() => {
    const loadProducts = () => {
      try {
        const savedProducts = localStorage.getItem('products');
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          setProducts(parsedProducts);
        }
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setMessage({ text: 'Error al cargar productos', type: 'danger' });
      }
    };
    
    loadProducts();
  }, [show]);

  // Filtrar productos cuando cambia la búsqueda o la lista de productos
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredProducts(products);
    } else {
      const searchLower = search.toLowerCase();
      setFilteredProducts(
        products.filter(p => 
          p.name?.toLowerCase().includes(searchLower) || 
          p.category?.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [search, products]);

  // Guardar productos en localStorage
  const saveProductsToLocalStorage = (productsToSave) => {
    try {
      localStorage.setItem('products', JSON.stringify(productsToSave));
      
      // Forzar un evento de storage para notificar a otras pestañas
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error al guardar productos:', error);
      return false;
    }
  };

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
  const handleDeleteSelected = () => {
    setIsDeleting(true);
    try {
      // Filtrar productos para eliminar los seleccionados
      const updatedProducts = products.filter(p => !selectedProducts.includes(p.id));
      
      // Guardar en localStorage
      if (saveProductsToLocalStorage(updatedProducts)) {
        setProducts(updatedProducts);
        setMessage({ text: 'Productos eliminados correctamente', type: 'success' });
        setSelectedProducts([]);
      } else {
        setMessage({ text: 'Error al eliminar productos', type: 'danger' });
      }
    } catch (error) {
      console.error('Error al eliminar productos:', error);
      setMessage({ text: 'Error al eliminar productos', type: 'danger' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  // Agregar nuevo producto
  const handleAddProduct = () => {
    try {
      // Validar datos
      if (!newProduct.name.trim()) {
        setMessage({ text: 'El nombre del producto es obligatorio', type: 'warning' });
        return;
      }

      // Crear nuevo producto con ID único
      const productToAdd = {
        ...newProduct,
        id: uuidv4(),
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock) || 0,
        brand: 'GENERICA',
        tax: 'IVA(0%)',
        image: null
      };

      // Agregar a la lista de productos
      const updatedProducts = [...products, productToAdd];
      
      // Guardar en localStorage
      if (saveProductsToLocalStorage(updatedProducts)) {
        setProducts(updatedProducts);
        setMessage({ text: 'Producto agregado correctamente', type: 'success' });
        
        // Limpiar formulario
        setNewProduct({
          name: '',
          price: 0,
          category: 'General',
          stock: 0
        });
        setShowAddForm(false);
      } else {
        setMessage({ text: 'Error al agregar producto', type: 'danger' });
      }
    } catch (error) {
      console.error('Error al agregar producto:', error);
      setMessage({ text: 'Error al agregar producto', type: 'danger' });
    } finally {
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
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
        
        <div className="d-flex mb-3 justify-content-between">
          <div className="d-flex">
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
          <Button 
            variant="success" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancelar' : 'Nuevo Producto'}
          </Button>
        </div>
        
        {showAddForm && (
          <div className="mb-3 p-3 border rounded">
            <h5>Agregar Nuevo Producto</h5>
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
            <Form.Group className="mb-3">
              <Form.Label>Stock</Form.Label>
              <Form.Control
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
              />
            </Form.Group>
            <Button variant="primary" onClick={handleAddProduct}>
              Agregar Producto
            </Button>
          </div>
        )}
        
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
      </Modal.Footer>
    </Modal>
  );
};

export default ProductManagerSimple;