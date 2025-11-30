import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productoService } from '../services/api';
import usePageTitle from '../hooks/usePageTitle';
import './PreciosCargueScreen.css';

const PreciosCargueScreen = () => {
    usePageTitle('Precios Cargue y App');
    const navigate = useNavigate();
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [guardando, setGuardando] = useState({});
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            setLoading(true);
            const data = await productoService.getAll();
            // Ordenar por campo 'orden' (igual que en Cargue), luego por ID
            const ordenados = data.sort((a, b) => {
                const ordenA = a.orden !== undefined ? a.orden : 999999;
                const ordenB = b.orden !== undefined ? b.orden : 999999;
                if (ordenA !== ordenB) return ordenA - ordenB;
                return (a.id || 0) - (b.id || 0);
            });
            setProductos(ordenados);
        } catch (error) {
            console.error('Error cargando productos:', error);
            setMensaje({ tipo: 'error', texto: 'Error al cargar productos' });
        } finally {
            setLoading(false);
        }
    };

    const handlePrecioChange = (productoId, valor) => {
        const precio = parseFloat(valor) || 0;
        setProductos(prev => prev.map(p =>
            p.id === productoId ? { ...p, precio_cargue: precio } : p
        ));
    };

    const guardarPrecio = async (producto) => {
        try {
            setGuardando(prev => ({ ...prev, [producto.id]: true }));

            await productoService.update(producto.id, {
                precio_cargue: producto.precio_cargue || 0
            });

            setMensaje({ tipo: 'success', texto: `Precio actualizado: ${producto.nombre}` });
            setTimeout(() => setMensaje(null), 2000);
        } catch (error) {
            console.error('Error guardando precio:', error);
            setMensaje({ tipo: 'error', texto: 'Error al guardar precio' });
        } finally {
            setGuardando(prev => ({ ...prev, [producto.id]: false }));
        }
    };

    const guardarTodos = async () => {
        try {
            setLoading(true);
            const productosConPrecio = productos.filter(p => p.precio_cargue > 0);

            for (const producto of productosConPrecio) {
                await productoService.update(producto.id, {
                    precio_cargue: producto.precio_cargue
                });
            }

            setMensaje({ tipo: 'success', texto: `${productosConPrecio.length} precios guardados correctamente` });
            setTimeout(() => setMensaje(null), 3000);
        } catch (error) {
            console.error('Error guardando precios:', error);
            setMensaje({ tipo: 'error', texto: 'Error al guardar precios' });
        } finally {
            setLoading(false);
        }
    };

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="precios-cargue-container bg-light">
            <div className="card shadow-sm">
                <div className="card-body p-3">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h2 className="card-title h5 mb-1">Precios Cargue y App</h2>
                            <small className="text-muted">
                                Estos precios se usan en el módulo Cargue (ID1-ID6) y en la App móvil de ventas
                            </small>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-success btn-sm"
                                onClick={guardarTodos}
                                disabled={loading}
                            >
                                <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle' }}>save</span>
                                {' '}Guardar Todos
                            </button>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => navigate('/otros')}
                            >
                                Regresar
                            </button>
                        </div>
                    </div>

                    {/* Mensaje */}
                    {mensaje && (
                        <div className={`alert alert-${mensaje.tipo === 'success' ? 'success' : 'danger'} py-2`}>
                            {mensaje.texto}
                        </div>
                    )}

                    {/* Búsqueda */}
                    <div className="mb-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar producto..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    {/* Tabla */}
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>Producto</th>
                                    <th style={{ width: '120px' }}>Precio Venta</th>
                                    <th style={{ width: '150px' }}>Precio Cargue/App</th>
                                    <th style={{ width: '100px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4">
                                            Cargando productos...
                                        </td>
                                    </tr>
                                ) : productosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4">
                                            No hay productos
                                        </td>
                                    </tr>
                                ) : (
                                    productosFiltrados.map(producto => (
                                        <tr key={producto.id}>
                                            <td className="align-middle">{producto.nombre}</td>
                                            <td className="align-middle text-muted">
                                                $ {Math.round(producto.precio || 0).toLocaleString()}
                                            </td>
                                            <td>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">$</span>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={producto.precio_cargue || ''}
                                                        onChange={(e) => handlePrecioChange(producto.id, e.target.value)}
                                                        onBlur={() => guardarPrecio(producto)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {guardando[producto.id] ? (
                                                    <span className="spinner-border spinner-border-sm text-primary"></span>
                                                ) : (
                                                    <button
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => guardarPrecio(producto)}
                                                        title="Guardar"
                                                    >
                                                        <span className="material-icons" style={{ fontSize: '14px' }}>save</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreciosCargueScreen;
