/**
 * Componente de diagnóstico para verificar la sincronización entre POS e Inventario
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Alert, Badge } from 'react-bootstrap';
import { checkProductSync, syncInventoryToPOS, syncPOSToInventory } from '../../utils/syncInventoryToPOS';

const SyncDiagnostic = ({ show, onHide }) => {
  const [diagnosticData, setDiagnosticData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Ejecutar diagnóstico
  const runDiagnostic = () => {
    setLoading(true);
    try {
      // Obtener productos de ambos módulos
      const posProductsStr = localStorage.getItem('products');
      const inventoryProductsStr = localStorage.getItem('productos');
      
      if (!posProductsStr || !inventoryProductsStr) {
        setMessage({ text: 'No se encontraron datos en uno de los módulos', type: 'warning' });
        setLoading(false);
        return;
      }
      
      const posProducts = JSON.parse(posProductsStr);
      const inventoryProducts = JSON.parse(inventoryProductsStr);
      
      // Crear lista de todos los productos únicos
      const allProductIds = [...new Set([
        ...posProducts.map(p => p.id),
        ...inventoryProducts.map(p => p.id)
      ])];
      
      // Verificar sincronización para cada producto
      const diagnostic = allProductIds.map(id => {
        const posProduct = posProducts.find(p => p.id === id);
        const inventoryProduct = inventoryProducts.find(p => p.id === id);
        const syncInfo = checkProductSync(id);
        
        return {
          id,
          posProduct,
          inventoryProduct,
          ...syncInfo
        };
      });
      
      setDiagnosticData(diagnostic);
      setMessage({ text: `Diagnóstico completado para ${diagnostic.length} productos`, type: 'info' });
      
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setMessage({ text: 'Error al ejecutar diagnóstico', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };
  
  // Sincronizar desde inventario a POS
  const handleSyncInventoryToPOS = async () => {
    try {
      const inventoryProductsStr = localStorage.getItem('productos');
      if (inventoryProductsStr) {
        const inventoryProducts = JSON.parse(inventoryProductsStr);
        const success = syncInventoryToPOS(inventoryProducts);
        
        if (success) {
          setMessage({ text: 'Sincronización de Inventario → POS completada', type: 'success' });
          runDiagnostic(); // Actualizar diagnóstico
        } else {
          setMessage({ text: 'Error en sincronización de Inventario → POS', type: 'danger' });
        }
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      setMessage({ text: 'Error en sincronización', type: 'danger' });
    }
  };
  
  // Sincronizar desde POS a inventario
  const handleSyncPOSToInventory = async () => {
    try {
      const posProductsStr = localStorage.getItem('products');
      if (posProductsStr) {
        const posProducts = JSON.parse(posProductsStr);
        const success = syncPOSToInventory(posProducts);
        
        if (success) {
          setMessage({ text: 'Sincronización de POS → Inventario completada', type: 'success' });
          runDiagnostic(); // Actualizar diagnóstico
        } else {
          setMessage({ text: 'Error en sincronización de POS → Inventario', type: 'danger' });
        }
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      setMessage({ text: 'Error en sincronización', type: 'danger' });
    }
  };
  
  // Ejecutar diagnóstico al abrir el modal
  useEffect(() => {
    if (show) {
      runDiagnostic();
    }
  }, [show]);
  
  // Limpiar mensaje después de 3 segundos
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Modal show={show} onHide={onHide} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Diagnóstico de Sincronización POS ↔ Inventario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message.text && (
          <Alert variant={message.type} className="mb-3">
            {message.text}
          </Alert>
        )}
        
        <div className="d-flex gap-2 mb-3">
          <Button 
            variant="outline-primary" 
            onClick={runDiagnostic}
            disabled={loading}
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
          </Button>
          <Button 
            variant="success" 
            onClick={handleSyncInventoryToPOS}
          >
            Inventario → POS
          </Button>
          <Button 
            variant="info" 
            onClick={handleSyncPOSToInventory}
          >
            POS → Inventario
          </Button>
        </div>
        
        {diagnosticData.length > 0 && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre POS</th>
                  <th>Nombre Inventario</th>
                  <th>Stock POS</th>
                  <th>Stock Inventario</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticData.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.posProduct?.name || <Badge bg="warning">No existe</Badge>}</td>
                    <td>{item.inventoryProduct?.nombre || <Badge bg="warning">No existe</Badge>}</td>
                    <td>
                      <Badge bg={item.stockMatch ? 'success' : 'danger'}>
                        {item.posProduct?.stock ?? 'N/A'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={item.stockMatch ? 'success' : 'danger'}>
                        {item.inventoryProduct?.existencias ?? 'N/A'}
                      </Badge>
                    </td>
                    <td>
                      {item.synced ? (
                        <Badge bg="success">Sincronizado</Badge>
                      ) : (
                        <Badge bg="danger">Desincronizado</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
        
        {diagnosticData.length === 0 && !loading && (
          <div className="text-center py-4">
            <p className="text-muted">No hay datos para mostrar. Ejecuta el diagnóstico.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SyncDiagnostic;