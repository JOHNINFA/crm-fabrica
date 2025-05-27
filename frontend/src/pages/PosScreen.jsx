import React, { useState } from "react";
import { ModalProvider } from "../context/ModalContext";
import { ProductProvider } from "../context/ProductContext";
import Sidebar from "../components/Pos/Sidebar"
import Topbar from "../components/Pos/Topbar";
import TabsActions from "../components/Pos/TabsActions";
import ProductList from "../components/Pos/ProductList";
import Cart from "../components/Pos/Cart";
import ConsumerForm from "../components/Pos/ConsumerForm";
import PanelToolbar from "../components/Pos/PanelToolbar";

const defaultSellers = ["jose", "maria", "luis"];

export default function PosScreen() {
  const [selectedTab, setSelectedTab] = useState("Remisión");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [seller, setSeller] = useState(defaultSellers[0]);
  const [imp, setImp] = useState(0);
  const [desc, setDesc] = useState(0);

  // Funciones carrito
  const addProduct = (product) => {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
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
          <Sidebar />
          <div
            className="flex-grow-1 offset"
            style={{ marginLeft: 210, minHeight: "100vh", background: "#f7f7fa" }}
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
                  />
                </div>

                <div className="col-lg-5">
                  <div className="card-bg mb-3 p-0" style={{ overflow: 'hidden' }}>
                    <PanelToolbar />
                    <ConsumerForm
                      date={date}
                      seller={seller}
                      setDate={setDate}
                      setSeller={setSeller}
                      sellers={defaultSellers}
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
                    />
                    {/* WhatsApp */}
                    <div style={{
                      position: "fixed",
                      bottom: 18,
                      right: 18,
                      zIndex: 12,
                    }}>
                      <a
                        href="#"
                        rel="noopener noreferrer"
                        target="_blank"
                        aria-label="Whatsapp"
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                          width={48}
                          alt="WhatsApp"
                          style={{
                            borderRadius: "50%",
                            boxShadow: "0 2px 8px #aaa",
                          }}
                        />
                      </a>
                    </div>
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