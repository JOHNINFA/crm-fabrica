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
 * - Sincronización automática de ventas offline
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ModalProvider } from "../context/ModalContext";
import { useProducts } from "../hooks/useUnifiedProducts";
import { CajeroProvider, useCajero } from "../context/CajeroContext";
import Sidebar from "../components/Pos/Sidebar"
import Topbar from "../components/Pos/Topbar";
import ProductList from "../components/Pos/ProductList";
import Cart from "../components/Pos/Cart";
import ConsumerForm from "../components/Pos/ConsumerForm";
import { usePriceList } from "../hooks/usePriceList";
import usePageTitle from '../hooks/usePageTitle';
import usePreloadImages from '../hooks/usePreloadImages';
import "./PosScreen.css";

// 🆕 Importar servicio de sincronización offline
import { offlineSyncService } from "../services/offlineSyncService";

// Componente que usa ProductContext (debe estar dentro de ProductProvider)
function PosMainContent() {
  usePageTitle('POS');
  const { products: allProducts, getProductsByModule } = useProducts();

  const products = useMemo(() => {
    return getProductsByModule ? getProductsByModule('pos') : allProducts;
  }, [allProducts, getProductsByModule]);

  // 🆕 Precargar imágenes de productos
  usePreloadImages(products);

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

  // 🆕 El vendedor es SIEMPRE el cajero logueado
  const seller = cajeroLogueado?.nombre || 'POS';

  const [client, setClient] = useState("CONSUMIDOR FINAL");

  // 🆕 Determinar qué lista de precios usar según configuración de visibilidad
  // 🆕 Determinar qué lista de precios usar (ConsumerForm actualizará si es necesario)
  const [priceList, setPriceList] = useState("PRECIOS CAJA");

  const [imp, setImp] = useState(0);
  const [desc, setDesc] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(210);

  // Hook para obtener precios de la lista actual
  const { precios } = usePriceList(priceList, products);

  // 🆕 Activar sincronización automática de ventas offline
  useEffect(() => {
    // Iniciar sincronización automática
    offlineSyncService.startAutoSync();

    // Limpiar al desmontar
    return () => {
      offlineSyncService.stopAutoSync();
    };
  }, []);

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
    // 🆕 Resetear datos de venta a valores por defecto
    setClient("CONSUMIDOR FINAL");
    setPriceList("PRECIOS CAJA");
    setSelectedSeller(cajeroLogueado?.nombre || 'POS');
    setAddress("");
    setPhone("");
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

  // 🆕 Estados para datos de domicilio/envío
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(cajeroLogueado?.nombre || 'POS');

  // Inicializar vendedor cuando carga el cajero
  useEffect(() => {
    if (cajeroLogueado?.nombre) {
      setSelectedSeller(cajeroLogueado.nombre);
    }
  }, [cajeroLogueado]);

  return (
    <ModalProvider>
      <div className="d-flex pos-screen">
        <Sidebar onWidthChange={setSidebarWidth} onOpenCategoryManager={() => setShowCategoryManager(true)} />
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
                    overflow: 'visible'
                  }}
                >
                  <ConsumerForm
                    date={date}
                    seller={selectedSeller} // Pasamos el vendedor seleccionado
                    setSeller={setSelectedSeller} // Permitimos cambiarlo
                    client={client}
                    priceList={priceList}
                    setDate={setDate}
                    setClient={setClient}
                    setPriceList={setPriceList}
                    // 🆕 Pasamos setters para autocompletar datos del cliente
                    setAddress={setAddress}
                    setPhone={setPhone}
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
                    seller={selectedSeller} // El Vendedor (puede ser Moto)
                    userLogueado={cajeroLogueado?.nombre || 'Sistema'} // 🆕 El Cajero real
                    client={client}
                    clearCart={clearCart}
                    // 🆕 Datos extra para el ticket
                    address={address}
                    phone={phone}
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

// Componente intermedio (ya no necesita ProductProvider, está en App.js)
function PosScreenContent() {
  return <PosMainContent />;
}

// Componente principal que provee el CajeroContext
export default function PosScreen() {
  return (
    <CajeroProvider>
      <PosScreenContent />
    </CajeroProvider>
  );
}