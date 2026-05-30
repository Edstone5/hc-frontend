// Leyenda normativa del odontograma (NTS N° 188-MINSA/DGIESP-2022).
// La norma exige registrar siglas conforme y respetar el código de color
// (azul = buen estado/no patológico, rojo = mal estado/temporal/patológico).
// Esta leyenda mantiene esas siglas y colores siempre visibles en pantalla.
import { useState } from 'react';
import { HALLAZGOS_ODONTO, COLOR_ESTADO } from './hallazgosOdonto';

const GRUPOS = [
  {
    estado: 'bueno',
    titulo: 'Buen estado / no patológico',
    color: COLOR_ESTADO.bueno,
    nota: 'azul',
  },
  {
    estado: 'malo',
    titulo: 'Mal estado / temporal / patológico',
    color: COLOR_ESTADO.malo,
    nota: 'rojo',
  },
  {
    estado: 'neutro',
    titulo: 'Sin color obligatorio',
    color: COLOR_ESTADO.neutro,
    nota: 'gris',
  },
];

export default function LeyendaOdonto() {
  const [abierta, setAbierta] = useState(false);

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <button
        onClick={() => setAbierta((s) => !s)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-primary)',
        }}
      >
        <span>{abierta ? '▾' : '▸'}</span>
        Leyenda de hallazgos (NTS N° 188-MINSA/2022)
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 500,
            color: '#6b7280',
          }}
        >
          azul = buen estado · rojo = mal estado
        </span>
      </button>

      {abierta && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginTop: 12,
          }}
        >
          {GRUPOS.map((g) => {
            const items = HALLAZGOS_ODONTO.filter((h) => h.estado === g.estado);
            if (items.length === 0) return null;
            return (
              <div key={g.estado}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: g.color,
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}
                  >
                    {g.titulo}
                  </span>
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    fontSize: 12,
                  }}
                >
                  {items.map((h) => (
                    <li
                      key={h.codigo}
                      style={{
                        display: 'flex',
                        gap: 6,
                        padding: '1px 0',
                        color: '#4b5563',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: g.color,
                          minWidth: 42,
                        }}
                      >
                        {h.codigo}
                      </span>
                      <span>{h.descripcion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
