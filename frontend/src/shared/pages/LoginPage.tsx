import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password, remember });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No fue posible iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-600/20">
            EL
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ERP Lastenia</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa con tu cuenta del Vivero de Cacao ULEAM.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              className="input-field"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@uleam.edu.ec"
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              className="input-field"
              id="password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              checked={remember}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            Mantener la sesión iniciada
          </label>

          {error && (
            <div
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button className="w-full" isLoading={isSubmitting} type="submit">
            Iniciar sesión
          </Button>
        </form>
      </section>
    </main>
  );
};
