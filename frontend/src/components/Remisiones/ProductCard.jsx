import React, { useState, useEffect } from "react";
import { localImageService } from "../../services/localImageService";
import { listaPrecioService, precioProductoService } from "../../services/listaPrecioService";

export default function ProductCard({ product, onClick, priceList }) {
    const [imageSource, setImageSource] = useState(product.image || null);
    const [precioEspecifico, setPrecioEspecifico] = useState(null);

    // Debug: verificar precio del producto
    useEffect(() => {
        if (!product.price || product.price === 0) {
            console.log('Producto sin precio base:', product.name, 'precio:', product.price);
        }
    }, [product]);

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

    return (
        <div
            className="card h-100"
            style={{
                border: "1px solid #e5e9f2",
                borderRadius: 9,
                cursor: "pointer",
                transition: "box-shadow 0.1s",
                maxWidth: "180px",
                margin: "0 auto"
            }}
            onClick={() => onClick(product, precioEspecifico !== null ? precioEspecifico : (product.price || 0))}
            title="Agregar al carrito"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            <div className="card-body d-flex flex-column align-items-center text-center p-2">
                {/* Imagen o icono por defecto */}
                {imageSource ? (
                    <img
                        src={imageSource}
                        alt={product.name || 'Producto'}
                        className="mb-2"
                        style={{
                            maxHeight: 60,
                            maxWidth: '100%',
                            objectFit: 'contain'
                        }}
                    />
                ) : (
                    <span style={{ fontSize: 28 }} className="material-icons mb-1">
                        inventory_2
                    </span>
                )}

                {/* Precio */}
                <div style={{ fontSize: '14px' }}>
                    <strong>{formatPrice(product.price || 0)}</strong>
                </div>

                {/* Nombre del producto */}
                <div className="text-muted" style={{ fontSize: 13 }}>
                    {product.name || 'Producto sin nombre'}
                </div>
            </div>
        </div>
    );
}