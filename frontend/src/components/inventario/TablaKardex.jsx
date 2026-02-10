import React, { useState, useEffect } from 'react';
import { Table, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { API_URL } from '../../services/api';
import DateSelector from '../common/DateSelector';
import HoverToggleButton from '../common/HoverToggleButton';
import { useProductos } from '../../hooks/useUnifiedProducts';
import '../../styles/InventarioPlaneacion.css';
import '../../styles/TablaKardex.css';
import '../../styles/HoverToggleButton.css';

const TablaKardex = () => {
  const [filtro, setFiltro] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [movimientosFromBD, setMovimientosFromBD] = useState([]);
  const { productos } = useProductos();
  const [cargando, setCargando] = useState(false);

  // Utilidades
  const getExistenciasClass = (existencias) => {
    return existencias > 0 ? 'bg-light-green' : 'bg-light-red';
  };

  // 🆕 NUEVO: Usar el campo 'orden' de la BD para ordenar productos
  // Ya no se usa una lista fija hardcodeada
  const ordenarProductos = (productos) => {
    return productos.sort((a, b) => {
      // Usar el campo 'orden' que viene de la BD
      const ordenA = a.orden || 999;
      const ordenB = b.orden || 999;

      // Si tienen el mismo orden, ordenar alfabéticamente
      if (ordenA === ordenB) {
        const nombreA = a.producto || a.nombre || '';
        const nombreB = b.producto || b.nombre || '';
        return nombreA.localeCompare(nombreB);
      }

      return ordenA - ordenB;
    });
  };

  const productosFiltrados = ordenarProductos(
    productos.filter(producto =>
      producto.nombre.toLowerCase().includes(filtro.toLowerCase())
    )
  );

  const movimientosFiltrados = ordenarProductos(
    movimientosFromBD.filter(movimiento =>
      movimiento.producto.toLowerCase().includes(filtro.toLowerCase())
    )
  );

  // Cargar movimientos desde BD
  const cargarMovimientosFromBD = async () => {
    try {
      // 🎯 Marcar como cargando solo si no hay movimientos
      if (movimientosFromBD.length === 0) {
        setCargando(true);
      }

      // 🚀 USAR api_stock COMO FUENTE PRINCIPAL (TODOS los productos activos)
      const stockResponse = await fetch(`${API_URL}/stock/`);

      if (!stockResponse.ok) throw new Error('Error al obtener stocks');
      const stocksBD = await stockResponse.json();

      // 🆕 Filtrar solo productos con disponible_inventario = true
      const stocksFiltrados = stocksBD.filter(s => s.disponible_inventario !== false);

      // Crear mapa de stocks
      const stockMap = {};
      stocksFiltrados.forEach(s => {
        stockMap[s.producto_id] = s.cantidad_actual;
      });

      // 🎯 Usar stocks como productos (ya tiene todo lo necesario)
      // 🆕 Incluir campo 'orden' para ordenamiento
      const productosProduccion = stocksFiltrados.map(s => ({
        id: s.producto_id,
        nombre: s.producto_nombre,
        descripcion: s.producto_descripcion,
        stock_total: s.cantidad_actual,
        orden: s.orden || 999 // Campo orden del producto
      }));

      // 🚀 OPTIMIZADO: Solo obtener últimos registros (limitar a 100)
      const response = await fetch(`${API_URL}/registro-inventario/?limit=100&ordering=-fecha_creacion`);
      const todosLosRegistros = response.ok ? await response.json() : [];

      // Crear mapa de último movimiento por producto
      const ultimoMovimientoPorProducto = {};
      todosLosRegistros.forEach(registro => {
        const productoId = registro.producto_id;
        if (!ultimoMovimientoPorProducto[productoId] ||
          new Date(registro.fecha_creacion) > new Date(ultimoMovimientoPorProducto[productoId].fecha_creacion)) {
          ultimoMovimientoPorProducto[productoId] = registro;
        }
      });

      // 🎯 MOSTRAR TODOS LOS PRODUCTOS DE api_stock
      const movimientosConvertidos = productosProduccion.map(producto => {
        const ultimoMov = ultimoMovimientoPorProducto[producto.id];

        if (ultimoMov) {
          // Producto con movimientos registrados
          return {
            id: ultimoMov.id,
            productoId: producto.id,
            fecha: new Date(ultimoMov.fecha_produccion).toLocaleDateString('es-ES'),
            hora: new Date(ultimoMov.fecha_creacion).toLocaleTimeString('es-ES'),
            producto: producto.nombre,
            cantidad: ultimoMov.cantidad,
            existencias: stockMap[producto.id] || 0,
            tipo: ultimoMov.tipo_movimiento === 'ENTRADA' ? 'Entrada' :
              ultimoMov.tipo_movimiento === 'SALIDA' ? 'Salida' : 'Sin movimiento',
            usuario: ultimoMov.usuario,
            lote: '-',
            fechaVencimiento: '-',
            registrado: true,
            orden: producto.orden || 999 // 🆕 Campo orden para ordenamiento
          };
        } else {
          // Producto sin movimientos (nuevo o sin registros)
          return {
            id: `no-mov-${producto.id}`,
            productoId: producto.id,
            fecha: new Date().toLocaleDateString('es-ES'),
            hora: '--:--',
            producto: producto.nombre,
            cantidad: 0,
            existencias: stockMap[producto.id] || 0,
            tipo: 'Sin movimiento',
            usuario: 'Sin usuario',
            lote: '-',
            fechaVencimiento: '-',
            registrado: false,
            orden: producto.orden || 999 // 🆕 Campo orden para ordenamiento
          };
        }
      });

      setMovimientosFromBD(movimientosConvertidos);
      setCargando(false);


    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setMovimientosFromBD([]);
      setCargando(false);
    }
  };

  // 🚀 CARGA DIRECTA DESDE BACKEND (SIN CACHE)
  useEffect(() => {
    // Cargar inmediatamente desde servidor
    cargarMovimientosFromBD();

    // 🔄 Actualización periódica cada 30 segundos
    const interval = setInterval(() => {
      cargarMovimientosFromBD();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fechaSeleccionada]);

  // 🔄 NUEVO: Escuchar eventos de actualización de inventario
  useEffect(() => {
    const handleInventarioActualizado = (event) => {
      console.log('📢 Kardex: Evento inventarioActualizado recibido', event.detail);
      // Recargar movimientos inmediatamente
      cargarMovimientosFromBD();
    };

    // Agregar listener
    window.addEventListener('inventarioActualizado', handleInventarioActualizado);

    // Cleanup
    return () => {
      window.removeEventListener('inventarioActualizado', handleInventarioActualizado);
    };
  }, []); // Solo se ejecuta al montar/desmontar

  const handleDateSelect = (date) => {
    setFechaSeleccionada(date);
  };

  // Renderizar fila de movimiento
  const renderMovimientoRow = (movimiento) => (
    <tr key={movimiento.id}>
      <td className="fw-medium" style={{ color: '#1e293b' }}>
        {movimiento.producto}
      </td>
      <td className="text-center" style={{ paddingLeft: '0' }}>
        <span className={`${getExistenciasClass(movimiento.existencias)} rounded-pill-sm`} style={{ marginTop: '1px' }}>
          {movimiento.existencias} und
        </span>
      </td>
      <td style={{ color: '#1E293B' }} className="text-center">
        <i className="bi bi-person" /> {movimiento.usuario}
      </td>
      <td style={{ color: '#1E293B' }} className="text-center">
        <i className={`bi ${movimiento.tipo === 'Entrada' ? 'bi-arrow-down-circle text-success' : 'bi-arrow-up-circle text-danger'}`} />
        {movimiento.tipo}
      </td>
    </tr>
  );

  // Renderizar fila sin movimiento
  const renderSinMovimientoRow = (producto) => (
    <tr key={`no-mov-${producto.id}`}>
      <td className="fw-medium" style={{ color: '#1e293b' }}>
        {producto.nombre}
        <div className="small text-muted d-none d-md-block">
          {fechaSeleccionada.toLocaleDateString('es-ES')} --:--
        </div>
      </td>
      <td className="text-center" style={{ paddingLeft: '0' }}>
        <span className={`${getExistenciasClass(producto.existencias)} rounded-pill-sm`} style={{ padding: '2.4px 7.2px 3.6px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)', display: 'inline-block', marginTop: '2px' }}>
          {producto.existencias} und
        </span>
      </td>
      <td style={{ color: '#1E293B' }} className="text-center">
        <i className="bi bi-dash" /> Sin usuario
      </td>
      <td style={{ color: '#1E293B' }} className="text-center">
        <i className="bi bi-dash" /> Sin movimientos
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
        <Table size="sm" className="mb-0 table-kardex" style={{ lineHeight: '1.2' }}>
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Producto</th>
              <th className="text-center" style={{ width: '15%' }}>Existencias</th>
              <th className="text-center" style={{ width: '20%' }}>Usuario</th>
              <th className="text-center" style={{ width: '20%' }}>Movimiento</th>
            </tr>
          </thead>
          <tbody>
            {/* Mostrar solo los movimientos de la BD */}
            {movimientosFiltrados.length > 0 ? (
              movimientosFiltrados.map(renderMovimientoRow)
            ) : cargando ? (
              // Mostrar spinner mientras carga
              <tr>
                <td colSpan="4" className="text-center py-4">
                  <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="text-muted mb-0">Cargando movimientos...</p>
                  </div>
                </td>
              </tr>
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

      {/* Botón para activar/desactivar el efecto hover */}
      <HoverToggleButton />
    </>
  );
};

export default TablaKardex;