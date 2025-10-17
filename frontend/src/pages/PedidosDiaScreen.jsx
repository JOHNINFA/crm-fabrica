import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ModalDetallePedido from '../components/Pedidos/ModalDetallePedido';

export default function PedidosDiaScreen() {
  const { dia } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    searchParams.get('fecha') || new Date().toISOString().split('T')[0]
  );

  // Función para obtener la fecha del próximo día de la semana
  const obtenerProximaFecha = (diaSemana) => {
    const diasSemana = {
      'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3,
      'JUEVES': 4, 'VIERNES': 5, 'SABADO': 6, 'DOMINGO': 0
    };

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
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidosRealizados, setPedidosRealizados] = useState({});
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notas, setNotas] = useState({});
  const [clientesOrdenados, setClientesOrdenados] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);


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
  useEffect(() => {
    if (clientes.length > 0) {
      const ordenKey = `orden_${dia}`;
      const ordenGuardado = localStorage.getItem(ordenKey);

      if (ordenGuardado) {
        try {
          const idsOrdenados = JSON.parse(ordenGuardado);
          // Reordenar clientes según el orden guardado
          const clientesReordenados = idsOrdenados
            .map(id => clientes.find(cliente => cliente.id === id))
            .filter(Boolean); // Filtrar elementos undefined

          // Agregar clientes nuevos que no estén en el orden guardado
          const clientesNuevos = clientes.filter(
            cliente => !idsOrdenados.includes(cliente.id)
          );

          setClientesOrdenados([...clientesReordenados, ...clientesNuevos]);
        } catch (error) {
          console.error('Error al cargar orden guardado:', error);
          setClientesOrdenados(clientes);
        }
      } else {
        setClientesOrdenados(clientes);
      }
    }
  }, [clientes, dia]); // Solo depende del día, no de la fecha

  // Recargar pedidos cuando la ventana recupera el foco
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Ventana recuperó el foco, recargando pedidos...');
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
        // Filtrar clientes por día de entrega
        const clientesFiltrados = data.filter(
          cliente => cliente.dia_entrega === dia && cliente.activo
        );
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
        console.log('📦 Todas las pedidos:', pedidos);
        console.log('📅 Fecha seleccionada:', fechaSeleccionada);

        // Filtrar por fecha de entrega que coincida con la fecha seleccionada
        // Y excluir pedidos anulados
        const pedidosFiltradas = pedidos.filter(r =>
          r.fecha_entrega === fechaSeleccionada && r.estado !== 'ANULADA'
        );
        console.log('✅ Pedidos filtradas (sin anulados):', pedidosFiltradas);

        // Crear un mapa de clientes que ya tienen pedido con los datos completos
        const pedidosMap = {};
        pedidosFiltradas.forEach(remision => {
          console.log(`  Mapeando: "${remision.destinatario}" -> Pedido ${remision.numero_pedido}`);
          // Usar toLowerCase para hacer la comparación insensible a mayúsculas
          pedidosMap[remision.destinatario.toLowerCase()] = remision;
        });
        console.log('🗺️ Mapa de pedidos:', pedidosMap);
        setPedidosRealizados(pedidosMap);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  const verDetallePedido = (cliente) => {
    const pedido = pedidosRealizados[cliente.nombre_completo.toLowerCase()];
    if (pedido) {
      setPedidoSeleccionado(pedido);
      setShowModal(true);
    }
  };



  const handleRowClick = (cliente) => {
    const tienePedido = pedidosRealizados[cliente.nombre_completo.toLowerCase()];
    if (tienePedido) {
      verDetallePedido(cliente);
    } else {
      // Navegar a crear pedido
      const clienteData = encodeURIComponent(JSON.stringify({
        nombre: cliente.nombre_completo,
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

  const anularPedido = async (cliente) => {
    const pedido = pedidosRealizados[cliente.nombre_completo.toLowerCase()];

    if (!pedido) {
      alert('No se encontró el pedido para anular');
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro de anular el pedido de ${cliente.nombre_completo}?\n\n` +
      `Esto hará lo siguiente:\n` +
      `- Cambiará el estado a ANULADO\n` +
      `- Revertirá las cantidades en Planeación\n` +
      `- Devolverá el dinero en Cargue\n` +
      `- El pedido volverá a estado Pendiente`
    );

    if (!confirmar) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/pedidos/${pedido.id}/anular/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        alert('Pedido anulado exitosamente');
        // Recargar pedidos para actualizar la vista
        cargarPedidos();
      } else {
        const error = await response.json();
        alert(`Error al anular pedido: ${error.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error anulando pedido:', error);
      alert('Error de conexión al anular el pedido');
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

    // Guardar el nuevo orden en localStorage
    const ordenKey = `orden_${dia}`;
    const idsOrdenados = newClientes.map(cliente => cliente.id);
    localStorage.setItem(ordenKey, JSON.stringify(idsOrdenados));

    console.log(`✅ Orden guardado para ${dia} (aplica a todas las fechas)`);
  };

  return (
    <div className="container-fluid" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center py-2">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{
              fontSize: '0.9rem',
              padding: '0.4rem 0.8rem',
              fontWeight: 'bold',
              borderRadius: '8px',
              pointerEvents: 'none',
              backgroundColor: '#06386d',
              borderColor: '#06386d'
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
                  <th style={{ padding: '6px 16px', width: '17%', textAlign: 'center', height: '45px' }} scope="col">Cliente</th>
                  <th style={{ padding: '6px 16px', width: '11%', textAlign: 'center', height: '45px' }} scope="col">Vendedor</th>
                  <th style={{ padding: '6px 16px', width: '21%', textAlign: 'center', height: '45px' }} scope="col">Dirección</th>
                  <th style={{ padding: '6px 16px', width: '11%', textAlign: 'center', height: '45px' }} scope="col">Lista Precio</th>
                  <th style={{ padding: '6px 16px', width: '10%', textAlign: 'center', height: '45px' }} scope="col">Estado</th>
                  <th style={{ padding: '6px 16px', width: '6%', textAlign: 'center', height: '45px' }} scope="col">Anular</th>
                  <th style={{ padding: '6px 16px', width: '21%', textAlign: 'center', height: '45px' }} scope="col">Notas</th>
                </tr>
              </thead>
              <tbody>
                {clientesOrdenados.map((cliente, index) => {
                  const tienePedido = pedidosRealizados[cliente.nombre_completo.toLowerCase()];
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
                        {cliente.nombre_completo}
                      </th>
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
                              anularPedido(cliente);
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
    </div >
  );
}
