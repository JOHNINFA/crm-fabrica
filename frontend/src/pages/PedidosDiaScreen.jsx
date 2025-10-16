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
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidosRealizados, setPedidosRealizados] = useState({});
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarClientes();
    cargarPedidos();
  }, [dia, fechaSeleccionada]);

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
      const response = await fetch('http://localhost:8000/api/clientes/');
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
      const response = await fetch(`http://localhost:8000/api/pedidos/`);
      if (response.ok) {
        const pedidos = await response.json();
        console.log('📦 Todas las pedidos:', pedidos);
        console.log('📅 Fecha seleccionada:', fechaSeleccionada);

        // Filtrar por fecha de entrega que coincida con la fecha seleccionada
        const pedidosFiltradas = pedidos.filter(r => r.fecha_entrega === fechaSeleccionada);
        console.log('✅ Pedidos filtradas:', pedidosFiltradas);

        // Crear un mapa de clientes que ya tienen pedido con los datos completos
        const pedidosMap = {};
        pedidosFiltradas.forEach(remision => {
          console.log(`  Mapeando: "${remision.destinatario}" -> Pedido ${remision.numero_pedido}`);
          pedidosMap[remision.destinatario] = remision;
        });
        console.log('🗺️ Mapa de pedidos:', pedidosMap);
        setPedidosRealizados(pedidosMap);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  const verDetallePedido = (cliente) => {
    const pedido = pedidosRealizados[cliente.nombre_completo];
    if (pedido) {
      setPedidoSeleccionado(pedido);
      setShowModal(true);
    }
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

      {/* Lista de clientes */}
      <div className="mt-3">
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
          <div className="row g-2">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="col-6 col-sm-4 col-md-3 col-lg-2" style={{ maxWidth: '180px' }}>
                <div className="card shadow-sm h-100" style={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <div className="card-body" style={{ padding: '12px' }}>
                    <h6 className="card-title" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>{cliente.nombre_completo}</h6>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                      <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                        <span className="material-icons" style={{ fontSize: '12px', marginRight: '4px' }}>location_on</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.direccion || 'Sin dirección'}</span>
                      </div>
                      <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                        <span className="material-icons" style={{ fontSize: '12px', marginRight: '4px' }}>badge</span>
                        <span>{cliente.vendedor_asignado || 'Sin vendedor'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="material-icons" style={{ fontSize: '12px', marginRight: '4px' }}>attach_money</span>
                        <span>{cliente.tipo_lista_precio || 'Sin lista'}</span>
                      </div>
                    </div>
                    {(() => {
                      const tienePedido = pedidosRealizados[cliente.nombre_completo];
                      if (tienePedido) {
                        console.log(`✅ Cliente "${cliente.nombre_completo}" tiene pedido`);
                      } else {
                        console.log(`❌ Cliente "${cliente.nombre_completo}" NO tiene pedido. Pedidos disponibles:`, Object.keys(pedidosRealizados));
                      }
                      return tienePedido;
                    })() ? (
                      <button
                        className="btn btn-success w-100"
                        onClick={() => verDetallePedido(cliente)}
                        style={{ fontSize: '12px', padding: '6px 8px', fontWeight: '500' }}
                      >
                        <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>check_circle</span>
                        Realizado
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary w-100"
                        style={{ fontSize: '12px', padding: '6px 8px', fontWeight: '500' }}
                        onClick={() => {
                          // Navegar a pedidos con datos del cliente precargados
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
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>add_shopping_cart</span>
                        Crear Pedido
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle de pedido */}
      <ModalDetallePedido
        show={showModal}
        onClose={() => setShowModal(false)}
        pedido={pedidoSeleccionado}
      />
    </div>
  );
}
