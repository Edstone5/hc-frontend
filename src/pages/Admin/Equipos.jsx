import { useState } from 'react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import { Wrench, Plus, RotateCcw } from 'lucide-react';
import {
  useEquipos,
  useAddEquipo,
  usePrestamos,
  useRegistrarPrestamo,
  useRegistrarDevolucion,
} from '@hooks/useClinico';
import { useStudents } from '@hooks/useStudents';
import Button from '@ui/Button';

const ESTADO_COLOR = {
  disponible: 'bg-green-50 text-green-700',
  prestado: 'bg-amber-50 text-amber-700',
  mantenimiento: 'bg-red-50 text-red-700',
};

function formatDT(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function Equipos() {
  const { data: equipos = [], isLoading: cargandoEq } = useEquipos();
  const { data: prestamos = [], isLoading: cargandoPr } = usePrestamos();
  const { data: estudiantes = [] } = useStudents();
  const { mutate: addEquipo, isPending: agregando } = useAddEquipo();
  const { mutate: prestar, isPending: prestando } = useRegistrarPrestamo();
  const { mutate: devolver } = useRegistrarDevolucion();

  const [tab, setTab] = useState('equipos');
  const [showFormEq, setShowFormEq] = useState(false);
  const [showFormPr, setShowFormPr] = useState(false);
  const [formEq, setFormEq] = useState({
    nombre: '',
    descripcion: '',
    codigo: '',
  });
  const [formPr, setFormPr] = useState({
    idEquipo: '',
    idEstudiante: '',
    fechaDevolucionPrevista: '',
  });

  const handleAddEquipo = () => {
    if (!formEq.nombre.trim()) return toast.error('Nombre requerido');
    addEquipo(formEq, {
      onSuccess: () => {
        toast.success('Equipo registrado');
        setFormEq({ nombre: '', descripcion: '', codigo: '' });
        setShowFormEq(false);
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const handlePrestar = () => {
    if (!formPr.idEquipo || !formPr.idEstudiante)
      return toast.error('Equipo y estudiante requeridos');
    prestar(formPr, {
      onSuccess: () => {
        toast.success('Préstamo registrado');
        setFormPr({
          idEquipo: '',
          idEstudiante: '',
          fechaDevolucionPrevista: '',
        });
        setShowFormPr(false);
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <Link
        to="/admin"
        className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block"
      >
        ← Volver al panel
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <Wrench size={22} className="text-[var(--color-primary)]" />
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
          Gestión de Equipos
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 w-fit">
        {['equipos', 'prestamos'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-[var(--color-primary)] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {t === 'equipos' ? 'Inventario' : 'Préstamos activos'}
          </button>
        ))}
      </div>

      {tab === 'equipos' ? (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowFormEq(!showFormEq)}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Plus size={16} /> Nuevo equipo
            </button>
          </div>
          {showFormEq && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                {[
                  ['nombre', 'Nombre *'],
                  ['descripcion', 'Descripción'],
                  ['codigo', 'Código'],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">
                      {l}
                    </label>
                    <input
                      value={formEq[k]}
                      onChange={(e) =>
                        setFormEq({ ...formEq, [k]: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowFormEq(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleAddEquipo} disabled={agregando}>
                  {agregando ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  {['Nombre', 'Código', 'Descripción', 'Estado', ''].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cargandoEq ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : (
                  equipos.map((e) => (
                    <tr key={e.id_equipo} className="hover:bg-blue-50/10">
                      <td className="px-4 py-3 font-medium">{e.nombre}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {e.codigo || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {e.descripcion || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[e.estado] || 'bg-gray-100 text-gray-600'}`}
                        >
                          {e.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {e.estado === 'disponible' && (
                          <button
                            onClick={() => {
                              setFormPr({ ...formPr, idEquipo: e.id_equipo });
                              setShowFormPr(true);
                              setTab('prestamos');
                            }}
                            className="text-xs text-[var(--color-primary)] hover:underline"
                          >
                            Prestar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowFormPr(!showFormPr)}
              className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Plus size={16} /> Registrar préstamo
            </button>
          </div>
          {showFormPr && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="equipo-select"
                    className="text-xs font-semibold text-gray-500 block mb-1"
                  >
                    Equipo *
                  </label>
                  <select
                    id="equipo-select"
                    value={formPr.idEquipo}
                    onChange={(e) =>
                      setFormPr({ ...formPr, idEquipo: e.target.value })
                    }
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
                  >
                    <option value="">Seleccionar equipo</option>
                    {equipos
                      .filter((eq) => eq.estado === 'disponible')
                      .map((eq) => (
                        <option key={eq.id_equipo} value={eq.id_equipo}>
                          {eq.nombre} {eq.codigo ? `(${eq.codigo})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="estudiante-select"
                    className="text-xs font-semibold text-gray-500 block mb-1"
                  >
                    Estudiante *
                  </label>
                  <select
                    id="estudiante-select"
                    value={formPr.idEstudiante}
                    onChange={(e) =>
                      setFormPr({ ...formPr, idEstudiante: e.target.value })
                    }
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
                  >
                    <option value="">Seleccionar estudiante</option>
                    {estudiantes.map((s) => (
                      <option key={s.id_usuario} value={s.id_usuario}>
                        {s.nombre} {s.apellido}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="devolucion-input"
                    className="text-xs font-semibold text-gray-500 block mb-1"
                  >
                    Devolución prevista
                  </label>
                  <input
                    id="devolucion-input"
                    type="datetime-local"
                    value={formPr.fechaDevolucionPrevista}
                    onChange={(e) =>
                      setFormPr({
                        ...formPr,
                        fechaDevolucionPrevista: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowFormPr(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handlePrestar} disabled={prestando}>
                  {prestando ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase text-gray-500">
                  {[
                    'Equipo',
                    'Estudiante',
                    'Prestado',
                    'Devolución prevista',
                    'Estado',
                    '',
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cargandoPr ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : (
                  prestamos.map((p) => (
                    <tr key={p.id_prestamo} className="hover:bg-blue-50/10">
                      <td className="px-4 py-3 font-medium">
                        {p.equipo_nombre}
                      </td>
                      <td className="px-4 py-3">
                        {p.estudiante_nombre} {p.estudiante_apellido}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDT(p.fecha_prestamo)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {formatDT(p.fecha_devolucion_prevista)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.estado === 'activo' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}
                        >
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {p.estado === 'activo' && (
                          <button
                            onClick={() =>
                              devolver(p.id_prestamo, {
                                onSuccess: () =>
                                  toast.success('Devolución registrada'),
                              })
                            }
                            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                          >
                            <RotateCcw size={12} /> Devolver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
