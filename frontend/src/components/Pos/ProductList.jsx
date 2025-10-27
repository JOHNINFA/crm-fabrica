import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import { useProducts } from "../../context/ProductContext";
import { usePriceList } from "../../hooks/usePriceList";
import CategoryManager from "./CategoryManager";
// import CajaModal from "./CajaModal"; // Ya no necesitamos el modal
import "./ProductList.css";

export default function ProductList({ addProduct, search, setSearch, priceList }) {
  const { products, categories } = useProducts();
  const { precios } = usePriceList(priceList, products);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  // const [showCajaModal, setShowCajaModal] = useState(false); // Ya no necesitamos el estado del modal
  const reportMenuRef = useRef(null);
  const navigate = useNavigate();

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Iconos para categorías
  const getCategoryIcon = (category) => {
    const icons = {
      "Arepas": "restaurant_menu",
      "Servicios": "build",
      "Todos": "apps"
    };
    return icons[category] || "sell";
  };

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target)) {
        setShowReportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Botones superiores */}
      <div className="d-flex align-items-center gap-3 mb-2" style={{ marginTop: '-15px', paddingLeft: '20px' }}>
        <div className="dropdown" ref={reportMenuRef}>
          <button
            className="btn btn-light border dropdown-toggle top-button"
            style={{ borderRadius: '8px', color: '#163864', backgroundColor: '#ffffff' }}
            type="button"
            onClick={() => setShowReportMenu(!showReportMenu)}
          >
            Informes de Ventas
          </button>
          {showReportMenu && (
            <ul className="dropdown-menu show" style={{ position: 'absolute', inset: '0px auto auto 0px', margin: '0px', transform: 'translate(0px, 40px)' }}>
              <li><button className="dropdown-item" onClick={() => { setShowReportMenu(false); navigate('/informes/general'); }} style={{ fontSize: '14px', color: '#777777', padding: '3px 20px', textAlign: 'left', width: '100%', background: 'none', border: 'none' }}>Informe de Ventas General</button></li>
              <li><button className="dropdown-item" onClick={() => { console.log('Informe por vendedor'); setShowReportMenu(false); }} style={{ fontSize: '14px', color: '#777777', padding: '3px 20px', textAlign: 'left', width: '100%', background: 'none', border: 'none' }}>Informe de Ventas por Vendedor</button></li>
              <li><button className="dropdown-item" onClick={() => { console.log('Informe por cliente'); setShowReportMenu(false); }} style={{ fontSize: '14px', color: '#777777', padding: '3px 20px', textAlign: 'left', width: '100%', background: 'none', border: 'none' }}>Informe de Ventas por Cliente</button></li>
              <li><button className="dropdown-item" onClick={() => { console.log('Informe por cajero'); setShowReportMenu(false); }} style={{ fontSize: '14px', color: '#777777', padding: '3px 20px', textAlign: 'left', width: '100%', background: 'none', border: 'none' }}>Informe de Ventas por Cajero</button></li>
            </ul>
          )}
        </div>
        <button
          className="btn btn-light border top-button"
          style={{ borderRadius: '8px', color: '#163864', backgroundColor: '#ffffff' }}
          type="button"
          onClick={() => navigate('/caja')}
          title="Arqueo de Caja"
        >
          <i className="bi bi-cash-stack me-1"></i>
          Caja
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="d-flex align-items-center gap-2 mb-1" style={{ marginTop: '-5px' }}>
        <button className="btn btn-light" style={{ borderRadius: '12px' }} title="Buscar">
          <span className="material-icons">search</span>
        </button>


        <input
          className="form-control search-input"
          style={{ maxWidth: 700, borderRadius: '3px' }}
          placeholder="Buscar Productos"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="card-bg mb-3 p-3">
        {/* Header de categorías */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="m-0">Categorías</h6>
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setShowCategoryManager(true)}
            title="Gestionar categorías"
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>settings</span>
            <span className="ms-1">Gestionar</span>
          </button>
        </div>

        {/* Botones de categoría */}
        <div className="category-buttons">
          <button
            className={`category-button ${selectedCategory === "Todos" ? "active" : ""}`}
            onClick={() => setSelectedCategory("Todos")}
          >
            <span className="material-icons">{getCategoryIcon("Todos")}</span>
            <span className="category-name">Todos</span>
          </button>

          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              <span className="material-icons">{getCategoryIcon(category)}</span>
              <span className="category-name">{category}</span>
            </button>
          ))}
        </div>

        <hr />

        {/* Lista de productos */}
        <div className="row g-3">
          {filteredProducts.map((p) => (
            <div className="col-md-6 col-xl-4" key={p.id}>
              <ProductCard
                product={p}
                onClick={(product) => {
                  // Usar precio especial si existe, sino usar precio base
                  const precioFinal = precios[p.id] !== undefined && precios[p.id] !== null
                    ? precios[p.id]
                    : product.price;
                  addProduct(product, precioFinal);
                }}
              />
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-12 text-center py-4">
              <span className="material-icons" style={{ fontSize: 48, color: "#dee2e6" }}>
                search_off
              </span>
              <p className="text-muted mt-2">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de gestión de categorías */}
      {showCategoryManager && (
        <div className="modal-overlay">
          <CategoryManager onClose={() => setShowCategoryManager(false)} />
        </div>
      )}

      {/* Modal de Caja eliminado - ahora usa página completa */}
    </>
  );
}