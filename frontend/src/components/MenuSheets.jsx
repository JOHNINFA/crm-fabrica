// src/components/MenuSheets.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import RegistroForm from "./RegistroForm";

const productosPorDiaYId = {
  LUNES: {
    ID1: [
      { producto: "AREPA TIPO OBLEAS", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA",      cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1200 },
    ],
    ID2: [ /* ... */ ],
    // …
  },
  MARTES: { /* … */ },
  // …
};

const ids = ["ID1","ID2","ID3","ID4","ID5","ID6"];

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
