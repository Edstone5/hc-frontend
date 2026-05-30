import { useState } from 'react';
import { Link } from 'react-router';
import { createUser } from '../../services/fetchCreateUser';

export default function CreateStudent() {
  const [form, setForm] = useState({
    userCode: '',
    firstName: '',
    lastName: '',
    dni: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await createUser({ ...form, role: 'estudiante' });
      setSuccess('Estudiante creado correctamente');
      setForm({
        userCode: '',
        firstName: '',
        lastName: '',
        dni: '',
        email: '',
        password: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // ------------------------------------------------

  return (
    // 'min-h-screen' asegura que el fondo cubra el 100% de la ventana visual
    <div className="min-h-screen bg-[var(--color-background)] p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl animate-[fadeIn_0.5s_ease-out]">
        {/* Cabecera con Botón Volver integrado */}
        <div className="mb-6 flex items-center justify-between">
          {/* NOTA: He cambiado la ruta a '/admin/dashboard'. 
              Si tu dashboard está en otra ruta (ej: '/dashboard'), ajusta este valor.
           */}
          <Link
            to="/dashboard"
            className="flex items-center text-gray-500 hover:text-[var(--color-primary)] transition-colors font-semibold group"
          >
            <div className="bg-white p-2 rounded-full shadow-sm mr-2 group-hover:shadow-md transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </div>
            Volver al panel
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 relative overflow-hidden"
        >
          {/* Decoración superior sutil */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--color-primary)] opacity-80"></div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] mb-2">
              Registrar Estudiante
            </h2>
            <p className="text-gray-500">
              Ingresa los datos para registrar un nuevo alumno
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-1 block">
                Código de usuario
              </span>
              <input
                name="userCode"
                value={form.userCode}
                onChange={handleChange}
                placeholder="Ej: 20231234"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] focus:ring-opacity-20 transition-all outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-1 block">
                DNI
              </span>
              <input
                name="dni"
                value={form.dni}
                onChange={handleChange}
                placeholder="Número de DNI"
                required
                maxLength={8}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] focus:ring-opacity-20 transition-all outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-1 block">
                Nombres
              </span>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Nombres del estudiante"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] focus:ring-opacity-20 transition-all outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-1 block">
                Apellidos
              </span>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Apellidos del estudiante"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] focus:ring-opacity-20 transition-all outline-none"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-gray-700 mb-1 block">
                Correo electrónico
              </span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] focus:ring-opacity-20 transition-all outline-none"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-gray-700 mb-1 block">
                Contraseña
              </span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Contraseña segura"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] focus:ring-opacity-20 transition-all outline-none"
              />
            </label>
          </div>

          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-center gap-2 text-sm animate-[fadeIn_0.3s]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.401 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mt-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-center gap-2 text-sm animate-[fadeIn_0.3s]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{success}</span>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`
                px-8 py-3 rounded-lg font-semibold text-white shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center min-w-[160px]
                ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-95'
                }
              `}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                'Registrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
