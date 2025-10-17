import React, { createContext, useContext, useState } from 'react';

const VendedoresContext = createContext();

export const useVendedores = () => {
  const context = useContext(VendedoresContext);
  if (!context) {
    throw new Error('useVendedores debe usarse dentro de VendedoresProvider');
  }
  return context;
};

export const VendedoresProvider = ({ children }) => {
  // Estado para almacenar datos de todos los vendedores
  const [datosVendedores, setDatosVendedores] = useState({
    ID1: [],
    ID2: [],
    ID3: [],
    ID4: [],
    ID5: [],
    ID6: []
  });

  // Estado para almacenar responsables
  const [responsables, setResponsables] = useState({
    ID1: 'RESPONSABLE',
    ID2: 'RESPONSABLE',
    ID3: 'RESPONSABLE',
    ID4: 'RESPONSABLE',
    ID5: 'RESPONSABLE',
    ID6: 'RESPONSABLE'
  });

  // Cargar responsables desde BD al iniciar
  React.useEffect(() => {
    const cargarTodosResponsables = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/vendedores/obtener_responsable/`);
        if (response.ok) {
          const data = await response.json();
          const responsablesMap = {};
          data.forEach(item => {
            responsablesMap[item.id] = item.responsable;
          });
          setResponsables(prev => ({ ...prev, ...responsablesMap }));
          console.log('✅ Responsables cargados desde BD:', responsablesMap);
        }
      } catch (error) {
        console.error('❌ Error cargando responsables:', error);
      }
    };
    cargarTodosResponsables();
  }, []);

  // Actualizar datos de un vendedor específico
  const actualizarDatosVendedor = (idVendedor, productos) => {
    console.log(`\n🔄 ACTUALIZANDO ${idVendedor}:`);
    console.log('Productos recibidos:', productos.filter(p => p.total > 0).map(p => `${p.producto}: ${p.total}`));

    setDatosVendedores(prev => {
      const nuevo = {
        ...prev,
        [idVendedor]: productos
      };
      console.log('Estado actualizado:', Object.keys(nuevo).map(id => `${id}: ${nuevo[id].length} productos`));
      return nuevo;
    });
  };

  // Actualizar responsable de un vendedor
  const actualizarResponsable = async (idVendedor, nuevoResponsable) => {
    try {
      console.log(`\n🔄 ACTUALIZANDO RESPONSABLE ${idVendedor}: ${nuevoResponsable}`);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/vendedores/actualizar_responsable/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_vendedor: idVendedor,
          responsable: nuevoResponsable
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Responsable actualizado en BD:', data);

        // Actualizar estado local
        setResponsables(prev => ({
          ...prev,
          [idVendedor]: nuevoResponsable
        }));

        // Disparar evento para que otros componentes se enteren
        window.dispatchEvent(new CustomEvent('responsableActualizado', {
          detail: { idSheet: idVendedor, nuevoNombre: nuevoResponsable }
        }));

        return { success: true, data };
      } else {
        const error = await response.json();
        console.error('❌ Error actualizando responsable:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return { success: false, error: error.message };
    }
  };

  // Cargar responsable desde la BD
  const cargarResponsable = async (idVendedor) => {
    try {
      console.log(`🔍 Cargando responsable para ${idVendedor} desde BD...`);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/vendedores/obtener_responsable/?id_vendedor=${idVendedor}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.responsable) {
          const responsable = data.responsable;

          console.log(`📥 Responsable cargado para ${idVendedor}: ${responsable}`);

          setResponsables(prev => ({
            ...prev,
            [idVendedor]: responsable
          }));

          return responsable;
        } else {
          console.log(`⚠️ No se encontró responsable para ${idVendedor} en BD`);
        }
      } else {
        console.error(`❌ Error HTTP ${response.status} cargando responsable para ${idVendedor}`);
      }

      return 'RESPONSABLE';
    } catch (error) {
      console.error(`❌ Error cargando responsable para ${idVendedor}:`, error);
      return 'RESPONSABLE';
    }
  };

  // Calcular total de productos para Producción
  const calcularTotalProductos = (nombreProducto) => {
    let total = 0;
    let debug = `\n=== ${nombreProducto} ===\n`;

    Object.entries(datosVendedores).forEach(([idVendedor, vendedor]) => {
      const producto = vendedor.find(p => p.producto === nombreProducto);
      if (producto && producto.total > 0) {
        debug += `${idVendedor}: ${producto.total}\n`;
        total += producto.total || 0;
      }
    });

    debug += `TOTAL: ${total}\n=================`;

    // Mostrar en la página si hay datos
    if (total > 0) {
      const debugElement = document.getElementById('debug-produccion');
      if (debugElement) {
        debugElement.innerHTML = debug.replace(/\n/g, '<br>');
      }
    }

    return total;
  };

  const value = {
    datosVendedores,
    responsables,
    actualizarDatosVendedor,
    actualizarResponsable,
    cargarResponsable,
    calcularTotalProductos
  };

  return (
    <VendedoresContext.Provider value={value}>
      {children}
    </VendedoresContext.Provider>
  );
};