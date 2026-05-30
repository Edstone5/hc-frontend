import { useState } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import {
  useFichasOperacion,
  useAddFichaOperacion,
  useUpdateFichaOperacion,
  useDeleteFichaOperacion,
} from '@hooks/useClinico';
import { useForm } from '@stores/useForm';
import Button from '@ui/Button';

const emptyForm = {
  diagnostico: '',
  procedimiento: '',
  materiales: '',
  observaciones: '',
  estado: 'borrador',
  alumno: '',
};

const ESTADO_BADGE = {
  borrador: 'bg-gray-100 text-gray-600',
  finalizado: 'bg-green-50 text-green-700',
};

function formatDate(v) {
  return v ? new Date(v).toLocaleDateString('es-PE') : '—';
}

export default function FichaOperacion() {
  const { id } = useParams();
  const { isFormMode, setFormMode, setViewMode } = useForm();
  const { data: fichas = [], isLoading } = useFichasOperacion(id);
  const { mutate: agregar, isPending: agregando } = useAddFichaOperacion();
  const { mutate: actualizar } = useUpdateFichaOperacion();
  const { mutate: eliminar } = useDeleteFichaOperacion();

  const [form, setForm] = useState(emptyForm);
  const [editandoId, setEditandoId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const handleSubmit = () => {
    if (!form.procedimiento.trim())
      return toast.error('Procedimiento requerido');
    if (editandoId) {
      actualizar(
        { idHistory: id, idFicha: editandoId, data: form },
        {
          onSuccess: () => {
            toast.success('Ficha actualizada');
            setEditandoId(null);
            setForm(emptyForm);
            setViewMode();
          },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      agregar(
        { idHistory: id, data: form },
        {
          onSuccess: () => {
            toast.success('Ficha registrada');
            setForm(emptyForm);
            setViewMode();
          },
          onError: (e) => toast.error(e.message),
        }
      );
    }
  };

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClipboardList size={24} />
          <h2 className="text-2xl font-bold">Fichas de Operación</h2>
        </div>
        {!isFormMode && (
          <button
            onClick={() => {
              setEditandoId(null);
              setForm(emptyForm);
              setFormMode();
            }}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-md text-sm font-semibold cursor-pointer"
          >
            <Plus size={16} /> Nueva ficha
          </button>
        )}
      </div>

      <div className="p-8">
        {isFormMode && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-bold text-[var(--color-primary)] mb-4 text-sm uppercase">
              {editandoId ? 'Editar ficha' : 'Nueva ficha de operación'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['diagnostico', 'Diagnóstico'],
                ['procedimiento', 'Procedimiento *'],
                ['materiales', 'Materiales'],
                ['alumno', 'Alumno tratante'],
              ].map(([k, l]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {l}
                  </label>
                  <input
                    value={form[k]}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label
                  htmlFor="observaciones-textarea"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Observaciones
                </label>
                <textarea
                  id="observaciones-textarea"
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 resize-none focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="estado-ficha-select"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Estado
                </label>
                <select
                  id="estado-ficha-select"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                >
                  <option value="borrador">Borrador</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setViewMode();
                  setEditandoId(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={agregando}>
                {agregando ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}

        {fichas.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No hay fichas de operación registradas.
          </p>
        ) : (
          <div className="space-y-3">
            {fichas.map((f) => (
              <div
                key={f.id_ficha}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === f.id_ficha ? null : f.id_ficha)
                  }
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    setExpandedId(expandedId === f.id_ficha ? null : f.id_ficha)
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[f.estado] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {f.estado}
                    </span>
                    <span className="font-medium text-gray-800">
                      {f.procedimiento}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(f.fecha)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditandoId(f.id_ficha);
                        setForm({
                          diagnostico: f.diagnostico || '',
                          procedimiento: f.procedimiento,
                          materiales: f.materiales || '',
                          observaciones: f.observaciones || '',
                          estado: f.estado,
                          alumno: f.alumno || '',
                        });
                        setFormMode();
                      }}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminar(
                          { idHistory: id, idFicha: f.id_ficha },
                          { onSuccess: () => toast.success('Ficha eliminada') }
                        );
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                    {expandedId === f.id_ficha ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </div>
                </div>
                {expandedId === f.id_ficha && (
                  <div className="px-4 py-4 grid grid-cols-2 gap-3 text-sm">
                    {f.diagnostico && (
                      <div>
                        <span className="text-xs text-gray-400 block">
                          Diagnóstico
                        </span>
                        {f.diagnostico}
                      </div>
                    )}
                    {f.materiales && (
                      <div>
                        <span className="text-xs text-gray-400 block">
                          Materiales
                        </span>
                        {f.materiales}
                      </div>
                    )}
                    {f.observaciones && (
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400 block">
                          Observaciones
                        </span>
                        {f.observaciones}
                      </div>
                    )}
                    {f.alumno && (
                      <div>
                        <span className="text-xs text-gray-400 block">
                          Alumno
                        </span>
                        {f.alumno}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
