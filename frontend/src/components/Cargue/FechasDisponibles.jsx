import React, { useState, useEffect } from 'react';
import { Alert, Button, Collapse } from 'react-bootstrap';

const FechasDisponibles = ({ dia, fechaSeleccionada }) => {
    const [fechasDisponibles, setFechasDisponibles] = useState([]);
    const [mostrarFechas, setMostrarFechas] = useState(false);
    const [loading, setLoading] = useState(false);

    const buscarFechasDisponibles = async () => {
        setLoading(true);
        try {
            const endpoints = ['cargue-id1', 'cargue-id2', 'cargue-id3', 'cargue-id4', 'cargue-id5', 'cargue-id6'];
            const fechasEncontradas = new Set();

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`/api/${endpoint}/?activo=true`);

                    if (response.ok) {
                        const data = await response.json();

                        if (data.results && data.results.length > 0) {
                            data.results.forEach(item => {
                                if (item.dia && item.fecha) {
                                    fechasEncontradas.add(`${item.dia}|${item.fecha}`);
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Error consultando ${endpoint}:`, error);
                }
            }

            // Convertir a array y ordenar
            const fechasArray = Array.from(fechasEncontradas).map(item => {
                const [dia, fecha] = item.split('|');
                return { dia, fecha };
            }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            setFechasDisponibles(fechasArray);

        } catch (error) {
            console.error('Error buscando fechas disponibles:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatearFecha = (fechaStr) => {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const navegarAFecha = (diaDestino, fechaDestino) => {
        // Construir URL para navegar
        const url = `/cargue/${diaDestino}`;

        // Actualizar la fecha en el componente padre (si es posible)
        // Por ahora, mostrar instrucciones al usuario
        alert(`Para ver los datos de ${diaDestino} ${fechaDestino}:\n\n1. Navega a ${url}\n2. Cambia la fecha a ${fechaDestino} usando el selector de fecha`);
    };

    return (
        <div className="mb-3">
            <Alert variant="info" className="d-flex justify-content-between align-items-center">
                <div>
                    <strong>📅 Fecha actual:</strong> {dia} {fechaSeleccionada}
                </div>
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                        setMostrarFechas(!mostrarFechas);
                        if (!mostrarFechas && fechasDisponibles.length === 0) {
                            buscarFechasDisponibles();
                        }
                    }}
                    disabled={loading}
                >
                    {loading ? 'Buscando...' : mostrarFechas ? 'Ocultar fechas' : 'Ver fechas disponibles'}
                </Button>
            </Alert>

            <Collapse in={mostrarFechas}>
                <div>
                    {fechasDisponibles.length > 0 ? (
                        <Alert variant="success">
                            <strong>📊 Fechas con datos guardados:</strong>
                            <div className="mt-2">
                                {fechasDisponibles.map((item, index) => (
                                    <div key={index} className="d-flex justify-content-between align-items-center border-bottom py-1">
                                        <div>
                                            <strong>{item.dia}</strong> - {formatearFecha(item.fecha)}
                                            <br />
                                            <small className="text-muted">{item.fecha}</small>
                                        </div>
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            onClick={() => navegarAFecha(item.dia, item.fecha)}
                                        >
                                            Ver datos
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Alert>
                    ) : mostrarFechas && !loading ? (
                        <Alert variant="warning">
                            No se encontraron fechas con datos guardados
                        </Alert>
                    ) : null}
                </div>
            </Collapse>
        </div>
    );
};

export default FechasDisponibles;