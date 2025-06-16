import React from 'react';
import { Table, Form, Button } from 'react-bootstrap';
import '../../styles/TablaKardex.css';

const TablaInventario = ({ productos, onEditarClick, handleCantidadChange }) => {
  // Función para manejar el cambio de cantidad localmente
  const handleChange = (id, value) => {
    handleCantidadChange(id, value);
  };

  return (
    <div className="table-container">
      <Table className="align-middle mb-0 table-kardex">
        <thead>
          <tr>
            <th scope="col" style={{ width: '60%' }}>Producto</th>
            <th scope="col" className="text-center" style={{ width: '20%' }}>Cantidad</th>
            <th scope="col" className="text-center d-none d-md-table-cell" style={{ width: '20%' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos && productos.length > 0 ? (
            productos.map((producto) => (
              <tr key={producto.id} className="product-row">
                <td className="fw-medium" style={{color: '#1e293b'}}>
                  {producto.nombre}
                </td>
                <td className="text-center">
                  <div className="d-flex justify-content-center">
                    <input
                      type="number"
                      min="0"
                      defaultValue="0"
                      onChange={(e) => handleChange(producto.id, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="quantity-input"
                      aria-label={`Cantidad de ${producto.nombre}`}
                    />
                  </div>
                </td>
                <td className="text-center d-none d-md-table-cell">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onEditarClick(producto)}
                    className="rounded-pill-sm"
                    style={{backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe'}}
                    title={`Editar ${producto.nombre}`}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Editar
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center py-4">
                <p className="text-muted">Cargando productos...</p>
              </td>
            </tr>
          )}
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