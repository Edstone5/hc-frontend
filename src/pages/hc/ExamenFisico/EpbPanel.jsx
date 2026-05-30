// Panel del Examen Periodontal Básico (EPB / PSR — Periodontal Screening and
// Recording). 6 sextantes; cada uno con código OMS 0-4 + furca y movilidad.
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useEpb, useSaveEpb } from '@hooks/useClinico';

// Sextantes y su rango FDI orientativo.
const SEXTANTES = [
  { n: 1, label: 'S1 (1.8–1.4)' },
  { n: 2, label: 'S2 (1.3–2.3)' },
  { n: 3, label: 'S3 (2.4–2.8)' },
  { n: 4, label: 'S4 (3.8–3.4)' },
  { n: 5, label: 'S5 (3.3–4.3)' },
  { n: 6, label: 'S6 (4.4–4.8)' },
];

const CODIGOS = [
  { v: 0, desc: 'Sano' },
  { v: 1, desc: 'Sangrado al sondaje' },
  { v: 2, desc: 'Cálculo / obturación desbordante' },
  { v: 3, desc: 'Bolsa 3.5–5.5 mm' },
  { v: 4, desc: 'Bolsa ≥ 6 mm' },
];

const COLOR_CODIGO = ['#15803d', '#65a30d', '#b45309', '#ea580c', '#b91c1c'];

export default function EpbPanel({ patientId }) {
  const { data: guardado, isLoading } = useEpb(patientId);
  const { mutate: guardar, isPending } = useSaveEpb();

  // Estado local: { [sextante]: { codigo:'', furca:false, movilidad:false } }
  const [valores, setValores] = useState(() =>
    SEXTANTES.reduce((acc, s) => {
      acc[s.n] = { codigo: '', furca: false, movilidad: false };
      return acc;
    }, {})
  );

  const setCampo = (n, campo, valor) =>
    setValores((prev) => ({ ...prev, [n]: { ...prev[n], [campo]: valor } }));

  const codigoMax = useMemo(() => {
    const conDato = SEXTANTES.map((s) => valores[s.n]).filter(
      (v) => v.codigo !== ''
    );
    if (conDato.length === 0) return null;
    return conDato.reduce((m, v) => Math.max(m, Number(v.codigo)), 0);
  }, [valores]);

  const handleGuardar = () => {
    const payload = SEXTANTES.filter((s) => valores[s.n].codigo !== '').map(
      (s) => ({
        sextante: s.n,
        codigo: Number(valores[s.n].codigo),
        furca: valores[s.n].furca,
        movilidad: valores[s.n].movilidad,
      })
    );
    if (payload.length === 0) {
      return toast.error('Asigna un código a al menos un sextante.');
    }
    guardar(
      { idHistory: patientId, data: { valores: payload } },
      {
        onSuccess: (r) =>
          toast.success(
            `EPB guardado. Código máximo: ${r?.resumen?.codigoMax ?? ''}.`
          ),
        onError: (e) => toast.error(e.message || 'Error al guardar EPB'),
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
      <h3
        style={{
          margin: '0 0 4px',
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--color-primary)',
        }}
      >
        EPB — Examen Periodontal Básico (PSR)
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280' }}>
        Código OMS por sextante: 0 sano · 1 sangrado · 2 cálculo · 3 bolsa
        3.5–5.5 mm · 4 bolsa ≥ 6 mm. Marca furca (F) y movilidad (M) si aplica.
      </p>

      {!isLoading && guardado?.codigo_max != null && (
        <div
          style={{
            fontSize: 12,
            color: '#374151',
            background: '#f3f4f6',
            borderRadius: 6,
            padding: '6px 10px',
            marginBottom: 12,
          }}
        >
          Último registro: código máximo <strong>{guardado.codigo_max}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SEXTANTES.map((s) => {
          const v = valores[s.n];
          return (
            <div
              key={s.n}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                borderBottom: '1px solid #f3f4f6',
                paddingBottom: 8,
              }}
            >
              <span
                style={{
                  width: 110,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#374151',
                }}
              >
                {s.label}
              </span>
              <select
                aria-label={`Código sextante ${s.n}`}
                value={v.codigo}
                onChange={(e) => setCampo(s.n, 'codigo', e.target.value)}
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '5px 8px',
                  fontSize: 13,
                  minWidth: 230,
                }}
              >
                <option value="">— Código —</option>
                {CODIGOS.map((c) => (
                  <option key={c.v} value={c.v}>
                    {c.v} — {c.desc}
                  </option>
                ))}
              </select>
              {v.codigo !== '' && (
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: COLOR_CODIGO[Number(v.codigo)],
                  }}
                  title={`Código ${v.codigo}`}
                />
              )}
              <label style={{ fontSize: 12, display: 'flex', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={v.furca}
                  onChange={(e) => setCampo(s.n, 'furca', e.target.checked)}
                />
                Furca
              </label>
              <label style={{ fontSize: 12, display: 'flex', gap: 4 }}>
                <input
                  type="checkbox"
                  checked={v.movilidad}
                  onChange={(e) => setCampo(s.n, 'movilidad', e.target.checked)}
                />
                Movilidad
              </label>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: 14,
          flexWrap: 'wrap',
        }}
      >
        {codigoMax != null ? (
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            Código máximo: {codigoMax}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            Asigna códigos para ver el resumen.
          </span>
        )}
        <button
          onClick={handleGuardar}
          disabled={isPending}
          style={{
            marginLeft: 'auto',
            background: isPending ? '#93c5fd' : 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Guardando...' : 'Guardar EPB'}
        </button>
      </div>
    </div>
  );
}
