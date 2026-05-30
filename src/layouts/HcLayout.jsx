import { Outlet, useParams, useLocation, useSearchParams } from 'react-router';
import { useNavigate } from 'react-router';
import Header from '@cmlayout/Header';
import Sidebar from '@cmlayout/Sidebar';
import { CircleUserRound } from 'lucide-react';
import { usePatientByHistory } from '@hooks/useHistoria';

function HcLayout() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data: patient } = usePatientByHistory(id);

  const isNewDraft =
    searchParams.get('new') === '1' ||
    (location.state && location.state.createdDraft === true);

  const menuItems = [
    { path: `/historia/${id}/anamnesis`, label: 'Anamnesis' },
    { path: `/historia/${id}/examen-fisico`, label: 'Examen Físico' },
    // El Odontograma se accede desde Examen Físico → Odontograma (odonto.jsx)
    // El link independiente fue consolidado en ese módulo (RF-06, 2026-05-30)
    {
      path: `/historia/${id}/diagnostico-presuntivo`,
      label: 'Diagnósticos presuntivos',
    },
    {
      path: `/historia/${id}/derivacion-clinicas`,
      label: 'Derivado a clínicas',
    },
    {
      path: `/historia/${id}/diagnostico-clinicas`,
      label: 'Diagnóstico en clínicas',
    },
    { path: `/historia/${id}/evolucion`, label: 'Evoluciones' },
    { path: `/historia/${id}/medicamentos`, label: 'Medicamentos' },
    { path: `/historia/${id}/fichas-operacion`, label: 'Fichas de operación' },
    { path: `/historia/${id}/fichas-evaluacion`, label: 'Evaluaciones' },
    { path: `/historia/${id}/citas`, label: 'Citas' },
    { path: `/historia/${id}/adjuntos`, label: 'Adjuntos' },
    { path: `/historia/${id}/validacion`, label: 'Validación docente' },
    { path: `/historia/${id}/historial`, label: 'Historial de versiones' },
    {
      path: `/historia/${id}/consentimiento`,
      label: 'Consentimiento informado',
    },
  ];

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header />

      <main className="flex-1 p-4 pt-8 bg-[var(--color-secondary)] flex min-h-0">
        <div className="flex bg-[var(--color-background)] rounded-[var(--radius-lg)] flex-1 overflow-hidden">
          <Sidebar title="Adulto" items={menuItems} />

          <div
            className="flex-1 p-12 flex flex-col gap-10 overflow-y-auto h-full"
            style={{ position: 'relative' }}
          >
            {/* CABECERA: Nombre Paciente (Izq) - Botón Volver (Der) */}
            <div className="flex items-center justify-between w-full flex-shrink-0">
              {/* Izquierda: Icono y Nombre */}
              <div className="flex items-center gap-8 text-2xl">
                <div>
                  <CircleUserRound
                    size={84}
                    strokeWidth={1}
                    style={{ color: 'var(--color-primary)' }}
                  />
                </div>
                <h2 className="font-bold text-[var(--color-text)]">
                  {patient?.nombre || patient?.apellido
                    ? `${patient?.nombre ?? ''} ${patient?.apellido ?? ''}`.trim()
                    : isNewDraft
                      ? 'Paciente Nuevo'
                      : 'Paciente No asignado'}
                </h2>
              </div>

              {/* Derecha: Botón Volver al Dashboard */}
              <button
                type="button"
                className="bg-white text-[var(--color-primary)] border-2 border-[var(--color-primary)] font-bold text-lg rounded-2xl px-8 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => navigate('/dashboard')}
              >
                Volver al Dashboard
              </button>
            </div>

            <div className="pb-20">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HcLayout;
