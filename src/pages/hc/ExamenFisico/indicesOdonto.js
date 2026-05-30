// Cálculo de los índices de experiencia de caries CPO-D y CEO-D a partir de las
// entradas estructuradas del odontograma (Bloque 3 — RF-12).
//
//   CPO-D (dentición permanente, FDI 11-48):
//     C = piezas Cariadas, P = Perdidas (extraídas), O = Obturadas.
//   CEO-D (dentición decidua, FDI 51-85):
//     c = cariadas, e = extraídas/indicadas, o = obturadas.
//
// Regla anti-doble-conteo: cada diente se cuenta UNA sola vez, con prioridad
// Cariado > Perdido > Obturado (criterio simplificado para uso académico).

// Mapa código de hallazgo (NTS-150) → clase del índice.
const CLASE_POR_HALLAZGO = {
  C: 'cariado',
  DEX: 'perdido',
  O: 'obturado',
  R: 'obturado',
  Io: 'obturado',
};

const PRIORIDAD = { cariado: 3, perdido: 2, obturado: 1 };

function esPermanente(d) {
  return d >= 11 && d <= 48;
}
function esDecidua(d) {
  return d >= 51 && d <= 85;
}

/**
 * @param {Array<{numero_diente:number, codigo_hallazgo?:string}>} entradas
 * @returns {{cpod:{c:number,p:number,o:number,total:number},
 *            ceod:{c:number,e:number,o:number,total:number},
 *            sinDatos:boolean}}
 */
export function calcularIndices(entradas = []) {
  // Mejor clase por diente (una entrada por diente, la de mayor prioridad).
  const mejorClasePerm = new Map();
  const mejorClaseDecid = new Map();

  for (const e of entradas) {
    const clase = CLASE_POR_HALLAZGO[e?.codigo_hallazgo];
    if (!clase) continue;
    const diente = Number(e.numero_diente);
    const destino = esPermanente(diente)
      ? mejorClasePerm
      : esDecidua(diente)
        ? mejorClaseDecid
        : null;
    if (!destino) continue;
    const actual = destino.get(diente);
    if (!actual || PRIORIDAD[clase] > PRIORIDAD[actual]) {
      destino.set(diente, clase);
    }
  }

  const contar = (mapa) => {
    let c = 0;
    let p = 0;
    let o = 0;
    for (const clase of mapa.values()) {
      if (clase === 'cariado') c++;
      else if (clase === 'perdido') p++;
      else if (clase === 'obturado') o++;
    }
    return { c, p, o, total: c + p + o };
  };

  const cpod = contar(mejorClasePerm);
  const ceodRaw = contar(mejorClaseDecid);

  return {
    cpod,
    ceod: { c: ceodRaw.c, e: ceodRaw.p, o: ceodRaw.o, total: ceodRaw.total },
    sinDatos: cpod.total === 0 && ceodRaw.total === 0,
  };
}
