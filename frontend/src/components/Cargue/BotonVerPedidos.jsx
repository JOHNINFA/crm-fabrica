import React, { useState, useEffect } from 'react';
import { Button, Modal, Table } from 'react-bootstrap';
import { responsableStorage } from '../../utils/responsableStorage';

const BotonVerPedidos = ({ dia, idSheet, fechaSeleccionada }) => {
    const [showModal, setShowModal] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nombreVendedor, setNombreVendedor] = useState('');

    // Cargar nombre del vendedor desde responsableStorage
    useEffect(() => {
        const nombre = responsableStorage.get(idSheet);
        setNombreVendedor(nombre || '');
        console.log(`📋 Vendedor ${idSheet}: "${nombre}"`);
    }, [idSheet]);

    const cargarPedidos = async () => {
        setLoading(true);
        try {
            // Obtener todos los pedidos
            const response = await fetch(`http://localhost:8000/api/pedidos/`);
            const todosPedidos = await response.json();

            console.log(`🔍 Total pedidos en BD: ${todosPedidos.length}`);
            console.log(`🔍 Filtrando por: fecha=${fechaSeleccionada}, vendedor=${nombreVendedor}, idSheet=${idSheet}`);

            // Filtrar pedidos por fecha, vendedor y estado
            const pedidosFiltrados = todosPedidos.filter(pedido => {
                const coincideFecha = pedido.fecha_entrega === fechaSeleccionada;
                const noAnulado = pedido.estado !== 'ANULADA';

                // Verificar si el vendedor coincide (por nombre o por ID)
                let coincideVendedor = false;
                if (pedido.vendedor) {
                    // Opción 1: El pedido tiene formato "Nombre (ID1)"
                    if (pedido.vendedor.includes(`(${idSheet})`)) {
                        coincideVendedor = true;
                    }
                    // Opción 2: El pedido tiene solo el nombre y coincide con el responsable
                    else if (nombreVendedor && pedido.vendedor.trim() === nombreVendedor.trim()) {
                        coincideVendedor = true;
                    }
                }

                if (coincideFecha && coincideVendedor && noAnulado) {
                    console.log(`✅ Pedido encontrado: ${pedido.numero_pedido} - ${pedido.vendedor}`);
                }

                return coincideFecha && coincideVendedor && noAnulado;
            });

            console.log(`✅ Pedidos filtrados: ${pedidosFiltrados.length}`);

            // Agrupar productos por nombre y sumar cantidades
            const productosAgrupados = {};

            pedidosFiltrados.forEach(pedido => {
                if (pedido.detalles && pedido.detalles.length > 0) {
                    pedido.detalles.forEach(detalle => {
                        const nombre = detalle.producto_nombre;
                        const cantidad = detalle.cantidad;
                        const precio = detalle.precio_unitario;

                        if (!productosAgrupados[nombre]) {
                            productosAgrupados[nombre] = {
                                nombre: nombre,
                                cantidad: 0,
                                precio: precio,
                                total: 0
                            };
                        }

                        productosAgrupados[nombre].cantidad += cantidad;
                        productosAgrupados[nombre].total += cantidad * precio;
                    });
                }
            });

            // Convertir a array y ordenar
            const productosArray = Object.values(productosAgrupados).sort((a, b) =>
                a.nombre.localeCompare(b.nombre)
            );

            setPedidos(productosArray);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        // Solo abrir modal si hay nombre de vendedor
        if (!nombreVendedor || nombreVendedor === 'RESPONSABLE') {
            alert('⚠️ No se puede ver pedidos: No hay vendedor asignado a esta ruta');
            return;
        }

        setShowModal(true);
        cargarPedidos();
    };

    const formatCurrency = (value) => {
        return `${value.toLocaleString('es-CO')}`;
    };

    const totalUnidades = pedidos.reduce((sum, p) => sum + p.cantidad, 0);
    const totalValor = pedidos.reduce((sum, p) => sum + p.total, 0);

    return (
        <>
            <div style={{ marginTop: '210px', marginBottom: '10px' }} className="d-flex justify-content-left">
                <Button
                    variant="success"
                    onClick={handleOpenModal}
                    style={{
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '8px 16px',
                        borderRadius: '6px'
                    }}
                >
                    📋 Ver Detalle de Pedidos
                </Button>
            </div>

            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                centered
                style={{ maxHeight: '90vh' }}
            >
                <Modal.Header closeButton style={{ borderBottom: '1px solid #e0e0e0', padding: '14px 24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>📋</span>
                            <h5 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>
                                Detalle de Pedidos - {nombreVendedor || idSheet} - {dia.toUpperCase()}
                            </h5>
                        </div>
                        <p style={{ margin: '2px 0 0 36px', fontSize: '13px', color: '#95a5a6' }}>
                            Fecha: {fechaSeleccionada}
                        </p>
                    </div>
                </Modal.Header>
                <Modal.Body style={{ padding: '0', maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                            <p className="mt-3" style={{ color: '#7f8c8d' }}>Cargando pedidos...</p>
                        </div>
                    ) : pedidos.length === 0 ? (
                        <div style={{
                            margin: '20px',
                            padding: '16px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{ fontSize: '20px' }}>ℹ️</span>
                            <span style={{ color: '#1976d2', fontSize: '14px' }}>
                                No hay pedidos registrados para {nombreVendedor} en la fecha {fechaSeleccionada} ({dia}).
                            </span>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                padding: '16px 24px'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                                            <th style={{
                                                padding: '8px 8px',
                                                textAlign: 'left',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#7f8c8d',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                PRODUCTO
                                            </th>
                                            <th style={{
                                                padding: '8px 8px',
                                                textAlign: 'center',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#7f8c8d',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                width: '120px'
                                            }}>
                                                CANTIDAD
                                            </th>
                                            <th style={{
                                                padding: '8px 8px',
                                                textAlign: 'right',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#7f8c8d',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                width: '120px'
                                            }}>
                                                PRECIO
                                            </th>
                                            <th style={{
                                                padding: '8px 8px',
                                                textAlign: 'right',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#7f8c8d',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                width: '140px'
                                            }}>
                                                TOTAL
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedidos.map((producto, index) => (
                                            <tr key={index} style={{
                                                borderBottom: index !== pedidos.length - 1 ? '1px solid #f0f0f0' : 'none'
                                            }}>
                                                <td style={{
                                                    padding: '10px 8px',
                                                    color: '#7f8c8d',
                                                    fontSize: '14px'
                                                }}>
                                                    {producto.nombre}
                                                </td>
                                                <td style={{
                                                    padding: '10px 8px',
                                                    textAlign: 'center',
                                                    color: '#2c3e50',
                                                    fontSize: '14px'
                                                }}>
                                                    <strong>{producto.cantidad}</strong> und
                                                </td>
                                                <td style={{
                                                    padding: '10px 8px',
                                                    textAlign: 'right',
                                                    color: '#7f8c8d',
                                                    fontSize: '14px'
                                                }}>
                                                    ${formatCurrency(producto.precio)}
                                                </td>
                                                <td style={{
                                                    padding: '10px 8px',
                                                    textAlign: 'right',
                                                    color: '#2c3e50',
                                                    fontSize: '14px',
                                                    fontWeight: '600'
                                                }}>
                                                    ${formatCurrency(producto.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </Modal.Body>
                {!loading && pedidos.length > 0 && (
                    <>
                        <div style={{
                            padding: '8px 24px',
                            backgroundColor: '#f8f9fa',
                            borderTop: '1px solid #e0e0e0',
                            borderBottom: '1px solid #e0e0e0'
                        }}>
                            <table style={{ width: '100%' }}>
                                <tbody>
                                    <tr>
                                        <td style={{
                                            padding: '2px',
                                            textAlign: 'right',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: '#2c3e50'
                                        }}>
                                            TOTAL:
                                        </td>
                                        <td style={{
                                            padding: '2px',
                                            textAlign: 'center',
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            color: '#2196f3',
                                            width: '120px'
                                        }}>
                                            {totalUnidades} und
                                        </td>
                                        <td style={{ width: '120px' }}></td>
                                        <td style={{
                                            padding: '2px',
                                            textAlign: 'right',
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: '#4caf50',
                                            width: '140px'
                                        }}>
                                            ${formatCurrency(totalValor)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{
                            margin: '10px 24px',
                            padding: '8px 12px',
                            backgroundColor: '#d4edda',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span style={{ fontSize: '18px' }}>✅</span>
                            <span style={{ color: '#155724', fontSize: '13px' }}>
                                Resumen: {pedidos.length} productos diferentes, {totalUnidades} unidades totales
                            </span>
                        </div>
                    </>
                )}
                <Modal.Footer style={{
                    borderTop: '1px solid #e0e0e0',
                    padding: '8px 24px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <Button
                        variant="light"
                        onClick={() => setShowModal(false)}
                        style={{
                            padding: '6px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            backgroundColor: '#e9ecef',
                            border: 'none',
                            color: '#495057',
                            borderRadius: '6px'
                        }}
                    >
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default BotonVerPedidos;
