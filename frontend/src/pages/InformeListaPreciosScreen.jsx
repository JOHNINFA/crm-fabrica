import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productoService } from '../services/api';
import { listaPrecioService, precioProductoService } from '../services/listaPrecioService';
import EditarProductoModal from '../components/modals/EditarProductoModal';
import usePageTitle from '../hooks/usePageTitle';
import './InformeListaPreciosScreen.css';

const listasAjuste = [
    { id: 'pv', nombre: 'Precio Venta' },
    { id: 'pvo', nombre: 'Precio Venta Online' },
    { id: 'cli', nombre: 'CLIENTES' },
    { id: 'dom', nombre: 'DOMICILIOS' },
];

const InformeListaPreciosScreen = () => {
    usePageTitle('Informe Lista de Precios');
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('actualizarMasivamente');
    const [sucursal, setSucursal] = useState('Principal');
    const [categoria, setCategoria] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [productos, setProductos] = useState([]);
    const [listasPrecios, setListasPrecios] = useState([]);
    const [preciosProductos, setPreciosProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    // Estado para controlar qué listas están visibles en POS
    const [listasVisiblesPos, setListasVisiblesPos] = useState(() => {
        const saved = localStorage.getItem('listasVisiblesPos');
        return saved ? JSON.parse(saved) : { 'CLIENTES': true };
    });

    // 🆕 Estado para controlar los checkboxes de aumento
    const [listasAumento, setListasAumento] = useState(() => {
        const saved = localStorage.getItem('listasAumento');
        return saved ? JSON.parse(saved) : {};
    });

    // Detectar de dónde viene el usuario
    const origenModulo = sessionStorage.getItem('origenModulo') || 'pos';

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [productosData, listasData, preciosData] = await Promise.all([
                productoService.getAll(),
                listaPrecioService.getAll({ activo: true }),
                precioProductoService.getAll()
            ]);

            setProductos(productosData);
            setListasPrecios(listasData);
            setPreciosProductos(preciosData);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPrecioProductoLista = (productoId, listaNombre) => {
        const lista = listasPrecios.find(l => l.nombre === listaNombre);
        if (!lista) return '$ 0';

        const precio = preciosProductos.find(p => p.producto === productoId && p.lista_precio === lista.id);
        return precio ? `$ ${Math.round(precio.precio)}` : '$ 0';
    };

    const handleEditarProducto = (producto) => {
        setProductoSeleccionado(producto);
        setShowModal(true);
    };

    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleRefresh = () => {

    };

    const handleExport = () => {

    };

    const handlePrint = () => {

    };

    const handleToggleVisiblePos = (nombreLista) => {
        const nuevasListas = {
            ...listasVisiblesPos,
            [nombreLista]: !listasVisiblesPos[nombreLista]
        };
        setListasVisiblesPos(nuevasListas);
        localStorage.setItem('listasVisiblesPos', JSON.stringify(nuevasListas));
        console.log(`✅ Lista "${nombreLista}" ${nuevasListas[nombreLista] ? 'activada' : 'desactivada'} para POS`);
    };

    // 🆕 Manejar toggle de aumento
    const handleToggleAumento = (nombreLista) => {
        const nuevasListas = {
            ...listasAumento,
            [nombreLista]: !listasAumento[nombreLista]
        };
        setListasAumento(nuevasListas);
        localStorage.setItem('listasAumento', JSON.stringify(nuevasListas));
    };

    return (
        <div className="informe-lista-precios-container bg-light">
            <div className="card shadow-sm">
                <div className="card-body p-3">
                    {/* Encabezado */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="card-title h5 mb-0">Informe de Ajustes de Listas de Precios</h2>
                        <div className="d-flex align-items-center gap-2">
                            <span className="status-dot"></span>
                            <button
                                className="btn btn-outline-secondary btn-refresh-custom btn-sm"
                                onClick={handleRefresh}
                                title="Refrescar"
                            >
                                <span className="material-icons" style={{ fontSize: '16px' }}>refresh</span>
                            </button>
                            <button
                                className="btn btn-outline-secondary btn-regresar-informe-custom btn-sm"
                                onClick={() => navigate(origenModulo === 'pedidos' ? '/remisiones' : '/pos')}
                            >
                                Regresar a {origenModulo === 'pedidos' ? 'Pedidos' : 'POS'}
                            </button>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="row mb-3">
                        <div className="col-md-6 col-lg-4">
                            <div className="row align-items-center">
                                <label className="col-sm-3 col-form-label col-form-label-sm">Sucursal:</label>
                                <div className="col-sm-9">
                                    <select
                                        className="form-select form-select-sm"
                                        value={sucursal}
                                        onChange={(e) => setSucursal(e.target.value)}
                                    >
                                        <option>Principal</option>
                                        <option>Otra Sucursal</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 col-lg-4">
                            <div className="row align-items-center">
                                <label className="col-sm-3 col-form-label col-form-label-sm">Categoría:</label>
                                <div className="col-sm-9">
                                    <select
                                        className="form-select form-select-sm"
                                        value={categoria}
                                        onChange={(e) => setCategoria(e.target.value)}
                                    >
                                        <option>Todos</option>
                                        <option>General</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pestañas */}
                    <div className="custom-tabs">
                        <div className="nav nav-tabs">
                            <button
                                className={`nav-link ${activeTab === 'actualizarMasivamente' ? 'active' : ''}`}
                                onClick={() => setActiveTab('actualizarMasivamente')}
                            >
                                Lista de Precios Actualizar Precios Masivamente
                            </button>
                            <button
                                className={`nav-link ${activeTab === 'cambiarMasivamente' ? 'active' : ''}`}
                                onClick={() => setActiveTab('cambiarMasivamente')}
                            >
                                Cambiar Precios Masivamente
                            </button>
                        </div>
                    </div>

                    {/* Contenido de pestañas */}
                    {activeTab === 'actualizarMasivamente' && (
                        <div>
                            {/* Tabla de Ajuste de Porcentajes */}
                            <div className="ajuste-porcentaje-section p-3">
                                <table className="table table-borderless text-center">
                                    <thead>
                                        <tr>
                                            <th className="text-start">Nombre</th>
                                            <th>Aumento</th>
                                            <th>Porcentaje</th>
                                            <th>Visible en POS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listasAjuste.map(lista => (
                                            <tr key={lista.id}>
                                                <td className="text-start align-middle">{lista.nombre}</td>
                                                <td className="align-middle">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={listasAumento[lista.nombre] || false}
                                                            onChange={() => handleToggleAumento(lista.nombre)}
                                                        />
                                                        <label className="form-check-label">
                                                            Aumento / Disminuir
                                                        </label>
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        defaultValue={0}
                                                    />
                                                </td>
                                                <td className="align-middle">
                                                    <div className="form-check form-switch d-flex justify-content-center">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            role="switch"
                                                            checked={listasVisiblesPos[lista.nombre] || false}
                                                            onChange={() => handleToggleVisiblePos(lista.nombre)}
                                                            title={`${listasVisiblesPos[lista.nombre] ? 'Desactivar' : 'Activar'} para POS`}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tabla de Productos */}
                            <div className="productos-section mt-3">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <button
                                            className="btn btn-warning btn-sm me-2"
                                            onClick={handleExport}
                                            title="Exportar"
                                        >
                                            <span className="material-icons" style={{ fontSize: '16px' }}>file_download</span>
                                        </button>
                                        <button
                                            className="btn btn-print-custom btn-sm"
                                            onClick={handlePrint}
                                            title="Imprimir"
                                        >
                                            <span className="material-icons" style={{ fontSize: '16px' }}>print</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-striped table-hover productos-table">
                                        <thead>
                                            <tr>
                                                <th colSpan="7">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="Búsqueda General"
                                                        value={busqueda}
                                                        onChange={(e) => setBusqueda(e.target.value)}
                                                    />
                                                </th>
                                            </tr>
                                            <tr>
                                                <th>Acciones</th>
                                                <th>Nombre</th>
                                                <th>Categoría</th>
                                                <th>Precio Compra</th>
                                                <th>COMERZIALIZADORA</th>
                                                <th>CLIENTES</th>
                                                <th>DOMICILIOS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center">Cargando productos...</td>
                                                </tr>
                                            ) : productosFiltrados.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center">No hay productos</td>
                                                </tr>
                                            ) : (
                                                productosFiltrados.map(p => (
                                                    <tr key={p.id}>
                                                        <td className="text-center align-middle">
                                                            <button
                                                                className="btn btn-dollar-custom btn-sm"
                                                                onClick={() => handleEditarProducto(p)}
                                                                title="Editar precios"
                                                            >
                                                                <span className="material-icons" style={{ fontSize: '14px' }}>attach_money</span>
                                                            </button>
                                                        </td>
                                                        <td className="align-middle">{p.nombre}</td>
                                                        <td className="align-middle">{p.categoria_nombre || 'Sin categoría'}</td>
                                                        <td className="align-middle">$ {Math.round(p.precio_compra || 0)}</td>
                                                        <td className="align-middle">{getPrecioProductoLista(p.id, 'COMERZIALIZADORA')}</td>
                                                        <td className="align-middle">{getPrecioProductoLista(p.id, 'CLIENTES')}</td>
                                                        <td className="align-middle">{getPrecioProductoLista(p.id, 'DOMICILIOS')}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cambiarMasivamente' && (
                        <div className="p-3 text-center">
                            <p className="text-muted">Contenido de Cambiar Precios Masivamente</p>
                        </div>
                    )}
                </div>
            </div>

            <EditarProductoModal
                show={showModal}
                handleClose={() => {
                    setShowModal(false);
                    setProductoSeleccionado(null);
                    cargarDatos(); // Recargar datos después de editar
                }}
                producto={productoSeleccionado}
            />
        </div>
    );
};

export default InformeListaPreciosScreen;