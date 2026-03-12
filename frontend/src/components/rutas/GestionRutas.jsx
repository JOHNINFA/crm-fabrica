import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import rutasService from '../../services/rutasService';

// Lista de días de la semana
const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

const GestionRutas = () => {
    const [rutas, setRutas] = useState([]);
    const [vendedores, setVendedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal Ruta
    const [showModal, setShowModal] = useState(false);
    const [editingRuta, setEditingRuta] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', vendedor: '' });

    // Clientes
    const [selectedRuta, setSelectedRuta] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rutaToDelete, setRutaToDelete] = useState(null);
    const [showDeleteButton, setShowDeleteButton] = useState(null); // ID de la ruta que muestra el botón
    const [clickTimeout, setClickTimeout] = useState(null);
    const [clienteForm, setClienteForm] = useState({
        nombre_negocio: '',
        nombre_contacto: '',
        direccion: '',
        telefono: '',
        tipo_negocio: '',
        dia_visita: [],
        orden: 0,
        nota: '',
        ruta: ''
    });
    const [editingCliente, setEditingCliente] = useState(null);

    // 🆕 Día seleccionado para organizar
    const [diaSeleccionado, setDiaSeleccionado] = useState(null); // null = todos, 'LUNES', 'MARTES', etc.
    const [guardandoOrden, setGuardandoOrden] = useState(false);

    // Drag to scroll
    const scrollContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // 🆕 Clientes Ocasionales
    const [clientesOcasionales, setClientesOcasionales] = useState([]);
    const [showConvertirModal, setShowConvertirModal] = useState(false);
    const [clienteAConvertir, setClienteAConvertir] = useState(null);
    const [convertirForm, setConvertirForm] = useState({ dia_visita: 'LUNES', tipo_negocio: '' });
    const [syncing, setSyncing] = useState(false);

    // 🆕 Buscadores
    const [busquedaRuta, setBusquedaRuta] = useState(''); // Filtro dentro de la ruta seleccionada
    const [busquedaGlobal, setBusquedaGlobal] = useState(''); // Búsqueda en todas las rutas
    const [resultadosGlobal, setResultadosGlobal] = useState([]);
    const [buscandoGlobal, setBuscandoGlobal] = useState(false);
    const [mensajePermisos, setMensajePermisos] = useState(null);
    const busquedaGlobalTimerRef = useRef(null);
    const mensajePermisosTimerRef = useRef(null);

    const mostrarMensajePermisos = useCallback((texto) => {
        setMensajePermisos(texto);
        if (mensajePermisosTimerRef.current) clearTimeout(mensajePermisosTimerRef.current);
        mensajePermisosTimerRef.current = setTimeout(() => {
            setMensajePermisos(null);
        }, 2200);
    }, []);

    const rutaFormularioSeleccionada = rutas.find(
        (ruta) => String(ruta.id) === String(clienteForm.ruta || selectedRuta?.id || '')
    );

    const buscarClienteGlobal = useCallback(async (texto) => {
        if (!texto || texto.trim().length < 2) {
            setResultadosGlobal([]);
            return;
        }
        setBuscandoGlobal(true);
        try {
            const { API_URL } = await import('../../services/api');
            const axios = (await import('axios')).default;
            const resp = await axios.get(`${API_URL}/clientes-ruta/?search=${encodeURIComponent(texto.trim())}`);
            const data = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
            // Cruzar con rutas para obtener nombre de ruta y vendedor
            const conRuta = data.map(c => {
                const ruta = rutas.find(r => r.id === c.ruta);
                return {
                    ...c,
                    ruta_nombre: ruta?.nombre || `Ruta ${c.ruta}`,
                    vendedor_nombre: ruta?.vendedor_nombre || '?',
                    vendedor_id: ruta?.vendedor || '?'
                };
            });
            setResultadosGlobal(conRuta.slice(0, 30)); // max 30 resultados
        } catch (err) {
            console.error('Error en búsqueda global:', err);
            setResultadosGlobal([]);
        } finally {
            setBuscandoGlobal(false);
        }
    }, [rutas]);
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [rutasData, vendedoresData] = await Promise.all([
                rutasService.obtenerRutas(),
                rutasService.obtenerVendedores()
            ]);
            // Ordenar por ID numérico del vendedor (ID1, ID2, ID3...)
            const rutasOrdenadas = rutasData.sort((a, b) => {
                const numA = parseInt((a.vendedor || '').replace(/\D/g, '')) || 999;
                const numB = parseInt((b.vendedor || '').replace(/\D/g, '')) || 999;
                return numA - numB;
            });
            setRutas(rutasOrdenadas);
            setVendedores(vendedoresData);
        } catch (err) {
            setError('Error al cargar datos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRuta = async (e) => {
        e.preventDefault();
        try {
            if (editingRuta) {
                await rutasService.actualizarRuta(editingRuta.id, formData);
            } else {
                await rutasService.crearRuta(formData);
            }
            setShowModal(false);
            cargarDatos();
        } catch (err) {
            alert('Error al guardar ruta');
        }
    };

    const confirmarEliminarRuta = (ruta) => {
        setRutaToDelete(ruta);
        setShowDeleteModal(true);
    };

    const handleEliminarRuta = async () => {
        if (!rutaToDelete) return;

        try {
            await rutasService.eliminarRuta(rutaToDelete.id);
            if (selectedRuta?.id === rutaToDelete.id) {
                setSelectedRuta(null);
                setClientes([]);
            }
            setShowDeleteModal(false);
            setRutaToDelete(null);
            setShowDeleteButton(null);
            cargarDatos();
        } catch (err) {
            alert('Error al eliminar ruta: ' + (err.message || 'Error desconocido'));
        }
    };

    const handleSelectRuta = async (ruta, dia = diaSeleccionado) => {
        setSelectedRuta(ruta);
        try {
            const clientesData = await rutasService.obtenerClientesRuta(ruta.id, dia);
            setClientes(clientesData);
            // 🆕 Cargar clientes ocasionales automáticamente
            cargarClientesOcasionales(ruta);
        } catch (err) {
            console.error(err);
        }
    };

    // 🆕 Toggle crear cliente desde app
    const handleToggleCrearCliente = async (ruta, e) => {
        e.stopPropagation();
        const nuevoValor = !ruta.permitir_crear_cliente;
        try {
            const rutasMismoVendedor = rutas.filter((r) => r.vendedor === ruta.vendedor);
            const rutasObjetivo = rutasMismoVendedor.length > 0 ? rutasMismoVendedor : [ruta];

            await Promise.all(
                rutasObjetivo.map((r) => rutasService.toggleCrearCliente(r.id, nuevoValor))
            );

            const idsActualizados = new Set(rutasObjetivo.map((r) => r.id));
            setRutas(prev => prev.map(r =>
                idsActualizados.has(r.id) ? { ...r, permitir_crear_cliente: nuevoValor } : r
            ));
            mostrarMensajePermisos(`Crear cliente aplicado a ${ruta.vendedor}`);
        } catch (err) {
            console.error('Error toggling crear cliente:', err);
            alert('Error al cambiar permiso de creación de clientes');
        }
    };

    // 🆕 Toggle venta rápida (cliente ocasional) desde app
    const handleToggleVentaRapida = async (ruta, e) => {
        e.stopPropagation();
        const nuevoValor = !(ruta.permitir_venta_rapida !== false);
        try {
            const rutasMismoVendedor = rutas.filter((r) => r.vendedor === ruta.vendedor);
            const rutasObjetivo = rutasMismoVendedor.length > 0 ? rutasMismoVendedor : [ruta];

            await Promise.all(
                rutasObjetivo.map((r) => rutasService.toggleVentaRapida(r.id, nuevoValor))
            );

            const idsActualizados = new Set(rutasObjetivo.map((r) => r.id));
            setRutas(prev => prev.map(r =>
                idsActualizados.has(r.id) ? { ...r, permitir_venta_rapida: nuevoValor } : r
            ));
            mostrarMensajePermisos(`Venta rápida aplicada a ${ruta.vendedor}`);
        } catch (err) {
            console.error('Error toggling venta rápida:', err);
            alert('Error al cambiar permiso de venta rápida');
        }
    };

    useEffect(() => {
        return () => {
            if (mensajePermisosTimerRef.current) clearTimeout(mensajePermisosTimerRef.current);
        };
    }, []);

    // 🆕 Cargar clientes ocasionales para la ruta seleccionada
    const cargarClientesOcasionales = async (ruta) => {
        if (syncing) return;
        try {
            if (!ruta?.vendedor) return;
            setSyncing(true);
            const data = await rutasService.obtenerClientesOcasionales(ruta.vendedor);
            setClientesOcasionales(data);
        } catch (err) {
            console.error('Error cargando clientes ocasionales:', err);
        } finally {
            // Pequeño delay para que la animación se aprecie
            setTimeout(() => setSyncing(false), 800);
        }
    };

    // 🆕 Convertir cliente ocasional a ruta
    const handleConvertirCliente = async () => {
        if (!clienteAConvertir || !selectedRuta) return;
        try {
            await rutasService.convertirClienteOcasional(clienteAConvertir.id, {
                ruta_id: selectedRuta.id,
                dia_visita: convertirForm.dia_visita,
                tipo_negocio: convertirForm.tipo_negocio
            });
            setShowConvertirModal(false);
            setClienteAConvertir(null);
            // Recargar datos
            cargarClientesOcasionales(selectedRuta);
            handleSelectRuta(selectedRuta, diaSeleccionado);
            alert('✅ Cliente convertido exitosamente a cliente de ruta');
        } catch (err) {
            alert('Error al convertir: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteClienteOcasional = async (co) => {
        if (window.confirm(`¿Estás seguro de eliminar el cliente ocasional "${co.nombre}"?`)) {
            try {
                await rutasService.eliminarClienteOcasional(co.id);
                // Actualizar la lista local
                setClientesOcasionales(prev => prev.filter(c => c.id !== co.id));
                console.log('✅ Cliente ocasional eliminado');
            } catch (err) {
                console.error('Error eliminando cliente ocasional:', err);
                alert('No se pudo eliminar el cliente ocasional');
            }
        }
    };

    const handleRutaClick = (ruta) => {
        // Limpiar timeout anterior
        if (clickTimeout) {
            clearTimeout(clickTimeout);
        }

        // Si ya está seleccionada, es el segundo clic - mostrar botón de eliminar
        if (selectedRuta?.id === ruta.id) {
            setShowDeleteButton(ruta.id);
            // Ocultar el botón después de 5 segundos
            const timeout = setTimeout(() => {
                setShowDeleteButton(null);
            }, 5000);
            setClickTimeout(timeout);
        } else {
            // Primer clic - seleccionar ruta
            setShowDeleteButton(null);
            handleSelectRuta(ruta);
        }
    };

    // 🆕 Cambiar día seleccionado
    const handleCambioDia = async (dia) => {
        setDiaSeleccionado(dia);
        if (selectedRuta) {
            await handleSelectRuta(selectedRuta, dia);
        }
    };

    // 🆕 Manejar drag & drop
    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        if (result.destination.index === result.source.index) return;

        const items = Array.from(clientes);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Actualizar UI inmediatamente
        setClientes(items);

        // Guardar en servidor
        if (selectedRuta && diaSeleccionado) {
            try {
                setGuardandoOrden(true);
                const clientesIds = items.map(c => c.id);
                await rutasService.guardarOrdenClientes(selectedRuta.id, diaSeleccionado, clientesIds);
                console.log('✅ Orden guardado para', diaSeleccionado);
            } catch (err) {
                console.error('Error guardando orden:', err);
            } finally {
                setGuardandoOrden(false);
            }
        }
    };

    const handleSaveCliente = async (e) => {
        e.preventDefault();
        try {
            const rutaDestinoId = clienteForm.ruta || selectedRuta?.id;
            if (!rutaDestinoId) {
                alert('Debes seleccionar una ruta');
                return;
            }

            // Convertir array de días a string separado por comas
            const diasString = Array.isArray(clienteForm.dia_visita)
                ? clienteForm.dia_visita.join(',')
                : clienteForm.dia_visita;

            // Solo enviar los campos necesarios
            const data = {
                nombre_negocio: clienteForm.nombre_negocio,
                nombre_contacto: clienteForm.nombre_contacto || '',
                direccion: clienteForm.direccion || '',
                telefono: clienteForm.telefono || '',
                tipo_negocio: clienteForm.tipo_negocio || '',
                dia_visita: diasString,
                dia_visita: diasString,
                orden: clienteForm.orden || 0,
                nota: clienteForm.nota || '', // 🆕 Enviar nota
                ruta: rutaDestinoId,
                activo: true
            };



            if (editingCliente) {
                await rutasService.actualizarClienteRuta(editingCliente.id, data);
            } else {
                await rutasService.crearClienteRuta(data);
            }
            setShowClienteModal(false);
            const rutaDestino = rutas.find((ruta) => String(ruta.id) === String(rutaDestinoId));
            if (rutaDestino) {
                handleSelectRuta(rutaDestino, diaSeleccionado);
            } else {
                handleSelectRuta(selectedRuta, diaSeleccionado);
            }
        } catch (err) {
            console.error('Error detallado:', err.response?.data || err);
            alert('Error al guardar cliente: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
        }
    };

    const handleDeleteCliente = async (id) => {
        if (window.confirm('¿Eliminar cliente?')) {
            await rutasService.eliminarClienteRuta(id);
            handleSelectRuta(selectedRuta);
        }
    };

    // Funciones para drag to scroll
    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        scrollContainerRef.current.style.cursor = 'grabbing';
        scrollContainerRef.current.style.userSelect = 'none';
    };

    const handleMouseLeave = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
            scrollContainerRef.current.style.userSelect = 'auto';
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
            scrollContainerRef.current.style.userSelect = 'auto';
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Multiplicar por 2 para hacer el scroll más rápido
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                `}
            </style>
        <Container fluid style={{ padding: '0 8px' }}>
            {mensajePermisos && (
                <Alert variant="success" style={{ marginBottom: '10px', padding: '8px 12px', fontSize: '0.9rem' }}>
                    {mensajePermisos}
                </Alert>
            )}

            {/* 🆕 Buscador Global de Clientes */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '10px', padding: '8px 12px',
                backgroundColor: '#f8fafc', borderRadius: '10px',
                border: '1px solid #e2e8f0'
            }}>
                <span className="material-icons" style={{ color: '#6b7280', fontSize: '1.25rem' }}>search</span>
                <input
                    type="text"
                    placeholder="🔍 Buscar cliente en TODAS las rutas (nombre, negocio, teléfono, dirección)..."
                    value={busquedaGlobal}
                    onChange={(e) => {
                        setBusquedaGlobal(e.target.value);
                        if (busquedaGlobalTimerRef.current) clearTimeout(busquedaGlobalTimerRef.current);
                        busquedaGlobalTimerRef.current = setTimeout(() => {
                            buscarClienteGlobal(e.target.value);
                        }, 500);
                    }}
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        backgroundColor: 'transparent', fontSize: '0.9rem',
                        fontFamily: "'Inter', sans-serif"
                    }}
                />
                {busquedaGlobal && (
                    <button onClick={() => { setBusquedaGlobal(''); setResultadosGlobal([]); }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.2rem' }}>✕</button>
                )}
                {buscandoGlobal && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Buscando...</span>}
            </div>

            {/* Resultados de búsqueda global */}
            {resultadosGlobal.length > 0 && (
                <Card className="shadow-sm mb-3" style={{ border: '1px solid #dbeafe', borderRadius: '10px', overflow: 'hidden' }}>
                    <Card.Header style={{ backgroundColor: '#eff6ff', padding: '10px 16px', borderBottom: '1px solid #dbeafe' }}>
                        <span style={{ fontWeight: '600', color: '#1e40af', fontSize: '0.85rem' }}>
                            🔍 {resultadosGlobal.length} resultado(s) en todas las rutas
                        </span>
                    </Card.Header>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <Table size="sm" hover style={{ marginBottom: 0, fontSize: '0.8rem' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc' }}>
                                <tr>
                                    <th style={{ padding: '8px 12px' }}>Negocio</th>
                                    <th style={{ padding: '8px 12px' }}>Contacto</th>
                                    <th style={{ padding: '8px 12px' }}>Teléfono</th>
                                    <th style={{ padding: '8px 12px' }}>Ruta</th>
                                    <th style={{ padding: '8px 12px' }}>Vendedor</th>
                                    <th style={{ padding: '8px 12px' }}>Días Visita</th>
                                    <th style={{ padding: '8px 12px' }}>Dirección</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultadosGlobal.map(c => (
                                    <tr key={c.id} style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            const ruta = rutas.find(r => r.id === c.ruta);
                                            if (ruta) {
                                                handleSelectRuta(ruta);
                                                setBusquedaGlobal('');
                                                setResultadosGlobal([]);
                                                setBusquedaRuta(c.nombre_negocio);
                                            }
                                        }}
                                    >
                                        <td style={{ padding: '8px 12px', fontWeight: '600' }}>{c.nombre_negocio}</td>
                                        <td style={{ padding: '8px 12px' }}>{c.nombre_contacto}</td>
                                        <td style={{ padding: '8px 12px' }}>{c.telefono}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <Badge bg="primary" style={{ fontSize: '0.7rem' }}>{c.ruta_nombre}</Badge>
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
                                            {c.vendedor_nombre} <span style={{ color: '#9ca3af' }}>({c.vendedor_id})</span>
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.7rem' }}>{c.dia_visita}</td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#6b7280' }}>{c.direccion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}

            <Row className="g-2">
                {/* LISTA DE RUTAS */}
                <Col md={2} style={{ paddingLeft: '8px', paddingRight: '0' }}>
                    <Card className="shadow-sm mb-4" style={{ border: 'none', borderRadius: '12px', overflow: 'hidden' }}>
                        <Card.Header
                            style={{
                                backgroundColor: '#0f3460',
                                color: 'white',
                                padding: '24px 16px',
                                border: 'none'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <h6 className="mb-0" style={{ color: 'white', fontSize: '1.125rem', fontWeight: 'bold', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>Rutas</h6>
                                <span className="material-icons" style={{ opacity: 0.5 }}>alt_route</span>
                            </div>
                            <Button
                                variant="light"
                                size="sm"
                                onClick={() => {
                                    setEditingRuta(null);
                                    setFormData({ nombre: '', vendedor: '' });
                                    setShowModal(true);
                                }}
                                style={{
                                    fontSize: '0.875rem',
                                    padding: '8px 16px',
                                    width: '100%',
                                    fontWeight: '600',
                                    backgroundColor: 'white',
                                    color: '#0f3460',
                                    border: 'none',
                                    borderRadius: '6px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '0.875rem' }}>add</span>
                                Nueva
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="list-group list-group-flush">
                                {rutas.map(ruta => {
                                    const isActive = selectedRuta?.id === ruta.id;
                                    const showDelete = showDeleteButton === ruta.id;
                                    return (
                                        <button
                                            key={ruta.id}
                                            className="list-group-item list-group-item-action"
                                            onClick={() => handleRutaClick(ruta)}
                                            style={isActive ? {
                                                backgroundColor: '#dbeafe',
                                                borderLeft: '4px solid #0f3460',
                                                color: '#0f3460',
                                                fontSize: '0.875rem',
                                                padding: '16px 24px',
                                                border: 'none',
                                                borderBottom: '1px solid #e5e7eb',
                                                fontFamily: "'Inter', sans-serif"
                                            } : {
                                                fontSize: '0.875rem',
                                                padding: '16px 24px',
                                                borderLeft: '4px solid transparent',
                                                border: 'none',
                                                borderBottom: '1px solid #e5e7eb',
                                                transition: 'all 0.2s',
                                                fontFamily: "'Inter', sans-serif"
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: '700', color: isActive ? '#0f3460' : '#374151', marginBottom: '4px' }}>
                                                        {ruta.nombre}
                                                    </div>
                                                    <small style={{
                                                        color: isActive ? '#6b7280' : '#9ca3af',
                                                        fontSize: '0.75rem',
                                                        textTransform: 'uppercase',
                                                        fontWeight: '500',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        {ruta.vendedor_nombre || 'Sin vendedor'} <span style={{ color: '#9ca3af', fontWeight: '400' }}>({ruta.vendedor})</span>
                                                    </small>
                                                    {/* 🆕 Toggle Crear Cliente */}
                                                    <div
                                                        onClick={(e) => handleToggleCrearCliente(ruta, e)}
                                                        title={ruta.permitir_crear_cliente !== false ? 'Click para DESHABILITAR crear cliente en App' : 'Click para HABILITAR crear cliente en App'}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            marginTop: '4px',
                                                            cursor: 'pointer',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            backgroundColor: ruta.permitir_crear_cliente !== false ? '#dcfce7' : '#f3f4f6',
                                                            width: 'fit-content',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <span style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: ruta.permitir_crear_cliente !== false ? '#22c55e' : '#9ca3af',
                                                            transition: 'background-color 0.2s'
                                                        }} />
                                                        <span style={{
                                                            fontSize: '0.625rem',
                                                            color: ruta.permitir_crear_cliente !== false ? '#15803d' : '#9ca3af',
                                                            fontWeight: '500',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {ruta.permitir_crear_cliente !== false ? 'CREAR CLIENTE ✅' : 'CREAR CLIENTE ❌'}
                                                        </span>
                                                    </div>
                                                    {/* 🆕 Toggle Venta Rápida */}
                                                    <div
                                                        onClick={(e) => handleToggleVentaRapida(ruta, e)}
                                                        title={ruta.permitir_venta_rapida !== false ? 'Click para DESHABILITAR venta rápida en App' : 'Click para HABILITAR venta rápida en App'}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            marginTop: '2px',
                                                            cursor: 'pointer',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            backgroundColor: ruta.permitir_venta_rapida !== false ? '#fef3c7' : '#f3f4f6',
                                                            width: 'fit-content',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <span style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            backgroundColor: ruta.permitir_venta_rapida !== false ? '#f59e0b' : '#9ca3af',
                                                            transition: 'background-color 0.2s'
                                                        }} />
                                                        <span style={{
                                                            fontSize: '0.625rem',
                                                            color: ruta.permitir_venta_rapida !== false ? '#92400e' : '#9ca3af',
                                                            fontWeight: '500',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {ruta.permitir_venta_rapida !== false ? 'VENTA RÁPIDA ⚡' : 'VENTA RÁPIDA ❌'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isActive && (
                                                        <>
                                                            <span style={{
                                                                backgroundColor: 'rgba(15, 52, 96, 0.1)',
                                                                color: '#0f3460',
                                                                fontSize: '0.625rem',
                                                                padding: '2px 8px',
                                                                borderRadius: '9999px',
                                                                fontWeight: 'bold',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.1em'
                                                            }}>
                                                                Activa
                                                            </span>
                                                            {showDelete && (
                                                                <div style={{ display: 'flex', gap: '3px' }}>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingRuta(ruta);
                                                                            setFormData({ nombre: ruta.nombre, vendedor: ruta.vendedor || '' });
                                                                            setShowModal(true);
                                                                            setShowDeleteButton(null);
                                                                        }}
                                                                        style={{
                                                                            background: '#0f3460',
                                                                            border: 'none',
                                                                            color: 'white',
                                                                            cursor: 'pointer',
                                                                            padding: '3px 5px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            borderRadius: '4px',
                                                                            transition: 'all 0.2s',
                                                                            animation: 'fadeIn 0.3s'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.backgroundColor = '#2563eb';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.backgroundColor = '#0f3460';
                                                                        }}
                                                                        title="Editar ruta"
                                                                    >
                                                                        <span className="material-icons" style={{ fontSize: '13px' }}>edit</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            confirmarEliminarRuta(ruta);
                                                                        }}
                                                                        style={{
                                                                            background: '#0f3460',
                                                                            border: 'none',
                                                                            color: 'white',
                                                                            cursor: 'pointer',
                                                                            padding: '3px 5px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            borderRadius: '4px',
                                                                            transition: 'all 0.2s',
                                                                            animation: 'fadeIn 0.3s'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.backgroundColor = '#dc3545';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.backgroundColor = '#0f3460';
                                                                        }}
                                                                        title="Eliminar ruta"
                                                                    >
                                                                        <span className="material-icons" style={{ fontSize: '13px' }}>delete</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                                {rutas.length === 0 && <div className="p-3 text-center text-muted" style={{ fontSize: '0.875rem', fontFamily: "'Inter', sans-serif" }}>No hay rutas</div>}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* DETALLE DE CLIENTES */}
                <Col md={10} style={{ paddingRight: '5px' }}>
                    {selectedRuta ? (
                        <Card className="shadow-sm" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                            <Card.Header style={{
                                backgroundColor: 'white',
                                borderBottom: '1px solid #e5e7eb',
                                padding: '16px 24px'
                            }}>
                                {/* Fila 1: Título y botones de acción */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h2 style={{
                                        marginBottom: 0,
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        color: '#111827',
                                        fontFamily: "'Inter', sans-serif",
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span style={{ fontWeight: '400', fontSize: '1.125rem', color: '#0f3460' }}>Clientes de:</span>
                                        {selectedRuta.nombre}
                                        {guardandoOrden && (
                                            <span style={{ fontSize: '0.75rem', color: '#22c55e', marginLeft: '8px' }}>
                                                💾 Guardando...
                                            </span>
                                        )}
                                    </h2>

                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {/* 🆕 Botón Sincronizar (Recargar) con efecto spin */}
                                        <Button
                                            variant="light"
                                            onClick={async () => {
                                                setSyncing(true);
                                                await handleSelectRuta(selectedRuta, diaSeleccionado);
                                                setTimeout(() => setSyncing(false), 800);
                                            }}
                                            title="Sincronizar datos (Recargar lista)"
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#0284c7',
                                                padding: '8px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <span
                                                className="material-icons"
                                                style={{
                                                    fontSize: '1.75rem',
                                                    animation: syncing ? 'spin 0.8s linear infinite' : 'none',
                                                    transition: 'transform 0.2s'
                                                }}
                                            >sync</span>
                                        </Button>

                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => {
                                                setEditingCliente(null);
                                                const maxOrden = clientes.length > 0
                                                    ? Math.max(...clientes.map(c => c.orden || 0))
                                                    : 0;
                                                setClienteForm({
                                                    nombre_negocio: '', nombre_contacto: '', direccion: '', telefono: '', tipo_negocio: '',
                                                    dia_visita: [],
                                                    orden: maxOrden + 1,
                                                    nota: '',
                                                    ruta: selectedRuta?.id || ''
                                                });
                                                setShowClienteModal(true);
                                            }}
                                            style={{
                                                backgroundColor: '#22c55e',
                                                border: 'none',
                                                fontWeight: '500',
                                                padding: '8px 20px',
                                                borderRadius: '6px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '0.875rem',
                                                fontFamily: "'Inter', sans-serif"
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: '1.125rem' }}>add_circle</span>
                                            Agregar Cliente
                                        </Button>
                                    </div>
                                </div>

                                {/* Fila 2: Selector de días */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                                        📅 Organizar por día:
                                    </span>
                                    <Button
                                        size="sm"
                                        variant={diaSeleccionado === null ? 'primary' : 'outline-secondary'}
                                        onClick={() => handleCambioDia(null)}
                                        style={{
                                            borderRadius: '20px',
                                            padding: '4px 12px',
                                            fontSize: '0.75rem',
                                            fontWeight: diaSeleccionado === null ? '600' : '400'
                                        }}
                                    >
                                        TODOS
                                    </Button>
                                    {DIAS_SEMANA.map(dia => (
                                        <Button
                                            key={dia}
                                            size="sm"
                                            variant={diaSeleccionado === dia ? 'primary' : 'outline-secondary'}
                                            onClick={() => handleCambioDia(dia)}
                                            style={{
                                                borderRadius: '20px',
                                                padding: '4px 12px',
                                                fontSize: '0.75rem',
                                                fontWeight: diaSeleccionado === dia ? '600' : '400'
                                            }}
                                        >
                                            {dia.substring(0, 3)}
                                        </Button>
                                    ))}
                                    {diaSeleccionado && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: '#0f3460',
                                            backgroundColor: '#dbeafe',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontWeight: '500'
                                        }}>
                                            ≡ Arrastra para reordenar
                                        </span>
                                    )}
                                </div>

                                {/* 🆕 Fila 3: Buscador Local y Feedback de Búsqueda Global */}
                                {(busquedaRuta !== '' || true) /* Siempre mostramos el buscador local */ && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        marginTop: '12px', padding: '6px 10px',
                                        backgroundColor: busquedaRuta ? '#eff6ff' : '#f9fafb',
                                        border: `1px solid ${busquedaRuta ? '#bfdbfe' : '#e5e7eb'}`,
                                        borderRadius: '8px'
                                    }}>
                                        <span className="material-icons" style={{ color: busquedaRuta ? '#3b82f6' : '#9ca3af', fontSize: '1.1rem' }}>
                                            {busquedaRuta ? 'filter_alt' : 'search'}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder={`Filtrar en ${selectedRuta.nombre} (nombre, teléfono, dir)...`}
                                            value={busquedaRuta}
                                            onChange={(e) => setBusquedaRuta(e.target.value)}
                                            style={{
                                                flex: 1, border: 'none', background: 'transparent',
                                                outline: 'none', fontSize: '0.85rem',
                                                color: '#1f2937', fontFamily: "'Inter', sans-serif"
                                            }}
                                        />
                                        {busquedaRuta && (
                                            <button onClick={() => setBusquedaRuta('')}
                                                style={{
                                                    border: 'none', background: 'none', cursor: 'pointer',
                                                    color: '#ef4444', fontSize: '1rem',
                                                    display: 'flex', alignItems: 'center'
                                                }}>
                                                <span className="material-icons" style={{ fontSize: '1.1rem' }}>close</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Card.Header>
                            <Card.Body
                                ref={scrollContainerRef}
                                onMouseDown={handleMouseDown}
                                onMouseLeave={handleMouseLeave}
                                onMouseUp={handleMouseUp}
                                onMouseMove={handleMouseMove}
                                style={{
                                    overflowX: 'auto',
                                    padding: '0',
                                    cursor: 'grab',
                                    fontFamily: "'Inter', sans-serif"
                                }}
                            >
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Table hover size="sm" style={{ minWidth: '1200px', marginBottom: 0, borderCollapse: 'collapse' }}>
                                        <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 1 }}>
                                            <tr>
                                                <th style={{
                                                    width: '60px',
                                                    textAlign: 'center',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>#</th>
                                                <th style={{
                                                    minWidth: '200px',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>Negocio</th>
                                                <th style={{
                                                    minWidth: '150px',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>Contacto</th>
                                                <th style={{
                                                    minWidth: '120px',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>Teléfono</th>
                                                <th style={{
                                                    minWidth: '140px',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>Tipo Negocio</th>
                                                <th style={{
                                                    textAlign: 'center',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>Origen</th>
                                                <th style={{
                                                    minWidth: '200px',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>Nota</th>
                                                <th style={{
                                                    minWidth: '220px',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>Días Visita</th>
                                                <th style={{
                                                    minWidth: '300px',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none'
                                                }}>Dirección</th>
                                                <th style={{
                                                    width: '80px',
                                                    textAlign: 'center',
                                                    padding: '16px',
                                                    fontWeight: '600',
                                                    fontSize: '0.75rem',
                                                    color: '#6b7280',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    border: 'none',
                                                    position: 'sticky',
                                                    right: 0,
                                                    backgroundColor: '#f9fafb',
                                                    boxShadow: '-2px 0 4px rgba(0,0,0,0.05)'
                                                }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <Droppable droppableId="clientes-list" isDropDisabled={diaSeleccionado === null || busquedaRuta !== ''}>
                                            {(provided) => (
                                                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                                    {clientes
                                                        // Aplicar filtros de Día y Búsqueda Local
                                                        .filter(c => {
                                                            let matchDia = true;
                                                            if (diaSeleccionado) {
                                                                matchDia = c.dia_visita && c.dia_visita.includes(diaSeleccionado);
                                                            }
                                                            let matchBusqueda = true;
                                                            if (busquedaRuta) {
                                                                const sP = busquedaRuta.toLowerCase();
                                                                matchBusqueda = (
                                                                    (c.nombre_negocio && c.nombre_negocio.toLowerCase().includes(sP)) ||
                                                                    (c.nombre_contacto && c.nombre_contacto.toLowerCase().includes(sP)) ||
                                                                    (c.telefono && String(c.telefono).includes(sP)) ||
                                                                    (c.direccion && c.direccion.toLowerCase().includes(sP))
                                                                );
                                                            }
                                                            return matchDia && matchBusqueda;
                                                        })
                                                        .map((cliente, index) => (
                                                            <Draggable
                                                                key={cliente.id}
                                                                draggableId={String(cliente.id)}
                                                                index={index}
                                                                isDragDisabled={diaSeleccionado === null || busquedaRuta !== '' || editingCliente !== null || cliente.es_ocasional}
                                                            >
                                                            {(provided, snapshot) => (
                                                                <tr
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        borderBottom: '1px solid #f3f4f6',
                                                                        backgroundColor: snapshot.isDragging ? '#dbeafe' : (index % 2 === 0 ? '#ffffff' : '#f9fafb'),
                                                                        transition: 'background-color 0.2s',
                                                                        boxShadow: snapshot.isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                                                                    }}
                                                                >
                                                                    <td style={{
                                                                        textAlign: 'center',
                                                                        fontWeight: 'bold',
                                                                        color: '#0f3460',
                                                                        fontSize: '0.875rem',
                                                                        padding: '16px',
                                                                        border: 'none',
                                                                        cursor: diaSeleccionado ? 'grab' : 'default'
                                                                    }} {...provided.dragHandleProps}>
                                                                        {diaSeleccionado ? (
                                                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                                                <span style={{ color: '#9ca3af', fontSize: '1.2rem' }}>≡</span>
                                                                                {index + 1}
                                                                            </span>
                                                                        ) : (
                                                                            cliente.orden
                                                                        )}
                                                                    </td>
                                                                    <td style={{
                                                                        fontWeight: '600',
                                                                        fontSize: '0.875rem',
                                                                        padding: '16px',
                                                                        border: 'none',
                                                                        color: '#111827'
                                                                    }}>{cliente.nombre_negocio}</td>
                                                                    <td style={{
                                                                        fontSize: '0.875rem',
                                                                        padding: '16px',
                                                                        border: 'none',
                                                                        color: '#1f2937',
                                                                        fontWeight: '500'
                                                                    }}>{cliente.nombre_contacto || '-'}</td>
                                                                    <td style={{
                                                                        fontSize: '0.875rem',
                                                                        padding: '16px',
                                                                        border: 'none',
                                                                        color: '#1f2937',
                                                                        fontFamily: 'monospace',
                                                                        fontWeight: '500'
                                                                    }}>{cliente.telefono || '-'}</td>
                                                                    <td style={{ padding: '16px', border: 'none' }}>
                                                                        {cliente.tipo_negocio ? (
                                                                            <span style={{
                                                                                fontSize: '0.875rem',
                                                                                color: '#111827',
                                                                                fontWeight: '500'
                                                                            }}>
                                                                                {cliente.tipo_negocio.split('|')[0].trim().charAt(0).toUpperCase() + cliente.tipo_negocio.split('|')[0].trim().slice(1).toLowerCase()}
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontStyle: 'italic' }}>Sin especificar</span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ textAlign: 'center', padding: '16px', border: 'none' }}>
                                                                        <span style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            padding: '2px 10px',
                                                                            borderRadius: '9999px',
                                                                            fontSize: '0.625rem',
                                                                            fontWeight: 'bold',
                                                                            backgroundColor: cliente.tipo_negocio?.includes('PEDIDOS') ? '#dbeafe' : '#e0f2fe',
                                                                            color: cliente.tipo_negocio?.includes('PEDIDOS') ? '#1e40af' : '#0369a1',
                                                                            border: `1px solid ${cliente.tipo_negocio?.includes('PEDIDOS') ? '#bfdbfe' : '#bae6fd'}`
                                                                        }}>
                                                                            {cliente.tipo_negocio?.includes('PEDIDOS') ? 'PEDIDOS' : 'RUTA'}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '16px', border: 'none' }}>
                                                                        {cliente.nota ? (
                                                                            <div style={{
                                                                                backgroundColor: '#fffbe6',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '4px',
                                                                                border: '1px solid #ffe58f',
                                                                                fontSize: '0.75rem',
                                                                                color: '#d48806',
                                                                                maxWidth: '200px',
                                                                                whiteSpace: 'normal'
                                                                            }}>
                                                                                {cliente.nota}
                                                                            </div>
                                                                        ) : (
                                                                            <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>-</span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '16px', border: 'none' }}>
                                                                        {cliente.dia_visita ? (
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                                {cliente.dia_visita.split(',').map((dia, idx, arr) => (
                                                                                    <span
                                                                                        key={idx}
                                                                                        style={{
                                                                                            fontSize: '0.875rem',
                                                                                            color: '#06386D',
                                                                                            fontWeight: '500'
                                                                                        }}
                                                                                    >
                                                                                        {dia.trim().charAt(0).toUpperCase() + dia.trim().slice(1).toLowerCase()}{idx < arr.length - 1 ? ', ' : ''}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                color: '#9ca3af',
                                                                                fontStyle: 'italic'
                                                                            }}>Sin asignar</span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{
                                                                        fontSize: '0.875rem',
                                                                        color: '#111827',
                                                                        fontWeight: '500',
                                                                        padding: '16px',
                                                                        border: 'none'
                                                                    }}>
                                                                        {cliente.direccion || '-'}
                                                                    </td>
                                                                    <td style={{
                                                                        textAlign: 'center',
                                                                        whiteSpace: 'nowrap',
                                                                        padding: '16px',
                                                                        border: 'none',
                                                                        position: 'sticky',
                                                                        right: 0,
                                                                        backgroundColor: snapshot.isDragging ? '#dbeafe' : (index % 2 === 0 ? '#ffffff' : '#f9fafb'),
                                                                        boxShadow: '-2px 0 4px rgba(0,0,0,0.05)'
                                                                    }}>
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="p-0 me-2"
                                                                            style={{ fontSize: '1.2rem', textDecoration: 'none' }}
                                                                            onClick={() => {
                                                                                setEditingCliente(cliente);
                                                                                const diasArray = cliente.dia_visita ? cliente.dia_visita.split(',') : [];
                                                                                setClienteForm({
                                                                                    ...cliente,
                                                                                    dia_visita: diasArray,
                                                                                    ruta: cliente.ruta || selectedRuta?.id || ''
                                                                                });
                                                                                setShowClienteModal(true);
                                                                            }}
                                                                        >
                                                                            ✏️
                                                                        </Button>
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="p-0"
                                                                            style={{ fontSize: '1.2rem', textDecoration: 'none' }}
                                                                            onClick={() => handleDeleteCliente(cliente.id)}
                                                                        >
                                                                            🗑️
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                    {clientes.length === 0 && (
                                                        <tr><td colSpan="10" className="text-center text-muted py-4" style={{ border: 'none' }}>No hay clientes en esta ruta</td></tr>
                                                    )}
                                                </tbody>
                                            )}
                                        </Droppable>
                                    </Table>
                                </DragDropContext>
                            </Card.Body>
                            <Card.Footer className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>
                                    Mostrando 1 a {clientes.length} de {clientes.length} registros
                                </span>
                                <div className="d-flex gap-2">
                                    <Button variant="light" size="sm" disabled style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', color: '#9ca3af', padding: '4px 8px' }}>
                                        <span className="material-icons" style={{ fontSize: '1.25rem' }}>chevron_left</span>
                                    </Button>
                                    <Button variant="light" size="sm" disabled style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', color: '#9ca3af', padding: '4px 8px' }}>
                                        <span className="material-icons" style={{ fontSize: '1.25rem' }}>chevron_right</span>
                                    </Button>
                                </div>
                            </Card.Footer>
                        </Card>
                    ) : (
                        <Alert variant="info">Selecciona una ruta para ver sus clientes</Alert>
                    )}
                </Col>
            </Row>

            {/* 🆕 SECCIÓN: CLIENTES OCASIONALES */}
            {selectedRuta && (
                <Row className="mt-3">
                    <Col>
                        <Card className="shadow-sm" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <Card.Header style={{
                                backgroundColor: '#f8fafc',
                                borderBottom: '1px solid #e2e8f0',
                                padding: '12px 24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        backgroundColor: '#e0f2fe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <span className="material-icons" style={{ fontSize: '18px', color: '#0369a1' }}>flash_on</span>
                                    </div>
                                    <div>
                                        <h5 style={{ margin: 0, fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>
                                            Clientes Ocasionales
                                        </h5>
                                        <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Ventas rápidas en calle — {selectedRuta.nombre}</small>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* Tope de venta */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Tope de Venta (Diario)</span>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}>$</span>
                                            <input
                                                type="number"
                                                step="1000"
                                                min="0"
                                                value={parseInt(selectedRuta.tope_cliente_ocasional) || 60000}
                                                onChange={async (e) => {
                                                    const nuevoTope = parseInt(e.target.value) || 0;
                                                    setRutas(prev => prev.map(r =>
                                                        r.id === selectedRuta.id ? { ...r, tope_cliente_ocasional: nuevoTope } : r
                                                    ));
                                                    setSelectedRuta(prev => ({ ...prev, tope_cliente_ocasional: nuevoTope }));
                                                }}
                                                onBlur={async (e) => {
                                                    e.target.style.borderColor = '#cbd5e1';
                                                    const nuevoTope = parseInt(e.target.value) || 60000;
                                                    try {
                                                        const axios = (await import('axios')).default;
                                                        const { API_URL } = await import('../../services/api');
                                                        await axios.patch(`${API_URL}/rutas/${selectedRuta.id}/`, {
                                                            tope_cliente_ocasional: nuevoTope
                                                        });
                                                        console.log(`✅ Tope actualizado a $${nuevoTope.toLocaleString()}`);
                                                    } catch (err) {
                                                        console.error('Error guardando tope:', err);
                                                        alert('Error al guardar el tope');
                                                    }
                                                }}
                                                style={{
                                                    width: '110px',
                                                    padding: '6px 8px 6px 18px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #cbd5e1',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    color: '#334155',
                                                    backgroundColor: 'white',
                                                    textAlign: 'right',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s',
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => cargarClientesOcasionales(selectedRuta)}
                                        style={{ 
                                            background: 'none',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '6px',
                                            padding: '4px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            color: '#3b82f6',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#eff6ff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                        disabled={syncing}
                                    >
                                        <span 
                                            className={`material-icons ${syncing ? 'animate-spin' : ''}`} 
                                            style={{ fontSize: '16px', verticalAlign: 'middle' }}
                                        >
                                            sync
                                        </span> 
                                        {syncing ? 'Actualizando...' : 'Actualizar'}
                                    </button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {clientesOcasionales.length === 0 ? (
                                    <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                                        No hay clientes ocasionales registrados.
                                        <br /><small>Cuando un vendedor haga una venta rápida desde la app, aparecerán aquí.</small>
                                    </div>
                                ) : (
                                    <Table hover responsive style={{ margin: 0, fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Nombre</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Teléfono</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Dirección</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clientesOcasionales.map(co => (
                                                <tr key={co.id}>
                                                    <td style={{ padding: '10px 16px', fontWeight: '500' }}>{co.nombre}</td>
                                                    <td style={{ padding: '10px 16px' }}>{co.telefono || '-'}</td>
                                                    <td style={{ padding: '10px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{co.direccion || '-'}</td>
                                                    <td style={{ padding: '10px 16px' }}>
                                                        {co.convertido ? (
                                                             <span style={{ 
                                                                 backgroundColor: '#dcfce7', 
                                                                 color: '#15803d', 
                                                                 padding: '4px 10px', 
                                                                 borderRadius: '6px',
                                                                 fontSize: '0.75rem',
                                                                 fontWeight: '600'
                                                             }}>Convertido</span>
                                                         ) : (
                                                             <span style={{ 
                                                                 backgroundColor: '#e0f2fe', 
                                                                 color: '#0369a1', 
                                                                 border: '1px solid #bae6fd',
                                                                 padding: '4px 10px',
                                                                 borderRadius: '6px',
                                                                 fontSize: '0.75rem',
                                                                 fontWeight: '600',
                                                                 display: 'inline-block'
                                                             }}>Ocasional</span>
                                                         )}
                                                    </td>
                                                    <td style={{ padding: '8px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                                                        {!co.convertido && (
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                justifyContent: 'center', 
                                                                alignItems: 'center',
                                                                gap: '16px' 
                                                            }}>
                                                                {/* Botón Convertir - Minimalista */}
                                                                <button
                                                                    onClick={() => {
                                                                        setClienteAConvertir(co);
                                                                        setConvertirForm({ dia_visita: 'LUNES', tipo_negocio: '' });
                                                                        setShowConvertirModal(true);
                                                                    }}
                                                                    style={{ 
                                                                        background: 'none',
                                                                        border: '1px solid #e2e8f0',
                                                                        borderRadius: '6px',
                                                                        padding: '4px 12px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: '500',
                                                                        color: '#475569',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.borderColor = '#3b82f6';
                                                                        e.currentTarget.style.color = '#3b82f6';
                                                                        e.currentTarget.style.backgroundColor = '#eff6ff';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                                                        e.currentTarget.style.color = '#475569';
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                    }}
                                                                >
                                                                    <span className="material-icons" style={{ fontSize: '16px' }}>add_road</span>
                                                                    Convertir
                                                                </button>
                                                                
                                                                {/* Botón Eliminar - Minimalista */}
                                                                <button
                                                                    onClick={() => handleDeleteClienteOcasional(co)}
                                                                    style={{ 
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        padding: '4px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        color: '#94a3b8',
                                                                        cursor: 'pointer',
                                                                        transition: 'color 0.2s',
                                                                        outline: 'none'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                                                    title="Eliminar registro"
                                                                >
                                                                    <span className="material-icons" style={{ fontSize: '18px' }}>delete_outline</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* MODAL RUTA */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>{editingRuta ? 'Editar Ruta' : 'Nueva Ruta'}</Modal.Title></Modal.Header>
                <Form onSubmit={handleSaveRuta}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre de la Ruta</Form.Label>
                            <Form.Control required type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Vendedor Asignado</Form.Label>
                            <Form.Select value={formData.vendedor} onChange={e => setFormData({ ...formData, vendedor: e.target.value })}>
                                <option value="">Seleccionar...</option>
                                {vendedores.map(v => (
                                    <option key={v.id_vendedor} value={v.id_vendedor}>{v.nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Guardar</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* MODAL CLIENTE */}
            <Modal show={showClienteModal} onHide={() => setShowClienteModal(false)} scrollable={true} size="lg">
                <Modal.Header closeButton><Modal.Title>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</Modal.Title></Modal.Header>
                <Form onSubmit={handleSaveCliente}>
                    <Modal.Body className="pb-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre Negocio</Form.Label>
                                    <Form.Control required type="text" value={clienteForm.nombre_negocio} onChange={e => setClienteForm({ ...clienteForm, nombre_negocio: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre Contacto</Form.Label>
                                    <Form.Control type="text" placeholder="Nombre del dueño/encargado" value={clienteForm.nombre_contacto} onChange={e => setClienteForm({ ...clienteForm, nombre_contacto: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Orden</Form.Label>
                                    <Form.Control type="number" value={clienteForm.orden} onChange={e => setClienteForm({ ...clienteForm, orden: e.target.value })} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de Negocio</Form.Label>
                                    <Form.Control type="text" placeholder="Ej: Supermercado, Carnicería, etc." value={clienteForm.tipo_negocio} onChange={e => setClienteForm({ ...clienteForm, tipo_negocio: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Teléfono</Form.Label>
                                    <Form.Control type="text" value={clienteForm.telefono} onChange={e => setClienteForm({ ...clienteForm, telefono: e.target.value })} />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Dirección</Form.Label>
                            <Form.Control type="text" value={clienteForm.direccion} onChange={e => setClienteForm({ ...clienteForm, direccion: e.target.value })} />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ruta</Form.Label>
                                    <Form.Select
                                        value={clienteForm.ruta || selectedRuta?.id || ''}
                                        onChange={e => setClienteForm({ ...clienteForm, ruta: e.target.value })}
                                    >
                                        <option value="">Seleccionar ruta...</option>
                                        {rutas.map((ruta) => (
                                            <option key={ruta.id} value={ruta.id}>
                                                {ruta.nombre}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ID Vendedor</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={rutaFormularioSeleccionada?.vendedor || ''}
                                        readOnly
                                        plaintext={false}
                                        style={{ backgroundColor: '#f8fafc' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Nota / Preferencias</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Ej: Dejar donde el vecino..."
                                value={clienteForm.nota}
                                onChange={e => setClienteForm({ ...clienteForm, nota: e.target.value })}
                                style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Días de Visita</Form.Label>
                            <div className="d-flex flex-wrap gap-3">
                                {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].map(dia => {
                                    const isChecked = Array.isArray(clienteForm.dia_visita) && clienteForm.dia_visita.includes(dia);
                                    return (
                                        <div
                                            key={dia}
                                            onClick={() => {
                                                const dias = Array.isArray(clienteForm.dia_visita) ? [...clienteForm.dia_visita] : [];
                                                if (isChecked) {
                                                    const index = dias.indexOf(dia);
                                                    if (index > -1) dias.splice(index, 1);
                                                } else {
                                                    dias.push(dia);
                                                }
                                                setClienteForm({ ...clienteForm, dia_visita: dias });
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                userSelect: 'none'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    border: '2px solid #003d88',
                                                    borderRadius: '4px',
                                                    backgroundColor: isChecked ? '#003d88' : 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginRight: '8px',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {isChecked && (
                                                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '14px' }}>{dia}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <Form.Text className="text-muted">
                                Selecciona uno o más días en los que se visitará este cliente
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowClienteModal(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Guardar</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal de confirmación para eliminar ruta */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <Modal.Title style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-icons" style={{ fontSize: '32px' }}>warning</span>
                        Eliminar Ruta
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ paddingTop: '10px' }}>
                    <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                        ¿Estás seguro de que deseas eliminar la ruta <strong>"{rutaToDelete?.nombre}"</strong>?
                    </p>
                    <Alert variant="warning" style={{ fontSize: '14px', marginBottom: 0 }}>
                        <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer y eliminará todos los clientes asociados a esta ruta.
                    </Alert>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: 'none' }}>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleEliminarRuta}>
                        Eliminar Ruta
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* 🆕 Modal Convertir Cliente Ocasional */}
            <Modal show={showConvertirModal} onHide={() => setShowConvertirModal(false)} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a' }}>
                    <Modal.Title style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
                        <span className="material-icons">person_add</span>
                        Convertir a Cliente de Ruta
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {clienteAConvertir && (
                        <>
                            <Alert variant="info" style={{ fontSize: '0.875rem' }}>
                                <strong>{clienteAConvertir.nombre}</strong> será agregado como cliente regular de <strong>{selectedRuta?.nombre}</strong>.
                            </Alert>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600', fontSize: '0.875rem' }}>Día de visita</Form.Label>
                                <Form.Select
                                    value={convertirForm.dia_visita}
                                    onChange={(e) => setConvertirForm({ ...convertirForm, dia_visita: e.target.value })}
                                >
                                    {DIAS_SEMANA.map(dia => (
                                        <option key={dia} value={dia}>{dia}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label style={{ fontWeight: '600', fontSize: '0.875rem' }}>Tipo de negocio</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ej: Tienda, Restaurante, Panadería..."
                                    value={convertirForm.tipo_negocio}
                                    onChange={(e) => setConvertirForm({ ...convertirForm, tipo_negocio: e.target.value })}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConvertirModal(false)}>Cancelar</Button>
                    <Button variant="success" onClick={handleConvertirCliente}>
                        <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>check_circle</span>
                        Convertir
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
        </>
    );
};

export default GestionRutas;
