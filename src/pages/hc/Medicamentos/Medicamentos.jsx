import { useState } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
  usePrescripciones,
  useAddPrescripcion,
  useDeletePrescripcion,
} from '@hooks/useClinico';
import { useForm } from '@stores/useForm';
import Button from '@ui/Button';

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-PE');
}

export default function Medicamentos() {
  const { id } = useParams();
  const { isFormMode, setFormMode, setViewMode } = useForm();
  const { data: prescripciones = [], isLoading } = usePrescripciones(id);
  const { mutate: agregar, isPending } = useAddPrescripcion();
  const { mutate: eliminar } = useDeletePrescripcion();

  const [form, setForm] = useState({
    medicamento: '',
    dosis: '',
    duracion: '',
    fecha: new Date().toISOString().split('T')[0],
    prescriptor: '',
  });

  const handleSubmit = () => {
    if (!form.medicamento.trim()) return toast.error('Medicamento requerido');
    agregar(
      { idHistory: id, data: form },
      {
        onSuccess: () => {
          toast.success('Prescripción registrada');
          setForm({
            medicamento: '',
            dosis: '',
            duracion: '',
            fecha: new Date().toISOString().split('T')[0],
            prescriptor: '',
          });
          setViewMode();
        },
        onError: (e) => toast.error(e.message || 'Error'),
      }
    );
  };

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg flex justify-between items-center">
        <h2 className="text-2xl font-bold">Medicamentos / Prescripciones</h2>
        {!isFormMode && (
          <button
            onClick={setFormMode}
            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-md text-sm font-semibold cursor-pointer"
          >
            + Nueva prescripción
          </button>
        )}
      </div>

      <div className="p-8">
        {isFormMode && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-bold text-[var(--color-primary)] mb-4 uppercase text-sm">
              Registrar prescripción
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: 'medicamento',
                  label: 'Medicamento *',
                  placeholder: 'Nombre del medicamento',
                },
                {
                  key: 'dosis',
                  label: 'Dosis',
                  placeholder: 'Ej: 500mg cada 8h',
                },
                {
                  key: 'duracion',
                  label: 'Duración',
                  placeholder: 'Ej: 7 días',
                },
                {
                  key: 'prescriptor',
                  label: 'Prescriptor',
                  placeholder: 'Nombre del docente/profesional',
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {label}
                  </label>
                  <input
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              ))}
              <div>
                <label
                  htmlFor="med-fecha"
                  className="block text-xs font-semibold text-gray-500 mb-1"
                >
                  Fecha
                </label>
                <input
                  id="med-fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={setViewMode}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Registrando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        )}

        {prescripciones.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No hay prescripciones registradas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  {[
                    'Medicamento',
                    'Dosis',
                    'Duración',
                    'Prescriptor',
                    'Fecha',
                    '',
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescripciones.map((p) => (
                  <tr key={p.id_prescripcion} className="hover:bg-blue-50/20">
                    <td className="px-4 py-3 font-medium">{p.medicamento}</td>
                    <td className="px-4 py-3">{p.dosis || '—'}</td>
                    <td className="px-4 py-3">{p.duracion || '—'}</td>
                    <td className="px-4 py-3">{p.prescriptor || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(p.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          eliminar(
                            {
                              idHistory: id,
                              idPrescripcion: p.id_prescripcion,
                            },
                            { onSuccess: () => toast.success('Eliminada') }
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
