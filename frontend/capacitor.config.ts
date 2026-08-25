import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.veesoft.vivero',
  appName: 'Veesoft',
  webDir: 'dist',
  server: {
    // Permite tráfico http:// (sin TLS) hacia el backend durante desarrollo en LAN.
    // Para producción, el backend debe servir por HTTPS y esto puede quitarse.
    cleartext: true,
  },
  plugins: {
    // El WebView nativo no comparte el manejo de cookies de un navegador real —
    // la sesión de Sanctum (cookie CSRF + sesión) puede no persistir entre
    // requests sin este bridge. CapacitorHttp enruta fetch/XHR (y por lo tanto
    // axios) a través de HTTP nativo, que sí retiene cookies de forma confiable.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
