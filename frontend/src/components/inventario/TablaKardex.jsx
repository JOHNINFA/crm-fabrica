import React, { useState } from 'react';
import { Table, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
import '../../styles/InventarioPlaneacion.css';

const TablaKardex = () => {
  const [filtro, setFiltro] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const { productos, movimientos } = useProductos();

  // Función para obtener las existencias actuales de un producto
  const getExistencias = (nombreProducto) => {
    const producto = productos.find(p => p.nombre === nombreProducto);
    return producto ? producto.existencias : 0;
  };

  // Función para determinar la clase del badge según las existencias
  const getExistenciasBadge = (existencias) => {
    if (existencias <= 0) return 'badge-custom badge-custom-red';
    if (existencias <= 30) return 'badge-custom badge-custom-yellow';
    return 'badge-custom badge-custom-green';
  };

  // Filtrar movimientos según el texto de búsqueda y la fecha seleccionada
  const movimientosFiltrados = movimientos.filter(movimiento => {
    // Convertir la fecha del movimiento a objeto Date
    const fechaMovimiento = new Date(movimiento.fecha.split('/').reverse().join('-'));
    
    // Verificar si la fecha del movimiento es la misma que la fecha seleccionada
    const mismaFecha = 
      fechaMovimiento.getDate() === fechaSeleccionada.getDate() &&
      fechaMovimiento.getMonth() === fechaSeleccionada.getMonth() &&
      fechaMovimiento.getFullYear() === fechaSeleccionada.getFullYear();
    
    // Filtrar por nombre de producto y fecha
    return movimiento.producto.toLowerCase().includes(filtro.toLowerCase()) && mismaFecha;
  });

  // Manejar cambio de fecha
  const handleDateSelect = (date) => {
    setFechaSeleccionada(date);
  };

  return (
    <>
      <Row className="mb-3">
        <Col xs={12} md={6}>
          <DateSelector onDateSelect={handleDateSelect} />
        </Col>
        <Col xs={12} md={6} className="d-flex justify-content-end align-items-start">
          <InputGroup style={{ maxWidth: '300px' }} className="mb-2">
            <InputGroup.Text className="py-0 px-2" style={{ borderRadius: '0.5rem 0 0 0.5rem' }}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              size="sm"
              placeholder="Buscar producto..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              style={{ borderRadius: '0 0.5rem 0.5rem 0' }}
            />
          </InputGroup>
        </Col>
      </Row>
      <div className="table-responsive">
        <Table size="sm" className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Producto</th>
              <th>Existencias</th>
              <th>Cantidad</th>
              <th>Lote</th>
              <th>Vencimiento</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {movimientosFiltrados.map((movimiento) => {
              const existencias = getExistencias(movimiento.producto);
              return (
                <tr key={movimiento.id}>
                  <td className="text-muted small">{movimiento.fecha}</td>
                  <td className="text-muted small">{movimiento.hora || '12:00'}</td>
                  <td className="fw-medium">{movimiento.producto}</td>
                  <td>
                    <Badge className={`${getExistenciasBadge(existencias)} existencias-badge-lg`} style={{ minWidth: '80px', display: 'inline-block' }}>
                      {existencias} und
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
              );
            })}
            {movimientosFiltrados.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <p className="text-muted">
                    {filtro ? 'No se encontraron movimientos para este producto en la fecha seleccionada' : 'No hay movimientos registrados para la fecha seleccionada'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
};

export default TablaKardex;
