import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Row, Col } from 'react-bootstrap';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
import '../../styles/InventarioPlaneacion.css';
import '../../styles/TablaKardex.css';

const TablaKardex = () => {
  const [filtro, setFiltro] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [movimientosFromBD, setMovimientosFromBD] = useState([]);
  const { productos } = useProductos();

  // Utilidades
  const getExistenciasClass = (existencias) => {
    if (existencias <= 0) return 'bg-light-red';
    if (existencias <= 30) return 'bg-light-yellow';
    return 'bg-light-green';
  };

  const productosFiltrados = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  const movimientosFiltrados = movimientosFromBD.filter(movimiento => 
    movimiento.producto.toLowerCase().includes(filtro.toLowerCase())
  );

  // Cargar movimientos desde BD
  const cargarMovimientosFromBD = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/registro-inventario/');
      if (!response.ok) throw new Error('Error al obtener registros');
      
      const todosLosRegistros = await response.json();
      const existenciasPorProducto = {};
      
      // Procesar registros para obtener el más reciente por producto
      todosLosRegistros.forEach(registro => {
        const productoId = registro.producto_id;
        
        if (!existenciasPorProducto[productoId] || 
            new Date(registro.fecha_creacion) > new Date(existenciasPorProducto[productoId].ultimaFecha)) {
          existenciasPorProducto[productoId] = {
            nombre: registro.producto_nombre,
            existencias: registro.saldo,
            ultimaFecha: registro.fecha_creacion,
            ultimoMovimiento: registro
          };
        }
      });
      
      // Convertir a formato para mostrar
      const movimientosConvertidos = Object.values(existenciasPorProducto).map(data => {
        const mov = data.ultimoMovimiento;
        return {
          id: mov.id,
          fecha: new Date(mov.fecha_produccion).toLocaleDateString('es-ES'),
          hora: new Date(mov.fecha_creacion).toLocaleTimeString('es-ES'),
          producto: data.nombre,
          cantidad: mov.cantidad,
          existencias: data.existencias,
          tipo: mov.tipo_movimiento === 'ENTRADA' ? 'Entrada' : 
                mov.tipo_movimiento === 'SALIDA' ? 'Salida' : 'Sin movimiento',
          usuario: mov.usuario,
          lote: '-',
          fechaVencimiento: '-',
          registrado: true
        };
      });
      
      setMovimientosFromBD(movimientosConvertidos);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setMovimientosFromBD([]);
    }
  };

  // Effects
  useEffect(() => {
    cargarMovimientosFromBD();
  }, [fechaSeleccionada]);
  
  const handleDateSelect = (date) => {
    setFechaSeleccionada(date);
  };

  // Renderizar fila de movimiento
  const renderMovimientoRow = (movimiento) => (
    <tr key={movimiento.id}>
      <td className="fw-medium" style={{color: '#1e293b'}}>
        {movimiento.producto}
      </td>
      <td>
        <span className={`${getExistenciasClass(movimiento.existencias)} rounded-pill-sm`}>
          {movimiento.existencias}
        </span>
      </td>
      <td>
        <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
          {movimiento.fecha}
        </span>
      </td>
      <td>
        <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
          {movimiento.hora}
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
          {movimiento.tipo}
        </span>
      </td>
    </tr>
  );

  // Renderizar fila sin movimiento
  const renderSinMovimientoRow = (producto) => (
    <tr key={`no-mov-${producto.id}`}>
      <td className="fw-medium" style={{color: '#1e293b'}}>{producto.nombre}</td>
      <td>
        <span className={`${getExistenciasClass(producto.existencias)} rounded-pill-sm`}>
          {producto.existencias}
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
          <i className="bi bi-dash" /> Sin movimientos
        </span>
      </td>
    </tr>
  );

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
            {/* Productos con movimientos */}
            {movimientosFiltrados.map(renderMovimientoRow)}
            
            {/* Productos sin movimientos */}
            {productosFiltrados
              .filter(producto => !movimientosFiltrados.some(mov => mov.producto === producto.nombre))
              .map(renderSinMovimientoRow)
            }
            
            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <p className="text-muted">No se encontraron productos</p>
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