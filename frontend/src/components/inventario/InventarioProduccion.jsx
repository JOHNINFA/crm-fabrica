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
import { productoService, loteService, movimientoService } from '../../services/api';
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

  /**
   * SECCIÓN 2: PERSISTENCIA DE LOTES
   * 
   * Estas funciones manejan la persistencia de los lotes en localStorage
   * para mantener el estado entre navegaciones y recargas de página.
   */
  
  // Guarda los lotes actuales en localStorage para persistencia
  const guardarLotes = () => {
    try {
      // Guardar los lotes actuales directamente en localStorage
      if (lotes && lotes.length > 0) {
        localStorage.setItem('inventarioLotesActuales', JSON.stringify(lotes));
      }
    } catch (error) {
      console.error('Error al guardar lotes:', error);
    }
  };

  // Recupera los lotes guardados previamente en localStorage
  const cargarLotesGuardados = () => {
    try {
      const lotesGuardadosStr = localStorage.getItem('inventarioLotesActuales');
      if (lotesGuardadosStr) {
        const lotesGuardados = JSON.parse(lotesGuardadosStr);
        if (lotesGuardados && lotesGuardados.length > 0) {
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
  
  // Agrega un nuevo lote a la lista de lotes
  const handleAgregarLote = () => {
    // Validar que se haya ingresado un número de lote
    if (!lote) {
      setMensaje({ texto: 'Debe ingresar un número de lote', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }

    // Verificar si el lote ya existe para evitar duplicados
    if (lotes.some(l => l.numero === lote)) {
      setMensaje({ texto: 'Este número de lote ya fue agregado', tipo: 'warning' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
      return;
    }

    // Crear objeto de nuevo lote
    const nuevoLote = {
      id: Date.now(),
      numero: lote,
      fechaVencimiento: fechaVencimiento || '' // Puede ser vacío
    };

    // Actualizar los lotes (el efecto se encargará de guardarlos en localStorage)
    setLotes([...lotes, nuevoLote]);
    
    // Limpiar los campos del formulario
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
   * SECCIÓN 6: REGISTRO DE MOVIMIENTOS
   * 
   * Esta función es la más importante del componente, ya que registra
   * los movimientos de inventario, actualiza las existencias y sincroniza
   * con el sistema POS.
   */
  const handleGrabarMovimiento = () => {
    // Las cantidades ya están en los objetos de productos gracias al handleCantidadChange
    // No necesitamos recopilarlas de los inputs
    
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
    
    // Marcar estos productos como grabados
    const nuevosProductosGrabados = { ...productosGrabados };
    productosConCantidad.forEach(producto => {
      nuevosProductosGrabados[producto.id] = true;
    });
    
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
        // Mantener la cantidad para que sea visible después de grabar
        cantidad: cantidadAAgregar
      };
      
      console.log('Actualizando existencias:', {
        producto: producto.nombre,
        existenciasAntes: existenciasActuales,
        cantidadAgregada: cantidadAAgregar,
        existenciasDespues: existenciasActuales + cantidadAAgregar
      });
      
      // Crear un solo movimiento con la cantidad total del producto
      // Los lotes son solo informativos, no afectan el cálculo de existencias
      const loteInfo = lotes.length > 0 ? lotes.map(l => l.numero).join(', ') : 'Sin lote';
      
      nuevosMovimientos.push({
        id: Date.now() + nuevosMovimientos.length,
        fecha: fechaSeleccionada.toLocaleDateString('es-ES'),
        hora: hora,
        producto: producto.nombre,
        cantidad: producto.cantidad, // Cantidad exacta ingresada
        tipo: 'Entrada',
        usuario,
        lote: loteInfo, // Información de lotes como texto
        fechaVencimiento: lotes.length > 0 && lotes[0].fechaVencimiento ? 
          new Date(lotes[0].fechaVencimiento).toLocaleDateString('es-ES') : '-',
        registrado: true
      });
    });
    
    // Actualizar estado local y contexto
    setProductos(nuevosProductos);
    actualizarExistencias(nuevosProductos);
    agregarMovimientos(nuevosMovimientos);
    
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
    
    // Actualizar el estado de productos grabados pero no bloquear los campos
    // para permitir seguir editando
    setProductosGrabados({});
    
    // No resetear lotes ni cantidades para mantener el registro
    // Solo mostrar mensaje de éxito
    setMensaje({ texto: 'Movimientos registrados correctamente y existencias sincronizadas con POS', tipo: 'success' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleCambiarUsuario = (nuevoUsuario) => {
    setUsuario(nuevoUsuario);
    setMensaje({ texto: 'Usuario cambiado correctamente', tipo: 'info' });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };
  
  // Función para resetear todas las cantidades a 0
  const resetearCantidades = () => {
    // Importar la utilidad de reseteo
    import('../../utils/resetHelper').then(({ resetearCantidadesCompletamente }) => {
      // Resetear cantidades en localStorage
      resetearCantidadesCompletamente();
      
      // Crear una copia de los productos con cantidades en 0
      const productosReseteados = productos.map(producto => ({
        ...producto,
        cantidad: 0
      }));
      
      // Actualizar el estado
      setProductos(productosReseteados);
      
      // Resetear también el estado de productos grabados
      setProductosGrabados({});
      
      // Forzar recarga de productos desde localStorage
      setTimeout(() => {
        cargarProductos();
      }, 100);
      
      // Mostrar mensaje
      setMensaje({ texto: 'Cantidades reseteadas a 0', tipo: 'info' });
      setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
    });
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
        // Si hay lotes guardados para esta fecha, cargarlos
        setLotes(lotesFecha.lotes);
      } else {
        // Si no hay lotes para esta fecha, limpiar los lotes actuales
        // para empezar con una lista vacía en el nuevo día
        setLotes([]);
        // También limpiar los campos de entrada
        setLote('');
        setFechaVencimiento('');
      }
    } catch (error) {
      console.error('Error al cargar lotes:', error);
      // En caso de error, también limpiar los lotes
      setLotes([]);
    }
    
    // También cargar las cantidades guardadas para esta fecha
    try {
      const productosGuardadosStr = localStorage.getItem('productosRegistrados') || '{}';
      const productosGuardados = JSON.parse(productosGuardadosStr);
      
      if (productosGuardados[fechaStr]) {
        // Si hay productos guardados para esta fecha, actualizar cantidades
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
      } else {
        // Si no hay productos guardados para esta fecha, resetear todas las cantidades a 0
        const productosReseteados = productos.map(producto => ({
          ...producto,
          cantidad: 0
        }));
        
        // Actualizar productos con cantidades en 0
        setProductos(productosReseteados);
        
        // También resetear el estado de productos grabados
        setProductosGrabados({});
      }
    } catch (error) {
      console.error('Error al cargar productos guardados:', error);
      // En caso de error, también resetear las cantidades
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