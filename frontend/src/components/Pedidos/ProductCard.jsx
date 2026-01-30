import React, { useState, useEffect } from "react";
import { localImageService } from "../../services/localImageService";
import { useUnifiedProducts } from "../../context/UnifiedProductContext";
import { usePriceList } from "../../hooks/usePriceList";
import "./ProductCard.css";

export default function ProductCard({ product, onClick, priceList }) {
    // 🚀 Obtener caché de imágenes del contexto
    const { productImages } = useUnifiedProducts();

    // 🚀 Usar hook de precios con caché (compartido entre todas las tarjetas)
    const { getPrecio } = usePriceList(priceList);

    // 🚀 PRIORIDAD: Usar imagen del producto PRIMERO (más rápido)
    const cachedImage = productImages?.[product.id];
    const [imageSource, setImageSource] = useState(product.image || cachedImage || null);
    const [isClicked, setIsClicked] = useState(false);

    // Obtener precio del producto desde la caché
    const precioEspecifico = getPrecio(product.id);

    // Cargar imagen local si no está disponible
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

    // Debug: verificar precio del producto
    useEffect(() => {
        if (!product.price || product.price === 0) {

        }
    }, [product]);

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
            onClick(product, precioEspecifico !== null ? precioEspecifico : (product.price || 0));
        }
    };

    const handleClick = () => {
        setIsClicked(true);
        onClick(product, precioEspecifico !== null ? precioEspecifico : (product.price || 0));
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
                {/* Imagen o icono por defecto - Sin animaciones para carga instantánea */}
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

                {/* Precio */}
                <div className="product-price">
                    <strong>{formatPrice(precioEspecifico !== null ? precioEspecifico : (product.price || 0))}</strong>
                </div>

                {/* Nombre del producto */}
                <div className="product-name">
                    {product.name || 'Producto sin nombre'}
                </div>
            </div>
        </div>
    );
}
