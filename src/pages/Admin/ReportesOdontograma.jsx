import { useState } from 'react';
import { Link } from 'react-router';
import { Activity, Download, Filter } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useReporteOdontograma } from '@hooks/useClinico';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function exportCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((r) => Object.values(r).join(',')).join('\n');
  const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const pct = (n) => `${(Number(n || 0) * 100).toFixed(1)} %`;

/**
 * Dashboard RF-12: prevalencia de caries y CPO-D agregados multi-paciente.
 * Consume GET /hc/odontograma/reporte/prevalencia (ADR-0026).
 */
export default function ReportesOdontograma() {
  const [filtros, setFiltros] = useState({
    tipo: '',
    alumno: '',
    desde: '',
    hasta: '',
  });
  const [query, setQuery] = useState({});
  const { data, isLoading, isError, error } = useReporteOdontograma(query);

  const handleFiltrar = () =>
    setQuery({
      tipo: filtros.tipo || undefined,
      alumno: filtros.alumno || undefined,
      desde: filtros.desde || undefined,
      hasta: filtros.hasta || undefined,
    });

  const porDiente = data?.porDiente || [];
  const barData = porDiente.length
    ? {
        labels: porDiente.map((d) => d.diente),
        datasets: [
          {
            label: 'Pacientes con caries',
            data: porDiente.map((d) => d.pacientesConCaries),
            backgroundColor: 'rgba(220,38,38,0.7)',
            borderRadius: 6,
          },
        ],
      }
    : null;

  const tarjetas = data
    ? [
        {
          label: 'Pacientes',
          value: data.totalPacientes,
          color: 'text-[var(--color-primary)]',
        },
        {
          label: 'Entradas',
          value: data.totalEntradas,
          color: 'text-blue-600',
        },
        {
          label: 'Prevalencia caries',
          value: pct(data.caries?.prevalencia),
          color: 'text-red-600',
        },
        {
          label: 'CPO-D promedio',
          value: Number(data.cpod?.promedio || 0).toFixed(2),
          color: 'text-amber-600',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <Link
        to="/admin"
        className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block"
      >
        ← Volver al panel
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <Activity size={24} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
          Reporte de Odontograma — Prevalencia de caries (RF-12)
        </h1>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label
            htmlFor="tipo"
            className="text-xs font-semibold text-gray-500 block mb-1"
          >
            Tipo
          </label>
          <select
            id="tipo"
            value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-primary)] outline-none"
          >
            <option value="">Todos</option>
            <option value="INICIAL">Inicial</option>
            <option value="EVOLUCION">Evolución</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="alumno"
            className="text-xs font-semibold text-gray-500 block mb-1"
          >
            Alumno
          </label>
          <input
            id="alumno"
            type="text"
            placeholder="Nombre del alumno"
            value={filtros.alumno}
            onChange={(e) => setFiltros({ ...filtros, alumno: e.target.value })}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-primary)] outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="desde"
            className="text-xs font-semibold text-gray-500 block mb-1"
          >
            Desde
          </label>
          <input
            id="desde"
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-primary)] outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="hasta"
            className="text-xs font-semibold text-gray-500 block mb-1"
          >
            Hasta
          </label>
          <input
            id="hasta"
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
            className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[var(--color-primary)] outline-none"
          />
        </div>
        <button
          onClick={handleFiltrar}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <Filter size={14} /> Filtrar
        </button>
        <button
          onClick={() =>
            exportCSV(porDiente, 'prevalencia_caries_por_diente.csv')
          }
          disabled={!porDiente.length}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold ml-auto"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          Cargando estadísticas...
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-500">
          Error al cargar el reporte: {error?.message}
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {tarjetas.map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center"
              >
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Componentes CPO-D */}
          {data?.cpod?.componentes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">
                Componentes CPO-D (total de dientes)
              </h3>
              <div className="flex gap-6 text-sm">
                <span>
                  <strong className="text-red-600">
                    {data.cpod.componentes.cariado}
                  </strong>{' '}
                  Cariados
                </span>
                <span>
                  <strong className="text-gray-700">
                    {data.cpod.componentes.perdido}
                  </strong>{' '}
                  Perdidos
                </span>
                <span>
                  <strong className="text-blue-600">
                    {data.cpod.componentes.obturado}
                  </strong>{' '}
                  Obturados
                </span>
              </div>
            </div>
          )}

          {barData ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">
                Pacientes con caries por diente (FDI)
              </h3>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No hay registros de caries para los filtros seleccionados.
            </div>
          )}

          {/* Tabla por diente */}
          {porDiente.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">
                  Prevalencia por diente
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                    <th className="px-4 py-2 text-left">Diente (FDI)</th>
                    <th className="px-4 py-2 text-right">
                      Pacientes con caries
                    </th>
                    <th className="px-4 py-2 text-right">Prevalencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {porDiente.map((d) => (
                    <tr key={d.diente}>
                      <td className="px-4 py-2">{d.diente}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {d.pacientesConCaries}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {pct(d.prevalencia)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
