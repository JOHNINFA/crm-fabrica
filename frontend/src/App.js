import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UsuariosProvider } from './context/UsuariosContext';
import { UnifiedProductProvider } from './context/UnifiedProductContext';

import LoginScreen from './pages/LoginScreen';
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

// Componente para proteger rutas
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, usuario } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🆕 Restricción para CAJERO POS: Solo permitir acceso a pantalla POS
  // Normalizar rol para evitar errores de case/espacios
  const rolNormalizado = usuario?.rol ? usuario.rol.trim().toUpperCase() : '';

  if (rolNormalizado === 'CAJERO POS' || rolNormalizado === 'POS') {
    const rutasPermitidas = ['/pos', '/configuracion/impresion', '/cajero'];
    // Verificar si la ruta actual empieza por alguna de las permitidas
    const accesoPermitido = rutasPermitidas.some(ruta => location.pathname.startsWith(ruta));

    if (!accesoPermitido) {
      console.log(`⛔ Bloqueando acceso a ${location.pathname} para rol ${rolNormalizado}`);
      return <Navigate to="/pos" replace />;
    }
  }

  return children;
}

// Componente para manejar la redirección a POS (Electron)
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

// Rutas de la aplicación (separadas para usar dentro de AuthProvider)
function AppRoutes() {
  return (
    <>
      <PosRedirect />
      <div className="App">
        <Routes>
          {/* Ruta de Login (pública) */}
          <Route path="/login" element={<LoginScreen />} />

          {/* Rutas SIEMPRE accesibles (web y Electron) - Protegidas */}
          <Route path="/pos" element={
            <ProtectedRoute>
              <PosScreen />
            </ProtectedRoute>
          } />
          <Route path="/configuracion/impresion" element={
            <ProtectedRoute>
              <ConfiguracionImpresionScreen />
            </ProtectedRoute>
          } />

          {/* Rutas solo accesibles en modo web (NO en POS_ONLY) */}
          {!window.POS_ONLY_MODE && (
            <>
              <Route path="/" element={
                <ProtectedRoute>
                  <MainMenu />
                </ProtectedRoute>
              } />
              <Route path="/productos" element={
                <ProtectedRoute>
                  <ProductFormScreen />
                </ProtectedRoute>
              } />
              <Route path="/remisiones" element={
                <ProtectedRoute>
                  <PedidosScreen />
                </ProtectedRoute>
              } />
              <Route path="/pedidos" element={
                <ProtectedRoute>
                  <SelectorDiasPedidosScreen />
                </ProtectedRoute>
              } />
              <Route path="/pedidos/:dia" element={
                <ProtectedRoute>
                  <PedidosDiaScreen />
                </ProtectedRoute>
              } />
              <Route path="/inventario" element={
                <ProtectedRoute>
                  <InventarioScreen />
                </ProtectedRoute>
              } />
              <Route path="/cargue" element={
                <ProtectedRoute>
                  <SelectorDia />
                </ProtectedRoute>
              } />
              <Route path="/cargue/:dia" element={
                <ProtectedRoute>
                  <MenuSheets />
                </ProtectedRoute>
              } />
              <Route path="/informes/general" element={
                <ProtectedRoute>
                  <InformeVentasGeneral />
                </ProtectedRoute>
              } />
              <Route path="/informes/transferencias" element={
                <ProtectedRoute>
                  <ReporteTransferenciasScreen />
                </ProtectedRoute>
              } />
              <Route path="/informes/pedidos" element={
                <ProtectedRoute>
                  <InformePedidosScreen />
                </ProtectedRoute>
              } />
              <Route path="/clientes" element={
                <ProtectedRoute>
                  <ListaClientesScreen />
                </ProtectedRoute>
              } />
              <Route path="/clientes/nuevo" element={
                <ProtectedRoute>
                  <ClientesScreen />
                </ProtectedRoute>
              } />
              <Route path="/clientes/editar/:id" element={
                <ProtectedRoute>
                  <ClientesScreen />
                </ProtectedRoute>
              } />
              <Route path="/clientes/ver/:id" element={
                <ProtectedRoute>
                  <ClientesScreen />
                </ProtectedRoute>
              } />
              <Route path="/lista-precios" element={
                <ProtectedRoute>
                  <MaestroListaPreciosScreen />
                </ProtectedRoute>
              } />
              <Route path="/crear-lista-precios" element={
                <ProtectedRoute>
                  <ListaPreciosScreen />
                </ProtectedRoute>
              } />
              <Route path="/editar-lista-precios/:id" element={
                <ProtectedRoute>
                  <ListaPreciosScreen />
                </ProtectedRoute>
              } />
              <Route path="/informe-lista-precios" element={
                <ProtectedRoute>
                  <InformeListaPreciosScreen />
                </ProtectedRoute>
              } />
              <Route path="/vendedores" element={
                <ProtectedRoute>
                  <VendedoresScreen />
                </ProtectedRoute>
              } />
              <Route path="/domiciliarios" element={
                <ProtectedRoute>
                  <DomiciliariosScreen />
                </ProtectedRoute>
              } />
              <Route path="/caja" element={
                <ProtectedRoute>
                  <CajaScreen />
                </ProtectedRoute>
              } />
              <Route path="/cajero" element={
                <ProtectedRoute>
                  <CajeroScreen />
                </ProtectedRoute>
              } />
              <Route path="/sucursales" element={
                <ProtectedRoute>
                  <SucursalesScreen />
                </ProtectedRoute>
              } />
              <Route path="/cajeros" element={
                <ProtectedRoute>
                  <CajerosScreen />
                </ProtectedRoute>
              } />
              <Route path="/otros" element={
                <ProtectedRoute>
                  <OtrosScreen />
                </ProtectedRoute>
              } />
              <Route path="/configuracion" element={
                <ProtectedRoute>
                  <ConfiguracionScreen />
                </ProtectedRoute>
              } />
              <Route path="/reportes-avanzados" element={
                <ProtectedRoute>
                  <ReportesAvanzadosScreen />
                </ProtectedRoute>
              } />
              <Route path="/trazabilidad" element={
                <ProtectedRoute>
                  <TrazabilidadScreen />
                </ProtectedRoute>
              } />
              <Route path="/precios-cargue" element={
                <ProtectedRoute>
                  <PreciosCargueScreen />
                </ProtectedRoute>
              } />
            </>
          )}
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <UsuariosProvider>
        <UnifiedProductProvider>
          <Router>
            <AppRoutes />
          </Router>
        </UnifiedProductProvider>
      </UsuariosProvider>
    </AuthProvider>
  );
}

export default App;