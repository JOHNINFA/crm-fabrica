import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProductProvider } from "../../context/ProductContext";
import { VendedoresProvider, useVendedores } from "../../context/VendedoresContext";
import { responsableStorage } from "../../utils/responsableStorage";
import PlantillaOperativa from "./PlantillaOperativa";
import Produccion from "./Produccion";

const productosPorDiaYId = {
  LUNES: {
    ID1: [
      { producto: "AREPA TIPO OBLEAS", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA TIPO PINCHO", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON QUESO-CORRIENTE", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON QUESO-ESPECIAL GRANDE", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON QUESO-ESPECIAL PEQUEÑA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON QUESO MINI X 10", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON QUESO CUADRADA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA DE CHOCLO-CORRIENTE", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA DE CHOCLO CON QUESO GRANDE", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA DE CHOCLO CON QUESO PEQUEÑA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA BOYACENSE X5", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA BOYACENSE X10", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA SANTADERANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "ALMOJABANAS X5", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "ALMOJABANAS X10", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON SEMILLA DE QUINUA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON SEMILLA DE CHIA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON SEMILLA DE AJONJOLI", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON SEMILLA DE LINAZA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON SEMILLA DE GIRASOL", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CHORICERA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA LONCHERIA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA CON MARGARINA Y SAL", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "YUCAREPA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA TIPO ASADERO X 10", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA PARA RELLENAR # 1", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA PARA RELLENAR #2", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA PARA RELLENAR #3", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "PORCION DE AREPAS X 2 UND", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "PORCION DE AREPAS X 3 UND", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "PORCION DE AREPAS X 4 UND", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "PORCION DE AREPAS X 5 UND", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA SUPER OBLEA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "BLOQUE DE MASA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "LIBRAS DE MASA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "MUTE BOYACENSE", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "LIBRA DE MAIZ PETO", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "ENVUELTO DE MAIZ X 5 UND", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 }
    ],
    ID2: []
  },
  MARTES: {
    ID1: [
      { producto: "AREPA TIPO OBLEAS", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 }
    ],
    ID2: []
  },
  MIERCOLES: {
    ID1: [
      { producto: "AREPA TIPO OBLEAS", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 }
    ],
    ID2: []
  },
  JUEVES: {
    ID1: [
      { producto: "AREPA TIPO OBLEAS", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 }
    ],
    ID2: []
  },
  VIERNES: {
    ID1: [
      { producto: "AREPA TIPO OBLEAS", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 }
    ],
    ID2: []
  },
  SABADO: {
    ID1: [
      { producto: "AREPA TIPO OBLEAS", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 }
    ],
    ID2: []
  }
};

const ids = ["ID1", "ID2", "ID3", "ID4", "ID5", "ID6", "PRODUCCION"];

export default function MenuSheets() {
  // Capturamos el parámetro :dia de la URL
  const { dia } = useParams();

  // Estado solo para el ID de hoja
  const [idSeleccionado, setIdSeleccionado] = useState("ID1");
  const [showModal, setShowModal] = useState(false);
  const [tempNombre, setTempNombre] = useState("");
  // Función para calcular la fecha según el día de la semana
  const calcularFechaPorDia = (diaSeleccionado) => {
    const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const hoy = new Date();
    const diaActual = hoy.getDay();
    const indiceDiaSeleccionado = diasSemana.indexOf(diaSeleccionado);

    let diferenciaDias = indiceDiaSeleccionado - diaActual;

    if (diferenciaDias < 0) {
      diferenciaDias += 7;
    }

    const fechaCalculada = new Date(hoy);
    fechaCalculada.setDate(hoy.getDate() + diferenciaDias);

    // Usar fecha local en lugar de ISO para evitar problemas de zona horaria
    const year = fechaCalculada.getFullYear();
    const month = String(fechaCalculada.getMonth() + 1).padStart(2, '0');
    const day = String(fechaCalculada.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    calcularFechaPorDia(dia)
  );

  // Actualizar fecha cuando cambie el día
  useEffect(() => {
    const nuevaFecha = calcularFechaPorDia(dia);
    console.log(`📅 FECHA CALCULADA para ${dia}: ${nuevaFecha}`);
    setFechaSeleccionada(nuevaFecha);
  }, [dia]);

  // Estado independiente para cada ID
  const [datosIds, setDatosIds] = useState({
    ID1: { nombreResponsable: "", datosTabla: {} },
    ID2: { nombreResponsable: "", datosTabla: {} },
    ID3: { nombreResponsable: "", datosTabla: {} },
    ID4: { nombreResponsable: "", datosTabla: {} },
    ID5: { nombreResponsable: "", datosTabla: {} },
    ID6: { nombreResponsable: "", datosTabla: {} },
    PRODUCCION: { nombreResponsable: "", datosTabla: {} }
  });



  const id_usuario = 1; // mock de autenticación

  // Al cambiar dia en la URL, reiniciamos todos los datos y cargamos responsables
  useEffect(() => {
    const cargarResponsables = async () => {
      // Cargar responsables desde localStorage primero para evitar rebote
      const responsablesGuardados = localStorage.getItem('responsables_cargue');
      let responsablesIniciales = {};

      if (responsablesGuardados) {
        try {
          responsablesIniciales = JSON.parse(responsablesGuardados);
          console.log('📦 Responsables cargados desde localStorage:', responsablesIniciales);
        } catch (error) {
          console.error('❌ Error parsing responsables localStorage:', error);
        }
      }

      const nuevosIds = {
        ID1: { nombreResponsable: responsablesIniciales.ID1 || "RESPONSABLE", datosTabla: {} },
        ID2: { nombreResponsable: responsablesIniciales.ID2 || "RESPONSABLE", datosTabla: {} },
        ID3: { nombreResponsable: responsablesIniciales.ID3 || "RESPONSABLE", datosTabla: {} },
        ID4: { nombreResponsable: responsablesIniciales.ID4 || "RESPONSABLE", datosTabla: {} },
        ID5: { nombreResponsable: responsablesIniciales.ID5 || "RESPONSABLE", datosTabla: {} },
        ID6: { nombreResponsable: responsablesIniciales.ID6 || "RESPONSABLE", datosTabla: {} },
        PRODUCCION: { nombreResponsable: "", datosTabla: {} }
      };

      // Establecer estado inicial inmediatamente (sin rebote)
      setDatosIds(nuevosIds);

      // Cargar responsables desde la BD para cada ID
      for (const idVendedor of ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6']) {
        try {
          console.log(`🔍 Cargando responsable para ${idVendedor}...`);
          const response = await fetch(`http://localhost:8000/api/vendedores/?id_vendedor=${idVendedor}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`📡 Respuesta API para ${idVendedor}:`, data);

            // La API devuelve un array directo, no un objeto con results
            if (Array.isArray(data) && data.length > 0) {
              const vendedor = data[0];
              const responsable = vendedor.responsable || 'RESPONSABLE';

              nuevosIds[idVendedor].nombreResponsable = responsable;
              console.log(`📥 Responsable asignado para ${idVendedor}: "${responsable}"`);
            } else {
              nuevosIds[idVendedor].nombreResponsable = 'RESPONSABLE';
              console.log(`⚠️ No se encontró vendedor para ${idVendedor}, usando RESPONSABLE`);
            }
          } else {
            nuevosIds[idVendedor].nombreResponsable = 'RESPONSABLE';
            console.log(`❌ Error HTTP para ${idVendedor}:`, response.status);
          }
        } catch (error) {
          console.error(`❌ Error cargando responsable para ${idVendedor}:`, error);
          nuevosIds[idVendedor].nombreResponsable = 'RESPONSABLE';
        }
      }

      console.log('🎯 Estado final de nuevosIds:', nuevosIds);

      setDatosIds(nuevosIds);

      // Guardar responsables en localStorage para evitar rebote
      localStorage.setItem('responsables_cargue', JSON.stringify({
        ID1: nuevosIds.ID1.nombreResponsable,
        ID2: nuevosIds.ID2.nombreResponsable,
        ID3: nuevosIds.ID3.nombreResponsable,
        ID4: nuevosIds.ID4.nombreResponsable,
        ID5: nuevosIds.ID5.nombreResponsable,
        ID6: nuevosIds.ID6.nombreResponsable
      }));
    };

    cargarResponsables();
  }, [dia]);

  const abrirModal = () => {
    setTempNombre(datosIds[idSeleccionado].nombreResponsable);
    setShowModal(true);
  };

  const guardarNombre = async () => {
    try {
      console.log(`🔄 Guardando responsable: ${idSeleccionado} -> ${tempNombre}`);

      // Llamada directa a la API
      const response = await fetch('http://localhost:8000/api/vendedores/actualizar_responsable/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_vendedor: idSeleccionado,
          responsable: tempNombre
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Responsable actualizado en BD:', data);

        // Actualizar estado local solo si la BD se actualizó correctamente
        setDatosIds(prev => ({
          ...prev,
          [idSeleccionado]: {
            ...prev[idSeleccionado],
            nombreResponsable: tempNombre
          }
        }));

        // 🚀 Actualizar localStorage usando utilidad (incluye evento automático)
        responsableStorage.set(idSeleccionado, tempNombre);

        console.log('✅ Responsable guardado exitosamente en BD y localStorage');
      } else {
        const error = await response.json();
        console.error('❌ Error actualizando responsable:', error);
        alert('Error guardando el responsable. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      alert('Error de conexión. Inténtalo de nuevo.');
    }

    setShowModal(false);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setTempNombre("");
  };



  // Plantilla inicial según día e ID
  const registrosIniciales = productosPorDiaYId[dia]?.[idSeleccionado] || [];

  return (
    <VendedoresProvider>
      <div className="container-fluid" style={{ paddingBottom: '60px' }}>
        {/* Header compacto */}
        <div className="d-flex justify-content-between align-items-center py-2 ">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{
                fontSize: '0.9rem',
                padding: '0.4rem 0.8rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                pointerEvents: 'none',
                backgroundColor: '#06386d',
                borderColor: '#06386d'
              }}
            >
              {dia}
            </button>

            <input
              type="date"
              className="form-control form-control-sm"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              style={{
                width: '150px',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              style={{ minWidth: '40px', minHeight: '40px' }}
              onClick={async () => {
                // Sincronizar todos los IDs
                let totalSincronizados = 0;
                const idsVendedores = ['ID1', 'ID2', 'ID3', 'ID4', 'ID5', 'ID6'];

                for (const id of idsVendedores) {
                  const fechaAUsar = fechaSeleccionada || new Date().toISOString().split('T')[0];
                  const key = `cargue_${dia}_${id}_${fechaAUsar}`;
                  const datosString = localStorage.getItem(key);

                  if (datosString) {
                    try {
                      const datos = JSON.parse(datosString);

                      if (!datos.sincronizado) {
                        // Enviar al backend (simular por ahora)
                        console.log(`🚀 Sincronizando ${id}:`, datos.productos.filter(p => p.cantidad > 0 || p.vendedor || p.despachador));

                        // Marcar como sincronizado
                        datos.sincronizado = true;
                        localStorage.setItem(key, JSON.stringify(datos));

                        totalSincronizados++;
                      }
                    } catch (error) {
                      console.error(`Error sincronizando ${id}:`, error);
                    }
                  }
                }

                // Mostrar resultado
                alert('✅ Sincronizando todos los IDs');

                // Animación visual
                const btn = document.querySelector('.material-icons');
                if (btn) {
                  btn.style.animation = 'spin 0.5s linear';
                  setTimeout(() => btn.style.animation = '', 500);
                }
              }}
              title="Sincronizar todos los datos"
            >
              <span className="material-icons">sync</span>
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => window.history.back()}
            >
              Regresar
            </button>
          </div>
        </div>

        {/* Plantilla Operativa o Producción */}
        <div className="mt-3">
          {idSeleccionado === "PRODUCCION" ? (
            <ProductProvider>
              <Produccion
                dia={dia}
                fechaSeleccionada={fechaSeleccionada}
              />
            </ProductProvider>
          ) : (
            <ProductProvider>
              <PlantillaOperativa
                responsable={(() => {
                  const responsable = datosIds[idSeleccionado].nombreResponsable || "RESPONSABLE";
                  console.log(`🎯 Pasando responsable a PlantillaOperativa para ${idSeleccionado}: "${responsable}"`);
                  return responsable;
                })()}
                dia={dia}
                idSheet={idSeleccionado}
                idUsuario={id_usuario}
                onEditarNombre={abrirModal}
                fechaSeleccionada={fechaSeleccionada}
                key={`${idSeleccionado}_${fechaSeleccionada}`}
              />
            </ProductProvider>
          )}
        </div>


        {/* Barra fija inferior con IDs */}
        <div className="fixed-bottom bg-white border-top shadow-sm">
          <div className="container-fluid">
            <div className="d-flex align-items-center py-2">
              <span className="text-muted small me-3">Vendedores:</span>
              <div className="d-flex">
                {ids.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIdSeleccionado(i)}
                    className={`btn btn-sm me-1 ${i === idSeleccionado
                      ? 'btn-primary'
                      : 'btn-outline-secondary'
                      }`}
                    style={{
                      minWidth: '50px',
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.5rem',
                      ...(i === idSeleccionado && {
                        backgroundColor: '#06386d',
                        borderColor: '#06386d'
                      })
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal para editar nombre */}
        {showModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">Editar Nombre</h6>
                  <button type="button" className="btn-close" onClick={cerrarModal}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control"
                    value={tempNombre}
                    onChange={(e) => setTempNombre(e.target.value)}
                    placeholder="Ingrese el nombre"
                    autoFocus
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={guardarNombre}
                    style={{
                      backgroundColor: '#06386d',
                      borderColor: '#06386d'
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendedoresProvider>
  );
}