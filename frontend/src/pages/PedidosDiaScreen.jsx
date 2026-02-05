import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import Swal from 'sweetalert2'; // 🆕 Importar SweetAlert2
import { pedidoService, API_URL } from '../services/api';
import ModalDetallePedido from '../components/Pedidos/ModalDetallePedido';
import usePageTitle from '../hooks/usePageTitle';


// Función auxiliar para fecha local YYYY-MM-DD
const getFechaLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PedidosDiaScreen() {
  const { dia } = useParams();
  usePageTitle(`Pedidos ${dia || ''}`);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    searchParams.get('fecha') || getFechaLocal()
  );

  // Función para obtener la fecha del próximo día de la semana
  const obtenerProximaFecha = (diaSemana) => {
    const diasSemana = {
      'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3,
      'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'DOMINGO': 0
    };

    // Validar que diaSemana existe y es válido
    if (!diaSemana || diasSemana[diaSemana] === undefined) {
      return getFechaLocal();
    }

    const hoy = new Date();
    const diaActual = hoy.getDay();
    const diaObjetivo = diasSemana[diaSemana];

    let diasHastaObjetivo = diaObjetivo - diaActual;
    if (diasHastaObjetivo <= 0) {
      diasHastaObjetivo += 7; // Si ya pasó, buscar la próxima semana
    }

    const fechaObjetivo = new Date(hoy);
    fechaObjetivo.setDate(hoy.getDate() + diasHastaObjetivo);

    // 🆕 Usar métodos locales para evitar desfase UTC
    const year = fechaObjetivo.getFullYear();
    const month = String(fechaObjetivo.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObjetivo.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidosRealizados, setPedidosRealizados] = useState({});
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [clientesOrdenados, setClientesOrdenados] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Estados para el modal de anulación
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [pedidoAAnular, setPedidoAAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('Anulado desde gestión de pedidos');
  const [anulando, setAnulando] = useState(false);

  // Estado para tooltip de teléfono
  const [telefonoHover, setTelefonoHover] = useState(null);

  // Estados para modal de notas
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [clienteNotaSeleccionado, setClienteNotaSeleccionado] = useState(null);
  const [notaEditando, setNotaEditando] = useState('');
  const [notaHover, setNotaHover] = useState(null);

  // Estados para productos frecuentes
  const [showProductosModal, setShowProductosModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosFrecuentesSeleccionados, setProductosFrecuentesSeleccionados] = useState([]);
  const [clientesConFrecuentes, setClientesConFrecuentes] = useState(new Set()); // 🆕 IDs de clientes con productos frecuentes
  const [notasClientes, setNotasClientes] = useState({}); // 🆕 Mapa clienteId -> nota
  const [mapaIdsFrecuentes, setMapaIdsFrecuentes] = useState({}); // 🆕 Mapa clienteId -> id_registro_frecuente

  // Estado para filtro de búsqueda
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // Cargar indicadores de productos frecuentes
  useEffect(() => {
    const cargarIndicadores = async () => {
      try {
        const response = await fetch(`${API_URL}/productos-frecuentes/?dia=${dia}`);
        if (response.ok) {
          const data = await response.json();

          const nuevosClientesIds = new Set();
          const nuevasNotas = {};
          const nuevosIds = {};

          data.forEach(item => {
            // Marcar si tiene productos
            if (item.productos && item.productos.length > 0) {
              nuevosClientesIds.add(item.cliente);
            }
            // Guardar nota si existe
            if (item.nota) {
              nuevasNotas[item.cliente] = item.nota;
            }
            // Guardar ID del registro para futuras actualizaciones
            nuevosIds[item.cliente] = item.id;
          });

          setClientesConFrecuentes(nuevosClientesIds);
          setNotasClientes(nuevasNotas);
          setMapaIdsFrecuentes(nuevosIds);
        }
      } catch (error) {
        console.error('Error cargando indicadores:', error);
      }
    };
    cargarIndicadores();
  }, [dia, showProductosModal]); // Recargar cuando cambia el día o se cierra el modal (por si se guardaron nuevos)



  useEffect(() => {
    cargarClientes();
    cargarPedidos();
  }, [dia, fechaSeleccionada]);

  // Cargar productos disponibles
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch(`${API_URL}/productos/`);
        if (response.ok) {
          const data = await response.json();
          // Filtrar solo productos disponibles para pedidos
          const productosPedidos = data.filter(p => p.disponible_pedidos && p.activo);
          setProductosDisponibles(productosPedidos);
        }
      } catch (error) {
        console.error('Error cargando productos:', error);
      }
    };
    cargarProductos();
  }, []);

  // Cargar productos frecuentes cuando se selecciona un cliente
  useEffect(() => {
    const cargarProductosFrecuentes = async () => {
      if (!clienteSeleccionado) return;

      try {
        const response = await fetch(
          `${API_URL}/productos-frecuentes/?cliente=${clienteSeleccionado.id}&dia=${dia}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0 && data[0].productos) {
            setProductosFrecuentesSeleccionados(data[0].productos);
          } else {
            setProductosFrecuentesSeleccionados([]);
          }
        }
      } catch (error) {
        console.error('Error cargando productos frecuentes:', error);
      }
    };

    cargarProductosFrecuentes();
  }, [clienteSeleccionado, dia]);



  // Actualizar fecha automáticamente cuando cambia el día
  useEffect(() => {
    if (!searchParams.get('fecha')) {
      const nuevaFecha = obtenerProximaFecha(dia);
      setFechaSeleccionada(nuevaFecha);
    }
  }, [dia]);

  // Cargar orden guardado cuando cambian día o fecha
  // Cargar orden guardado (API + LocalStorage backup)
  useEffect(() => {
    if (clientes.length > 0) {
      const cargarOrden = async () => {
        let idsOrdenados = null;

        // 1. Intentar cargar desde API (Fuente de la verdad)
        try {
          // Usar endpoint específico para obtener la ruta global (ruta_id=null)
          const res = await fetch(`${API_URL}/ruta-orden/obtener_orden/?dia=${dia}`);
          if (res.ok) {
            const data = await res.json();
            // Data es un objeto directo
            if (data && data.clientes_ids) {
              idsOrdenados = data.clientes_ids;
              console.log("✅ Orden cargado desde BD para", dia);
            }
          }
        } catch (e) {
          console.error("⚠️ Error cargando orden BD:", e);
        }

        // 2. Si no hay en API, intentar LocalStorage (Backup)
        if (!idsOrdenados) {
          const ordenKey = `orden_${dia}`;
          const ordenGuardado = localStorage.getItem(ordenKey);
          if (ordenGuardado) {
            try {
              idsOrdenados = JSON.parse(ordenGuardado);
              console.log("⚠️ Orden cargado desde LocalStorage (Backup)");
            } catch (e) { }
          }
        }

        // 3. Aplicar orden
        if (idsOrdenados) {
          // Reordenar clientes según el orden guardado (Comparación flexible String/Number)
          const clientesReordenados = idsOrdenados
            .map(id => clientes.find(cliente => String(cliente.id) === String(id)))
            .filter(Boolean);

          // Agregar clientes nuevos al final
          const clientesNuevos = clientes.filter(
            cliente => !idsOrdenados.some(id => String(id) === String(cliente.id))
          );

          setClientesOrdenados([...clientesReordenados, ...clientesNuevos]);
        } else {
          // Sin orden previo
          setClientesOrdenados(clientes);
        }
      };

      cargarOrden();
    }
  }, [clientes, dia]); // Solo depende del día, no de la fecha

  // Recargar pedidos cuando la ventana recupera el foco
  useEffect(() => {
    const handleFocus = () => {

      cargarPedidos();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fechaSeleccionada]);

  const guardarNotaCliente = async (clienteId, nuevaNota) => {
    try {
      const idExistente = mapaIdsFrecuentes[clienteId];
      // Actualizar estado local inmediatamente para reflejar el cambio
      setNotasClientes(prev => ({ ...prev, [clienteId]: nuevaNota }));

      if (idExistente) {
        // PATCH si ya existe
        const response = await fetch(`${API_URL}/productos-frecuentes/${idExistente}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nota: nuevaNota }),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar nota en el servidor');
        }
        console.log(`✅ Nota actualizada para cliente ${clienteId}`);
      } else {
        // POST si no existe (solo si hay nota)
        if (!nuevaNota.trim()) return;

        const res = await fetch(`${API_URL}/productos-frecuentes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cliente: clienteId,
            dia: dia,
            productos: [], // Vacío inicialmente
            nota: nuevaNota
          }),
        });

        if (!res.ok) {
          throw new Error('Error al crear nota en el servidor');
        }

        const data = await res.json();
        // Guardar el nuevo ID para futuros updates
        setMapaIdsFrecuentes(prev => ({ ...prev, [clienteId]: data.id }));
        console.log(`✅ Nota creada para cliente ${clienteId}, ID: ${data.id}`);
      }
    } catch (error) {
      console.error('❌ Error guardando nota:', error);
      // Mostrar alerta al usuario
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar nota',
        text: 'No se pudo guardar la nota. Por favor, intenta de nuevo.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      // Revertir el cambio local si falló
      setNotasClientes(prev => {
        const newState = { ...prev };
        delete newState[clienteId];
        return newState;
      });
    }
  };

  const abrirModalNota = (cliente) => {
    setClienteNotaSeleccionado(cliente);
    setNotaEditando(notasClientes[cliente.id] || '');
    setShowNotaModal(true);
  };

  const guardarNotaDesdeModal = async () => {
    if (!clienteNotaSeleccionado) return;

    await guardarNotaCliente(clienteNotaSeleccionado.id, notaEditando);
    setShowNotaModal(false);
    setClienteNotaSeleccionado(null);
    setNotaEditando('');
  };


  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/clientes/`);
      if (response.ok) {
        const data = await response.json();
        // Filtrar clientes por día de entrega (soporta múltiples días: "MARTES,JUEVES,SABADO")
        const clientesFiltrados = data.filter(cliente => {
          if (!cliente.activo) return false;
          // Dividir los días del cliente y verificar si incluye el día actual
          const diasCliente = (cliente.dia_entrega || '').split(',').map(d => d.trim().toUpperCase());
          return diasCliente.includes(dia);
        });
        setClientes(clientesFiltrados);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarPedidos = async () => {
    try {
      // Cargar TODAS las pedidos y filtrar por fecha de entrega
      const response = await fetch(`${API_URL}/pedidos/`);
      if (response.ok) {
        const pedidos = await response.json();



        // Filtrar por fecha de entrega que coincida con la fecha seleccionada
        // 🆕 Excluir pedidos ANULADOS sin novedades (anulados manualmente desde Gestión)
        // 🆕 Mantener pedidos ANULADOS con novedades (marcados como "No Entregado" por vendedor)
        const pedidosFiltradas = pedidos.filter(r => {
          const coincideFecha = r.fecha_entrega === fechaSeleccionada;

          if (!coincideFecha) return false;

          // Si está anulado, verificar si tiene novedades O nota de "No entregado"
          if (r.estado === 'ANULADA') {
            const tieneNovedades = r.novedades && r.novedades.length > 0;
            const tieneNotaNoEntregado = r.nota && r.nota.toLowerCase().includes('no entregado');

            // Si NO tiene ni novedades ni nota de "no entregado" = anulado manualmente → OCULTAR
            if (!tieneNovedades && !tieneNotaNoEntregado) {
              return false;
            }
          }

          // Todos los demás (incluidos anulados CON novedades)
          return true;
        });


        // Crear un mapa de clientes que ya tienen pedido con los datos completos
        const pedidosMap = {};
        pedidosFiltradas.forEach(remision => {
          console.log(`  Mapeando: "${remision.destinatario}" -> Pedido ${remision.numero_pedido}`);
          // Usar toLowerCase para hacer la comparación insensible a mayúsculas
          pedidosMap[remision.destinatario.toLowerCase()] = remision;
        });

        setPedidosRealizados(pedidosMap);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  const verDetallePedido = (cliente) => {
    const pedido = pedidosRealizados[(cliente.alias || '').toLowerCase()] || pedidosRealizados[cliente.nombre_completo.toLowerCase()];
    if (pedido) {
      setPedidoSeleccionado(pedido);
      setShowModal(true);
    }
  };

  const guardarProductosFrecuentes = async () => {
    if (!clienteSeleccionado) return;

    try {
      // Verificar si ya existe configuración para este cliente y día
      const getResponse = await fetch(
        `${API_URL}/productos-frecuentes/?cliente=${clienteSeleccionado.id}&dia=${dia}`
      );

      let method = 'POST';
      let url = `${API_URL}/productos-frecuentes/`;

      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data.length > 0) {
          // Ya existe, hacer PUT
          method = 'PUT';
          url = `${API_URL}/productos-frecuentes/${data[0].id}/`;
        }
      }

      // Guardar
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: clienteSeleccionado.id,
          dia: dia,
          productos: productosFrecuentesSeleccionados
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      // Éxito
      Swal.fire({
        icon: 'success',
        title: '✅ Guardado exitoso',
        text: `Productos frecuentes guardados para ${clienteSeleccionado.alias || clienteSeleccionado.nombre_completo}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });

      setShowProductosModal(false);
      setClienteSeleccionado(null);
      setProductosFrecuentesSeleccionados([]);
    } catch (error) {
      console.error('❌ Error guardando productos frecuentes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: 'No se pudieron guardar los productos frecuentes. Verifica tu conexión e intenta de nuevo.',
        confirmButtonText: 'Reintentar',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Reintentar
          guardarProductosFrecuentes();
        }
      });
    }
  };


  const handleRowClick = async (cliente) => {
    const tienePedido = pedidosRealizados[(cliente.alias || '').toLowerCase()] || pedidosRealizados[cliente.nombre_completo.toLowerCase()];
    if (tienePedido) {
      verDetallePedido(cliente);
    } else {
      // 🆕 Guardar contexto para volver aquí después de crear el pedido
      localStorage.setItem('pedidos_retorno_dia', dia);
      localStorage.setItem('pedidos_retorno_fecha', fechaSeleccionada);

      // 🆕 Intentar cargar productos frecuentes
      let productosFrecuentes = [];
      try {
        const response = await fetch(
          `${API_URL}/productos-frecuentes/?cliente=${cliente.id}&dia=${dia}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0 && data[0].productos && data[0].productos.length > 0) {
            productosFrecuentes = data[0].productos;
            console.log(`✅ Productos frecuentes cargados para ${cliente.alias}:`, productosFrecuentes);
          }
        }
      } catch (error) {
        console.error('Error cargando productos frecuentes:', error);
      }

      // Navegar a crear pedido
      const clienteData = encodeURIComponent(JSON.stringify({
        nombre: cliente.alias || cliente.nombre_completo,
        direccion: cliente.direccion,
        vendedor: cliente.vendedor_asignado,
        lista_precio: cliente.tipo_lista_precio,
        telefono: cliente.telefono_1 || cliente.movil,
        dia: dia,
        fecha: fechaSeleccionada,
        productos_frecuentes: productosFrecuentes  // 🆕 Pasar productos
      }));
      navigate(`/remisiones?cliente=${clienteData}`);
    }
  };

  const abrirModalAnular = (cliente) => {
    const pedido = pedidosRealizados[(cliente.alias || '').toLowerCase()] || pedidosRealizados[cliente.nombre_completo.toLowerCase()];

    if (!pedido) {
      alert('No se encontró el pedido para anular');
      return;
    }

    // 🆕 ALERTA DE SEGURIDAD PARA PEDIDOS ENTREGADOS
    if (pedido.estado === 'ENTREGADO' || pedido.estado === 'ENTREGADA') {
      Swal.fire({
        title: '⚠️ ¿ANULAR PEDIDO VENDIDO?',
        html: `
                <div style="text-align: left;">
                    <p>Este pedido figura como <b>ENTREGADO</b>. Si lo anulas:</p>
                    <ul style="color: #d33; font-weight: bold;">
                        <li>NO se devolverá el stock al inventario.</li>
                        <li>Se descontará del total de ventas del día.</li>
                        <li>Quedará registro de la anulación.</li>
                    </ul>
                    <p>Solo haz esto si realmente fue un error y la venta no existió.</p>
                </div>
            `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, Anular',
        cancelButtonText: 'Cancelar',
        focusCancel: true
      }).then((result) => {
        if (result.isConfirmed) {
          setPedidoAAnular(pedido);
          setShowAnularModal(true);
        }
      });
      return;
    }

    setPedidoAAnular(pedido);
    setShowAnularModal(true);
  };

  const confirmarAnulacion = async () => {
    if (!motivoAnulacion || motivoAnulacion.trim() === '') {
      alert('Debe ingresar un motivo para anular el pedido');
      return;
    }

    setAnulando(true);

    try {

      const result = await pedidoService.anularPedido(pedidoAAnular.id, motivoAnulacion);

      if (result.success) {
        alert(`✅ ${result.message}`);

        // Cerrar modal de anulación
        setShowAnularModal(false);
        setMotivoAnulacion('Anulado desde gestión de pedidos');
        setPedidoAAnular(null);

        // Recargar pedidos para actualizar la vista
        await cargarPedidos();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error al anular pedido:', error);
      alert(`❌ Error al anular el pedido: ${error.message}`);
    } finally {
      setAnulando(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newClientes = [...clientesOrdenados];
    const draggedItem = newClientes[draggedIndex];

    // Remover el elemento arrastrado
    newClientes.splice(draggedIndex, 1);
    // Insertar en la nueva posición
    newClientes.splice(dropIndex, 0, draggedItem);

    setClientesOrdenados(newClientes);
    setDraggedIndex(null);

    const idsOrdenados = newClientes.map(cliente => cliente.id);

    // 1. Guardar en localStorage (Inmediato - Backup)
    const ordenKey = `orden_${dia}`;
    localStorage.setItem(ordenKey, JSON.stringify(idsOrdenados));
    console.log(`💾 Orden guardado en localStorage para ${dia}`);

    // 2. Guardar en API (Persistente)
    fetch(`${API_URL}/ruta-orden/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia: dia,
        ruta_id: null,
        clientes_ids: idsOrdenados
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then(() => {
        console.log("✅ Orden persistido en BD para", dia);
        // 🆕 Toast de éxito
        Swal.fire({
          icon: 'success',
          title: 'Orden guardado',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      })
      .catch(err => {
        console.error("❌ Error guardando orden en BD:", err);
        // Mostrar notificación discreta
        Swal.fire({
          icon: 'warning',
          title: 'Orden guardado localmente',
          text: 'El orden se guardó en tu navegador pero no se pudo sincronizar con el servidor. Se intentará sincronizar automáticamente.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000
        });
      });
  };

  // Filtrar clientes según búsqueda
  const clientesFiltrados = clientesOrdenados.filter(cliente => {
    if (!filtroBusqueda.trim()) return true;
    const busqueda = filtroBusqueda.toLowerCase();
    const nombre = (cliente.alias || cliente.nombre_completo || '').toLowerCase();
    return nombre.includes(busqueda);
  });

  return (
    <div className="container-fluid" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center py-2">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-sm text-white" // Quitado btn-primary, agregado text-white
            style={{
              fontSize: '0.9rem',
              padding: '0.4rem 0.8rem',
              fontWeight: 'bold',
              borderRadius: '8px',
              pointerEvents: 'none',
              backgroundColor: 'rgb(6, 56, 109)', // RGB explícito
              borderColor: 'rgb(6, 56, 109)'
            }}
          >
            {dia}
          </button>

          <input
            type="date"
            className="form-control form-control-sm"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            style={{
              width: '150px',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/pedidos')}
          >
            Regresar
          </button>
          <button
            className="btn btn-outline-success btn-sm"
            onClick={() => {
              // Guardar contexto para regresar después
              localStorage.setItem('pedidos_retorno_dia', dia);
              localStorage.setItem('pedidos_retorno_fecha', fechaSeleccionada);
              // 🆕 Navegar pasando la fecha actual para que no cargue "HOY" por defecto
              navigate(`/remisiones?fecha=${fechaSeleccionada}&dia=${dia}`);
            }}
            title="Crear pedido rápido para cliente ocasional"
          >
            <i className="bi bi-plus-circle me-1"></i>
            Ir a Pedidos
          </button>
        </div>
      </div>

      {/* Lista de clientes en tabla */}
      <div className="mt-3" style={{ margin: '0 20px' }}>
        {/* Campo de búsqueda */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <button
            className="btn btn-light"
            style={{ borderRadius: '12px', padding: '8px 12px' }}
            title="Buscar"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>search</span>
          </button>

          <input
            className="form-control"
            style={{
              maxWidth: 400,
              borderRadius: '12px',
              height: '40px',
              padding: '8px 16px'
            }}
            type="text"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            placeholder="Buscar cliente por nombre..."
            autoComplete="off"
            onFocus={(e) => {
              e.target.style.borderColor = '#2196F3';
              e.target.style.borderWidth = '1px';
              e.target.style.boxShadow = 'none';
              e.target.style.outline = 'none';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#dee2e6';
              e.target.style.borderWidth = '1px';
              e.target.style.boxShadow = 'none';
              e.target.style.outline = 'none';
            }}
          />

          {filtroBusqueda && (
            <button
              onClick={() => setFiltroBusqueda('')}
              className="btn btn-light"
              style={{
                borderRadius: '12px',
                padding: '8px 12px'
              }}
              title="Limpiar búsqueda"
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>close</span>
            </button>
          )}

          {filtroBusqueda && (
            <div style={{ fontSize: '14px', color: '#6B7280', whiteSpace: 'nowrap', marginLeft: '8px' }}>
              {clientesFiltrados.length} de {clientesOrdenados.length} clientes
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : clientes.length === 0 ? (
          <div className="alert alert-info text-center">
            <span className="material-icons" style={{ fontSize: '48px' }}>info</span>
            <p className="mb-0 mt-2">No hay clientes asignados para {dia}</p>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table style={{
              width: '100%',
              minWidth: '1200px',
              fontSize: '15px',
              textAlign: 'left',
              color: '#374151'
            }}>
              <thead style={{
                fontSize: '13px',
                color: '#1F2937',
                textTransform: 'uppercase',
                backgroundColor: '#F9FAFB',
                fontWeight: '600'
              }}>
                <tr>
                  <th style={{ padding: '6px 16px', width: '3%', textAlign: 'center', height: '45px' }} scope="col">
                    <span className="material-icons" style={{ fontSize: '16px', color: '#9CA3AF' }}>drag_indicator</span>
                  </th>
                  <th style={{ padding: '6px 16px', width: '18%', textAlign: 'center', height: '45px' }} scope="col">Negocio</th>
                  <th style={{ padding: '6px 16px', width: '10%', textAlign: 'center', height: '45px' }} scope="col">Días</th>
                  <th style={{ padding: '6px 16px', width: '12%', textAlign: 'center', height: '45px' }} scope="col">Vendedor</th>
                  <th style={{ padding: '6px 16px', width: '18%', textAlign: 'center', height: '45px' }} scope="col">Dirección</th>
                  <th style={{ padding: '6px 16px', width: '10%', textAlign: 'center', height: '45px' }} scope="col">Lista Precio</th>
                  <th style={{ padding: '6px 16px', width: '10%', textAlign: 'center', height: '45px' }} scope="col">Estado</th>
                  <th style={{ padding: '6px 16px', width: '4%', textAlign: 'center', height: '45px' }} scope="col">Teléfono</th>
                  <th style={{ padding: '6px 16px', width: '4%', textAlign: 'center', height: '45px' }} scope="col">Anular</th>
                  <th style={{ padding: '6px 16px', width: '8%', textAlign: 'center', height: '45px' }} scope="col">Notas</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente, index) => {
                  const tienePedido = pedidosRealizados[(cliente.alias || '').toLowerCase()] || pedidosRealizados[cliente.nombre_completo.toLowerCase()];
                  const estaEntregado = tienePedido && tienePedido.estado === 'ENTREGADO';
                  const tieneNovedad = tienePedido && (tienePedido.novedades && tienePedido.novedades.length > 0);
                  // 🆕 En Gestión Pedidos, NO mostramos "No Entregado". Si hay pedido, es "Realizado".

                  return (
                    <tr
                      key={cliente.id}
                      draggable
                      style={{
                        cursor: draggedIndex === index ? 'grabbing' : 'grab',
                        backgroundColor: tieneNovedad ? 'rgba(239, 68, 68, 0.1)' : (estaEntregado ? 'rgba(34, 197, 94, 0.1)' : // Verde transparente si entregado
                          draggedIndex === index ? '#EBF8FF' : '#FFFFFF'),
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background-color 0.2s ease-in-out',
                        opacity: draggedIndex === index ? 0.5 : 1,
                        height: '45px'
                      }}
                      onMouseEnter={(e) => {
                        if (draggedIndex !== index && !estaEntregado && !tieneNovedad) {
                          e.target.closest('tr').style.backgroundColor = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (draggedIndex !== index) {
                          e.target.closest('tr').style.backgroundColor = tieneNovedad ? 'rgba(239, 68, 68, 0.1)' : (estaEntregado ? 'rgba(34, 197, 94, 0.1)' : '#FFFFFF');
                        }
                      }}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => handleRowClick(cliente)}
                    >
                      <td style={{
                        padding: '3px 8px',
                        textAlign: 'center',
                        cursor: 'grab',
                        verticalAlign: 'middle',
                        height: '45px'
                      }}>
                        <span className="material-icons" style={{ fontSize: '14px', color: '#9CA3AF' }}>drag_indicator</span>
                      </td>
                      <th style={{
                        padding: '3px 8px',
                        fontWeight: '500',
                        color: '#1F2937',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px',
                        fontSize: '11px'
                      }} scope="row">
                        {cliente.alias || cliente.nombre_completo}
                      </th>
                      <td style={{
                        padding: '3px 6px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px',
                        fontSize: '10px',
                        color: '#4B5563'
                      }}>
                        {(cliente.dia_entrega || '').split(',').map(d => d.trim().substring(0, 3)).join('/')}
                      </td>
                      <td style={{
                        padding: '3px 8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px',
                        fontSize: '11px'
                      }}>
                        {cliente.vendedor_asignado || 'Sin vendedor'}
                      </td>
                      <td style={{
                        padding: '3px 8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px',
                        fontSize: '11px'
                      }}>
                        {cliente.direccion || 'Sin dirección'}
                      </td>
                      <td style={{
                        padding: '4px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px',
                        fontSize: '11px'
                      }}>
                        {cliente.tipo_lista_precio || 'Sin lista'}
                      </td>
                      <td style={{ padding: '3px 8px', textAlign: 'center', verticalAlign: 'middle', height: '45px' }}>
                        {tienePedido ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: '#F0FDF4',
                            color: '#166534'
                          }}>
                            <span className="material-icons" style={{ fontSize: '12px', marginRight: '2px' }}>check_circle</span>
                            Realizado
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 6px',
                            borderRadius: '9999px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: '#EBF8FF',
                            color: '#1D4ED8'
                          }}>
                            <span className="material-icons" style={{ fontSize: '12px', marginRight: '2px' }}>add_shopping_cart</span>
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', verticalAlign: 'middle', height: '45px', position: 'relative' }}>
                        {cliente.movil ? (
                          <div
                            style={{ position: 'relative', display: 'inline-block' }}
                            onMouseEnter={() => setTelefonoHover(cliente.id)}
                            onMouseLeave={() => setTelefonoHover(null)}
                          >
                            <span className="material-icons" style={{
                              fontSize: '14px',
                              color: '#10B981',
                              cursor: 'pointer'
                            }}>
                              phone
                            </span>

                            {/* Tooltip con números */}
                            {telefonoHover === cliente.id && (
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: 'calc(100% + 10px)',
                                transform: 'translateY(-50%)',
                                backgroundColor: '#FFFFFF',
                                color: '#1F2937',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #E5E7EB',
                                zIndex: 1000,
                                pointerEvents: 'none'
                              }}>
                                {/* Flecha del tooltip (izquierda) */}
                                <div style={{
                                  position: 'absolute',
                                  left: '-5px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 0,
                                  height: 0,
                                  borderTop: '5px solid transparent',
                                  borderBottom: '5px solid transparent',
                                  borderRight: '5px solid #FFFFFF'
                                }} />
                                <div style={{
                                  position: 'absolute',
                                  left: '-6px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 0,
                                  height: 0,
                                  borderTop: '6px solid transparent',
                                  borderBottom: '6px solid transparent',
                                  borderRight: '6px solid #E5E7EB'
                                }} />

                                <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '11px', color: '#06386d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span className="material-icons" style={{ fontSize: '14px', color: '#06386d' }}>phone</span>
                                  Contacto
                                </div>
                                {cliente.movil.split(/[-,]/).map((num, i) => (
                                  <div key={i} style={{
                                    fontWeight: '600',
                                    letterSpacing: '0.5px',
                                    marginBottom: i < cliente.movil.split(/[-,]/).length - 1 ? '4px' : '0',
                                    color: '#1F2937',
                                    fontSize: '13px'
                                  }}>
                                    {num.trim()}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'center', verticalAlign: 'middle', height: '45px' }}>
                        {tienePedido ? (() => {
                          // 🆕 Validar si el vendedor ya procesó el pedido en la app
                          const fueEntregado = tienePedido.estado === 'ENTREGADO';
                          const fueNoEntregado = tienePedido.estado === 'ANULADA' && tienePedido.novedades && tienePedido.novedades.length > 0;
                          // 🆕 Verificar si tiene nota de "No entregado" desde la app móvil
                          const tieneNotaNoEntregado = tienePedido.nota && tienePedido.nota.toLowerCase().includes('no entregado');
                          const vendedorYaLoProceso = fueEntregado || fueNoEntregado || tieneNotaNoEntregado;

                          // Si el vendedor ya lo procesó, NO permitir anulación
                          if (vendedorYaLoProceso) {
                            return (
                              <span
                                style={{ color: '#9CA3AF', fontSize: '10px', cursor: 'not-allowed' }}
                                title="No se puede anular: El vendedor ya procesó este pedido en la app"
                              >
                                🔒
                              </span>
                            );
                          }

                          // Si no ha sido procesado, mostrar botón de anular
                          return (
                            <button
                              style={{
                                padding: '2px',
                                borderRadius: '9999px',
                                color: '#EF4444',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalAnular(cliente);
                              }}
                              title="Anular pedido (solo si el vendedor no lo ha procesado)"
                            >
                              <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
                            </button>
                          );
                        })() : (
                          <span style={{ color: '#9CA3AF' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '3px 8px', verticalAlign: 'middle', height: '45px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                          {/* Botón de productos frecuentes */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setClienteSeleccionado(cliente);
                              setShowProductosModal(true);
                            }}
                            style={{
                              padding: '4px',
                              backgroundColor: 'transparent',
                              color: 'inherit',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              flexShrink: 0,
                              transition: 'all 0.3s ease',
                              filter: clientesConFrecuentes.has(cliente.id)
                                ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))'
                                : 'none',
                              transform: clientesConFrecuentes.has(cliente.id) ? 'scale(1.1)' : 'scale(1)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.2)';
                              if (!clientesConFrecuentes.has(cliente.id)) {
                                e.currentTarget.style.filter = 'drop-shadow(0 0 3px rgba(0,0,0,0.2))';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = clientesConFrecuentes.has(cliente.id) ? 'scale(1.1)' : 'scale(1)';
                              e.currentTarget.style.filter = clientesConFrecuentes.has(cliente.id)
                                ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))'
                                : 'none';
                            }}
                            title={clientesConFrecuentes.has(cliente.id) ? "Productos frecuentes configurados ✅" : "Configurar productos frecuentes"}
                          >
                            📦
                          </button>

                          {/* Botón de notas */}
                          <div
                            style={{ position: 'relative', display: 'inline-block' }}
                            onMouseEnter={() => setNotaHover(cliente.id)}
                            onMouseLeave={() => setNotaHover(null)}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalNota(cliente);
                              }}
                              style={{
                                padding: '4px',
                                backgroundColor: 'transparent',
                                color: notasClientes[cliente.id] ? '#F59E0B' : '#9CA3AF',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.3s ease',
                                filter: notasClientes[cliente.id]
                                  ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
                                  : 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.2)';
                                if (!notasClientes[cliente.id]) {
                                  e.currentTarget.style.filter = 'drop-shadow(0 0 3px rgba(0,0,0,0.2))';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.filter = notasClientes[cliente.id]
                                  ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))'
                                  : 'none';
                              }}
                            >
                              <span className="material-icons" style={{ fontSize: '18px' }}>description</span>
                            </button>

                            {/* Tooltip con preview de nota */}
                            {notaHover === cliente.id && notasClientes[cliente.id] && (
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                right: 'calc(100% + 10px)',
                                transform: 'translateY(-50%)',
                                backgroundColor: '#FFFFFF',
                                color: '#1F2937',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #FCD34D',
                                zIndex: 9999,
                                pointerEvents: 'none'
                              }}>
                                {/* Flecha */}
                                <div style={{
                                  position: 'absolute',
                                  right: '-5px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 0,
                                  height: 0,
                                  borderTop: '5px solid transparent',
                                  borderBottom: '5px solid transparent',
                                  borderLeft: '5px solid #FFFFFF'
                                }} />
                                <div style={{
                                  position: 'absolute',
                                  right: '-6px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: 0,
                                  height: 0,
                                  borderTop: '6px solid transparent',
                                  borderBottom: '6px solid transparent',
                                  borderLeft: '6px solid #FCD34D'
                                }} />
                                <strong style={{ color: '#F59E0B', marginRight: '6px' }}>📝</strong>
                                {notasClientes[cliente.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {/* Modal de detalle de pedido */}
      <ModalDetallePedido
        show={showModal}
        onClose={() => setShowModal(false)}
        pedido={pedidoSeleccionado}
      />

      {/* Modal de Productos Frecuentes */}
      <Modal
        show={showProductosModal}
        onHide={() => {
          setShowProductosModal(false);
          setClienteSeleccionado(null);
          setProductosFrecuentesSeleccionados([]);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: '#06386d', color: 'white' }}>
          <Modal.Title>
            📦 Productos Frecuentes - {clienteSeleccionado?.alias || clienteSeleccionado?.nombre_completo}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <p className="text-muted mb-3">
            Selecciona los productos que <strong>{clienteSeleccionado?.alias || clienteSeleccionado?.nombre_completo}</strong> pide frecuentemente los días <strong>{dia}</strong>.
          </p>

          {productosDisponibles.length === 0 ? (
            <div className="text-center py-4">
              <span className="material-icons" style={{ fontSize: '48px', color: '#9CA3AF' }}>inventory_2</span>
              <p className="text-muted mt-2">Cargando productos...</p>
            </div>
          ) : (
            <div className="row g-2">
              {productosDisponibles.map(producto => {
                const seleccionado = productosFrecuentesSeleccionados.find(p => p.producto_id === producto.id);

                return (
                  <div key={producto.id} className="col-md-6">
                    <div
                      style={{
                        border: seleccionado ? '2px solid #10B981' : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: seleccionado ? '#F0FDF4' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        if (seleccionado) {
                          // Deseleccionar
                          setProductosFrecuentesSeleccionados(prev =>
                            prev.filter(p => p.producto_id !== producto.id)
                          );
                        } else {
                          // Seleccionar con cantidad 1
                          setProductosFrecuentesSeleccionados(prev => [
                            ...prev,
                            { producto_id: producto.id, nombre: producto.nombre, cantidad: 1 }
                          ]);
                        }
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="flex-grow-1">
                          <strong style={{ color: '#1F2937', fontSize: '14px' }}>{producto.nombre}</strong>
                          {seleccionado && (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              <label className="form-label mb-1" style={{ fontSize: '12px', color: '#6B7280' }}>
                                Cantidad:
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={seleccionado.cantidad}
                                onChange={(e) => {
                                  const nuevaCantidad = parseInt(e.target.value) || 1;
                                  setProductosFrecuentesSeleccionados(prev =>
                                    prev.map(p =>
                                      p.producto_id === producto.id
                                        ? { ...p, cantidad: nuevaCantidad }
                                        : p
                                    )
                                  );
                                }}
                                className="form-control form-control-sm"
                                style={{ width: '80px' }}
                                onFocus={(e) => e.target.select()}
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          {seleccionado ? (
                            <span className="material-icons" style={{ color: '#10B981', fontSize: '24px' }}>
                              check_circle
                            </span>
                          ) : (
                            <span className="material-icons" style={{ color: '#D1D5DB', fontSize: '24px' }}>
                              radio_button_unchecked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100 align-items-center">
            <span className="text-muted" style={{ fontSize: '14px' }}>
              {productosFrecuentesSeleccionados.length} producto(s) seleccionado(s)
            </span>
            <div>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowProductosModal(false);
                  setClienteSeleccionado(null);
                  setProductosFrecuentesSeleccionados([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="ms-2"
                style={{ backgroundColor: '#06386d', borderColor: '#06386d' }}
                onClick={guardarProductosFrecuentes}
              >
                <i className="bi bi-save me-2"></i>
                Guardar
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>


      {/* Modal de Edici\u00f3n de Notas */}
      <Modal
        show={showNotaModal}
        onHide={() => {
          setShowNotaModal(false);
          setClienteNotaSeleccionado(null);
          setNotaEditando('');
        }}
        size="md"
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: '#F59E0B', color: 'white' }}>
          <Modal.Title>
            <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '8px', fontSize: '24px' }}>description</span>
            Nota - {clienteNotaSeleccionado?.alias || clienteNotaSeleccionado?.nombre_completo}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            <i className="bi bi-info-circle me-2"></i>
            Añade información importante sobre este cliente.
          </p>
          <textarea
            className="form-control"
            rows="6"
            value={notaEditando}
            onChange={(e) => setNotaEditando(e.target.value)}
            placeholder="Escribe aqu\u00ed tus notas..."
            style={{
              fontSize: '14px',
              resize: 'none'
            }}
            autoFocus
          />
          <small className="text-muted mt-2 d-block">
            {notaEditando.length} caracteres
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowNotaModal(false);
              setClienteNotaSeleccionado(null);
              setNotaEditando('');
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="warning"
            onClick={guardarNotaDesdeModal}
            style={{ color: 'white' }}
          >
            <i className="bi bi-save me-2"></i>
            Guardar Nota
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmación de Anulación */}
      <Modal
        show={showAnularModal}
        onHide={() => {
          setShowAnularModal(false);
          setMotivoAnulacion('Anulado desde gestión de pedidos');
          setPedidoAAnular(null);
        }}
        centered
      >
        <Modal.Header closeButton style={{ backgroundColor: '#dc3545', color: 'white' }}>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Confirmar Anulación de Pedido
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-start p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <i className="bi bi-info-circle-fill me-2 mt-1" style={{ fontSize: '1.2rem', color: '#6c757d' }}></i>
            <div>
              <strong style={{ color: '#212529' }}>¿Está seguro que desea anular el pedido {pedidoAAnular?.numero_pedido}?</strong>
              <p className="mb-0 mt-2 small" style={{ color: '#495057' }}>Esta acción:</p>
              <ul className="small mb-0" style={{ color: '#495057' }}>
                <li>Cambiará el estado del pedido a ANULADA</li>
                <li>Revertirá las cantidades en Planeación</li>
                <li>Revertirá los totales en Cargue</li>
              </ul>
              <p className="mb-0 mt-2 small" style={{ color: '#dc3545' }}><strong>Esta acción NO se puede deshacer.</strong></p>
            </div>
          </div>

          <div className="mb-3 mt-3">
            <label htmlFor="motivoAnulacion" className="form-label">
              <strong>Motivo de la anulación:</strong> <span className="text-danger">*</span>
            </label>
            <textarea
              id="motivoAnulacion"
              className="form-control"
              rows="3"
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              placeholder="Ingrese el motivo de la anulación..."
              disabled={anulando}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAnularModal(false);
              setMotivoAnulacion('Anulado desde gestión de pedidos');
              setPedidoAAnular(null);
            }}
            disabled={anulando}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={confirmarAnulacion}
            disabled={anulando || !motivoAnulacion.trim()}
          >
            {anulando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Anulando...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle me-2"></i>
                Confirmar Anulación
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}
