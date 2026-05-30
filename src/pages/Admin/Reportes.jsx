import { useState } from 'react';
import { Link } from 'react-router';
import { BarChart2, Download, Filter } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useReporteAdmin, useReporteAnonimo } from '@hooks/useClinico';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
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

export default function Reportes() {
  const [filtros, setFiltros] = useState({ desde: '', hasta: '' });
  const [query, setQuery] = useState({});
  const { data, isLoading } = useReporteAdmin(query);
  const anonimo = useReporteAnonimo(query);

  const handleFiltrar = () => setQuery({ ...filtros });

  const barData = data?.porMes
    ? {
        labels: data.porMes.map((m) => m.mes).reverse(),
        datasets: [
          {
            label: 'HCs creadas',
            data: data.porMes.map((m) => parseInt(m.cantidad)).reverse(),
            backgroundColor: 'rgba(27,58,94,0.7)',
            borderRadius: 6,
          },
        ],
      }
    : null;

  const doughnutData = data?.porEstado
    ? {
        labels: data.porEstado.map((e) => e.estado),
        datasets: [
          {
            data: data.porEstado.map((e) => parseInt(e.cantidad)),
            backgroundColor: [
              '#1B3A5E',
              '#2A5298',
              '#5B8BD6',
              '#A0BEE8',
              '#D0E4F8',
            ],
          },
        ],
      }
    : null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <Link
        to="/admin"
        className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block"
      >
        ← Volver al panel
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={24} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
          Reportes y Estadísticas
        </h1>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
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
            anonimo
              .refetch()
              .then((r) => exportCSV(r.data, 'reporte_anonimo.csv'))
          }
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold ml-auto"
        >
          <Download size={14} /> Exportar CSV anónimo
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          Cargando estadísticas...
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          {data?.totales && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: 'Total HCs',
                  value: data.totales.total_hc,
                  color: 'text-[var(--color-primary)]',
                },
                {
                  label: 'Pacientes',
                  value: data.totales.total_pacientes,
                  color: 'text-green-600',
                },
                {
                  label: 'Estudiantes',
                  value: data.totales.total_estudiantes,
                  color: 'text-blue-600',
                },
                {
                  label: 'Pendientes revisión',
                  value: data.pendientesRevision,
                  color: 'text-amber-600',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center"
                >
                  <div className={`text-3xl font-bold ${color}`}>
                    {value || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {barData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-700 mb-4">
                  HCs por mes (últimos 12)
                </h3>
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            )}
            {doughnutData && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-700 mb-4">
                  HCs por estado
                </h3>
                <div className="max-w-xs mx-auto">
                  <Doughnut
                    data={doughnutData}
                    options={{ responsive: true }}
                  />
                </div>
              </div>
            )}
          </div>

          {data?.porEstado && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
              <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">
                  Detalle por estado
                </h3>
                <button
                  onClick={() =>
                    exportCSV(data.porEstado, 'reporte_por_estado.csv')
                  }
                  className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  <Download size={12} /> CSV
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                    <th className="px-4 py-2 text-left">Estado</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.porEstado.map((e) => (
                    <tr key={e.estado}>
                      <td className="px-4 py-2 capitalize">{e.estado}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {e.cantidad}
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
