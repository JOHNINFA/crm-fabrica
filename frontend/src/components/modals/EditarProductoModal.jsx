import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Tab, Form, Table } from 'react-bootstrap';
import { BsCheckLg, BsInfoCircle } from 'react-icons/bs';
import { listaPrecioService, precioProductoService } from '../../services/listaPrecioService';
import { clearPriceCache } from '../../hooks/usePriceList';
import './EditarProductoModal.css';

const EditarProductoModal = ({ show, handleClose, producto }) => {
    const [listasPrecios, setListasPrecios] = useState([]);
    const [preciosProducto, setPreciosProducto] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show && producto) {
            cargarDatos();
        }
    }, [show, producto]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [listas, precios] = await Promise.all([
                listaPrecioService.getAll({ activo: true }),
                precioProductoService.getAll({ producto: producto.id })
            ]);

            setListasPrecios(listas);
            setPreciosProducto(precios);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrecioChange = async (listaId, precio, utilidad) => {
        try {
            const precioExistente = preciosProducto.find(p => p.lista_precio === listaId);

            const data = {
                producto: producto.id,
                lista_precio: listaId,
                precio: parseFloat(precio) || 0,
                utilidad_porcentaje: parseFloat(utilidad) || 0,
                activo: true
            };

            if (precioExistente) {
                await precioProductoService.update(precioExistente.id, data);
            } else {
                await precioProductoService.createOrUpdate(data);
            }

            // Limpiar caché de precios para que POS y Pedidos reflejen el cambio
            clearPriceCache();

            cargarDatos();
        } catch (error) {
            console.error('Error guardando precio:', error);
        }
    };

    const getPrecioProducto = (listaId) => {
        const precio = preciosProducto.find(p => p.lista_precio === listaId);
        return precio ? Math.round(precio.precio) : Math.round(producto?.precio || 0);
    };

    const getUtilidadProducto = (listaId) => {
        const precio = preciosProducto.find(p => p.lista_precio === listaId);
        return precio ? precio.utilidad_porcentaje : 100;
    };

    if (!producto) return null;

    return (
        <Modal show={show} onHide={handleClose} size="xl" centered scrollable>
            <Modal.Header closeButton>
                <Modal.Title>Editar Producto: {producto.nombre}</Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-4">
                <Tabs defaultActiveKey="basico" id="edit-product-tabs" className="product-tabs">
                    <Tab eventKey="basico" title="Básico">
                        <div className="tab-content-wrapper">
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control type="text" defaultValue={producto.nombre} readOnly />
                            </Form.Group>

                            <h5 className="mt-4">Lista de Precios</h5>
                            {loading ? (
                                <p>Cargando...</p>
                            ) : (
                                <Table bordered responsive className="text-center custom-table">
                                    <thead className="table-header-blue">
                                        <tr>
                                            <th>Sucursal</th>
                                            <th>Nombre Lista</th>
                                            <th>Tipo Lista Precio</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listasPrecios.map((lista) => (
                                            <tr key={lista.id}>
                                                <td className="align-middle">{lista.sucursal}</td>
                                                <td>{lista.nombre}</td>
                                                <td>{lista.tipo}</td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        defaultValue={`$ ${getPrecioProducto(lista.id)}`}
                                                        onBlur={(e) => {
                                                            const precio = e.target.value.replace(/[$,]/g, '');
                                                            handlePrecioChange(lista.id, precio, 100);
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    size="sm"
                    style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                    }}
                >
                    Cancelar
                </Button>
                <button
                    type="button"
                    className="btn btn-sm"
                    style={{
                        backgroundColor: '#002149',
                        borderColor: '#002149',
                        color: 'white',
                        padding: '0.4rem 1rem',
                        fontSize: '0.875rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #002149',
                        fontWeight: '400',
                        lineHeight: '1.5'
                    }}
                    onClick={() => {
                        clearPriceCache();
                        handleClose();
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#001a3a';
                        e.target.style.borderColor = '#001a3a';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#002149';
                        e.target.style.borderColor = '#002149';
                    }}
                >
                    Guardar
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditarProductoModal;