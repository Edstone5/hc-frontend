import { CheckCircle, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useReporteDocente, useEvaluacionesDocente } from '@hooks/useClinico';

ChartJS.register(ArcElement, Tooltip, Legend);

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-PE');
}

const ESTADO_COLOR = {
  pendiente: 'bg-yellow-50 text-yellow-700',
  validado: 'bg-green-50 text-green-700',
  requiere_correccion: 'bg-red-50 text-red-700',
};

export default function DashboardDocente() {
  const { data: resumen, isLoading: cargandoResumen } = useReporteDocente();
  const { data: evaluaciones = [], isLoading: cargandoEvals } =
    useEvaluacionesDocente();

  const doughnutData = resumen
    ? {
        labels: ['Validadas', 'Requieren corrección', 'Pendientes'],
        datasets: [
          {
            data: [
              resumen.validadas,
              resumen.requieren_correccion,
              resumen.pendientes,
            ],
            backgroundColor: ['#16a34a', '#dc2626', '#d97706'],
          },
        ],
      }
    : null;

  return (
    <div className="p-6 min-h-screen bg-[var(--color-background)]">
      <h1 className="text-2xl font-semibold text-[var(--color-primary)] mb-6">
        Dashboard Docente
      </h1>

      {/* Métricas */}
      {cargandoResumen ? (
        <div className="text-gray-400 mb-6">Cargando métricas...</div>
      ) : (
        resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <Clock size={24} className="mx-auto text-amber-500 mb-2" />
              <div className="text-3xl font-bold text-amber-600">
                {resumen.pendientes}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pendientes de revisión
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
              <div className="text-3xl font-bold text-green-600">
                {resumen.validadas}
              </div>
              <div className="text-xs text-gray-500 mt-1">Validadas</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <AlertTriangle size={24} className="mx-auto text-red-500 mb-2" />
              <div className="text-3xl font-bold text-red-600">
                {resumen.requieren_correccion}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Requieren corrección
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
              <TrendingDown
                size={24}
                className="mx-auto text-[var(--color-primary)] mb-2"
              />
              <div className="text-3xl font-bold text-[var(--color-primary)]">
                {resumen.pct_error}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                % con correcciones
              </div>
            </div>
          </div>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        {doughnutData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-700 mb-4">
              Distribución de evaluaciones
            </h3>
            <div className="max-w-[200px] mx-auto">
              <Doughnut data={doughnutData} />
            </div>
          </div>
        )}

        {/* Lista de evaluaciones recientes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-700">
              Evaluaciones recientes
            </h3>
          </div>
          {cargandoEvals ? (
            <div className="p-8 text-center text-gray-400">Cargando...</div>
          ) : evaluaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay evaluaciones registradas.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  {[
                    'Procedimiento',
                    'Alumno',
                    'Puntaje',
                    'Estado',
                    'Fecha',
                  ].map((h) => (
                    <th key={h} className="px-4 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {evaluaciones.slice(0, 15).map((e) => (
                  <tr key={e.id_evaluacion} className="hover:bg-blue-50/10">
                    <td className="px-4 py-2">{e.procedimiento}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {e.alumno || '—'}
                    </td>
                    <td className="px-4 py-2 font-bold">
                      {e.puntaje_total != null ? `${e.puntaje_total}/100` : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[e.estado] || 'bg-gray-100'}`}
                      >
                        {e.estado}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400">
                      {formatDate(e.fecha_evaluacion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
