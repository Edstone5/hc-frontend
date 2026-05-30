// Panel del Índice de Higiene Oral Simplificado (IHO-S) de Greene y Vermillion.
// 6 dientes índice; cada uno con índice de detritos (DB) y de cálculo (DC), 0-3.
// IHO-S = promedio(DB) + promedio(DC). Clasificación: Bueno/Regular/Malo.
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useIhoS, useSaveIhoS } from '@hooks/useClinico';

// Dientes índice (FDI) y su etiqueta clínica.
const DIENTES = [
  { fdi: 16, label: '1.6' },
  { fdi: 11, label: '1.1' },
  { fdi: 26, label: '2.6' },
  { fdi: 36, label: '3.6' },
  { fdi: 31, label: '3.1' },
  { fdi: 46, label: '4.6' },
];

const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

function clasificar(ihos) {
  if (ihos <= 1.2) return 'Bueno';
  if (ihos <= 3.0) return 'Regular';
  return 'Malo';
}

const COLOR_CLASE = {
  Bueno: '#15803d',
  Regular: '#b45309',
  Malo: '#b91c1c',
};

export default function IhoSPanel({ patientId }) {
  const { data: guardado, isLoading } = useIhoS(patientId);
  const { mutate: guardar, isPending } = useSaveIhoS();

  // Estado local: { [fdi]: { db, dc } }
  const [valores, setValores] = useState(() =>
    DIENTES.reduce((acc, d) => {
      acc[d.fdi] = { db: '', dc: '' };
      return acc;
    }, {})
  );

  const setCampo = (fdi, campo, valor) => {
    // Solo 0-3 o vacío
    if (valor !== '' && !/^[0-3]$/.test(valor)) return;
    setValores((prev) => ({
      ...prev,
      [fdi]: { ...prev[fdi], [campo]: valor },
    }));
  };

  const resumen = useMemo(() => {
    const filas = DIENTES.map((d) => valores[d.fdi]).filter(
      (v) => v.db !== '' || v.dc !== ''
    );
    if (filas.length === 0) return null;
    let sumaDb = 0;
    let sumaDc = 0;
    for (const v of filas) {
      sumaDb += Number(v.db || 0);
      sumaDc += Number(v.dc || 0);
    }
    const idb = round2(sumaDb / filas.length);
    const icalc = round2(sumaDc / filas.length);
    const ihos = round2(idb + icalc);
    return {
      idb,
      icalc,
      ihos,
      clasificacion: clasificar(ihos),
      n: filas.length,
    };
  }, [valores]);

  const handleGuardar = () => {
    const payload = DIENTES.map((d) => ({
      diente: d.fdi,
      db: Number(valores[d.fdi].db || 0),
      dc: Number(valores[d.fdi].dc || 0),
    })).filter((_, i) => {
      const v = valores[DIENTES[i].fdi];
      return v.db !== '' || v.dc !== '';
    });
    if (payload.length === 0) {
      return toast.error('Ingresa al menos un diente índice (DB/DC).');
    }
    guardar(
      { idHistory: patientId, data: { valores: payload } },
      {
        onSuccess: (r) =>
          toast.success(
            `IHO-S guardado: ${r?.resumen?.ihos ?? ''} (${r?.resumen?.clasificacion ?? ''}).`
          ),
        onError: (e) => toast.error(e.message || 'Error al guardar IHO-S'),
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
        IHO-S — Índice de Higiene Oral Simplificado
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280' }}>
        Greene y Vermillion. DB = detritos (0-3), DC = cálculo (0-3) en 6
        dientes índice. IHO-S = promedio(DB) + promedio(DC).
      </p>

      {/* Último registro guardado */}
      {!isLoading && guardado?.ihos != null && (
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
          Último registro: IHO-S <strong>{guardado.ihos}</strong> (
          {guardado.clasificacion}) — IDB {guardado.idb} / ICalc{' '}
          {guardado.icalc}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={th}>Diente</th>
              {DIENTES.map((d) => (
                <th key={d.fdi} style={th}>
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['db', 'dc'].map((campo) => (
              <tr key={campo}>
                <td style={{ ...td, fontWeight: 700 }}>
                  {campo.toUpperCase()}
                </td>
                {DIENTES.map((d) => (
                  <td key={d.fdi} style={td}>
                    <input
                      aria-label={`${campo.toUpperCase()} diente ${d.label}`}
                      value={valores[d.fdi][campo]}
                      onChange={(e) => setCampo(d.fdi, campo, e.target.value)}
                      inputMode="numeric"
                      maxLength={1}
                      style={{
                        width: 40,
                        textAlign: 'center',
                        border: '2px solid #e5e7eb',
                        borderRadius: 6,
                        padding: '4px',
                        outline: 'none',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen en vivo */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          marginTop: 14,
          flexWrap: 'wrap',
        }}
      >
        {resumen ? (
          <>
            <span style={{ fontSize: 13 }}>
              IDB <strong>{resumen.idb}</strong> · ICalc{' '}
              <strong>{resumen.icalc}</strong>
            </span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              IHO-S: {resumen.ihos}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 999,
                color: 'white',
                background: COLOR_CLASE[resumen.clasificacion],
              }}
            >
              {resumen.clasificacion}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            Ingresa valores para calcular el índice.
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
          {isPending ? 'Guardando...' : 'Guardar IHO-S'}
        </button>
      </div>
    </div>
  );
}

const th = {
  padding: '6px 10px',
  textAlign: 'center',
  fontSize: 11,
  fontWeight: 700,
  color: '#6b7280',
  borderBottom: '1px solid #e5e7eb',
};
const td = {
  padding: '6px 10px',
  textAlign: 'center',
  color: '#374151',
};
