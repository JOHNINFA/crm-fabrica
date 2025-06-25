import React from 'react';
import { Table, Form } from 'react-bootstrap';
import '../../styles/TablaKardex.css';
import '../../styles/InventarioMaquilas.css';
import '../../styles/EditButtons.css';
import productosMaquilasData from '../../data/productosMaquilas';

// Componente para la fila de producto
const FilaProducto = ({ producto, onEditarClick, handleCantidadChange, handleLoteChange, handleFechaVencimientoChange }) => {
  // Función para manejar el foco en el input
  const handleFocus = (e) => {
    // Si el valor es 0, seleccionar todo el texto para que se reemplace al escribir
    if (e.target.value === '0') {
      e.target.select();
    }
  };
  
  // Función para mostrar existencias (no utilizada, se muestra el valor directo)
  const mostrarExistencias = (existencias) => {
    return `${existencias} und`;
  };

  // Estilos comunes para inputs
  const inputStyle = {
    width: '100%',
    minWidth: '150px',
    fontSize: '0.9rem'
  };

  return (
    <tr className="product-row">
      <td className="fw-medium" style={{color: '#1e293b'}}>{producto.nombre}</td>
      <td className="text-center">
        <div className="d-flex justify-content-center">
          <Form.Control
            type="number"
            min="0"
            value={producto.cantidad || 0}
            onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
            onFocus={handleFocus}
            className="quantity-input"
            style={{color: '#1e293b'}}
            aria-label={`Cantidad de ${producto.nombre}`}
          />
        </div>
      </td>
      <td className="text-center">
        <div className="d-flex justify-content-center">
          <Form.Control
            type="text"
            value={producto.lote || ''}
            onChange={(e) => handleLoteChange(producto.id, e.target.value)}
            className="quantity-input lote-input"
            style={{...inputStyle, color: '#1e293b'}}
            placeholder="Lote"
          />
        </div>
      </td>
      <td className="text-center">
        <div className="d-flex justify-content-center">
          <Form.Control
            type="date"
            value={producto.fechaVencimiento || ''}
            onChange={(e) => handleFechaVencimientoChange(producto.id, e.target.value)}
            className="quantity-input vencimiento-input"
            style={{...inputStyle, color: '#1e293b'}}
          />
        </div>
      </td>
      <td className="text-center d-none d-md-table-cell">
        <button
          className="btn edit-button"
          onClick={() => onEditarClick(producto)}
          title={`Editar ${producto.nombre}`}
        >
          <i className="bi bi-pencil me-1"></i>
          Editar
        </button>
      </td>
    </tr>
  );
};

// Componente principal
const TablaMaquilas = ({ productos, onEditarClick, handleCantidadChange, handleLoteChange, handleFechaVencimientoChange }) => {
  // Lista de nombres de productos permitidos en Maquilas
  const nombresMaquilas = productosMaquilasData.map(producto => producto.nombre);
  
  // Filtrar solo los productos permitidos
  const productosFiltrados = productos.filter(producto => 
    nombresMaquilas.includes(producto.nombre)
  );

  // Definición de anchos de columnas
  const columnWidths = {
    producto: '20%',
    cantidad: '15%',
    lote: '25%',
    vencimiento: '25%',
    acciones: '15%'
  };

  return (
    <div className="table-container">
      <Table responsive className="align-middle mb-0 table-kardex">
        <thead>
          <tr>
            <th scope="col" style={{ width: columnWidths.producto }}>Producto</th>
            <th scope="col" className="text-center" style={{ width: columnWidths.cantidad }}>Cantidad</th>
            <th scope="col" className="text-center" style={{ width: columnWidths.lote, color: '#1e293b' }}>LOTE</th>
            <th scope="col" className="text-center" style={{ width: columnWidths.vencimiento, color: '#1e293b' }}>VENCIMIENTO</th>
            <th scope="col" className="text-center d-none d-md-table-cell" style={{ width: columnWidths.acciones }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((producto) => (
            <FilaProducto
              key={producto.id}
              producto={producto}
              onEditarClick={onEditarClick}
              handleCantidadChange={handleCantidadChange}
              handleLoteChange={handleLoteChange}
              handleFechaVencimientoChange={handleFechaVencimientoChange}
            />
          ))}
          {productosFiltrados.length === 0 && (
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