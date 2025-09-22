import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Alert, Spinner } from 'react-bootstrap';
import { productoService } from '../../services/api';

/**
 * Componente para ver directamente los productos en la base de datos
 * Sin filtros ni modificaciones
 */
const DatabaseViewer = ({ show, onHide }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar productos directamente desde el backend
  const loadProductsFromBackend = async () => {
    setLoading(true);
    setError('');
    
    try {
      const backendProducts = await productoService.getAll();
      
      if (backendProducts && !backendProducts.error) {
        setProducts(backendProducts);
        console.log("Productos cargados directamente desde backend:", backendProducts.length);
      } else {
        setError('No se pudieron cargar los productos desde el backend');
        console.error('Error en respuesta del backend:', backendProducts);
      }
    } catch (error) {
      setError('Error al conectar con el backend');
      console.error('Error al cargar productos desde backend:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos cuando se muestra el modal
  useEffect(() => {
    if (show) {
      loadProductsFromBackend();
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Productos en la Base de Datos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}
        
        <div className="mb-3">
          <Button 
            variant="primary" 
            onClick={loadProductsFromBackend}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Cargando...
              </>
            ) : (
              'Recargar Productos'
            )}
          </Button>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2">Cargando productos desde la base de datos...</p>
            </div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map(product => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.nombre}</td>
                      <td>{product.categoria_nombre}</td>
                      <td>${product.precio}</td>
                      <td>{product.stock_total}</td>
                      <td>{product.activo ? 'Sí' : 'No'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      {error ? 'Error al cargar productos' : 'No hay productos en la base de datos'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>
        
        <div className="mt-3">
          <p><strong>Total de productos en la base de datos:</strong> {products.length}</p>
          <p><strong>Productos activos:</strong> {products.filter(p => p.activo).length}</p>
          <p><strong>Productos inactivos:</strong> {products.filter(p => !p.activo).length}</p>
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

export default DatabaseViewer;