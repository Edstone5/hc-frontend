// src/pages/hc/ExamenFisico/odotools.jsx
/**
 * Panel de herramientas del odontograma — NTS N° 188-MINSA/DGIESP-2022.
 *
 * Cambios 2026-05-31 (ADR-0016):
 *
 * BUGS CORREGIDOS:
 *   1. useState mal destructurado: `const [setCoronaTempMenuOpen] = useState(false)`
 *      capturaba el VALOR (false) en lugar del setter, causando TypeError al llamarla.
 *      → `const [, setCoronaTempMenuOpen] = useState(false)`
 *
 *   2. foreignObjectBBoxInSvg usaba fo.getCTM() como ruta primaria, que devuelve
 *      coordenadas CSS-pixel (0..320), inconsistente con toothBox que tras el commit
 *      9ce4a1c devuelve unidades viewBox (0..1400). El resultado era que la comparación
 *      de intersección/distancia mezclaba dos espacios de coordenadas.
 *      → Se elimina la ruta primaria; siempre usa getBoundingClientRect +
 *        svg.getScreenCTM().inverse() (espacio viewBox, correcto).
 *
 *   3. onClear usaba window.prompt + window.confirm, no aptos para tablet (NTS-188 UX).
 *      → Reemplazado por clearModalOpen: modal inline con botones táctiles.
 *
 * MEJORAS VISUALES:
 *   - Botones agrupados en 6 secciones clínicas con cabeceras tipográficas.
 *   - Todos los botones de tratamiento al mismo tamaño (grid 2 columnas, w-full).
 *   - Submenús uniformes: fondo blanco, sombra, bordes redondeados, icono color.
 *   - Modo activo: banner amarillo con botón "Detener".
 *   - Utilidades (Deshacer / Borrar / Historial / Guardar) en grid 2×2 al pie.
 *   - Tipografía y paleta consistentes con NTS-188 (azul buen estado, rojo mal estado).
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
  // FIX #1: antes `const [setCoronaTempMenuOpen] = useState(false)` tomaba
  // el valor (false) en vez del setter → TypeError al invocarla.
  const [, setCoronaTempMenuOpen] = useState(false);
  const [defectMenuOpen, setDefectMenuOpen] = useState(false);
  const [edentuloMenuOpen, setEdentuloMenuOpen] = useState(false);
  const [implantMenuOpen, setImplantMenuOpen] = useState(false);
  const [giroMenuOpen, setGiroMenuOpen] = useState(false);
  const [pdaMenuOpen, setPDAMenuOpen] = useState(false);
  const [pdcMenuOpen, setPDCMenuOpen] = useState(false);
  // FIX #3: modal de borrado — reemplaza window.prompt + window.confirm
  const [clearModalOpen, setClearModalOpen] = useState(false);

  // ── Herramienta de modo interactivo ─────────────────────────────────
  const [activeTool, setActiveTool] = useState(null);
  const [activeToolName, setActiveToolName] = useState(null);

  // ── Color NTS-188: azul = buen estado / rojo = mal estado ───────────
  const [colorActivo, setColorActivo] = useState('blue');

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

  // Cierra todos los desplegables (para toggle exclusivo)
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

  // Toggle exclusivo: cierra los demás y alterna el solicitado
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

  // ── foreignObjectBBoxInSvg ───────────────────────────────────────────
  // FIX #2: eliminada la ruta primaria (fo.getCTM()) que daba CSS-pixel.
  // Ahora siempre usa getBoundingClientRect → getScreenCTM().inverse()
  // para obtener coordenadas en espacio viewBox, igual que getToothBBox.
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

  // Escribe sigla y color en el input del foreignObject más cercano al diente
  function setInputForTooth(tooth, text, color) {
    try {
      const svg = odontogramaTools.getSvg();
      if (!svg) return false;
      const info = odontogramaTools.getToothBBox(svg, tooth);
      if (!info) return false;
      const toothBox = info.bbox;
      const toothCenter = {
        x: toothBox.x + toothBox.width / 2,
        y: toothBox.y + toothBox.height / 2,
      };
      const fos = Array.from(svg.querySelectorAll('foreignObject'));
      if (!fos.length) return false;

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
      if (!chosenFo) return false;
      const input = chosenFo.querySelector('input, textarea');
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
      const info = odontogramaTools.getToothBBox(svg, tooth);
      if (!info) return false;
      const toothBox = info.bbox;
      const toothCenter = {
        x: toothBox.x + toothBox.width / 2,
        y: toothBox.y + toothBox.height / 2,
      };
      const fos = Array.from(svg.querySelectorAll('foreignObject'));
      if (!fos.length) return false;

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
      if (!chosenFo) return false;
      const input = chosenFo.querySelector('input, textarea');
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
  // HANDLERS DE HERRAMIENTAS
  // ====================================================================

  // 1 & 2 — Aparatos ortodónticos
  const onFixedOrtho = () => {
    try {
      const handle = odontogramaTools.startFixedOrthoMode(askColor());
      if (handle?.stop) {
        setActiveTool(handle);
        setActiveToolName('Ortod. fijo');
      }
      toast('Haz clic en dos puntos para la línea. ESC = cancelar.');
    } catch (e) {
      console.error(e);
      toast.error('Error al iniciar modo.');
    }
  };

  const onRemovableOrtho = () => {
    try {
      const handle = odontogramaTools.startRemovableOrthoMode(
        askColor(),
        10,
        10
      );
      if (handle?.stop) {
        setActiveTool(handle);
        setActiveToolName('Ortod. removible');
      }
      toast('Haz clic en dos puntos para el zig-zag. ESC = cancelar.');
    } catch (e) {
      console.error(e);
      toast.error('Error al iniciar modo.');
    }
  };

  // 3 — Corona
  const onSelectCorona = (type, color) => {
    setCoronaMenuOpen(false);
    const tooth = askTooth(
      `Diente para ${type} (${color === 'blue' ? 'azul' : 'rojo'}) (ej: 2.7):`
    );
    if (!tooth) return;
    try {
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
      const ok = odontogramaTools.addCrown(tooth, type, color, parts);
      if (!ok) {
        toast.error(`No se encontró el diente ${tooth}.`);
        return;
      }
      setInputForTooth(tooth, type, color);
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar corona.');
    }
  };

  // 4 — Corona temporal (siempre rojo — deciduos con mal estado)
  const onCoronaTemporal = () => {
    const tooth = askTooth('Diente para Corona Temporal CT (ej: 6.3):');
    if (!tooth) return;
    try {
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
      const ok = odontogramaTools.addCrown(tooth, 'CT', 'red', parts);
      if (!ok) {
        toast.error(`No se encontró el diente ${tooth}.`);
        return;
      }
      setInputForTooth(tooth, 'CT', 'red');
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar CT.');
    }
  };

  // 5 — Defectos de desarrollo del esmalte
  const onSelectDefect = (defect) => {
    setDefectMenuOpen(false);
    const tooth = askTooth(`Diente para defecto "${defect}" (ej: 2.7):`);
    if (!tooth) return;
    try {
      setInputForTooth(tooth, defect, 'red');
      if (typeof odontogramaTools.addDefect === 'function')
        odontogramaTools.addDefect(tooth, defect, 'red');
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar defecto.');
    }
  };

  // 6 — Edéntulo
  const onEdentuloSuperior = () => {
    setEdentuloMenuOpen(false);
    try {
      if (typeof odontogramaTools.addEdentulousLineBetween === 'function')
        odontogramaTools.addEdentulousLineBetween('1.8', '2.8', 'blue', 2);
      else toast.error('Función de edéntulo no disponible.');
    } catch (e) {
      console.error(e);
    }
  };

  const onEdentuloInferior = () => {
    setEdentuloMenuOpen(false);
    try {
      if (typeof odontogramaTools.addEdentulousLineBetween === 'function')
        odontogramaTools.addEdentulousLineBetween('4.8', '3.8', 'blue', 2);
      else toast.error('Función de edéntulo no disponible.');
    } catch (e) {
      console.error(e);
    }
  };

  // 7 — Diastema
  const onDiastema = () => {
    if (typeof odontogramaTools.startDiastemaMode !== 'function') {
      toast.error('Función de diastema no disponible.');
      return;
    }
    const handle = odontogramaTools.startDiastemaMode('blue', 18, 44, 1, () => {
      setActiveTool(null);
      setActiveToolName(null);
    });
    if (handle?.stop) {
      setActiveTool(handle);
      setActiveToolName('Diastema');
    }
    toast('Haz clic donde colocar la "X" azul. ESC = salir.');
  };

  // 8 — Fosas y fisuras profundas
  const onFosasFisurasProfundas = () => {
    const tooth = askTooth('Diente para Fosas y Fisuras Profundas (ej: 1.6):');
    if (!tooth) return;
    try {
      if (typeof odontogramaTools.addFosasFisurasProfundas === 'function')
        odontogramaTools.addFosasFisurasProfundas(tooth, '#FFFFFF00');
      setInputForTooth(tooth, 'FFP', 'blue');
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar FFP.');
    }
  };

  // 9 — Fusión
  const onFusion = () => {
    const tooth = askTooth('Diente para FUSIÓN (ej: 1.7):');
    if (!tooth) return;
    try {
      if (typeof odontogramaTools.addFusion === 'function') {
        const ok = odontogramaTools.addFusion(tooth, 'blue');
        if (!ok) toast.error(`No se pudo dibujar fusión en ${tooth}.`);
      } else toast.error('addFusion no disponible.');
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar fusión.');
    }
  };

  // 10 — Germinación
  const onGerminacion = () => {
    const tooth = askTooth('Diente para GERMINACIÓN (ej: 1.6):');
    if (!tooth) return;
    try {
      if (typeof odontogramaTools.addGerminacion === 'function') {
        const ok = odontogramaTools.addGerminacion(tooth, 'blue');
        if (!ok) toast.error(`No se pudo dibujar germinación en ${tooth}.`);
      } else toast.error('addGerminacion no disponible.');
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar germinación.');
    }
  };

  // 11 — Giroversión
  const onGiroversionDirection = (direction) => {
    setGiroMenuOpen(false);
    const tooth = askTooth(
      `Diente para GIROVERSIÓN ${direction === 'right' ? '→' : '←'} (ej: 1.7):`
    );
    if (!tooth) return;
    try {
      if (typeof odontogramaTools.addGiroversion === 'function') {
        const ok = odontogramaTools.addGiroversion(tooth, direction, 'blue');
        if (!ok) toast.error(`No se pudo dibujar giroversión en ${tooth}.`);
      } else toast.error('addGiroversion no disponible.');
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar giroversión.');
    }
  };

  // 12 — Implantación dental
  const onImplanteColor = (color) => {
    setImplantMenuOpen(false);
    const tooth = askTooth('Diente para Implantación dental (IMP) (ej: 1.6):');
    if (!tooth) return;
    try {
      if (typeof odontogramaTools.addImplant === 'function')
        odontogramaTools.addImplant(tooth, '#FFFFFF00');
      setInputForTooth(tooth, 'IMP', color);
    } catch (e) {
      console.error(e);
      toast.error('Error al anotar implante.');
    }
  };

  // 13 — Impactación
  const onImplantacion2 = () => {
    const tooth = askTooth('Diente para IMPACTACIÓN (I) (ej: 1.6):');
    if (!tooth) return;
    if (!setInputForTooth(tooth, 'I', 'blue'))
      toast.error(`No se encontró el diente ${tooth}.`);
  };

  // 14 — Macrodoncia
  const onMacrodoncia = () => {
    const tooth = askTooth('Diente para MACRODONCIA (ej: 1.6):');
    if (!tooth) return;
    if (!setInputForTooth(tooth, 'MAC', 'blue'))
      toast.error(`No se encontró el diente ${tooth}.`);
  };

  // 15 — Microdoncia
  const onMicrodoncia = () => {
    const tooth = askTooth('Diente para MICRODONCIA (ej: 1.6):');
    if (!tooth) return;
    if (!setInputForTooth(tooth, 'MIC', 'blue'))
      toast.error(`No se encontró el diente ${tooth}.`);
  };

  // 16 — Movilidad patológica (siempre rojo — mal estado)
  const onMobilidad = () => {
    const tooth = askTooth('Diente para MOVILIDAD PATOLÓGICA (ej: 1.6):');
    if (!tooth) return;
    if (!setInputForTooth(tooth, 'M', 'red'))
      toast.error(`No se encontró el diente ${tooth}.`);
  };

  // 17 — Pieza dentaria ausente
  const onSelectPDA = (typeId, color = 'blue') => {
    setPDAMenuOpen(false);
    const tooth = askTooth(
      `Diente para Pieza Dentaria Ausente ${typeId} (ej: 2.7):`
    );
    if (!tooth) return;
    try {
      setInputForTooth(tooth, typeId, color);
      odontogramaTools.addMissingTooth(tooth, color);
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar PDA.');
    }
  };

  // 18 — Pieza en clavija
  const onPiezaClavija = () => {
    const tooth = askTooth('Diente en clavija (PC) (ej: 2.7):');
    if (!tooth) return;
    try {
      const ok = odontogramaTools.addPegTooth(tooth, 'blue');
      if (!ok) toast.error(`No se pudo dibujar pieza en clavija en ${tooth}.`);
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar pieza en clavija.');
    }
  };

  // 19 — Pieza ectópica
  const onPiezaEctopica = () => {
    const tooth = askTooth('Diente ectópico (E) (ej: 2.7):');
    if (!tooth) return;
    if (!setInputForTooth(tooth, 'E', 'blue'))
      toast.error(`No se encontró el diente ${tooth}.`);
  };

  // 20 — Pulpotomía
  const onPulpotomia = () => {
    const tooth = askTooth('Diente para Pulpotomía (PP) (ej: 6.3):');
    if (!tooth) return;
    try {
      const color = askColor();
      setInputForTooth(tooth, 'PP', color);
      odontogramaTools.addPulpotomy(tooth, color);
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar pulpotomía.');
    }
  };

  // 21 — Transposición dentaria
  const onTransposicion = () => {
    odontogramaTools.addTransposition('blue');
  };

  // 22 — Prótesis Dental Parcial Fija
  const onPPF = () => {
    odontogramaTools.addPPF(askColor());
  };

  // 23 — Prótesis Dental Completa
  const onSelectPDC = (typeId, color) => {
    setPDCMenuOpen(false);
    const arcada =
      typeId === 'SUP_PERM' || typeId === 'SUP_DECID' ? 'superior' : 'inferior';
    try {
      const ok = odontogramaTools.addPDC(arcada, color, typeId);
      if (!ok) toast.error('No se pudo dibujar la Prótesis Completa.');
    } catch (e) {
      console.error(e);
      toast.error('Error al aplicar PDC.');
    }
  };

  // 24 — Prótesis Dental Parcial Removible
  const onProtesisPR = () => {
    odontogramaTools.addDentalProsthesis(askColor());
    toast(
      'Haz clic en el diente pilar inicial y luego en el final. ESC = cancelar.'
    );
  };

  // ── Utilidades ────────────────────────────────────────────────────────

  const onUndo = () => {
    if (odontogramaTools.clearLastAnnotation())
      toast.success('Última anotación SVG deshecha.');
    else toast.error('No hay anotaciones que deshacer.');
  };

  // FIX #3: modal interactivo en lugar de window.prompt + window.confirm
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
    toast.success('Todas las anotaciones han sido borradas.');
  };

  const onClearOneTooth = (tooth) => {
    setClearModalOpen(false);
    const svgCleared = odontogramaTools.clearAnnotationsForTooth(tooth);
    const inputCleared = clearInputForTooth(tooth);
    if (svgCleared || inputCleared)
      toast.success(`Anotaciones del diente ${tooth} borradas.`);
    else toast.error(`No se encontraron anotaciones para el diente ${tooth}.`);
  };

  // ====================================================================
  // ESTILOS INLINE COMPARTIDOS
  // ====================================================================

  // Botón de tratamiento — ancho completo, teal uniforme
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
      transition: 'background 0.15s',
    },
    // Cabecera de sección
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
    // Dropdown genérico
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
    // Grid 2 columnas
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  };

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
      {/* ── TÍTULO ─────────────────────────────────────── */}
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

      {/* ════════════════════════════════════════════════════
          1. ORTODONCIA
      ════════════════════════════════════════════════════ */}
      <div style={S.sec}>1 · Ortodoncia</div>
      <div style={S.grid2}>
        <button style={S.btn} onClick={onFixedOrtho}>
          Aparat. orto. fijo
        </button>
        <button style={S.btn} onClick={onRemovableOrtho}>
          Aparat. orto. removible
        </button>
      </div>

      {/* ════════════════════════════════════════════════════
          2. CORONAS
      ════════════════════════════════════════════════════ */}
      <div style={S.sec}>2 · Coronas</div>
      <div style={S.grid2}>
        {/* 3. Corona con submenú */}
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
                        color: col === 'blue' ? '#1d4ed8' : '#dc2626',
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
                            border: `2px solid ${col === 'blue' ? '#1d4ed8' : '#dc2626'}`,
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                            color: col === 'blue' ? '#1d4ed8' : '#dc2626',
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

        {/* 4. Corona temporal — siempre rojo (deciduos) */}
        <button style={S.btn} onClick={onCoronaTemporal}>
          4. Corona temporal (CT)
        </button>
      </div>

      {/* ════════════════════════════════════════════════════
          3. ESTADO DENTAL
      ════════════════════════════════════════════════════ */}
      <div style={S.sec}>3 · Estado dental</div>
      <div style={S.grid2}>
        {/* 5. Defectos esmalte */}
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

        {/* 6. Edéntulo */}
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

        {/* 12. Implantación dental */}
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

        {/* 17. Pieza dentaria ausente */}
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

      {/* ════════════════════════════════════════════════════
          4. ANOMALÍAS MORFOLÓGICAS
      ════════════════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════════════════
          5. POSICIÓN DENTAL
      ════════════════════════════════════════════════════ */}
      <div style={S.sec}>5 · Posición dental</div>
      <div style={S.grid2}>
        <button style={S.btn} onClick={onDiastema}>
          7. Diastema
        </button>

        {/* 11. Giroversión */}
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

      {/* ════════════════════════════════════════════════════
          6. PRÓTESIS
      ════════════════════════════════════════════════════ */}
      <div style={S.sec}>6 · Prótesis</div>
      <div style={S.grid2}>
        <button style={S.btn} onClick={onPPF}>
          22. PPF
        </button>

        {/* 23. PDC */}
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

      {/* ── MODAL DE BORRADO (FIX #3 — reemplaza window.prompt/confirm) ── */}
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
