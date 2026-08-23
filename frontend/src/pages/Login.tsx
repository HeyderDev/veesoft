import { useState } from 'react';
import { Leaf, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../shared/context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#e2e8f0_1px,_transparent_0)] [background-size:24px_24px] opacity-60" />
      </div>

      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-emerald flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-4">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Vivero ULEAM</h1>
          <p className="text-sm text-slate-500 mt-1">Sistema de Gestión de Producción</p>
        </div>

        {/* Card de login */}
        <div className="card p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Iniciar sesión</h2>
            <p className="section-subtitle">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {error && (
            <div className="mb-5 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="usuario@uleam.edu.ec"
                  className="input-field pl-9"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pl-9 pr-9"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botón */}
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Vivero ULEAM — El Carmen. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
