import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import ModalCorreccionSimple from './ModalCorreccionSimple';

const BotonCorreccionNuevo = ({ dia, idSheet, fechaSeleccionada, productos, onProductosActualizados }) => {
    const [showModal, setShowModal] = useState(false);

    const handleClickBoton = () => {


        // Verificar si los productos están cargados
        if (productos.length <= 1 || (productos.length === 1 && productos[0].name === 'Servicio')) {
            alert('⏳ Los productos se están cargando desde el servidor, intente nuevamente en unos segundos.');
            return;
        }

        setShowModal(true);
    };

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

            {/* Modal simple */}
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