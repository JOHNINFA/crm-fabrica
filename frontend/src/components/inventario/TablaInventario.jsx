import React from 'react';
import { Table, Form, Button } from 'react-bootstrap';
import { getExistenciasBadge } from '../../utils/inventarioUtils';

const TablaInventario = ({ productos, onEditarClick, handleCantidadChange }) => {
  // Función para manejar el foco en el input
  const handleFocus = (e) => {
    // Si el valor es 0, seleccionar todo el texto para que se reemplace al escribir
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  return (
    <div className="table-responsive">
      <Table hover className="inventario-table">
        <colgroup>
          <col className="nombre-col" />
          <col className="existencias-col" />
          <col className="cantidad-col" />
          <col className="acciones-col" />
        </colgroup>
        <thead className="table-light">
          <tr>
            <th className="nombre-col">Nombre</th>
            <th className="text-center existencias-col">Exist.</th>
            <th className="text-center cantidad-col">Cant.</th>
            <th className="text-center acciones-col">Acc.</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto.id}>
              <td className="align-middle nombre-col">
                <div className="fw-medium nombre-producto">
                  {producto.nombre}
                </div>
              </td>
              <td className="text-center align-middle existencias-col">
                <span className={`badge ${getExistenciasBadge(producto.existencias)} rounded-pill existencias-badge`}>
                  {producto.existencias}&nbsp;und
                </span>
              </td>

              <td className="text-center align-middle cantidad-col">
                <Form.Control
                  type="number"
                  min="0"
                  value={producto.cantidad || 0}
                  onChange={(e) => handleCantidadChange(producto.id, Number.parseInt(e.target.value) || 0)}
                  onFocus={handleFocus}
                  className="cantidad-input mx-auto"
                  style={{ maxWidth: '100%' }}
                  placeholder="0"
                />
              </td>
              <td className="text-center align-middle acciones-col">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => onEditarClick(producto)}
                  className="btn-xs-custom"
                >
                  <i className="bi bi-pencil-square"></i> <span className="btn-text">Editar</span>
                </Button>
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center py-4">
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