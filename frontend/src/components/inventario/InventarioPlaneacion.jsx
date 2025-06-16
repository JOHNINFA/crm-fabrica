import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Table } from 'react-bootstrap';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
import '../../styles/InventarioProduccion.css';
import '../../styles/InventarioPlaneacion.css';
import '../../styles/TablaKardex.css';

const InventarioPlaneacion = () => {
  // Obtener productos del contexto
  const { productos: productosContext } = useProductos();
  
  // Estados para manejar los datos
  const [productos, setProductos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [planeacion, setPlaneacion] = useState([]);
  
  // Cargar datos iniciales desde el contexto
  useEffect(() => {
    if (productosContext && productosContext.length > 0) {
      const productosConPlaneacion = productosContext.map(producto => ({
        ...producto,
        solicitado: 0,
        orden: 0
      }));
      setProductos(productosConPlaneacion);
    }
  }, [productosContext]);

  const handleSolicitadoChange = (id, cantidad) => {
    const nuevosProductos = productos.map(producto => 
      producto.id === id ? { ...producto, solicitado: parseInt(cantidad) || 0 } : producto
    );
    setProductos(nuevosProductos);
  };

  const handleOrdenChange = (id, cantidad) => {
    const nuevosProductos = productos.map(producto => 
      producto.id === id ? { ...producto, orden: parseInt(cantidad) || 0 } : producto
    );
    setProductos(nuevosProductos);
  };

  const getExistenciasClass = (existencias) => {
    if (existencias <= 0) return 'bg-light-red';
    if (existencias <= 10) return 'bg-light-yellow';
    return 'bg-light-green';
  };

  const handleGuardarPlaneacion = () => {
    // Filtrar productos con solicitado > 0 o orden > 0
    const productosConPlaneacion = productos.filter(p => p.solicitado > 0 || p.orden > 0);
    
    if (productosConPlaneacion.length === 0) {
      setMensaje({ texto: 'No hay cantidades planeadas para registrar', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }
    
    // Crear nueva planeación
    const nuevaPlaneacion = {
      id: Date.now(),
      fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
      productos: productosConPlaneacion.map(p => ({
        id: p.id,
        nombre: p.nombre,
        solicitado: p.solicitado,
        orden: p.orden
      }))
    };
    
    setPlaneacion([nuevaPlaneacion, ...planeacion]);
    
    // Resetear cantidades planeadas
    const productosReseteados = productos.map(producto => ({
      ...producto,
      solicitado: 0,
      orden: 0
    }));
    setProductos(productosReseteados);
    
    setMensaje({ texto: 'Planeación guardada correctamente', tipo: 'success' });
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
          <p className="text-muted fw-medium" style={{fontSize: '0.95rem'}}>Planifique la cantidad de productos a fabricar para una fecha específica.</p>
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

      {/* Tabla de planeación */}
      <Row className="mb-4">
        <Col>
          <div className="table-container">
            <Table className="align-middle mb-0 table-kardex">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '40%' }}>Producto</th>
                  <th scope="col" className="text-center" style={{ width: '20%' }}>Existencias</th>
                  <th scope="col" className="text-center" style={{ width: '20%' }}>Solicitadas</th>
                  <th scope="col" className="text-center" style={{ width: '20%' }}>Orden</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id} className="product-row">
                    <td className="fw-medium" style={{color: '#1e293b'}}>{producto.nombre}</td>
                    <td className="text-center">
                      <span className={`${getExistenciasClass(producto.existencias)} rounded-pill-sm`}>
                        {producto.existencias || 0} und
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <Form.Control
                          type="number"
                          min="0"
                          value={producto.solicitado || 0}
                          onChange={(e) => handleSolicitadoChange(producto.id, e.target.value)}
                          className="quantity-input"
                          aria-label={`Cantidad solicitada de ${producto.nombre}`}
                        />
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center">
                        <Form.Control
                          type="number"
                          min="0"
                          value={producto.orden || 0}
                          onChange={(e) => handleOrdenChange(producto.id, e.target.value)}
                          className="quantity-input"
                          aria-label={`Orden de ${producto.nombre}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      <p className="text-muted">No hay productos disponibles</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>

      {/* Botón guardar planeación */}
      <Row className="mb-4">
        <Col className="text-end">
          <Button 
            variant="primary" 
            className="grabar-btn rounded-pill-sm"
            style={{backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1.5rem'}}
            onClick={handleGuardarPlaneacion}
          >
            <i className="bi bi-save me-2"></i> Guardar Planeación
          </Button>
        </Col>
      </Row>

      {/* Historial de planeación */}
      {planeacion.length > 0 && (
        <Row className="mt-5">
          <Col>
            <h5 className="mb-3 fw-bold" style={{color: '#1e293b'}}>Historial de Planeación</h5>
            <div className="table-container">
              <Table className="align-middle mb-0 table-kardex">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Productos</th>
                    <th scope="col" className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {planeacion.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <span className="rounded-pill-sm" style={{backgroundColor: '#f8fafc', color: '#475569'}}>
                          {plan.fecha}
                        </span>
                      </td>
                      <td>
                        {plan.productos.map(p => (
                          <div key={p.id} className="mb-1">
                            <span className="fw-medium" style={{color: '#1e293b'}}>{p.nombre}:</span>
                            <span className="rounded-pill-sm bg-light-green ms-2">
                              <i className="bi bi-box-seam me-1"></i> {p.solicitado} und
                            </span>
                            <span className="rounded-pill-sm bg-light-yellow ms-2">
                              <i className="bi bi-clipboard-check me-1"></i> {p.orden} und
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill-sm"
                          style={{backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe'}}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Ver Detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default InventarioPlaneacion;