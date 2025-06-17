import React, { useState, useEffect } from "react";
import { localImageService } from "../../services/localImageService";

export default function ProductCard({ product, onClick }) {
  // Estado para la imagen
  const [imageSource, setImageSource] = useState(product.image || null);
  
  // Cargar imagen desde IndexedDB si no está disponible en el producto
  useEffect(() => {
    const loadLocalImage = async () => {
      // Si ya tenemos una imagen, no hacer nada
      if (imageSource) return;
      
      try {
        // Intentar cargar la imagen desde IndexedDB
        const localImage = await localImageService.getImage(product.id);
        if (localImage) {
          setImageSource(localImage);
        }
      } catch (error) {
        console.error('Error al cargar imagen local:', error);
      }
    };
    
    loadLocalImage();
  }, [product.id, imageSource]);
  
  // Asegurarse de que el precio sea un número válido
  const price = typeof product.price === 'number' ? product.price : 0;
  
  return (
    <div
      className="card h-100"
      style={{ border: "1px solid #e5e9f2", borderRadius: 9, cursor: "pointer", transition: "box-shadow 0.1s" }}
      onClick={onClick}
      title="Agregar al carrito"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="card-body d-flex flex-column align-items-center text-center">
        {imageSource ? (
          <img 
            src={imageSource} 
            alt={product.name || 'Producto'} 
            className="mb-2" 
            style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} 
          />
        ) : (
          <span style={{ fontSize: 36 }} className="material-icons mb-1">paid</span>
        )}
        <div><strong>${price.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</strong></div>
        <div className="text-muted" style={{ fontSize: 15 }}>{product.name || 'Producto sin nombre'}</div>
      </div>
    </div>
  );
}