import React from 'react';
import { Table } from 'react-bootstrap';

const TablaProductos = ({ productos, onActualizarProducto }) => {
  const handleInputChange = (id, campo, valor) => {
    onActualizarProducto(id, campo, valor);
  };

  const handleCheckboxChange = (id, campo, checked) => {
    onActualizarProducto(id, campo, checked);
  };

  return (
    <Table bordered hover responsive className="tabla-productos">
      <thead className="table-header">
        <tr>
          <th>V</th>
          <th>D</th>
          <th>PRODUCTOS</th>
          <th>CANTIDAD</th>
          <th>DCTOS.</th>
          <th>ADICIONAL</th>
          <th>DEVOLUCIONES</th>
          <th>VENCIDAS</th>
          <th>TOTAL</th>
          <th>VALOR</th>
          <th>NETO</th>
        </tr>
      </thead>
      <tbody>
        {productos.map((p) => (
          <tr key={p.id} className="table-row-green">
            <td>
              <input 
                type="checkbox" 
                checked={p.vendedor || false}
                onChange={(e) => handleCheckboxChange(p.id, 'vendedor', e.target.checked)}
              />
            </td>
            <td>
              <input 
                type="checkbox" 
                checked={p.despachador || false}
                onChange={(e) => handleCheckboxChange(p.id, 'despachador', e.target.checked)}
              />
            </td>
            <td className="producto-nombre">{p.producto}</td>
            <td>
              <input 
                type="number" 
                value={p.cantidad || 0}
                onChange={(e) => handleInputChange(p.id, 'cantidad', e.target.value)}
                className="form-control form-control-sm text-center"
                min="0"
              />
            </td>
            <td>
              <input 
                type="number" 
                value={p.dctos || 0}
                onChange={(e) => handleInputChange(p.id, 'dctos', e.target.value)}
                className="form-control form-control-sm text-center"
                min="0"
              />
            </td>
            <td>
              <input 
                type="number" 
                value={p.adicional || 0}
                onChange={(e) => handleInputChange(p.id, 'adicional', e.target.value)}
                className="form-control form-control-sm text-center"
                min="0"
              />
            </td>
            <td>
              <input 
                type="number" 
                value={p.devoluciones || 0}
                onChange={(e) => handleInputChange(p.id, 'devoluciones', e.target.value)}
                className="form-control form-control-sm text-center"
                min="0"
              />
            </td>
            <td>
              <input 
                type="number" 
                value={p.vencidas || 0}
                onChange={(e) => handleInputChange(p.id, 'vencidas', e.target.value)}
                className="form-control form-control-sm text-center"
                min="0"
              />
            </td>
            <td className="text-center total-cell">{p.total || 0}</td>
            <td className="text-end valor-cell">
              {p.valor ? `$${p.valor.toLocaleString()}` : ''}
            </td>
            <td className="text-end neto-cell">
              {p.neto ? `$${p.neto.toLocaleString()}` : '$0'}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TablaProductos;