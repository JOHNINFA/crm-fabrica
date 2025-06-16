import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import TablaMaquilas from './TablaMaquilas';
import DateSelector from '../common/DateSelector';
import ModalAgregarProducto from './ModalAgregarProducto';
import ModalCambiarUsuario from './ModalCambiarUsuario';
import ModalEditarCantidades from './ModalEditarCantidades';
import ModalEditarExistencias from './ModalEditarExistencias';
import { useProductos } from '../../context/ProductosContext';
import productosMaquilasData from '../../data/productosMaquilas';
import '../../styles/InventarioProduccion.css';
import '../../styles/InventarioMaquilas.css';

const InventarioMaquilas = () => {
  // Obtener productos y funciones del contexto
  const { productos: productosContext, actualizarExistencias, agregarMovimientos } = useProductos();
  
  // Estados para manejar los datos
  const [productos, setProductos] = useState([]);
  const [usuario, setUsuario] = useState('Usuario Predeterminado');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  // Estados para modales
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [showModalCantidades, setShowModalCantidades] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [showModalEditar, setShowModalEditar] = useState(false);

  // Cargar datos iniciales desde el contexto y el archivo de datos
  useEffect(() => {
    if (productosContext && productosContext.length > 0) {
      // Obtener las existencias actuales del contexto
      const existenciasActuales = {};
      productosContext.forEach(producto => {
        existenciasActuales[producto.nombre] = producto.existencias || 0;
      });
      
      // Usar los productos de maquila del archivo de datos
      const productosConCamposMaquilas = productosMaquilasData.map(producto => ({
        ...producto,
        // Usar las existencias del contexto si están disponibles
        existencias: existenciasActuales[producto.nombre] || producto.existencias || 0,
        cantidad: producto.cantidad || 0,
        lote: producto.lote || '',
        fechaVencimiento: producto.fechaVencimiento || ''
      }));
      
      setProductos(productosConCamposMaquilas);
    }
  }, [productosContext]);

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

  const handleGrabarMovimiento = () => {
    // Filtrar productos con cantidad > 0
    const productosConCantidad = productos.filter(p => p.cantidad > 0);
    
    if (productosConCantidad.length === 0) {
      setMensaje({ texto: 'No hay cantidades para registrar', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }
    
    // Validar que todos los productos con cantidad tengan lote
    const sinLote = productosConCantidad.some(p => !p.lote);
    if (sinLote) {
      setMensaje({ texto: 'Todos los productos deben tener un lote', tipo: 'warning' });
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
      
      // Registrar movimiento
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
    
    // Actualizar estado local
    setProductos(nuevosProductos);
    
    // Actualizar existencias en el contexto global
    // Convertir los productos de maquila a formato compatible con el contexto global
    const productosParaContexto = productosContext.map(productoContexto => {
      // Buscar si este producto está en los productos de maquila actualizados
      const productoMaquila = nuevosProductos.find(p => p.nombre === productoContexto.nombre);
      if (productoMaquila) {
        // Si está, usar sus existencias actualizadas
        return {
          ...productoContexto,
          existencias: productoMaquila.existencias
        };
      }
      // Si no está, mantener el producto original
      return productoContexto;
    });
    
    actualizarExistencias(productosParaContexto);
    agregarMovimientos(nuevosMovimientos);
    
    setMensaje({ texto: 'Movimientos registrados correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleDateSelect = (date) => {
    setFechaSeleccionada(date);
  };
  
  const handleAgregarProducto = (nuevoProducto) => {
    const nuevosProductos = [...productos, { ...nuevoProducto, id: Date.now(), cantidad: 0 }];
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    setMensaje({ texto: 'Producto agregado correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleCambiarUsuario = (nuevoUsuario) => {
    setUsuario(nuevoUsuario);
    setMensaje({ texto: 'Usuario cambiado correctamente', tipo: 'info' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  
  const handleGuardarCantidades = (existencias) => {
    const nuevosProductos = productos.map(producto => ({
      ...producto,
      existencias: existencias[producto.id] || 0
    }));
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    
    // Registrar movimientos para cada producto modificado
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ':' + 
                ahora.getMinutes().toString().padStart(2, '0');
    
    const nuevosMovimientos = [];
    
    productos.forEach(producto => {
      const nuevaExistencia = existencias[producto.id] || 0;
      const diferenciaExistencias = nuevaExistencia - (producto.existencias || 0);
      
      if (diferenciaExistencias !== 0) {
        nuevosMovimientos.push({
          id: Date.now() + nuevosMovimientos.length,
          fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
          hora: hora,
          producto: producto.nombre,
          cantidad: Math.abs(diferenciaExistencias),
          tipo: diferenciaExistencias > 0 ? 'Entrada' : 'Salida',
          usuario,
          lote: 'Ajuste',
          fechaVencimiento: '-',
          registrado: true
        });
      }
    });
    
    if (nuevosMovimientos.length > 0) {
      agregarMovimientos(nuevosMovimientos);
    }
    
    setMensaje({ texto: 'Existencias actualizadas correctamente', tipo: 'success' });
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
    const nuevosProductos = productos.map(producto => {
      if (producto.id === id) {
        return { 
          ...producto, 
          existencias: nuevasExistencias
        };
      }
      return producto;
    });
    
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    
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
    
    agregarMovimientos([nuevoMovimiento]);
    
    setMensaje({ texto: 'Existencias actualizadas correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
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

      {/* Tabla de maquilas */}
      <Row className="mb-4">
        <Col>
          <Card className="p-0">
            <Card.Header className="bg-light py-3">
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <TablaMaquilas 
                  productos={productos}
                  onEditarClick={handleEditarClick}
                  handleCantidadChange={handleCantidadChange}
                  handleLoteChange={handleLoteChange}
                  handleFechaVencimientoChange={handleFechaVencimientoChange}
                />
              </div>
            </Card.Body>
          </Card>
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
              onClick={() => setShowModalCantidades(true)}
            >
              <i className="bi bi-pencil-square me-2"></i> Editar
            </Button>
            
            <Button 
              variant="success" 
              className="grabar-btn"
              onClick={handleGrabarMovimiento}
            >
              <i className="bi bi-save me-2"></i> Grabar Movimiento
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
      
      <ModalCambiarUsuario 
        show={showModalUsuario}
        onHide={() => setShowModalUsuario(false)}
        usuarioActual={usuario}
        onCambiar={handleCambiarUsuario}
      />
      
      <ModalEditarCantidades
        show={showModalCantidades}
        onHide={() => setShowModalCantidades(false)}
        productos={productos}
        onGuardar={handleGuardarCantidades}
      />
      
      <ModalEditarExistencias 
        show={showModalEditar}
        onHide={() => setShowModalEditar(false)}
        producto={productoEditar}
        onEditar={handleEditarExistencias}
      />
    </Container>
  );
};

export default InventarioMaquilas;