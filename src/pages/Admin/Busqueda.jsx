import { useState } from 'react';
import { Link } from 'react-router';
import { Search } from 'lucide-react';
import { useBusquedaHC } from '@hooks/useAdmin';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('es-PE');
}

export default function Busqueda() {
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const [submitted, setSubmitted] = useState({ q: '', year: '' });

  const { data, isFetching } = useBusquedaHC(submitted);

  const handleSearch = (e) => {
    e.preventDefault();
    setSubmitted({ q, year });
  };

  const estadoColor = {
    borrador: 'bg-gray-100 text-gray-600',
    activo: 'bg-blue-50 text-blue-700',
    completada: 'bg-green-50 text-green-700',
    migrado: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <Link
        to="/admin"
        className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block"
      >
        ← Volver al panel
      </Link>
      <h1 className="text-2xl font-semibold text-[var(--color-primary)] mb-6">
        Búsqueda de Historias Clínicas
      </h1>

      {/* Formulario de búsqueda */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-6 flex flex-wrap gap-4 items-end"
      >
        <div className="flex-1 min-w-48">
          <label
            htmlFor="search-input"
            className="block text-xs font-semibold text-gray-500 uppercase mb-1"
          >
            ID / Nombre / DNI
          </label>
          <input
            id="search-input"
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-primary)] outline-none"
          />
        </div>
        <div className="w-36">
          <label
            htmlFor="year-select"
            className="block text-xs font-semibold text-gray-500 uppercase mb-1"
          >
            Año
          </label>
          <select
            id="year-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-primary)] outline-none"
          >
            <option value="">Todos</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          <Search size={16} />
          Buscar
        </button>
      </form>

      {/* Resultados */}
      {isFetching ? (
        <div className="text-center py-12 text-gray-400">Buscando...</div>
      ) : data && data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No se encontraron resultados.
        </div>
      ) : data && data.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
            {data.length} resultado{data.length !== 1 ? 's' : ''}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                <th className="px-4 py-3 text-left">N° Historia</th>
                <th className="px-4 py-3 text-left">Paciente</th>
                <th className="px-4 py-3 text-left">DNI</th>
                <th className="px-4 py-3 text-left">Estudiante</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((hc) => (
                <tr key={hc.id_historia} className="hover:bg-blue-50/20">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    HC-{hc.id_historia.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {hc.paciente_nombre} {hc.paciente_apellido}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {hc.paciente_dni || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {hc.estudiante_nombre} {hc.estudiante_apellido}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[hc.estado] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {hc.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(hc.fecha_elaboracion)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/historia/${hc.id_historia}/anamnesis`}
                      className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                    >
                      Ver HC →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
