import React, { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import ModalCorreccionSimple from './ModalCorreccionSimple';

const BotonCorreccionNuevo = ({ dia, idSheet, fechaSeleccionada, productos, estadoActual, onProductosActualizados }) => {
    const [showModal, setShowModal] = useState(false);
    const [showClaveModal, setShowClaveModal] = useState(false);
    const [claveIngresada, setClaveIngresada] = useState('');
    const [estadoActualizado, setEstadoActualizado] = useState(estadoActual);

    // Actualizar estado en tiempo real cuando cambia en localStorage
    useEffect(() => {
        const intervalo = setInterval(() => {
            const nuevoEstado = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) || 'ALISTAMIENTO';
            setEstadoActualizado(nuevoEstado);
        }, 500); // Verificar cada 500ms

        return () => clearInterval(intervalo);
    }, [dia, fechaSeleccionada]);

    const handleClickBoton = () => {
        // Verificar si los productos están cargados
        if (productos.length <= 1 || (productos.length === 1 && productos[0].name === 'Servicio')) {
            alert('⏳ Los productos se están cargando desde el servidor, intente nuevamente en unos segundos.');
            return;
        }

        // Mostrar modal de clave
        setShowClaveModal(true);
    };

    const handleVerificarClave = () => {
        if (claveIngresada !== '201486') {
            alert('❌ Clave incorrecta. Acceso denegado.');
            setClaveIngresada('');
            return;
        }

        // Clave correcta
        setShowClaveModal(false);
        setClaveIngresada('');
        setShowModal(true);
    };

    const handleCancelarClave = () => {
        setShowClaveModal(false);
        setClaveIngresada('');
    };

    // OPCIÓN B: Ocultar después de ALISTAMIENTO (solo visible en SUGERIDO y ALISTAMIENTO)
    // Seguridad: No permite correcciones después de que el vendedor salió a ruta
    // Reactivo: Se oculta instantáneamente al cambiar de estado sin recargar
    if (estadoActualizado && estadoActualizado !== 'SUGERIDO' && estadoActualizado !== 'ALISTAMIENTO') {
        return null;
    }

    return (
        <>
            {/* Botón principal */}
            <div style={{ marginTop: '210px' }} className="d-flex justify-content-left">
                <Button
                    variant="primary"
                    onClick={handleClickBoton}
                    style={{
                        backgroundColor: '#007bff',
                        borderColor: '#007bff',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '8px 16px',
                        borderRadius: '6px'
                    }}
                >
                    🔧 Corregir Cantidades
                </Button>
            </div>

            {/* Modal de clave de seguridad */}
            <Modal show={showClaveModal} onHide={handleCancelarClave} centered>
                <Modal.Header closeButton style={{ backgroundColor: '#007bff', color: 'white' }}>
                    <Modal.Title>🔒 Clave de Seguridad</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-3">Ingrese la clave de seguridad para habilitar la corrección de cantidades:</p>
                    <Form.Control
                        type="password"
                        placeholder="Ingrese la clave"
                        value={claveIngresada}
                        onChange={(e) => setClaveIngresada(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleVerificarClave();
                            }
                        }}
                        autoFocus
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancelarClave}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleVerificarClave}>
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de corrección */}
            {showModal && (
                <ModalCorreccionSimple
                    productos={productos}
                    dia={dia}
                    idSheet={idSheet}
                    fechaSeleccionada={fechaSeleccionada}
                    onClose={() => {

                        setShowModal(false);
                    }}
                    onGuardar={() => {

                        if (onProductosActualizados) {
                            onProductosActualizados();
                        }
                    }}
                />
            )}
        </>
    );
};

export default BotonCorreccionNuevo;