import React from "react";

export default function ProductCard({ product, onClick }) {
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
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="mb-2" 
            style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} 
          />
        ) : (
          <span style={{ fontSize: 36 }} className="material-icons mb-1">paid</span>
        )}
        <div><strong>${product.price.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</strong></div>
        <div className="text-muted" style={{ fontSize: 15 }}>{product.name}</div>
      </div>
    </div>
  );
}