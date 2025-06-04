import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import TablaMaquilas from './TablaMaquilas';
import ModalAgregarProducto from './ModalAgregarProducto';
import ModalEditarExistencias from './ModalEditarExistencias';
import ModalCambiarUsuario from './ModalCambiarUsuario';
import ModalEditarMaquilas from './ModalEditarMaquilas';
import DateSelector from '../common/DateSelector';
import productosMaquilas from '../../data/productosMaquilas';
import '../../styles/InventarioProduccion.css';
import '../../styles/InventarioMaquilas.css';

const InventarioMaquilas = ({ onActualizarMovimientos, onActualizarProductos }) => {
  // Estados para manejar los datos
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [usuario, setUsuario] = useState('Usuario Predeterminado');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  
  // Estados para modales
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [showModalMaquilas, setShowModalMaquilas] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Cargar datos iniciales
  useEffect(() => {
    // Cargar productos desde el archivo de datos
    const productosConCampos = productosMaquilas.map(producto => ({
      ...producto,
      lote: '',
      fechaVencimiento: ''
    }));
    setProductos(productosConCampos);
    
    const movimientosIniciales = [
      { 
        id: 1, 
        fecha: '2023-05-10', 
        hora: '10:30', 
        producto: 'AREPA BOYACENSE X5', 
        cantidad: 5, 
        tipo: 'Entrada', 
        usuario: 'Admin',
        lote: 'M001',
        fechaVencimiento: '10/11/2023'
      },
      { 
        id: 2, 
        fecha: '2023-05-09', 
        hora: '15:45', 
        producto: 'ALMOJABANAS X5', 
        cantidad: 3, 
        tipo: 'Salida', 
        usuario: 'Usuario',
        lote: 'M002',
        fechaVencimiento: '-'
      },
    ];
    
    setMovimientos(movimientosIniciales);
  }, []);

  // Efecto para actualizar productos en el componente padre cuando cambian
  useEffect(() => {
    if (onActualizarProductos) {
      onActualizarProductos(productos);
    }
  }, [productos, onActualizarProductos]);

  // Manejadores de eventos
  const handleAgregarProducto = (nuevoProducto) => {
    setProductos([...productos, { ...nuevoProducto, id: Date.now(), cantidad: 0, lote: '', fechaVencimiento: '' }]);
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
    
    const nuevosMovimientos = [nuevoMovimiento, ...movimientos];
    setMovimientos(nuevosMovimientos);
    
    if (onActualizarMovimientos) {
      onActualizarMovimientos(nuevosMovimientos);
    }
    
    setMensaje({ texto: 'Existencias actualizadas correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleCantidadChange = (id, cantidad) => {
    const nuevosProductos = productos.map(producto => 
      producto.id === id ? { ...producto, cantidad: parseInt(cantidad) || 0 } : producto
    );
    setProductos(nuevosProductos);
  };
  
  const handleLoteChange = (id, lote) => {
    const nuevosProductos = productos.map(producto => 
      producto.id === id ? { ...producto, lote } : producto
    );
    setProductos(nuevosProductos);
  };
  
  const handleFechaVencimientoChange = (id, fechaVencimiento) => {
    const nuevosProductos = productos.map(producto => 
      producto.id === id ? { ...producto, fechaVencimiento } : producto
    );
    setProductos(nuevosProductos);
  };
  
  // Función para manejar cambios desde el modal de edición
  const handleGuardarMaquilas = (productosEditados) => {
    setProductos(productosEditados);
    setMensaje({ texto: 'Productos actualizados correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleGrabarMovimiento = () => {
    // Filtrar productos con cantidad > 0
    const productosConCantidad = productos.filter(p => p.cantidad > 0);
    
    if (productosConCantidad.length === 0) {
      setMensaje({ texto: 'No hay cantidades para registrar', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 6000);
      return;
    }
    
    // Verificar que todos los productos con cantidad tengan lote
    const productosSinLote = productosConCantidad.filter(p => !p.lote);
    if (productosSinLote.length > 0) {
      setMensaje({ texto: 'Todos los productos deben tener un lote asignado', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 6000);
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
      
      // Asegurarse de que existencias sea un número
      const existenciasActuales = parseInt(nuevosProductos[index].existencias) || 0;
      const cantidadAAgregar = parseInt(producto.cantidad) || 0;
      
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        existencias: existenciasActuales + cantidadAAgregar,
        cantidad: 0, // Resetear cantidad
        lote: '', // Resetear lote
        fechaVencimiento: '' // Resetear fecha de vencimiento
      };
      
      // Crear movimiento
      nuevosMovimientos.push({
        id: Date.now() + nuevosMovimientos.length,
        fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
        hora: hora,
        producto: producto.nombre,
        cantidad: cantidadAAgregar,
        tipo: 'Entrada',
        usuario,
        lote: producto.lote,
        fechaVencimiento: producto.fechaVencimiento ? new Date(producto.fechaVencimiento).toLocaleDateString('es-ES') : '-'
      });
    });
    
    // Actualizar estado
    setProductos(nuevosProductos);
    const todosMovimientos = [...nuevosMovimientos, ...movimientos];
    setMovimientos(todosMovimientos);
    
    // Actualizar movimientos en el componente padre
    if (onActualizarMovimientos) {
      onActualizarMovimientos(todosMovimientos);
    }
    
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
          <div className="header-buttons">
            <Button 
              variant="outline-primary" 
              className="mb-2 mb-md-0 me-md-2"
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
        </Col>
      </Row>

      {/* Selector de fecha */}
      <Row className="mb-4">
        <Col xs={12} md={6}>
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

      {/* Tabla de inventario */}
      <Row className="mb-4">
        <Col>
          <div className="table-responsive">
            <TablaMaquilas 
              productos={productos} 
              onEditarClick={handleEditarClick}
              handleCantidadChange={handleCantidadChange}
              handleLoteChange={handleLoteChange}
              handleFechaVencimientoChange={handleFechaVencimientoChange}
            />
          </div>
        </Col>
      </Row>

      {/* Botón grabar movimiento */}
      <Row className="mb-4">
        <Col>
          <div className="botones-container">
            {/* Botón editar para pantallas pequeñas */}
            <Button 
              variant="primary" 
              className="d-md-none editar-global-btn"
              onClick={() => setShowModalMaquilas(true)}
            >
              <i className="bi bi-pencil-square"></i> Editar
            </Button>
            
            <Button 
              variant="success" 
              className="grabar-btn"
              onClick={handleGrabarMovimiento}
            >
              <i className="bi bi-save"></i> Grabar Movimiento
            </Button>
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
      
      <ModalEditarMaquilas
        show={showModalMaquilas}
        onHide={() => setShowModalMaquilas(false)}
        productos={productos}
        onGuardar={handleGuardarMaquilas}
      />
    </Container>
  );
};

export default InventarioMaquilas;