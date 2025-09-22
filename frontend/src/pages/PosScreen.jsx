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
import { ProductProvider } from "../context/ProductContext";
import Sidebar from "../components/Pos/Sidebar"
import Topbar from "../components/Pos/Topbar";
import TabsActions from "../components/Pos/TabsActions";
import ProductList from "../components/Pos/ProductList";
import Cart from "../components/Pos/Cart";
import ConsumerForm from "../components/Pos/ConsumerForm";

import ImageSyncButton from "../components/common/ImageSyncButton";

export default function PosScreen() {
  const [selectedTab, setSelectedTab] = useState("Remisión");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sellers, setSellers] = useState(["jose", "maria", "luis"]);
  const [seller, setSeller] = useState("jose");

  // Configurar vendedores simples
  useEffect(() => {
    const allSellers = ["jose", "Wilson"];
    setSellers(allSellers);
    setSeller("jose");
  }, []);
  const [client, setClient] = useState("CONSUMIDOR FINAL");
  const [priceList, setPriceList] = useState("CLIENTES");
  const [imp, setImp] = useState(0);
  const [desc, setDesc] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(210);

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
    <ProductProvider>
      <ModalProvider>
        <div className="d-flex">
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
              <TabsActions selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
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