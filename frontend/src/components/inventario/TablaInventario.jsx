import React from 'react';
import { Table, Form, Button } from 'react-bootstrap';

const TablaInventario = ({ productos, onEditarClick, handleCantidadChange }) => {
  // Función para manejar el foco en el input
  const handleFocus = (e) => {
    // Si el valor es 0, seleccionar todo el texto para que se reemplace al escribir
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  return (
    <div className="table-container">
      <Table hover striped className="align-middle mb-0">
        <thead>
          <tr>
            <th scope="col" style={{ width: '60%' }}>Producto</th>
            <th scope="col" className="text-center" style={{ width: '20%' }}>Cantidad</th>
            <th scope="col" className="text-center" style={{ width: '20%' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto.id} className="product-row">
              <td className="product-name">{producto.nombre}</td>
              <td className="text-center">
                <Form.Control
                  type="number"
                  min="0"
                  value={producto.cantidad || 0}
                  onChange={(e) => handleCantidadChange(producto.id, Number.parseInt(e.target.value) || 0)}
                  onFocus={handleFocus}
                  className="quantity-input mx-auto"
                  aria-label={`Cantidad de ${producto.nombre}`}
                />
              </td>
              <td className="text-center">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => onEditarClick(producto)}
                  className="edit-button"
                  title={`Editar ${producto.nombre}`}
                >
                  <i className="bi bi-pencil me-1"></i>
                  Editar
                </Button>
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center py-4">
                <p className="text-muted">No hay productos disponibles</p>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default TablaInventario;