import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import Button from '@ui/Button';
import { useCurrentUser } from '@hooks/useAuth';

const API = import.meta.env.VITE_API_URL;

const ESTADO_STYLE = {
  Aprobada: 'bg-green-50 text-green-700 border-green-200',
  Rechazada: 'bg-red-50 text-red-700 border-red-200',
  'Requiere corrección': 'bg-amber-50 text-amber-700 border-amber-200',
  Pendiente: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function ValidacionDocente() {
  const { id } = useParams();
  const { data: user } = useCurrentUser();
  const [form, setForm] = useState({ state: 'Aprobada', observations: '' });
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Docente y admin pueden registrar validaciones; el estudiante solo las ve.
  const puedeValidar = user?.role === 'docente' || user?.role === 'admin';

  const cargarRevisiones = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const r = await fetch(`${API}/hc/${id}/reviews`, {
        credentials: 'include',
      });
      if (!r.ok) throw new Error('No se pudieron cargar las revisiones');
      setReviews(await r.json());
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [id]);

  useEffect(() => {
    cargarRevisiones();
  }, [cargarRevisiones]);

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
      setForm({ state: 'Aprobada', observations: '' });
      cargarRevisiones();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fmtFecha = (f) => {
    if (!f) return '';
    const d = new Date(f);
    return isNaN(d) ? String(f) : d.toLocaleString();
  };

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg">
        <h2 className="text-2xl font-bold">Validación Docente</h2>
        <p className="text-sm opacity-80 mt-1">
          {puedeValidar
            ? 'Registra tu revisión y consulta el historial de validaciones'
            : 'Aquí ves la retroalimentación y el estado de validación de tu historia clínica'}
        </p>
      </div>

      <div className="p-8 space-y-8">
        {/* Formulario: solo docente/admin */}
        {puedeValidar && (
          <div className="max-w-2xl space-y-5">
            <fieldset>
              <legend className="block font-semibold text-gray-700 mb-2">
                Estado de la revisión
              </legend>
              <div className="flex flex-wrap gap-3">
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

        {/* Historial de revisiones: visible para todos */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">
            Historial de validaciones
          </h3>
          {loadingReviews ? (
            <p className="text-gray-400 text-sm">Cargando…</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Aún no hay validaciones registradas para esta historia clínica.
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((rev) => (
                <li
                  key={rev.id_revision}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_STYLE[rev.estado] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                    >
                      {rev.estado || 'Sin estado'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {fmtFecha(rev.fecha)}
                    </span>
                  </div>
                  {rev.observaciones && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {rev.observaciones}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Docente:{' '}
                    {`${rev.docente_nombre ?? ''} ${rev.docente_apellido ?? ''}`.trim() ||
                      rev.docente_codigo ||
                      '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
