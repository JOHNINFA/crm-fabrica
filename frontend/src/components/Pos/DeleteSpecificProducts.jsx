import React, { useState } from 'react';
import { Button, Modal, Alert, Spinner } from 'react-bootstrap';
import { productoService } from '../../services/api';

/**
 * Componente para eliminar productos específicos de la base de datos
 */
const DeleteSpecificProducts = ({ show, onHide }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [deletedProducts, setDeletedProducts] = useState([]);

  // Productos a eliminar
  const productsToDelete = [
    { name: 'AREPA TIPO OBLEA', category: 'Arepas' },
    { name: 'AREPA TIPO PINCHO', category: 'Arepas' },
    { name: 'AREPA MEDIANA', category: 'Arepas' }
  ];

  // Función para eliminar productos
  const handleDeleteProducts = async () => {
    setIsDeleting(true);
    setMessage({ text: 'Buscando productos para eliminar...', type: 'info' });
    setDeletedProducts([]);
    
    try {
      // Obtener todos los productos
      const allProducts = await productoService.getAll();
      
      if (!allProducts || allProducts.error) {
        setMessage({ text: 'Error al obtener productos', type: 'danger' });
        setIsDeleting(false);
        return;
      }
      
      // Encontrar los productos a eliminar
      const productsToRemove = allProducts.filter(product => 
        productsToDelete.some(p => 
          product.nombre === p.name && product.categoria_nombre === p.category
        )
      );
      
      if (productsToRemove.length === 0) {
        setMessage({ text: 'No se encontraron los productos especificados', type: 'warning' });
        setIsDeleting(false);
        return;
      }
      
      setMessage({ text: `Se encontraron ${productsToRemove.length} productos para eliminar`, type: 'info' });
      
      // Eliminar cada producto
      const deleted = [];
      for (const product of productsToRemove) {
        try {
          // Marcar como inactivo en lugar de eliminar físicamente
          await productoService.update(product.id, { activo: false });
          deleted.push(product);
        } catch (error) {
          console.error(`Error al eliminar producto ${product.nombre}:`, error);
        }
      }
      
      setDeletedProducts(deleted);
      
      // Actualizar localStorage para mantener sincronizado
      const savedProductsStr = localStorage.getItem('products');
      if (savedProductsStr) {
        const savedProducts = JSON.parse(savedProductsStr);
        
        // Filtrar productos eliminados
        const updatedProducts = savedProducts.filter(product => 
          !productsToDelete.some(p => 
            product.name === p.name && product.category === p.category
          )
        );
        
        // Guardar productos actualizados
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        
        // Forzar actualización
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('productosUpdated'));
      }
      
      setMessage({ 
        text: `${deleted.length} productos eliminados correctamente`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error al eliminar productos:', error);
      setMessage({ text: 'Error al eliminar productos', type: 'danger' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Eliminar Productos Específicos</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {message.text && (
          <Alert variant={message.type}>
            {message.text}
          </Alert>
        )}
        
        <p>Este proceso eliminará los siguientes productos de la base de datos:</p>
        
        <ul>
          {productsToDelete.map((product, index) => (
            <li key={index}>
              <strong>{product.name}</strong> (Categoría: {product.category})
            </li>
          ))}
        </ul>
        
        {deletedProducts.length > 0 && (
          <div className="mt-3">
            <h5>Productos eliminados:</h5>
            <ul>
              {deletedProducts.map((product, index) => (
                <li key={index}>
                  {product.nombre} (ID: {product.id})
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDeleteProducts}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Eliminando...
            </>
          ) : (
            'Eliminar Productos'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteSpecificProducts;