import React from 'react';
import { Table } from 'react-bootstrap';

const ResumenVentas = ({ datos }) => {
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="resumen-container">
      <h5 className="mb-3">Resumen de Ventas</h5>
      
      {/* Tabla de Pagos */}
      <Table bordered className="resumen-pagos mb-3">
        <thead className="table-header">
          <tr>
            <th>FORMA DE PAGO</th>
            <th>VALOR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>EFECTIVO</td>
            <td className="text-end">{formatCurrency(datos.totalEfectivo)}</td>
          </tr>
          <tr>
            <td>TARJETA</td>
            <td className="text-end">$0</td>
          </tr>
          <tr>
            <td>TRANSFERENCIA</td>
            <td className="text-end">$0</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td><strong>TOTAL</strong></td>
            <td className="text-end"><strong>{formatCurrency(datos.totalEfectivo)}</strong></td>
          </tr>
        </tfoot>
      </Table>

      {/* Resumen de Totales */}
      <div className="resumen-totales">
        <div className="bg-light p-2 mb-2">
          <strong>TOTAL DESPACHO:</strong>
          <div className="text-end">{formatCurrency(datos.totalDespacho)}</div>
        </div>
        
        <div className="bg-lightpink p-2 mb-2">
          <strong>TOTAL PEDIDOS:</strong>
          <div className="text-end">{formatCurrency(datos.totalPedidos)}</div>
        </div>
        
        <div className="bg-light p-2 mb-2">
          <strong>TOTAL DCTOS:</strong>
          <div className="text-end">{formatCurrency(datos.totalDctos)}</div>
        </div>
        
        <div className="bg-lightgreen p-2 mb-2">
          <strong>VENTA:</strong>
          <div className="text-end">{formatCurrency(datos.venta)}</div>
        </div>
        
        <div className="bg-light p-2">
          <strong>TOTAL EFECTIVO:</strong>
          <div className="text-end">{formatCurrency(datos.totalEfectivo)}</div>
        </div>
      </div>
    </div>
  );
};

export default ResumenVentas;