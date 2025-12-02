import { useState, useEffect, Fragment } from 'react';
import { Button } from 'react-bootstrap';
import ModalCorreccionSimple from './ModalCorreccionSimple';

const BotonCorreccion = ({ dia, idSheet, fechaSeleccionada, productos, onProductosActualizados }) => {
    const [mostrarBoton, setMostrarBoton] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Verificar estado del botón SUGERIDO
    useEffect(() => {
        const verificarEstadoBoton = () => {
            const estadoBoton = localStorage.getItem(`estado_boton_${dia}_${fechaSeleccionada}`) || 'ALISTAMIENTO';
            setMostrarBoton(estadoBoton === 'ALISTAMIENTO');
        };

        verificarEstadoBoton();
        const interval = setInterval(verificarEstadoBoton, 1000);
        return () => clearInterval(interval);
    }, [dia, fechaSeleccionada]);

    // Verificar si los productos están listos
    const productosListos = productos.length > 1 && !(productos.length === 1 && productos[0].name === 'Servicio');

    // No mostrar si el botón SUGERIDO ya fue activado
    if (!mostrarBoton) {
        return null;
    }

    // Manejar click del botón principal
    const handleClickBoton = () => {
        if (!productosListos) {
            alert('⏳ Los productos se están cargando desde el servidor, intente nuevamente en unos segundos.');
            return;
        }
        setShowModal(true);
    };

    // Manejar cierre del modal
    const handleCloseModal = () => {
        setShowModal(false);
    };

    // Manejar guardado exitoso
    const handleGuardarExitoso = () => {
        if (onProductosActualizados) {
            onProductosActualizados();
        }
        setShowModal(false);
    };

    return (
        <Fragment>
            {/* Botón principal */}
            <div style={{ marginTop: '280px' }} className="d-flex ">
                <Button
                    variant="primary"
                    onClick={handleClickBoton}
                    disabled={!productosListos}
                    style={{
                        backgroundColor: productosListos ? '#007bff' : '#6c757d',
                        borderColor: productosListos ? '#007bff' : '#6c757d',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '8px 16px',
                        borderRadius: '6px'
                    }}
                >
                    🔧 Corregir Cantidades
                </Button>
            </div>

            {/* Modal de corrección */}
            {showModal && (
                <ModalCorreccionSimple
                    productos={productos}
                    dia={dia}
                    idSheet={idSheet}
                    fechaSeleccionada={fechaSeleccionada}
                    onClose={handleCloseModal}
                    onGuardar={handleGuardarExitoso}
                />
            )}
        </Fragment>
    );
};

export default BotonCorreccion;