import React from 'react';
import { Table, Form, Button } from 'react-bootstrap';
import { getExistenciasBadge } from '../../utils/inventarioUtils';

const TablaInventario = ({ productos, onEditarClick, handleCantidadChange }) => {
  return (
    <div className="table-responsive">
      <Table hover className="inventario-table">
        <thead className="table-light">
          <tr>
            <th>Nombre</th>
            <th className="text-center">Existencias</th>
            <th className="text-center">Categoría</th>
            <th className="text-center">Cantidad</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto.id}>
              <td className="align-middle">
                <div className="fw-medium">{producto.nombre}</div>
              </td>
              <td className="text-center align-middle">
                <span className={`badge ${getExistenciasBadge(producto.existencias)} rounded-pill`}>
                  {producto.existencias} und
                </span>
              </td>
              <td className="text-center align-middle">
                {producto.categoria || 'General'}
              </td>
              <td className="text-center align-middle">
                <Form.Control
                  type="number"
                  min="0"
                  value={producto.cantidad || 0}
                  onChange={(e) => handleCantidadChange(producto.id, Number.parseInt(e.target.value) || 0)}
                  className="cantidad-input"
                  placeholder="0"
                />
              </td>
              <td className="text-center align-middle">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => onEditarClick(producto)}
                >
                  <i className="bi bi-pencil-square" /> Editar
                </Button>
              </td>
            </tr>
          ))}
          {productos.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center py-4">
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