import React from 'react';
import { Table, Form, Button } from 'react-bootstrap';
import { getExistenciasBadge } from '../../utils/inventarioUtils';

const TablaMaquilas = ({ productos, onEditarClick, handleCantidadChange, handleLoteChange, handleFechaVencimientoChange }) => {
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
          <col className="lote-col" />
          <col className="vencimiento-col" />
        </colgroup>
        <thead className="table-light">
          <tr>
            <th className="nombre-col">Nombre</th>
            <th className="text-center existencias-col">Exist.</th>
            <th className="text-center cantidad-col">Cant.</th>
            <th className="text-center lote-col">Lote</th>
            <th className="text-center vencimiento-col">Vencimiento</th>
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
                  onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                  onFocus={handleFocus}
                  className="cantidad-input mx-auto"
                  style={{ maxWidth: '100%' }}
                  placeholder="0"
                />
              </td>
              
              <td className="text-center align-middle lote-col">
                <Form.Control
                  type="text"
                  value={producto.lote || ''}
                  onChange={(e) => handleLoteChange(producto.id, e.target.value)}
                  className="lote-input mx-auto"
                  style={{ maxWidth: '100%' }}
                  placeholder="Lote"
                />
              </td>
              
              <td className="text-center align-middle vencimiento-col">
                <Form.Control
                  type="date"
                  value={producto.fechaVencimiento || ''}
                  onChange={(e) => handleFechaVencimientoChange(producto.id, e.target.value)}
                  className="vencimiento-input mx-auto"
                  style={{ maxWidth: '100%' }}
                />
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

export default TablaMaquilas;