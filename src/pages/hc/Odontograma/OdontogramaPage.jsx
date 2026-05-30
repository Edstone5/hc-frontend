import { useState } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
  useOdontograma,
  useAddOdontogramaEntrada,
  useDeleteOdontogramaEntrada,
} from '@hooks/useClinico';
import { useForm } from '@stores/useForm';
import Button from '@ui/Button';

const SUPERFICIES = ['vestibular', 'lingual', 'mesial', 'distal', 'oclusal'];

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-PE');
}

export default function OdontogramaPage() {
  const { id } = useParams();
  const { isFormMode, setFormMode, setViewMode } = useForm();
  const { data: entradas = [], isLoading } = useOdontograma(id);
  const { mutate: agregar, isPending } = useAddOdontogramaEntrada();
  const { mutate: eliminar } = useDeleteOdontogramaEntrada();

  const [form, setForm] = useState({
    numeroDiente: '',
    superficie: '',
    diagnostico: '',
    tratamiento: '',
    fecha: new Date().toISOString().split('T')[0],
    alumno: '',
  });

  const handleSubmit = () => {
    if (!form.numeroDiente) return toast.error('Número de diente requerido');
    agregar(
      { idHistory: id, data: form },
      {
        onSuccess: () => {
          toast.success('Entrada registrada');
          setForm({
            numeroDiente: '',
            superficie: '',
            diagnostico: '',
            tratamiento: '',
            fecha: new Date().toISOString().split('T')[0],
            alumno: '',
          });
          setViewMode();
        },
        onError: (e) => toast.error(e.message || 'Error al registrar'),
      }
    );
  };

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg flex justify-between items-center">
        <h2 className="text-2xl font-bold">Odontograma</h2>
        {!isFormMode && (
          <button
            onClick={setFormMode}
            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-md text-sm font-semibold cursor-pointer"
          >
            + Nueva entrada
          </button>
        )}
      </div>

      <div className="p-8">
        {isFormMode && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-bold text-[var(--color-primary)] mb-4 uppercase text-sm">
              Registrar entrada de odontograma
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="numero-diente"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Nº Diente (FDI) *
                </label>
                <input
                  id="numero-diente"
                  type="number"
                  min="11"
                  max="85"
                  value={form.numeroDiente}
                  onChange={(e) =>
                    setForm({ ...form, numeroDiente: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="superficie-select"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Superficie
                </label>
                <select
                  id="superficie-select"
                  value={form.superficie}
                  onChange={(e) =>
                    setForm({ ...form, superficie: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                >
                  <option value="">Todas</option>
                  {SUPERFICIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="odonto-fecha"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Fecha
                </label>
                <input
                  id="odonto-fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="odonto-diagnostico"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Diagnóstico
                </label>
                <textarea
                  id="odonto-diagnostico"
                  value={form.diagnostico}
                  onChange={(e) =>
                    setForm({ ...form, diagnostico: e.target.value })
                  }
                  rows={2}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 resize-none focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="tratamiento"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Tratamiento
                </label>
                <textarea
                  id="tratamiento"
                  value={form.tratamiento}
                  onChange={(e) =>
                    setForm({ ...form, tratamiento: e.target.value })
                  }
                  rows={2}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 resize-none focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="md:col-span-3">
                <label
                  htmlFor="alumno-tratante"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Alumno tratante
                </label>
                <input
                  id="alumno-tratante"
                  value={form.alumno}
                  onChange={(e) => setForm({ ...form, alumno: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={setViewMode}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Registrando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        )}

        {entradas.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No hay entradas de odontograma registradas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  <th className="px-4 py-3">Diente</th>
                  <th className="px-4 py-3">Superficie</th>
                  <th className="px-4 py-3">Diagnóstico</th>
                  <th className="px-4 py-3">Tratamiento</th>
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entradas.map((e) => (
                  <tr key={e.id_entrada} className="hover:bg-blue-50/20">
                    <td className="px-4 py-3 font-bold text-center text-[var(--color-primary)]">
                      {e.numero_diente}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {e.superficie || '—'}
                    </td>
                    <td className="px-4 py-3">{e.diagnostico || '—'}</td>
                    <td className="px-4 py-3">{e.tratamiento || '—'}</td>
                    <td className="px-4 py-3">{e.alumno || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(e.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          eliminar(
                            { idHistory: id, idEntrada: e.id_entrada },
                            {
                              onSuccess: () => toast.success('Eliminado'),
                              onError: () => toast.error('Error'),
                            }
                          )
                        }
                        className="text-xs text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
