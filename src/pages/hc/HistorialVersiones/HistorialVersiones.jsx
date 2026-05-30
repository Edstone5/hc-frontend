import { useParams } from 'react-router';
import { Clock, User } from 'lucide-react';
import { useAuditoriaHC } from '@hooks/useClinico';

const METODO_COLOR = {
  POST: 'bg-green-50 text-green-700',
  PUT: 'bg-blue-50 text-blue-700',
  PATCH: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-red-50 text-red-700',
};

const METODO_LABEL = {
  POST: 'Creación',
  PUT: 'Modificación',
  PATCH: 'Actualización',
  DELETE: 'Eliminación',
};

function formatDT(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function HistorialVersiones() {
  const { id } = useParams();
  const { data: registros = [], isLoading } = useAuditoriaHC(id);

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg flex items-center gap-3">
        <Clock size={24} />
        <h2 className="text-2xl font-bold">Historial de versiones</h2>
      </div>

      <div className="p-8">
        {registros.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No hay registros de auditoría para esta historia clínica.
          </p>
        ) : (
          <div className="relative pl-6 border-l-2 border-gray-200 space-y-4">
            {registros.map((r, i) => (
              <div key={r.id_auditoria || i} className="relative">
                <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-[var(--color-primary)] border-2 border-white" />
                <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${METODO_COLOR[r.accion] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {METODO_LABEL[r.accion] || r.accion}
                    </span>
                    <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded px-2 py-0.5">
                      {r.nombre_tabla}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <User size={12} />
                      {r.nombre
                        ? `${r.nombre} ${r.apellido || ''}`.trim()
                        : 'Sistema'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                      <Clock size={12} />
                      {formatDT(r.fecha_cambio)}
                    </div>
                  </div>
                  {r.datos_nuevos &&
                    Object.keys(JSON.parse(r.datos_nuevos || '{}')).length >
                      0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
                          Ver datos modificados
                        </summary>
                        <pre className="mt-2 bg-white border border-gray-200 rounded p-2 overflow-auto text-xs text-gray-700">
                          {JSON.stringify(JSON.parse(r.datos_nuevos), null, 2)}
                        </pre>
                      </details>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
