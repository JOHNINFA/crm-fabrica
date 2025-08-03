import React from 'react';
import { Table, Form } from 'react-bootstrap';

const ResumenVentas = ({ datos }) => {
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="resumen-container">
      
      {/* Tabla de Pagos */}
      <Table bordered className="resumen-pagos mb-3">
        <thead className="table-header">
          <tr>
            <th>CONCEPTO</th>
            <th>DESCUENTOS</th>
            <th>NEQUI</th>
            <th>DAVIPLATA</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(10)].map((_, i) => (
            <tr key={i}>
              <td><Form.Control type="text" /></td>
              <td><Form.Control type="text" /></td>
              <td><Form.Control type="text" /></td>
              <td><Form.Control type="text" /></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="fw-bold">TOTAL</td>
            <td className="text-end">$0</td>
            <td className="text-end">$0</td>
            <td className="text-end">$0</td>
          </tr>
        </tfoot>
      </Table>

      {/* Resumen de Totales */}
      <div className="resumen-totales mt-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-bold">BASE CAJA</span>
          <Form.Control type="text" style={{ width: '100px' }} />
        </div>
        
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