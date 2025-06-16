import React, { useState } from 'react';
import { Table, Form, InputGroup, Row, Col } from 'react-bootstrap';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
import '../../styles/InventarioPlaneacion.css';
import '../../styles/TablaKardex.css';

const TablaKardex = () => {
  const [filtro, setFiltro] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const { productos, movimientos } = useProductos();

  // Función para obtener las existencias actuales de un producto
  const getExistencias = (nombreProducto) => {
    const producto = productos.find(p => p.nombre === nombreProducto);
    return producto ? producto.existencias : 0;
  };

  // Función para determinar la clase según las existencias
  const getExistenciasClass = (existencias) => {
    if (existencias <= 0) return 'bg-light-red';
    if (existencias <= 30) return 'bg-light-yellow';
    return 'bg-light-green';
  };

  // Filtrar productos según el texto de búsqueda
  const productosFiltrados = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  // Filtrar movimientos según el texto de búsqueda y la fecha seleccionada
  const movimientosFiltrados = movimientos.filter(movimiento => {
    if (!movimiento.fecha) return false;
    
    // Convertir la fecha del movimiento a objeto Date
    // Manejar diferentes formatos de fecha (YYYY-MM-DD o DD/MM/YYYY)
    let fechaMovimiento;
    try {
      if (movimiento.fecha.includes('-')) {
        fechaMovimiento = new Date(movimiento.fecha);
      } else {
        fechaMovimiento = new Date(movimiento.fecha.split('/').reverse().join('-'));
      }
      
      // Verificar si la fecha del movimiento es la misma que la fecha seleccionada
      const mismaFecha = 
        fechaMovimiento.getDate() === fechaSeleccionada.getDate() &&
        fechaMovimiento.getMonth() === fechaSeleccionada.getMonth() &&
        fechaMovimiento.getFullYear() === fechaSeleccionada.getFullYear();
      
      // Filtrar por nombre de producto y fecha
      return movimiento.producto.toLowerCase().includes(filtro.toLowerCase()) && mismaFecha;
    } catch (error) {
      console.error('Error al procesar la fecha del movimiento:', movimiento.fecha, error);
      return false;
    }
  });

  // Manejar cambio de fecha
  const handleDateSelect = (date) => {
    setFechaSeleccionada(date);
  };
  
  // Función para formatear tipo de movimiento
  const getTipoMovimientoBadge = (tipo) => {
    if (tipo === 'Entrada') return 'text-success';
    if (tipo === 'Salida') return 'text-danger';
    return '';
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
        <Table size="sm" className="mb-0 table-kardex">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Existencias</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Usuario</th>
              <th>Movimiento</th>
            </tr>
          </thead>
          <tbody>
            {/* Mostrar movimientos agrupados por producto */}
            {(() => {
              // Crear un mapa para agrupar movimientos por producto
              const productosConMovimientos = new Map();
              
              // Agrupar movimientos por producto
              movimientosFiltrados.forEach(movimiento => {
                if (!productosConMovimientos.has(movimiento.producto)) {
                  // Buscar el producto correspondiente
                  const producto = productosFiltrados.find(p => p.nombre === movimiento.producto);
                  if (producto) {
                    productosConMovimientos.set(movimiento.producto, {
                      producto,
                      movimientos: [movimiento]
                    });
                  }
                } else {
                  productosConMovimientos.get(movimiento.producto).movimientos.push(movimiento);
                }
              });
              
              // Productos filtrados sin movimientos
              const productosSinMovimientos = productosFiltrados.filter(
                producto => !productosConMovimientos.has(producto.nombre)
              );
              
              // Generar filas para productos con movimientos
              const filasConMovimientos = Array.from(productosConMovimientos.values()).map(({ producto, movimientos }) => 
                movimientos.map((movimiento, idx) => (
                  <tr key={`${movimiento.id}-${idx}`}>
                    <td className="fw-medium" style={{color: '#1e293b'}}>{producto.nombre}</td>
                    <td>
                      <span className={`${getExistenciasClass(producto.existencias)} rounded-pill-sm`}>
                        {producto.existencias} und
                      </span>
                    </td>
                    <td>
                      <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
                        {(() => {
                          try {
                            if (movimiento.fecha.includes('-')) {
                              return new Date(movimiento.fecha).toLocaleDateString('es-ES');
                            } else {
                              return movimiento.fecha;
                            }
                          } catch (e) {
                            return movimiento.fecha || '-';
                          }
                        })()}
                      </span>
                    </td>
                    <td>
                      <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
                        {movimiento.hora || '12:00'}
                      </span>
                    </td>
                    <td>
                      <span className="rounded-pill-sm" style={{backgroundColor: '#e0f2fe', color: '#0369a1'}}>
                        <i className="bi bi-person" /> {movimiento.usuario}
                      </span>
                    </td>
                    <td>
                      <span className={`rounded-pill-sm ${movimiento.tipo === 'Entrada' ? 'bg-light-green' : 'bg-light-red'}`}>
                        <i className={`bi ${movimiento.tipo === 'Entrada' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'}`} /> 
                        {movimiento.cantidad} und
                      </span>
                    </td>
                  </tr>
                ))
              ).flat();
              
              // Generar filas para productos sin movimientos
              const filasSinMovimientos = productosSinMovimientos.map(producto => (
                <tr key={`no-mov-${producto.id}`}>
                  <td className="fw-medium" style={{color: '#1e293b'}}>{producto.nombre}</td>
                  <td>
                    <span className={`${getExistenciasClass(producto.existencias)} rounded-pill-sm`}>
                      {producto.existencias} und
                    </span>
                  </td>
                  <td>
                    <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
                      {fechaSeleccionada.toLocaleDateString('es-ES')}
                    </span>
                  </td>
                  <td>
                    <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
                      --:--
                    </span>
                  </td>
                  <td>
                    <span className="rounded-pill-sm" style={{backgroundColor: '#f1f5f9', color: '#64748b'}}>
                      <i className="bi bi-dash" /> Sin usuario
                    </span>
                  </td>
                  <td>
                    <span className="rounded-pill-sm bg-light-yellow">
                      <i className="bi bi-dash" /> 0 und
                    </span>
                  </td>
                </tr>
              ));
              
              // Combinar todas las filas
              return [...filasConMovimientos, ...filasSinMovimientos];
            })()}
            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <p className="text-muted">
                    No se encontraron productos
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