import React, { useState } from "react";
import { useProducts } from "../../context/ProductContext";

export default function ProductsSection() {
  const { products, addToCart } = useProducts();
  const [q, setQ] = useState("");
  
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase())
  );
  
  return (
    <div className="bg-white rounded shadow-sm border p-3 h-100 d-flex flex-column">
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Buscar Productos"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      <div className="row">
        {filtered.map(product => (
          <div className="col-6 col-md-4 mb-3" key={product.id}>
            <div className="card h-100 text-center" title="Agregar al carrito">
              <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                <span className="badge bg-dark mb-1" style={{ fontSize: '11px' }}>${product.price.toFixed(2)}</span>
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="mb-1" 
                    style={{ width: 36, height: 36, objectFit: 'contain' }} 
                  />
                ) : (
                  <span className="rounded-circle bg-light border mb-1" style={{ width: 36, height: 36, lineHeight: "36px", fontSize: 20 }}>P</span>
                )}
                <span className="fw-bold" style={{ fontSize: '13px' }}>{product.name}</span>
                <button 
                  className="btn btn-outline-primary mt-1"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => addToCart(product.id)}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-12">
            <span className="text-muted">Sin resultados</span>
          </div>
        )}
      </div>
    </div>
  );
}