import { useState } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import {
  useFichasOperacion,
  useFichaEvaluacion,
  useEvaluarFicha,
} from '@hooks/useClinico';
import { useCurrentUser } from '@hooks/useAuth';
import Button from '@ui/Button';

const ESTADOS = [
  {
    value: 'pendiente',
    label: 'Pendiente',
    color: 'bg-yellow-50 text-yellow-700',
  },
  { value: 'validado', label: 'Validado', color: 'bg-green-50 text-green-700' },
  {
    value: 'requiere_correccion',
    label: 'Requiere corrección',
    color: 'bg-red-50 text-red-700',
  },
];

function EvaluacionFicha({ idHistory, ficha, puedeEvaluar }) {
  const { data: ev } = useFichaEvaluacion(idHistory, ficha.id_ficha);
  const { mutate: evaluar, isPending } = useEvaluarFicha();
  const [form, setForm] = useState({
    puntajeTotal: '',
    comentarios: '',
    estado: 'validado',
  });
  const [editando, setEditando] = useState(false);

  const handleSubmit = () => {
    evaluar(
      { idHistory, idFicha: ficha.id_ficha, data: form },
      {
        onSuccess: () => {
          toast.success('Evaluación guardada');
          setEditando(false);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const estadoInfo = ESTADOS.find((e) => e.value === ev?.estado);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-medium">{ficha.procedimiento}</div>
          <div className="text-xs text-gray-400">
            Alumno: {ficha.alumno || '—'}
          </div>
        </div>
        {ev?.estado ? (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoInfo?.color || 'bg-gray-100 text-gray-600'}`}
          >
            {estadoInfo?.label || ev.estado}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            Sin evaluar
          </span>
        )}
      </div>

      {ev && !editando && (
        <div className="bg-gray-50 rounded p-3 mb-3 text-sm">
          {ev.puntaje_total && (
            <div className="flex items-center gap-1 mb-1">
              <Star size={14} className="text-amber-500" />
              <span className="font-bold">{ev.puntaje_total}/100</span>
            </div>
          )}
          {ev.comentarios && (
            <div className="text-gray-600">{ev.comentarios}</div>
          )}
        </div>
      )}

      {editando ? (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="estado-select"
              className="text-xs font-semibold text-gray-500 block mb-1"
            >
              Estado *
            </label>
            <select
              id="estado-select"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="puntaje-input"
              className="text-xs font-semibold text-gray-500 block mb-1"
            >
              Puntaje (0-100)
            </label>
            <input
              id="puntaje-input"
              type="number"
              min="0"
              max="100"
              value={form.puntajeTotal}
              onChange={(e) =>
                setForm({ ...form, puntajeTotal: e.target.value })
              }
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="comentarios-eval"
              className="text-xs font-semibold text-gray-500 block mb-1"
            >
              Comentarios
            </label>
            <textarea
              id="comentarios-eval"
              value={form.comentarios}
              onChange={(e) =>
                setForm({ ...form, comentarios: e.target.value })
              }
              rows={3}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 resize-none focus:border-[var(--color-primary)] outline-none text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar evaluación'}
            </Button>
          </div>
        </div>
      ) : puedeEvaluar ? (
        <button
          onClick={() => {
            setEditando(true);
            setForm({
              puntajeTotal: ev?.puntaje_total || '',
              comentarios: ev?.comentarios || '',
              estado: ev?.estado || 'validado',
            });
          }}
          className="text-sm text-[var(--color-primary)] hover:underline font-medium"
        >
          {ev ? 'Editar evaluación' : 'Evaluar ficha'}
        </button>
      ) : (
        !ev && (
          <span className="text-sm text-gray-400">Pendiente de evaluación</span>
        )
      )}
    </div>
  );
}

export default function FichaEvaluacion() {
  const { id } = useParams();
  const { data: user } = useCurrentUser();
  const { data: fichas = [], isLoading } = useFichasOperacion(id);
  const esDocente = user?.role === 'docente' || user?.role === 'admin';

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg">
        <h2 className="text-2xl font-bold">Fichas de Evaluación</h2>
        <p className="text-sm opacity-80 mt-1">
          {esDocente
            ? 'Como docente puedes evaluar las fichas del estudiante'
            : 'Aquí ves el estado y retroalimentación de tus fichas'}
        </p>
      </div>
      <div className="p-8 space-y-4">
        {fichas.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No hay fichas de operación para evaluar.
          </p>
        ) : (
          fichas.map((f) => (
            <EvaluacionFicha
              key={f.id_ficha}
              idHistory={id}
              ficha={f}
              puedeEvaluar={esDocente}
            />
          ))
        )}
      </div>
    </div>
  );
}
