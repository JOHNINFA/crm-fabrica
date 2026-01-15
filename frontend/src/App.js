import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { UsuariosProvider } from './context/UsuariosContext';
import { UnifiedProductProvider } from './context/UnifiedProductContext';

import MainMenu from './pages/MainMenu';
import PosScreen from './pages/PosScreen';
import PedidosScreen from './pages/PedidosScreen';
import SelectorDiasPedidosScreen from './pages/SelectorDiasPedidosScreen';
import PedidosDiaScreen from './pages/PedidosDiaScreen';
import InventarioScreen from './pages/InventarioScreen';
import SelectorDia from './pages/SelectorDia';
import MenuSheets from './components/Cargue/MenuSheets';
import InformeVentasGeneral from './pages/InformeVentasGeneral';
import InformePedidosScreen from './pages/InformePedidosScreen';
import ClientesScreen from './pages/ClientesScreen';

import ListaClientesScreen from './pages/ListaClientesScreen';
import ListaPreciosScreen from './pages/ListaPreciosScreen';
import MaestroListaPreciosScreen from './pages/MaestroListaPreciosScreen';
import InformeListaPreciosScreen from './pages/InformeListaPreciosScreen';
import VendedoresScreen from './pages/VendedoresScreen';
import DomiciliariosScreen from './pages/DomiciliariosScreen';
import CajaScreen from './pages/CajaScreen';
import CajeroScreen from './pages/CajeroScreen';
import SucursalesScreen from './pages/SucursalesScreen';
import CajerosScreen from './pages/CajerosScreen';
import OtrosScreen from './pages/OtrosScreen';
import ProductFormScreen from './pages/ProductFormScreen';
import ConfiguracionScreen from './pages/ConfiguracionScreen';
import ConfiguracionImpresionScreen from './pages/ConfiguracionImpresionScreen';
import ReportesAvanzadosScreen from './pages/ReportesAvanzadosScreen';
import TrazabilidadScreen from './pages/TrazabilidadScreen';
import PreciosCargueScreen from './pages/PreciosCargueScreen';
import ReporteTransferenciasScreen from './pages/ReporteTransferenciasScreen';

// Componente para manejar la redirección a POS
function PosRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Si estamos en modo POS_ONLY (Electron) y en la raíz, redirigir a /pos
    if (window.POS_ONLY_MODE && location.pathname === '/') {
      console.log('🎯 Redirigiendo a POS (modo Electron)');
      navigate('/pos', { replace: true });
    }
  }, [navigate, location]);

  return null;
}

function App() {
  return (
    <UsuariosProvider>
      <UnifiedProductProvider>
        <Router>
          <PosRedirect />
          <div className="App">
            <Routes>
              {/* Rutas SIEMPRE accesibles (web y Electron) */}
              <Route path="/pos" element={<PosScreen />} />
              <Route path="/configuracion/impresion" element={<ConfiguracionImpresionScreen />} />

              {/* Rutas solo accesibles en modo web (NO en POS_ONLY) */}
              {!window.POS_ONLY_MODE && (
                <>
                  <Route path="/" element={<MainMenu />} />
                  <Route path="/productos" element={<ProductFormScreen />} />
                  <Route path="/remisiones" element={<PedidosScreen />} />
                  <Route path="/pedidos" element={<SelectorDiasPedidosScreen />} />
                  <Route path="/pedidos/:dia" element={<PedidosDiaScreen />} />
                  <Route path="/inventario" element={<InventarioScreen />} />
                  <Route path="/cargue" element={<SelectorDia />} />
                  <Route path="/cargue/:dia" element={<MenuSheets />} />
                  <Route path="/informes/general" element={<InformeVentasGeneral />} />
                  <Route path="/informes/transferencias" element={<ReporteTransferenciasScreen />} />
                  <Route path="/informes/pedidos" element={<InformePedidosScreen />} />
                  <Route path="/clientes" element={<ListaClientesScreen />} />
                  <Route path="/clientes/nuevo" element={<ClientesScreen />} />
                  <Route path="/clientes/editar/:id" element={<ClientesScreen />} />
                  <Route path="/clientes/ver/:id" element={<ClientesScreen />} />
                  <Route path="/lista-precios" element={<MaestroListaPreciosScreen />} />
                  <Route path="/crear-lista-precios" element={<ListaPreciosScreen />} />
                  <Route path="/editar-lista-precios/:id" element={<ListaPreciosScreen />} />
                  <Route path="/informe-lista-precios" element={<InformeListaPreciosScreen />} />
                  <Route path="/vendedores" element={<VendedoresScreen />} />
                  <Route path="/domiciliarios" element={<DomiciliariosScreen />} />
                  <Route path="/caja" element={<CajaScreen />} />
                  <Route path="/cajero" element={<CajeroScreen />} />
                  <Route path="/sucursales" element={<SucursalesScreen />} />
                  <Route path="/cajeros" element={<CajerosScreen />} />
                  <Route path="/otros" element={<OtrosScreen />} />
                  <Route path="/configuracion" element={<ConfiguracionScreen />} />
                  <Route path="/reportes-avanzados" element={<ReportesAvanzadosScreen />} />
                  <Route path="/trazabilidad" element={<TrazabilidadScreen />} />
                  <Route path="/precios-cargue" element={<PreciosCargueScreen />} />
                </>
              )}
            </Routes>
          </div>
        </Router>
      </UnifiedProductProvider>
    </UsuariosProvider >
  );
}

export default App;