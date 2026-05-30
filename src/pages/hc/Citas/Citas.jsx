import { useState } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import { Calendar, Plus } from 'lucide-react';
import {
  useCitas,
  useAddCita,
  useUpdateCitaEstado,
  useDeleteCita,
} from '@hooks/useClinico';
import { useForm } from '@stores/useForm';
import Button from '@ui/Button';

const ESTADO_BADGE = {
  programada: 'bg-blue-50 text-blue-700',
  confirmada: 'bg-green-50 text-green-700',
  cancelada: 'bg-red-50 text-red-700',
  completada: 'bg-gray-100 text-gray-500',
};

function formatDT(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function Citas() {
  const { id } = useParams();
  const { isFormMode, setFormMode, setViewMode } = useForm();
  const { data: citas = [], isLoading } = useCitas(id);
  const { mutate: agregar, isPending } = useAddCita();
  const { mutate: cambiarEstado } = useUpdateCitaEstado();
  const { mutate: eliminar } = useDeleteCita();

  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  const defaultDT = now.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    fechaHora: defaultDT,
    duracionMin: 60,
    motivo: '',
  });

  const handleSubmit = () => {
    agregar(
      { idHistory: id, data: form },
      {
        onSuccess: () => {
          toast.success('Cita programada');
          setForm({ fechaHora: defaultDT, duracionMin: 60, motivo: '' });
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
        <div className="flex items-center gap-3">
          <Calendar size={24} />
          <h2 className="text-2xl font-bold">Citas</h2>
        </div>
        {!isFormMode && (
          <button
            onClick={setFormMode}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-md text-sm font-semibold cursor-pointer"
          >
            <Plus size={16} /> Nueva cita
          </button>
        )}
      </div>

      <div className="p-8">
        {isFormMode && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-bold text-[var(--color-primary)] text-sm uppercase mb-4">
              Programar nueva cita
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="fecha-hora"
                  className="text-xs font-semibold text-gray-500 block mb-1"
                >
                  Fecha y hora *
                </label>
                <input
                  id="fecha-hora"
                  type="datetime-local"
                  value={form.fechaHora}
                  onChange={(e) =>
                    setForm({ ...form, fechaHora: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="duracion-select"
                  className="text-xs font-semibold text-gray-500 block mb-1"
                >
                  Duración (minutos)
                </label>
                <select
                  id="duracion-select"
                  value={form.duracionMin}
                  onChange={(e) =>
                    setForm({ ...form, duracionMin: parseInt(e.target.value) })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                >
                  {[30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="motivo-input"
                  className="text-xs font-semibold text-gray-500 block mb-1"
                >
                  Motivo
                </label>
                <input
                  id="motivo-input"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Motivo de la cita"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={setViewMode}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Programando...' : 'Programar cita'}
              </Button>
            </div>
          </div>
        )}

        {citas.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No hay citas programadas.
          </p>
        ) : (
          <div className="space-y-2">
            {citas.map((c) => (
              <div
                key={c.id_cita}
                className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <Calendar size={18} className="text-[var(--color-primary)]" />
                  <div>
                    <div className="font-medium text-sm">
                      {formatDT(c.fecha_hora)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {c.duracion_min} min · {c.motivo || 'Sin motivo'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[c.estado] || 'bg-gray-100 text-gray-600'}`}
                  >
                    {c.estado}
                  </span>
                  {c.estado === 'programada' && (
                    <button
                      onClick={() =>
                        cambiarEstado(
                          {
                            idHistory: id,
                            idCita: c.id_cita,
                            estado: 'confirmada',
                          },
                          { onSuccess: () => toast.success('Confirmada') }
                        )
                      }
                      className="text-xs text-green-600 hover:underline"
                    >
                      Confirmar
                    </button>
                  )}
                  {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                    <button
                      onClick={() =>
                        cambiarEstado(
                          {
                            idHistory: id,
                            idCita: c.id_cita,
                            estado: 'cancelada',
                          },
                          { onSuccess: () => toast.success('Cancelada') }
                        )
                      }
                      className="text-xs text-red-400 hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={() =>
                      eliminar(
                        { idHistory: id, idCita: c.id_cita },
                        { onSuccess: () => toast.success('Eliminada') }
                      )
                    }
                    className="text-xs text-gray-400 hover:text-red-500 hover:underline"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
