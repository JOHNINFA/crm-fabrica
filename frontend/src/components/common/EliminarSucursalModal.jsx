import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { sucursalService } from '../../services/sucursalService';

const EliminarSucursalModal = ({ show, onHide, sucursal, onSucursalEliminada }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClose = () => {
        setError('');
        onHide();
    };

    const handleEliminar = async () => {
        if (!sucursal) return;

        setLoading(true);
        setError('');

        try {

            
            const resultado = await sucursalService.delete(sucursal.id);

            if (resultado && resultado.success) {

                onSucursalEliminada(sucursal.id);
                handleClose();
            } else {
                setError(resultado?.message || 'Error al eliminar la sucursal');
            }
        } catch (error) {
            console.error('Error eliminando sucursal:', error);
            setError('Error al eliminar la sucursal');
        } finally {
            setLoading(false);
        }
    };

    if (!sucursal) return null;

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <span className="material-icons me-2 text-danger" style={{ verticalAlign: 'middle' }}>
                        delete_forever
                    </span>
                    Eliminar Sucursal
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <div className="text-center mb-3">
                    <span className="material-icons text-warning" style={{ fontSize: 48 }}>
                        warning
                    </span>
                </div>

                <p className="text-center mb-3">
                    ¿Estás seguro de que deseas eliminar la sucursal <strong>"{sucursal.nombre}"</strong>?
                </p>

                <div className="alert alert-warning">
                    <div className="d-flex align-items-center">
                        <span className="material-icons me-2">
                            info
                        </span>
                        <div>
                            <strong>Importante:</strong> Esta acción desactivará la sucursal y no se podrá deshacer.
                            Los cajeros asociados a esta sucursal también se verán afectados.
                        </div>
                    </div>
                </div>

                {sucursal.es_principal && (
                    <div className="alert alert-danger">
                        <div className="d-flex align-items-center">
                            <span className="material-icons me-2">
                                error
                            </span>
                            <div>
                                <strong>Atención:</strong> Esta es la sucursal principal. 
                                Asegúrate de designar otra sucursal como principal antes de eliminar esta.
                            </div>
                        </div>
                    </div>
                )}

                <div className="card bg-light">
                    <div className="card-body">
                        <h6 className="card-title">Información de la sucursal:</h6>
                        <ul className="list-unstyled mb-0">
                            <li><strong>ID:</strong> {sucursal.id}</li>
                            <li><strong>Nombre:</strong> {sucursal.nombre}</li>
                            {sucursal.ciudad && <li><strong>Ciudad:</strong> {sucursal.ciudad}</li>}
                            {sucursal.direccion && <li><strong>Dirección:</strong> {sucursal.direccion}</li>}
                            <li><strong>Estado:</strong> {sucursal.activo ? 'Activa' : 'Inactiva'}</li>
                            <li><strong>Tipo:</strong> {sucursal.es_principal ? 'Principal' : 'Sucursal'}</li>
                        </ul>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button 
                    variant="danger" 
                    onClick={handleEliminar} 
                    disabled={loading || sucursal.es_principal}
                >
                    {loading ? (
                        <>
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                className="me-2"
                            />
                            Eliminando...
                        </>
                    ) : (
                        <>
                            <span className="material-icons me-2" style={{ fontSize: 16 }}>
                                delete
                            </span>
                            {sucursal.es_principal ? 'No se puede eliminar' : 'Eliminar Sucursal'}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EliminarSucursalModal;