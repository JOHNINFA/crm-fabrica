import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listaPrecioService } from '../services/listaPrecioService';
import './MaestroListaPreciosScreen.css';

const MaestroListaPreciosScreen = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('activos');
    const [busqueda, setBusqueda] = useState('');
    const [nombreArchivo, setNombreArchivo] = useState('export.csv');
    const [listas, setListas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarListas();
    }, [activeTab]);

    const cargarListas = async () => {
        try {
            setLoading(true);
            const activo = activeTab === 'activos';
            const data = await listaPrecioService.getAll({ activo });
            setListas(data);
        } catch (error) {
            console.error('Error cargando listas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id) => {
        navigate(`/editar-lista-precios/${id}`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar esta lista de precios?')) {
            try {
                await listaPrecioService.delete(id);
                cargarListas();
            } catch (error) {
                console.error('Error eliminando lista:', error);
                alert('Error al eliminar la lista de precios');
            }
        }
    };

    const handleToggleActivo = async (id, activo) => {
        try {
            await listaPrecioService.update(id, { activo: !activo });
            cargarListas();
        } catch (error) {
            console.error('Error actualizando estado:', error);
        }
    };

    const listasFiltradas = listas.filter(lista => 
        lista.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleExport = () => {
        console.log('Exportar archivo:', nombreArchivo);
    };

    return (
        <div className="maestro-lista-container bg-light">
            <div className="card shadow-sm">
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="card-title h5 mb-0">Maestro de Lista de Precios</h2>
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-add-custom btn-sm"
                                onClick={() => navigate('/crear-lista-precios')}
                            >
                                Añadir
                            </button>
                            <button 
                                className="btn btn-outline-secondary btn-regresar-custom btn-sm"
                                onClick={() => navigate('/pos')}
                            >
                                Regresar al POS
                            </button>
                        </div>
                    </div>

                    {/* Pestañas */}
                    <div className="nav nav-tabs mb-3">
                        <button 
                            className={`nav-link ${activeTab === 'activos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('activos')}
                        >
                            Activos
                        </button>
                        <button 
                            className={`nav-link ${activeTab === 'inactivos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('inactivos')}
                        >
                            Inactivos
                        </button>
                    </div>

                    {/* Contenido de pestañas */}
                    {activeTab === 'activos' && (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Acciones</th>
                                        <th>Id</th>
                                        <th>Nombre Lista</th>
                                        <th>Tipo Lista Precio</th>
                                        <th>Valor Lista Precio</th>
                                        <th>Sucursal</th>
                                        <th>Activo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan="7">
                                            <input 
                                                type="text" 
                                                className="form-control form-control-sm" 
                                                placeholder="Búsqueda General"
                                                value={busqueda}
                                                onChange={(e) => setBusqueda(e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">Cargando...</td>
                                        </tr>
                                    ) : listasFiltradas.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center">No hay listas de precios</td>
                                        </tr>
                                    ) : (
                                        listasFiltradas.map((item) => (
                                            <tr key={item.id}>
                                                <td className="actions-cell">
                                                    <button 
                                                        className="btn btn-sm btn-edit-custom me-1"
                                                        onClick={() => handleEdit(item.id)}
                                                        title="Editar"
                                                    >
                                                        <span className="material-icons" style={{fontSize: '14px'}}>edit</span>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(item.id)}
                                                        title="Eliminar"
                                                    >
                                                        <span className="material-icons" style={{fontSize: '14px'}}>close</span>
                                                    </button>
                                                </td>
                                                <td>{item.id}</td>
                                                <td>{item.nombre}</td>
                                                <td>{item.tipo}</td>
                                                <td>0</td>
                                                <td>{item.sucursal}</td>
                                                <td className="text-center">
                                                    <div className="form-check">
                                                        <input 
                                                            className="form-check-input" 
                                                            type="checkbox" 
                                                            checked={item.activo}
                                                            onChange={() => handleToggleActivo(item.id, item.activo)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'inactivos' && (
                        <div className="p-3 text-center">
                            <p className="text-muted">Aquí se mostrarían las listas de precios inactivas.</p>
                        </div>
                    )}

                    {/* Sección de exportación */}
                    <div className="export-section mt-3">
                        <div className="input-group" style={{maxWidth: '450px'}}>
                            <span className="input-group-text">Nombre Archivo:</span>
                            <input 
                                type="text" 
                                className="form-control form-control-sm"
                                value={nombreArchivo}
                                onChange={(e) => setNombreArchivo(e.target.value)}
                            />
                            <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={handleExport}
                                title="Descargar"
                            >
                                <span className="material-icons" style={{fontSize: '16px'}}>download</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaestroListaPreciosScreen;