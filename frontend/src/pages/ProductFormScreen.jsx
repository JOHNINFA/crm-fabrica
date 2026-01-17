import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useUnifiedProducts';
import AddProductModal from '../components/Pos/AddProductModal';
import usePageTitle from '../hooks/usePageTitle';
import './ProductFormScreen.css';

import { API_URL } from '../services/api';

const ProductFormScreenContent = () => {
    usePageTitle('Productos');
    const navigate = useNavigate();
    const { products, deleteProduct, loadProductsFromBackend, isSyncing } = useProducts();
    const [activeTab, setActiveTab] = useState('Activos');
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // 🆕 Estados para drag-and-drop
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [orderedProducts, setOrderedProducts] = useState([]);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    // ProductContext ya sincroniza automáticamente con el inventario

    // Obtener el origen desde sessionStorage (por defecto '/pos')
    const getOriginRoute = () => {
        const origen = sessionStorage.getItem('origenModulo');
        if (origen === 'pedidos') {
            return '/remisiones';
        }
        return '/pos';
    };

    const handleGoBack = () => {
        navigate(getOriginRoute());
    };

    const handleRefresh = async () => {
        await loadProductsFromBackend();
    };

    // Filtrar productos según búsqueda (solo activos)
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isActive = product.activo !== false;
        return matchesSearch && isActive;
    });

    const handleAddProduct = (product = null) => {
        setSelectedProduct(product);
        setShowAddProductModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddProductModal(false);
        setSelectedProduct(null);
    };

    // 🆕 DRAG AND DROP - Funciones
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        // Reordenar productos localmente
        const newProducts = [...filteredProducts];
        const draggedItem = newProducts[draggedIndex];
        newProducts.splice(draggedIndex, 1);
        newProducts.splice(dropIndex, 0, draggedItem);

        setDraggedIndex(null);

        // Guardar el nuevo orden en la BD
        await saveNewOrder(newProducts);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // 🆕 Guardar nuevo orden en la BD
    const saveNewOrder = async (reorderedProducts) => {
        setIsSavingOrder(true);
        try {
            // Actualizar el campo 'orden' de cada producto
            for (let i = 0; i < reorderedProducts.length; i++) {
                const product = reorderedProducts[i];
                const newOrder = i + 1;

                await fetch(`${API_URL}/productos/${product.id}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orden: newOrder })
                });
            }

            console.log('✅ Orden de productos actualizado en BD');
            // Recargar productos para reflejar el nuevo orden
            await loadProductsFromBackend();
        } catch (error) {
            console.error('❌ Error guardando orden:', error);
            alert('Error al guardar el orden. Intente nuevamente.');
        }
        setIsSavingOrder(false);
    };

    return (
        <div className="product-form-screen">
            {/* Header */}
            <div className="product-header">
                <div className="header-left">
                    <button className="btn-back" onClick={handleGoBack}>
                        <i className="bi bi-arrow-left"></i>
                    </button>
                    <h2>Productos</h2>
                </div>
                <button className="btn-close" onClick={handleGoBack}>
                    <i className="bi bi-x-lg"></i>
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <div className="search-container-full">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Búsqueda General"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary">
                        <i className="bi bi-search"></i>
                    </button>
                </div>
            </div>

            {/* Tabs - Removido, ya no es necesario */}

            {/* Actions Toolbar */}
            <div className="actions-section">
                <button className="btn btn-primary" onClick={() => handleAddProduct()}>
                    <i className="bi bi-plus-lg"></i> Añadir Producto
                </button>
                <button
                    className="btn btn-success"
                    onClick={handleRefresh}
                    disabled={isSyncing}
                    title="Actualizar productos desde el servidor"
                >
                    <i className={`bi bi-arrow-repeat ${isSyncing ? 'spin' : ''}`}></i> {isSyncing ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>

            {/* 🆕 Indicador de guardando orden */}
            {isSavingOrder && (
                <div style={{
                    padding: '10px 20px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <i className="bi bi-arrow-repeat spin" style={{ color: '#1976d2' }}></i>
                    <span style={{ color: '#1976d2', fontWeight: '500' }}>Guardando nuevo orden...</span>
                </div>
            )}

            {/* Table */}
            <div className="table-section">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }} title="Arrastra para reordenar">Orden</th>
                                <th><input type="checkbox" /></th>
                                <th>Acción</th>
                                <th>Nombre</th>
                                <th>Categ.</th>
                                <th>Marca</th>
                                <th>Exist.</th>
                                <th>P. Comp.</th>
                                <th>P. Venta</th>
                                <th>Impuesto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product, index) => (
                                <tr
                                    key={product.id}
                                    draggable={!searchQuery} // Solo arrastrar si no hay búsqueda
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        cursor: searchQuery ? 'default' : (draggedIndex === index ? 'grabbing' : 'grab'),
                                        backgroundColor: draggedIndex === index ? '#e3f2fd' : 'white',
                                        opacity: draggedIndex === index ? 0.5 : 1,
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {/* 🆕 Columna de orden/drag */}
                                    <td style={{ width: '50px', textAlign: 'center' }}>
                                        {!searchQuery && (
                                            <span
                                                style={{
                                                    cursor: 'grab',
                                                    color: '#9CA3AF',
                                                    fontSize: '16px'
                                                }}
                                                title="Arrastra para reordenar"
                                            >
                                                <i className="bi bi-grip-vertical"></i>
                                            </span>
                                        )}
                                        <span style={{
                                            marginLeft: '4px',
                                            color: '#6B7280',
                                            fontSize: '12px'
                                        }}>
                                            {product.orden || index + 1}
                                        </span>
                                    </td>
                                    <td><input type="checkbox" /></td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn btn-info"
                                                onClick={() => handleAddProduct(product)}
                                                title="Editar"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => {
                                                    setProductToDelete(product);
                                                    setShowConfirmDelete(true);
                                                }}
                                                title="Eliminar"
                                            >
                                                <i className="bi bi-x-lg"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td>{product.name}</td>
                                    <td>{product.category}</td>
                                    <td>{product.brand || 'GENERICA'}</td>
                                    <td>{product.stock || 0}</td>
                                    <td>$ {(product.purchasePrice || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    <td>$ {product.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    <td>{product.tax || 'IVA(0%)'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de confirmación para eliminar producto */}
            {showConfirmDelete && productToDelete && (
                <div className="modal-overlay-confirm">
                    <div className="modal-content-confirm">
                        <div className="modal-header-confirm">
                            <h5>Confirmar Eliminación</h5>
                            <button className="close-button" onClick={() => setShowConfirmDelete(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="modal-body-confirm">
                            <p>¿Estás seguro de que deseas eliminar el producto <strong>{productToDelete.name}</strong>?</p>

                            {/* Advertencia de stock */}
                            {productToDelete.stock > 0 && (
                                <div className="alert alert-warning mb-2">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <strong>Advertencia:</strong> Este producto tiene <strong>{productToDelete.stock} unidades</strong> en stock.
                                </div>
                            )}

                            <div className="alert alert-danger mb-0">
                                <i className="bi bi-trash-fill me-2"></i>
                                <strong>Esta acción es PERMANENTE:</strong>
                                <ul className="mb-0 mt-2">
                                    <li>Se eliminará el producto de la base de datos</li>
                                    <li>Se eliminará el registro de stock</li>
                                    <li>No se podrá recuperar</li>
                                </ul>
                            </div>
                        </div>
                        <div className="modal-footer-confirm">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowConfirmDelete(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    deleteProduct(productToDelete.id);
                                    setShowConfirmDelete(false);
                                    setProductToDelete(null);
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Agregar/Editar Producto */}
            {showAddProductModal && (
                <AddProductModal
                    show={showAddProductModal}
                    onClose={handleCloseAddModal}
                    selectedProduct={selectedProduct}
                />
            )}
        </div>
    );
};

const ProductFormScreen = () => {
    return <ProductFormScreenContent />;
};

export default ProductFormScreen;
