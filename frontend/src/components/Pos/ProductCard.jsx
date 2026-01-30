import React, { useState, useEffect } from "react";
import { localImageService } from "../../services/localImageService";
import { useUnifiedProducts } from "../../context/UnifiedProductContext";
import "./ProductCard.css";

export default function ProductCard({ product, onClick, precioLista }) {
  // Obtener caché de imágenes del contexto (evita rebote)
  const { productImages } = useUnifiedProducts();

  // 🚀 PRIORIDAD: Usar imagen del producto PRIMERO (más rápido)
  const cachedImage = productImages?.[product.id];
  const [imageSource, setImageSource] = useState(product.image || cachedImage || null);
  const [isClicked, setIsClicked] = useState(false);

  // Usar precio de la lista si existe, sino mostrar null mientras carga
  // Esto evita el "salto" de precios mostrando precio base primero
  const precioMostrar = precioLista !== undefined && precioLista !== null ? precioLista : null;

  // Sincronizar imagen cuando cambie el producto o el caché
  useEffect(() => {
    // Prioridad: 1) imagen del producto (más rápido), 2) caché en memoria, 3) IndexedDB
    if (product.image) {
      setImageSource(product.image);
      return;
    }

    if (cachedImage) {
      setImageSource(cachedImage);
      return;
    }

    // Solo como último recurso, intentar cargar desde IndexedDB
    const loadLocalImage = async () => {
      try {
        const localImage = await localImageService.getImage(product.id);
        if (localImage) {
          setImageSource(localImage);
        }
      } catch (error) {
        console.error('Error loading local image:', error);
      }
    };

    loadLocalImage();
  }, [product.id, product.image, cachedImage]);



  // Formatear precio
  const formatPrice = (price) => {
    const validPrice = (price !== null && price !== undefined && !isNaN(price)) ? Number(price) : 0;
    return `${validPrice.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  // Manejar eventos de teclado
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(product);
    }
  };

  const handleClick = () => {
    setIsClicked(true);
    onClick(product);
    setTimeout(() => setIsClicked(false), 300);
  };

  return (
    <div
      className={`card h-100 product-card-item ${isClicked ? 'product-clicked' : ''}`}
      style={{
        transform: isClicked ? 'scale(1.05)' : 'scale(1)'
      }}
      onClick={handleClick}
      title="Agregar al carrito"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="card-body d-flex flex-column align-items-center text-center">
        {/* Imagen o icono por defecto - Carga urgente sin delays */}
        <div className="product-image-container">
          {imageSource ? (
            <img
              src={imageSource}
              alt={product.name || 'Producto'}
              loading="eager"
              fetchpriority="high"
              decoding="sync"
              className="product-image"
              onError={(e) => {
                // Si falla la carga, mostrar ícono
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span className="product-icon material-icons">
              paid
            </span>
          )}
        </div>

        {/* Precio - mostrar solo si está disponible */}
        {precioMostrar !== null ? (
          <div className="product-price">
            <strong>{formatPrice(precioMostrar)}</strong>
          </div>
        ) : (
          <div className="product-price" style={{ visibility: 'hidden' }}>
            <strong>0</strong>
          </div>
        )}

        {/* Nombre del producto */}
        <div className="product-name">
          {product.name || 'Producto sin nombre'}
        </div>
      </div>
    </div>
  );
}
