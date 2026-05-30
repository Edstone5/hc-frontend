import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { ArrowRightLeft } from 'lucide-react';
import { transferirHC } from '@services/fetchClinico.js';
import { useStudents } from '@hooks/useStudents';
import Button from '@ui/Button';

export default function TransferirHC() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: estudiantes = [] } = useStudents();
  const [form, setForm] = useState({ idNuevoEstudiante: '', razon: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.idNuevoEstudiante)
      return toast.error('Selecciona el nuevo estudiante responsable');
    if (!form.razon.trim()) return toast.error('Justificación requerida');
    setSaving(true);
    try {
      await transferirHC({ idHistory: id, ...form });
      toast.success('Historia clínica transferida correctamente');
      navigate('/admin');
    } catch (e) {
      toast.error(e.message || 'Error al transferir');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <Link
        to="/admin"
        className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block"
      >
        ← Volver al panel
      </Link>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ArrowRightLeft size={22} className="text-[var(--color-primary)]" />
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
            Transferir Historia Clínica
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            Historia:{' '}
            <span className="font-mono font-bold">HC-{id?.slice(0, 8)}...</span>
          </div>

          <div>
            <label
              htmlFor="nuevo-estudiante"
              className="block font-semibold text-gray-700 mb-2"
            >
              Nuevo estudiante responsable *
            </label>
            <select
              id="nuevo-estudiante"
              value={form.idNuevoEstudiante}
              onChange={(e) =>
                setForm({ ...form, idNuevoEstudiante: e.target.value })
              }
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none"
            >
              <option value="">Seleccionar estudiante...</option>
              {estudiantes.map((s) => (
                <option key={s.id_usuario} value={s.id_usuario}>
                  {s.nombre} {s.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="justificacion"
              className="block font-semibold text-gray-700 mb-2"
            >
              Justificación *
            </label>
            <textarea
              id="justificacion"
              value={form.razon}
              onChange={(e) => setForm({ ...form, razon: e.target.value })}
              rows={4}
              placeholder="Describe el motivo de la transferencia (cambio de turno, reasignación, etc.)"
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 resize-none focus:border-[var(--color-primary)] outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => navigate('/admin')}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Transfiriendo...' : 'Confirmar transferencia'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
