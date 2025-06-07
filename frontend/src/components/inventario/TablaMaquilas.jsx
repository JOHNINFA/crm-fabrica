import React from 'react';
import { Table, Form, Button } from 'react-bootstrap';

const TablaMaquilas = ({ productos, onEditarClick, handleCantidadChange, handleLoteChange, handleFechaVencimientoChange }) => {
  // Función para manejar el foco en el input
  const handleFocus = (e) => {
    // Si el valor es 0, seleccionar todo el texto para que se reemplace al escribir
    if (e.target.value === '0') {
      e.target.select();
    }
  };

  // Lista de productos permitidos en Maquilas
  const productosMaquilas = [
    'MUTE BOYACENSE',
    'ENVUELTO DE MAIZ X 5 UND',
    'AREPA BOYACENSE X10',
    'AREPA BOYACENSE X5',
    'AREPA DE CHOCLO CON QUESO PEQUEÑA',
    'AREPA DE CHOCLO CON QUESO GRANDE',
    'AREPA DE CHOCLO-CORRIENTE',
    'ALMOJABANAS X5',
    'ALMOJABANAS X10'
  ];
  
  // Filtrar solo los productos permitidos
  const productosFiltrados = productos.filter(producto => 
    productosMaquilas.includes(producto.nombre)
  );

  return (
    <div className="table-container">
      <Table hover striped className="align-middle mb-0">
        <thead>
          <tr>
            <th scope="col" style={{ width: '40%' }}>Producto</th>
            <th scope="col" className="text-center" style={{ width: '20%' }}>Cantidad</th>
            <th scope="col" className="text-center" style={{ width: '20%' }}>Lote</th>
            <th scope="col" className="text-center" style={{ width: '20%' }}>Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((producto) => (
            <tr key={producto.id} className="product-row">
              <td className="product-name">{producto.nombre}</td>
              <td className="text-center">
                <Form.Control
                  type="number"
                  min="0"
                  value={producto.cantidad || 0}
                  onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                  onFocus={handleFocus}
                  className="quantity-input mx-auto"
                  aria-label={`Cantidad de ${producto.nombre}`}
                />
              </td>
              <td className="text-center">
                <Form.Control
                  type="text"
                  value={producto.lote || ''}
                  onChange={(e) => handleLoteChange(producto.id, e.target.value)}
                  className="lote-input mx-auto"
                  style={{ maxWidth: '100%' }}
                  placeholder="Lote"
                />
              </td>
              <td className="text-center">
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
          {productosFiltrados.length === 0 && (
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

export default TablaMaquilas;
