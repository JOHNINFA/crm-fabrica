import React, { useState } from "react";
import ProductCard from "./ProductCard";
import { useProducts } from "../../context/ProductContext";
import CategoryManager from "./CategoryManager";
import "./ProductList.css";

export default function ProductList({ addProduct, search, setSearch }) {
  const { products, categories } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  
  // Filtrar productos por búsqueda y categoría
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

  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-light border" title="Buscar">
          <span className="material-icons">search</span>
        </button>
        <button className="btn btn-light border" title="Filtro avanzado">
          <span className="material-icons">filter_alt</span>
        </button>
        <button className="btn btn-light border" title="Cajas">
          <span className="material-icons">archive</span>
        </button>
        <input 
          className="form-control" 
          style={{ maxWidth: 300 }} 
          placeholder="Buscar Productos" 
          value={search}
          onChange={e => setSearch(e.target.value)} 
        />
      </div>
      
      <div className="card-bg mb-3 p-3">
        {/* Encabezado de categorías con botón de gestión */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="m-0">Categorías</h6>
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => setShowCategoryManager(true)}
            title="Gestionar categorías"
          >
            <span className="material-icons" style={{fontSize: '16px'}}>settings</span>
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
              <ProductCard product={p} onClick={() => addProduct(p)} />
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
    </>
  );
}