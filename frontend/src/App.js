// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import { ModalProvider } from './context/ModalContext';

import MainMenu from './pages/MainMenu';
import SelectorDia from './pages/SelectorDia';
import MenuSheets from './components/Cargue/MenuSheets';
import PosScreen from './pages/PosScreen';
import PedidosScreen from './pages/PedidosScreen';
import InventarioScreen from './pages/InventarioScreen';


function App() {
  return (
    <ProductProvider>
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/pos" element={<PosScreen />} />
            <Route path="/cargue" element={<SelectorDia />} />
            <Route path="/cargue/:dia" element={<MenuSheets />} />
            <Route path="/pedidos" element={<PedidosScreen />} />
            <Route path="/inventario" element={<InventarioScreen />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </ProductProvider>
  );
}

export default App;


