import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { pedidoService } from '../services/api';
import ModalDetallePedido from '../components/Pedidos/ModalDetallePedido';
import usePageTitle from '../hooks/usePageTitle';

// 🆕 Días de la semana
const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

export default function PedidosDiaScreen() {
  const { dia } = useParams();
  usePageTitle(`Pedidos ${dia || ''}`);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    searchParams.get('fecha') || new Date().toISOString().split('T')[0]
  );

  // 🆕 Estado para días seleccionados (array de días)
  const [diasSeleccionados, setDiasSeleccionados] = useState(dia ? [dia] : []);

  // Función para obtener la fecha del próximo día de la semana
  const obtenerProximaFecha = (diaSemana) => {
    const diasSemana = {
      'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3,
      'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'DOMINGO': 0
    };

    // Validar que diaSemana existe y es válido
    if (!diaSemana || diasSemana[diaSemana] === undefined) {
      const hoy = new Date();
      return hoy.toISOString().split('T')[0];
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

    return fechaObjetivo.toISOString().split('T')[0];
  };

  // 🆕 Función para alternar día seleccionado
  const toggleDia = (d) => {
    setDiasSeleccionados(prev => {
      if (prev.includes(d)) {
        // Si solo queda un día, no quitarlo
        if (prev.length === 1) return prev;
        return prev.filter(x => x !== d);
      }
      return [...prev, d];
    });
  };

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidosRealizados, setPedidosRealizados] = useState({});
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notas, setNotas] = useState({});
  const [clientesOrdenados, setClientesOrdenados] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Estados para el modal de anulación
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [pedidoAAnular, setPedidoAAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('Anulado desde gestión de pedidos');
  const [anulando, setAnulando] = useState(false);


  useEffect(() => {
    cargarClientes();
    cargarPedidos();
  }, [dia, fechaSeleccionada]);

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
          const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/ruta-orden/?dia=${dia}`);
          if (res.ok) {
            const data = await res.json();
            // Data es un array (filtrado por dia)
            if (data && data.length > 0 && data[0].clientes_ids) {
              idsOrdenados = data[0].clientes_ids;
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
          // Reordenar clientes según el orden guardado
          const clientesReordenados = idsOrdenados
            .map(id => clientes.find(cliente => cliente.id === id))
            .filter(Boolean);

          // Agregar clientes nuevos al final
          const clientesNuevos = clientes.filter(
            cliente => !idsOrdenados.includes(cliente.id)
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

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/clientes/`);
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/pedidos/`);
      if (response.ok) {
        const pedidos = await response.json();



        // Filtrar por fecha de entrega que coincida con la fecha seleccionada
        // Y excluir pedidos anulados
        const pedidosFiltradas = pedidos.filter(r =>
          r.fecha_entrega === fechaSeleccionada && r.estado !== 'ANULADA'
        );


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



  const handleRowClick = (cliente) => {
    const tienePedido = pedidosRealizados[(cliente.alias || '').toLowerCase()] || pedidosRealizados[cliente.nombre_completo.toLowerCase()];
    if (tienePedido) {
      verDetallePedido(cliente);
    } else {
      // Navegar a crear pedido
      const clienteData = encodeURIComponent(JSON.stringify({
        nombre: cliente.alias || cliente.nombre_completo,
        direccion: cliente.direccion,
        vendedor: cliente.vendedor_asignado,
        lista_precio: cliente.tipo_lista_precio,
        telefono: cliente.telefono_1 || cliente.movil,
        dia: dia,
        fecha: fechaSeleccionada
      }));
      navigate(`/remisiones?cliente=${clienteData}`);
    }
  };

  const handleNotaChange = (clienteId, valor) => {
    setNotas(prev => ({
      ...prev,
      [clienteId]: valor
    }));
  };

  const abrirModalAnular = (cliente) => {
    const pedido = pedidosRealizados[(cliente.alias || '').toLowerCase()] || pedidosRealizados[cliente.nombre_completo.toLowerCase()];

    if (!pedido) {
      alert('No se encontró el pedido para anular');
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

    // 1. Guardar en localStorage (Inmediato)
    const ordenKey = `orden_${dia}`;
    localStorage.setItem(ordenKey, JSON.stringify(idsOrdenados));

    // 2. Guardar en API (Persistente)
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/ruta-orden/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dia: dia,
        clientes_ids: idsOrdenados
      })
    }).then(res => {
      if (res.ok) console.log("✅ Orden persistido en BD");
      else console.error("❌ Error guardando orden BD");
    }).catch(err => console.error("❌ Error conexión guardar orden:", err));

    console.log(`✅ Orden actualizado localmente para ${dia}`);
  };

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

        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/pedidos')}
        >
          Regresar
        </button>
      </div>

      {/* Lista de clientes en tabla */}
      <div className="mt-3" style={{ margin: '0 40px' }}>
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
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              fontSize: '13px',
              textAlign: 'left',
              color: '#374151'
            }}>
              <thead style={{
                fontSize: '14px',
                color: '#1F2937',
                textTransform: 'uppercase',
                backgroundColor: '#F9FAFB',
                fontWeight: '600'
              }}>
                <tr>
                  <th style={{ padding: '6px 16px', width: '3%', textAlign: 'center', height: '45px' }} scope="col">
                    <span className="material-icons" style={{ fontSize: '16px', color: '#9CA3AF' }}>drag_indicator</span>
                  </th>
                  <th style={{ padding: '6px 16px', width: '15%', textAlign: 'center', height: '45px' }} scope="col">Negocio</th>
                  <th style={{ padding: '6px 16px', width: '10%', textAlign: 'center', height: '45px' }} scope="col">Días</th>
                  <th style={{ padding: '6px 16px', width: '10%', textAlign: 'center', height: '45px' }} scope="col">Vendedor</th>
                  <th style={{ padding: '6px 16px', width: '18%', textAlign: 'center', height: '45px' }} scope="col">Dirección</th>
                  <th style={{ padding: '6px 16px', width: '10%', textAlign: 'center', height: '45px' }} scope="col">Lista Precio</th>
                  <th style={{ padding: '6px 16px', width: '9%', textAlign: 'center', height: '45px' }} scope="col">Estado</th>
                  <th style={{ padding: '6px 16px', width: '5%', textAlign: 'center', height: '45px' }} scope="col">Anular</th>
                  <th style={{ padding: '6px 16px', width: '20%', textAlign: 'center', height: '45px' }} scope="col">Notas</th>
                </tr>
              </thead>
              <tbody>
                {clientesOrdenados.map((cliente, index) => {
                  const tienePedido = pedidosRealizados[(cliente.alias || '').toLowerCase()] || pedidosRealizados[cliente.nombre_completo.toLowerCase()];
                  return (
                    <tr
                      key={cliente.id}
                      draggable
                      style={{
                        cursor: draggedIndex === index ? 'grabbing' : 'grab',
                        backgroundColor: draggedIndex === index ? '#EBF8FF' : '#FFFFFF',
                        borderBottom: '1px solid #E5E7EB',
                        transition: 'background-color 0.2s ease-in-out',
                        opacity: draggedIndex === index ? 0.5 : 1,
                        height: '45px'
                      }}
                      onMouseEnter={(e) => {
                        if (draggedIndex !== index) {
                          e.target.closest('tr').style.backgroundColor = '#F9FAFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (draggedIndex !== index) {
                          e.target.closest('tr').style.backgroundColor = '#FFFFFF';
                        }
                      }}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => handleRowClick(cliente)}
                    >
                      <td style={{
                        padding: '4px 16px',
                        textAlign: 'center',
                        cursor: 'grab',
                        verticalAlign: 'middle',
                        height: '45px'
                      }}>
                        <span className="material-icons" style={{ fontSize: '16px', color: '#9CA3AF' }}>drag_indicator</span>
                      </td>
                      <th style={{
                        padding: '4px 16px',
                        fontWeight: '500',
                        color: '#1F2937',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px'
                      }} scope="row">
                        {cliente.alias || cliente.nombre_completo}
                      </th>
                      <td style={{
                        padding: '4px 8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px',
                        fontSize: '11px',
                        color: '#4B5563'
                      }}>
                        {(cliente.dia_entrega || '').split(',').map(d => d.trim().substring(0, 3)).join('/')}
                      </td>
                      <td style={{
                        padding: '4px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px'
                      }}>
                        {cliente.vendedor_asignado || 'Sin vendedor'}
                      </td>
                      <td style={{
                        padding: '4px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '200px'
                      }}>
                        {cliente.direccion || 'Sin dirección'}
                      </td>
                      <td style={{
                        padding: '4px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        height: '45px'
                      }}>
                        {cliente.tipo_lista_precio || 'Sin lista'}
                      </td>
                      <td style={{ padding: '4px 16px', textAlign: 'center', verticalAlign: 'middle', height: '45px' }}>
                        {tienePedido ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#F0FDF4',
                            color: '#166534'
                          }}>
                            <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>check_circle</span>
                            Realizado
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 10px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#EBF8FF',
                            color: '#1D4ED8'
                          }}>
                            <span className="material-icons" style={{ fontSize: '14px', marginRight: '4px' }}>add_shopping_cart</span>
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '4px 16px', textAlign: 'center', verticalAlign: 'middle', height: '45px' }}>
                        {tienePedido ? (
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
                              width: '20px',
                              height: '20px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalAnular(cliente);
                            }}
                            title="Anular pedido"
                          >
                            <span className="material-icons" style={{ fontSize: '16px' }}>close</span>
                          </button>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '4px 16px', verticalAlign: 'middle', height: '45px' }}>
                        <input
                          type="text"
                          value={notas[cliente.id] || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleNotaChange(cliente.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            backgroundColor: '#F9FAFB',
                            border: '1px solid #D1D5DB',
                            color: '#111827',
                            fontSize: '12px',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            transition: 'all 0.2s ease-in-out'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#1D4ED8';
                            e.target.style.backgroundColor = '#FFFFFF';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#D1D5DB';
                            e.target.style.backgroundColor = '#F9FAFB';
                          }}
                          placeholder="Añadir nota..."
                        />
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
