// Ruta raíz "/": nunca se queda renderizada — el guard de autenticación en
// app/_layout.tsx redirige desde aquí hacia /login o el home del rol en
// cuanto se conoce el estado de la sesión.
export default function IndexRoute() {
  return null;
}
