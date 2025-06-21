import React, { useState, useEffect } from "react";
import { localImageService } from "../../services/localImageService";

export default function ProductCard({ product, onClick }) {
  const [imageSource, setImageSource] = useState(product.image || null);
  
  // Cargar imagen local si no está disponible
  useEffect(() => {
    if (imageSource) return;
    
    const loadLocalImage = async () => {
      try {
        const localImage = await localImageService.getImage(product.id);
        if (localImage) setImageSource(localImage);
      } catch (error) {
        console.error('Error loading local image:', error);
      }
    };
    
    loadLocalImage();
  }, [product.id, imageSource]);
  
  // Formatear precio
  const formatPrice = (price) => {
    const validPrice = typeof price === 'number' ? price : 0;
    return `$${validPrice.toLocaleString('es-CO', {
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0
    })}`;
  };

  // Manejar eventos de teclado
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="card h-100"
      style={{ 
        border: "1px solid #e5e9f2", 
        borderRadius: 9, 
        cursor: "pointer", 
        transition: "box-shadow 0.1s" 
      }}
      onClick={onClick}
      title="Agregar al carrito"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="card-body d-flex flex-column align-items-center text-center">
        {/* Imagen o icono por defecto */}
        {imageSource ? (
          <img 
            src={imageSource} 
            alt={product.name || 'Producto'} 
            className="mb-2" 
            style={{ 
              maxHeight: 80, 
              maxWidth: '100%', 
              objectFit: 'contain' 
            }} 
          />
        ) : (
          <span style={{ fontSize: 36 }} className="material-icons mb-1">
            paid
          </span>
        )}
        
        {/* Precio */}
        <div>
          <strong>{formatPrice(product.price)}</strong>
        </div>
        
        {/* Nombre del producto */}
        <div className="text-muted" style={{ fontSize: 15 }}>
          {product.name || 'Producto sin nombre'}
        </div>
      </div>
    </div>
  );
}