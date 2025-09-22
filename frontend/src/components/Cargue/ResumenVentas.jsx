import React, { useState, useEffect } from 'react';
import { Table, Form } from 'react-bootstrap';

const ResumenVentas = ({ datos, productos = [] }) => {
  const [filas, setFilas] = useState(Array(10).fill().map(() => ({
    concepto: '',
    descuentos: 0,
    nequi: 0,
    daviplata: 0
  })));

  const [baseCaja, setBaseCaja] = useState(0);

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `$${Math.round(num).toLocaleString()}`;
  };

  const handleInputChange = (index, campo, value) => {
    const newFilas = [...filas];
    if (campo === 'concepto') {
      newFilas[index][campo] = value;
    } else {
      const numValue = value.replace(/[^0-9]/g, '');
      newFilas[index][campo] = numValue ? parseInt(numValue) : 0;
    }
    setFilas(newFilas);
  };

  const calcularTotal = (campo) => {
    return filas.reduce((total, fila) => total + (fila[campo] || 0), 0);
  };

  const handleBaseCajaChange = (e) => {
    const value = e.target.value;
    const numValue = value.replace(/[^0-9]/g, '');
    setBaseCaja(numValue ? parseInt(numValue) : 0);
  };

  const calcularTotalDespacho = () => {
    return productos.reduce((total, producto) => {
      const neto = Number(producto.neto) || 0;
      return total + Math.round(neto);
    }, 0);
  };

  return (
    <div className="resumen-container">
      
      {/* Tabla de Pagos */}
      <div style={{ paddingRight: '15px' }}>
        <Table bordered className="resumen-pagos mb-3" style={{ minWidth: '500px', marginRight: '20px' }}>
        <thead className="table-header">
          <tr>
            <th style={{ width: '150px' }}>CONCEPTO</th>
            <th style={{ width: '120px', textAlign: 'center' }}>DESCUENTOS</th>
            <th style={{ width: '120px', textAlign: 'center' }}>NEQUI</th>
            <th style={{ width: '120px', textAlign: 'center' }}>DAVIPLATA</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i}>
              <td>
                <Form.Control 
                  type="text" 
                  value={fila.concepto}
                  onChange={(e) => handleInputChange(i, 'concepto', e.target.value)}
                />
              </td>
              <td>
                <Form.Control 
                  type="text" 
                  className="text-center"
                  value={fila.descuentos ? formatCurrency(fila.descuentos) : ''}
                  onChange={(e) => handleInputChange(i, 'descuentos', e.target.value)}
                />
              </td>
              <td>
                <Form.Control 
                  type="text" 
                  className="text-center"
                  value={fila.nequi ? formatCurrency(fila.nequi) : ''}
                  onChange={(e) => handleInputChange(i, 'nequi', e.target.value)}
                />
              </td>
              <td>
                <Form.Control 
                  type="text" 
                  className="text-center"
                  value={fila.daviplata ? formatCurrency(fila.daviplata) : ''}
                  onChange={(e) => handleInputChange(i, 'daviplata', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="fw-bold">TOTAL</td>
            <td className="text-center fw-bold">{formatCurrency(calcularTotal('descuentos'))}</td>
            <td className="text-center fw-bold">{formatCurrency(calcularTotal('nequi'))}</td>
            <td className="text-center fw-bold">{formatCurrency(calcularTotal('daviplata'))}</td>
          </tr>
        </tfoot>
        </Table>
      </div>

      {/* Resumen de Totales */}
      <div className="resumen-totales mt-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-bold">BASE CAJA</span>
          <Form.Control 
            type="text" 
            style={{ width: '120px' }}
            className="text-center"
            value={baseCaja ? formatCurrency(baseCaja) : ''}
            onChange={handleBaseCajaChange}
          />
        </div>
        
        <div className="bg-light p-2 mb-2">
          <strong>TOTAL DESPACHO:</strong>
          <div className="text-end">{formatCurrency(calcularTotalDespacho())}</div>
        </div>
        
        <div className="bg-lightpink p-2 mb-2">
          <strong>TOTAL PEDIDOS:</strong>
          <div className="text-end">{formatCurrency(datos.totalPedidos)}</div>
        </div>
        
        <div className="bg-light p-2 mb-2">
          <strong>TOTAL DCTOS:</strong>
          <div className="text-end">{formatCurrency(calcularTotal('descuentos'))}</div>
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