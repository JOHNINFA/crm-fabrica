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
      // Obtener productos actuales de la BD para tener datos precisos
      const productosResponse = await fetch('http://localhost:8000/api/productos/');
      if (!productosResponse.ok) throw new Error('Error al obtener productos');
      const productosBD = await productosResponse.json();
      
      // Crear un mapa de productos por ID para referencia rápida
      const productosMap = {};
      productosBD.forEach(p => {
        productosMap[p.id] = {
          id: p.id,
          nombre: p.nombre,
          existencias: p.stock_total || 0
        };
      });
      
      // Obtener registros de inventario
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
            existencias: productosMap[productoId]?.existencias || registro.saldo, // Usar stock actual de BD
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
          productoId: mov.producto_id,
          fecha: new Date(mov.fecha_produccion).toLocaleDateString('es-ES'),
          hora: new Date(mov.fecha_creacion).toLocaleTimeString('es-ES'),
          producto: data.nombre,
          cantidad: mov.cantidad,
          existencias: data.existencias, // Usar existencias actualizadas
          tipo: mov.tipo_movimiento === 'ENTRADA' ? 'Entrada' : 
                mov.tipo_movimiento === 'SALIDA' ? 'Salida' : 'Sin movimiento',
          usuario: mov.usuario,
          lote: '-',
          fechaVencimiento: '-',
          registrado: true
        };
      });
      
      setMovimientosFromBD(movimientosConvertidos);
      
      console.log('📊 Kardex actualizado con datos de BD:', movimientosConvertidos.length, 'movimientos');
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setMovimientosFromBD([]);
    }
  };

  // Effects
  useEffect(() => {
    cargarMovimientosFromBD();
    
    // Configurar actualización periódica cada 30 segundos
    const interval = setInterval(() => {
      cargarMovimientosFromBD();
    }, 30000);
    
    return () => clearInterval(interval);
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
      <td className="fw-medium" style={{color: '#1e293b'}}>
        {producto.nombre}
        <div className="small text-muted d-none d-md-block">
          {fechaSeleccionada.toLocaleDateString('es-ES')} --:--
        </div>
      </td>
      <td>
        <span className={`${getExistenciasClass(producto.existencias)} rounded-pill-sm`}>
          {producto.existencias}
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
              <th>Usuario</th>
              <th>Movimiento</th>
            </tr>
          </thead>
          <tbody>
            {/* Mostrar solo los movimientos de la BD */}
            {movimientosFiltrados.length > 0 ? (
              movimientosFiltrados.map(renderMovimientoRow)
            ) : (
              // Si no hay movimientos filtrados, mostrar mensaje
              <tr>
                <td colSpan="4" className="text-center py-4">
                  <p className="text-muted">No se encontraron movimientos para los productos seleccionados</p>
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