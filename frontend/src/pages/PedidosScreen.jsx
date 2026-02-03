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

import React, { useState, useEffect, useMemo } from "react";
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
import usePageTitle from '../hooks/usePageTitle';
import CategoryManager from "../components/Pos/CategoryManager";
import "./PedidosScreen.css";

import ImageSyncButton from "../components/common/ImageSyncButton";

// Componente que usa ProductContext (debe estar dentro de ProductProvider)
function PedidosMainContent() {
    usePageTitle('Pedidos');
    const { products: allProducts, getProductsByModule } = useProducts();

    const products = useMemo(() => {
        return getProductsByModule ? getProductsByModule('pedidos') : allProducts;
    }, [allProducts, getProductsByModule]);

    const { cajeroLogueado, isAuthenticated } = useCajeroPedidos();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [productosFrecuentesCargados, setProductosFrecuentesCargados] = useState(false);  // 🆕 Flag para evitar recargas
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
    const [priceList, setPriceList] = useState("VENDEDORES");
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
        } else {
            // 🆕 Si no hay cliente, revisar si vienen fecha/dia sueltos (desde "Ir a Pedidos")
            const fechaParam = searchParams.get('fecha');
            if (fechaParam) {
                setDate(fechaParam);
            }
        }
    }, [searchParams, isAuthenticated, cajeroLogueado]);

    // 🆕 Actualizar contexto cuando cambia la fecha (para que siempre regreses al día correcto)
    // 🆕 Actualizar contexto cuando cambia la fecha (para que siempre regreses al día correcto)
    /* 
       ⚠️ COMENTADO: Esto causaba un error. Si estoy gestionando la planilla del SABADO
       pero creo un pedido para el LUNES, esto me cambiaba el retorno al LUNES.
       El usuario quiere volver a la planilla que estaba trabajando (SABADO).
       
    useEffect(() => {
        if (date) {
            // Solo actualizar si ya hay contexto guardado (viniste desde gestión)
            const diaGuardado = localStorage.getItem('pedidos_retorno_dia');
            if (diaGuardado) {
                // Calcular día de la semana de la nueva fecha
                const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
                const fechaObj = new Date(date + 'T00:00:00');
                const nuevoDia = diasSemana[fechaObj.getDay()];

                // Actualizar contexto con la nueva fecha
                localStorage.setItem('pedidos_retorno_dia', nuevoDia);
                // localStorage.setItem('pedidos_retorno_fecha', date); // Tampoco cambiar la fecha de retorno
            }
        }
    }, [date]);
    */

    const [imp, setImp] = useState(0);

    const [desc, setDesc] = useState(0);
    const [sidebarWidth, setSidebarWidth] = useState(210);

    // Hook para obtener precios de la lista actual
    const { precios } = usePriceList(priceList, products);

    // Actualizar precios del carrito cuando cambia la lista de precios
    // Actualizar precios del carrito cuando cambia la lista de precios o se cargan productos
    useEffect(() => {
        if (cart.length > 0 && Object.keys(precios).length > 0) {
            let huboCambios = false;

            const nuevoCart = cart.map(item => {
                const nuevoPrecio = precios[item.id] !== undefined ? precios[item.id] : item.price;
                // Solo marcar cambio si el precio es diferente
                if (item.price !== nuevoPrecio) {
                    huboCambios = true;
                    return { ...item, price: nuevoPrecio };
                }
                return item;
            });

            if (huboCambios) {
                setCart(nuevoCart);
            }
        }
    }, [priceList, precios, cart.length]);

    // 🆕 Cargar productos frecuentes al carrito si vienen en la URL
    useEffect(() => {
        const clienteParam = searchParams.get('cliente');
        // Solo cargar UNA VEZ cuando hay productos disponibles y NO se han cargado antes
        if (clienteParam && !productosFrecuentesCargados && products.length > 0) {
            try {
                const clienteData = JSON.parse(decodeURIComponent(clienteParam));

                if (clienteData.productos_frecuentes && clienteData.productos_frecuentes.length > 0) {
                    console.log('📦 Cargando productos frecuentes al carrito:', clienteData.productos_frecuentes);

                    // Convertir productos frecuentes a items del carrito
                    const productosParaCarrito = [];

                    for (const pf of clienteData.productos_frecuentes) {
                        // Buscar el producto en la lista de productos disponibles
                        const producto = products.find(p => p.id === pf.producto_id);

                        if (producto) {
                            // Obtener precio de la lista o usar precio base
                            const precioProducto = precios[producto.id] !== undefined ? precios[producto.id] : producto.precio;

                            productosParaCarrito.push({
                                ...producto,
                                price: precioProducto,
                                qty: pf.cantidad || 1
                            });

                            console.log(`✅ ${producto.nombre} x${pf.cantidad} agregado`);
                        } else {
                            console.warn(`⚠️ Producto ${pf.producto_id} no encontrado`);
                        }
                    }

                    if (productosParaCarrito.length > 0) {
                        setCart(productosParaCarrito);
                        setProductosFrecuentesCargados(true);  // 🆕 Marcar como cargado
                        console.log(`✅ ${productosParaCarrito.length} productos cargados al carrito`);
                    }
                }
            } catch (error) {
                console.error('Error cargando productos frecuentes:', error);
            }
        }
    }, [searchParams, products, precios, productosFrecuentesCargados]);


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
        setPriceList("VENDEDORES"); // Corregido: VENDEDORES es el default correcto
        setDate(getFechaLocal()); // 🆕 Reiniciar fecha a hoy (Solicitud Usuario)

        setClientData(null);
        clearCart();

        // 🆕 Limpia la URL sin recargar la página (elimina ?cliente=...)
        setSearchParams({});
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
                    className="flex-grow-1 pedidos-screen"
                    style={{
                        minHeight: "100vh",
                        background: "#f7f7fa",
                        overflowX: 'hidden'
                    }}
                >
                    <Topbar onOpenCategoryManager={() => setShowCategoryManager(true)} />
                    <main>
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
                                        clientData={clientData} // 🆕 Pasar datos del cliente
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