import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.veesoft.vivero',
  appName: 'Veesoft',
  webDir: 'dist',
  server: {
    // Permite tráfico http:// (sin TLS) hacia el backend durante desarrollo en LAN.
    // Para producción, el backend debe servir por HTTPS y esto puede quitarse.
    cleartext: true,
    // androidScheme por defecto es 'https' — eso hace que la app misma se sirva
    // desde https://localhost, y el navegador bloquea como "Mixed Content"
    // cualquier XHR/fetch a un backend http:// (aunque cleartext esté permitido
    // a nivel Android). Con el backend en HTTP durante desarrollo, la app debe
    // servirse también por http:// para que coincidan los esquemas.
    androidScheme: 'http',
  },
  // CapacitorHttp (bridge nativo) quedó DESACTIVADO a propósito — enrutaba las
  // peticiones por HTTP nativo (Android), que no manda Origin/Referer. Sanctum
  // (EnsureFrontendRequestsAreStateful) exige uno de esos dos headers para
  // adjuntar sesión a la petición; sin ellos el login truena con 500
  // ("Session store not set on request"). El WebView normal sí manda Origin,
  // así que las peticiones vuelven a pasar por fetch/XHR del WebView.
  // plugins: {
  //   CapacitorHttp: { enabled: true },
  // },
};

export default config;
