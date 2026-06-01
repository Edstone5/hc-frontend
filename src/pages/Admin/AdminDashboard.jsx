import { Link } from 'react-router';
import { Search, BarChart2, Wrench, Activity } from 'lucide-react';
import StudentPatienList from '@features/student/StudentPatienList';

function AdminDashboard() {
  return (
    <div className="p-6 min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
          Panel de Administración
        </h1>
        <Link
          to="/admin/create-student"
          className="bg-[var(--color-primary-soft)] hover:bg-[var(--color-primary)] text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Crear Estudiante
        </Link>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          to="/admin/busqueda"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-all hover:border-[var(--color-primary)]"
        >
          <div className="bg-blue-50 p-2 rounded-lg">
            <Search size={20} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">Buscar HC</div>
            <div className="text-xs text-gray-500">Por ID, nombre o DNI</div>
          </div>
        </Link>

        <Link
          to="/admin/reportes"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-all hover:border-[var(--color-primary)]"
        >
          <div className="bg-green-50 p-2 rounded-lg">
            <BarChart2 size={20} className="text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">Reportes</div>
            <div className="text-xs text-gray-500">
              Estadísticas y exportación
            </div>
          </div>
        </Link>

        <Link
          to="/admin/reportes/odontograma"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-all hover:border-[var(--color-primary)]"
        >
          <div className="bg-red-50 p-2 rounded-lg">
            <Activity size={20} className="text-red-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              Reporte Odontograma
            </div>
            <div className="text-xs text-gray-500">
              Prevalencia de caries (RF-12)
            </div>
          </div>
        </Link>

        <Link
          to="/admin/equipos"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md transition-all hover:border-[var(--color-primary)]"
        >
          <div className="bg-amber-50 p-2 rounded-lg">
            <Wrench size={20} className="text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">Equipos</div>
            <div className="text-xs text-gray-500">
              Préstamo de instrumental
            </div>
          </div>
        </Link>
      </div>

      {/* Lista de estudiantes */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Estudiantes registrados
        </h2>
        <StudentPatienList />
      </section>
    </div>
  );
}

export default AdminDashboard;
