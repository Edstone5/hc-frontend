/**
 * Página: Consentimiento Informado (RF-09)
 *
 * Permite al alumno/docente:
 *  1. Seleccionar el tipo de consentimiento (adulto, menor, cirugía, anestesia)
 *  2. Completar los datos del paciente y/o tutor
 *  3. Previsualizar el texto del documento
 *  4. Guardar el registro en la BD e imprimirlo
 *  5. Ver/eliminar consentimientos anteriores de la misma HC
 *
 * Decisión de impresión: se usa window.print() con CSS @media print en lugar
 * de html2canvas + jsPDF porque el consentimiento es texto puro (no UI compleja).
 * Esto produce PDFs de mejor calidad tipográfica y es más accesible para
 * impresoras físicas usadas en la clínica.
 */
import { useRef, useState } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import {
  Printer,
  Trash2,
  FileText,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from '@ui/Button';
import { useCurrentUser } from '@hooks/useAuth';
import {
  useConsentimientos,
  useAddConsentimiento,
  useDeleteConsentimiento,
} from '@hooks/useClinico';
import {
  TIPOS_TEMPLATE,
  GENERADORES_TEMPLATE,
} from './consentimientoTemplates.js';

// ── Estilos de impresión inyectados dinámicamente (sin alterar CSS global) ───
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #consentimiento-print-area,
  #consentimiento-print-area * { visibility: visible !important; }
  #consentimiento-print-area {
    position: fixed; top: 0; left: 0;
    width: 100%; padding: 20mm 20mm 20mm 25mm;
    font-family: 'Times New Roman', serif;
    font-size: 11pt; line-height: 1.6;
    white-space: pre-wrap;
    color: #000;
  }
}
`;

export default function ConsentimientoInformado() {
  const { id } = useParams();
  const { data: user } = useCurrentUser();
  const printAreaRef = useRef(null);

  const { data: lista = [], isLoading } = useConsentimientos(id);
  const { mutate: guardar, isPending: guardando } = useAddConsentimiento();
  const { mutate: eliminar } = useDeleteConsentimiento();

  const [tipo, setTipo] = useState('adulto_general');
  const [nombre, setNombre] = useState('');
  const [tutor, setTutor] = useState('');
  const [fecha, setFecha] = useState('');
  const [preview, setPreview] = useState('');
  const [mostrando, setMostrando] = useState(false);

  const tipoInfo = TIPOS_TEMPLATE.find((t) => t.value === tipo);
  const necesitaTutor = tipo === 'menor_de_edad';

  // Genera el texto del consentimiento a partir del template
  const generarTexto = () => {
    const generador = GENERADORES_TEMPLATE[tipo];
    return generador({
      nombrePaciente: nombre.trim() || '___________________________',
      nombreResponsable: tutor.trim() || null,
      fecha: fecha || new Date().toLocaleDateString('es-PE'),
    });
  };

  const handlePreview = () => {
    if (!nombre.trim()) {
      toast.error('Ingresa el nombre del paciente');
      return;
    }
    setPreview(generarTexto());
    setMostrando(true);
  };

  const handleGuardar = () => {
    if (!nombre.trim()) return toast.error('Nombre del paciente requerido');
    if (necesitaTutor && !tutor.trim())
      return toast.error(
        'Nombre del responsable/tutor requerido para menor de edad'
      );

    guardar(
      {
        idHistory: id,
        data: {
          tipoTemplate: tipo,
          nombrePaciente: nombre.trim(),
          nombreResponsable: tutor.trim() || null,
          fechaConsentimiento: fecha || null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Consentimiento registrado');
          setNombre('');
          setTutor('');
          setFecha('');
          setPreview('');
          setMostrando(false);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleImprimir = () => {
    if (!nombre.trim()) {
      toast.error('Ingresa el nombre del paciente antes de imprimir');
      return;
    }
    setPreview(generarTexto());

    // Inyectar estilos de impresión si no existen
    if (!document.getElementById('consent-print-styles')) {
      const style = document.createElement('style');
      style.id = 'consent-print-styles';
      style.textContent = PRINT_STYLES;
      document.head.appendChild(style);
    }

    // Esperar un tick para que React actualice el DOM antes de imprimir
    setTimeout(() => window.print(), 100);
  };

  const handleEliminar = (idCons) => {
    if (!window.confirm('¿Eliminar este consentimiento del registro?')) return;
    eliminar(
      { idHistory: id, idConsentimiento: idCons },
      {
        onSuccess: () => toast.success('Consentimiento eliminado'),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const etiquetaTipo = (v) =>
    TIPOS_TEMPLATE.find((t) => t.value === v)?.label ?? v;

  return (
    <div className="w-full rounded-lg shadow-sm border border-gray-100 bg-white">
      {/* HEADER */}
      <div className="bg-[var(--color-primary)] text-white px-8 py-5 rounded-t-lg flex items-center gap-4">
        <FileText size={24} />
        <div>
          <h2 className="text-2xl font-bold">Consentimiento Informado</h2>
          <p className="text-sm opacity-80 mt-0.5">
            RF-09 — Documento legal requerido antes de iniciar procedimientos
          </p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* ── FORMULARIO NUEVO CONSENTIMIENTO ── */}
        <section>
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <PlusCircle size={20} className="text-[var(--color-primary)]" />
            Nuevo consentimiento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tipo */}
            <div className="md:col-span-2">
              <label
                htmlFor="consent-tipo"
                className="block text-sm font-semibold text-gray-600 mb-1"
              >
                Tipo de consentimiento *
              </label>
              <select
                id="consent-tipo"
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setPreview('');
                  setMostrando(false);
                }}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
              >
                {TIPOS_TEMPLATE.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {tipoInfo && (
                <p className="text-xs text-gray-400 mt-1">
                  {tipoInfo.descripcion}
                </p>
              )}
            </div>

            {/* Nombre del paciente */}
            <div>
              <label
                htmlFor="consent-nombre-paciente"
                className="block text-sm font-semibold text-gray-600 mb-1"
              >
                Nombre completo del paciente *
              </label>
              <input
                id="consent-nombre-paciente"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Carlos Pérez López"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
              />
            </div>

            {/* Nombre del tutor (solo menor de edad) */}
            <div>
              <label
                htmlFor="consent-nombre-tutor"
                className="block text-sm font-semibold text-gray-600 mb-1"
              >
                Nombre del padre/madre/tutor
                {necesitaTutor && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                id="consent-nombre-tutor"
                type="text"
                value={tutor}
                onChange={(e) => setTutor(e.target.value)}
                disabled={!necesitaTutor}
                placeholder={
                  necesitaTutor
                    ? 'Requerido para menor de edad'
                    : 'Solo para menores de edad'
                }
                className={`w-full border-2 rounded-lg px-3 py-2 outline-none text-sm transition-colors
                  ${
                    necesitaTutor
                      ? 'border-gray-200 focus:border-[var(--color-primary)]'
                      : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
              />
            </div>

            {/* Fecha */}
            <div>
              <label
                htmlFor="consent-fecha"
                className="block text-sm font-semibold text-gray-600 mb-1"
              >
                Fecha del consentimiento
              </label>
              <input
                id="consent-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-[var(--color-primary)] outline-none text-sm"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {mostrando ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {mostrando ? 'Ocultar vista previa' : 'Vista previa'}
            </button>

            <button
              onClick={handleImprimir}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Printer size={16} />
              Imprimir / Guardar PDF
            </button>

            <Button onClick={handleGuardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar registro'}
            </Button>
          </div>
        </section>

        {/* ── VISTA PREVIA DEL TEXTO ── */}
        {mostrando && preview && (
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
              Vista previa del documento
            </h3>
            <div
              id="consentimiento-print-area"
              ref={printAreaRef}
              className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 whitespace-pre-wrap font-mono text-xs text-gray-800 max-h-96 overflow-y-auto"
            >
              {preview}
            </div>
          </section>
        )}

        {/* ── CONSENTIMIENTOS REGISTRADOS ── */}
        <section>
          <h3 className="text-lg font-bold text-gray-700 mb-3">
            Consentimientos registrados ({lista.length})
          </h3>

          {isLoading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : lista.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                No hay consentimientos registrados para esta historia clínica.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lista.map((c) => (
                <div
                  key={c.id_consentimiento}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-5 py-3 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {etiquetaTipo(c.tipo_template)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Paciente: {c.nombre_paciente}
                      {c.nombre_responsable &&
                        ` · Tutor: ${c.nombre_responsable}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(c.fecha_consentimiento).toLocaleDateString(
                        'es-PE'
                      )}
                      {c.nombre_usuario &&
                        ` · Registrado por: ${c.nombre_usuario} ${c.apellido_usuario ?? ''}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const gen = GENERADORES_TEMPLATE[c.tipo_template];
                        if (gen) {
                          setPreview(
                            gen({
                              nombrePaciente: c.nombre_paciente,
                              nombreResponsable: c.nombre_responsable,
                              fecha: c.fecha_consentimiento
                                ? new Date(
                                    c.fecha_consentimiento
                                  ).toLocaleDateString('es-PE')
                                : null,
                            })
                          );
                          setMostrando(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      title="Ver / Imprimir"
                      className="text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                    >
                      <Printer size={16} />
                    </button>
                    {(user?.role === 'administrador' ||
                      user?.role === 'estudiante') && (
                      <button
                        onClick={() => handleEliminar(c.id_consentimiento)}
                        title="Eliminar"
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
