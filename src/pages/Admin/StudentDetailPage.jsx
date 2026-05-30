import { useParams, Link } from 'react-router';
import React from 'react';
import { useHCsByStudent } from '@hooks/useHC';
import { useRegisterHc } from '@hooks/useHistoria';
import { useStudents } from '@hooks/useStudents';
import { usePatchUserStatus } from '@hooks/useAdmin';
import toast from 'react-hot-toast';

function StudentDetailPage() {
  const { id } = useParams();
  const {
    data: students,
    isLoading: isLoadingStudents,
    isError: isErrorStudents,
    error: errorStudents,
  } = useStudents();
  const student = students?.find((s) => s.id_usuario === id);

  const {
    data: hcs,
    isLoading: isLoadingHCs,
    isError: isErrorHCs,
    error: errorHCs,
  } = useHCsByStudent(id);

  const registerHcMutation = useRegisterHc();
  const patchStatusMutation = usePatchUserStatus();

  const handleToggleStatus = () => {
    const nuevoEstado = !student?.activo;
    patchStatusMutation.mutate(
      { id, activo: nuevoEstado },
      {
        onSuccess: () =>
          toast.success(
            `Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'}`
          ),
        onError: () => toast.error('Error al cambiar estado'),
      }
    );
  };

  if (isLoadingStudents || isLoadingHCs)
    return (
      <div className="p-8 text-center text-gray-500">
        Cargando información...
      </div>
    );
  if (isErrorStudents)
    return (
      <div className="p-8 text-center text-red-500">
        Error: {errorStudents.message}
      </div>
    );
  if (!student)
    return (
      <div className="p-8 text-center text-gray-500">
        Estudiante no encontrado.
      </div>
    );
  if (isErrorHCs)
    return (
      <div className="p-8 text-center text-red-500">
        Error HC: {errorHCs.message}
      </div>
    );

  // Helper para color de estado
  const estadoColor = {
    borrador: 'bg-gray-100 text-gray-600 ring-gray-500/10',
    en_proceso: 'bg-blue-50 text-blue-700 ring-blue-700/10',
    completada: 'bg-green-50 text-green-700 ring-green-600/20',
    aprobada: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
    rechazada: 'bg-red-50 text-red-700 ring-red-600/10',
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* BOTÓN VOLVER */}
        <div className="flex justify-start">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 bg-white text-gray-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] px-4 py-2 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md active:scale-95 font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Volver al Dashboard
          </Link>
        </div>

        {/* Header del Estudiante */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[var(--color-primary)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {student?.nombre} {student?.apellido}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Código: {student?.id_usuario || id}
            </p>
            <div className="mt-2">
              <button
                onClick={handleToggleStatus}
                disabled={patchStatusMutation.isPending}
                className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
                  student?.activo !== false
                    ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                    : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                }`}
              >
                {student?.activo !== false
                  ? '● Habilitado (click para deshabilitar)'
                  : '○ Deshabilitado (click para habilitar)'}
              </button>
            </div>
          </div>
          <div className="text-right">
            <button
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-2.5 px-6 rounded-lg shadow-md transition-all hover:shadow-lg active:transform active:scale-95 flex items-center gap-2"
              onClick={() => registerHcMutation.mutate(id)}
              disabled={registerHcMutation.isPending}
            >
              {registerHcMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <span>+</span> Nueva Historia Clínica
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sección de Historias Clínicas */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Historias Clínicas Asignadas
            </h2>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {hcs?.length || 0}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hcs && hcs.length > 0 ? (
              hcs.map((hc) => (
                <div
                  key={hc.id_historia}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col"
                >
                  {/* Cabecera de la Card */}
                  <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-start">
                    <div className="font-bold text-[var(--color-primary)] text-lg">
                      HC-{hc.id_historia}
                    </div>
                    {hc.estado && (
                      <div
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${estadoColor[hc.estado] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {hc.estado.replace('_', ' ').toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Contenido de la Card */}
                  <div className="p-5 flex-1 space-y-3">
                    <div>
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                        Paciente
                      </span>
                      <div className="font-medium text-gray-800 truncate">
                        {hc.nombre && hc.apellido ? (
                          `${hc.nombre} ${hc.apellido}`
                        ) : (
                          <span className="text-gray-400 italic">
                            Sin definir
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-gray-400 block">DNI</span>
                        <span className="text-gray-700 font-medium">
                          {hc.dni || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 block">
                          Fecha Nac.
                        </span>
                        <span className="text-gray-700">
                          {hc.fecha_nacimiento
                            ? formatDate(hc.fecha_nacimiento)
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer de la Card */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
                    <span>Modificado:</span>
                    <span className="font-medium">
                      {hc.fecha_elaboracion
                        ? formatDate(hc.fecha_elaboracion)
                        : formatDate(hc.fecha_registro)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="italic">No hay historias clínicas asignadas.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentDetailPage;
