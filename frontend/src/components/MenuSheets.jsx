import React, { useState } from "react";
import RegistroForm from "./RegistroForm";

const productosPorDiaYId = {
  LUNES: {
    ID1: [
      { producto: "AREPA TIPO OBLEAS", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1200 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1200 },
    ],
    ID2: [
      { producto: "AREPA TIPO OBLEA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1600 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1200 },
      { producto: "AREPA MEDIANA", cantidad: 0, descuentos: 0, adicional: 0, devoluciones: 0, vencidas: 0, valor: 1200 },
    ],
    // Otros IDs...
  },
  // Otros días...
};

function MenuSheets() {
  const [diaSeleccionado, setDiaSeleccionado] = useState("LUNES");
  const [idSeleccionado, setIdSeleccionado] = useState("ID1");
  const [nombreResponsable, setNombreResponsable] = useState(""); // ← Nuevo campo

  const productos = productosPorDiaYId[diaSeleccionado]?.[idSeleccionado] || [];

  const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
  const ids = ["ID1", "ID2", "ID3", "ID4", "ID5", "ID6"];

  return (
    <div>
      {/* Selector de Días */}
      <nav style={{ marginBottom: "0.5rem" }}>
  {dias.map((dia) => (
    <button
      key={dia}
      onClick={() => {
        setDiaSeleccionado(dia);
        setNombreResponsable("");
      }}
      className={`dia-button ${diaSeleccionado === dia ? "active" : ""}`}
    >
      {dia}
    </button>
  ))}
</nav>

      {/* Selector de IDs */}
      <div style={{ marginBottom: "1rem" }}>
  {ids.map((id) => (
    <button
      key={id}
      onClick={() => setIdSeleccionado(id)}
      className={`id-button ${idSeleccionado === id ? "active" : ""}`}
    >
      {id}
    </button>
  ))}
</div>


      {/* Nombre editable */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>{diaSeleccionado} - {idSeleccionado}</strong>
        <br />
        <label>Nombre: </label>
        <input
          type="text"
          value={nombreResponsable}
          onChange={(e) => setNombreResponsable(e.target.value)}
          placeholder="Nombre del responsable"
          style={{ marginLeft: "0.5rem" }}
        />
      </div>

      {/* Formulario de productos */}
      <RegistroForm registrosIniciales={productos} />
    </div>
  );
}

export default MenuSheets;
