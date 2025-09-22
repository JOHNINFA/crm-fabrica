import React from 'react';
import { Table, Button } from 'react-bootstrap';
import '../../styles/TablaKardex.css';
import '../../styles/EditButtons.css';

const TablaInventario = ({ productos, onEditarClick, handleCantidadChange, productosGrabados = {}, yaSeGrabo = false }) => {
  const handleChange = (id, value) => handleCantidadChange(id, value);

  const handleEliminar = async (producto) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
      const utils = await import('../../utils/inventarioUtils');
      utils.eliminarProductoInventario(producto.id);
    }
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
          {productos?.length > 0 ? (
            productos.map((producto) => (
              <tr key={producto.id} className="product-row">
                <td className="fw-medium" style={{ color: '#1e293b' }}>
                  {producto.nombre}
                </td>
                <td className="text-center">
                  <div className="d-flex justify-content-center">
                    <input
                      type="number"
                      min="0"
                      value={producto.cantidad || 0}
                      onChange={(e) => handleChange(producto.id, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className={`quantity-input ${productosGrabados[producto.id] ? 'grabado' : ''} ${yaSeGrabo ? 'input-grabado' : ''}`}
                      disabled={productosGrabados[producto.id] || yaSeGrabo}
                      placeholder={yaSeGrabo ? "Grabado" : "0"}
                      aria-label={`Cantidad de ${producto.nombre}`}
                    />
                  </div>
                </td>
                <td className="text-center d-none d-md-table-cell">
                  <div className="d-flex justify-content-center gap-2">
                    <Button
                      variant="outline-primary"
                      onClick={() => onEditarClick(producto)}
                      className="edit-button"
                      title={`Editar ${producto.nombre}`}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </Button>

                    {producto.id > 39 && (
                      <Button
                        variant="outline-danger"
                        onClick={() => handleEliminar(producto)}
                        className="rounded-pill-sm"
                        style={{ backgroundColor: '#ffffff', color: '#dc2626', border: '1px solid #fecaca', boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '0.4rem 1rem', fontSize: '0.95rem', minWidth: '100px' }}
                        title={`Eliminar ${producto.nombre}`}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center py-4">
                <p className="text-muted">
                  {productos ? 'No hay productos disponibles' : 'Cargando productos...'}
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default TablaInventario;