// src/pages/hc/ExamenFisico/odotools.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import odontogramaTools from '../../../hooks/odotools';

/**
 * Panel con herramientas del odontograma.
 * Contiene: Corona, Corona temporal, Defectos (añadidos visualmente), Diastema (una X por activación),
 * Aparatos ortodónticos y utilidades de anotación.
 */

export default function OdontogramaToolsPanel({
  onSaveVersion,
  onLoadVersion,
  selectedTooth = null,
  onClearTooth,
}) {
  const crownTypes = ['CM', 'CF', 'CMC', 'CV', 'CLM'];
  const colors = ['blue', 'red'];

  const defectTypes = ['O', 'PE', 'Fluorosis'];
  const missingToothTypes = ['DNE', 'DEX', 'DAO'];
  const pdcTypes = [
    // Nuevas opciones de PDC
    { id: 'SUP_PERM', label: 'Superior Permanentes' },
    { id: 'SUP_DECID', label: 'Superior Deciduos' },
    { id: 'INF_PERM', label: 'Inferior Permanentes' },
    { id: 'INF_DECID', label: 'Inferior Deciduos' },
  ];

  const [coronaMenuOpen, setCoronaMenuOpen] = useState(false);
  const [setCoronaTempMenuOpen] = useState(false);
  const [defectMenuOpen, setDefectMenuOpen] = useState(false);
  const [edentuloMenuOpen, setEdentuloMenuOpen] = useState(false);
  const [implantMenuOpen, setImplantMenuOpen] = useState(false);

  const [activeTool, setActiveTool] = useState(null);
  const [activeToolName, setActiveToolName] = useState(null);
  const [pdaMenuOpen, setPDAMenuOpen] = useState(false);
  const [pdcMenuOpen, setPDCMenuOpen] = useState(false);
  // Color activo (NTS-188): azul = buen estado, rojo = mal estado. Reemplaza
  // los window.prompt de color (no aptos para tablet).
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

  // Si hay un diente seleccionado por click en el SVG, se usa directamente
  // (sin prompt). Si no, se recurre al window.prompt como respaldo.
  const askTooth = (message = 'Ingresa el diente (ej: 1.6)') => {
    if (selectedTooth) return selectedTooth;
    const t = window.prompt(message);
    return t ? t.trim() : null;
  };

  // Devuelve el color activo seleccionado en el panel (sin prompt).
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

  // --- Helpers para calcular bbox de foreignObject en coords SVG ---
  function foreignObjectBBoxInSvg(svg, fo) {
    try {
      try {
        const foBox = fo.getBBox();
        const foCTM = fo.getCTM ? fo.getCTM() : null;
        if (foCTM) {
          const pt1 = svg.createSVGPoint();
          pt1.x = foBox.x;
          pt1.y = foBox.y;
          const pt2 = svg.createSVGPoint();
          pt2.x = foBox.x + foBox.width;
          pt2.y = foBox.y + foBox.height;
          const t1 = pt1.matrixTransform(foCTM);
          const t2 = pt2.matrixTransform(foCTM);
          const minX = Math.min(t1.x, t2.x);
          const minY = Math.min(t1.y, t2.y);
          const maxX = Math.max(t1.x, t2.x);
          const maxY = Math.max(t1.y, t2.y);
          return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
      } catch {
        /* fallback */
      }

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
      const minX = Math.min(tTL.x, tBR.x);
      const minY = Math.min(tTL.y, tBR.y);
      const maxX = Math.max(tTL.x, tBR.x);
      const maxY = Math.max(tTL.y, tBR.y);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
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

  // Busca el foreignObject más apropiado y escribe texto/color en su input
  function setInputForTooth(tooth, text, color) {
    try {
      const svg = odontogramaTools.getSvg();
      if (!svg) return false;
      const info = odontogramaTools.getToothBBox(svg, tooth);
      if (!info) return false;
      const toothBox = info.bbox;
      const inputs = Array.from(svg.querySelectorAll('foreignObject'));
      if (!inputs.length) return false;

      let bestFo = null;
      let bestOverlap = -1;
      let bestDist = Infinity;
      let bestFoByDist = null;

      const toothCenter = {
        x: toothBox.x + toothBox.width / 2,
        y: toothBox.y + toothBox.height / 2,
      };

      for (const fo of inputs) {
        const foBox = foreignObjectBBoxInSvg(svg, fo);
        if (!foBox) continue;
        const overlap = rectIntersectionArea(foBox, toothBox);
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestFo = fo;
        }
        const foCenter = {
          x: foBox.x + foBox.width / 2,
          y: foBox.y + foBox.height / 2,
        };
        const dist = Math.hypot(
          foCenter.x - toothCenter.x,
          foCenter.y - toothCenter.y
        );
        if (dist < bestDist) {
          bestDist = dist;
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

  // AÑADISTE
  function clearInputForTooth(tooth) {
    try {
      const svg = odontogramaTools.getSvg();
      if (!svg) return false;
      const info = odontogramaTools.getToothBBox(svg, tooth);
      if (!info) return false;
      const toothBox = info.bbox;
      const inputs = Array.from(svg.querySelectorAll('foreignObject'));
      if (!inputs.length) return false;

      let bestFo = null;
      let bestOverlap = -1;
      let bestDist = Infinity;
      let bestFoByDist = null;

      const toothCenter = {
        x: toothBox.x + toothBox.width / 2,
        y: toothBox.y + toothBox.height / 2,
      };

      for (const fo of inputs) {
        const foBox = foreignObjectBBoxInSvg(svg, fo); // foreignObjectBBoxInSvg ya existe
        if (!foBox) continue;
        const overlap = rectIntersectionArea(foBox, toothBox); // rectIntersectionArea ya existe
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestFo = fo;
        }
        const foCenter = {
          x: foBox.x + foBox.width / 2,
          y: foBox.y + foBox.height / 2,
        };
        const dist = Math.hypot(
          foCenter.x - toothCenter.x,
          foCenter.y - toothCenter.y
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestFoByDist = fo;
        }
      }

      const chosenFo = bestOverlap > 0 ? bestFo : bestFoByDist;
      if (!chosenFo) return false;
      const input = chosenFo.querySelector('input, textarea');
      if (!input) return false;
      // --- Lógica de Limpieza ---
      input.value = '';
      input.style.border = '';
      input.style.color = '';
      return true;
    } catch (e) {
      console.error('clearInputForTooth error', e);
      return false;
    }
  }
  // --- CORONA (mantener comportamiento original) ---  // MODIFICASTE
  const onSelectCorona = (type, color) => {
    setCoronaMenuOpen(false);
    const tooth = askTooth(
      `Ingresa número de diente para aplicar ${type} (${color}) (ej: 2.7):`
    );
    if (!tooth) return;
    try {
      const includedParts = [
        'fosas',
        'surcos',
        'fosa1',
        'fosa2',
        'fosa3',
        'surco1',
        'surco2',
        'surco3',
      ];
      const ok = odontogramaTools.addCrown(tooth, type, color, includedParts);
      if (!ok) {
        toast.error(
          `No se encontró el diente ${tooth}. Asegúrate de escribirlo exactamente como en la etiqueta (ej: 2.7).`
        );
        return;
      }
      setInputForTooth(tooth, type, color);
    } catch (e) {
      console.error('Error aplicando corona:', e);
      toast.error(
        'Ocurrió un error al intentar aplicar la corona. Revisa la consola.'
      );
    }
  };

  const onCoronaButton = () => {
    setCoronaMenuOpen((s) => !s);
    setCoronaTempMenuOpen(false);
    setDefectMenuOpen(false);
    setEdentuloMenuOpen(false);
  };

  const onCoronaTemporal = () => {
    const tooth = askTooth(
      'Ingresa número de diente para aplicar Corona Temporal (CT) (ej: 2.7):'
    );
    if (!tooth) return;
    try {
      const includedParts = [
        'fosas',
        'surcos',
        'fosa1',
        'fosa2',
        'fosa3',
        'surco1',
        'surco2',
        'surco3',
      ];
      const crownType = 'CT';
      const color = 'red';
      const ok = odontogramaTools.addCrown(
        tooth,
        crownType,
        color,
        includedParts
      );
      if (!ok) {
        toast.error(`No se encontró el diente ${tooth}.`);
        return;
      }
      setInputForTooth(tooth, crownType, color);
    } catch (e) {
      console.error('Error aplicando corona temporal:', e);
      toast.error(
        'Ocurrió un error al intentar aplicar la corona temporal. Revisa la consola.'
      );
    }
  };

  const onCoronaTempButton = () => {
    onCoronaTemporal();
  };

  // --- DEFECTOS: ahora además dibuja marcador en SVG usando addDefect ---
  const onSelectDefect = (defect) => {
    setDefectMenuOpen(false);
    const tooth = askTooth(
      `Ingresa número de diente para aplicar defecto "${defect}" (ej: 2.7):`
    );
    if (!tooth) return;
    try {
      const color = 'red';
      const ok = setInputForTooth(tooth, defect, color);
      try {
        if (typeof odontogramaTools.addDefect === 'function') {
          odontogramaTools.addDefect(tooth, defect, color);
        }
      } catch (err) {
        console.error('Error dibujando defecto en SVG:', err);
      }
      if (!ok) {
        // opcional: notificar, pero no obligatorio
      }
    } catch (e) {
      console.error('Error aplicando defecto:', e);
      toast.error(
        'Ocurrió un error al intentar aplicar el defecto. Revisa la consola.'
      );
    }
  };

  const onDefectButton = () => {
    setDefectMenuOpen((s) => !s);
    setCoronaMenuOpen(false);
    setCoronaTempMenuOpen(false);
    setEdentuloMenuOpen(false);
  };

  // --- ORTHO MODES (mantener comportamiento) ---
  const onFixedOrtho = () => {
    const color = askColor('blue');
    try {
      const handle = odontogramaTools.startFixedOrthoMode(color);
      if (handle && typeof handle.stop === 'function') {
        setActiveTool(handle);
        setActiveToolName('Aparato ortod. fijo');
      }
      toast(
        'Modo "Aparato ortodóntico fijo": Haz click en dos puntos del odontograma para dibujar la línea.\nPresiona ESC para cancelar o usa el botón "Detener modo".'
      );
    } catch (e) {
      console.error('Error iniciando modo fijo:', e);
      toast.error('No se pudo iniciar el modo. Revisa la consola.');
    }
  };

  const onRemovableOrtho = () => {
    const color = askColor();
    // Valores estándar del zig-zag (sin prompts; aptos para tablet).
    const steps = 10;
    const amplitude = 10;

    try {
      const handle = odontogramaTools.startRemovableOrthoMode(
        color,
        steps,
        amplitude
      );
      if (handle && typeof handle.stop === 'function') {
        setActiveTool(handle);
        setActiveToolName('Aparato ortod. removible');
      }
      toast(
        'Modo "Aparato ortodóntico removible": Haz click en dos puntos del odontograma para dibujar el zig-zag.\nPresiona ESC para cancelar o usa el botón "Detener modo".'
      );
    } catch (e) {
      console.error('Error iniciando modo removible:', e);
      toast.error('No se pudo iniciar el modo. Revisa la consola.');
    }
  };

  // --- FOSAS Y FISURAS PROFUNDAS (nuevo) ---
  // Este manejador pregunta el diente y aplica la sigla "FFP" en azul,
  // tanto en el input asociado (foreignObject) como con una etiqueta SVG.
  const onFosasFisurasProfundas = () => {
    const tooth = askTooth('Diente para FOSAS Y FISURAS PROFUNDAS (ej: 1.6):');
    if (!tooth) return;
    try {
      // intenta primero la función del hook (dibuja etiqueta y escribe en input si puede)
      if (typeof odontogramaTools.addFosasFisurasProfundas === 'function') {
        const ok = odontogramaTools.addFosasFisurasProfundas(
          tooth,
          '#FFFFFF00'
        );
        // también asegúrate de escribir en el input mediante la utilidad local (por si la función del hook no encontró el foreignObject)
        setInputForTooth(tooth, 'FFP', 'blue');
        if (!ok) {
          // si no encontró centro/diente en SVG, avisar
          toast.error(
            `No se pudo anotar "FFP" en el odontograma para el diente ${tooth}. Revisa la consola.`
          );
        }
      } else {
        // si no está disponible la función en el hook, cae a escribir solo en el input
        const wrote = setInputForTooth(tooth, 'FFP', 'blue');
        if (!wrote)
          toast.error(
            `No se encontró el diente ${tooth} ni el input asociado.`
          );
      }
    } catch (e) {
      console.error('Error aplicando FFP:', e);
      toast.error('Ocurrió un error al aplicar FFP. Revisa la consola.');
    }
  };

  const onFractura = () => {
    // Nota: el botón originalmente estaba asignado a "Fosas y fisuras profundas".
    // Reemplazamos su comportamiento por la nueva función que pregunta y aplica "FFP".
    onFosasFisurasProfundas();
  };

  // --- IMPLANTE DENTAL (nuevo) ---
  // Ahora: al presionar el botón principal se abre un subpanel con dos opciones:
  // "IMP rojo" y "IMP azul". Al elegir una opción se pide el diente y se aplica IMP del color.
  const onImplanteButton = () => {
    setImplantMenuOpen((s) => !s);
    // cerrar otros menús
    setCoronaMenuOpen(false);
    setCoronaTempMenuOpen(false);
    setDefectMenuOpen(false);
    setEdentuloMenuOpen(false);
  };

  const onImplanteColor = (color) => {
    setImplantMenuOpen(false);
    const tooth = askTooth(
      `Diente para IMPLANTE (IMP ${color.toUpperCase()}) (ej: 1.6):`
    );
    if (!tooth) return;
    try {
      if (typeof odontogramaTools.addImplant === 'function') {
        const ok = odontogramaTools.addImplant(tooth, '#FFFFFF00');
        // respaldo: escribir en el input por si el hook no encuentra el foreignObject
        setInputForTooth(tooth, 'IMP', color);
        if (!ok) {
          toast.error(
            `No se pudo anotar "IMP" en el odontograma para el diente ${tooth}. Revisa la consola.`
          );
        }
      } else {
        const wrote = setInputForTooth(tooth, 'IMP', color);
        if (!wrote)
          toast.error(
            `No se encontró el diente ${tooth} ni el input asociado.`
          );
      }
    } catch (err) {
      console.error('Error aplicando implante:', err);
      toast.error(
        'Ocurrió un error al intentar anotar el implante. Revisa la consola.'
      );
    }
  };
  /// actualizado MODIFICASTE
  const onClear = () => {
    const action = window.prompt(
      'Selecciona la acción de limpieza:\n' +
        '1) Borrar TODAS las anotaciones (Limpieza Total).\n' +
        '2) Borrar anotaciones de un DIENTE específico (Ej: 1.6).\n' +
        'Escribe 1, 2, o el número del diente directamente si eliges la opción 2.'
    );

    if (!action) return;

    const normalizedAction = action.trim();

    if (normalizedAction === '1') {
      if (
        window.confirm(
          '¿Confirmas que deseas borrar *todas* las anotaciones del odontograma y textos asociados?'
        )
      ) {
        // Limpieza total SVG
        odontogramaTools.clearAnnotations();

        // Limpiar todos los inputs de texto
        const svg = odontogramaTools.getSvg();
        if (svg) {
          svg
            .querySelectorAll('foreignObject input, foreignObject textarea')
            .forEach((input) => {
              input.value = '';
              input.style.border = '';
              input.style.color = '';
            });
        }
        toast.success(
          'Todas las anotaciones y textos asociados han sido borrados.'
        );
      }
    } else if (
      normalizedAction === '2' ||
      normalizedAction.match(/^[1-8]\.[1-8]\d?$/)
    ) {
      // Opción 2: Borrar por diente (o el usuario ingresó un diente directamente)
      let tooth = normalizedAction;
      if (normalizedAction === '2') {
        tooth = askTooth('Ingresa el número de diente a limpiar (ej: 1.6):');
        if (!tooth) return;
      }

      if (
        window.confirm(
          `¿Confirmas que deseas borrar las anotaciones del diente ${tooth}?`
        )
      ) {
        const clearedSVG = odontogramaTools.clearAnnotationsForTooth(tooth);
        const clearedInput = clearInputForTooth(tooth);

        if (clearedSVG || clearedInput) {
          toast.success(
            `Se limpiaron las anotaciones y/o el input del diente ${tooth}.`
          );
        } else {
          toast.error(`No se encontraron anotaciones para el diente ${tooth}.`);
        }
      }
    } else {
      toast.error(
        'Opción no reconocida o diente inválido. Asegúrate de usar el formato X.Y (ej: 1.6).'
      );
    }
  };

  // --- NUEVA FUNCIÓN DE RETROCEDER (UNDO) --- AÑADISTE
  const onUndo = () => {
    const success = odontogramaTools.clearLastAnnotation();
    if (success) {
      // Nota: El deshecho del texto del input asociado es complejo de automatizar,
      // se le indica al usuario que lo haga manualmente si es necesario.
      toast.success(
        'Se ha deshecho la *última anotación SVG*. Por favor, verifica el texto del input asociado y corrígelo manualmente si es necesario.'
      );
    } else {
      toast.error('No hay anotaciones previas que deshacer.');
    }
  };

  // --- DIASTEMA: dibuja UNA sola X y el modo queda inactivo automáticamente ---
  const onDiastema = () => {
    const color = 'blue';
    const sizeX = 18;
    const sizeY = 44;
    const strokeWidth = 1;

    if (typeof odontogramaTools.startDiastemaMode !== 'function') {
      toast.error(
        'Función de diastema no disponible. Revisa src/hooks/odotools.js'
      );
      return;
    }

    const handle = odontogramaTools.startDiastemaMode(
      color,
      sizeX,
      sizeY,
      strokeWidth,
      () => {
        // limpiar estado activo del panel tras dibujar la X o cancelar
        setActiveTool(null);
        setActiveToolName(null);
      }
    );

    if (handle && typeof handle.stop === 'function') {
      setActiveTool(handle);
      setActiveToolName('Diastema');
    }
    toast(
      'Modo Diastema activo: haz click donde quieras colocar la "X" azul. Presiona ESC para salir.'
    );
  };

  // --- EDENTULO: desplegar SUBBOTONES y dibujar línea recta entre centros de dientes ---
  const onEdentuloButton = () => {
    setEdentuloMenuOpen((s) => !s);
    setCoronaMenuOpen(false);
    setCoronaTempMenuOpen(false);
    setDefectMenuOpen(false);
  };

  const onEdentuloSuperior = () => {
    // según el requerimiento: dibujar linea recta desde 1.8 hasta 2.8 (centros)
    const start = '1.8';
    const end = '2.8';
    try {
      if (typeof odontogramaTools.addEdentulousLineBetween === 'function') {
        odontogramaTools.addEdentulousLineBetween(start, end, 'Blue', 2);
      } else {
        toast.error('Función de edéntulo no disponible en hooks.');
      }
    } catch (err) {
      console.error('Error dibujando edéntulo superior', err);
    } finally {
      setEdentuloMenuOpen(false);
    }
  };

  const onEdentuloInferior = () => {
    // según el requerimiento: dibujar linea recta desde 4.8 hasta 3.8 (centros)
    const start = '4.8';
    const end = '3.8';
    try {
      if (typeof odontogramaTools.addEdentulousLineBetween === 'function') {
        odontogramaTools.addEdentulousLineBetween(start, end, 'blue', 2);
      } else {
        toast.error('Función de edéntulo no disponible en hooks.');
      }
    } catch (err) {
      console.error('Error dibujando edéntulo inferior', err);
    } finally {
      setEdentuloMenuOpen(false);
    }
  };

  // MACRODONCIA
  const onMacrodoncia = () => {
    const tooth = askTooth('Diente para MACRODONCIA (ej: 1.6):');
    if (!tooth) return;
    try {
      const ok = setInputForTooth(tooth, 'MAC', 'blue');
      if (!ok) {
        toast.error(
          `No se encontró el diente ${tooth} ni su recuadro de texto asociado.`
        );
      }
    } catch (err) {
      console.error('Error aplicando MAC:', err);
      toast.error(
        'Ocurrió un error al intentar anotar MAC. Revisa la consola.'
      );
    }
  };
  // --- RENDER ---

  // Im´lantación
  const onImplantacion2 = () => {
    const tooth = askTooth('Diente para IMPLANTACIÓN (ej: 1.6):');
    if (!tooth) return;
    try {
      const ok = setInputForTooth(tooth, 'I', 'blue');
      if (!ok) {
        toast.error(
          `No se encontró el diente ${tooth} ni su recuadro de texto asociado.`
        );
      }
    } catch (err) {
      console.error('Error aplicando I:', err);
      toast.error('Ocurrió un error al intentar anotar I. Revisa la consola.');
    }
  };

  // GERMINACION
  const onGerminacion = () => {
    const tooth = askTooth('Diente para GERMINACIÓN (ej: 1.6):');
    if (!tooth) return;
    try {
      if (typeof odontogramaTools.addGerminacion === 'function') {
        const ok = odontogramaTools.addGerminacion(tooth, 'blue');
        if (!ok) {
          toast.error(
            `No se pudo dibujar la germinación en el diente ${tooth}. Revisa la consola.`
          );
        }
      } else {
        toast.error(
          'La función addGerminacion no está disponible en hooks/odotools.'
        );
      }
    } catch (err) {
      console.error('Error aplicando germinación:', err);
      toast.error(
        'Ocurrió un error al aplicar germinación. Revisa la consola.'
      );
    }
  };

  //
  const onFusion = () => {
    const tooth = askTooth('Diente para FUSIÓN (ej: 1.7):');
    if (!tooth) return;

    try {
      if (typeof odontogramaTools.addFusion === 'function') {
        const ok = odontogramaTools.addFusion(tooth, 'blue');
        if (!ok) {
          toast.error(
            `No se pudo dibujar la FUSIÓN en el diente ${tooth}. Revisa la consola.`
          );
        }
      } else {
        toast.error(
          'La función addFusion no está disponible en hooks/odotools.'
        );
      }
    } catch (err) {
      console.error('Error aplicando FUSIÓN:', err);
      toast.error('Ocurrió un error al aplicar FUSIÓN. Revisa la consola.');
    }
  };

  // GIROVERSIÓN

  const [giroMenuOpen, setGiroMenuOpen] = useState(false);

  const onGiroversionButton = () => {
    setGiroMenuOpen((s) => !s);
    // cerrar otros menús
    setCoronaMenuOpen(false);
    setCoronaTempMenuOpen(false);
    setDefectMenuOpen(false);
    setEdentuloMenuOpen(false);
    setImplantMenuOpen(false);
  };

  const onGiroversionDirection = (direction) => {
    setGiroMenuOpen(false);
    const tooth = askTooth(
      `Diente para GIROVERSIÓN (ej: 1.7). Flecha hacia ${direction === 'right' ? 'derecha' : 'izquierda'}:`
    );
    if (!tooth) return;
    try {
      if (typeof odontogramaTools.addGiroversion === 'function') {
        const ok = odontogramaTools.addGiroversion(tooth, direction, 'blue');
        if (!ok) {
          toast.error(
            `No se pudo dibujar giroversión para ${tooth}. Revisa la consola.`
          );
        }
      } else {
        toast.error(
          'La función addGiroversion no está disponible en hooks/odotools.'
        );
      }
    } catch (err) {
      console.error('Error aplicando giroversión:', err);
      toast.error(
        'Ocurrió un error al aplicar giroversión. Revisa la consola.'
      );
    }
  };
  // --- RENDER ---

  // mícrodoncia
  const onMicrodoncia = () => {
    const tooth = askTooth('Diente para MICRODONCIA (ej: 1.6):');
    if (!tooth) return;
    try {
      const ok = setInputForTooth(tooth, 'MIC', 'blue');
      if (!ok) {
        toast.error(
          `No se encontró el diente ${tooth} ni su recuadro de texto asociado.`
        );
      }
    } catch (err) {
      console.error('Error aplicando MIC:', err);
      toast.error(
        'Ocurrió un error al intentar anotar MIC. Revisa la consola.'
      );
    }
  };

  // render
  //19
  const onMobilidad = () => {
    const tooth = askTooth('Diente para MOVILIDAD (ej: 1.6):');
    if (!tooth) return;
    try {
      const ok = setInputForTooth(tooth, 'M', 'red');
      if (!ok) {
        toast.error(
          `No se encontró el diente ${tooth} ni su recuadro de texto asociado.`
        );
      }
    } catch (err) {
      console.error('Error aplicando M:', err);
      toast.error('Ocurrió un error al intentar anotar M. Revisa la consola.');
    }
  };

  const onSelectPDA = (typeId, color = 'blue') => {
    setPDAMenuOpen(false); // Cierra el menú
    const tooth = askTooth(`Diente de Dentaría Ausente (ej: 2.7):`);
    if (!tooth) return;
    try {
      const ok = setInputForTooth(tooth, typeId, color);
      if (!ok) {
        toast.error(
          `No se encontró el diente ${tooth} ni su recuadro de texto asociado.`
        );
      }
      odontogramaTools.addMissingTooth(tooth, color);
    } catch (e) {
      console.error('Error aplicando PDA:', e);
      toast.error(
        'Ocurrió un error al intentar aplicar la Pieza de dentadura ausente. Revisa la consola.'
      );
    }
  };

  const onPDAButton = () => {
    setPDAMenuOpen((s) => !s);
  };

  const onPiezaEctopica = () => {
    const tooth = askTooth('Diente Ectópico (ej: 2.7):');
    if (!tooth) return;
    try {
      const ok = setInputForTooth(tooth, 'E', 'blue');
      if (!ok) {
        toast.error(
          `No se encontró el diente ${tooth} ni su recuadro de texto asociado.`
        );
      }
    } catch (e) {
      console.error('Error aplicando Pieza Dentaria Ectópica:', e);
      toast.error('Ocurrió un error al intentar anotar. Revisa la consola.');
    }
  };

  const onPiezaClavija = () => {
    const tooth = askTooth('Diente en Clavija (ej: 2.7):');
    if (!tooth) return;
    try {
      const ok = odontogramaTools.addPegTooth(tooth, 'blue');
      if (!ok) {
        toast.error(
          `No se pudo dibujar la Pieza dentaria en clavija en el diente ${tooth}.`
        );
      }
    } catch (e) {
      console.error('Error aplicando Pieza en Clavija:', e);
      toast.error(
        'Ocurrió un error al intentar aplicar la Pieza dentaria en clavija. Revisa la consola.'
      );
    }
  };

  const onPulpotomia = () => {
    const tooth = askTooth('Diente para Pulpotomía (ej: 1.6):');
    if (!tooth) return;
    try {
      const color = askColor('blue');
      const ok = setInputForTooth(tooth, 'PP', color);
      if (!ok) {
        toast.error(
          `No se encontró el diente ${tooth} ni su recuadro de texto asociado.`
        );
      }
      odontogramaTools.addPulpotomy(tooth, color);
      //const svg = document.querySelector('svg.odo');
    } catch (err) {
      console.error('Error aplicando:', err);
      toast.error('Ocurrió un error al intentar anotar. Revisa la consola.');
    }
  };

  const onProtesisPR = () => {
    const color = askColor('blue');
    odontogramaTools.addDentalProsthesis(color);
    toast(
      'Modo "PPR": Haz click en el diente pilar inicial y luego en el diente pilar final.\nPresiona ESC para cancelar.'
    );
  };

  const onSelectPDC = (typeId, color) => {
    setPDCMenuOpen(false); // Cierra el menú
    let arcada;

    if (typeId === 'SUP_PERM' || typeId === 'SUP_DECID') {
      arcada = 'superior';
    } else {
      // INF_PERM o INF_DECID
      arcada = 'inferior';
    }

    try {
      const ok = odontogramaTools.addPDC(arcada, color, typeId);
      if (!ok) {
        toast.error(
          'No se pudo dibujar la Prótesis Completa. Revisa si los molares terminales están presentes.'
        );
      }
    } catch (e) {
      console.error('Error aplicando PDC:', e);
      toast.error(
        'Ocurrió un error al intentar aplicar la Prótesis Completa. Revisa la consola.'
      );
    }
  };

  const onPDCButton = () => {
    setPDCMenuOpen((s) => !s);
  };

  const onPPF = () => {
    const color = askColor('blue');
    odontogramaTools.addPPF(color);
  };

  const onTransposicion = () => {
    //const color = askColor('red'); // Pide el color (normalmente rojo)
    // Llama a la nueva función interactiva
    odontogramaTools.addTransposition('blue');
  };

  // render

  //LESION

  return (
    <div
      className="p-4 rounded-lg shadow-lg"
      style={{
        width: '400px',
        background: '#fff',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      <h3 className="text-xl font-bold mb-2">Tratamientos</h3>

      {/* Banner del diente seleccionado por click (Track B) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          marginBottom: 12,
          borderRadius: 8,
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
            👆 Haz click en un diente del odontograma para seleccionarlo, luego
            elige un tratamiento.
          </span>
        )}
      </div>

      {/* Selector de color activo (NTS-188) — reemplaza los prompts de color */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
          Color:
        </span>
        {[
          { val: 'blue', label: 'Azul', hex: '#1d4ed8' },
          { val: 'red', label: 'Rojo', hex: '#dc2626' },
        ].map((c) => {
          const activo = colorActivo === c.val;
          return (
            <button
              key={c.val}
              onClick={() => setColorActivo(c.val)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 6,
                border: activo ? `2px solid ${c.hex}` : '2px solid #e5e7eb',
                background: activo ? c.hex : 'white',
                color: activo ? 'white' : '#374151',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: c.hex,
                  border: activo ? '1px solid white' : 'none',
                }}
              />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          className="px-3 py-2 bg-teal-600 text-white rounded"
          onClick={onFixedOrtho}
        >
          1. Aparato ortodóntico fijo
        </button>

        <button
          className="px-3 py-2 bg-teal-600 text-white rounded"
          onClick={onRemovableOrtho}
        >
          2. Aparato ortodóntico removible
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="px-3 py-2 bg-teal-600 text-white rounded w-full"
            onClick={onCoronaButton}
            aria-expanded={coronaMenuOpen}
          >
            3. CORONA
          </button>

          {coronaMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 60,
                background: 'white',
                border: '1px solid #ddd',
                padding: 8,
                display: 'flex',
                gap: 12,
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                width: 320,
              }}
            >
              {colors.map((col) => (
                <div key={col} style={{ flex: 1 }}>
                  <div style={{ marginBottom: 6, fontWeight: 600, color: col }}>
                    {col.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {crownTypes.map((t) => (
                      <button
                        key={t + col}
                        onClick={() => onSelectCorona(t, col)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: `2px solid ${col}`,
                          background: 'white',
                          cursor: 'pointer',
                        }}
                        title={`Aplicar ${t} (${col})`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={() => {
                    setCoronaMenuOpen(false);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    background: '#f8f8f8',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="px-3 py-2 bg-teal-600 text-white rounded w-full"
            onClick={onCoronaTempButton}
          >
            4. Corona temporal
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="px-3 py-2 bg-teal-600 text-white rounded w-full"
            onClick={onDefectButton}
            aria-expanded={defectMenuOpen}
          >
            5. Defectos de desarrollo del esmalte
          </button>

          {defectMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 60,
                background: 'white',
                border: '1px solid #ddd',
                padding: 8,
                display: 'flex',
                gap: 12,
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                width: 260,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 6, fontWeight: 700, color: 'red' }}>
                  Opciones (texto en rojo)
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  {defectTypes.map((d) => (
                    <button
                      key={d}
                      onClick={() => onSelectDefect(d)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        background: 'white',
                        cursor: 'pointer',
                        color: 'red',
                        fontWeight: 600,
                      }}
                      title={`Aplicar defecto ${d}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={() => {
                    setDefectMenuOpen(false);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    background: '#f8f8f8',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* EDENTULO: muestra sub-botones SUPERIOR/INFERIOR */}
        <div style={{ position: 'relative' }}>
          <button
            className="px-3 py-2 bg-teal-600 text-white rounded w-full"
            onClick={onEdentuloButton}
            aria-expanded={edentuloMenuOpen}
          >
            6 Edéntulo
          </button>

          {edentuloMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 60,
                background: 'white',
                border: '1px solid #ddd',
                padding: 8,
                display: 'flex',
                gap: 8,
                boxShadow: '0 6px 18px rgba(21, 87, 220, 0.92)',
                width: 220,
              }}
            >
              <button
                onClick={onEdentuloSuperior}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#f3f3f3',
                  cursor: 'pointer',
                }}
              >
                SUPERIOR
              </button>
              <button
                onClick={onEdentuloInferior}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#f3f3f3',
                  cursor: 'pointer',
                }}
              >
                INFERIOR
              </button>
            </div>
          )}
        </div>

        <button
          className="px-3 py-2 bg-teal-500 text-white rounded"
          onClick={onDiastema}
        >
          7. Diastema
        </button>

        <button
          className="px-3 py-2 bg-teal-600 text-white rounded"
          onClick={onFractura}
        >
          8. Fosas y fisuras profundas
        </button>

        {/*<button className="px-3 py-2 bg-teal-500 text-black rounded" onClick={onClear}>
           Fractura dental
        </button> */}

        <button
          className="px-3 py-2 bg-teal-700 text-white rounded"
          onClick={onFusion}
        >
          9 Fusión
        </button>

        <button
          className="px-3 py-2 bg-teal-500 text-white rounded"
          onClick={onGerminacion}
        >
          10 Germinación
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="px-3 py-2 bg-teal-500 text-white rounded w-full"
            onClick={onGiroversionButton}
            aria-expanded={giroMenuOpen}
          >
            11. Giroversión
          </button>

          {giroMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 70,
                background: 'white',
                border: '1px solid #ddd',
                padding: 8,
                display: 'flex',
                gap: 8,
                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                width: 260,
              }}
            >
              <button
                onClick={() => onGiroversionDirection('right')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#eef',
                  cursor: 'pointer',
                  color: 'blue',
                  fontWeight: 700,
                }}
              >
                Derecha
              </button>
              <button
                onClick={() => onGiroversionDirection('left')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#eef',
                  cursor: 'pointer',
                  color: 'blue',
                  fontWeight: 700,
                }}
              >
                Izquierda
              </button>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="px-3 py-2 bg-teal-500 text-white rounded"
            onClick={onImplanteButton}
            aria-expanded={implantMenuOpen}
          >
            12. Implantación dental
          </button>
          {implantMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 70,
                background: 'white',
                border: '1px solid #ddd',
                padding: 8,
                display: 'flex',
                gap: 8,
                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                width: 260,
              }}
            >
              <button
                onClick={() => onImplanteColor('red')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#fee',
                  cursor: 'pointer',
                  color: 'red',
                  fontWeight: 700,
                }}
              >
                IMP
              </button>
              <button
                onClick={() => onImplanteColor('blue')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  background: '#eef',
                  cursor: 'pointer',
                  color: 'blue',
                  fontWeight: 700,
                }}
              >
                IMP
              </button>
            </div>
          )}
        </div>
        <button
          className="px-3 py-2 bg-teal-500 text-white rounded"
          onClick={onImplantacion2}
        >
          13. Impactacion
        </button>
        {/* <button className="px-3 py-2 bg-teal-500 text-white rounded" onClick={onClear}>
           Lesión de caries dental
        </button>*/}
        <button
          className="px-3 py-2 bg-teal-500 text-white rounded"
          onClick={onMacrodoncia}
        >
          14. Macrodoncia
        </button>
        <button
          className="px-3 py-2 bg-teal-500 text-white rounded"
          onClick={onMicrodoncia}
        >
          15. MICRODONCIA
        </button>
        <button
          className="px-3 py-2 bg-teal-500 text-white rounded"
          onClick={onMobilidad}
        >
          16. MOVILIDAD PATOLÓGIA
        </button>
        <div style={{ position: 'relative' }}>
          <button
            className="px-3 py-2 bg-teal-600 text-white rounded w-full"
            onClick={onPDAButton}
            aria-expanded={pdaMenuOpen}
          >
            17. Piesa dentaria ausente (PDA)
          </button>
          {pdaMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 60,
                background: 'white',
                border: '1px solid #ddd',
                padding: 8,
                display: 'flex',
                gap: 12,
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                width: 320,
              }}
            >
              {colors
                .filter((col) => col === 'blue')
                .map((col) => (
                  <div key={col} style={{ flex: 1 }}>
                    <div
                      style={{ marginBottom: 6, fontWeight: 600, color: col }}
                    >
                      {col.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {missingToothTypes.map((t) => (
                        <button
                          key={t + col}
                          onClick={() => onSelectPDA(t, col)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: `2px solid ${col}`,
                            background: 'white',
                            cursor: 'pointer',
                          }}
                          title={`Aplicar ${t} (${col})`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={() => {
                    setPDAMenuOpen(false);
                  }}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    background: '#f8f8f8',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          className="px-3 py-2 bg-teal-500 text-white rounded"
          onClick={onPiezaClavija}
        >
          18. Pieza Dentaria en Clavija (PC)
        </button>
        <button
          className="px-3 py-2 bg-teal-600 text-white rounded"
          onClick={onPiezaEctopica}
        >
          19. Pieza Dentaria Ectópica
        </button>
        <button
          className="px-3 py-2 bg-teal-700 text-white rounded"
          onClick={onPulpotomia}
        >
          20. Pulpotomía
        </button>
        <button
          className="px-3 py-2 bg-teal-600 text-white rounded"
          onClick={onTransposicion}
        >
          21. Transposición dentaria
        </button>
        <button
          className="px-3 py-2 bg-teal-700 text-white rounded"
          onClick={onPPF}
        >
          22. Prótesis Dental Parcial Fija (PPF)
        </button>
        <div className="relative">
          <button
            className="px-3 py-2 bg-teal-500 text-white rounded"
            onClick={onPDCButton}
          >
            23. Prótesis Dental Completa (PDC)
          </button>
          {pdcMenuOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 p-2">
              {pdcTypes.map((type) => (
                <div key={type.id} className="p-1">
                  <p className="text-sm font-bold mb-1">{type.label}</p>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={`text-xs px-2 py-1 rounded border ${
                          color === 'blue'
                            ? 'bg-blue-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                        onClick={() => onSelectPDC(type.id, color)}
                      >
                        {color.charAt(0).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className="px-3 py-2 bg-teal-600 text-white rounded"
          onClick={onProtesisPR}
        >
          24. Protesis dental parcial removible (PPR)
        </button>
      </div>

      {activeTool && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <strong>Modo activo:</strong> {activeToolName || 'Interactivo'}
          </div>
          <button
            onClick={stopActiveTool}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              border: '1px solid #ccc',
              background: '#f3f3f3',
            }}
          >
            Detener mod
          </button>
        </div>
      )}

      <div className="flex flex-col space-y-3 mt-5">
        <button
          className="px-3 py-2 bg-red-600 text-white rounded font-bold"
          onClick={onClear}
        >
          Borrar 🗑️
        </button>

        <button
          className="px-3 py-2 bg-gray-500 text-white rounded font-bold"
          onClick={onUndo}
          title="Deshace la última anotación SVG"
        >
          Deshacer 🔄
        </button>

        <button
          className="px-3 py-2 bg-blue-700 text-white rounded font-bold"
          onClick={onLoadVersion}
        >
          Historial de versiones
        </button>

        <button
          className="px-3 py-2 bg-blue-900 text-white rounded font-bold"
          onClick={onSaveVersion}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}
