import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchLogout } from '../../services/fetchLogout';
import NotificacionBell from '../Notificaciones/NotificacionBell.jsx';

export default function Header() {
  const handleLogout = async () => {
    try {
      await fetchLogout();
      localStorage.clear();
      window.location.href = '/login';
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };
  return (
    <header className="flex justify-between items-center px-16 py-6 bg-[var(--color-primary)] !text-[var(--color-white)] shadow-[0_2px_4px_rgba(0,0,0,0.1)] top-0 left-0 w-full h-24 flex-shrink-0">
      <div className="flex items-center gap-4 flex-row">
        <img src="/logo1.png" alt="Logo" className="h-12 w-auto" />
        <div className="font-bold text-2xl">UNJBG</div>
        <div className="text-center text-base leading-tight flex-1 border-l-[2.5px] border-[#aaa] pl-5 pt-2.5">
          CLÍNICA ODONTOLÓGICA
          <br />
          BASADRINA
        </div>
      </div>
      <div className="flex items-center gap-3 text-white">
        <NotificacionBell />
        <LogOut
          className="text-2xl cursor-pointer !text-[var(--color-white)] hover:opacity-80 transition-opacity duration-200"
          onClick={handleLogout}
        />
      </div>
    </header>
  );
}
