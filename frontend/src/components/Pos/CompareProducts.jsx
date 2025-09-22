import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Alert, Spinner, Form } from 'react-bootstrap';
import { productoService } from '../../services/api';

/**
 * Componente para comparar productos en localStorage vs base de datos
 */
const CompareProducts = ({ show, onHide }) => {
  const [localProducts, setLocalProducts] = useState([]);
  const [backendProducts, setBackendProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [differences, setDifferences] = useState([]);

  // Cargar productos de ambas fuentes
  const loadProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Cargar productos de localStorage
      const savedProductsStr = localStorage.getItem('products');
      const savedProducts = savedProductsStr ? JSON.parse(savedProductsStr) : [];
      setLocalProducts(savedProducts);
      
      // Cargar productos eliminados
      const deletedIdsStr = localStorage.getItem('deletedProductIds');
      const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
      
      // Cargar productos del backend
      const backendProductsData = await productoService.getAll();
      
      if (backendProductsData && !backendProductsData.error) {
        setBackendProducts(backendProductsData);
        
        // Encontrar diferencias
        const diffs = [];
        
        // Productos en backend que no están en localStorage
        backendProductsData.forEach(backendProduct => {
          const localProduct = savedProducts.find(p => p.id === backendProduct.id);
          
          if (!localProduct) {
            diffs.push({
              id: backendProduct.id,
              name: backendProduct.nombre,
              type: 'Solo en Backend',
              deleted: deletedIds.includes(backendProduct.id)
            });
          }
        });
        
        // Productos en localStorage que no están en backend
        savedProducts.forEach(localProduct => {
          const backendProduct = backendProductsData.find(p => p.id === localProduct.id);
          
          if (!backendProduct) {
            diffs.push({
              id: localProduct.id,
              name: localProduct.name,
              type: 'Solo en Local',
              deleted: deletedIds.includes(localProduct.id)
            });
          }
        });
        
        setDifferences(diffs);
      } else {
        setError('No se pudieron cargar los productos desde el backend');
      }
    } catch (error) {
      setError('Error al cargar productos');
      console.error('Error al comparar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos cuando se muestra el modal
  useEffect(() => {
    if (show) {
      loadProducts();
    }
  }, [show]);

  // Sincronizar productos locales con el backend
  const syncLocalToBackend = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Obtener productos eliminados
      const deletedIdsStr = localStorage.getItem('deletedProductIds');
      const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
      
      // Para cada producto local, sincronizar con el backend
      for (const product of localProducts) {
        if (deletedIds.includes(product.id)) {
          // Si está en la lista de eliminados, marcarlo como inactivo en el backend
          await productoService.update(product.id, { activo: false });
        } else {
          // Si no está eliminado, actualizarlo o crearlo en el backend
          const backendProduct = backendProducts.find(p => p.id === product.id);
          
          if (backendProduct) {
            // Actualizar producto existente
            await productoService.update(product.id, {
              nombre: product.name,
              precio: product.price,
              precio_compra: product.purchasePrice || 0,
              stock_total: product.stock || 0,
              categoria: product.category,
              marca: product.brand || 'GENERICA',
              impuesto: product.tax || 'IVA(0%)',
              activo: true
            });
          } else {
            // Crear nuevo producto
            await productoService.create({
              nombre: product.name,
              precio: product.price,
              precio_compra: product.purchasePrice || 0,
              stock_total: product.stock || 0,
              categoria: product.category,
              marca: product.brand || 'GENERICA',
              impuesto: product.tax || 'IVA(0%)',
              activo: true
            });
          }
        }
      }
      
      // Recargar productos para ver los cambios
      await loadProducts();
      
      setError('');
      alert('Sincronización completada');
    } catch (error) {
      setError('Error al sincronizar productos');
      console.error('Error al sincronizar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Comparar Productos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}
        
        <div className="mb-3 d-flex justify-content-between">
          <Button 
            variant="primary" 
            onClick={loadProducts}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Recargar Productos'}
          </Button>
          
          <Button 
            variant="success" 
            onClick={syncLocalToBackend}
            disabled={loading}
          >
            Sincronizar Local → Backend
          </Button>
        </div>
        
        <div className="mb-3">
          <Form.Check 
            type="checkbox"
            id="show-differences"
            label="Mostrar solo diferencias"
            checked={showOnlyDifferences}
            onChange={(e) => setShowOnlyDifferences(e.target.checked)}
          />
        </div>
        
        <div className="mb-3">
          <h5>Resumen</h5>
          <p><strong>Productos en localStorage:</strong> {localProducts.length}</p>
          <p><strong>Productos en backend:</strong> {backendProducts.length}</p>
          <p><strong>Diferencias encontradas:</strong> {differences.length}</p>
        </div>
        
        {showOnlyDifferences ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <h5>Diferencias</h5>
            {loading ? (
              <div className="text-center p-4">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </Spinner>
              </div>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Eliminado</th>
                  </tr>
                </thead>
                <tbody>
                  {differences.length > 0 ? (
                    differences.map(diff => (
                      <tr key={diff.id}>
                        <td>{diff.id}</td>
                        <td>{diff.name}</td>
                        <td>{diff.type}</td>
                        <td>{diff.deleted ? 'Sí' : 'No'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No se encontraron diferencias
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CompareProducts;