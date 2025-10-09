import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

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

  useEffect(() => {
    cargarClientes();
    cargarPedidos();
  }, [dia, fechaSeleccionada]);

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
      // Cargar remisiones del día para verificar qué clientes ya tienen pedido
      const response = await fetch(`http://localhost:8000/api/remisiones/?fecha_desde=${fechaSeleccionada}&fecha_hasta=${fechaSeleccionada}`);
      if (response.ok) {
        const remisiones = await response.json();
        // Crear un mapa de clientes que ya tienen pedido
        const pedidos = {};
        remisiones.forEach(remision => {
          pedidos[remision.destinatario] = true;
        });
        setPedidosRealizados(pedidos);
      }
    } catch (error) {
      console.error('Error cargando pedidos:', error);
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
          <div className="row g-3">
            {clientes.map((cliente) => (
              <div key={cliente.id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="card-title">{cliente.nombre_completo}</h5>
                    <p className="card-text mb-1">
                      <small className="text-muted">
                        <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle' }}>location_on</span>
                        {cliente.direccion || 'Sin dirección'}
                      </small>
                    </p>
                    <p className="card-text mb-1">
                      <small className="text-muted">
                        <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle' }}>badge</span>
                        {cliente.vendedor_asignado || 'Sin vendedor'}
                      </small>
                    </p>
                    <p className="card-text mb-1">
                      <small className="text-muted">
                        <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle' }}>attach_money</span>
                        {cliente.tipo_lista_precio || 'Sin lista de precios'}
                      </small>
                    </p>
                    {pedidosRealizados[cliente.nombre_completo] ? (
                      <button
                        className="btn btn-success btn-sm w-100 mt-2"
                        disabled
                      >
                        <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle' }}>check_circle</span>
                        Realizado
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm w-100 mt-2"
                        onClick={() => {
                          // Navegar a remisiones con datos del cliente precargados
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
                        <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle' }}>add_shopping_cart</span>
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
    </div>
  );
}
