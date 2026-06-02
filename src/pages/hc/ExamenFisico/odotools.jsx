// src/pages/hc/ExamenFisico/odotools.jsx
/**
 * Panel de herramientas del odontograma — NTS N° 188-MINSA/DGIESP-2022.
 *
 * Cambios 2026-05-31 (ADR-0016): bugs de useState/coordenadas/window.prompt
 * y rediseño en 6 secciones clínicas. Ver ADR-0016.
 *
 * Cambios 2026-05-31 (ADR-0017):
 *
 * 1. SECCIÓN PRÓTESIS — PPF y PPR no funcionaban:
 *    - Los handlers descartaban el handle del modo interactivo (no se guardaba
 *      en activeTool), así que no había banner "Detener" ni forma de cancelar.
 *    - addPPF / addDentalProsthesis (PPR) / addTransposition detectaban el
 *      diente con findToothGroupFromEvent, que exige clic EXACTO sobre el trazo
 *      del diente (relleno transparente) → la mayoría de clics caían en el fondo
 *      y se ignoraban ("Clic ignorado"). PDC funcionaba porque NO requiere clic
 *      (dibuja entre molares terminales fijos).
 *    - FIX (hook odotools.js): clic robusto vía toothGroupFromEventRobust
 *      (diente más cercano, umbral 120px) + callback onEnd(drew) para rastreo.
 *
 * 2. PANEL "TRATAMIENTOS APLICADOS" con borrado individual:
 *    - Cada herramienta aplicada se registra en una lista visible (sigla, diente,
 *      color). El registro se hace por DIFERENCIA del overlay SVG: se fotografían
 *      los hijos del overlay antes de aplicar y los nuevos se etiquetan con
 *      data-rec=<id>. Esto funciona para herramientas síncronas y para modos
 *      interactivos (vía onEnd), sin reescribir cada función del hook.
 *    - Eliminar un ítem borra del SVG los elementos data-rec=<id> y limpia el
 *      input del diente asociado. Corrige errores humanos de selección sin
 *      borrar todo el odontograma.
 *    - La lista es de sesión (refleja lo dibujado en el editor). El SVG completo
 *      se sigue persistiendo con "Guardar cambios" (tabla odontograma_svg).
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import odontogramaTools from '../../../hooks/odotools';

export default function OdontogramaToolsPanel({
  onSaveVersion,
  onLoadVersion,
  selectedTooth = null,
  onClearTooth,
}) {
  // ── Catálogos ────────────────────────────────────────────────────────
  const crownTypes = ['CM', 'CF', 'CMC', 'CV', 'CLM'];
  const colors = ['blue', 'red'];
  const defectTypes = ['O', 'PE', 'Fluorosis'];
  const missingToothTypes = ['DNE', 'DEX', 'DAO'];
  const pdcTypes = [
    { id: 'SUP_PERM', label: 'Superior Permanentes' },
    { id: 'SUP_DECID', label: 'Superior Deciduos' },
    { id: 'INF_PERM', label: 'Inferior Permanentes' },
    { id: 'INF_DECID', label: 'Inferior Deciduos' },
  ];

  // ── Estado de menús ──────────────────────────────────────────────────
  const [coronaMenuOpen, setCoronaMenuOpen] = useState(false);
  const [, setCoronaTempMenuOpen] = useState(false);
  const [defectMenuOpen, setDefectMenuOpen] = useState(false);
  const [edentuloMenuOpen, setEdentuloMenuOpen] = useState(false);
  const [implantMenuOpen, setImplantMenuOpen] = useState(false);
  const [giroMenuOpen, setGiroMenuOpen] = useState(false);
  const [pdaMenuOpen, setPDAMenuOpen] = useState(false);
  const [pdcMenuOpen, setPDCMenuOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  // Modal de selección de diente contiguo para FUSIÓN ({ tooth, options }|null).
  const [fusionModal, setFusionModal] = useState(null);

  // ── Herramienta de modo interactivo ─────────────────────────────────
  const [activeTool, setActiveTool] = useState(null);
  const [activeToolName, setActiveToolName] = useState(null);

  // ── Color NTS-188: azul = buen estado / rojo = mal estado ───────────
  const [colorActivo, setColorActivo] = useState('blue');

  // ── Lista de tratamientos aplicados (ADR-0017) ──────────────────────
  // Cada registro: { id, label, tooth|null, color, ts }
  const [treatments, setTreatments] = useState([]);

  useEffect(() => {
    return () => {
      if (activeTool && typeof activeTool.stop === 'function') {
        try {
          activeTool.stop();
        } catch {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeAllMenus = () => {
    setCoronaMenuOpen(false);
    setCoronaTempMenuOpen(false);
    setDefectMenuOpen(false);
    setEdentuloMenuOpen(false);
    setImplantMenuOpen(false);
    setGiroMenuOpen(false);
    setPDAMenuOpen(false);
    setPDCMenuOpen(false);
  };

  const toggleMenu = (currentVal, setter) => {
    const next = !currentVal;
    closeAllMenus();
    setter(next);
  };

  // ── Helpers de entrada ───────────────────────────────────────────────
  const askTooth = (msg = 'Ingresa el diente (ej: 1.6)') => {
    if (selectedTooth) return selectedTooth;
    const t = window.prompt(msg);
    return t ? t.trim() : null;
  };

  const askColor = () => colorActivo;

  const stopActiveTool = () => {
    if (activeTool && typeof activeTool.stop === 'function') {
      try {
        activeTool.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setActiveTool(null);
    setActiveToolName(null);
  };

  // ====================================================================
  // RASTREO DE TRATAMIENTOS (ADR-0017)
  // ====================================================================

  const genId = () =>
    `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Fotografía los hijos actuales del overlay SVG.
  const snapshotOverlay = () => {
    const svg = odontogramaTools.getSvg();
    const ov = svg && svg.querySelector('#odontograma-overlay');
    return ov ? new Set(Array.from(ov.children)) : new Set();
  };

  // Etiqueta los nuevos hijos del overlay con data-rec=id y crea el registro.
  const pushRecord = (beforeSet, { label, tooth, color }) => {
    const id = genId();
    const svg = odontogramaTools.getSvg();
    const ov = svg && svg.querySelector('#odontograma-overlay');
    if (ov) {
      Array.from(ov.children).forEach((el) => {
        if (!beforeSet.has(el)) el.setAttribute('data-rec', id);
      });
    }
    setTreatments((prev) => [
      ...prev,
      { id, label, tooth: tooth || null, color, ts: Date.now() },
    ]);
  };

  // ── Reglas de exclusión clínica (NTS-188 / ADR-0020) ────────────────────
  // El odontograma registra hallazgos POR SUPERFICIE, así que un diente admite
  // VARIOS tratamientos a la vez (p.ej. caries en oclusal + obturación en mesial).
  // Pero hay combinaciones clínicamente imposibles. Regla v1:
  //   - Una pieza marcada AUSENTE (PDA: DNE/DEX/DAO) no puede recibir otros
  //     tratamientos en el mismo odontograma → se BLOQUEA.
  //   - Marcar AUSENTE una pieza que ya tiene registros se PERMITE pero ADVIERTE
  //     (es válido en evolución: pieza tratada y luego extraída).
  const esAusente = (label = '') =>
    /pieza ausente|\b(?:DNE|DEX|DAO)\b/i.test(label);

  // Matriz de exclusión mutua (espejo de la del backend, ADR-0022). Clasifica una
  // etiqueta de tratamiento en { grupo, variante }: dos variantes DISTINTAS del
  // mismo grupo no pueden coexistir en la misma pieza.
  const grupoDe = (label = '') => {
    // Anomalías de tamaño/forma de la corona (NTS N° 188-MINSA): una pieza no
    // puede ser a la vez macrodoncia, microdoncia o clavija (conoide).
    if (/macrodoncia/i.test(label)) return { g: 'tamaño/forma', v: 'MAC' };
    if (/microdoncia/i.test(label)) return { g: 'tamaño/forma', v: 'MIC' };
    if (/clavija/i.test(label)) return { g: 'tamaño/forma', v: 'PC' };
    if (/giroversión\s+derecha/i.test(label))
      return { g: 'giroversión', v: 'D' };
    if (/giroversión\s+izquierda/i.test(label))
      return { g: 'giroversión', v: 'I' };
    if (/^corona/i.test(label)) return { g: 'corona', v: label }; // una corona por pieza
    // Doble formación (ADR-0024): fusión y germinación son mutuamente excluyentes
    // en la misma pieza (un diente no puede ser ambas a la vez).
    if (/fusi[oó]n/i.test(label)) return { g: 'doble formación', v: 'F' };
    if (/germinaci[oó]n/i.test(label)) return { g: 'doble formación', v: 'G' };
    return null;
  };

  const validarExclusion = (tooth, label) => {
    if (!tooth) return { ok: true };
    const previos = treatments.filter((t) => t.tooth === tooth);
    if (!previos.length) return { ok: true };

    // 1) Pieza ausente.
    const yaAusente = previos.some((t) => esAusente(t.label));
    const nuevoAusente = esAusente(label);
    if (yaAusente && !nuevoAusente) {
      return {
        ok: false,
        msg: `La pieza ${tooth} está marcada como AUSENTE: no admite otros tratamientos en este odontograma. Elimina la marca de ausencia primero.`,
      };
    }
    if (nuevoAusente && !yaAusente) {
      return {
        ok: true,
        warn: `La pieza ${tooth} ya tiene ${previos.length} registro(s); marcarla como AUSENTE puede ser inconsistente en un odontograma inicial.`,
      };
    }

    // 2) Grupos de exclusión mutua (tamaño, giroversión, corona).
    const gNuevo = grupoDe(label);
    if (gNuevo) {
      const conflicto = previos.find((t) => {
        const gp = grupoDe(t.label);
        return gp && gp.g === gNuevo.g && gp.v !== gNuevo.v;
      });
      if (conflicto) {
        return {
          ok: false,
          msg: `La pieza ${tooth} ya tiene "${conflicto.label}", incompatible con "${label}". Elimina el tratamiento previo primero.`,
        };
      }
    }

    return { ok: true };
  };

  // Wrapper síncrono: valida exclusión → fotografía → aplica → registra.
  const track = (label, tooth, color, drawFn) => {
    const ex = validarExclusion(tooth, label);
    if (!ex.ok) {
      toast.error(ex.msg);
      return false;
    }
    if (ex.warn) toast(ex.warn, { icon: '⚠️', duration: 5000 });
    const before = snapshotOverlay();
    let ok;
    try {
      ok = drawFn();
    } catch (e) {
      console.error(e);
      toast.error(
        'Ocurrió un error al aplicar el tratamiento. Revisa la consola.'
      );
      return false;
    }
    if (ok === false) return false;
    pushRecord(before, { label, tooth, color });
    return true;
  };

  // Wrapper para modos interactivos: registra al completar (onEnd(drew)).
  const startInteractive = (label, color, starter) => {
    const before = snapshotOverlay();
    const finish = (drew) => {
      setActiveTool(null);
      setActiveToolName(null);
      if (drew) pushRecord(before, { label, tooth: null, color });
    };
    let handle;
    try {
      handle = starter(finish);
    } catch (e) {
      console.error(e);
      toast.error('No se pudo iniciar el modo. Revisa la consola.');
      return;
    }
    if (handle && typeof handle.stop === 'function') {
      setActiveTool(handle);
      setActiveToolName(label);
    }
  };

  // Elimina un tratamiento: borra sus elementos SVG y limpia el input del diente.
  const removeTreatment = (rec) => {
    const svg = odontogramaTools.getSvg();
    const ov = svg && svg.querySelector('#odontograma-overlay');
    if (ov) {
      ov.querySelectorAll(`[data-rec="${rec.id}"]`).forEach((el) =>
        el.remove()
      );
    }
    if (rec.tooth) clearInputForTooth(rec.tooth);
    setTreatments((prev) => prev.filter((t) => t.id !== rec.id));
    toast.success(`Tratamiento "${rec.label}" eliminado.`);
  };

  // ── foreignObjectBBoxInSvg (espacio viewBox, ver ADR-0016) ───────────
  function foreignObjectBBoxInSvg(svg, fo) {
    try {
      const rect = fo.getBoundingClientRect();
      const screenCTM = svg.getScreenCTM();
      if (!screenCTM) return null;
      const inv = screenCTM.inverse();
      const pTL = svg.createSVGPoint();
      pTL.x = rect.left;
      pTL.y = rect.top;
      const pBR = svg.createSVGPoint();
      pBR.x = rect.right;
      pBR.y = rect.bottom;
      const tTL = pTL.matrixTransform(inv);
      const tBR = pBR.matrixTransform(inv);
      return {
        x: Math.min(tTL.x, tBR.x),
        y: Math.min(tTL.y, tBR.y),
        width: Math.abs(tBR.x - tTL.x),
        height: Math.abs(tBR.y - tTL.y),
      };
    } catch {
      return null;
    }
  }

  function rectIntersectionArea(a, b) {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.width, b.x + b.width);
    const y2 = Math.min(a.y + a.height, b.y + b.height);
    if (x2 <= x1 || y2 <= y1) return 0;
    return (x2 - x1) * (y2 - y1);
  }

  // Devuelve el <input> asociado a un diente.
  //
  // ESTRATEGIA 1 (determinista): en el SVG, cada diente va seguido en el DOM por
  // su <text> y su <foreignObject> (p.ej. tooth_7_3 → text 7.3 → input34). Se
  // busca el foreignObject hermano que sigue al grupo del diente. Esto es exacto
  // y evita el bug de mapeo geométrico con dientes deciduos (donde el bbox podía
  // solaparse con el input de otro diente, p.ej. 7.3 escribía en 3.8).
  //
  // ESTRATEGIA 2 (respaldo): si no se encuentra por DOM, se usa la geometría
  // (overlap/cercanía en espacio viewBox).
  function pickInputForTooth(svg, tooth) {
    // --- Estrategia 1: hermano en el DOM ---
    const group = svg.querySelector(`.tooth-group[data-name="${tooth}"]`);
    if (group) {
      let sib = group.nextElementSibling;
      let saltos = 0;
      while (sib && saltos < 4) {
        const tag = (sib.tagName || '').toLowerCase();
        // Si llegamos al siguiente diente sin hallar input, abortamos.
        if (sib.classList && sib.classList.contains('tooth-group')) break;
        if (tag === 'foreignobject') {
          const input = sib.querySelector('input, textarea');
          if (input) return input;
        }
        sib = sib.nextElementSibling;
        saltos++;
      }
    }

    // --- Estrategia 2: geometría (respaldo) ---
    const info = odontogramaTools.getToothBBox(svg, tooth);
    if (!info) return null;
    const toothBox = info.bbox;
    const toothCenter = {
      x: toothBox.x + toothBox.width / 2,
      y: toothBox.y + toothBox.height / 2,
    };
    const fos = Array.from(svg.querySelectorAll('foreignObject'));
    if (!fos.length) return null;
    let bestFo = null,
      bestOverlap = -1,
      bestDist = Infinity,
      bestFoByDist = null;
    for (const fo of fos) {
      const foBox = foreignObjectBBoxInSvg(svg, fo);
      if (!foBox) continue;
      const overlap = rectIntersectionArea(foBox, toothBox);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestFo = fo;
      }
      const d = Math.hypot(
        foBox.x + foBox.width / 2 - toothCenter.x,
        foBox.y + foBox.height / 2 - toothCenter.y
      );
      if (d < bestDist) {
        bestDist = d;
        bestFoByDist = fo;
      }
    }
    const chosenFo = bestOverlap > 0 ? bestFo : bestFoByDist;
    return chosenFo ? chosenFo.querySelector('input, textarea') : null;
  }

  function setInputForTooth(tooth, text, color) {
    try {
      const svg = odontogramaTools.getSvg();
      if (!svg) return false;
      const input = pickInputForTooth(svg, tooth);
      if (!input) return false;
      input.value = text;
      input.style.border = `2px solid ${color}`;
      input.style.color = color;
      return true;
    } catch (e) {
      console.error('setInputForTooth error', e);
      return false;
    }
  }

  function clearInputForTooth(tooth) {
    try {
      const svg = odontogramaTools.getSvg();
      if (!svg) return false;
      const input = pickInputForTooth(svg, tooth);
      if (!input) return false;
      input.value = '';
      input.style.border = '';
      input.style.color = '';
      return true;
    } catch (e) {
      console.error('clearInputForTooth error', e);
      return false;
    }
  }

  // ====================================================================
  // HANDLERS DE HERRAMIENTAS  (todas enrutadas por track / startInteractive)
  // ====================================================================

  // 1 & 2 — Aparatos ortodónticos (interactivos)
  const onFixedOrtho = () => {
    startInteractive('Aparato ortod. fijo', askColor(), (onEnd) => {
      const h = odontogramaTools.startFixedOrthoMode(askColor(), onEnd);
      toast('Haz clic en dos puntos para la línea. ESC = cancelar.');
      return h;
    });
  };

  const onRemovableOrtho = () => {
    startInteractive('Aparato ortod. removible', askColor(), (onEnd) => {
      const h = odontogramaTools.startRemovableOrthoMode(
        askColor(),
        10,
        10,
        onEnd
      );
      toast('Haz clic en dos puntos para el zig-zag. ESC = cancelar.');
      return h;
    });
  };

  // 3 — Corona
  const onSelectCorona = (type, color) => {
    setCoronaMenuOpen(false);
    const tooth = askTooth(
      `Diente para ${type} (${color === 'blue' ? 'azul' : 'rojo'}) (ej: 2.7):`
    );
    if (!tooth) return;
    const parts = [
      'fosas',
      'surcos',
      'fosa1',
      'fosa2',
      'fosa3',
      'surco1',
      'surco2',
      'surco3',
    ];
    const ok = track(`Corona ${type}`, tooth, color, () => {
      const drew = odontogramaTools.addCrown(tooth, type, color, parts);
      if (!drew) {
        toast.error(`No se encontró el diente ${tooth}.`);
        return false;
      }
      setInputForTooth(tooth, type, color);
      return true;
    });
    if (!ok) return;
  };

  // 4 — Corona temporal (rojo — deciduos)
  const onCoronaTemporal = () => {
    const tooth = askTooth('Diente para Corona Temporal CT (ej: 6.3):');
    if (!tooth) return;
    const parts = [
      'fosas',
      'surcos',
      'fosa1',
      'fosa2',
      'fosa3',
      'surco1',
      'surco2',
      'surco3',
    ];
    track('Corona temporal (CT)', tooth, 'red', () => {
      const drew = odontogramaTools.addCrown(tooth, 'CT', 'red', parts);
      if (!drew) {
        toast.error(`No se encontró el diente ${tooth}.`);
        return false;
      }
      setInputForTooth(tooth, 'CT', 'red');
      return true;
    });
  };

  // 5 — Defectos de desarrollo del esmalte
  const onSelectDefect = (defect) => {
    setDefectMenuOpen(false);
    const tooth = askTooth(`Diente para defecto "${defect}" (ej: 2.7):`);
    if (!tooth) return;
    track(`Defecto esmalte (${defect})`, tooth, 'red', () => {
      const ok = setInputForTooth(tooth, defect, 'red');
      if (typeof odontogramaTools.addDefect === 'function')
        odontogramaTools.addDefect(tooth, defect, 'red');
      return ok;
    });
  };

  // 6 — Edéntulo (dibuja línea entre molares terminales)
  const onEdentuloSuperior = () => {
    setEdentuloMenuOpen(false);
    track('Edéntulo superior', null, 'blue', () => {
      if (typeof odontogramaTools.addEdentulousLineBetween === 'function') {
        odontogramaTools.addEdentulousLineBetween('1.8', '2.8', 'blue', 2);
        return true;
      }
      toast.error('Función de edéntulo no disponible.');
      return false;
    });
  };

  const onEdentuloInferior = () => {
    setEdentuloMenuOpen(false);
    track('Edéntulo inferior', null, 'blue', () => {
      if (typeof odontogramaTools.addEdentulousLineBetween === 'function') {
        odontogramaTools.addEdentulousLineBetween('4.8', '3.8', 'blue', 2);
        return true;
      }
      toast.error('Función de edéntulo no disponible.');
      return false;
    });
  };

  // 7 — Diastema (interactivo)
  const onDiastema = () => {
    if (typeof odontogramaTools.startDiastemaMode !== 'function') {
      toast.error('Función de diastema no disponible.');
      return;
    }
    startInteractive('Diastema', 'blue', (onEnd) => {
      const h = odontogramaTools.startDiastemaMode('blue', 18, 44, 1, (res) =>
        onEnd(res && !res.cancelled)
      );
      toast('Haz clic entre las dos piezas para el diastema )( . ESC = salir.');
      return h;
    });
  };

  // 8 — Fosas y fisuras profundas
  const onFosasFisurasProfundas = () => {
    const tooth = askTooth('Diente para Fosas y Fisuras Profundas (ej: 1.6):');
    if (!tooth) return;
    track('Fosas y fisuras (FFP)', tooth, 'blue', () => {
      // Color real para que la etiqueta FFP sea visible sobre el diente.
      if (typeof odontogramaTools.addFosasFisurasProfundas === 'function')
        odontogramaTools.addFosasFisurasProfundas(tooth, 'blue');
      return setInputForTooth(tooth, 'FFP', 'blue');
    });
  };

  // 9 — Fusión
  // La fusión solo es clínicamente posible entre dos piezas CONTIGUAS, así que
  // las únicas opciones son el vecino izquierdo o el derecho. Si ambos están
  // libres, se abre un modal interactivo (tab/clic, apto para tablet) para
  // elegir; si solo hay uno, se usa directo. Exclusión doble formación: un
  // diente con germinación no puede además ser parte de una fusión.
  const onFusion = () => {
    const tooth = askTooth('Diente para FUSIÓN (ej: 1.7):');
    if (!tooth) return;
    if (odontogramaTools.toothHasGerminacion(tooth)) {
      toast.error(
        `La pieza ${tooth} tiene germinación: no puede además marcarse como fusión (doble formación). Elimina la germinación primero.`
      );
      return;
    }
    const cand = odontogramaTools.getFusionCandidates(tooth);
    if (!cand.validLeft && !cand.validRight) {
      toast.error(`El diente ${tooth} no tiene dientes vecinos para fusionar.`);
      return;
    }
    if (cand.selectable.length === 0) {
      toast.error(
        `Los vecinos contiguos de ${tooth} ya tienen fusión o no existen.`
      );
      return;
    }
    if (cand.selectable.length === 1) {
      aplicarFusion(tooth, cand.selectable[0]);
      return;
    }
    // Dos posibilidades contiguas → elegir en modal.
    setFusionModal({ tooth, options: cand.selectable });
  };

  const aplicarFusion = (tooth, neighbor) => {
    setFusionModal(null);
    if (odontogramaTools.toothHasGerminacion(neighbor)) {
      toast.error(
        `La pieza ${neighbor} tiene germinación: no puede fusionarse (doble formación).`
      );
      return;
    }
    track(`Fusión (${tooth}–${neighbor})`, tooth, 'blue', () => {
      if (typeof odontogramaTools.addFusion === 'function') {
        const ok = odontogramaTools.addFusion(tooth, 'blue', neighbor);
        if (!ok) return false;
        return true;
      }
      toast.error('addFusion no disponible.');
      return false;
    });
  };

  // 10 — Germinación
  // Exclusión doble formación: una pieza que ya forma parte de una fusión no
  // puede además marcarse como germinación.
  const onGerminacion = () => {
    const tooth = askTooth('Diente para GERMINACIÓN (ej: 1.6):');
    if (!tooth) return;
    if (odontogramaTools.toothHasFusion(tooth)) {
      toast.error(
        `La pieza ${tooth} forma parte de una fusión: no puede además marcarse como germinación (doble formación). Elimina la fusión primero.`
      );
      return;
    }
    track('Germinación', tooth, 'blue', () => {
      if (typeof odontogramaTools.addGerminacion === 'function') {
        const ok = odontogramaTools.addGerminacion(tooth, 'blue');
        if (!ok) {
          toast.error(`No se pudo dibujar germinación en ${tooth}.`);
          return false;
        }
        return true;
      }
      toast.error('addGerminacion no disponible.');
      return false;
    });
  };

  // 11 — Giroversión
  const onGiroversionDirection = (direction) => {
    setGiroMenuOpen(false);
    const tooth = askTooth(
      `Diente para GIROVERSIÓN ${direction === 'right' ? '→' : '←'} (ej: 1.7):`
    );
    if (!tooth) return;
    const dirLabel = direction === 'right' ? 'derecha' : 'izquierda';
    track(`Giroversión ${dirLabel}`, tooth, 'blue', () => {
      if (typeof odontogramaTools.addGiroversion === 'function') {
        const ok = odontogramaTools.addGiroversion(tooth, direction, 'blue');
        if (!ok) {
          toast.error(`No se pudo dibujar giroversión en ${tooth}.`);
          return false;
        }
        return true;
      }
      toast.error('addGiroversion no disponible.');
      return false;
    });
  };

  // 12 — Implantación dental
  const onImplanteColor = (color) => {
    setImplantMenuOpen(false);
    const tooth = askTooth('Diente para Implantación dental (IMP) (ej: 1.6):');
    if (!tooth) return;
    track('Implantación (IMP)', tooth, color, () => {
      // Pasar el color real (antes '#FFFFFF00' hacía invisible la etiqueta IMP
      // sobre el diente). addImplant escribe en el input por DOM y dibuja la
      // etiqueta; setInputForTooth refuerza el input (idempotente, mismo input).
      if (typeof odontogramaTools.addImplant === 'function')
        odontogramaTools.addImplant(tooth, color);
      return setInputForTooth(tooth, 'IMP', color);
    });
  };

  // 13 — Impactación
  const onImplantacion2 = () => {
    const tooth = askTooth('Diente para IMPACTACIÓN (I) (ej: 1.6):');
    if (!tooth) return;
    track('Impactación (I)', tooth, 'blue', () => {
      const ok = setInputForTooth(tooth, 'I', 'blue');
      if (!ok) toast.error(`No se encontró el diente ${tooth}.`);
      return ok;
    });
  };

  // 14 — Macrodoncia
  const onMacrodoncia = () => {
    const tooth = askTooth('Diente para MACRODONCIA (ej: 1.6):');
    if (!tooth) return;
    track('Macrodoncia (MAC)', tooth, 'blue', () => {
      const ok = setInputForTooth(tooth, 'MAC', 'blue');
      if (!ok) toast.error(`No se encontró el diente ${tooth}.`);
      return ok;
    });
  };

  // 15 — Microdoncia
  const onMicrodoncia = () => {
    const tooth = askTooth('Diente para MICRODONCIA (ej: 1.6):');
    if (!tooth) return;
    track('Microdoncia (MIC)', tooth, 'blue', () => {
      const ok = setInputForTooth(tooth, 'MIC', 'blue');
      if (!ok) toast.error(`No se encontró el diente ${tooth}.`);
      return ok;
    });
  };

  // 16 — Movilidad patológica (rojo)
  const onMobilidad = () => {
    const tooth = askTooth('Diente para MOVILIDAD PATOLÓGICA (ej: 1.6):');
    if (!tooth) return;
    track('Movilidad patológica (M)', tooth, 'red', () => {
      const ok = setInputForTooth(tooth, 'M', 'red');
      if (!ok) toast.error(`No se encontró el diente ${tooth}.`);
      return ok;
    });
  };

  // 17 — Pieza dentaria ausente
  const onSelectPDA = (typeId, color = 'blue') => {
    setPDAMenuOpen(false);
    const tooth = askTooth(
      `Diente para Pieza Dentaria Ausente ${typeId} (ej: 2.7):`
    );
    if (!tooth) return;
    track(`Pieza ausente (${typeId})`, tooth, color, () => {
      const ok = setInputForTooth(tooth, typeId, color);
      odontogramaTools.addMissingTooth(tooth, color);
      return ok;
    });
  };

  // 18 — Pieza en clavija
  const onPiezaClavija = () => {
    const tooth = askTooth('Diente en clavija (PC) (ej: 2.7):');
    if (!tooth) return;
    track('Pieza en clavija (PC)', tooth, 'blue', () => {
      const ok = odontogramaTools.addPegTooth(tooth, 'blue');
      if (!ok) {
        toast.error(`No se pudo dibujar pieza en clavija en ${tooth}.`);
        return false;
      }
      return true;
    });
  };

  // 19 — Pieza ectópica
  const onPiezaEctopica = () => {
    const tooth = askTooth('Diente ectópico (E) (ej: 2.7):');
    if (!tooth) return;
    track('Pieza ectópica (E)', tooth, 'blue', () => {
      const ok = setInputForTooth(tooth, 'E', 'blue');
      if (!ok) toast.error(`No se encontró el diente ${tooth}.`);
      return ok;
    });
  };

  // 20 — Pulpotomía
  const onPulpotomia = () => {
    const tooth = askTooth('Diente para Pulpotomía (PP) (ej: 6.3):');
    if (!tooth) return;
    const color = askColor();
    track('Pulpotomía (PP)', tooth, color, () => {
      const ok = setInputForTooth(tooth, 'PP', color);
      odontogramaTools.addPulpotomy(tooth, color);
      return ok;
    });
  };

  // 21 — Transposición dentaria (interactivo)
  const onTransposicion = () => {
    startInteractive('Transposición dentaria', askColor(), (onEnd) =>
      odontogramaTools.addTransposition(askColor(), onEnd)
    );
  };

  // 22 — Prótesis Dental Parcial Fija (interactivo)
  const onPPF = () => {
    startInteractive('Prótesis Parcial Fija (PPF)', askColor(), (onEnd) =>
      odontogramaTools.addPPF(askColor(), onEnd)
    );
  };

  // 23 — Prótesis Dental Completa (síncrono)
  const onSelectPDC = (typeId, color) => {
    setPDCMenuOpen(false);
    const arcada =
      typeId === 'SUP_PERM' || typeId === 'SUP_DECID' ? 'superior' : 'inferior';
    const labelMap = {
      SUP_PERM: 'Sup. permanentes',
      SUP_DECID: 'Sup. deciduos',
      INF_PERM: 'Inf. permanentes',
      INF_DECID: 'Inf. deciduos',
    };
    track(
      `Prótesis Completa (${labelMap[typeId] || typeId})`,
      null,
      color,
      () => {
        const ok = odontogramaTools.addPDC(arcada, color, typeId);
        if (!ok) {
          toast.error('No se pudo dibujar la Prótesis Completa.');
          return false;
        }
        return true;
      }
    );
  };

  // 24 — Prótesis Dental Parcial Removible (interactivo)
  const onProtesisPR = () => {
    startInteractive(
      'Prótesis Parcial Removible (PPR)',
      askColor(),
      (onEnd) => {
        const h = odontogramaTools.addDentalProsthesis(askColor(), onEnd);
        toast(
          'Haz clic en el diente pilar inicial y luego en el final. ESC = cancelar.'
        );
        return h;
      }
    );
  };

  // ── Utilidades ────────────────────────────────────────────────────────

  const onUndo = () => {
    if (odontogramaTools.clearLastAnnotation()) {
      // Quita también el último registro de la lista (mejor esfuerzo).
      setTreatments((prev) => prev.slice(0, -1));
      toast.success('Última anotación SVG deshecha.');
    } else {
      toast.error('No hay anotaciones que deshacer.');
    }
  };

  const onClearAll = () => {
    setClearModalOpen(false);
    odontogramaTools.clearAnnotations();
    const svg = odontogramaTools.getSvg();
    if (svg) {
      svg
        .querySelectorAll('foreignObject input, foreignObject textarea')
        .forEach((inp) => {
          inp.value = '';
          inp.style.border = '';
          inp.style.color = '';
        });
    }
    setTreatments([]);
    toast.success('Todas las anotaciones han sido borradas.');
  };

  const onClearOneTooth = (tooth) => {
    setClearModalOpen(false);
    const svgCleared = odontogramaTools.clearAnnotationsForTooth(tooth);
    const inputCleared = clearInputForTooth(tooth);
    setTreatments((prev) => prev.filter((t) => t.tooth !== tooth));
    if (svgCleared || inputCleared)
      toast.success(`Anotaciones del diente ${tooth} borradas.`);
    else toast.error(`No se encontraron anotaciones para el diente ${tooth}.`);
  };

  // ====================================================================
  // ESTILOS INLINE COMPARTIDOS
  // ====================================================================
  const S = {
    btn: {
      width: '100%',
      padding: '8px 10px',
      background: '#0d9488',
      color: 'white',
      border: 'none',
      borderRadius: 6,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      textAlign: 'left',
      lineHeight: 1.3,
    },
    sec: {
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: '#0f766e',
      marginTop: 14,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottom: '1px solid #99f6e4',
    },
    drop: {
      position: 'absolute',
      top: '105%',
      left: 0,
      zIndex: 80,
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
      minWidth: 200,
    },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  };

  const colorHex = (c) => (c === 'red' ? '#dc2626' : '#1d4ed8');

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <div
      style={{
        width: 380,
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 12px rgba(0,0,0,0.09)',
        padding: '14px 14px 18px',
        maxHeight: '85vh',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      <h3
        style={{
          margin: '0 0 10px',
          fontSize: 16,
          fontWeight: 800,
          color: '#134e4a',
        }}
      >
        Herramientas del Odontograma
      </h3>

      {/* ── DIENTE SELECCIONADO ─────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          marginBottom: 10,
          borderRadius: 7,
          fontSize: 13,
          background: selectedTooth ? '#dbeafe' : '#f3f4f6',
          border: `1px solid ${selectedTooth ? '#93c5fd' : '#e5e7eb'}`,
        }}
      >
        {selectedTooth ? (
          <>
            <span style={{ color: '#1e3a8a' }}>
              Diente seleccionado:{' '}
              <strong style={{ fontSize: 15 }}>{selectedTooth}</strong>
            </span>
            <button
              onClick={() => onClearTooth && onClearTooth()}
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                color: '#1d4ed8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Quitar
            </button>
          </>
        ) : (
          <span style={{ color: '#6b7280' }}>
            👆 Haz clic en un diente para seleccionarlo
          </span>
        )}
      </div>

      {/* ── SELECTOR DE COLOR NTS-188 ────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>
          Color NTS-188:
        </span>
        {[
          { val: 'blue', label: 'Azul', hex: '#1d4ed8', note: 'buen estado' },
          { val: 'red', label: 'Rojo', hex: '#dc2626', note: 'mal estado' },
        ].map((c) => {
          const activo = colorActivo === c.val;
          return (
            <button
              key={c.val}
              onClick={() => setColorActivo(c.val)}
              title={c.note}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 5,
                border: activo ? `2px solid ${c.hex}` : '2px solid #e5e7eb',
                background: activo ? c.hex : 'white',
                color: activo ? 'white' : '#374151',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: c.hex,
                  border: activo ? '1px solid white' : 'none',
                }}
              />
              {c.label}
            </button>
          );
        })}
      </div>
      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9ca3af' }}>
        Azul = buen estado · Rojo = mal estado (NTS N° 188-MINSA/2022)
      </p>

      {/* ════ TRATAMIENTOS APLICADOS (ADR-0017) ════ */}
      <div style={{ ...S.sec, marginTop: 14 }}>
        Tratamientos aplicados ({treatments.length})
      </div>
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          background: '#fafafa',
          maxHeight: 160,
          overflowY: 'auto',
          padding: treatments.length ? 6 : 10,
        }}
      >
        {treatments.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            Aún no hay tratamientos. Aplica una herramienta y aparecerá aquí.
          </p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {treatments.map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 8px',
                  background: 'white',
                  border: '1px solid #eef0f2',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: colorHex(t.color),
                    flexShrink: 0,
                  }}
                  title={t.color === 'red' ? 'Mal estado' : 'Buen estado'}
                />
                <span style={{ flex: 1, color: '#374151' }}>{t.label}</span>
                {t.tooth && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#1e3a8a',
                      background: '#dbeafe',
                      borderRadius: 4,
                      padding: '1px 6px',
                    }}
                  >
                    {t.tooth}
                  </span>
                )}
                <button
                  onClick={() => removeTreatment(t)}
                  title="Eliminar este tratamiento"
                  style={{
                    border: 'none',
                    background: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: 15,
                    lineHeight: 1,
                    padding: '0 2px',
                  }}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ════ 1 · ORTODONCIA ════ */}
      <div style={S.sec}>1 · Ortodoncia</div>
      <div style={S.grid2}>
        <button style={S.btn} onClick={onFixedOrtho}>
          1. Aparat. orto. fijo
        </button>
        <button style={S.btn} onClick={onRemovableOrtho}>
          2. Aparat. orto. removible
        </button>
      </div>

      {/* ════ 2 · CORONAS ════ */}
      <div style={S.sec}>2 · Coronas</div>
      <div style={S.grid2}>
        <div style={{ position: 'relative' }}>
          <button
            style={S.btn}
            onClick={() => toggleMenu(coronaMenuOpen, setCoronaMenuOpen)}
            aria-expanded={coronaMenuOpen}
          >
            3. Corona ▾
          </button>
          {coronaMenuOpen && (
            <div style={S.drop}>
              <div style={{ display: 'flex', gap: 8 }}>
                {colors.map((col) => (
                  <div key={col} style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: colorHex(col),
                        marginBottom: 5,
                      }}
                    >
                      {col === 'blue' ? '🔵 Azul' : '🔴 Rojo'}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      {crownTypes.map((t) => (
                        <button
                          key={t + col}
                          onClick={() => onSelectCorona(t, col)}
                          style={{
                            padding: '5px 6px',
                            borderRadius: 5,
                            border: `2px solid ${colorHex(col)}`,
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                            color: colorHex(col),
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setCoronaMenuOpen(false)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '4px',
                  borderRadius: 5,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
        <button style={S.btn} onClick={onCoronaTemporal}>
          4. Corona temporal (CT)
        </button>
      </div>

      {/* ════ 3 · ESTADO DENTAL ════ */}
      <div style={S.sec}>3 · Estado dental</div>
      <div style={S.grid2}>
        <div style={{ position: 'relative' }}>
          <button
            style={S.btn}
            onClick={() => toggleMenu(defectMenuOpen, setDefectMenuOpen)}
            aria-expanded={defectMenuOpen}
          >
            5. Defectos esmalte ▾
          </button>
          {defectMenuOpen && (
            <div style={S.drop}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#dc2626',
                  marginBottom: 6,
                }}
              >
                Tipo (rojo)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {defectTypes.map((d) => (
                  <button
                    key={d}
                    onClick={() => onSelectDefect(d)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 5,
                      border: '1px solid #fca5a5',
                      background: '#fff5f5',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#dc2626',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDefectMenuOpen(false)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '4px',
                  borderRadius: 5,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            style={S.btn}
            onClick={() => toggleMenu(edentuloMenuOpen, setEdentuloMenuOpen)}
            aria-expanded={edentuloMenuOpen}
          >
            6. Edéntulo ▾
          </button>
          {edentuloMenuOpen && (
            <div style={{ ...S.drop, display: 'flex', gap: 6 }}>
              <button
                onClick={onEdentuloSuperior}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px solid #0d9488',
                  background: '#f0fdfa',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0f766e',
                }}
              >
                Superior
              </button>
              <button
                onClick={onEdentuloInferior}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px solid #0d9488',
                  background: '#f0fdfa',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0f766e',
                }}
              >
                Inferior
              </button>
            </div>
          )}
        </div>

        <button style={S.btn} onClick={onFosasFisurasProfundas}>
          8. Fosas y fisuras (FFP)
        </button>

        <div style={{ position: 'relative' }}>
          <button
            style={S.btn}
            onClick={() => toggleMenu(implantMenuOpen, setImplantMenuOpen)}
            aria-expanded={implantMenuOpen}
          >
            12. Implantación ▾
          </button>
          {implantMenuOpen && (
            <div style={{ ...S.drop, display: 'flex', gap: 8 }}>
              <button
                onClick={() => onImplanteColor('blue')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '2px solid #1d4ed8',
                  background: '#eff6ff',
                  cursor: 'pointer',
                  color: '#1d4ed8',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                IMP 🔵
              </button>
              <button
                onClick={() => onImplanteColor('red')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '2px solid #dc2626',
                  background: '#fff5f5',
                  cursor: 'pointer',
                  color: '#dc2626',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                IMP 🔴
              </button>
            </div>
          )}
        </div>

        <button style={S.btn} onClick={onImplantacion2}>
          13. Impactación (I)
        </button>
        <button style={S.btn} onClick={onMobilidad}>
          16. Movilidad patológica
        </button>

        <div style={{ position: 'relative' }}>
          <button
            style={S.btn}
            onClick={() => toggleMenu(pdaMenuOpen, setPDAMenuOpen)}
            aria-expanded={pdaMenuOpen}
          >
            17. Pieza ausente (PDA) ▾
          </button>
          {pdaMenuOpen && (
            <div style={S.drop}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#1d4ed8',
                  marginBottom: 6,
                }}
              >
                Tipo (azul)
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {missingToothTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => onSelectPDA(t, 'blue')}
                    style={{
                      flex: 1,
                      padding: '7px 4px',
                      borderRadius: 5,
                      border: '2px solid #1d4ed8',
                      background: '#eff6ff',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1d4ed8',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPDAMenuOpen(false)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '4px',
                  borderRadius: 5,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        <button style={S.btn} onClick={onPulpotomia}>
          20. Pulpotomía (PP)
        </button>
      </div>

      {/* ════ 4 · ANOMALÍAS MORFOLÓGICAS ════ */}
      <div style={S.sec}>4 · Anomalías morfológicas</div>
      <div style={S.grid2}>
        <button style={S.btn} onClick={onFusion}>
          9. Fusión
        </button>
        <button style={S.btn} onClick={onGerminacion}>
          10. Germinación
        </button>
        <button style={S.btn} onClick={onMacrodoncia}>
          14. Macrodoncia
        </button>
        <button style={S.btn} onClick={onMicrodoncia}>
          15. Microdoncia
        </button>
        <button
          style={{ ...S.btn, gridColumn: 'span 2' }}
          onClick={onPiezaClavija}
        >
          18. Pieza en clavija (PC)
        </button>
      </div>

      {/* ════ 5 · POSICIÓN DENTAL ════ */}
      <div style={S.sec}>5 · Posición dental</div>
      <div style={S.grid2}>
        <button style={S.btn} onClick={onDiastema}>
          7. Diastema
        </button>

        <div style={{ position: 'relative' }}>
          <button
            style={S.btn}
            onClick={() => toggleMenu(giroMenuOpen, setGiroMenuOpen)}
            aria-expanded={giroMenuOpen}
          >
            11. Giroversión ▾
          </button>
          {giroMenuOpen && (
            <div style={{ ...S.drop, display: 'flex', gap: 8 }}>
              <button
                onClick={() => onGiroversionDirection('left')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px solid #1d4ed8',
                  background: '#eff6ff',
                  cursor: 'pointer',
                  color: '#1d4ed8',
                  fontWeight: 700,
                }}
              >
                ← Izquierda
              </button>
              <button
                onClick={() => onGiroversionDirection('right')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px solid #1d4ed8',
                  background: '#eff6ff',
                  cursor: 'pointer',
                  color: '#1d4ed8',
                  fontWeight: 700,
                }}
              >
                Derecha →
              </button>
            </div>
          )}
        </div>

        <button style={S.btn} onClick={onPiezaEctopica}>
          19. Pieza ectópica (E)
        </button>
        <button style={S.btn} onClick={onTransposicion}>
          21. Transposición
        </button>
      </div>

      {/* ════ 6 · PRÓTESIS ════ */}
      <div style={S.sec}>6 · Prótesis</div>
      <div style={S.grid2}>
        <button style={S.btn} onClick={onPPF}>
          22. PPF
        </button>

        <div style={{ position: 'relative' }}>
          <button
            style={S.btn}
            onClick={() => toggleMenu(pdcMenuOpen, setPDCMenuOpen)}
            aria-expanded={pdcMenuOpen}
          >
            23. PDC ▾
          </button>
          {pdcMenuOpen && (
            <div style={S.drop}>
              {pdcTypes.map((type) => (
                <div key={type.id} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#374151',
                      marginBottom: 4,
                    }}
                  >
                    {type.label}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => onSelectPDC(type.id, 'blue')}
                      style={{
                        flex: 1,
                        padding: '5px',
                        borderRadius: 5,
                        border: '2px solid #1d4ed8',
                        background: '#eff6ff',
                        cursor: 'pointer',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Azul
                    </button>
                    <button
                      onClick={() => onSelectPDC(type.id, 'red')}
                      style={{
                        flex: 1,
                        padding: '5px',
                        borderRadius: 5,
                        border: '2px solid #dc2626',
                        background: '#fff5f5',
                        cursor: 'pointer',
                        color: '#dc2626',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Rojo
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setPDCMenuOpen(false)}
                style={{
                  width: '100%',
                  padding: '4px',
                  borderRadius: 5,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        <button
          style={{ ...S.btn, gridColumn: 'span 2' }}
          onClick={onProtesisPR}
        >
          24. Prótesis Parcial Removible (PPR)
        </button>
      </div>

      {/* ── MODO ACTIVO ──────────────────────────────────── */}
      {activeTool && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 12px',
            background: '#fef9c3',
            borderRadius: 7,
            border: '1px solid #fde047',
          }}
        >
          <span style={{ flex: 1, fontSize: 13, color: '#713f12' }}>
            ✏️ Modo activo: <strong>{activeToolName}</strong>
          </span>
          <button
            onClick={stopActiveTool}
            style={{
              padding: '5px 12px',
              borderRadius: 5,
              border: '1px solid #f59e0b',
              background: '#fffbeb',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              color: '#92400e',
            }}
          >
            Detener
          </button>
        </div>
      )}

      {/* ── UTILIDADES ───────────────────────────────────── */}
      <div style={{ ...S.sec, marginTop: 16 }}>Utilidades</div>
      <div style={S.grid2}>
        <button
          onClick={onUndo}
          style={{
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#374151',
          }}
        >
          ↩ Deshacer
        </button>
        <button
          onClick={() => setClearModalOpen(true)}
          style={{
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #fca5a5',
            background: '#fff5f5',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: '#dc2626',
          }}
        >
          🗑 Borrar
        </button>
        <button
          onClick={onLoadVersion}
          style={{
            padding: '8px',
            borderRadius: 6,
            border: '1px solid #93c5fd',
            background: '#eff6ff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: '#1d4ed8',
          }}
        >
          📋 Historial
        </button>
        <button
          onClick={onSaveVersion}
          style={{
            padding: '8px',
            borderRadius: 6,
            border: 'none',
            background: '#1d4ed8',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: 'white',
          }}
        >
          💾 Guardar
        </button>
      </div>

      {/* ── MODAL DE FUSIÓN: elegir diente contiguo (tablet) ── */}
      {fusionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Elegir diente para la fusión"
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              width: 360,
              boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
            }}
          >
            <h4
              style={{
                margin: '0 0 4px',
                fontSize: 16,
                fontWeight: 800,
                color: '#111827',
              }}
            >
              Fusión de la pieza {fusionModal.tooth}
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6b7280' }}>
              La fusión solo es posible entre piezas contiguas. Elige con qué
              diente vecino se fusiona <strong>{fusionModal.tooth}</strong>:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fusionModal.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => aplicarFusion(fusionModal.tooth, opt)}
                  style={{
                    padding: '16px',
                    borderRadius: 9,
                    textAlign: 'center',
                    border: '2px solid #1d4ed8',
                    background: '#eff6ff',
                    cursor: 'pointer',
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#1d4ed8',
                  }}
                >
                  Fusionar con {opt}
                </button>
              ))}
              <button
                onClick={() => setFusionModal(null)}
                style={{
                  padding: '11px',
                  borderRadius: 7,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE BORRADO ─────────────────────────────── */}
      {clearModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              width: 320,
              boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
            }}
          >
            <h4
              style={{
                margin: '0 0 4px',
                fontSize: 16,
                fontWeight: 800,
                color: '#111827',
              }}
            >
              ¿Qué deseas borrar?
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6b7280' }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedTooth && (
                <button
                  onClick={() => onClearOneTooth(selectedTooth)}
                  style={{
                    padding: '11px',
                    borderRadius: 7,
                    textAlign: 'left',
                    border: '2px solid #f59e0b',
                    background: '#fffbeb',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#92400e',
                  }}
                >
                  🗑 Borrar diente <strong>{selectedTooth}</strong>
                </button>
              )}
              <button
                onClick={onClearAll}
                style={{
                  padding: '11px',
                  borderRadius: 7,
                  textAlign: 'left',
                  border: '2px solid #dc2626',
                  background: '#fff5f5',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#dc2626',
                }}
              >
                🗑 Borrar TODO el odontograma
              </button>
              <button
                onClick={() => setClearModalOpen(false)}
                style={{
                  padding: '11px',
                  borderRadius: 7,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
