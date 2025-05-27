import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import MainMenu from './pages/MainMenu';
import PosScreen from './pages/PosScreen';
import PedidosScreen from './pages/PedidosScreen';
import InventarioScreen from './pages/InventarioScreen';
import SelectorDia from './pages/SelectorDia';
import MenuSheets from './components/Cargue/MenuSheets';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/pos" element={<PosScreen />} />
          <Route path="/pedidos" element={<PedidosScreen />} />
          <Route path="/inventario" element={<InventarioScreen />} />
          <Route path="/cargue" element={<SelectorDia />} />
          <Route path="/cargue/:dia" element={<MenuSheets />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;