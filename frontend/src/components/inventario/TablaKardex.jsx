import React from 'react';
import { Table, Badge } from 'react-bootstrap';

const TablaKardex = ({ movimientos, productos }) => {
  // Función para obtener las existencias actuales de un producto
  const getExistencias = (nombreProducto) => {
    const producto = productos.find(p => p.nombre === nombreProducto);
    return producto ? producto.existencias : 0;
  };

  return (
    <div className="table-responsive">
      <Table size="sm" className="mb-0">
        <thead className="table-light">
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Producto</th>
            <th>Existencias</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Lote</th>
            <th>Vencimiento</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((movimiento) => (
            <tr key={movimiento.id}>
              <td className="text-muted small">{movimiento.fecha}</td>
              <td className="text-muted small">{movimiento.hora || '12:00'}</td>
              <td className="fw-medium">{movimiento.producto}</td>
              <td className="fw-bold">{getExistencias(movimiento.producto)} und</td>
              <td>
                <Badge
                  bg={movimiento.tipo === 'Entrada' ? 'success' : 'warning'}
                  className="text-capitalize"
                >
                  {movimiento.tipo}
                </Badge>
              </td>
              <td className="fw-bold">{movimiento.cantidad} und</td>
              <td>{movimiento.lote || '-'}</td>
              <td>{movimiento.fechaVencimiento || '-'}</td>
              <td>
                <small className="text-muted">
                  <i className="bi bi-person" /> {movimiento.usuario}
                </small>
              </td>
            </tr>
          ))}
          {movimientos.length === 0 && (
            <tr>
              <td colSpan="9" className="text-center py-4">
                <p className="text-muted">No hay movimientos registrados</p>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default TablaKardex;