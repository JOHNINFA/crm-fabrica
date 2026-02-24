export const obtenerNombreUsuarioInventario = (usuarioSesion = null) => {
  const candidatosSesion = [
    usuarioSesion?.nombre,
    usuarioSesion?.username,
    usuarioSesion?.usuario,
    usuarioSesion?.codigo,
  ];

  const nombreSesion = candidatosSesion.find((valor) => String(valor || "").trim().length > 0);
  if (nombreSesion) return String(nombreSesion).trim().toUpperCase();

  try {
    const crudo = localStorage.getItem("crm_usuario");
    if (!crudo) return "Usuario Predeterminado";
    const usuarioLocal = JSON.parse(crudo);
    const candidatosLocal = [
      usuarioLocal?.nombre,
      usuarioLocal?.username,
      usuarioLocal?.usuario,
      usuarioLocal?.codigo,
    ];
    const nombreLocal = candidatosLocal.find((valor) => String(valor || "").trim().length > 0);
    return nombreLocal ? String(nombreLocal).trim().toUpperCase() : "Usuario Predeterminado";
  } catch (error) {
    return "Usuario Predeterminado";
  }
};
