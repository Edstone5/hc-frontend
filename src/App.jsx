import { Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login/Login.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import ProtectedRoutes from './components/routes/ProtectedRoutes.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Anamnesis from './pages/hc/Anamnesis/Anamnesis.jsx';
import Filiation from './pages/hc/Anamnesis/Filiacion/Filiacion.jsx';
import Motivo_Consulta from './pages/hc/Anamnesis/Motivo_Consulta/Motivo_Consulta.jsx';
import Enfermedad_Actual from './pages/hc/Anamnesis/Enfermedad_Actual/Enfermedad_Actual.jsx';
import AntecedentePersonal from './pages/hc/Anamnesis/Antecedente/Antecedente.jsx';
import HcLayout from './layouts/HcLayout.jsx';
import ExamenFisicoMenu from './pages/hc/ExamenFisico/ExamenFisicoMenu.jsx';
import ExamenGeneral from './pages/hc/ExamenFisico/ExamenGeneral.jsx';
import ExamenRegional from './pages/hc/ExamenFisico/ExamenRegional.jsx';
import ExamenBoca from './pages/hc/ExamenFisico/ExamenBoca.jsx';
import ExamenHigiene from './pages/hc/ExamenFisico/ExamenHigiene.jsx';
import DiagnosticoPresuntivo from './pages/hc/Diagnostico/DiagnosticoPresuntivo.jsx';
import DerivacionClinicas from './pages/hc/Diagnostico/DerivacionClinicas.jsx';
import DiagnosticoClinicas from './pages/hc/Diagnostico/DiagnosticoClinicas.jsx';
import Evolucion from './pages/hc/Evolucion/Evolucion.jsx';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AdminLayout from './layouts/AdminLayout.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import CreateStudent from './pages/Admin/CreateStudent.jsx';
import StudentDetailPage from './pages/Admin/StudentDetailPage.jsx';
import Odonto from './pages/hc/ExamenFisico/odonto.jsx';

// ── Fase 1: Admin ──────────────────────────────────────────────────────────
import Busqueda from './pages/Admin/Busqueda.jsx';
import Reportes from './pages/Admin/Reportes.jsx';
import Equipos from './pages/Admin/Equipos.jsx';

// ── Fase 2: Módulos clínicos ──────────────────────────────────────────────
import OdontogramaPage from './pages/hc/Odontograma/OdontogramaPage.jsx';
import Medicamentos from './pages/hc/Medicamentos/Medicamentos.jsx';
import Adjuntos from './pages/hc/Adjuntos/Adjuntos.jsx';
import FichaOperacion from './pages/hc/FichaOperacion/FichaOperacion.jsx';
import FichaEvaluacion from './pages/hc/FichaEvaluacion/FichaEvaluacion.jsx';

// ── Fase 3: Coordinación ──────────────────────────────────────────────────
import Citas from './pages/hc/Citas/Citas.jsx';
import ValidacionDocente from './pages/hc/ValidacionDocente/ValidacionDocente.jsx';
import TransferirHC from './pages/Admin/TransferirHC.jsx';

// ── Fase 4: Reportes / PDF ────────────────────────────────────────────────
import HistorialVersiones from './pages/hc/HistorialVersiones/HistorialVersiones.jsx';
import DashboardDocente from './pages/Docente/DashboardDocente.jsx';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<ProtectedRoutes />}>
          <Route element={<StudentLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* ── Panel de Docente ── */}
          <Route element={<StudentLayout />}>
            <Route path="/docente/dashboard" element={<DashboardDocente />} />
          </Route>

          {/* ── Panel de Administración ── */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/create-student" element={<CreateStudent />} />
            <Route path="/admin/student/:id" element={<StudentDetailPage />} />
            <Route path="/admin/busqueda" element={<Busqueda />} />
            <Route path="/admin/reportes" element={<Reportes />} />
            <Route path="/admin/equipos" element={<Equipos />} />
            <Route path="/admin/transferir/:id" element={<TransferirHC />} />
          </Route>

          {/* ── Historia Clínica ── */}
          <Route element={<HcLayout />}>
            {/* Anamnesis */}
            <Route path="/historia/:id/anamnesis" element={<Anamnesis />} />
            <Route
              path="/historia/:id/anamnesis/antecedente-personal"
              element={<AntecedentePersonal />}
            />
            <Route
              path="/historia/:id/anamnesis/filiacion"
              element={<Filiation />}
            />
            <Route
              path="/historia/:id/anamnesis/motivo-consulta"
              element={<Motivo_Consulta />}
            />
            <Route
              path="/historia/:id/anamnesis/enfermedad-actual"
              element={<Enfermedad_Actual />}
            />

            {/* Examen Físico */}
            <Route
              path="/historia/:id/examen-fisico"
              element={<ExamenFisicoMenu />}
            />
            <Route
              path="/historia/:id/examen-fisico/general"
              element={<ExamenGeneral />}
            />
            <Route
              path="/historia/:id/examen-fisico/regional"
              element={<ExamenRegional />}
            />
            <Route
              path="/historia/:id/examen-fisico/boca"
              element={<ExamenBoca />}
            />
            <Route
              path="/historia/:id/examen-fisico/higiene"
              element={<ExamenHigiene />}
            />
            <Route
              path="/historia/:id/examen-fisico/odonto"
              element={<Odonto />}
            />

            {/* Diagnóstico y Evolución */}
            <Route
              path="/historia/:id/diagnostico-presuntivo"
              element={<DiagnosticoPresuntivo />}
            />
            <Route
              path="/historia/:id/derivacion-clinicas"
              element={<DerivacionClinicas />}
            />
            <Route
              path="/historia/:id/diagnostico-clinicas"
              element={<DiagnosticoClinicas />}
            />
            <Route path="/historia/:id/evolucion" element={<Evolucion />} />

            {/* ── Fase 2: Módulos clínicos nuevos ── */}
            <Route
              path="/historia/:id/odontograma"
              element={<OdontogramaPage />}
            />
            <Route
              path="/historia/:id/medicamentos"
              element={<Medicamentos />}
            />
            <Route path="/historia/:id/adjuntos" element={<Adjuntos />} />
            <Route
              path="/historia/:id/fichas-operacion"
              element={<FichaOperacion />}
            />
            <Route
              path="/historia/:id/fichas-evaluacion"
              element={<FichaEvaluacion />}
            />

            {/* ── Fase 3: Coordinación ── */}
            <Route path="/historia/:id/citas" element={<Citas />} />
            <Route
              path="/historia/:id/validacion"
              element={<ValidacionDocente />}
            />

            {/* ── Fase 4: Historial ── */}
            <Route
              path="/historia/:id/historial"
              element={<HistorialVersiones />}
            />
          </Route>
        </Route>
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontSize: '0.875rem',
            boxShadow:
              '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default App;
