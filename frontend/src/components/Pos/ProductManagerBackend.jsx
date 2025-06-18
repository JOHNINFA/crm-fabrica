import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';
import { productoService, categoriaService } from '../../services/api';

/**
 * Componente para gestionar productos directamente con el backend
 * Esta versión sincroniza todos los cambios con la base de datos
 */
const ProductManagerBackend = ({ show, onHide }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    category: 'General',
    stock: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Cargar productos desde el backend
  const loadProducts = async () => {
    setIsLoading(true);
    setMessage({ text: 'Cargando productos...', type: 'info' });
    
    try {
      // Cargar productos desde el backend
      const backendProducts = await productoService.getAll();
      
      if (backendProducts && backendProducts.length > 0 && !backendProducts.error) {
        // Convertir productos del backend al formato local
        const formattedProducts = backendProducts.map(product => ({
          id: product.id,
          name: product.nombre,
          price: parseFloat(product.precio) || 0,
          purchasePrice: parseFloat(product.precio_compra) || 0,
          stock: product.stock_total || 0,
          category: product.categoria_nombre || 'General',
          brand: product.marca || 'GENERICA',
          tax: product.impuesto || 'IVA(0%)',
          image: product.imagen ? `${product.imagen}?${Date.now()}` : null,
          activo: product.activo
        }));
        
        // Filtrar productos activos
        const activeProducts = formattedProducts.filter(p => p.activo !== false);
        
        setProducts(activeProducts);
        
        // Guardar en localStorage para mantener sincronizado
        localStorage.setItem('products', JSON.stringify(activeProducts));
        
        setMessage({ text: `${activeProducts.length} productos cargados correctamente`, type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: 'No se pudieron cargar los productos desde el backend', type: 'warning' });
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setMessage({ text: 'Error al cargar productos', type: 'danger' });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar productos cuando se muestra el modal
  useEffect(() => {
    if (show) {
      loadProducts();
    }
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
    setMessage({ text: 'Eliminando productos...', type: 'info' });
    
    try {
      // Eliminar cada producto seleccionado en el backend
      for (const productId of selectedProducts) {
        await productoService.update(productId, { activo: false });
      }
      
      // Actualizar la lista local
      const updatedProducts = products.filter(p => !selectedProducts.includes(p.id));
      setProducts(updatedProducts);
      
      // Actualizar localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      setMessage({ text: 'Productos eliminados correctamente', type: 'success' });
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error al eliminar productos:', error);
      setMessage({ text: 'Error al eliminar productos', type: 'danger' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  // Agregar nuevo producto
  const handleAddProduct = async () => {
    try {
      // Validar datos
      if (!newProduct.name.trim()) {
        setMessage({ text: 'El nombre del producto es obligatorio', type: 'warning' });
        return;
      }

      setMessage({ text: 'Agregando producto...', type: 'info' });
      
      // Crear categoría si no existe
      try {
        await categoriaService.create(newProduct.category);
      } catch (catError) {
        console.log('Error o categoría ya existe:', catError);
      }
      
      // Crear producto en el backend
      const backendData = {
        nombre: newProduct.name.trim(),
        precio: parseFloat(newProduct.price) || 0,
        precio_compra: 0,
        stock_total: parseInt(newProduct.stock) || 0,
        categoria: newProduct.category,
        marca: 'GENERICA',
        impuesto: 'IVA(0%)',
        activo: true
      };
      
      const createdProduct = await productoService.create(backendData);
      
      // Crear producto en formato local
      const productToAdd = {
        id: createdProduct.id || uuidv4(),
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price) || 0,
        stock: parseInt(newProduct.stock) || 0,
        category: newProduct.category,
        brand: 'GENERICA',
        tax: 'IVA(0%)',
        image: null,
        activo: true
      };

      // Agregar a la lista de productos
      const updatedProducts = [...products, productToAdd];
      setProducts(updatedProducts);
      
      // Actualizar localStorage
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      
      setMessage({ text: 'Producto agregado correctamente', type: 'success' });
      
      // Limpiar formulario
      setNewProduct({
        name: '',
        price: 0,
        category: 'General',
        stock: 0
      });
      setShowAddForm(false);
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
        <Modal.Title>Gestionar Productos (Sincronizado con Backend)</Modal.Title>
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
          <div>
            <Button 
              variant="outline-secondary" 
              onClick={loadProducts}
              disabled={isLoading}
              className="me-2"
            >
              <i className="bi bi-arrow-clockwise"></i> Recargar
            </Button>
            <Button 
              variant="success" 
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'Cancelar' : 'Nuevo Producto'}
            </Button>
          </div>
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
          {isLoading ? (
            <div className="text-center p-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2">Cargando productos...</p>
            </div>
          ) : (
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
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      {isLoading ? 'Cargando productos...' : 'No se encontraron productos'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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

export default ProductManagerBackend;