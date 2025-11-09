import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useUnifiedProducts';
import AddProductModal from '../components/Pos/AddProductModal';
import './ProductFormScreen.css';

const ProductFormScreenContent = () => {
    const navigate = useNavigate();
    const { products, deleteProduct, loadProductsFromBackend, isSyncing } = useProducts();
    const [activeTab, setActiveTab] = useState('Activos');
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

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

    // Filtrar productos según búsqueda y pestaña activa
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddProduct = (product = null) => {
        setSelectedProduct(product);
        setShowAddProductModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddProductModal(false);
        setSelectedProduct(null);
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

            {/* Tabs */}
            <div className="tabs-section">
                <ul className="nav nav-tabs">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'Activos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Activos')}
                        >
                            Activos
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'Inactivos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Inactivos')}
                        >
                            Inactivos
                        </button>
                    </li>
                </ul>
            </div>

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
                <button className="btn btn-secondary">
                    <i className="bi bi-download"></i>
                </button>
                <button className="btn btn-secondary">
                    <i className="bi bi-printer"></i>
                </button>
                <button className="btn btn-danger">
                    <i className="bi bi-trash"></i> Desactivar Productos
                </button>
            </div>

            {/* Table */}
            <div className="table-section">
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
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
                            {filteredProducts.map((product) => (
                                <tr key={product.id}>
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
                                            <button className="btn btn-warning" title="Actualizar">
                                                <i className="bi bi-arrow-repeat"></i>
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
                                            <button className="btn btn-success" title="Agregar al carrito">
                                                <i className="bi bi-cart-plus"></i>
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
                            <p className="text-danger">Esta acción no se puede deshacer.</p>
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
