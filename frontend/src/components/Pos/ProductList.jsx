import React, { useState, useMemo } from "react";
import ProductCard from "./ProductCard";
import { useProducts } from "../../hooks/useUnifiedProducts";
import { usePriceList } from "../../hooks/usePriceList";
import CategoryManager from "./CategoryManager";
import "./ProductList.css";

export default function ProductList({ addProduct, search, setSearch, priceList, showCategoryManager, setShowCategoryManager }) {
  const { products: allProducts, categories, isInitialLoading, getProductsByModule } = useProducts();

  const products = useMemo(() => {
    return getProductsByModule ? getProductsByModule('pos') : allProducts;
  }, [allProducts, getProductsByModule]);

  const { precios } = usePriceList(priceList, products);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Estado para drag scroll de categorías
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = React.useRef(null);

  // Estado para drag scroll de productos
  const [isDraggingProducts, setIsDraggingProducts] = useState(false);
  const [startYProducts, setStartYProducts] = useState(0);
  const [scrollTopProducts, setScrollTopProducts] = useState(0);
  const productsContainerRef = React.useRef(null);

  // Funciones para drag scroll de categorías
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Funciones para drag scroll de productos
  const handleMouseDownProducts = (e) => {
    setIsDraggingProducts(true);
    setStartYProducts(e.pageY - productsContainerRef.current.offsetTop);
    setScrollTopProducts(productsContainerRef.current.scrollTop);
  };

  const handleMouseLeaveProducts = () => {
    setIsDraggingProducts(false);
  };

  const handleMouseUpProducts = () => {
    setIsDraggingProducts(false);
  };

  const handleMouseMoveProducts = (e) => {
    if (!isDraggingProducts) return;
    e.preventDefault();
    const y = e.pageY - productsContainerRef.current.offsetTop;
    const walk = (y - startYProducts) * 2;
    productsContainerRef.current.scrollTop = scrollTopProducts - walk;
  };

  // Filtrar y ordenar productos
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Ordenar por ID numérico para mantener orden consistente
      const idA = parseInt(a.id) || 999999;
      const idB = parseInt(b.id) || 999999;
      return idA - idB;
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



  // Mostrar loading mientras se cargan los productos iniciales
  if (isInitialLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando productos...</p>
        </div>
      </div>
    );
  }

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
          ref={scrollContainerRef}
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
            className={`category-button ${selectedCategory === "Todos" ? "active" : ""} `}
            onClick={() => setSelectedCategory("Todos")}
            style={{ minWidth: 'fit-content', flexShrink: 0 }}
          >
            <span className="material-icons">{getCategoryIcon("Todos")}</span>
            <span className="category-name">Todos</span>
          </button>

          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? "active" : ""} `}
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
        ref={productsContainerRef}
        className="card-bg mb-3 p-3"
        style={{
          maxHeight: 'calc(100vh - 260px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          cursor: isDraggingProducts ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDownProducts}
        onMouseLeave={handleMouseLeaveProducts}
        onMouseUp={handleMouseUpProducts}
        onMouseMove={handleMouseMoveProducts}
      >

        {/* Lista de productos */}
        <div className="row g-2">
          {filteredProducts.map((p) => (
            <div className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-3" key={p.id}>
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