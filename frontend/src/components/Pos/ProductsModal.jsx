import React, { useState } from 'react';
import { useModalContext } from '../../context/ModalContext';
import { useProducts } from '../../hooks/useUnifiedProducts';
import './ProductsModal.css';

const ProductsModal = () => {
  const {
    showProductsModal,
    closeProductsModal,
    openAddProductModal
  } = useModalContext();

  const { products, deleteProduct } = useProducts();
  const [activeTab, setActiveTab] = useState('Activos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Filtrar productos según búsqueda y pestaña activa
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!showProductsModal) return null;

  return (
    <div className="modal-overlay">
      <div className="products-modal">
        <div className="modal-header">
          <h4>Productos</h4>
          <button className="close-button" onClick={closeProductsModal}>×</button>
        </div>

        <div className="search-container">
          <input
            type="text"
            className="form-control"
            placeholder="Búsqueda General"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-outline-secondary">
            <span className="material-icons">search</span>
          </button>
        </div>

        <div className="tabs-container">
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

        <div className="actions-toolbar">
          <button className="btn btn-primary" onClick={() => openAddProductModal()}>
            <span className="material-icons" style={{ fontSize: '16px' }}>add</span> Añadir Producto
          </button>
          <button className="btn btn-secondary">
            <span className="material-icons" style={{ fontSize: '16px' }}>file_download</span>
          </button>
          <button className="btn btn-secondary">
            <span className="material-icons" style={{ fontSize: '16px' }}>print</span>
          </button>
          <button className="btn btn-danger">
            <span className="material-icons" style={{ fontSize: '16px' }}>delete</span> Desactivar Productos
          </button>
        </div>

        <div className="table-container">
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
                {filteredProducts.map(product => (
                  <tr key={product.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-info" onClick={() => openAddProductModal(product)}>
                          <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
                        </button>
                        <button className="btn btn-warning">
                          <span className="material-icons" style={{ fontSize: '14px' }}>refresh</span>
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            setProductToDelete(product);
                            setShowConfirmDelete(true);
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
                        </button>
                        <button className="btn btn-success">
                          <span className="material-icons" style={{ fontSize: '14px' }}>shopping_cart</span>
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
      </div>

      {/* Modal de confirmación para eliminar producto */}
      {showConfirmDelete && productToDelete && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h5>Confirmar Eliminación</h5>
              <button className="close-button" onClick={() => setShowConfirmDelete(false)}>×</button>
            </div>
            <div className="modal-body p-3">
              <p>¿Estás seguro de que deseas eliminar el producto <strong>{productToDelete.name}</strong>?</p>
              <p className="text-danger">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
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
    </div>
  );
};

export default ProductsModal;