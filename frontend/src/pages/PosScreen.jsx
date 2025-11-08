/**
 * PosScreen.jsx
 * 
 * Este componente es la pantalla principal del sistema POS (Point of Sale).
 * Integra todos los componentes necesarios para la venta de productos,
 * gestión del carrito, y procesamiento de pagos.
 * 
 * Características principales:
 * - Listado de productos con filtrado por categoría
 * - Carrito de compras con cálculo de totales
 * - Formulario de cliente y vendedor
 * - Procesamiento de pagos y generación de facturas
 * - Persistencia de datos en localStorage
 */

import React, { useState, useEffect } from "react";
import { ModalProvider } from "../context/ModalContext";
import { ProductProvider, useProducts } from "../context/ProductContext";
import { CajeroProvider, useCajero } from "../context/CajeroContext";
import Sidebar from "../components/Pos/Sidebar"
import Topbar from "../components/Pos/Topbar";
import ProductList from "../components/Pos/ProductList";
import Cart from "../components/Pos/Cart";
import ConsumerForm from "../components/Pos/ConsumerForm";
import { usePriceList } from "../hooks/usePriceList";
import "./PosScreen.css";

// Componente que usa ProductContext (debe estar dentro de ProductProvider)
function PosMainContent() {
  const { products } = useProducts();
  const { cajeroLogueado, isAuthenticated } = useCajero();
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
  const [sellers, setSellers] = useState(["jose", "maria", "luis"]);
  const [seller, setSeller] = useState("jose");

  // Configurar vendedores simples
  useEffect(() => {
    const allSellers = ["jose", "Wilson"];
    setSellers(allSellers);
    setSeller("jose");
  }, []);

  // Actualizar vendedor cuando se loguea un cajero
  useEffect(() => {
    if (isAuthenticated && cajeroLogueado) {
      console.log('🔄 Cajero logueado, actualizando vendedor:', cajeroLogueado.nombre);
      setSeller(cajeroLogueado.nombre);
    } else {
      // Si no hay cajero logueado, usar vendedor por defecto
      setSeller("jose");
    }
  }, [isAuthenticated, cajeroLogueado]);

  const [client, setClient] = useState("CONSUMIDOR FINAL");
  const [priceList, setPriceList] = useState("CLIENTES");
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

  // Función para limpiar carrito después de venta exitosa
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
    <ModalProvider>
      <div className="d-flex pos-screen">
        <Sidebar onWidthChange={setSidebarWidth} />
        <div className="flex-grow-1 pos-main-container">
          <Topbar onOpenCategoryManager={() => setShowCategoryManager(true)} />
          <main style={{ padding: "20px 24px 0px 24px" }}>
            <div className="row">
              <div className="col-lg-7 mb-4">
                <ProductList
                  addProduct={addProduct}
                  search={search}
                  setSearch={setSearch}
                  priceList={priceList}
                  showCategoryManager={showCategoryManager}
                  setShowCategoryManager={setShowCategoryManager}
                />
              </div>

              <div className="col-lg-5">
                <div
                  className="card-bg mb-3 p-0"
                  style={{
                    position: 'sticky',
                    top: '70px',
                    alignSelf: 'flex-start',
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
                    clearCart={clearCart}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ModalProvider>
  );
}

// Componente intermedio que provee ProductProvider
function PosScreenContent() {
  return (
    <ProductProvider>
      <PosMainContent />
    </ProductProvider>
  );
}

// Componente principal que provee el CajeroContext
export default function PosScreen() {
  return (
    <CajeroProvider>
      <PosScreenContent />
    </CajeroProvider>
  );
}