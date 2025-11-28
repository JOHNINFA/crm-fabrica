import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listaPrecioService } from '../services/listaPrecioService';
import usePageTitle from '../hooks/usePageTitle';
import './ListaPreciosScreen.css';

const mockEmpleados = [
    { id: 1, nombre: 'SOPORTE GUERRERO' },
    { id: 2, nombre: 'Ramón Gonzalez' },
    { id: 3, nombre: 'Ana María López' },
    { id: 4, nombre: 'Carlos Sanchez' },
];

const ListaPreciosScreen = () => {
    usePageTitle('Editar Lista de Precios');
    const navigate = useNavigate();
    const { id } = useParams();
    const [nombreLista, setNombreLista] = useState('');
    const [aumentarPrecio, setAumentarPrecio] = useState(false);
    const [sucursal, setSucursal] = useState('Principal');
    const [activo, setActivo] = useState(true);
    const [tipoPrecio, setTipoPrecio] = useState('CLIENTE');
    const [busqueda, setBusqueda] = useState('');
    const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (id) {
            setIsEditing(true);
            cargarLista();
        }
    }, [id]);

    const cargarLista = async () => {
        try {
            setLoading(true);
            const lista = await listaPrecioService.getById(id);
            setNombreLista(lista.nombre);
            setTipoPrecio(lista.tipo);
            setSucursal(lista.sucursal);
            setActivo(lista.activo);
        } catch (error) {
            console.error('Error cargando lista:', error);
            alert('Error al cargar la lista de precios');
        } finally {
            setLoading(false);
        }
    };

    const handleSeleccionarEmpleado = (empleadoId) => {
        const nuevosSeleccionados = new Set(empleadosSeleccionados);
        if (nuevosSeleccionados.has(empleadoId)) {
            nuevosSeleccionados.delete(empleadoId);
        } else {
            nuevosSeleccionados.add(empleadoId);
        }
        setEmpleadosSeleccionados(nuevosSeleccionados);
    };

    const empleadosFiltrados = mockEmpleados.filter(emp =>
        emp.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombreLista.trim()) {
            alert('El nombre de la lista es requerido');
            return;
        }

        try {
            setLoading(true);
            const empleadoSeleccionado = empleadosSeleccionados.size > 0
                ? mockEmpleados.find(emp => empleadosSeleccionados.has(emp.id))?.nombre
                : null;

            const data = {
                nombre: nombreLista.trim(),
                tipo: tipoPrecio,
                empleado: empleadoSeleccionado,
                sucursal,
                activo
            };

            if (isEditing) {
                await listaPrecioService.update(id, data);
                alert('Lista de precios actualizada exitosamente');
            } else {
                await listaPrecioService.create(data);
                alert('Lista de precios creada exitosamente');
            }

            navigate('/lista-precios');
        } catch (error) {
            console.error('Error guardando lista:', error);
            alert('Error al guardar la lista de precios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lista-precios-container bg-light">
            <div className="card shadow-sm">
                <div className="card-body p-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h2 className="card-title h5 mb-0">{isEditing ? 'Editar' : 'Crear'} Lista de Precios</h2>
                        <button
                            className="btn btn-outline-secondary btn-regresar-pos-custom"
                            onClick={() => navigate('/pos')}
                        >
                            Regresar al POS
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-7">
                                <div className="mb-2">
                                    <label htmlFor="nombreLista" className="form-label">Nombre Lista</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        id="nombreLista"
                                        value={nombreLista}
                                        onChange={(e) => setNombreLista(e.target.value)}
                                    />
                                </div>

                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="aumentarPrecio"
                                        checked={aumentarPrecio}
                                        onChange={(e) => setAumentarPrecio(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="aumentarPrecio">
                                        Aumentar lista de precio en base al precio compra SI/NO
                                    </label>
                                </div>

                                <div className="mb-2">
                                    <label htmlFor="sucursal" className="form-label">Sucursal</label>
                                    <select
                                        className="form-select form-select-sm"
                                        id="sucursal"
                                        value={sucursal}
                                        onChange={(e) => setSucursal(e.target.value)}
                                    >
                                        <option>Todos</option>
                                        <option>Sucursal Principal</option>
                                        <option>Sucursal Norte</option>
                                    </select>
                                </div>

                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="activar"
                                        checked={activo}
                                        onChange={(e) => setActivo(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="activar">
                                        Activar / Inactivar
                                    </label>
                                </div>

                                <div className="empleados-seccion">
                                    <div className="table-header-custom p-2 text-white">
                                        Empleados (Si no selecciona empleado entonces sería todos)
                                    </div>
                                    <div className="p-3 border border-top-0">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm mb-2"
                                            placeholder="Buscar"
                                            value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                        />
                                        <div className="employee-list-container">
                                            {empleadosFiltrados.map(emp => (
                                                <div key={emp.id} className="form-check d-flex align-items-center mb-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`emp-${emp.id}`}
                                                        checked={empleadosSeleccionados.has(emp.id)}
                                                        onChange={() => handleSeleccionarEmpleado(emp.id)}
                                                    />
                                                    <label className="form-check-label d-flex justify-content-between w-100 ms-2" htmlFor={`emp-${emp.id}`}>
                                                        <span>{emp.id}</span>
                                                        <span>{emp.nombre}</span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-5">
                                <div className="mb-2">
                                    <label htmlFor="tipoPrecio" className="form-label">Tipo Lista Precio</label>
                                    <select
                                        className="form-select form-select-sm"
                                        id="tipoPrecio"
                                        value={tipoPrecio}
                                        onChange={(e) => setTipoPrecio(e.target.value)}
                                    >
                                        <option value="CLIENTE">Cliente</option>
                                        <option value="PROVEEDOR">Proveedor</option>
                                        <option value="EMPLEADO">Empleado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3">
                            <button type="submit" className="btn btn-guardar-custom me-2" disabled={loading}>
                                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                            </button>
                            <button type="button" className="btn btn-light border">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ListaPreciosScreen;