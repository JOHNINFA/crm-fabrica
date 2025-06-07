import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import TablaMaquilas from './TablaMaquilas';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
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

  // Cargar datos iniciales desde el contexto
  useEffect(() => {
    if (productosContext && productosContext.length > 0) {
      // Asegurarse de que los productos tengan los campos necesarios para maquilas
      const productosConCamposMaquilas = productosContext.map(producto => ({
        ...producto,
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
    
    // Actualizar estado local y contexto
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    agregarMovimientos(nuevosMovimientos);
    
    setMensaje({ texto: 'Movimientos registrados correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleDateSelect = (date) => {
    setFechaSeleccionada(date);
  };

  return (
    <Container fluid className="py-4">
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
              <h5 className="mb-0">Ingreso de Maquilas</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <TablaMaquilas 
                  productos={productos}
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
        <Col className="text-end">
          <Button 
            variant="success" 
            className="grabar-btn"
            onClick={handleGrabarMovimiento}
          >
            <i className="bi bi-save"></i> Grabar Movimiento
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default InventarioMaquilas;