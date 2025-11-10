import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import { useProducts } from "../../hooks/useUnifiedProducts";
import CategoryManager from "./CategoryManager";
import "./ProductList.css";

export default function ProductList({ addProduct, search, setSearch, priceList }) {
    const { products, categories } = useProducts();
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    // Estados para drag scroll en categorías
    const categoryScrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Funciones de drag scroll para categorías
    const handleMouseDown = (e) => {
        if (!categoryScrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
        setScrollLeft(categoryScrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !categoryScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - categoryScrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        categoryScrollRef.current.scrollLeft = scrollLeft - walk;
    };

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

    return (
        <>
            {/* Barra de búsqueda */}
            <div
                className="d-flex align-items-center gap-2 mb-2"
                style={{
                    backgroundColor: '#f7f7fa',
                    paddingTop: '15px',
                    paddingBottom: '10px',
                    marginLeft: '-24px',
                    marginRight: '-24px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    marginTop: '-20px'
                }}
            >
                <button className="btn btn-light" style={{ borderRadius: '12px', padding: '8px 12px' }} title="Buscar">
                    <span className="material-icons" style={{ fontSize: '20px' }}>search</span>
                </button>

                <input
                    className="form-control search-input"
                    style={{
                        maxWidth: 700,
                        borderRadius: '12px',
                        height: '40px',
                        padding: '8px 16px'
                    }}
                    placeholder="Buscar Productos"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoComplete="off"
                />
            </div>

            {/* Categorías */}
            <div
                className="card-bg"
                style={{
                    overflow: 'visible',
                    backgroundColor: '#fff',
                    marginTop: '-10px',
                    marginBottom: '3px',
                    padding: '8px 8px 0.1px 8px'
                }}
            >
                {/* Botones de categoría - Carrusel horizontal */}
                <div
                    ref={categoryScrollRef}
                    className="category-buttons"
                    style={{
                        display: 'flex',
                        gap: '23px',
                        overflowX: 'auto',
                        overflowY: 'visible',
                        padding: '4px 0px 4px 0px',
                        scrollBehavior: isDragging ? 'auto' : 'smooth',
                        WebkitOverflowScrolling: 'touch',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    <button
                        className={`category-button ${selectedCategory === "Todos" ? "active" : ""}`}
                        onClick={() => setSelectedCategory("Todos")}
                        style={{ minWidth: 'fit-content', flexShrink: 0 }}
                    >
                        <span className="material-icons">{getCategoryIcon("Todos")}</span>
                        <span className="category-name">Todos</span>
                    </button>

                    {categories.map(category => (
                        <button
                            key={category}
                            className={`category-button ${selectedCategory === category ? "active" : ""}`}
                            onClick={() => setSelectedCategory(category)}
                            style={{ minWidth: 'fit-content', flexShrink: 0 }}
                        >
                            <span className="material-icons">{getCategoryIcon(category)}</span>
                            <span className="category-name">{category}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de productos - Con scroll */}
            <div
                className="card-bg mb-3 p-3"
                style={{
                    maxHeight: 'calc(100vh - 270px)',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}
            >
                {/* Lista de productos */}
                <div className="row g-2">
                    {filteredProducts.map((p) => (
                        <div className="col-md-6 col-xl-3" key={p.id}>
                            <ProductCard product={p} onClick={(product, currentPrice) => addProduct(product, currentPrice)} priceList={priceList} />
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