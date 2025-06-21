/**
 * TablaKardex.jsx
 * 
 * Este componente muestra el historial de movimientos de inventario (kardex)
 * para todos los productos, filtrados por fecha y búsqueda.
 * 
 * Características principales:
 * - Filtrado por fecha y texto
 * - Agrupación de movimientos por producto
 * - Visualización del último movimiento por producto
 * - Indicadores visuales para tipos de movimiento (Entrada/Salida)
 */

import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Row, Col } from 'react-bootstrap';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
import { registroInventarioService } from '../../services/registroInventarioService';
import '../../styles/InventarioPlaneacion.css';
import '../../styles/TablaKardex.css';

const TablaKardex = () => {
  const [filtro, setFiltro] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [movimientosFromBD, setMovimientosFromBD] = useState([]);
  const { productos } = useProductos();

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

  // Filtrar movimientos desde BD según el texto de búsqueda (ya están filtrados por fecha)
  const movimientosFiltrados = movimientosFromBD.filter(movimiento => 
    movimiento.producto.toLowerCase().includes(filtro.toLowerCase())
  );

  // Cargar movimientos y calcular existencias acumuladas
  const cargarMovimientosFromBD = async (fecha) => {
    try {
      const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      
      // Obtener TODOS los registros (sin filtrar por fecha para mostrar última fecha real)
      const response = await fetch('http://localhost:8000/api/registro-inventario/');
      if (!response.ok) throw new Error('Error al obtener registros');
      
      const todosLosRegistros = await response.json();
      
      // NO filtrar por fecha - usar todos los registros para obtener el estado actual
      
      // Calcular existencias acumuladas por producto (usando todos los registros)
      const existenciasPorProducto = {};
      todosLosRegistros.forEach(registro => {
        const productoId = registro.producto_id;
        if (!existenciasPorProducto[productoId]) {
          existenciasPorProducto[productoId] = {
            nombre: registro.producto_nombre,
            existencias: 0,
            ultimoMovimiento: null,
            ultimaFecha: null,
            ultimaFechaProduccion: null
          };
        }
        
        // Siempre actualizar con el registro más reciente (por fecha_creacion)
        if (!existenciasPorProducto[productoId].ultimaFecha || 
            new Date(registro.fecha_creacion) > new Date(existenciasPorProducto[productoId].ultimaFecha)) {
          existenciasPorProducto[productoId].existencias = registro.saldo;
          existenciasPorProducto[productoId].ultimaFecha = registro.fecha_creacion;
          existenciasPorProducto[productoId].ultimaFechaProduccion = registro.fecha_produccion;
          existenciasPorProducto[productoId].ultimoMovimiento = registro; // Usar el mismo registro más reciente
        }
      });
      
      // Convertir a formato de movimientos para mostrar
      const movimientosConvertidos = Object.values(existenciasPorProducto).map(data => {
        const movimiento = data.ultimoMovimiento;
        
        return {
          id: movimiento ? movimiento.id : `no-mov-${data.nombre}`,
          fecha: movimiento ? new Date(movimiento.fecha_produccion).toLocaleDateString('es-ES') : fechaStr,
          hora: movimiento ? new Date(movimiento.fecha_creacion).toLocaleTimeString('es-ES') : '--:--',
          producto: data.nombre,
          cantidad: movimiento ? movimiento.cantidad : 0,
          existencias: data.existencias, // Existencias acumuladas
          tipo: movimiento ? 
                (movimiento.tipo_movimiento === 'ENTRADA' ? 'Entrada' : 
                 movimiento.tipo_movimiento === 'SALIDA' ? 'Salida' : 'Sin movimiento') : 'Sin movimientos',
          usuario: movimiento ? movimiento.usuario : 'Sin usuario',
          lote: '-',
          fechaVencimiento: '-',
          registrado: true
        };
      });
      
      setMovimientosFromBD(movimientosConvertidos);
      console.log(`✅ Kardex actualizado con ${movimientosConvertidos.length} productos`);
      
    } catch (error) {
      console.error('Error al cargar movimientos desde BD:', error);
      setMovimientosFromBD([]);
    }
  };
  
  // Efecto para cargar movimientos al cambiar fecha
  useEffect(() => {
    cargarMovimientosFromBD(fechaSeleccionada);
  }, [fechaSeleccionada]);
  
  // Efecto para cargar al montar el componente
  useEffect(() => {
    cargarMovimientosFromBD(fechaSeleccionada);
  }, []);
  

  
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
              
              // Generar filas para productos con movimientos (solo el último movimiento por producto)
              const filasConMovimientos = Array.from(productosConMovimientos.values()).map(({ producto, movimientos }) => {
                // Ordenar movimientos por fecha y hora (más reciente primero)
                const movimientosOrdenados = [...movimientos].sort((a, b) => {
                  // Comparar por fecha
                  const fechaA = a.fecha ? new Date(a.fecha.includes('-') ? a.fecha : a.fecha.split('/').reverse().join('-')) : new Date(0);
                  const fechaB = b.fecha ? new Date(b.fecha.includes('-') ? b.fecha : b.fecha.split('/').reverse().join('-')) : new Date(0);
                  
                  if (fechaA.getTime() !== fechaB.getTime()) {
                    return fechaB.getTime() - fechaA.getTime(); // Orden descendente por fecha
                  }
                  
                  // Si las fechas son iguales, comparar por hora
                  const horaA = a.hora || '00:00';
                  const horaB = b.hora || '00:00';
                  return horaB.localeCompare(horaA); // Orden descendente por hora
                });
                
                // Tomar solo el movimiento más reciente
                const ultimoMovimiento = movimientosOrdenados[0];
                
                return (
                  <tr key={`${ultimoMovimiento.id}`}>
                    <td className="fw-medium" style={{color: '#1e293b'}}>{producto.nombre}</td>
                    <td>
                      <span className={`${getExistenciasClass(ultimoMovimiento.existencias)} rounded-pill-sm`}>
                        {ultimoMovimiento.existencias}
                      </span>
                    </td>
                    <td>
                      <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
                        {(() => {
                          try {
                            if (ultimoMovimiento.fecha.includes('-')) {
                              return new Date(ultimoMovimiento.fecha).toLocaleDateString('es-ES');
                            } else {
                              return ultimoMovimiento.fecha;
                            }
                          } catch (e) {
                            return ultimoMovimiento.fecha || '-';
                          }
                        })()}
                      </span>
                    </td>
                    <td>
                      <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
                        {ultimoMovimiento.hora || '12:00'}
                      </span>
                    </td>
                    <td>
                      <span className="rounded-pill-sm" style={{backgroundColor: '#e0f2fe', color: '#0369a1'}}>
                        <i className="bi bi-person" /> {ultimoMovimiento.usuario}
                      </span>
                    </td>
                    <td>
                      <span className={`rounded-pill-sm ${ultimoMovimiento.tipo === 'Entrada' ? 'bg-light-green' : 'bg-light-red'}`}>
                        <i className={`bi ${ultimoMovimiento.tipo === 'Entrada' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'}`} /> 
                        {ultimoMovimiento.tipo}
                      </span>
                    </td>
                  </tr>
                );
              });
              
              // Generar filas para productos sin movimientos
              const filasSinMovimientos = productosSinMovimientos.map(producto => (
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