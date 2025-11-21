/**
 * PedidosRemisionesScreen.jsx
 * 
 * Este componente es la pantalla principal del sistema de PEDIDOS.
 * Integra todos los componentes necesarios para la generación de pedidos,
 * gestión del carrito, y procesamiento de documentos de entrega.
 * 
 * Características principales:
 * - Listado de productos con filtrado por categoría
 * - Carrito de productos con cálculo de totales
 * - Formulario de destinatario y vendedor
 * - Procesamiento de pedidos y generación de documentos
 * - Persistencia de datos en localStorage
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ModalProvider } from "../context/ModalContext";
import { useProducts } from "../hooks/useUnifiedProducts";
import { CajeroPedidosProvider, useCajeroPedidos } from "../context/CajeroPedidosContext";
import Sidebar from "../components/Pedidos/Sidebar"
import Topbar from "../components/Pedidos/Topbar";
import ProductList from "../components/Pedidos/ProductList";
import Cart from "../components/Pedidos/Cart";
import ConsumerForm from "../components/Pedidos/ConsumerForm";
import { usePriceList } from "../hooks/usePriceList";
import CategoryManager from "../components/Pos/CategoryManager";
import "./PedidosScreen.css";

import ImageSyncButton from "../components/common/ImageSyncButton";

// Componente que usa ProductContext (debe estar dentro de ProductProvider)
function PedidosMainContent() {
    const { products } = useProducts();
    const { cajeroLogueado, isAuthenticated } = useCajeroPedidos();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    // Función para obtener fecha local en formato YYYY-MM-DD
    const getFechaLocal = () => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(getFechaLocal);
    const [sellers, setSellers] = useState(["PEDIDOS"]);
    const [seller, setSeller] = useState("PEDIDOS");
    const [client, setClient] = useState("DESTINATARIO GENERAL");
    const [priceList, setPriceList] = useState("CLIENTES");
    const [clientData, setClientData] = useState(null);

    // Configurar vendedores simples
    useEffect(() => {
        const allSellers = ["PEDIDOS"];
        setSellers(allSellers);
        setSeller("PEDIDOS"); // Vendedor por defecto
    }, []);

    // Cargar datos del cliente desde URL si vienen de Pedidos
    useEffect(() => {
        const clienteParam = searchParams.get('cliente');
        if (clienteParam) {
            try {
                const clienteData = JSON.parse(decodeURIComponent(clienteParam));
                console.log('📦 Datos del cliente recibidos:', clienteData);
                setClientData(clienteData);
                setClient(clienteData.nombre || "DESTINATARIO GENERAL");
                if (clienteData.lista_precio) {
                    setPriceList(clienteData.lista_precio);
                }
                if (clienteData.fecha) {
                    setDate(clienteData.fecha);
                }
                // Usar el vendedor del cliente si viene de Pedidos
                if (clienteData.vendedor) {
                    console.log('✅ Usando vendedor del cliente:', clienteData.vendedor);
                    // Agregar el vendedor a la lista si no está
                    setSellers(prev => {
                        if (!prev.includes(clienteData.vendedor)) {
                            return [...prev, clienteData.vendedor];
                        }
                        return prev;
                    });
                    setSeller(clienteData.vendedor);
                }
            } catch (error) {
                console.error('Error parseando datos del cliente:', error);
            }
        }
    }, [searchParams, isAuthenticated, cajeroLogueado]);
    const [imp, setImp] = useState(0);
    const [desc, setDesc] = useState(0);
    const [sidebarWidth, setSidebarWidth] = useState(210);

    // Hook para obtener precios de la lista actual
    const { precios } = usePriceList(priceList, products);

    // Actualizar precios del carrito cuando cambia la lista de precios
    useEffect(() => {
        if (cart.length > 0 && Object.keys(precios).length > 0) {
            setCart(prevCart =>
                prevCart.map(item => {
                    // Obtener el precio de la nueva lista, o usar el precio base del producto
                    const nuevoPrecio = precios[item.id] !== undefined ? precios[item.id] : item.price;
                    return { ...item, price: nuevoPrecio };
                })
            );
        }
    }, [priceList, precios]);

    // Función para limpiar carrito después de remisión exitosa
    const clearCart = () => {
        setCart([]);
        setImp(0);
        setDesc(0);
    };

    // Función para resetear formulario a valores por defecto
    const resetForm = () => {
        setClient("DESTINATARIO GENERAL");
        setSeller("PEDIDOS");
        setPriceList("CLIENTES");
        setDate(getFechaLocal());
        setClientData(null);
        clearCart();
    };

    // Funciones carrito
    const addProduct = (product, currentPrice = null) => {
        setCart((prev) => {
            const found = prev.find((item) => item.id === product.id);
            if (found) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            // Usar el precio actual (de la lista) o el precio base del producto
            const priceToUse = currentPrice !== null ? currentPrice : product.price;
            return [...prev, { ...product, price: priceToUse, qty: 1 }];
        });
    };
    const removeProduct = (id) => setCart((prev) => prev.filter((item) => item.id !== id));
    const changeQty = (id, diff) => {
        setCart((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, qty: Math.max(1, item.qty + diff) }
                    : item
            )
        );
    };

    const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
    const total = Math.max(0, subtotal + Number(imp) - Number(desc));

    return (
        <ModalProvider>
            <div className="d-flex pedidos-screen">
                <Sidebar onWidthChange={setSidebarWidth} />
                <div
                    className="flex-grow-1 offset pedidos-screen"
                    style={{
                        marginLeft: sidebarWidth,
                        minHeight: "100vh",
                        background: "#f7f7fa",
                        transition: 'margin-left 0.3s ease'
                    }}
                >
                    <Topbar onOpenCategoryManager={() => setShowCategoryManager(true)} />
                    <main style={{ padding: "20px 24px 0px 24px" }}>
                        <div className="row">
                            <div className="col-lg-7 mb-4">
                                <ProductList
                                    addProduct={addProduct}
                                    search={search}
                                    setSearch={setSearch}
                                    priceList={priceList}
                                />
                            </div>

                            <div className="col-lg-5">
                                <div
                                    className="card-bg mb-3 p-0"
                                    style={{
                                        overflow: 'visible'
                                    }}
                                >
                                    <ConsumerForm
                                        date={date}
                                        seller={seller}
                                        client={client}
                                        priceList={priceList}
                                        setDate={setDate}
                                        setSeller={setSeller}
                                        setClient={setClient}
                                        setClientData={setClientData}
                                        setPriceList={setPriceList}
                                        sellers={sellers}
                                        setSellers={setSellers}
                                    />
                                    <Cart
                                        cart={cart}
                                        removeProduct={removeProduct}
                                        changeQty={changeQty}
                                        subtotal={subtotal}
                                        imp={imp}
                                        setImp={setImp}
                                        desc={desc}
                                        setDesc={setDesc}
                                        total={total}
                                        seller={seller}
                                        client={client}
                                        clientData={clientData}
                                        clearCart={clearCart}
                                        resetForm={resetForm}
                                        date={date}
                                    />
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Modal de gestión de categorías */}
            {showCategoryManager && (
                <div className="modal-overlay">
                    <CategoryManager onClose={() => setShowCategoryManager(false)} />
                </div>
            )}
        </ModalProvider>
    );
}

// Componente intermedio (ya no necesita ProductProvider, está en App.js)
const PedidosScreenContent = () => {
    return <PedidosMainContent />;
};

// Componente principal que provee el CajeroPedidosContext
const PedidosScreen = () => {
    return (
        <CajeroPedidosProvider>
            <PedidosScreenContent />
        </CajeroPedidosProvider>
    );
};

export default PedidosScreen;