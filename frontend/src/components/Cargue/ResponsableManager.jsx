import React from 'react';
import { useVendedores } from '../../context/VendedoresContext';

const ResponsableManager = ({
    idSeleccionado,
    tempNombre,
    setDatosIds,
    setShowModal
}) => {
    const { actualizarResponsable } = useVendedores();

    const guardarResponsable = async () => {
        try {
            console.log(`🔄 Guardando responsable: ${idSeleccionado} -> ${tempNombre}`);

            const resultado = await actualizarResponsable(idSeleccionado, tempNombre);

            if (resultado.success) {
                // Actualizar estado local solo si la BD se actualizó correctamente
                setDatosIds(prev => ({
                    ...prev,
                    [idSeleccionado]: {
                        ...prev[idSeleccionado],
                        nombreResponsable: tempNombre
                    }
                }));


            } else {
                console.error('❌ Error guardando responsable:', resultado.error);
                alert('Error guardando el responsable. Inténtalo de nuevo.');
            }
        } catch (error) {
            console.error('❌ Error guardando responsable:', error);
            alert('Error de conexión. Inténtalo de nuevo.');
        }

        setShowModal(false);
    };

    return { guardarResponsable };
};

export default ResponsableManager;