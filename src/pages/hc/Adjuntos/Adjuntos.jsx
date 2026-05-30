import { useRef } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import { Paperclip, Trash2 } from 'lucide-react';
import {
  useAdjuntos,
  useSubirAdjunto,
  useDeleteAdjunto,
} from '@hooks/useClinico';

const ICONOS = {
  'application/pdf': '📄',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/webp': '🖼️',
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString('es-PE');
}

export default function Adjuntos() {
  const { id } = useParams();
  const fileRef = useRef();
  const { data: adjuntos = [], isLoading } = useAdjuntos(id);
  const { mutate: subir, isPending } = useSubirAdjunto();
  const { mutate: eliminar } = useDeleteAdjunto();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('archivo', file);
    subir(
      { idHistory: id, formData },
      {
        onSuccess: () => {
          toast.success('Archivo subido');
          fileRef.current.value = '';
        },
        onError: (err) => toast.error(err.message || 'Error al subir archivo'),
      }
    );
  };

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg flex justify-between items-center">
        <h2 className="text-2xl font-bold">Adjuntos</h2>
        <label
          className={`flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-md text-sm font-semibold cursor-pointer ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <Paperclip size={16} />
          {isPending ? 'Subiendo...' : 'Subir archivo'}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx"
            onChange={handleFileChange}
            disabled={isPending}
          />
        </label>
      </div>

      <div className="p-8">
        <p className="text-xs text-gray-400 mb-4">
          Tipos permitidos: JPG, PNG, PDF, DOC, DOCX. Máximo 10 MB.
        </p>

        {adjuntos.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            <Paperclip size={32} className="mx-auto mb-2 opacity-30" />
            <p>No hay archivos adjuntos. Sube el primer archivo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adjuntos.map((a) => (
              <div
                key={a.id_adjunto}
                className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col gap-2"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {ICONOS[a.tipo_mime] || '📎'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {a.nombre_original}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatSize(a.tamano_bytes)} ·{' '}
                      {formatDate(a.fecha_subida)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    onClick={() =>
                      eliminar(
                        { idHistory: id, idAdjunto: a.id_adjunto },
                        { onSuccess: () => toast.success('Eliminado') }
                      )
                    }
                    className="text-red-400 hover:text-red-600 p-1 rounded"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
