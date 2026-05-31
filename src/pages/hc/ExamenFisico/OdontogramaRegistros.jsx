// Registro de intervenciones estructuradas del odontograma (RF-06).
// Extraído de odonto.jsx (Track D) para reducir su tamaño. Componente
// autocontenido: gestiona su propio formulario y consume sus hooks.
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useOdontograma,
  useAddOdontogramaEntrada,
  useDeleteOdontogramaEntrada,
} from '@hooks/useClinico';
import {
  HALLAZGOS_ODONTO,
  HALLAZGO_LABEL,
  colorHallazgo,
} from './hallazgosOdonto';

const SUPERFICIES = ['vestibular', 'lingual', 'mesial', 'distal', 'oclusal'];
const TIPO_INICIAL = 'INICIAL';
const FORM_INICIAL = {
  numeroDiente: '',
  superficie: '',
  codigoHallazgo: '',
  diagnostico: '',
  tratamiento: '',
  fecha: new Date().toISOString().split('T')[0],
  alumno: '',
};

function formatFecha(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-PE');
}

export default function OdontogramaRegistros({
  patientId,
  tipo,
  selectedTooth = null,
}) {
  const { data: entradas = [], isLoading: cargandoEntradas } =
    useOdontograma(patientId);
  const { mutate: agregarEntrada, isPending: agregando } =
    useAddOdontogramaEntrada();
  const { mutate: eliminarEntrada } = useDeleteOdontogramaEntrada();

  const [formEntrada, setFormEntrada] = useState(FORM_INICIAL);
  const [mostrarFormEntrada, setMostrarFormEntrada] = useState(false);

  const handleAgregarEntrada = () => {
    if (!formEntrada.numeroDiente)
      return toast.error('Número de diente requerido');
    agregarEntrada(
      {
        idHistory: patientId,
        data: { ...formEntrada, tipo },
      },
      {
        onSuccess: () => {
          toast.success('Intervención registrada en la historia clínica');
          setFormEntrada(FORM_INICIAL);
          setMostrarFormEntrada(false);
        },
        onError: (e) => toast.error(e.message || 'Error al registrar'),
      }
    );
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 8,
        padding: 20,
        marginTop: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Cabecera de sección */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-primary)',
            }}
          >
            Registro de Intervenciones
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
            Historial clínico por diente — guardado en la historia clínica
          </p>
        </div>
        <button
          onClick={() => {
            // Al abrir el formulario, prefijar el diente seleccionado por
            // click en el SVG (Track C1): "1.6" → FDI "16".
            setMostrarFormEntrada((s) => {
              const abriendo = !s;
              if (abriendo && selectedTooth && !formEntrada.numeroDiente) {
                setFormEntrada((prev) => ({
                  ...prev,
                  numeroDiente: selectedTooth.replace('.', ''),
                }));
              }
              return abriendo;
            });
          }}
          style={{
            background: mostrarFormEntrada ? '#e5e7eb' : 'var(--color-primary)',
            color: mostrarFormEntrada ? '#374151' : 'white',
            border: 'none',
            borderRadius: 6,
            padding: '7px 16px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {mostrarFormEntrada ? 'Cancelar' : '+ Nueva intervención'}
        </button>
      </div>

      {/* Formulario de nueva entrada */}
      {mostrarFormEntrada && (
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Registrar intervención por diente
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            {/* Nº Diente */}
            <div>
              <label
                htmlFor="entrada-diente"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginBottom: 4,
                }}
              >
                Nº Diente (FDI) *
              </label>
              <input
                id="entrada-diente"
                type="number"
                min="11"
                max="85"
                value={formEntrada.numeroDiente}
                onChange={(e) =>
                  setFormEntrada({
                    ...formEntrada,
                    numeroDiente: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Superficie */}
            <div>
              <label
                htmlFor="entrada-superficie"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginBottom: 4,
                }}
              >
                Superficie
              </label>
              <select
                id="entrada-superficie"
                value={formEntrada.superficie}
                onChange={(e) =>
                  setFormEntrada({
                    ...formEntrada,
                    superficie: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Todas</option>
                {SUPERFICIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Hallazgo (catálogo NTS N° 188) */}
            <div>
              <label
                htmlFor="entrada-hallazgo"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginBottom: 4,
                }}
              >
                Hallazgo (NTS N° 188)
              </label>
              <select
                id="entrada-hallazgo"
                value={formEntrada.codigoHallazgo}
                onChange={(e) => {
                  const codigo = e.target.value;
                  const item = HALLAZGOS_ODONTO.find(
                    (h) => h.codigo === codigo
                  );
                  setFormEntrada((prev) => ({
                    ...prev,
                    codigoHallazgo: codigo,
                    diagnostico:
                      prev.diagnostico || (item ? item.descripcion : ''),
                  }));
                }}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">— Seleccionar —</option>
                {HALLAZGOS_ODONTO.map((h) => (
                  <option key={h.codigo} value={h.codigo}>
                    {h.codigo} — {h.descripcion}
                  </option>
                ))}
              </select>
              {formEntrada.codigoHallazgo && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                    fontSize: 11,
                    color: '#6b7280',
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: colorHallazgo(formEntrada.codigoHallazgo),
                      display: 'inline-block',
                    }}
                  />
                  Color normativo (NTS N° 188)
                </div>
              )}
            </div>

            {/* Fecha */}
            <div>
              <label
                htmlFor="entrada-fecha"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginBottom: 4,
                }}
              >
                Fecha
              </label>
              <input
                id="entrada-fecha"
                type="date"
                value={formEntrada.fecha}
                onChange={(e) =>
                  setFormEntrada({ ...formEntrada, fecha: e.target.value })
                }
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Diagnóstico */}
            <div style={{ gridColumn: 'span 2' }}>
              <label
                htmlFor="entrada-diagnostico"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginBottom: 4,
                }}
              >
                Diagnóstico
              </label>
              <textarea
                id="entrada-diagnostico"
                value={formEntrada.diagnostico}
                onChange={(e) =>
                  setFormEntrada({
                    ...formEntrada,
                    diagnostico: e.target.value,
                  })
                }
                rows={2}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 13,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Tratamiento */}
            <div>
              <label
                htmlFor="entrada-tratamiento"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginBottom: 4,
                }}
              >
                Tratamiento
              </label>
              <textarea
                id="entrada-tratamiento"
                value={formEntrada.tratamiento}
                onChange={(e) =>
                  setFormEntrada({
                    ...formEntrada,
                    tratamiento: e.target.value,
                  })
                }
                rows={2}
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 13,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Alumno tratante */}
            <div style={{ gridColumn: 'span 3' }}>
              <label
                htmlFor="entrada-alumno"
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6b7280',
                  marginBottom: 4,
                }}
              >
                Alumno tratante
              </label>
              <input
                id="entrada-alumno"
                type="text"
                value={formEntrada.alumno}
                onChange={(e) =>
                  setFormEntrada({ ...formEntrada, alumno: e.target.value })
                }
                style={{
                  width: '100%',
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Botones del formulario */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <button
              onClick={() => setMostrarFormEntrada(false)}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: 6,
                padding: '7px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAgregarEntrada}
              disabled={agregando}
              style={{
                background: agregando ? '#93c5fd' : 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '7px 16px',
                cursor: agregando ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {agregando ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla de intervenciones */}
      {cargandoEntradas ? (
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          Cargando intervenciones...
        </p>
      ) : entradas.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: 13,
            padding: '24px 0',
          }}
        >
          Sin intervenciones registradas. Usa el botón &ldquo;Nueva
          intervención&rdquo; para agregar.
        </p>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
          }}
        >
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {[
                  'Diente',
                  'Superficie',
                  'Hallazgo',
                  'Diagnóstico',
                  'Tratamiento',
                  'Alumno',
                  'Tipo',
                  'Fecha',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#6b7280',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entradas.map((entrada) => (
                <tr
                  key={entrada.id_entrada}
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#eff6ff')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'white')
                  }
                >
                  <td
                    style={{
                      padding: '8px 12px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      textAlign: 'center',
                    }}
                  >
                    {entrada.numero_diente}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      textTransform: 'capitalize',
                      color: '#374151',
                    }}
                  >
                    {entrada.superficie || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#374151' }}>
                    {entrada.codigo_hallazgo ? (
                      <span
                        title={
                          HALLAZGO_LABEL[entrada.codigo_hallazgo] ||
                          entrada.codigo_hallazgo
                        }
                        style={{
                          fontWeight: 700,
                          color: colorHallazgo(entrada.codigo_hallazgo),
                        }}
                      >
                        {entrada.codigo_hallazgo}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#374151' }}>
                    {entrada.diagnostico || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#374151' }}>
                    {entrada.tratamiento || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#374151' }}>
                    {entrada.alumno || '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background:
                          entrada.tipo === TIPO_INICIAL ? '#dbeafe' : '#dcfce7',
                        color:
                          entrada.tipo === TIPO_INICIAL ? '#1d4ed8' : '#15803d',
                      }}
                    >
                      {entrada.tipo === TIPO_INICIAL ? 'Inicial' : 'Evolución'}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      color: '#9ca3af',
                      fontSize: 12,
                    }}
                  >
                    {formatFecha(entrada.fecha)}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <button
                      onClick={() =>
                        eliminarEntrada(
                          {
                            idHistory: patientId,
                            idEntrada: entrada.id_entrada,
                          },
                          {
                            onSuccess: () => toast.success('Entrada eliminada'),
                            onError: () => toast.error('Error al eliminar'),
                          }
                        )
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: 0,
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
