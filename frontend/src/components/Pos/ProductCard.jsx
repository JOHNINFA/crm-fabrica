import React, { useState, useEffect } from "react";
import { localImageService } from "../../services/localImageService";
import { useUnifiedProducts } from "../../context/UnifiedProductContext";

export default function ProductCard({ product, onClick }) {
  // Obtener caché de imágenes del contexto (evita rebote)
  const { productImages } = useUnifiedProducts();

  // 🚀 PRIORIDAD: Usar imagen del producto PRIMERO (más rápido)
  const cachedImage = productImages?.[product.id];
  const [imageSource, setImageSource] = useState(product.image || cachedImage || null);
  const [isClicked, setIsClicked] = useState(false);

  // Siempre mostrar el precio base del producto en la tarjeta
  const precioMostrar = product.price;

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
    return `$${validPrice.toLocaleString('es-CO', {
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
        border: "1px solid #e5e9f2",
        borderRadius: 6,
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.1s",
        width: "100%",
        margin: "0 auto",
        transform: isClicked ? 'scale(1.05)' : 'scale(1)'
      }}
      onClick={handleClick}
      title="Agregar al carrito"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="card-body d-flex flex-column align-items-center text-center" style={{ padding: '4px' }}>
        {/* Imagen o icono por defecto - Carga urgente sin delays */}
        <div style={{
          height: '50px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '3px',
          overflow: 'hidden',
          backgroundColor: imageSource ? 'transparent' : '#f8f9fa',
          borderRadius: '4px'
        }}>
          {imageSource ? (
            <img
              src={imageSource}
              alt={product.name || 'Producto'}
              loading="eager"
              fetchpriority="high"
              decoding="sync"
              style={{
                height: '100%',
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // Si falla la carga, mostrar ícono
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span style={{ fontSize: 22, color: '#dee2e6' }} className="material-icons">
              paid
            </span>
          )}
        </div>

        {/* Precio */}
        <div style={{ fontSize: '14px', color: '#495057', fontWeight: '700', marginBottom: '2px' }}>
          <strong>{formatPrice(precioMostrar || 0)}</strong>
        </div>

        {/* Nombre del producto */}
        <div style={{ fontSize: 10.5, color: '#495057', fontWeight: '500', lineHeight: '1.2' }}>
          {product.name || 'Producto sin nombre'}
        </div>
      </div>
    </div>
  );
}