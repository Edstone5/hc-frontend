import { useState } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import Button from '@ui/Button';
import { useCurrentUser } from '@hooks/useAuth';

const API = import.meta.env.VITE_API_URL;

export default function ValidacionDocente() {
  const { id } = useParams();
  const { data: user } = useCurrentUser();
  const [form, setForm] = useState({ state: 'Aprobada', observations: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const esDocente = user?.role === 'docente';

  const handleSubmit = async () => {
    if (!form.observations.trim())
      return toast.error('Observaciones requeridas');
    setSaving(true);
    try {
      const r = await fetch(`${API}/hc/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          idHistory: id,
          state: form.state,
          observations: form.observations,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Error');
      toast.success('Revisión registrada correctamente');
      setDone(true);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!esDocente)
    return (
      <div className="p-8 text-center text-gray-400">
        Solo los docentes pueden registrar validaciones.
      </div>
    );

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg">
        <h2 className="text-2xl font-bold">Validación Docente</h2>
        <p className="text-sm opacity-80 mt-1">
          Registra tu revisión y retroalimentación de esta historia clínica
        </p>
      </div>

      <div className="p-8">
        {done ? (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-bold text-green-700">
              Revisión registrada
            </h3>
            <p className="text-gray-500 mt-2">
              La revisión ha sido guardada correctamente.
            </p>
            <Button
              onClick={() => setDone(false)}
              variant="secondary"
              className="mt-4"
            >
              Registrar otra revisión
            </Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            <fieldset>
              <legend className="block font-semibold text-gray-700 mb-2">
                Estado de la revisión
              </legend>
              <div className="flex gap-3">
                {[
                  {
                    v: 'Aprobada',
                    icon: <CheckCircle size={18} />,
                    color: 'border-green-500 text-green-700 bg-green-50',
                  },
                  {
                    v: 'Rechazada',
                    icon: <XCircle size={18} />,
                    color: 'border-red-500 text-red-700 bg-red-50',
                  },
                  {
                    v: 'Requiere corrección',
                    icon: null,
                    color: 'border-amber-500 text-amber-700 bg-amber-50',
                  },
                  {
                    v: 'Pendiente',
                    icon: null,
                    color: 'border-gray-400 text-gray-600 bg-gray-50',
                  },
                ].map(({ v, icon, color }) => (
                  <button
                    key={v}
                    onClick={() => setForm({ ...form, state: v })}
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${form.state === v ? color : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {icon}
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="observaciones-doc"
                className="block font-semibold text-gray-700 mb-2"
              >
                Observaciones *
              </label>
              <textarea
                id="observaciones-doc"
                value={form.observations}
                onChange={(e) =>
                  setForm({ ...form, observations: e.target.value })
                }
                rows={5}
                placeholder="Escribe tus observaciones y retroalimentación para el estudiante..."
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 resize-none focus:border-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Guardando...' : 'Registrar revisión'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
