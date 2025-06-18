import React from 'react';
import { Button, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useProducts } from '../../context/ProductContext';

/**
 * Botón para recargar los productos desde el backend
 */
const ReloadButton = () => {
  const { loadProductsFromBackend } = useProducts();
  
  const handleReload = async () => {
    try {
      await loadProductsFromBackend();
      
      // Mostrar notificación
      const notification = document.createElement('div');
      notification.className = 'reload-notification';
      notification.textContent = 'Productos recargados desde el servidor';
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #28a745;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      
      document.body.appendChild(notification);
      
      // Eliminar notificación después de 3 segundos
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error("Error al recargar productos:", error);
      
      // Mostrar notificación de error
      const notification = document.createElement('div');
      notification.className = 'reload-notification';
      notification.textContent = 'Error al recargar productos';
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #dc3545;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      
      document.body.appendChild(notification);
      
      // Eliminar notificación después de 3 segundos
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };
  
  const tooltip = (
    <Tooltip id="reload-tooltip">
      Recargar productos desde el servidor
    </Tooltip>
  );
  
  return (
    <OverlayTrigger placement="bottom" overlay={tooltip}>
      <Button 
        variant="outline-success" 
        onClick={handleReload}
        style={{ minWidth: 40, minHeight: 40 }}
      >
        <span className="material-icons">refresh</span>
      </Button>
    </OverlayTrigger>
  );
};

export default ReloadButton;