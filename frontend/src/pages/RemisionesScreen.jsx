/**
 * RemisionesScreen.jsx
 * 
 * Este componente es la pantalla principal del sistema de REMISIONES.
 * Integra todos los componentes necesarios para la generación de remisiones,
 * gestión del carrito, y procesamiento de documentos de entrega.
 * 
 * Características principales:
 * - Listado de productos con filtrado por categoría
 * - Carrito de productos con cálculo de totales
 * - Formulario de destinatario y vendedor
 * - Procesamiento de remisiones y generación de documentos
 * - Persistencia de datos en localStorage
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ModalProvider } from "../context/ModalContext";
import { ProductProvider } from "../context/ProductContext";
import { CajeroRemisionesProvider, useCajeroRemisiones } from "../context/CajeroRemisionesContext";
import Sidebar from "../components/Remisiones/Sidebar"
import Topbar from "../components/Remisiones/Topbar";
import ProductList from "../components/Remisiones/ProductList";
import Cart from "../components/Remisiones/Cart";
import ConsumerForm from "../components/Remisiones/ConsumerForm";

import ImageSyncButton from "../components/common/ImageSyncButton";

// Componente interno que usa el CajeroRemisionesContext
function RemisionesScreenContent() {
    const { cajeroLogueado, isAuthenticated } = useCajeroRemisiones();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    // Función para obtener fecha local en formato YYYY-MM-DD
    const getFechaLocal = () => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(getFechaLocal);
    const [sellers, setSellers] = useState(["REMISIONES"]);
    const [seller, setSeller] = useState("REMISIONES");
    const [client, setClient] = useState("DESTINATARIO GENERAL");
    const [priceList, setPriceList] = useState("CLIENTES");
    const [clientData, setClientData] = useState(null);

    // Configurar vendedores simples
    useEffect(() => {
        const allSellers = ["REMISIONES"];
        setSellers(allSellers);
        setSeller("REMISIONES"); // Vendedor por defecto
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

    // Función para limpiar carrito después de remisión exitosa
    const clearCart = () => {
        setCart([]);
        setImp(0);
        setDesc(0);
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
        <ProductProvider>
            <ModalProvider>
                <div className="d-flex remisiones-screen">
                    <Sidebar onWidthChange={setSidebarWidth} />
                    <div
                        className="flex-grow-1 offset"
                        style={{
                            marginLeft: sidebarWidth,
                            minHeight: "100vh",
                            background: "#f7f7fa",
                            transition: 'margin-left 0.3s ease'
                        }}
                    >
                        <Topbar />
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
                                    <div className="card-bg mb-3 p-0" style={{ overflow: 'hidden' }}>
                                        <ConsumerForm
                                            date={date}
                                            seller={seller}
                                            client={client}
                                            priceList={priceList}
                                            setDate={setDate}
                                            setSeller={setSeller}
                                            setClient={setClient}
                                            setPriceList={setPriceList}
                                            sellers={sellers}
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
                                        />
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </ModalProvider>
        </ProductProvider>
    );
}

// Componente principal que provee el CajeroRemisionesContext
export default function RemisionesScreen() {
    return (
        <CajeroRemisionesProvider>
            <RemisionesScreenContent />
        </CajeroRemisionesProvider>
    );
}