import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import TablaInventario from './TablaInventario';
import TablaMovimientos from './TablaMovimientos';
import ModalAgregarProducto from './ModalAgregarProducto';
import ModalEditarExistencias from './ModalEditarExistencias';
import ModalCambiarUsuario from './ModalCambiarUsuario';
import DateSelector from '../common/DateSelector';
import productosIniciales from '../../data/productos';
import '../../styles/InventarioProduccion.css';

const InventarioProduccion = () => {
  // Estados para manejar los datos
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [usuario, setUsuario] = useState('Usuario Predeterminado');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  
  // Estados para modales
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Cargar datos iniciales
  useEffect(() => {
    // Cargar productos desde el archivo de datos
    setProductos(productosIniciales);
    
    const movimientosIniciales = [
      { 
        id: 1, 
        fecha: '2023-05-10', 
        hora: '10:30', 
        producto: 'AREPA TIPO OBLEA', 
        cantidad: 5, 
        tipo: 'Entrada', 
        usuario: 'Admin' 
      },
      { 
        id: 2, 
        fecha: '2023-05-09', 
        hora: '15:45', 
        producto: 'AREPA MEDIANA', 
        cantidad: 3, 
        tipo: 'Salida', 
        usuario: 'Usuario' 
      },
    ];
    
    setMovimientos(movimientosIniciales);
  }, []);

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => 
    producto.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    producto.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  // Manejadores de eventos
  const handleFiltroChange = (e) => {
    setFiltro(e.target.value);
  };

  const handleAgregarProducto = (nuevoProducto) => {
    setProductos([...productos, { ...nuevoProducto, id: Date.now(), cantidad: 0 }]);
    setMensaje({ texto: 'Producto agregado correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleEditarClick = (producto) => {
    setProductoEditar(producto);
    setShowModalEditar(true);
  };

  const handleEditarExistencias = (id, nuevasExistencias) => {
    const productoEditado = productos.find(p => p.id === id);
    const existenciasAnteriores = productoEditado.existencias;
    const diferenciaExistencias = nuevasExistencias - existenciasAnteriores;
    const tipoMovimiento = diferenciaExistencias > 0 ? 'Entrada' : 'Salida';
    
    // Actualizar productos
    const nuevosProductos = productos.map(producto => 
      producto.id === id ? { ...producto, existencias: nuevasExistencias } : producto
    );
    
    setProductos(nuevosProductos);
    
    // Obtener hora actual
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ':' + 
                ahora.getMinutes().toString().padStart(2, '0');
    
    // Registrar movimiento
    const nuevoMovimiento = {
      id: Date.now(),
      fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
      hora: hora,
      producto: productoEditado.nombre,
      cantidad: Math.abs(diferenciaExistencias),
      tipo: tipoMovimiento,
      usuario
    };
    
    setMovimientos([nuevoMovimiento, ...movimientos]);
    setMensaje({ texto: 'Existencias actualizadas correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleCantidadChange = (id, cantidad) => {
    const nuevosProductos = productos.map(producto => 
      producto.id === id ? { ...producto, cantidad } : producto
    );
    setProductos(nuevosProductos);
  };

  const handleGrabarMovimiento = () => {
    // Filtrar productos con cantidad > 0
    const productosConCantidad = productos.filter(p => p.cantidad > 0);
    
    if (productosConCantidad.length === 0) {
      setMensaje({ texto: 'No hay cantidades para registrar', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }
    
    // Obtener hora actual
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ':' + 
                ahora.getMinutes().toString().padStart(2, '0');
    
    // Crear nuevos movimientos y actualizar existencias
    const nuevosMovimientos = [];
    const nuevosProductos = [...productos];
    
    productosConCantidad.forEach(producto => {
      // Actualizar existencias
      const index = nuevosProductos.findIndex(p => p.id === producto.id);
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        existencias: nuevosProductos[index].existencias + producto.cantidad,
        cantidad: 0 // Resetear cantidad
      };
      
      // Crear movimiento
      nuevosMovimientos.push({
        id: Date.now() + nuevosMovimientos.length,
        fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
        hora: hora,
        producto: producto.nombre,
        cantidad: producto.cantidad,
        tipo: 'Entrada',
        usuario
      });
    });
    
    // Actualizar estado
    setProductos(nuevosProductos);
    setMovimientos([...nuevosMovimientos, ...movimientos]);
    setMensaje({ texto: 'Movimientos registrados correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleCambiarUsuario = (nuevoUsuario) => {
    setUsuario(nuevoUsuario);
    setMensaje({ texto: 'Usuario cambiado correctamente', tipo: 'info' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleDateSelect = (date) => {
    setFechaSeleccionada(date);
  };

  return (
    <Container fluid className="py-4">
      {/* Encabezado y controles */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Inventario de Producción</h2>
            <div className="d-flex">
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => setShowModalUsuario(true)}
              >
                <i className="bi bi-person"></i> {usuario}
              </Button>
              <Button 
                variant="primary"
                onClick={() => setShowModalAgregar(true)}
              >
                <i className="bi bi-plus-lg"></i> Agregar Producto
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Selector de fecha */}
      <Row className="mb-4">
        <Col>
          <DateSelector onDateSelect={handleDateSelect} />
        </Col>
      </Row>

      {/* Mensajes de alerta */}
      {mensaje.texto && (
        <Row className="mb-4">
          <Col>
            <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ texto: '', tipo: '' })}>
              {mensaje.texto}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Filtro de búsqueda */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={filtro}
            onChange={handleFiltroChange}
            className="search-input"
          />
        </Col>
      </Row>

      {/* Tabla de inventario */}
      <Row className="mb-4">
        <Col>
          <TablaInventario 
            productos={productosFiltrados} 
            onEditarClick={handleEditarClick}
            handleCantidadChange={handleCantidadChange}
          />
        </Col>
      </Row>

      {/* Botón grabar movimiento */}
      <Row className="mb-4">
        <Col className="d-flex justify-content-end">
          <Button 
            variant="success" 
            className="grabar-btn"
            onClick={handleGrabarMovimiento}
          >
            <i className="bi bi-save"></i> Grabar Movimiento
          </Button>
        </Col>
      </Row>

      {/* Historial de movimientos */}
      <Row>
        <Col>
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Historial de Movimientos</h5>
            </div>
            <div className="card-body">
              <TablaMovimientos movimientos={movimientos} />
            </div>
          </div>
        </Col>
      </Row>

      {/* Modales */}
      <ModalAgregarProducto 
        show={showModalAgregar}
        onHide={() => setShowModalAgregar(false)}
        onAgregar={handleAgregarProducto}
      />
      
      <ModalEditarExistencias 
        show={showModalEditar}
        onHide={() => setShowModalEditar(false)}
        producto={productoEditar}
        onEditar={handleEditarExistencias}
      />
      
      <ModalCambiarUsuario 
        show={showModalUsuario}
        onHide={() => setShowModalUsuario(false)}
        usuarioActual={usuario}
        onCambiar={handleCambiarUsuario}
      />
    </Container>
  );
};

export default InventarioProduccion;