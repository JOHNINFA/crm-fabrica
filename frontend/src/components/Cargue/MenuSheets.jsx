import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import RegistroForm from "./RegistroForm";

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

const ids = ["ID1", "ID2", "ID3", "ID4", "ID5", "ID6"];

export default function MenuSheets() {
  // Capturamos el parámetro :dia de la URL
  const { dia } = useParams();

  // Estado solo para el ID de hoja
  const [idSeleccionado, setIdSeleccionado] = useState("ID1");
  const [nombreResponsable, setNombreResponsable] = useState("");
  const id_usuario = 1; // mock de autenticación

  // Al cambiar dia en la URL, reiniciamos el responsable
  useEffect(() => {
    setNombreResponsable("");
  }, [dia]);

  // Plantilla inicial según día e ID
  const registrosIniciales = productosPorDiaYId[dia]?.[idSeleccionado] || [];

  return (
    <div style={{ padding: 24 }}>
      {/* Título con el día y la hoja */}
      <h2>{dia} – {idSeleccionado}</h2>

      {/* Selector de IDs */}
      <div style={{ marginBottom: 24 }}>
        {ids.map((i) => (
          <button
            key={i}
            onClick={() => setIdSeleccionado(i)}
            className={i === idSeleccionado ? "active" : ""}
            style={{ marginRight: 8 }}
          >
            {i}
          </button>
        ))}
      </div>

      {/* Nombre del responsable */}
      <div style={{ marginBottom: 24 }}>
        <label>
          Nombre responsable:
          <input
            type="text"
            value={nombreResponsable}
            onChange={e => setNombreResponsable(e.target.value)}
            placeholder="Escribe un nombre…"
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      {/* Tabla de registros */}
      <RegistroForm
        registrosIniciales={registrosIniciales}
        dia={dia}
        id_sheet={idSeleccionado}
        id_usuario={id_usuario}
      />
    </div>
  );
}