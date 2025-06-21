import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Table } from 'react-bootstrap';
import TablaInventario from './TablaInventario';
import ModalEditarExistencias from './ModalEditarExistencias';
import ModalCambiarUsuario from './ModalCambiarUsuario';
import ModalEditarCantidades from './ModalEditarCantidades';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
import { loteService } from '../../services/loteService';
import { registroInventarioService } from '../../services/registroInventarioService';
import '../../styles/InventarioProduccion.css';
import '../../styles/TablaKardex.css';



const InventarioProduccion = () => {
  // Context y estados principales
  const { actualizarExistencias, agregarMovimientos, movimientos } = useProductos();
  
  // Estados de producción
  const [usuario, setUsuario] = useState('Usuario Predeterminado');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [lote, setLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [lotes, setLotes] = useState([]);
  
  // Estados de UI
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [showModalCantidades, setShowModalCantidades] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [productosGrabados, setProductosGrabados] = useState({});
  
  // Filtrar movimientos por fecha seleccionada
  const movimientosFiltrados = movimientos.filter(movimiento => {
    if (!movimiento.fecha) return false;
    
    try {
      const fechaMovimiento = movimiento.fecha.includes('-') 
        ? new Date(movimiento.fecha)
        : new Date(movimiento.fecha.split('/').reverse().join('-'));
      
      return fechaMovimiento.toDateString() === fechaSeleccionada.toDateString();
    } catch (error) {
      console.error('Error al procesar fecha:', error);
      return false;
    }
  });
  
  // Cargar productos desde localStorage (POS)
  const cargarProductos = async () => {
    try {
      setCargando(true);
      const posProducts = JSON.parse(localStorage.getItem('products') || '[]');
      
      if (posProducts.length > 0) {
        const productosFormateados = posProducts.map(producto => ({
          id: producto.id,
          nombre: producto.name?.toUpperCase() || "SIN NOMBRE",
          existencias: producto.stock || 0,
          cantidad: 0,
          precio: producto.price || 0,
          categoria: producto.category || "General",
          imagen: producto.image || null
        }));
        
        // Ordenar: AREPA TIPO OBLEA 500GR primero
        const productosOrdenados = productosFormateados.sort((a, b) => {
          if (a.nombre.includes('AREPA TIPO OBLEA 500GR')) return -1;
          if (b.nombre.includes('AREPA TIPO OBLEA 500GR')) return 1;
          return a.nombre.localeCompare(b.nombre);
        });
        
        setProductos(productosOrdenados);
      } else {
        setProductos([]);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setMensaje({ texto: 'Error al cargar productos', tipo: 'danger' });
    } finally {
      setCargando(false);
    }
  };

  // Inicialización del componente
  useEffect(() => {
    // Limpiar localStorage obsoleto
    ['inventarioLotesActuales', 'productosRegistrados'].forEach(key => 
      localStorage.removeItem(key)
    );
    
    // Sincronizar productos con BD
    const sincronizarProductos = async () => {
      try {
        const productosActuales = JSON.parse(localStorage.getItem('products') || '[]');
        const productosValidos = productosActuales
          .filter(p => [17, 18].includes(p.id))
          .map(p => ({ ...p, stock: 0 }));
        
        localStorage.setItem('products', JSON.stringify(productosValidos));
        
        // Cargar existencias desde BD
        const response = await fetch('http://localhost:8000/api/productos/');
        if (response.ok) {
          const productosFromBD = await response.json();
          const productosParaInventario = productosFromBD.map(p => ({
            id: p.id,
            nombre: p.nombre,
            existencias: p.stock_total,
            categoria: p.categoria_nombre || 'General',
            cantidad: 0
          }));
          localStorage.setItem('productos', JSON.stringify(productosParaInventario));
        }
        
        // Notificar cambios
        ['storage', 'productosUpdated'].forEach(event => 
          window.dispatchEvent(new Event(event))
        );
      } catch (error) {
        console.error('Error en sincronización:', error);
      }
    };
    
    sincronizarProductos();
    cargarProductos();
    
    // Event listeners
    const handleStorageChange = (e) => e.key === 'productos' && cargarProductos();
    const handleProductosUpdated = () => cargarProductos();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productosUpdated', handleProductosUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productosUpdated', handleProductosUpdated);
    };
  }, []);
  
  // Manejadores de eventos
  const handleEditarClick = (producto) => {
    setProductoEditar(producto);
    setShowModalEditar(true);
  };

  const handleEditarExistencias = async (id, nuevasExistencias) => {
    try {
      const productoEditado = productos.find(p => p.id === id);
      if (!productoEditado) {
        setMensaje({ texto: 'Producto no encontrado', tipo: 'danger' });
        return;
      }
      
      const diferenciaExistencias = nuevasExistencias - productoEditado.existencias;
      
      // Actualizar productos localmente
      const nuevosProductos = productos.map(producto => 
        producto.id === id 
          ? { 
              ...producto, 
              existencias: nuevasExistencias,
              cantidad: (producto.cantidad || 0) + diferenciaExistencias
            }
          : producto
      );
      
      setProductos(nuevosProductos);
      actualizarExistencias(nuevosProductos);
      
      // Sincronizar con POS
      const posProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedPosProducts = posProducts.map(posProduct => 
        posProduct.id === id 
          ? { ...posProduct, stock: nuevasExistencias }
          : posProduct
      );
      localStorage.setItem('products', JSON.stringify(updatedPosProducts));
      
      // Crear movimiento si hay diferencia
      if (diferenciaExistencias !== 0) {
        const nuevoMovimiento = {
          id: Date.now(),
          fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
          hora: new Date().toLocaleTimeString('es-ES'),
          producto: productoEditado.nombre,
          cantidad: Math.abs(diferenciaExistencias),
          tipo: diferenciaExistencias > 0 ? 'ENTRADA' : 'SALIDA',
          usuario,
          lote: 'Ajuste',
          fechaVencimiento: '-',
          registrado: true
        };
        agregarMovimientos([nuevoMovimiento]);
      }
      
      setMensaje({ texto: 'Existencias actualizadas correctamente', tipo: 'success' });
    } catch (error) {
      console.error('Error al actualizar existencias:', error);
      setMensaje({ texto: 'Error al actualizar existencias', tipo: 'danger' });
    } finally {
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    }
  };

  const handleCantidadChange = (id, cantidad) => {
    const cantidadNumerica = parseInt(cantidad) || 0;
    const productoActual = productos.find(p => p.id === id);
    
    if (!productoActual || productoActual.cantidad === cantidadNumerica) return;
    
    const nuevosProductos = productos.map(producto => 
      producto.id === id ? { ...producto, cantidad: cantidadNumerica } : producto
    );
    
    setProductos(nuevosProductos);
  };
  
  // Guardar cantidades desde modal
  const handleGuardarCantidades = (existencias) => {
    const nuevosProductos = productos.map(producto => ({
      ...producto,
      existencias: existencias[producto.id] || 0
    }));
    
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    
    // Crear movimientos para productos modificados
    const hora = new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const nuevosMovimientos = productos
      .map(producto => {
        const nuevaExistencia = existencias[producto.id] || 0;
        const diferencia = nuevaExistencia - (producto.existencias || 0);
        
        return diferencia !== 0 ? {
          id: Date.now() + Math.random(),
          fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
          hora,
          producto: producto.nombre,
          cantidad: Math.abs(diferencia),
          tipo: diferencia > 0 ? 'Entrada' : 'Salida',
          usuario,
          lote: 'Ajuste',
          fechaVencimiento: '-',
          registrado: true
        } : null;
      })
      .filter(Boolean);
    
    if (nuevosMovimientos.length > 0) {
      agregarMovimientos(nuevosMovimientos);
    }
    
    // Sincronizar con POS
    const posProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const updatedPosProducts = posProducts.map(posProduct => {
      const inventoryProduct = nuevosProductos.find(p => p.id === posProduct.id);
      return inventoryProduct 
        ? { ...posProduct, stock: inventoryProduct.existencias }
        : posProduct;
    });
    localStorage.setItem('products', JSON.stringify(updatedPosProducts));
    
    setMensaje({ texto: 'Existencias actualizadas correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  // Gestión de lotes
  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  
  const handleAgregarLote = () => {
    if (!lote) {
      mostrarMensaje('Debe ingresar un número de lote', 'warning');
      return;
    }

    if (lotes.some(l => l.numero === lote)) {
      mostrarMensaje('Este número de lote ya fue agregado', 'warning');
      return;
    }

    const nuevoLote = {
      id: Date.now(),
      numero: lote,
      fechaVencimiento: fechaVencimiento || ''
    };

    setLotes([...lotes, nuevoLote]);
    setLote('');
    setFechaVencimiento('');
    mostrarMensaje('Lote agregado correctamente', 'success');
  };

  const handleEliminarLote = (id) => {
    setLotes(lotes.filter(lote => lote.id !== id));
  };

  // Registrar producción
  const handleGrabarMovimiento = async () => {
    const productosConCantidad = productos.filter(p => p.cantidad > 0);
    
    // Validaciones
    if (productosConCantidad.length === 0) {
      mostrarMensaje('No hay cantidades para registrar', 'warning');
      return;
    }
    
    if (lotes.length === 0) {
      mostrarMensaje('Debe Ingresar Lote', 'warning');
      return;
    }
    
    const fechaStr = fechaSeleccionada.toLocaleDateString('es-ES');
    const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    // Preparar datos
    const nuevosMovimientos = [];
    const nuevosProductos = productos.map(producto => {
      if (producto.cantidad > 0) {
        const existenciasActuales = parseInt(producto.existencias) || 0;
        const cantidadAAgregar = parseInt(producto.cantidad) || 0;
        
        // Crear movimiento
        const loteInfo = lotes.map(l => l.numero).join(', ');
        nuevosMovimientos.push({
          id: Date.now() + Math.random(),
          fecha: fechaStr,
          hora,
          producto: producto.nombre,
          cantidad: cantidadAAgregar,
          tipo: 'Entrada',
          usuario,
          lote: loteInfo,
          fechaVencimiento: lotes[0]?.fechaVencimiento ? 
            new Date(lotes[0].fechaVencimiento + 'T00:00:00').toLocaleDateString('es-ES') : '-',
          registrado: true
        });
        
        return {
          ...producto,
          existencias: existenciasActuales + cantidadAAgregar,
          cantidad: cantidadAAgregar
        };
      }
      return producto;
    });
    
    // Guardar lotes en BD
    const fechaProduccion = `${fechaSeleccionada.getFullYear()}-${String(fechaSeleccionada.getMonth() + 1).padStart(2, '0')}-${String(fechaSeleccionada.getDate()).padStart(2, '0')}`;
    
    for (const loteLocal of lotes) {
      try {
        const loteData = {
          lote: loteLocal.numero,
          fechaVencimiento: loteLocal.fechaVencimiento || null,
          fechaProduccion,
          usuario
        };
        
        await loteService.create(loteData);
      } catch (error) {
        console.error('Error al guardar lote:', error);
      }
    }
    
    // Guardar cantidades en BD
    for (const producto of productosConCantidad) {
      try {
        const cantidadMovimiento = producto.cantidad;
        
        // Calcular saldo acumulado
        let saldoActual;
        try {
          const response = await fetch('http://localhost:8000/api/registro-inventario/');
          if (response.ok) {
            const todosRegistros = await response.json();
            const registrosProducto = todosRegistros.filter(r => r.producto_id === producto.id);
            
            if (registrosProducto.length > 0) {
              const ultimoRegistro = registrosProducto.sort((a, b) => 
                new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
              )[0];
              saldoActual = ultimoRegistro.saldo + cantidadMovimiento;
            } else {
              saldoActual = cantidadMovimiento;
            }
          } else {
            saldoActual = (producto.existencias || 0) + cantidadMovimiento;
          }
        } catch (error) {
          saldoActual = (producto.existencias || 0) + cantidadMovimiento;
        }
        
        const registroData = {
          productoId: producto.id,
          productoNombre: producto.nombre,
          cantidad: cantidadMovimiento,
          entradas: cantidadMovimiento > 0 ? cantidadMovimiento : 0,
          salidas: cantidadMovimiento < 0 ? Math.abs(cantidadMovimiento) : 0,
          saldo: saldoActual,
          tipoMovimiento: cantidadMovimiento > 0 ? 'ENTRADA' : cantidadMovimiento < 0 ? 'SALIDA' : 'SIN_MOVIMIENTO',
          fechaProduccion,
          usuario
        };
        
        await registroInventarioService.create(registroData);
      } catch (error) {
        console.error('Error al guardar cantidad:', error);
      }
    }
    
    // 🔧 CORREGIDO: Actualizar stock en api_producto
    for (const producto of productosConCantidad) {
      try {
        // Calcular stock correcto: existencias actuales + cantidad agregada
        const existenciasActuales = parseInt(producto.existencias) || 0;
        const cantidadAAgregar = parseInt(producto.cantidad) || 0;
        const stockActual = existenciasActuales + cantidadAAgregar;
        
        console.log(`📊 Actualizando stock BD - ${producto.nombre}: ${existenciasActuales} + ${cantidadAAgregar} = ${stockActual}`);
        
        await fetch(`http://localhost:8000/api/productos/${producto.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_total: stockActual })
        });
      } catch (error) {
        console.error('Error al actualizar stock:', error);
      }
    }
    
    // Sincronizar con POS - CRÍTICO
    try {
      const posProducts = JSON.parse(localStorage.getItem('products') || '[]');
      const updatedPosProducts = posProducts.map(posProduct => {
        const inventoryProduct = nuevosProductos.find(p => p.id === posProduct.id);
        return inventoryProduct 
          ? { ...posProduct, stock: inventoryProduct.existencias }
          : posProduct;
      });
      
      localStorage.setItem('products', JSON.stringify(updatedPosProducts));
      
      // Disparar eventos para notificar cambios
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productosUpdated'));
      
      console.log('✅ Sincronización POS completada:', updatedPosProducts.filter(p => p.stock > 0));
    } catch (error) {
      console.error('❌ Error sincronizando con POS:', error);
    }
    
    // Finalizar
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    agregarMovimientos(nuevosMovimientos);
    setProductosGrabados({});
    
    mostrarMensaje(`Producción registrada para ${fechaStr}`, 'success');
  };

  const handleCambiarUsuario = (nuevoUsuario) => {
    setUsuario(nuevoUsuario);
    mostrarMensaje('Usuario cambiado correctamente', 'info');
  };
  


  const handleDateSelect = async (date) => {
    setFechaSeleccionada(date);
    
    // Limpiar campos
    [setLote, setFechaVencimiento, setLotes, setProductosGrabados].forEach(fn => 
      fn(fn === setLotes || fn === setProductosGrabados ? [] : '')
    );
    
    const fechaStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    try {
      // Cargar lotes desde BD
      const lotesFromBD = await loteService.getByFecha(fechaStr);
      if (lotesFromBD?.length > 0) {
        const lotesFormateados = lotesFromBD.map(lote => ({
          id: lote.id,
          numero: lote.lote,
          fechaVencimiento: lote.fecha_vencimiento || ''
        }));
        setLotes(lotesFormateados);
      }
      
      // Cargar cantidades desde BD
      const registrosFromBD = await registroInventarioService.getByFecha(fechaStr);
      if (registrosFromBD?.length > 0) {
        // Cargar usuario del día
        const usuarioDelDia = registrosFromBD[0].usuario;
        if (usuarioDelDia && usuarioDelDia !== 'Sistema') {
          setUsuario(usuarioDelDia);
        }
        
        // Actualizar cantidades
        if (productos.length > 0) {
          const productosActualizados = productos.map(producto => {
            const registro = registrosFromBD.find(r => r.producto_id === producto.id);
            return {
              ...producto,
              cantidad: registro ? registro.cantidad : 0
            };
          });
          setProductos(productosActualizados);
        } else {
          setTimeout(() => handleDateSelect(date), 100);
          return;
        }
      } else {
        // Resetear si no hay registros
        setUsuario('Usuario Predeterminado');
        if (productos.length > 0) {
          const productosReseteados = productos.map(producto => ({
            ...producto,
            cantidad: 0
          }));
          setProductos(productosReseteados);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      const productosReseteados = productos.map(producto => ({
        ...producto,
        cantidad: 0
      }));
      setProductos(productosReseteados);
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
                              new Date(lote.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-ES') : 
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
              productosGrabados={productosGrabados}
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
              className="grabar-btn me-2"
              onClick={handleGrabarMovimiento}
            >
              <i className="bi bi-save me-2"></i> Grabar Movimiento
            </Button>
            
            {/* Botón para desbloquear productos grabados */}
            {Object.keys(productosGrabados).length > 0 && (
              <Button 
                variant="outline-secondary" 
                onClick={() => setProductosGrabados({})}
                className="me-2"
              >
                <i className="bi bi-unlock me-2"></i> Desbloquear Campos
              </Button>
            )}
            


          </div>
        </Col>
      </Row>

      {/* Modales */}
    
      
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