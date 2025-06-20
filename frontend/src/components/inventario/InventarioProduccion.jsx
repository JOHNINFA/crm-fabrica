/**
 * InventarioProduccion.jsx
 * 
 * Este componente maneja la pantalla de producción del inventario.
 * Permite registrar la producción de productos, gestionar lotes y fechas de vencimiento,
 * y actualizar las existencias en el inventario.
 * 
 * Características principales:
 * - Gestión de lotes y fechas de vencimiento
 * - Registro de cantidades producidas por producto
 * - Persistencia de datos entre navegaciones usando localStorage
 * - Sincronización con el sistema POS
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Table } from 'react-bootstrap';
import TablaInventario from './TablaInventario';
// // import ModalAgregarProducto from './ModalAgregarProducto'; // Eliminado // Eliminado para optimizar
import ModalEditarExistencias from './ModalEditarExistencias';
import ModalCambiarUsuario from './ModalCambiarUsuario';
import ModalEditarCantidades from './ModalEditarCantidades';
import DateSelector from '../common/DateSelector';
import { useProductos } from '../../context/ProductosContext';
import { productoService, movimientoService } from '../../services/api';
import { loteService } from '../../services/loteService';
import '../../styles/InventarioProduccion.css';
import '../../styles/TablaKardex.css';



const InventarioProduccion = () => {
  /**
   * SECCIÓN 1: ESTADOS Y CONTEXTO
   * 
   * Esta sección define todos los estados que maneja el componente y
   * obtiene las funciones necesarias del contexto de productos.
   */
  
  // Obtener funciones del contexto para actualizar el inventario global
  const { actualizarExistencias, agregarMovimientos } = useProductos();
  
  // Estados para manejar los datos de producción
  const [usuario, setUsuario] = useState('Usuario Predeterminado'); // Usuario actual
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date()); // Fecha de producción
  const [lote, setLote] = useState(''); // Input para nuevo lote
  const [fechaVencimiento, setFechaVencimiento] = useState(''); // Input para fecha de vencimiento
  const [lotes, setLotes] = useState([]); // Lista de lotes agregados
  
  // Estados para controlar la visibilidad de los modales
  // Estado para modal de agregar producto eliminado
  const [showModalEditar, setShowModalEditar] = useState(false); // Modal para editar existencias
  const [showModalUsuario, setShowModalUsuario] = useState(false); // Modal para cambiar usuario
  const [showModalCantidades, setShowModalCantidades] = useState(false); // Modal para editar cantidades
  const [productoEditar, setProductoEditar] = useState(null); // Producto seleccionado para editar
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // Mensajes de alerta

  // Estados para la lista de productos
  const [productos, setProductos] = useState([]); // Lista de productos
  const [cargando, setCargando] = useState(true); // Indicador de carga
  // Estado para controlar qué productos han sido grabados (para UI)
  const [productosGrabados, setProductosGrabados] = useState({});
  
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
  
  /**
   * SECCIÓN 3: CARGA DE PRODUCTOS
   * 
   * Esta función carga los productos desde localStorage (sistema POS)
   * y recupera las cantidades guardadas para la fecha seleccionada.
   */
  const cargarProductos = async () => {
    try {
      setCargando(true);
      
      // Obtener productos del sistema POS (almacenados en localStorage)
      const posProductsStr = localStorage.getItem('products');
      const posProducts = posProductsStr ? JSON.parse(posProductsStr) : [];
      
      if (posProducts.length > 0) {
        // Transformar los productos del POS al formato esperado por el componente
        const productosFormateados = posProducts.map(producto => ({
          id: producto.id,
          nombre: producto.name ? producto.name.toUpperCase() : "SIN NOMBRE",
          existencias: producto.stock || 0,
          cantidad: 0, // Inicializar cantidad en 0, pero se actualizará después si hay datos guardados
          precio: producto.price || 0,
          categoria: producto.category || "General",
          imagen: producto.image || null
        }));
        
        // Actualizar el estado con los nuevos productos (una sola vez)
        setProductos(productosFormateados);
        
        // Intentar cargar datos guardados para la fecha actual
        const fechaStr = fechaSeleccionada.toLocaleDateString('es-ES');
        try {
          // Cargar productos guardados
          const productosGuardadosStr = localStorage.getItem('productosRegistrados') || '{}';
          const productosGuardados = JSON.parse(productosGuardadosStr);
          
          if (productosGuardados[fechaStr]) {
            // Si hay productos guardados para esta fecha, actualizar cantidades
            const productosActualizados = productosFormateados.map(producto => {
              const productoGuardado = productosGuardados[fechaStr].find(p => p.id === producto.id);
              if (productoGuardado) {
                return {
                  ...producto,
                  cantidad: productoGuardado.cantidad || 0
                };
              }
              return producto;
            });
            
            // Actualizar productos con las cantidades guardadas
            setProductos(productosActualizados);
          }
        } catch (error) {
          console.error('Error al cargar productos guardados:', error);
        }
      } else {
        // Si no hay productos en el POS, mostrar mensaje
        setProductos([]);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setMensaje({ 
        texto: 'Error al cargar productos. Por favor, intente de nuevo.', 
        tipo: 'danger' 
      });
    } finally {
      setCargando(false);
    }
  };

  // Cargar lotes guardados para la fecha seleccionada
  const cargarLotesGuardados = () => {
    try {
      const lotesGuardadosStr = localStorage.getItem('inventarioLotesActuales');
      if (lotesGuardadosStr) {
        const lotesGuardados = JSON.parse(lotesGuardadosStr);
        if (lotesGuardados?.length > 0) {
          setLotes(lotesGuardados);
        }
      }
    } catch (error) {
      console.error('Error al cargar lotes guardados:', error);
    }
  };

  /**
   * SECCIÓN 4: EFECTOS (LIFECYCLE)
   * 
   * Estos efectos manejan la persistencia de datos y la sincronización
   * entre componentes cuando cambian los datos.
   */
  
  // Efecto para guardar los lotes automáticamente cuando cambian
  useEffect(() => {
    if (lotes && lotes.length > 0) {
      localStorage.setItem('inventarioLotesActuales', JSON.stringify(lotes));
    }
  }, [lotes]);

  // Efecto que se ejecuta al montar el componente para cargar datos iniciales
  useEffect(() => {
    // Cargar productos y lotes guardados
    cargarProductos();
    cargarLotesGuardados();
    
    // Detectar cambios en localStorage (para sincronización entre pestañas)
    const handleStorageChange = (e) => {
      if (e.key === 'productos') {
        cargarProductos();
      }
    };
    
    // Detectar evento personalizado de actualización de productos
    const handleProductosUpdated = () => {
      cargarProductos();
    };
    
    // Registrar event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productosUpdated', handleProductosUpdated);
    
    // Limpiar event listeners al desmontar el componente
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productosUpdated', handleProductosUpdated);
    };
  }, []);
  
  // Cargar movimientos de inventario para la fecha seleccionada
  useEffect(() => {
    // Solo proceder si hay productos y no estamos cargando
    if (productos.length === 0 || cargando) {
      return;
    }
    
    const cargarMovimientosPorFecha = async () => {
      try {
        // Intentar cargar productos guardados para esta fecha (mantener compatibilidad)
        const fechaStr = fechaSeleccionada.toLocaleDateString('es-ES');
        const productosGuardadosStr = localStorage.getItem('productosRegistrados') || '{}';
        const productosGuardados = JSON.parse(productosGuardadosStr);
        
        if (productosGuardados[fechaStr]) {
          // Actualizar cantidades desde los productos guardados
          const productosActualizados = productos.map(producto => {
            const productoGuardado = productosGuardados[fechaStr].find(p => p.id === producto.id);
            if (productoGuardado) {
              return {
                ...producto,
                cantidad: productoGuardado.cantidad || 0
              };
            }
            return producto;
          });
          
          // Actualizar productos con las cantidades guardadas
          setProductos(productosActualizados);
        }
      } catch (error) {
        console.error('Error al cargar productos guardados:', error);
      }
    };
    
    cargarMovimientosPorFecha();
  }, [fechaSeleccionada]);

  // Manejadores de eventos
  // Función handleAgregarProducto eliminada para optimizar el código

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
      
      const existenciasAnteriores = productoEditado.existencias;
      const diferenciaExistencias = nuevasExistencias - existenciasAnteriores;
      const tipoMovimiento = diferenciaExistencias > 0 ? 'ENTRADA' : 'SALIDA';
      
      // Actualizar localmente sin usar la API
      // Actualizar productos localmente
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
      
      setProductos(nuevosProductos);
      actualizarExistencias(nuevosProductos);
      
      // Sincronizar con el POS
      try {
        // Obtener productos del POS
        const posProductsStr = localStorage.getItem('products');
        if (posProductsStr) {
          const posProducts = JSON.parse(posProductsStr);
          
          // Actualizar existencias en productos del POS
          const updatedPosProducts = posProducts.map(posProduct => {
            if (posProduct.id === id) {
              // Actualizar existencias
              return {
                ...posProduct,
                stock: nuevasExistencias
              };
            }
            return posProduct;
          });
          
          // Guardar productos actualizados en localStorage
          localStorage.setItem('products', JSON.stringify(updatedPosProducts));
        }
      } catch (error) {
        console.error('Error al sincronizar con POS:', error);
      }
      
      // Crear un movimiento local
      if (diferenciaExistencias !== 0) {
        const nuevoMovimiento = {
          id: Date.now(),
          fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
          hora: new Date().toLocaleTimeString('es-ES'),
          producto: productoEditado.nombre,
          cantidad: Math.abs(diferenciaExistencias),
          tipo: tipoMovimiento,
          usuario: usuario,
          lote: 'Ajuste',
          fechaVencimiento: '-',
          registrado: true
        };
        
        agregarMovimientos([nuevoMovimiento]);
      }
      
      setMensaje({ texto: 'Existencias actualizadas correctamente y sincronizadas con POS', tipo: 'success' });
    } catch (error) {
      console.error('Error al actualizar existencias:', error);
      setMensaje({ texto: 'Error al actualizar existencias', tipo: 'danger' });
    } finally {
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    }
  };

  const handleCantidadChange = (id, cantidad) => {
    // Convertir a número
    const cantidadNumerica = parseInt(cantidad) || 0;
    
    // Verificar si el producto existe y si la cantidad ha cambiado realmente
    const productoActual = productos.find(p => p.id === id);
    if (!productoActual || productoActual.cantidad === cantidadNumerica) {
      return; // No hacer nada si no hay cambios
    }
    
    // Crear una copia del array de productos y actualizar solo el producto específico
    const nuevosProductos = productos.map(producto => 
      producto.id === id 
        ? { ...producto, cantidad: cantidadNumerica } 
        : producto
    );
    
    // Actualizar el estado con la nueva copia
    setProductos(nuevosProductos);
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
    
    // Sincronizar con el POS
    try {
      // Obtener productos del POS
      const posProductsStr = localStorage.getItem('products');
      if (posProductsStr) {
        const posProducts = JSON.parse(posProductsStr);
        
        // Actualizar existencias en productos del POS
        const updatedPosProducts = posProducts.map(posProduct => {
          // Buscar el producto correspondiente en nuevosProductos
          const inventoryProduct = nuevosProductos.find(p => p.id === posProduct.id);
          if (inventoryProduct) {
            // Actualizar existencias
            return {
              ...posProduct,
              stock: inventoryProduct.existencias
            };
          }
          return posProduct;
        });
        
        // Guardar productos actualizados en localStorage
        localStorage.setItem('products', JSON.stringify(updatedPosProducts));
      }
    } catch (error) {
      console.error('Error al sincronizar con POS:', error);
    }
    
    setMensaje({ texto: 'Existencias actualizadas correctamente y sincronizadas con POS', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  /**
   * SECCIÓN 5: GESTIÓN DE LOTES
   * 
   * Estas funciones manejan la adición y eliminación de lotes
   * para los productos que se están produciendo.
   */
  
  // Agregar lote (solo local - se guarda en BD al grabar movimiento)
  const handleAgregarLote = () => {
    if (!lote) {
      setMensaje({ texto: 'Debe ingresar un número de lote', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }

    if (lotes.some(l => l.numero === lote)) {
      setMensaje({ texto: 'Este número de lote ya fue agregado', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }

    const nuevoLote = {
      id: Date.now(),
      numero: lote,
      fechaVencimiento: fechaVencimiento || ''
    };

    // Solo agregar localmente - se guardará en BD al presionar "Grabar Movimiento"
    setLotes([...lotes, nuevoLote]);
    
    setLote('');
    setFechaVencimiento('');
    setMensaje({ texto: 'Lote agregado correctamente', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  // Elimina un lote de la lista de lotes
  const handleEliminarLote = (id) => {
    // Actualizar los lotes (el efecto se encargará de guardarlos en localStorage)
    setLotes(lotes.filter(lote => lote.id !== id));
  };

  /**
   * REGISTRO DE PRODUCCIÓN POR FECHA
   * 
   * Registra cantidades producidas por fecha y actualiza existencias globales.
   * Las cantidades son específicas por fecha, las existencias son acumulativas.
   */
  const handleGrabarMovimiento = async () => {
    const fechaStr = fechaSeleccionada.toLocaleDateString('es-ES');
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
    
    // Persistencia por fecha: Guardar cantidades específicas del día
    try {
      const productosGuardadosStr = localStorage.getItem('productosRegistrados') || '{}';
      const productosGuardados = JSON.parse(productosGuardadosStr);
      
      productosGuardados[fechaStr] = productosConCantidad.map(p => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.cantidad
      }));
      
      localStorage.setItem('productosRegistrados', JSON.stringify(productosGuardados));
    } catch (error) {
      console.error('Error al guardar productos por fecha:', error);
    }
    
    // Acumulación de existencias: SUMAR cantidades a existencias actuales
    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ':' + 
                ahora.getMinutes().toString().padStart(2, '0');
    
    const nuevosMovimientos = [];
    const nuevosProductos = [...productos];
    
    productosConCantidad.forEach(producto => {
      const index = nuevosProductos.findIndex(p => p.id === producto.id);
      const existenciasActuales = parseInt(nuevosProductos[index].existencias) || 0;
      const cantidadAAgregar = parseInt(producto.cantidad) || 0;
      
      // Acumulación: Sumar nueva producción a existencias actuales
      nuevosProductos[index] = {
        ...nuevosProductos[index],
        existencias: existenciasActuales + cantidadAAgregar,
        cantidad: cantidadAAgregar
      };
      
      console.log(`Producción ${fechaStr}: ${producto.nombre} +${cantidadAAgregar} = ${existenciasActuales + cantidadAAgregar}`);
      
      // Crear movimiento para kardex y asociar con lotes en BD
      const loteInfo = lotes.map(l => l.numero).join(', ');
      nuevosMovimientos.push({
        id: Date.now() + nuevosMovimientos.length,
        fecha: fechaStr,
        hora: hora,
        producto: producto.nombre,
        cantidad: cantidadAAgregar,
        tipo: 'Entrada',
        usuario,
        lote: loteInfo,
        fechaVencimiento: lotes[0]?.fechaVencimiento ? 
          new Date(lotes[0].fechaVencimiento + 'T00:00:00').toLocaleDateString('es-ES') : '-',
        registrado: true
      });
      

    });
    
    // Guardar lotes en BD (una sola vez por lote, no por producto)
    const guardarLotesEnBD = async () => {
      for (const loteLocal of lotes) {
        try {
          const loteData = {
            lote: loteLocal.numero,
            fechaVencimiento: loteLocal.fechaVencimiento || null,
            fechaProduccion: fechaSeleccionada.toISOString().split('T')[0],
            usuario: usuario
          };
          
          console.log('Enviando lote a BD:', loteData);
          const resultado = await loteService.create(loteData);
          
          if (resultado && !resultado.error) {
            console.log(`✅ Lote ${loteLocal.numero} guardado en BD`);
          } else {
            console.error('❌ Error en respuesta del servidor:', resultado);
          }
        } catch (error) {
          console.error('❌ Error al guardar lote en BD:', error);
        }
      }
    };
    
    // Ejecutar guardado de lotes
    await guardarLotesEnBD();
    
    // Actualizar existencias globales y sincronizar
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    agregarMovimientos(nuevosMovimientos);
    
    // Limpiar campos después de grabar
    setProductosGrabados({});
    
    setMensaje({ texto: `Producción registrada para ${fechaStr}`, tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleCambiarUsuario = (nuevoUsuario) => {
    setUsuario(nuevoUsuario);
    setMensaje({ texto: 'Usuario cambiado correctamente', tipo: 'info' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  


  const handleDateSelect = async (date) => {
    setFechaSeleccionada(date);
    
    // Limpiar campos al cambiar fecha
    setLote('');
    setFechaVencimiento('');
    setLotes([]);
    
    // Cargar lotes y cantidades desde la base de datos
    const fechaStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    try {
      // Cargar lotes desde BD
      const lotesFromBD = await loteService.getByFecha(fechaStr);
      
      if (lotesFromBD && !lotesFromBD.error && lotesFromBD.length > 0) {
        // Convertir lotes de BD al formato local
        const lotesFormateados = lotesFromBD.map(lote => ({
          id: lote.id,
          numero: lote.lote,
          fechaVencimiento: lote.fecha_vencimiento || ''
        }));
        
        setLotes(lotesFormateados);
        
        // Actualizar cantidades de productos desde BD
        const productosActualizados = productos.map(producto => {
          const loteProducto = lotesFromBD.find(l => l.producto === producto.id);
          return {
            ...producto,
            cantidad: loteProducto ? loteProducto.cantidad : 0
          };
        });
        
        setProductos(productosActualizados);
        console.log(`Cargados ${lotesFromBD.length} lotes desde BD para ${fechaStr}`);
      } else {
        // No hay lotes para esta fecha, resetear cantidades
        const productosReseteados = productos.map(producto => ({
          ...producto,
          cantidad: 0
        }));
        setProductos(productosReseteados);
        console.log(`No hay lotes en BD para ${fechaStr}`);
      }
    } catch (error) {
      console.error('Error al cargar lotes desde BD:', error);
      // En caso de error, resetear
      const productosReseteados = productos.map(producto => ({
        ...producto,
        cantidad: 0
      }));
      setProductos(productosReseteados);
    }
    
    // Resetear cantidades de productos (ya no usamos localStorage)
    const productosReseteados = productos.map(producto => ({
      ...producto,
      cantidad: 0
    }));
    setProductos(productosReseteados);
    setProductosGrabados({});
    
    console.log(`🔄 Fecha cambiada a ${fechaStr} - datos cargados desde BD únicamente`);
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