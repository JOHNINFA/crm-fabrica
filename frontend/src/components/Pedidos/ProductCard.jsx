import React, { useState, useEffect } from "react";
import { localImageService } from "../../services/localImageService";
import { listaPrecioService, precioProductoService } from "../../services/listaPrecioService";
import "./ProductCard.css";

export default function ProductCard({ product, onClick, priceList }) {
    const [imageSource, setImageSource] = useState(product.image || null);
    const [precioEspecifico, setPrecioEspecifico] = useState(null);
    const [isClicked, setIsClicked] = useState(false);

    // Cargar imagen local si no está disponible - EXACTAMENTE IGUAL QUE POS
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

    // Debug: verificar precio del producto
    useEffect(() => {
        if (!product.price || product.price === 0) {

        }
    }, [product]);

    // Cargar precio específico según lista seleccionada (solo para obtener el precio al agregar al carrito)
    useEffect(() => {
        if (!priceList) {
            setPrecioEspecifico(null);
            return;
        }

        const cargarPrecioEspecifico = async () => {
            try {
                const listas = await listaPrecioService.getAll({ activo: true });
                const lista = listas.find(l => l.nombre === priceList);
                if (!lista) {
                    setPrecioEspecifico(null);
                    return;
                }

                const precios = await precioProductoService.getAll({ producto: product.id, lista_precio: lista.id });
                if (precios.length > 0) {
                    setPrecioEspecifico(precios[0].precio);
                } else {
                    setPrecioEspecifico(null);
                }
            } catch (error) {
                console.error('Error cargando precio específico:', error);
                setPrecioEspecifico(null);
            }
        };

        cargarPrecioEspecifico();
    }, [product.id, priceList]);

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
                {/* Imagen o icono por defecto - EXACTAMENTE IGUAL QUE POS */}
                {/* Imagen o icono por defecto - EXACTAMENTE IGUAL QUE POS */}
                <div style={{
                    height: '50px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '3px',
                    overflow: 'hidden',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px'
                }}>
                    {imageSource ? (
                        <img
                            src={imageSource}
                            alt={product.name || 'Producto'}
                            loading="eager"
                            style={{
                                height: '100%',
                                width: 'auto',
                                maxWidth: '100%',
                                objectFit: 'contain'
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: 22 }} className="material-icons">
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
