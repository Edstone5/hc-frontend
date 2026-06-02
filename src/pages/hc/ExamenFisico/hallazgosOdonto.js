// Catálogo oficial de hallazgos del odontograma — SIHCE / NTS N° 150-MINSA/2022/DGIESP.
// Copia sincronizada con el dominio del backend:
//   hc-backend/odontograma/domain/hallazgosCatalogo.js
// (mantener ambos archivos iguales si se modifica el catálogo).
//
// estado: 'bueno' (sigla azul) | 'malo' (sigla roja) | 'neutro'

export const HALLAZGOS_ODONTO = [
  { codigo: 'C', descripcion: 'Caries dental', estado: 'malo' },
  { codigo: 'O', descripcion: 'Obturación con amalgama', estado: 'bueno' },
  { codigo: 'R', descripcion: 'Obturación con resina', estado: 'bueno' },
  { codigo: 'Io', descripcion: 'Obturación con ionómero', estado: 'bueno' },
  { codigo: 'Co', descripcion: 'Corona', estado: 'bueno' },
  { codigo: 'Cf', descripcion: 'Carilla estética', estado: 'bueno' },
  { codigo: 'Cv', descripcion: 'Corona de metal', estado: 'bueno' },
  { codigo: 'Cmc', descripcion: 'Corona metal-cerámica', estado: 'bueno' },
  { codigo: 'Clm', descripcion: 'Corona libre de metal', estado: 'bueno' },
  { codigo: 'Ct', descripcion: 'Corona temporal', estado: 'malo' },
  { codigo: 'PPF', descripcion: 'Prótesis parcial fija', estado: 'bueno' },
  { codigo: 'PPR', descripcion: 'Prótesis parcial removible', estado: 'bueno' },
  { codigo: 'PDC', descripcion: 'Prótesis dental completa', estado: 'bueno' },
  { codigo: 'DNE', descripcion: 'Diente no erupcionado', estado: 'neutro' },
  { codigo: 'DEX', descripcion: 'Diente extraído / perdido', estado: 'malo' },
  { codigo: 'DAO', descripcion: 'Diente ausente otra causa', estado: 'neutro' },
  { codigo: 'I', descripcion: 'Impactación', estado: 'malo' },
  { codigo: 'IMP', descripcion: 'Implante dental', estado: 'bueno' },
  { codigo: 'E', descripcion: 'Pieza ectópica', estado: 'malo' },
  { codigo: 'PC', descripcion: 'Pieza en clavija', estado: 'malo' },
  { codigo: 'MAC', descripcion: 'Macrodoncia', estado: 'malo' },
  { codigo: 'MIC', descripcion: 'Microdoncia', estado: 'malo' },
  { codigo: 'GV-D', descripcion: 'Giroversión derecha', estado: 'malo' },
  { codigo: 'GV-I', descripcion: 'Giroversión izquierda', estado: 'malo' },
  { codigo: 'T', descripcion: 'Transposición', estado: 'malo' },
  { codigo: 'F', descripcion: 'Fusión', estado: 'malo' },
  { codigo: 'G', descripcion: 'Germinación', estado: 'malo' },
  {
    codigo: 'O-def',
    descripcion: 'Defecto del esmalte — Opacidad',
    estado: 'malo',
  },
  {
    codigo: 'PE',
    descripcion: 'Defecto del esmalte — Hipoplasia',
    estado: 'malo',
  },
  { codigo: 'FL', descripcion: 'Fluorosis', estado: 'malo' },
  { codigo: 'FFP', descripcion: 'Fosas y fisuras profundas', estado: 'malo' },
  { codigo: 'M', descripcion: 'Movilidad patológica', estado: 'malo' },
  { codigo: 'D', descripcion: 'Diastema', estado: 'malo' },
  { codigo: 'PP', descripcion: 'Pulpotomía', estado: 'bueno' },
  {
    codigo: 'Endo',
    descripcion: 'Endodoncia / tratamiento de conductos',
    estado: 'bueno',
  },
  { codigo: 'AOF', descripcion: 'Aparato ortodóntico fijo', estado: 'bueno' },
  {
    codigo: 'AOR',
    descripcion: 'Aparato ortodóntico removible',
    estado: 'bueno',
  },
  { codigo: 'Ed-S', descripcion: 'Edéntulo superior', estado: 'malo' },
  { codigo: 'Ed-I', descripcion: 'Edéntulo inferior', estado: 'malo' },
  // ── Hallazgos NTS N° 188-MINSA/DGIESP-2022 añadidos (ADR-0035) ──────────────
  { codigo: 'MB', descripcion: 'Caries — mancha blanca', estado: 'malo' },
  { codigo: 'CE', descripcion: 'Caries en esmalte', estado: 'malo' },
  { codigo: 'CD', descripcion: 'Caries en dentina', estado: 'malo' },
  {
    codigo: 'CDP',
    descripcion: 'Caries en dentina con compromiso pulpar',
    estado: 'malo',
  },
  { codigo: 'EM', descripcion: 'Espigo muñón', estado: 'bueno' },
  { codigo: 'RR', descripcion: 'Remanente radicular', estado: 'malo' },
  { codigo: 'SUP', descripcion: 'Pieza supernumeraria', estado: 'malo' },
  { codigo: 'SELL', descripcion: 'Sellante', estado: 'bueno' },
  { codigo: 'ERU', descripcion: 'Pieza en erupción', estado: 'neutro' },
  { codigo: 'EXT', descripcion: 'Pieza extruida', estado: 'malo' },
  { codigo: 'INT', descripcion: 'Pieza intruida', estado: 'malo' },
  { codigo: 'POS-M', descripcion: 'Posición: mesializado', estado: 'malo' },
  { codigo: 'POS-D', descripcion: 'Posición: distalizado', estado: 'malo' },
  { codigo: 'POS-V', descripcion: 'Posición: vestibularizado', estado: 'malo' },
  { codigo: 'POS-P', descripcion: 'Posición: palatinizado', estado: 'malo' },
  { codigo: 'POS-L', descripcion: 'Posición: lingualizado', estado: 'malo' },
  { codigo: 'DES', descripcion: 'Superficie desgastada', estado: 'malo' },
  { codigo: 'TC', descripcion: 'Tratamiento de conductos', estado: 'bueno' },
  { codigo: 'PLPC', descripcion: 'Pulpectomía', estado: 'bueno' },
  // Restauración definitiva por material (§6.1.33): AM/R/IV/IM/IE (azul). R ya está
  // arriba como resina; O/Io se conservan como legados de "obturación".
  { codigo: 'AM', descripcion: 'Restauración con amalgama', estado: 'bueno' },
  {
    codigo: 'IV',
    descripcion: 'Restauración con ionómero de vidrio',
    estado: 'bueno',
  },
  {
    codigo: 'IM',
    descripcion: 'Restauración — incrustación metálica',
    estado: 'bueno',
  },
  {
    codigo: 'IE',
    descripcion: 'Restauración — incrustación estética',
    estado: 'bueno',
  },
  // Restauración temporal (§6.1.34): contorno en rojo (provisional).
  { codigo: 'RT', descripcion: 'Restauración temporal', estado: 'malo' },
];

// Mapa código → descripción para mostrar en tablas.
export const HALLAZGO_LABEL = HALLAZGOS_ODONTO.reduce((acc, h) => {
  acc[h.codigo] = h.descripcion;
  return acc;
}, {});

// Colores normativos (NTS N° 188-MINSA/DGIESP-2022, que actualiza la N° 150):
//   azul = buen estado / característica no patológica
//   rojo = mal estado / temporal / patológico
// 'neutro' no tiene color obligatorio en la norma → gris (el usuario decide).
export const COLOR_ESTADO = {
  bueno: '#1d4ed8', // azul
  malo: '#dc2626', // rojo
  neutro: '#6b7280', // gris
};

const ESTADO_POR_CODIGO = HALLAZGOS_ODONTO.reduce((acc, h) => {
  acc[h.codigo] = h.estado;
  return acc;
}, {});

// Color normativo (azul/rojo/gris) que corresponde a un código de hallazgo.
export function colorHallazgo(codigo) {
  return COLOR_ESTADO[ESTADO_POR_CODIGO[codigo]] || COLOR_ESTADO.neutro;
}
