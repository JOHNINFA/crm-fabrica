import React, { useState, useEffect } from 'react';
import { useProducts } from '../../context/ProductContext';
import TablaProductos from './TablaProductos';
import ResumenVentas from './ResumenVentas';
import BotonLimpiar from './BotonLimpiar';
import './PlantillaOperativa.css';

const PlantillaOperativa = ({ responsable = "LUIS MENDEZ", dia, idSheet, idUsuario, onEditarNombre }) => {
  const { products } = useProducts();
  const [productosOperativos, setProductosOperativos] = useState([]);
  const [datosResumen, setDatosResumen] = useState({
    totalDespacho: 0,
    totalPedidos: 0,
    totalDctos: 0,
    venta: 0,
    totalEfectivo: 0,
  });

  useEffect(() => {
    // Convertir productos del POS a formato operativo
    const productosFormateados = products.map(product => ({
      id: product.id,
      producto: product.name,
      cantidad: 0,
      dctos: 0,
      adicional: 0,
      devoluciones: 0,
      vencidas: 0,
      total: 0,
      valor: Math.round(product.price * 0.65), // Precio de compra aproximado
      neto: 0,
      vendedor: true,
      despachador: false
    }));
    
    setProductosOperativos(productosFormateados);
  }, [products]);

  const actualizarProducto = (id, campo, valor) => {
    setProductosOperativos(prev => 
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, [campo]: parseInt(valor) || 0 };
          // Calcular total automáticamente
          updated.total = updated.cantidad - updated.dctos + updated.adicional - updated.devoluciones - updated.vencidas;
          updated.neto = updated.total * updated.valor;
          return updated;
        }
        return p;
      })
    );
  };

  useEffect(() => {
    // Calcular resumen automáticamente
    const totalNeto = productosOperativos.reduce((sum, p) => sum + (p.neto || 0), 0);
    setDatosResumen({
      totalDespacho: totalNeto,
      totalPedidos: 0,
      totalDctos: 0,
      venta: totalNeto,
      totalEfectivo: totalNeto,
    });
  }, [productosOperativos]);

  const limpiarDatos = () => {
    setProductosOperativos(prev => 
      prev.map(p => ({
        ...p,
        cantidad: 0,
        dctos: 0,
        adicional: 0,
        devoluciones: 0,
        vencidas: 0,
        total: 0,
        neto: 0
      }))
    );
  };

  return (
    <div className="container-fluid plantilla-operativa" style={{ minWidth: '1200px' }}>
      <div className="d-flex justify-content-between align-items-center">
        <h6 
          className="responsable-title m-0" 
          onDoubleClick={onEditarNombre}
          style={{ cursor: 'pointer', userSelect: 'none', color: 'red' }}
        >
          {responsable}
        </h6>
      </div>
      <div className="row">
        <div className="col-lg-8">
          <TablaProductos 
            productos={productosOperativos} 
            onActualizarProducto={actualizarProducto}
          />
          <BotonLimpiar onLimpiar={limpiarDatos} />
        </div>
        <div className="col-lg-4">
          <ResumenVentas datos={datosResumen} />
        </div>
      </div>
    </div>
  );
};

export default PlantillaOperativa;