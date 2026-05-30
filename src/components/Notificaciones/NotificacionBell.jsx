import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import {
  useNoLeidas,
  useNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
} from '@hooks/useClinico';

function formatRelativo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  return new Date(fecha).toLocaleDateString('es-PE');
}

export default function NotificacionBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const { data: noLeidas } = useNoLeidas();
  const { data: notifs = [], isLoading } = useNotificaciones();
  const { mutate: marcarLeida } = useMarcarLeida();
  const { mutate: marcarTodas } = useMarcarTodasLeidas();

  const count = noLeidas?.total || 0;

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800">Notificaciones</span>
            {count > 0 && (
              <button
                onClick={() => marcarTodas()}
                className="text-xs text-[var(--color-primary)] hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Cargando...
              </div>
            ) : notifs.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No hay notificaciones
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id_notificacion}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!n.leida ? 'bg-blue-50/50' : ''}`}
                  onClick={() => !n.leida && marcarLeida(n.id_notificacion)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    !n.leida &&
                    marcarLeida(n.id_notificacion)
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-2">
                    {!n.leida && (
                      <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full mt-1.5 flex-shrink-0" />
                    )}
                    <div className={n.leida ? 'pl-4' : ''}>
                      <div className="text-sm font-medium text-gray-800">
                        {n.titulo}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {n.mensaje}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatRelativo(n.fecha)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
