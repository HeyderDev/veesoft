import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LoginPage } from './pages/Login.tsx'

// TEMPORAL: ruta /login solo para captura de pantalla (ver sesión de chat).
// Eliminar este wrapper de rutas junto con src/pages/Login.tsx cuando ya no se necesite.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
