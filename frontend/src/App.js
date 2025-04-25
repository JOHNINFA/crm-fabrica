// Actualización en src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainMenu from './components/MainMenu';
import SelectorDia from './components/ SelectorDia'
import MenuSheets from './components/MenuSheets';
import PosScreen from './components/PosScreen';
import PedidosScreen from './components/PedidosScreen';
import InventarioScreen from './components/InventarioScreen';

function App() {
  return (
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
  );
}

export default App;