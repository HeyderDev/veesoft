<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'api/v1/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://172.17.131.72:5173',
        'http://192.168.1.7:5173',
        'http://192.168.1.8:5173',
        // App móvil empaquetada con Capacitor: el WebView sirve el bundle desde
        // este origen fijo. androidScheme quedó en 'http' (no el 'https' por
        // defecto) para que coincida con el esquema de este backend de
        // desarrollo — si no, el navegador bloquea la API como "Mixed Content".
        // Se dejan ambos por si el esquema vuelve a 'https' en el futuro.
        'http://localhost',
        'https://localhost',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-XSRF-TOKEN', 'Accept', 'X-Vivero-Id'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => true,

];
