import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Table } from 'react-bootstrap';
import TablaInventario from './TablaInventario';
import ModalAgregarProducto from './ModalAgregarProducto';
import ModalEditarExistencias from './ModalEditarExistencias';
import ModalCambiarUsuario from './ModalCambiarUsuario';
import ModalEditarCantidades from './ModalEditarCantidades';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
import '../../styles/InventarioProduccion.css';
import '../../styles/TablaKardex.css';



const InventarioProduccion = () => {
  // Obtener funciones del contexto (no usamos productosContext porque definimos nuestros propios productos)
  const { actualizarExistencias, agregarMovimientos } = useProductos();
  
  // Estados para manejar los datos
  const [usuario, setUsuario] = useState('Usuario Predeterminado');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [lote, setLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [lotes, setLotes] = useState([]);
  
  // Estados para modales
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [showModalCantidades, setShowModalCantidades] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Inicializar productos directamente en el estado inicial
  const [productos, setProductos] = useState([
    { id: 1, nombre: 'AREPA TIPO OBLEA', existencias: 0, cantidad: 0 },
    { id: 2, nombre: 'AREPA MEDIANA', existencias: 0, cantidad: 0 },
    { id: 3, nombre: 'AREPA TIPO PINCHO', existencias: 0, cantidad: 0 },
    { id: 4, nombre: 'AREPA CON QUESO-CORRIENTE', existencias: 0, cantidad: 0 },
    { id: 5, nombre: 'AREPA CON QUESO-ESPECIAL GRANDE', existencias: 0, cantidad: 0 },
    { id: 6, nombre: 'AREPA CON QUESO-ESPECIAL PEQUEÑA', existencias: 0, cantidad: 0 },
    { id: 7, nombre: 'AREPA CON QUESO MINI X 10', existencias: 0, cantidad: 0 },
    { id: 8, nombre: 'AREPA CON QUESO CUADRADA', existencias: 0, cantidad: 0 },
    { id: 14, nombre: 'AREPA SANTADERANA', existencias: 0, cantidad: 0 },
    { id: 17, nombre: 'AREPA CON SEMILLA DE QUINUA', existencias: 0, cantidad: 0 },
    { id: 18, nombre: 'AREPA CON SEMILLA DE CHIA', existencias: 0, cantidad: 0 },
    { id: 19, nombre: 'AREPA CON SEMILLA DE AJONJOLI', existencias: 0, cantidad: 0 },
    { id: 20, nombre: 'AREPA CON SEMILLA DE LINANZA', existencias: 0, cantidad: 0 },
    { id: 21, nombre: 'AREPA CON SEMILLA DE GIRASOL', existencias: 0, cantidad: 0 },
    { id: 22, nombre: 'AREPA CHORICERA', existencias: 0, cantidad: 0 },
    { id: 23, nombre: 'AREPA LONCHERIA', existencias: 0, cantidad: 0 },
    { id: 24, nombre: 'AREPA CON MARGARINA Y SAL', existencias: 0, cantidad: 0 },
    { id: 25, nombre: 'YUCAREPA', existencias: 0, cantidad: 0 },
    { id: 26, nombre: 'AREPA TIPO ASADERO X 10', existencias: 0, cantidad: 0 },
    { id: 27, nombre: 'AREPA PARA RELLENAR #1', existencias: 0, cantidad: 0 },
    { id: 28, nombre: 'AREPA PARA RELLENAR #2', existencias: 0, cantidad: 0 },
    { id: 29, nombre: 'AREPA PARA RELLENAR #3', existencias: 0, cantidad: 0 },
    { id: 30, nombre: 'PORCION DE AREPAS X 2 UND', existencias: 0, cantidad: 0 },
    { id: 31, nombre: 'PORCION DE AREPAS X 3 UND', existencias: 0, cantidad: 0 },
    { id: 32, nombre: 'PORCION DE AREPAS X 4 UND', existencias: 0, cantidad: 0 },
    { id: 33, nombre: 'PORCION DE AREPAS X 5 UND', existencias: 0, cantidad: 0 },
    { id: 34, nombre: 'AREPA SUPER OBLEA', existencias: 0, cantidad: 0 },
    { id: 35, nombre: 'BLOQUE DE MASA', existencias: 0, cantidad: 0 },
    { id: 36, nombre: 'LIBRAS DE MASA', existencias: 0, cantidad: 0 },
    { id: 37, nombre: 'MUTE BOYACENSE', existencias: 0, cantidad: 0 },
    { id: 38, nombre: 'LIBRA DE MAIZ PETO', existencias: 0, cantidad: 0 }
  ]);
  
  // Obtener movimientos del contexto
  const { movimientos } = useProductos();
  
  // Filtrar movimientos según la fecha seleccionada
  const movimientosFiltrados = movimientos.filter(movimiento => {
    if (!movimiento.fecha) {
      console.error('Movimiento sin fecha encontrado:', movimiento);
      return false;
    }
    
    try {
      // Intentar convertir la fecha del movimiento a objeto Date
      // Manejar diferentes formatos de fecha (YYYY-MM-DD o DD/MM/YYYY)
      let fechaMovimiento;
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
      
      // Filtrar por fecha
      return mismaFecha;
    } catch (error) {
      console.error('Error al procesar la fecha del movimiento:', movimiento.fecha, error);
      return false;
    }
  });
  
  // Actualizar el estado de los productos basado en los movimientos de la fecha seleccionada
  useEffect(() => {
    // Solo proceder si hay productos
    if (productos.length === 0) {
      console.log("No hay productos para actualizar");
      return;
    }
    
    console.log("Actualizando productos con movimientos:", productos.length, "productos disponibles");
    
    // Intentar cargar productos guardados para esta fecha
    const fechaStr = fechaSeleccionada.toLocaleDateString('es-ES');
    try {
      const productosGuardadosStr = localStorage.getItem('productosRegistrados') || '{}';
      const productosGuardados = JSON.parse(productosGuardadosStr);
      
      if (productosGuardados[fechaStr]) {
        // Si hay productos guardados para esta fecha, usarlos
        const productosActualizados = productos.map(producto => {
          const productoGuardado = productosGuardados[fechaStr].find(p => p.id === producto.id);
          if (productoGuardado) {
            return {
              ...producto,
              cantidad: productoGuardado.cantidad
            };
          }
          return producto;
        });
        
        setProductos(productosActualizados);
        return; // Salir temprano si encontramos productos guardados
      }
    } catch (error) {
      console.error('Error al cargar productos guardados:', error);
    }
    
    // Si no hay productos guardados, proceder con la lógica normal
    // Crear un mapa para agrupar movimientos por producto
    const movimientosPorProducto = {};
    
    movimientosFiltrados.forEach(movimiento => {
      if (!movimientosPorProducto[movimiento.producto]) {
        movimientosPorProducto[movimiento.producto] = [];
      }
      movimientosPorProducto[movimiento.producto].push(movimiento);
    });
    
    // Ya no necesitamos actualizar las cantidades registradas
    // porque hemos eliminado esa funcionalidad
    
    // Forzar actualización de la UI
    setProductos([...productos]);
  }, [fechaSeleccionada]);

  // Manejadores de eventos
  const handleAgregarProducto = (nuevoProducto) => {
    const nuevosProductos = [...productos, { ...nuevoProducto, id: Date.now(), cantidad: 0 }];
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
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
    const nuevosProductos = productos.map(producto => {
      if (producto.id === id) {
        // Actualizar también la cantidad en el input
        const cantidadActual = producto.cantidad || 0;
        return { 
          ...producto, 
          existencias: nuevasExistencias,
          cantidad: cantidadActual + diferenciaExistencias
        };
      }
      return producto;
    });
    
    // Actualizar los inputs de cantidad en la UI
    setTimeout(() => {
      const inputs = document.querySelectorAll('.quantity-input');
      inputs.forEach((input, index) => {
        if (index < productos.length && productos[index].id === id) {
          input.value = nuevosProductos.find(p => p.id === id).cantidad;
        }
      });
    }, 100);
    
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
    
    // Guardar el estado actualizado en localStorage
    try {
      const productosGuardadosStr = localStorage.getItem('productosRegistrados') || '{}';
      const productosGuardados = JSON.parse(productosGuardadosStr);
      
      const fechaStr = fechaSeleccionada.toLocaleDateString('es-ES');
      if (productosGuardados[fechaStr]) {
        // Actualizar el producto específico
        const productoIndex = productosGuardados[fechaStr].findIndex(p => p.id === id);
        if (productoIndex !== -1) {
          productosGuardados[fechaStr][productoIndex] = {
            ...productosGuardados[fechaStr][productoIndex],
            existencias: nuevasExistencias,
            cantidad: nuevosProductos.find(p => p.id === id).cantidad
          };
        }
        localStorage.setItem('productosRegistrados', JSON.stringify(productosGuardados));
      }
    } catch (error) {
      console.error('Error al actualizar productos guardados:', error);
    }
    
    setMensaje({ texto: 'Existencias actualizadas correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleCantidadChange = (id, cantidad) => {
    // Almacenar las cantidades en un objeto separado para evitar re-renderizados
    const cantidadNumerica = parseInt(cantidad) || 0;
    
    // Actualizar directamente el producto específico sin recrear todo el array
    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
      productos[index].cantidad = cantidadNumerica;
    }
  };
  
  // Función para manejar cambios de existencias desde el modal
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

  const handleAgregarLote = () => {
    if (!lote) {
      setMensaje({ texto: 'Debe ingresar un número de lote', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }

    // Verificar si el lote ya existe
    if (lotes.some(l => l.numero === lote)) {
      setMensaje({ texto: 'Este número de lote ya fue agregado', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }

    const nuevoLote = {
      id: Date.now(),
      numero: lote,
      fechaVencimiento: fechaVencimiento || '' // Puede ser vacío
    };

    setLotes([...lotes, nuevoLote]);
    setLote('');
    setFechaVencimiento('');
    setMensaje({ texto: 'Lote agregado correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleEliminarLote = (id) => {
    setLotes(lotes.filter(lote => lote.id !== id));
  };

  const handleGrabarMovimiento = () => {
    // Recopilar las cantidades de los inputs
    const inputs = document.querySelectorAll('.quantity-input');
    inputs.forEach((input, index) => {
      if (index < productos.length) {
        productos[index].cantidad = parseInt(input.value) || 0;
      }
    });
    
    // Guardar el estado actual de los productos para esta fecha
    try {
      const productosGuardadosStr = localStorage.getItem('productosRegistrados') || '{}';
      const productosGuardados = JSON.parse(productosGuardadosStr);
      
      // Guardar productos con sus cantidades para esta fecha
      const fechaStr = fechaSeleccionada.toLocaleDateString('es-ES');
      productosGuardados[fechaStr] = productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        existencias: p.existencias
      }));
      
      localStorage.setItem('productosRegistrados', JSON.stringify(productosGuardados));
    } catch (error) {
      console.error('Error al guardar productos:', error);
    }
    
    // Filtrar productos con cantidad > 0
    const productosConCantidad = productos.filter(p => p.cantidad > 0);
    
    if (productosConCantidad.length === 0) {
      setMensaje({ texto: 'No hay cantidades para registrar', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }
    
    if (lotes.length === 0) {
      setMensaje({ texto: 'Debe Ingresar Lote', tipo: 'warning' });
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
        // Ya no acumulamos la cantidad registrada
        // No resetear la cantidad para mantenerla visible
      };
      
      console.log('Actualizando existencias:', {
        producto: producto.nombre,
        existenciasAntes: existenciasActuales,
        cantidadAgregada: cantidadAAgregar,
        existenciasDespues: existenciasActuales + cantidadAAgregar
      });
      
      // Crear un movimiento por cada lote
      lotes.forEach(lote => {
        nuevosMovimientos.push({
          id: Date.now() + nuevosMovimientos.length,
          fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
          hora: hora,
          producto: producto.nombre,
          cantidad: producto.cantidad / lotes.length, // Distribuir la cantidad entre los lotes
          tipo: 'Entrada',
          usuario,
          lote: lote.numero,
          fechaVencimiento: lote.fechaVencimiento ? new Date(lote.fechaVencimiento).toLocaleDateString('es-ES') : '-',
          registrado: true // Marcar como registrado
        });
      });
    });
    
    // Actualizar estado local y contexto
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    agregarMovimientos(nuevosMovimientos);
    
    // Mantener los lotes para que se muestren en la tabla
    // Guardar los lotes en localStorage para recuperarlos por fecha
    const lotesConFecha = {
      fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
      lotes: lotes
    };
    try {
      // Obtener lotes guardados anteriormente
      const lotesGuardadosStr = localStorage.getItem('lotesRegistrados') || '[]';
      const lotesGuardados = JSON.parse(lotesGuardadosStr);
      
      // Filtrar lotes de la misma fecha si existen
      const lotesFiltrados = lotesGuardados.filter(item => item.fecha !== lotesConFecha.fecha);
      
      // Añadir los nuevos lotes
      lotesFiltrados.push(lotesConFecha);
      
      // Guardar en localStorage
      localStorage.setItem('lotesRegistrados', JSON.stringify(lotesFiltrados));
    } catch (error) {
      console.error('Error al guardar lotes:', error);
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
    
    // Al cambiar la fecha, cargar los lotes guardados para esa fecha
    const fechaStr = date.toLocaleDateString('es-ES');
    try {
      const lotesGuardadosStr = localStorage.getItem('lotesRegistrados') || '[]';
      const lotesGuardados = JSON.parse(lotesGuardadosStr);
      
      // Buscar lotes para la fecha seleccionada
      const lotesFecha = lotesGuardados.find(item => item.fecha === fechaStr);
      
      if (lotesFecha && lotesFecha.lotes) {
        setLotes(lotesFecha.lotes);
      } else {
        // Si no hay lotes guardados para esta fecha, resetear
        setLotes([]);
      }
    } catch (error) {
      console.error('Error al cargar lotes:', error);
      setLotes([]);
    }
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

      {/* Fila con lotes y tabla de lotes */}
      <Row className="mb-4">
        {/* Campos de Lote y Fecha de Vencimiento */}
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <Card className="p-2 h-100">
            <Form.Group className="mb-2">
              <Form.Label className="fw-bold small-text" style={{color: '#1e293b'}}>LOTE</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Lote"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  className="fw-bold me-1 compact-input"
                  style={{ width: "498px" }}
                />
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={handleAgregarLote}
                >
                  <i className="bi bi-plus-circle"></i>
                </Button>
              </div>
            </Form.Group>
            
            <Form.Group>
              <Form.Label className="fw-bold small-text" style={{color: '#1e293b'}}>VENCIMIENTO</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="me-1 compact-input"
                />
                <Button 
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAgregarLote}
                >
                  <i className="bi bi-calendar-plus"></i>
                </Button>
              </div>
            </Form.Group>
          </Card>
        </Col>

        {/* Tabla de lotes */}
        <Col xs={12} md={6}>
          <Card className="p-3 h-100">
            <h6 className="mb-2 fw-bold" style={{color: '#1e293b'}}>Lotes Agregados:</h6>
            {lotes.length > 0 ? (
              <div style={{maxHeight: '150px', overflowY: 'auto'}}>
                <div className="table-responsive">
                  <Table className="table-kardex" size="sm">
                    <thead>
                      <tr>
                        <th>Lote</th>
                        <th>Vencimiento</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotes.map(lote => (
                        <tr key={lote.id}>
                          <td>{lote.numero}</td>
                          <td>
                            {lote.fechaVencimiento ? 
                              new Date(lote.fechaVencimiento).toLocaleDateString('es-ES') : 
                              '-'
                            }
                          </td>
                          <td className="text-center">
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleEliminarLote(lote.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-muted">No hay lotes agregados</p>
            )}
          </Card>
        </Col>
      </Row>

      {/* Tabla de inventario */}
      <Row className="mb-4">
        <Col>
          <div className="table-responsive">
            <TablaInventario 
              productos={productos} 
              onEditarClick={handleEditarClick}
              handleCantidadChange={handleCantidadChange}
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
      
      <ModalEditarCantidades
        show={showModalCantidades}
        onHide={() => setShowModalCantidades(false)}
        productos={productos}
        onGuardar={handleGuardarCantidades}
      />
    </Container>
  );
};

export default InventarioProduccion;