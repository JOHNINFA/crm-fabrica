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
    const [clienteForm, setClienteForm] = useState({
        nombre_negocio: '',
        nombre_contacto: '',
        direccion: '',
        telefono: '',
        tipo_negocio: '',
        dia_visita: [],
        orden: 0,
        nota: ''
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
            setRutas(rutasData);
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

    const handleSelectRuta = async (ruta, dia = diaSeleccionado) => {
        setSelectedRuta(ruta);
        try {
            const clientesData = await rutasService.obtenerClientesRuta(ruta.id, dia);
            setClientes(clientesData);
        } catch (err) {
            console.error(err);
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
                ruta: selectedRuta.id,
                activo: true
            };



            if (editingCliente) {
                await rutasService.actualizarClienteRuta(editingCliente.id, data);
            } else {
                await rutasService.crearClienteRuta(data);
            }
            setShowClienteModal(false);
            handleSelectRuta(selectedRuta); // Recargar clientes
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
        <Container fluid style={{ padding: '0 8px' }}>
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
                                    return (
                                        <button
                                            key={ruta.id}
                                            className="list-group-item list-group-item-action"
                                            onClick={() => handleSelectRuta(ruta)}
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
                                                <div>
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
                                                        {ruta.vendedor_nombre || 'Sin vendedor'}
                                                    </small>
                                                </div>
                                                {isActive && (
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
                                                )}
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
                                        {/* 🆕 Botón Sincronizar (Recargar) */}
                                        <Button
                                            variant="light"
                                            onClick={() => handleSelectRuta(selectedRuta, diaSeleccionado)}
                                            title="Sincronizar datos (Recargar lista)"
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#0284c7', // Azul brillante
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
                                            <span className="material-icons" style={{ fontSize: '1.75rem' }}>sync</span>
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
                                                    orden: maxOrden + 1
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
                                        <Droppable droppableId="clientes-list">
                                            {(provided) => (
                                                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                                    {clientes.map((cliente, index) => (
                                                        <Draggable
                                                            key={cliente.id}
                                                            draggableId={String(cliente.id)}
                                                            index={index}
                                                            isDragDisabled={!diaSeleccionado}
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
                                                                                    dia_visita: diasArray
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
        </Container>
    );
};

export default GestionRutas;
