import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { cajeroService } from '../../services/cajeroService';

const EliminarCajeroModal = ({ show, onHide, cajero, onCajeroEliminado }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEliminar = async () => {
        if (!cajero) return;

        setLoading(true);
        setError('');

        try {
            console.log('Eliminando cajero:', cajero.id);

            const resultado = await cajeroService.delete(cajero.id);

            if (resultado && resultado.success) {
                console.log('✅ Cajero eliminado exitosamente');

                // Notificar al componente padre
                if (onCajeroEliminado) {
                    onCajeroEliminado(cajero);
                }

                // Cerrar modal
                onHide();
            } else {
                setError(resultado.message || 'Error eliminando cajero');
            }
        } catch (error) {
            console.error('Error eliminando cajero:', error);
            setError('Error en el sistema al eliminar cajero');
        } finally {
            setLoading(false);
        }
    };

    if (!cajero) return null;

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title className="text-danger">
                    <span className="material-icons me-2" style={{ verticalAlign: 'middle' }}>
                        warning
                    </span>
                    Eliminar Cajero
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <div className="text-center mb-3">
                    <span className="material-icons text-warning" style={{ fontSize: 48 }}>
                        person_remove
                    </span>
                </div>

                <p className="text-center mb-3">
                    ¿Está seguro que desea eliminar el cajero?
                </p>

                <div className="card">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-sm-4">
                                <strong>Nombre:</strong>
                            </div>
                            <div className="col-sm-8">
                                {cajero.nombre}
                            </div>
                        </div>
                        {cajero.email && (
                            <div className="row">
                                <div className="col-sm-4">
                                    <strong>Email:</strong>
                                </div>
                                <div className="col-sm-8">
                                    {cajero.email}
                                </div>
                            </div>
                        )}
                        <div className="row">
                            <div className="col-sm-4">
                                <strong>Rol:</strong>
                            </div>
                            <div className="col-sm-8">
                                <span className={`badge bg-${cajero.rol === 'ADMINISTRADOR' ? 'danger' :
                                        cajero.rol === 'SUPERVISOR' ? 'warning' : 'secondary'
                                    }`}>
                                    {cajero.rol}
                                </span>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-4">
                                <strong>Estado:</strong>
                            </div>
                            <div className="col-sm-8">
                                <span className={`badge bg-${cajero.activo ? 'success' : 'secondary'}`}>
                                    {cajero.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="alert alert-warning mt-3">
                    <div className="d-flex align-items-center">
                        <span className="material-icons me-2">
                            info
                        </span>
                        <div>
                            <strong>Nota:</strong> Esta acción desactivará el cajero en lugar de eliminarlo permanentemente.
                            El cajero no podrá iniciar sesión pero se mantendrá el historial de sus transacciones.
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="danger"
                    onClick={handleEliminar}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Eliminando...
                        </>
                    ) : (
                        <>
                            <span className="material-icons me-2" style={{ fontSize: 18 }}>
                                delete
                            </span>
                            Eliminar Cajero
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EliminarCajeroModal;