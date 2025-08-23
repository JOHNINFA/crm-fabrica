import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import MainMenu from './pages/MainMenu';
import PosScreen from './pages/PosScreen';
import PedidosScreen from './pages/PedidosScreen';
import InventarioScreen from './pages/InventarioScreen';
import SelectorDia from './pages/SelectorDia';
import MenuSheets from './components/Cargue/MenuSheets';
import InformeVentasGeneral from './pages/InformeVentasGeneral';
import ClientesScreen from './pages/ClientesScreen';
import ListaClientesScreen from './pages/ListaClientesScreen';
import ListaPreciosScreen from './pages/ListaPreciosScreen';
import MaestroListaPreciosScreen from './pages/MaestroListaPreciosScreen';
import InformeListaPreciosScreen from './pages/InformeListaPreciosScreen';
import VendedoresScreen from './pages/VendedoresScreen';

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
          <Route path="/informes/general" element={<InformeVentasGeneral />} />
          <Route path="/clientes" element={<ListaClientesScreen />} />
          <Route path="/clientes/nuevo" element={<ClientesScreen />} />
          <Route path="/clientes/editar/:id" element={<ClientesScreen />} />
          <Route path="/clientes/ver/:id" element={<ClientesScreen />} />
          <Route path="/lista-precios" element={<MaestroListaPreciosScreen />} />
          <Route path="/crear-lista-precios" element={<ListaPreciosScreen />} />
          <Route path="/editar-lista-precios/:id" element={<ListaPreciosScreen />} />
          <Route path="/informe-lista-precios" element={<InformeListaPreciosScreen />} />
          <Route path="/vendedores" element={<VendedoresScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;