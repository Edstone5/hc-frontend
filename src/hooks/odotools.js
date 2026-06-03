/* Utilities para anotar el odontograma SVG (versión completa).
   Incluye: utilidades geométricas, addCrown, modos interactivos (corona, ortho, diastema), etc.
   (Archivo modificado para añadir función: addFosasFisurasProfundas)
*/
import toast from 'react-hot-toast';

function getSvg() {
  return document.querySelector('svg.odo');
}

function ensureOverlay(svg) {
  let overlay = svg.querySelector('#odontograma-overlay');
  if (!overlay) {
    overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    overlay.setAttribute('id', 'odontograma-overlay');
    svg.appendChild(overlay);
  }
  return overlay;
}

function transformPointWithCTM(svg, ctm, x, y) {
  if (!ctm) return { x, y };
  const pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  const p = pt.matrixTransform(ctm);
  return { x: p.x, y: p.y };
}

// Devuelve la matriz que transforma coordenadas locales del elemento
// al espacio de usuario del SVG (coordenadas viewBox), no a píxeles CSS.
// getCTM() da píxeles CSS; aquí componemos getScreenCTM del elemento con
// el inverso del getScreenCTM del SVG para obtener unidades viewBox correctas.
function getElementToSvgMatrix(el, svg) {
  try {
    const elemScreen = el.getScreenCTM ? el.getScreenCTM() : null;
    const svgScreen = svg.getScreenCTM ? svg.getScreenCTM() : null;
    if (elemScreen && svgScreen && typeof svgScreen.inverse === 'function') {
      return svgScreen.inverse().multiply(elemScreen);
    }
  } catch {
    /* ignore */
  }
  return el.getCTM ? el.getCTM() : null;
}

function parsePointsAttr(pointsAttr) {
  if (!pointsAttr) return [];
  const nums = pointsAttr.match(/-?(?:\d+|\d*\.\d+)(?:e[+-]?\d+)?/gi);
  if (!nums) return [];
  const arr = nums.map((n) => parseFloat(n));
  const points = [];
  for (let i = 0; i + 1 < arr.length; i += 2) points.push([arr[i], arr[i + 1]]);
  return points;
}

function elementToSvgPoints(el, svg, samplePathSegments = 24) {
  const pts = [];
  if (!el || !svg) return pts;
  const tag = (el.tagName || '').toLowerCase();
  const ctm = getElementToSvgMatrix(el, svg);
  try {
    if (tag === 'polygon' || tag === 'polyline') {
      const entries = parsePointsAttr(el.getAttribute('points') || '');
      for (const [x, y] of entries) {
        const p = transformPointWithCTM(svg, ctm, x, y);
        pts.push([p.x, p.y]);
      }
      return pts;
    }
    if (tag === 'rect') {
      const x = parseFloat(el.getAttribute('x') || 0);
      const y = parseFloat(el.getAttribute('y') || 0);
      const w = parseFloat(el.getAttribute('width') || 0);
      const h = parseFloat(el.getAttribute('height') || 0);
      const corners = [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ];
      for (const [cx, cy] of corners) {
        const p = transformPointWithCTM(svg, ctm, cx, cy);
        pts.push([p.x, p.y]);
      }
      return pts;
    }
    if (tag === 'circle' || tag === 'ellipse') {
      const cx = parseFloat(el.getAttribute('cx') || 0);
      const cy = parseFloat(el.getAttribute('cy') || 0);
      const rx =
        tag === 'circle'
          ? parseFloat(el.getAttribute('r') || 0)
          : parseFloat(el.getAttribute('rx') || 0);
      const ry =
        tag === 'circle'
          ? parseFloat(el.getAttribute('r') || 0)
          : parseFloat(el.getAttribute('ry') || 0);
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        const p = transformPointWithCTM(svg, ctm, x, y);
        pts.push([p.x, p.y]);
      }
      return pts;
    }
    if (tag === 'path') {
      if (
        typeof el.getTotalLength === 'function' &&
        typeof el.getPointAtLength === 'function'
      ) {
        const len = el.getTotalLength();
        const segments = Math.max(8, samplePathSegments);
        for (let i = 0; i <= segments; i++) {
          const at = (i / segments) * len;
          const pLocal = el.getPointAtLength(at);
          const p = transformPointWithCTM(svg, ctm, pLocal.x, pLocal.y);
          pts.push([p.x, p.y]);
        }
      } else {
        const b = el.getBBox();
        const corners = [
          [b.x, b.y],
          [b.x + b.width, b.y],
          [b.x + b.width, b.y + b.height],
          [b.x, b.y + b.height],
        ];
        for (const [cx, cy] of corners) {
          const p = transformPointWithCTM(svg, ctm, cx, cy);
          pts.push([p.x, p.y]);
        }
      }
      return pts;
    }
    const b = el.getBBox();
    const corners = [
      [b.x, b.y],
      [b.x + b.width, b.y],
      [b.x + b.width, b.y + b.height],
      [b.x, b.y + b.height],
    ];
    for (const [cx, cy] of corners) {
      const p = transformPointWithCTM(svg, ctm, cx, cy);
      pts.push([p.x, p.y]);
    }
    return pts;
  } catch {
    return pts;
  }
}

function convexHull(points) {
  if (!points || points.length === 0) return [];
  const pts = points
    .map((p) => ({ x: p[0], y: p[1] }))
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (o, a, b) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    )
      lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    )
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);
  return hull.map((p) => [p.x, p.y]);
}

function computePointsFromParts(node, svg, partNames) {
  if (!node || !svg) return [];
  const selector =
    partNames && partNames.length
      ? partNames.map((n) => `[data-name="${n}"]`).join(',')
      : 'polygon,rect,path,polyline,ellipse,circle';
  const parts = Array.from(node.querySelectorAll(selector));
  const allPoints = [];
  for (const part of parts) {
    const pts = elementToSvgPoints(part, svg, 32);
    for (const p of pts) allPoints.push(p);
  }
  if (allPoints.length) return allPoints;

  const uses = Array.from(node.querySelectorAll('use'));
  if (uses.length === 0) return [];
  for (const useEl of uses) {
    try {
      const href =
        useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
      if (!href) continue;
      const refId = href.replace(/^#/, '');
      const ref = svg.getElementById(refId);
      if (!ref) continue;
      const wrapper = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
      );
      try {
        const parentCTM = node.getCTM ? node.getCTM() : null;
        const useCTM = useEl.getCTM ? useEl.getCTM() : null;
        let localMatrix = null;
        if (parentCTM && typeof parentCTM.inverse === 'function' && useCTM) {
          try {
            const invParent = parentCTM.inverse();
            if (typeof invParent.multiply === 'function')
              localMatrix = invParent.multiply(useCTM);
            else if (typeof useCTM.multiply === 'function')
              localMatrix = useCTM.multiply(invParent);
            else localMatrix = useCTM;
          } catch {
            localMatrix = useCTM;
          }
        } else localMatrix = null;
        if (localMatrix && typeof localMatrix.a === 'number') {
          wrapper.setAttribute(
            'transform',
            `matrix(${localMatrix.a} ${localMatrix.b} ${localMatrix.c} ${localMatrix.d} ${localMatrix.e} ${localMatrix.f})`
          );
        } else {
          const tx = useEl.getAttribute('x') || '0';
          const ty = useEl.getAttribute('y') || '0';
          const tattr = useEl.getAttribute('transform') || '';
          const trans =
            tx !== '0' || ty !== '0'
              ? `translate(${tx},${ty}) ${tattr}`.trim()
              : tattr;
          if (trans) wrapper.setAttribute('transform', trans);
        }
      } catch {
        /* ignore error */
      }
      const clone = ref.cloneNode(true);
      wrapper.appendChild(clone);
      node.appendChild(wrapper);
      const foundParts = Array.from(wrapper.querySelectorAll(selector));
      for (const pEl of foundParts) {
        const pts = elementToSvgPoints(pEl, svg, 32);
        for (const p of pts) allPoints.push(p);
      }
      try {
        wrapper.remove();
      } catch {
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      }
    } catch {
      continue;
    }
  }
  return allPoints;
}

function getToothGroup(svg, toothDataName) {
  return svg.querySelector(`[data-name="${toothDataName}"]`);
}

// Devuelve el <input>/<textarea> asociado a un diente de forma DETERMINISTA.
// En el SVG cada diente va seguido en el DOM por su <text> y su <foreignObject>
// (p.ej. tooth_7_3 → text → input34). Mapear por orden del DOM evita el bug en
// que el matcher geométrico escribía la sigla en el diente equivocado (7.3→3.8),
// porque el bbox de un diente deciduo podía quedar más cerca del input de otro
// diente. Devuelve null si no se encuentra (el llamador puede recurrir a otra vía).
function inputForToothDOM(svg, toothDataName) {
  const group = svg.querySelector(`.tooth-group[data-name="${toothDataName}"]`);
  if (!group) return null;
  let sib = group.nextElementSibling;
  let saltos = 0;
  while (sib && saltos < 4) {
    if (sib.classList && sib.classList.contains('tooth-group')) break; // siguiente diente
    if ((sib.tagName || '').toLowerCase() === 'foreignobject') {
      const input = sib.querySelector('input, textarea');
      if (input) return input;
    }
    sib = sib.nextElementSibling;
    saltos++;
  }
  return null;
}

function getToothBBox(svg, toothDataName) {
  const el = getToothGroup(svg, toothDataName);
  if (!el) return null;
  try {
    const pts = elementToSvgPoints(el, svg, 16);
    if (pts && pts.length) {
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return {
        bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
        node: el,
      };
    }
    const local = el.getBBox();
    const ctm = getElementToSvgMatrix(el, getSvg());
    if (!ctm)
      return {
        bbox: {
          x: local.x,
          y: local.y,
          width: local.width,
          height: local.height,
        },
        node: el,
      };
    const p1 = transformPointWithCTM(getSvg(), ctm, local.x, local.y);
    const p2 = transformPointWithCTM(
      getSvg(),
      ctm,
      local.x + local.width,
      local.y + local.height
    );
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxX = Math.max(p1.x, p2.x);
    const maxY = Math.max(p1.y, p2.y);
    return {
      bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
      node: el,
    };
  } catch {
    return null;
  }
}

function centerOfTooth(svg, toothDataName) {
  const info = getToothBBox(svg, toothDataName);
  if (!info) return null;
  const { bbox, node } = info;
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
    node,
    bbox,
  };
}

function findToothGroupFromEvent(target) {
  let element = target;
  // Sube por el DOM hasta encontrar un elemento con data-name o llegar al SVG principal
  while (
    element &&
    element.nodeName !== 'svg' &&
    element.getAttribute('data-name') === null
  ) {
    element = element.parentNode;
  }
  // Si encontramos el grupo (tiene data-name), lo devolvemos
  if (element && element.getAttribute('data-name')) {
    return element;
  }
  return null;
}

// Devuelve el .tooth-group cuyo centro (en coordenadas de PANTALLA) está más
// cerca del punto de clic. El relleno de los dientes es transparente, por lo
// que clicar "dentro" de un diente normalmente cae en el fondo del SVG y
// findToothGroupFromEvent devuelve null. Este helper hace que los modos
// interactivos (PPF, PPR, transposición) sean tan tolerantes como la selección
// por clic del odontograma. Umbral 120px para evitar selecciones lejanas.
function nearestToothGroup(svg, clientX, clientY, maxDist = 120) {
  if (!svg) return null;
  const grupos = svg.querySelectorAll('.tooth-group[data-name]');
  let best = null;
  let bestDist = Infinity;
  grupos.forEach((g) => {
    let rect;
    try {
      rect = g.getBoundingClientRect();
    } catch {
      return;
    }
    if (!rect || (rect.width === 0 && rect.height === 0)) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const d = Math.hypot(cx - clientX, cy - clientY);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  });
  return best && bestDist <= maxDist ? best : null;
}

// Combina el clic directo (sobre el trazo) con el diente más cercano.
function toothGroupFromEventRobust(svg, e) {
  return (
    findToothGroupFromEvent(e.target) ||
    nearestToothGroup(svg, e.clientX, e.clientY)
  );
}

function ensureArrowMarker(svg, color, idPrefix) {
  const markerId = `${idPrefix}-arrow-head-${color}`;
  let marker = svg.querySelector(`#${markerId}`);

  if (!marker) {
    const defs =
      svg.querySelector('defs') ||
      document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    if (!svg.querySelector('defs')) svg.insertBefore(defs, svg.firstChild);

    marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('viewBox', '0 0 8 8'); // Cambiado de 10x10 a 8x8
    marker.setAttribute('refX', '7'); // Ajustado para que la punta toque el final
    marker.setAttribute('refY', '4'); // Centro
    marker.setAttribute('markerUnits', 'strokeWidth');
    marker.setAttribute('markerWidth', '5'); // Ligeramente más pequeño
    marker.setAttribute('markerHeight', '5'); // Ligeramente más pequeño
    marker.setAttribute('orient', 'auto-start-reverse');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // M 0 0 (Mover a la esquina) L 8 4 (Línea a la punta) L 0 8 (Línea a la otra esquina)
    path.setAttribute('d', 'M 0 0 L 8 4 L 0 8 z');
    path.setAttribute('fill', color);
    marker.appendChild(path);

    defs.appendChild(marker);
  }
}

function isValidArcade(name1, name2) {
  if (!name1 || !name2) return false;
  // El cuadrante es el primer dígito del nombre del diente (ej: '1.6' -> 1)
  const q1 = parseInt(name1.charAt(0));
  const q2 = parseInt(name2.charAt(0));

  // Dientes superiores: 1,2,5 y 6 Dientes inferiores: 3, 4, 7 y 8.
  const isUpper1 = q1 === 1 || q1 === 2;
  const isUpper2 = q2 === 1 || q2 === 2;

  const isUpper3 = q1 === 5 || q1 === 6;
  const isUpper4 = q2 === 5 || q2 === 6;

  const isLower1 = q1 === 7 || q1 === 8;
  const isLower2 = q2 === 7 || q2 === 8;

  const isLower3 = q1 === 3 || q1 === 4;
  const isLower4 = q2 === 3 || q2 === 4;

  // Opción 1: Ambos son Superior dientes fijos
  if (isUpper1 && isUpper2) return true;

  // Opción 2: Ambos son Superior dientes temporales
  if (isUpper3 && isUpper4) return true;

  // Opción 3: Ambos son Inferior dientes temporales
  if (isLower1 && isLower2) return true;

  // Opción 4: Ambos son Inferior dientes fijos
  if (isLower3 && isLower4) return true;

  return false;
}

// clearAnnotations: elimina todas las anotaciones y resetea estilos
export function clearAnnotations() {
  const svg = getSvg();
  if (!svg) return;
  const overlay = svg.querySelector('#odontograma-overlay');
  if (overlay) overlay.innerHTML = '';
  svg.querySelectorAll('.odontograma-highlighted').forEach((el) => {
    el.classList.remove('odontograma-highlighted');
    el.style.stroke = '';
    el.style.strokeWidth = '';
    el.style.fill = '';
  });
}
/** AÑADISTE
 * Remueve la última anotación (elemento SVG) añadido al overlay.
 * @returns {boolean} True si se removió un elemento, false si no.
 */
export function clearLastAnnotation() {
  const svg = getSvg();
  if (!svg) return false;
  const overlay = ensureOverlay(svg);
  const lastAnnotation = overlay.lastChild;
  if (lastAnnotation) {
    lastAnnotation.remove();
    return true;
  }
  return false;
}

/**AÑADISTE
 * Remueve las anotaciones SVG para un diente específico.
 * Se basa en que las funciones de anotación añaden el nombre del diente
 * en el atributo `data-id` (e.g., data-id="crown-hull-1.6-...")
 * @param {string} toothDataName - El nombre del diente (ej: '1.6').
 * @returns {boolean} True si se encontraron y removieron anotaciones.
 */
export function clearAnnotationsForTooth(toothDataName) {
  const svg = getSvg();
  if (!svg) return false;
  const overlay = svg.querySelector('#odontograma-overlay');
  if (!overlay) return false;

  // Selector que busca cualquier anotación que contenga el nombre del diente en el data-id
  const selector = `.annotation[data-id*="-${toothDataName}-"]`;
  const annotations = Array.from(overlay.querySelectorAll(selector));

  annotations.forEach((el) => el.remove());

  return annotations.length > 0;
}
// render

function computeFixedMargin(w, h) {
  return Math.max(1, Math.min(70, Math.min(w, h) * 0.7));
}

// addCrown: draw border/hull and optionally write crown code into nearest input
export function addCrown(
  toothDataName,
  crownType = 'CM',
  color = 'blue',
  includedParts = null
) {
  const svg = getSvg();
  if (!svg) return false;
  const group = getToothGroup(svg, toothDataName);
  if (!group) return false;

  // --- Constantes de Adaptación de Tamaño y Posición ---
  // Dientes que típicamente son más delgados y requieren mayor ajuste
  const isThinTooth =
    toothDataName.startsWith('5.') ||
    toothDataName.startsWith('6.') ||
    toothDataName.startsWith('7.') ||
    toothDataName.startsWith('8.') || // Dientes deciduos (5.x, 6.x, 7.x, 8.x)
    toothDataName.endsWith('.1') ||
    toothDataName.endsWith('.2') ||
    toothDataName.endsWith('.3') ||
    toothDataName.endsWith('.4'); // Incisivos (X.1, X.2) y Caninos (X.3, X.4) permanentes

  // Cuadrantes inferiores que están invertidos (3.x, 4.x, 7.x, 8.x)
  const isLowerQuadrant =
    toothDataName.startsWith('3.') ||
    toothDataName.startsWith('4.') ||
    toothDataName.startsWith('7.') ||
    toothDataName.startsWith('8.');

  // Valores proporcionados por el usuario para dientes delgados
  const COMP_X = 0.31; // Compensación en X
  const COMP_W = 0.58; // Reducción en Ancho
  const COMP_Y_UPPER = 0.6; // Desplazamiento Y para cuadrantes superiores (1.x, 2.x, 5.x, 6.x)
  const COMP_H = 0.75; // Reducción en Altura

  // AJUSTE CLAVE: Factor para subir el cuadro en los cuadrantes inferiores (3.x, 4.x, 7.x, 8.x)
  // Valor más alto = el cuadro sube más (se aleja de la raíz y se acerca a la corona).
  const Y_AJUSTE_ARRIBA = 0.58; // Ajusta este valor (ej: 0.10, 0.20) si es necesario.
  // ----------------------------------------------------------------------

  const defaultParts = [
    'raiz-izq',
    'raiz-der',
    'base',
    'cingulo',
    'fosas',
    'fosa1',
    'fosa2',
    'fosa3',
    'surcos',
    'surco1',
    'surco2',
    'surco3',
    'paredes',
    'lado-izq',
    'lado-der',
  ];
  const partsToUse =
    includedParts && includedParts.length ? includedParts : defaultParts;

  const points = computePointsFromParts(group, svg, partsToUse);
  const overlay = ensureOverlay(svg);

  if (includedParts && includedParts.length) {
    if (points && points.length >= 1) {
      // Lógica de convexHull para las partes (MANTENER ORIGINAL)
      const xs = points.map((p) => p[0]);
      const ys = points.map((p) => p[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const w = Math.max(0, maxX - minX);
      const h = Math.max(0, maxY - minY);
      const margin = computeFixedMargin(w, h);
      const rx = minX - margin,
        ry = minY - margin,
        rw = w + margin * 2,
        rh = h + margin * 2;
      const border = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      );
      border.setAttribute('x', rx);
      border.setAttribute('y', ry);
      border.setAttribute('width', rw);
      border.setAttribute('height', rh);
      border.setAttribute('fill', 'none');
      border.setAttribute('stroke', color);
      border.setAttribute('stroke-width', '3');
      border.setAttribute('class', 'annotation crown-border parts-bbox');
      overlay.appendChild(border);
      border.setAttribute(
        'data-id',
        `crown-parts-bbox-${toothDataName}-${Date.now()}`
      );
    } else {
      // --- FALLBACK 1: includedParts pero no se computan puntos ---
      const info = getToothBBox(svg, toothDataName);
      if (!info) return false;
      let bbox = info.bbox; // Usamos 'let' para modificar

      // *** LÓGICA DE ADAPTACIÓN DE TAMAÑO (FALLBACK 1) ***
      if (isThinTooth) {
        let x_compensation, w_compensation, y_compensation, h_compensation;

        // La compensación horizontal y el ancho son fijos
        x_compensation = bbox.width * COMP_X;
        w_compensation = bbox.width * COMP_W;
        h_compensation = bbox.height * COMP_H;

        // Compensación Vertical (Y):
        if (isLowerQuadrant) {
          // Inferior: Desplazamiento para anclar la caja a la corona (parte inferior del BBox)
          let y_compensation_anchor = bbox.height * COMP_H;

          // Aplicamos el ajuste: RESTAMOS para mover el punto de inicio Y hacia arriba (subir el cuadro)
          y_compensation =
            y_compensation_anchor - bbox.height * Y_AJUSTE_ARRIBA;
        } else {
          // Superior: Usar el valor de desplazamiento Y del usuario
          y_compensation = bbox.height * COMP_Y_UPPER;
        }

        // Sobrescribir el bbox con las nuevas dimensiones corregidas
        bbox = {
          x: bbox.x + x_compensation,
          y: bbox.y + y_compensation,
          width: bbox.width - w_compensation,
          height: bbox.height - h_compensation,
        };
      }
      // *** FIN DE LÓGICA DE ADAPTACIÓN ***

      const margin = computeFixedMargin(bbox.width, bbox.height);
      const rx = bbox.x - margin,
        ry = bbox.y - margin,
        rw = bbox.width + margin * 2,
        rh = bbox.height + margin * 2;
      const border = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      );
      border.setAttribute('x', rx);
      border.setAttribute('y', ry);
      border.setAttribute('width', rw);
      border.setAttribute('height', rh);
      border.setAttribute('fill', 'none');
      border.setAttribute('stroke', color);
      border.setAttribute('stroke-width', '3');
      border.setAttribute('class', 'annotation crown-border fallback');
      overlay.appendChild(border);
      border.setAttribute(
        'data-id',
        `crown-border-${toothDataName}-${Date.now()}`
      );
    }
  } else {
    if (points && points.length >= 3) {
      // Lógica de convexHull para polígonos (MANTENER ORIGINAL)
      const hull = convexHull(points);
      if (hull && hull.length >= 3) {
        const polyEl = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'polygon'
        );
        polyEl.setAttribute(
          'points',
          hull.map((p) => `${p[0]},${p[1]}`).join(' ')
        );
        polyEl.setAttribute('fill', 'none');
        polyEl.setAttribute('stroke', color);
        polyEl.setAttribute('stroke-width', '2');
        polyEl.setAttribute('class', 'annotation crown-border hull');
        overlay.appendChild(polyEl);
        polyEl.setAttribute(
          'data-id',
          `crown-hull-${toothDataName}-${Date.now()}`
        );
      }
    } else {
      // --- FALLBACK 2: No hay includedParts y falla convexHull ---
      const info = getToothBBox(svg, toothDataName);
      if (!info) return false;
      let bbox = info.bbox; // Usamos 'let' para modificar

      // *** LÓGICA DE ADAPTACIÓN DE TAMAÑO (FALLBACK 2) ***
      if (isThinTooth) {
        let x_compensation, w_compensation, y_compensation, h_compensation;

        // La compensación horizontal y el ancho son fijos
        x_compensation = bbox.width * COMP_X;
        w_compensation = bbox.width * COMP_W;
        h_compensation = bbox.height * COMP_H;

        // Compensación Vertical (Y):
        if (isLowerQuadrant) {
          // Inferior: Desplazamiento para anclar la caja a la corona (parte inferior del BBox)
          let y_compensation_anchor = bbox.height * COMP_H;

          // Aplicamos el ajuste: RESTAMOS para mover el punto de inicio Y hacia arriba (subir el cuadro)
          y_compensation =
            y_compensation_anchor - bbox.height * Y_AJUSTE_ARRIBA;
        } else {
          // Superior: Usar el valor de desplazamiento Y del usuario
          y_compensation = bbox.height * COMP_Y_UPPER;
        }

        // Sobrescribir el bbox con las nuevas dimensiones corregidas
        bbox = {
          x: bbox.x + x_compensation,
          y: bbox.y + y_compensation,
          width: bbox.width - w_compensation,
          height: bbox.height - h_compensation,
        };
      }
      // *** FIN DE LÓGICA DE ADAPTACIÓN ***

      const margin = computeFixedMargin(bbox.width, bbox.height);
      const rx = bbox.x - margin,
        ry = bbox.y - margin,
        rw = bbox.width + margin * 2,
        rh = bbox.height + margin * 2;
      const border = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      );
      border.setAttribute('x', rx);
      border.setAttribute('y', ry);
      border.setAttribute('width', rw);
      border.setAttribute('height', rh);
      border.setAttribute('fill', 'none');
      border.setAttribute('stroke', color);
      border.setAttribute('stroke-width', '3');
      border.setAttribute('class', 'annotation crown-border fallback');
      overlay.appendChild(border);
      border.setAttribute(
        'data-id',
        `crown-border-${toothDataName}-${Date.now()}`
      );
    }
  }

  // Escribir el crownType en el input del diente (mapeo determinista por DOM,
  // ver inputForToothDOM). Antes usaba el input geométricamente más cercano, lo
  // que escribía la sigla en el diente equivocado para deciduos (p.ej. 7.3→3.8).
  try {
    const input = inputForToothDOM(svg, toothDataName);
    if (input) {
      input.value = crownType;
      input.style.border = `2px solid ${color}`;
      input.style.color = color;
    }
  } catch {
    /* ignore */
  }

  return true;
}

// startCoronaMode: click a un grupo tooth-group aplicará addCrown con crownType
export function startCoronaMode(crownType = 'CM', color = 'blue') {
  const svg = getSvg();
  if (!svg) return { stop() {} };

  function findToothGroupFromEvent(target) {
    let el = target;
    while (el && el !== svg) {
      if (
        el.classList &&
        el.classList.contains('tooth-group') &&
        el.getAttribute('data-name')
      )
        return el;
      el = el.parentNode;
    }
    return null;
  }

  function onClick(e) {
    try {
      const g = findToothGroupFromEvent(e.target);
      if (!g) return;
      const name = g.getAttribute('data-name');
      if (!name) return;
      addCrown(name, crownType, 'BE', color, null);
    } catch (err) {
      console.error('startCoronaMode onClick error', err);
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') cleanup();
  }

  function cleanup() {
    try {
      svg.removeEventListener('click', onClick);
    } catch {
      /* ignore error */
    }
    try {
      window.removeEventListener('keydown', onKey);
    } catch {
      /* ignore error */
    }
  }

  svg.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return { stop: cleanup };
}

// addDiastemaAtPoint: dibuja el "paréntesis invertido" )( de la diastema centrado
// en (x,y), conforme a la NTS N° 188-MINSA/DGIESP-2022 §6.1.6 (antes se dibujaba
// una X, que no corresponde a la norma). Son dos arcos con las panzas enfrentadas,
// pensados para colocarse entre las dos piezas dentarias con diastema.
export function addDiastemaAtPoint(
  svg,
  x,
  y,
  color = 'blue',
  sizeX = 18,
  sizeY = 44,
  strokeWidth = 2
) {
  try {
    const overlay = ensureOverlay(svg);
    const idBase = `diastema-${Date.now()}`;
    const created = [];
    const NS = 'http://www.w3.org/2000/svg';

    const half = sizeY / 2;
    const gap = Math.max(8, sizeX); // separación horizontal entre los dos arcos
    const bow = Math.max(6, sizeX * 0.7); // curvatura de cada arco

    // ")" a la izquierda (panza hacia el centro) y "(" a la derecha (panza hacia
    // el centro) → forman el paréntesis invertido ")(".
    const arcs = [
      `M ${x - gap} ${y - half} Q ${x - gap + bow} ${y} ${x - gap} ${y + half}`,
      `M ${x + gap} ${y - half} Q ${x + gap - bow} ${y} ${x + gap} ${y + half}`,
    ];

    arcs.forEach((d, i) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', String(Math.max(2, strokeWidth)));
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('class', 'annotation diastema');
      path.setAttribute('data-id', `${idBase}-${i}`);
      overlay.appendChild(path);
      created.push(path);
    });

    return { elements: created, id: idBase };
  } catch (err) {
    console.error('addDiastemaAtPoint error', err);
    return null;
  }
}

/*
  startDiastemaMode(color, sizeX, sizeY, strokeWidth, onDone)
  - dibuja el paréntesis invertido )( de la diastema al primer click y se detiene
  - onDone({ cancelled, x, y }) se llama al terminar
*/
export function startDiastemaMode(
  color = 'blue',
  sizeX = 18,
  sizeY = 44,
  strokeWidth = 1,
  onDone
) {
  const svg = getSvg();
  if (!svg) return { stop() {} };

  let active = true;

  function clientToSvgPoint(cx, cy) {
    try {
      const pt = svg.createSVGPoint();
      pt.x = cx;
      pt.y = cy;
      const screenCTM = svg.getScreenCTM();
      if (!screenCTM) return { x: cx, y: cy };
      return pt.matrixTransform(screenCTM.inverse());
    } catch {
      return { x: cx, y: cy };
    }
  }

  function cleanup() {
    if (!active) return;
    try {
      svg.removeEventListener('click', onClick);
    } catch {
      /* ignore error */
    }
    try {
      window.removeEventListener('keydown', onKey);
    } catch {
      /* ignore error */
    }
    active = false;
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      cleanup();
      if (typeof onDone === 'function') onDone({ cancelled: true });
    }
  }

  function onClick(e) {
    try {
      if (!svg.contains(e.target)) return;
      const p = clientToSvgPoint(e.clientX, e.clientY);
      addDiastemaAtPoint(svg, p.x, p.y, color, sizeX, sizeY, strokeWidth);
      cleanup();
      if (typeof onDone === 'function')
        onDone({ cancelled: false, x: p.x, y: p.y });
    } catch (err) {
      console.error('diastema onClick error', err);
    }
  }

  svg.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return {
    stop: cleanup,
    isActive: () => active,
  };
}

// startFixedOrthoMode and startRemovableOrthoMode are kept (simple implementations)
export function startFixedOrthoMode(color = 'blue', onEnd) {
  const svg = getSvg();
  if (!svg) return { stop() {} };
  const overlay = ensureOverlay(svg);
  const pts = [];
  const markers = [];
  let drew = false;
  let ended = false;
  function clientToSvgPoint(cx, cy) {
    const pt = svg.createSVGPoint();
    pt.x = cx;
    pt.y = cy;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: cx, y: cy };
    return pt.matrixTransform(ctm.inverse());
  }
  function onClick(e) {
    if (!svg.contains(e.target)) return;
    const p = clientToSvgPoint(e.clientX, e.clientY);
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', p.x);
    c.setAttribute('cy', p.y);
    c.setAttribute('r', '4');
    c.setAttribute('fill', 'red');
    overlay.appendChild(c);
    markers.push(c);
    pts.push(p);
    if (pts.length === 2) {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', pts[0].x);
      l.setAttribute('y1', pts[0].y);
      l.setAttribute('x2', pts[1].x);
      l.setAttribute('y2', pts[1].y);
      l.setAttribute('stroke', color);
      l.setAttribute('stroke-width', '4');
      l.setAttribute('class', 'annotation ortho-fijo');
      l.setAttribute('data-id', `ortho-fijo-${Date.now()}`);
      overlay.appendChild(l);
      drew = true;
      cleanup();
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') cleanup();
  }
  function cleanup() {
    svg.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
    markers.forEach((m) => m.remove());
    if (!ended) {
      ended = true;
      if (typeof onEnd === 'function') onEnd(drew);
    }
  }
  svg.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  return { stop: cleanup };
}

export function startRemovableOrthoMode(
  color = 'blue',
  steps = 10,
  amplitude = 10,
  onEnd
) {
  const svg = getSvg();
  if (!svg) return { stop() {} };
  const overlay = ensureOverlay(svg);
  const points = [];
  const markers = [];
  let drew = false;
  let ended = false;
  function clientToSvgPoint(cx, cy) {
    const pt = svg.createSVGPoint();
    pt.x = cx;
    pt.y = cy;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: cx, y: cy };
    return pt.matrixTransform(ctm.inverse());
  }
  function onClick(e) {
    if (!svg.contains(e.target)) return;
    const p = clientToSvgPoint(e.clientX, e.clientY);
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', p.x);
    c.setAttribute('cy', p.y);
    c.setAttribute('r', '4');
    c.setAttribute('fill', 'red');
    overlay.appendChild(c);
    markers.push(c);
    points.push(p);
    if (points.length === 2) {
      const p1 = points[0],
        p2 = points[1];
      const vx = p2.x - p1.x,
        vy = p2.y - p1.y,
        len = Math.hypot(vx, vy) || 1,
        nx = -vy / len,
        ny = vx / len;
      const ptsArr = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const xi = p1.x + vx * t;
        const yi = p1.y + vy * t;
        const off = i % 2 === 0 ? amplitude : -amplitude;
        ptsArr.push(`${xi + nx * off},${yi + ny * off}`);
      }
      const poly = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'polyline'
      );
      poly.setAttribute('points', ptsArr.join(' '));
      poly.setAttribute('stroke', color);
      poly.setAttribute('stroke-width', '3');
      poly.setAttribute('fill', 'none');
      poly.setAttribute('class', 'annotation ortho-removible');
      poly.setAttribute('data-id', `ortho-removible-${Date.now()}`);
      overlay.appendChild(poly);
      drew = true;
      cleanup();
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') cleanup();
  }
  function cleanup() {
    svg.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
    markers.forEach((m) => m.remove());
    if (!ended) {
      ended = true;
      if (typeof onEnd === 'function') onEnd(drew);
    }
  }
  svg.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  return { stop: cleanup };
}

export function addRemovableOrtho(
  startTooth,
  endTooth,
  color = 'blue',
  steps = 8,
  amplitude = 8
) {
  const svg = getSvg();
  if (!svg) return false;
  const s = centerOfTooth(svg, startTooth);
  const e = centerOfTooth(svg, endTooth);
  if (!s || !e) return false;
  const overlay = ensureOverlay(svg);
  const vx = e.x - s.x,
    vy = e.y - s.y,
    len = Math.hypot(vx, vy) || 1,
    nx = -vy / len,
    ny = vx / len;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const xi = s.x + vx * t;
    const yi = s.y + vy * t;
    const off = i % 2 === 0 ? amplitude : -amplitude;
    pts.push(`${xi + nx * off},${yi + ny * off}`);
  }
  const poly = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'polyline'
  );
  poly.setAttribute('points', pts.join(' '));
  poly.setAttribute('stroke', color);
  poly.setAttribute('stroke-width', '3');
  poly.setAttribute('fill', 'none');
  overlay.appendChild(poly);
  return true;
}

export function highlightToothBox(toothDataName, color = 'red') {
  const svg = getSvg();
  if (!svg) return false;
  const info = getToothBBox(svg, toothDataName);
  if (!info) return false;
  const { bbox } = info;
  const overlay = ensureOverlay(svg);
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', bbox.x - 2);
  rect.setAttribute('y', bbox.y - 2);
  rect.setAttribute('width', bbox.width + 4);
  rect.setAttribute('height', bbox.height + 4);
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', '2');
  rect.setAttribute('class', 'annotation highlight-box');
  overlay.appendChild(rect);
  rect.setAttribute('data-id', `box-${toothDataName}-${Date.now()}`);
  return true;
}

/* ------------------------------------------------------------------
   NUEVO: addDefect - comportamientos para "Defectos de desarrollo del esmalte"
   - Dibuja marcador y etiqueta en el centro del diente (o cerca)
   - No interfiere con otros modos
   ------------------------------------------------------------------ */
// Dibuja una etiqueta de texto centrada sobre el diente, en el overlay. Si la
// pieza YA tiene otras etiquetas centradas, desplaza la nueva verticalmente para
// evitar el solapamiento visual de tratamientos que sí pueden coexistir
// (ADR-0033). Devuelve el <text> creado o null.
function drawCenteredToothLabel(
  svg,
  toothDataName,
  labelText,
  color,
  klass,
  idPrefix
) {
  const info = getToothBBox(svg, toothDataName);
  if (!info) return null;
  const { bbox } = info;
  const overlay = ensureOverlay(svg);
  if (!overlay) return null;
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  const fontSize = Math.max(
    10,
    Math.min(20, Math.floor(Math.min(bbox.width, bbox.height) * 0.18))
  );
  // Cuántas etiquetas centradas ya existen en esta pieza → escalón de desfase.
  const prior = overlay.querySelectorAll(
    `.annotation.tooth-label[data-tooth="${toothDataName}"]`
  ).length;
  const dy = prior * (fontSize + 2);
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', String(cx));
  text.setAttribute('y', String(cy + Math.max(3, fontSize / 3) + dy));
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(fontSize));
  text.setAttribute('font-weight', '700');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('class', `annotation tooth-label ${klass}`);
  text.setAttribute('data-tooth', toothDataName);
  text.setAttribute('data-id', `${idPrefix}-${toothDataName}-${Date.now()}`);
  text.textContent = labelText;
  overlay.appendChild(text);
  return text;
}

export function addDefect(toothDataName, defectText = 'O', color = 'red') {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const info = getToothBBox(svg, toothDataName);
    if (!info) return false;
    const { bbox } = info;
    const overlay = ensureOverlay(svg);

    // safe placement values
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;
    const markerOffsetX = Math.max(4, bbox.width * 0.18);
    const markerR = Math.max(
      3,
      Math.min(8, Math.min(bbox.width, bbox.height) * 0.06)
    );

    // place small circle marker slightly to the right of center
    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    circle.setAttribute('cx', cx + markerOffsetX);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', String(markerR));
    circle.setAttribute('fill', color);
    circle.setAttribute('class', 'annotation defect-marker');
    circle.setAttribute(
      'data-id',
      `defect-marker-${toothDataName}-${Date.now()}`
    );
    overlay.appendChild(circle);

    // small text label (defectText)
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', cx + markerOffsetX + markerR + 4);
    text.setAttribute('y', cy + markerR / 2);
    text.setAttribute('fill', color);
    text.setAttribute(
      'font-size',
      String(Math.max(10, Math.min(14, markerR * 2)))
    );
    text.setAttribute('class', 'annotation defect-label');
    text.setAttribute('data-id', `defect-label-${toothDataName}-${Date.now()}`);
    text.textContent = defectText;
    overlay.appendChild(text);

    return { circle, text };
  } catch (err) {
    console.error('addDefect error', err);
    return null;
  }
}

/* ------------------------------------------------------------------
   NUEVO: addFosasFisurasProfundas
   - Escribe la sigla "FFP" en el input (foreignObject) asociado al diente
     y dibuja una etiqueta "FFP" azul sobre el diente en el overlay SVG.
   - Uso: addFosasFisurasProfundas('2.7', 'blue')
   ------------------------------------------------------------------ */
export function addFosasFisurasProfundas(toothDataName, color = 'blue') {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const info = getToothBBox(svg, toothDataName);
    if (!info) return false;

    // Escribir "FFP" en el input del diente (mapeo determinista por DOM).
    const input = inputForToothDOM(svg, toothDataName);
    if (input) {
      input.value = 'FFP';
      input.style.border = `2px solid ${color}`;
      input.style.color = color;
    }

    // Etiqueta "FFP" sobre el diente, con desfase si la pieza ya tiene etiquetas.
    drawCenteredToothLabel(
      svg,
      toothDataName,
      'FFP',
      color,
      'ffp-label',
      'ffp'
    );

    return true;
  } catch (err) {
    console.error('addFosasFisurasProfundas error', err);
    return false;
  }
}

/* ------------------------------------------------------------------
   NUEVO: addImplant
   - Escribe la sigla "IMP" (color especificado) en el input (foreignObject)
     y dibuja una etiqueta "IMP" del color sobre el diente en el overlay SVG.
   - Uso: addImplant('2.7', 'red') o addImplant('2.7', 'blue')
   ------------------------------------------------------------------ */
export function addImplant(toothDataName, color = 'red') {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const info = getToothBBox(svg, toothDataName);
    if (!info) return false;

    // Escribir "IMP" en el input del diente (mapeo determinista por DOM).
    const input = inputForToothDOM(svg, toothDataName);
    if (input) {
      input.value = 'IMP';
      input.style.border = `2px solid ${color}`;
      input.style.color = color;
    }

    // Etiqueta "IMP" sobre el diente, con desfase si la pieza ya tiene etiquetas.
    drawCenteredToothLabel(
      svg,
      toothDataName,
      'IMP',
      color,
      'implant-label',
      'imp'
    );

    return true;
  } catch (err) {
    console.error('addImplant error', err);
    return false;
  }
}

/* ------------------------------------------------------------------
   NUEVO: Edentulous lines (líneas rectas para edéntulo superior/inferior)
   - addEdentulousLineBetween(startTooth, endTooth, color, strokeWidth)
   - dibuja línea recta entre centros de dos dientes y la agrega al overlay
   ------------------------------------------------------------------ */
export function addEdentulousLineBetween(
  startTooth,
  endTooth,
  color = 'black',
  strokeWidth = 3,
  options = {}
) {
  try {
    const svg = getSvg();
    if (!svg) return false;

    const s = centerOfTooth(svg, startTooth);
    const e = centerOfTooth(svg, endTooth);
    if (!s || !e) {
      console.warn(
        'addEdentulousLineBetween: no se pudo obtener centro de diente',
        startTooth,
        endTooth
      );
      return false;
    }

    const overlay = ensureOverlay(svg);

    // Presets automáticos basados en el par de dientes (funciona si llamas desde panel sin options)
    const pairKey = `${startTooth}->${endTooth}`;
    const autoPresets = {
      '1.8->2.8': { downward: 22, extraStart: 32, extraEnd: 32 }, // edéntulo superior (bajar la línea)
      '2.8->1.8': { downward: 15, extraStart: 15, extraEnd: 15 },
      '4.8->3.8': { downward: -22, extraStart: 32, extraEnd: 32 }, // edéntulo inferior (subir la línea)
      '3.8->4.8': { downward: -10, extraStart: 12, extraEnd: 12 },
    };

    // If a preset string was provided in options, map it to values
    const presetName =
      typeof options.preset === 'string' ? options.preset.toLowerCase() : null;
    let presetVals = {};
    if (presetName === 'superior') {
      presetVals = { downward: 10, extraStart: 10, extraEnd: 10 };
    } else if (presetName === 'inferior') {
      presetVals = { downward: -10, extraStart: 12, extraEnd: 12 };
    } else if (autoPresets[pairKey]) {
      presetVals = autoPresets[pairKey];
    }

    // Valores finales: options explicit override preset values; otherwise use preset or defaults
    const downward =
      typeof options.downward === 'number'
        ? options.downward
        : typeof presetVals.downward === 'number'
          ? presetVals.downward
          : 0;

    const extraStart =
      typeof options.extraStart === 'number'
        ? options.extraStart
        : typeof presetVals.extraStart === 'number'
          ? presetVals.extraStart
          : 0;

    const extraEnd =
      typeof options.extraEnd === 'number'
        ? options.extraEnd
        : typeof presetVals.extraEnd === 'number'
          ? presetVals.extraEnd
          : 0;

    // vector from start to end
    const vx = e.x - s.x;
    const vy = e.y - s.y;
    const len = Math.hypot(vx, vy) || 1;

    // unit vector along the line
    const ux = vx / len;
    const uy = vy / len;

    // perpendicular unit vector (rotated 90deg)
    const px = -uy;
    const py = ux;

    // compute extended & offset points
    const x1 = s.x - ux * extraStart + px * downward;
    const y1 = s.y - uy * extraStart + py * downward;
    const x2 = e.x + ux * extraEnd + px * downward;
    const y2 = e.y + uy * extraEnd + py * downward;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('class', 'annotation edentulous-line');
    line.setAttribute(
      'data-id',
      `edentulous-${startTooth}-${endTooth}-${Date.now()}`
    );
    overlay.appendChild(line);

    // Devuelve información útil para debugging o manipulación posterior
    return {
      line,
      params: {
        startTooth,
        endTooth,
        color,
        strokeWidth,
        downward,
        extraStart,
        extraEnd,
        x1,
        y1,
        x2,
        y2,
      },
    };
  } catch (err) {
    console.error('addEdentulousLineBetween error', err);
    return null;
  }
}

// FUNCIÓN DE GERMINACIÓN — robusta y compatible con tu odontograma
export function addGerminacion(toothDataName, color = 'blue') {
  try {
    if (!toothDataName || typeof toothDataName !== 'string') {
      console.warn('addGerminacion: toothDataName inválido', toothDataName);
      return false;
    }
    const svg = getSvg();
    if (!svg) {
      console.warn('addGerminacion: no se encontró el SVG');
      return false;
    }
    const overlay = ensureOverlay(svg);
    if (!overlay) {
      console.warn('addGerminacion: no se pudo asegurar overlay');
      return false;
    }

    const name = toothDataName.trim();

    // Posición y tamaño en coordenadas viewBox (el overlay dibuja en ese mismo
    // espacio). Antes se usaba getCTM(), que devuelve PÍXELES CSS (0..~320),
    // mientras el overlay usa unidades viewBox (0..1400): el círculo caía
    // escalado a ~1/4.375 y aparecía sobre otro diente (mismo bug que 7.3→3.8).
    // centerOfTooth/getToothBBox usan getElementToSvgMatrix (getScreenCTM
    // compuesto con el inverso del SVG) → unidades viewBox correctas. Es el
    // mismo helper probado que ya usa addGiroversion.
    const center = centerOfTooth(svg, name);
    if (!center) {
      console.warn(
        `addGerminacion: no se encontró el diente "${name}" en el SVG`
      );
      return false;
    }

    // borrar germinación previa para este diente (evita duplicados)
    const existing = overlay.querySelectorAll(`[data-id^="germin-${name}-"]`);
    existing.forEach((e) => e.remove());

    // Radio proporcional al tamaño del diente (en unidades viewBox).
    const minSide = Math.min(center.bbox.width, center.bbox.height) || 40;
    const r = Math.max(8, Math.min(45, Math.round(minSide * 0.35)));

    // crear círculo en coordenadas del SVG (overlay comparte el mismo sistema)
    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    circle.setAttribute('cx', String(center.x));
    circle.setAttribute('cy', String(center.y));
    circle.setAttribute('r', String(r));

    // estilo del círculo (sin relleno, con borde)
    circle.setAttribute('fill', 'none'); // SIN FONDO
    circle.setAttribute('stroke', color); // COLOR DEL BORDE (blue)
    circle.setAttribute('stroke-width', '2'); // GROSOR DEL BORDE
    circle.setAttribute('opacity', '1'); // OPACIDAD TOTAL

    circle.setAttribute('class', 'annotation germination-circle');
    circle.setAttribute('data-id', `germin-${name}-${Date.now()}`);
    circle.setAttribute('data-tooth', name);

    overlay.appendChild(circle);

    return true;
  } catch (err) {
    console.error('addGerminacion error', err);
    return false;
  }
}

// FUSIÓN ---------------------------------------------------

// ¿El diente forma parte de una fusión ya dibujada? (círculo en el overlay)
export function toothHasFusion(toothName) {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const overlay = svg.querySelector('#odontograma-overlay');
    if (!overlay) return false;
    const n = String(toothName).trim();
    return !!overlay.querySelector(`.fusion-circle[data-tooth="${n}"]`);
  } catch {
    return false;
  }
}

// ¿El diente tiene germinación ya dibujada? (círculo en el overlay)
export function toothHasGerminacion(toothName) {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const overlay = svg.querySelector('#odontograma-overlay');
    if (!overlay) return false;
    const n = String(toothName).trim();
    return !!overlay.querySelector(`.germination-circle[data-tooth="${n}"]`);
  } catch {
    return false;
  }
}

// Vecinos anatómicos (FDI) de una pieza: mesial (hacia la línea media) y distal.
// En FDI la posición aumenta alejándose de la línea media (x.1 = central, x.8 =
// tercer molar; deciduos x.1..x.5). El vecino MESIAL de un central (x.1) CRUZA la
// línea media hacia el central del cuadrante hermano (1.1↔2.1, 3.1↔4.1, 5.1↔6.1,
// 7.1↔8.1) — por eso `num-0.1` (que daba "x.0") fallaba para 3.1 y todos los
// centrales. El vecino DISTAL no existe en el último diente del cuadrante.
function fdiNeighbors(name) {
  const num = parseFloat(name);
  if (isNaN(num)) return { mesial: null, distal: null };
  const q = Math.trunc(num);
  const p = Math.round((num - q) * 10); // posición 1..8 (deciduos 1..5)
  const partner = { 1: 2, 2: 1, 3: 4, 4: 3, 5: 6, 6: 5, 7: 8, 8: 7 }[q] || null;
  const maxPos = q >= 5 ? 5 : 8; // cuadrantes deciduos (5-8) tienen 5 piezas
  const mesial = p <= 1 ? (partner ? `${partner}.1` : null) : `${q}.${p - 1}`;
  const distal = p >= maxPos ? null : `${q}.${p + 1}`;
  return { mesial, distal };
}

// Analiza los vecinos CONTIGUOS de un diente para la fusión. Clínicamente la
// fusión solo ocurre entre dos piezas adyacentes, así que las únicas opciones son
// el vecino mesial (`left`) y el distal (`right`). Devuelve cuáles existen y
// cuáles están libres (no ocupados por otra fusión).
export function getFusionCandidates(toothName) {
  const result = {
    name: null,
    left: null, // mesial
    right: null, // distal
    validLeft: false,
    validRight: false,
    leftBusy: false,
    rightBusy: false,
    selectable: [], // vecinos válidos y libres
  };
  try {
    if (!toothName || typeof toothName !== 'string') return result;
    const svg = getSvg();
    if (!svg) return result;
    const overlay = ensureOverlay(svg);
    if (!overlay) return result;

    const name = toothName.trim();
    const num = parseFloat(name);
    if (isNaN(num)) return result;
    result.name = name;

    const { mesial, distal } = fdiNeighbors(name);
    result.left = mesial;
    result.right = distal;

    const exists = (n) =>
      !!n &&
      !!(
        svg.querySelector(`g.tooth-group[data-name="${n}"]`) ||
        Array.from(svg.querySelectorAll('text.tooth-name')).find(
          (t) => (t.textContent || '').trim() === n
        )
      );

    result.validLeft = exists(mesial);
    result.validRight = exists(distal);

    const hasFusionCircle = (d) =>
      !!overlay.querySelector(`.fusion-circle[data-tooth="${d}"]`);
    result.leftBusy = result.validLeft && hasFusionCircle(mesial);
    result.rightBusy = result.validRight && hasFusionCircle(distal);

    if (result.validLeft && !result.leftBusy) result.selectable.push(mesial);
    if (result.validRight && !result.rightBusy) result.selectable.push(distal);

    return result;
  } catch (err) {
    console.error('getFusionCandidates error', err);
    return result;
  }
}

// Dibuja la fusión entre `toothName` y un vecino contiguo EXPLÍCITO.
// El vecino lo decide el llamador (modal interactivo en el panel, apto para
// tablet); ya no se usa window.prompt. Si no se pasa vecino, se intenta el
// único contiguo libre disponible.
export function addFusion(toothName, color = 'blue', forcedNeighbor = null) {
  try {
    if (!toothName || typeof toothName !== 'string') return false;

    const svg = getSvg();
    if (!svg) return false;

    const overlay = ensureOverlay(svg);
    if (!overlay) return false;

    const name = toothName.trim();

    const cand = getFusionCandidates(name);
    if (!cand.validLeft && !cand.validRight) {
      toast.error(`El diente ${name} no tiene dientes vecinos para fusionar.`);
      return false;
    }

    let neighbor = null;
    if (forcedNeighbor) {
      const fn = String(forcedNeighbor).trim();
      if (fn !== cand.left && fn !== cand.right) {
        toast.error(`"${forcedNeighbor}" no es un vecino contiguo de ${name}.`);
        return false;
      }
      const busy =
        (fn === cand.left && cand.leftBusy) ||
        (fn === cand.right && cand.rightBusy);
      if (busy) {
        toast.error(`El diente ${fn} ya forma parte de otra fusión.`);
        return false;
      }
      neighbor = fn;
    } else if (cand.selectable.length === 1) {
      neighbor = cand.selectable[0];
    } else if (cand.selectable.length === 0) {
      toast.error(
        `Los vecinos de ${name} ya tienen círculos de fusión o no existen.`
      );
      return false;
    } else {
      // Ambos libres y sin elección explícita: el panel debe abrir el modal.
      toast.error(`Elige con qué diente fusionar ${name}.`);
      return false;
    }

    if (!neighbor) return false;

    const teethToMark = [name, neighbor];

    // ===============================================
    // 3) DIBUJAR CÍRCULOS PARA FUSIÓN (DOS EXACTAMENTE)
    // ===============================================

    for (const d of teethToMark) {
      // eliminar círculos viejos del MISMO diente
      const previous = overlay.querySelectorAll(
        `.fusion-circle[data-tooth="${d}"]`
      );
      previous.forEach((p) => p.remove());

      // Centro en coordenadas viewBox (mismo espacio que el overlay).
      // centerOfTooth usa getElementToSvgMatrix; antes se usaba getCTM(), que
      // devuelve píxeles CSS y dibujaba la elipse desplazada a otro diente
      // (mismo bug de espacio de coordenadas que 7.3→3.8).
      let cx = 0,
        cy = 0;
      const center = centerOfTooth(svg, d);
      if (center) {
        cx = center.x;
        cy = center.y;
      }

      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'ellipse'
      );
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('rx', '40');
      circle.setAttribute('ry', '15');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('class', 'annotation fusion-circle');
      circle.setAttribute('data-id', `fusion-${name}-${Date.now()}`);
      circle.setAttribute('data-tooth', d);

      overlay.appendChild(circle);
    }

    return true;
  } catch (err) {
    console.error('addFusion error', err);
    return false;
  }
}

// GIROVERSIÓN

export function addGiroversion(
  toothDataName,
  direction = 'right',
  color = 'blue'
) {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const info = getToothBBox(svg, toothDataName);
    if (!info) return false;
    const { bbox } = info;

    const overlay = ensureOverlay(svg);

    // Verificar si ya existe giroversión en este diente
    const exists = overlay.querySelector(
      `[data-id^="giro-${toothDataName.replace(/\W/g, '_')}"]`
    );
    if (exists) {
      toast.error(
        `Este diente (${toothDataName}) ya tiene un tratamiento de giroversión aplicado.`
      );
      return false;
    }

    // Centro en X y Y
    const cx = bbox.x + bbox.width / 2;
    let cy = bbox.y + bbox.height / 1.2; // posición por defecto abajo

    // -----------------------------
    // REGLA DE ARRIBA/ABAJO
    // -----------------------------
    const firstDigit = toothDataName.toString()[0];
    const arrowUp = ['8', '7', '4', '3'].includes(firstDigit);

    if (arrowUp) {
      cy = bbox.y + bbox.height * -0.3; // flecha arriba
    }
    // -----------------------------

    const yOffset = Math.max(8, Math.min(24, Math.floor(bbox.height * 0.6)));
    const y = cy + yOffset;

    const halfW = Math.max(10, Math.min(38, Math.floor(bbox.width * 0.5)));

    let xStart, xEnd;
    if (direction === 'left') {
      xStart = cx - halfW;
      xEnd = cx + halfW;
      const tmp = xStart;
      xStart = xEnd;
      xEnd = tmp;
    } else {
      xStart = cx - halfW;
      xEnd = cx + halfW;
    }

    const ctrlX = (xStart + xEnd) / 2;

    // -----------------------------
    // CURVA NORMAL vs CURVA INVERTIDA
    // -----------------------------
    const curveAmount = Math.max(12, Math.floor(bbox.height * 0.28));

    // si es diente 8,7,4,3 → curva invertida
    const ctrlY = arrowUp ? y - curveAmount : y + curveAmount;
    // -----------------------------

    const idBase = `giro-${toothDataName.replace(/\W/g, '_')}-${Date.now()}`;

    // PATH
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${xStart} ${y} Q ${ctrlX} ${ctrlY} ${xEnd} ${y}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute(
      'stroke-width',
      String(Math.max(2, Math.floor(bbox.height * 0.03)))
    );
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('class', 'annotation giroversion-path');
    path.setAttribute('data-id', `${idBase}-path`);
    overlay.appendChild(path);

    // ARROW HEAD
    const dx = xEnd - ctrlX;
    const dy = y - ctrlY;
    const ang = Math.atan2(dy, dx);

    const size = Math.max(
      6,
      Math.min(14, Math.floor(Math.min(bbox.width, bbox.height) * 0.18))
    );
    const headLength = size * 1.5;
    const headWidth = Math.max(10, Math.floor(size * 2));

    const tipX = xEnd;
    const tipY = y;

    const bx = tipX - headLength * Math.cos(ang);
    const by = tipY - headLength * Math.sin(ang);

    const px = -Math.sin(ang);
    const py = Math.cos(ang);

    const leftX = bx + (headWidth / 2) * px;
    const leftY = by + (headWidth / 2) * py;
    const rightX = bx - (headWidth / 2) * px;
    const rightY = by - (headWidth / 2) * py;

    const points = `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;

    const poly = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polygon'
    );
    poly.setAttribute('points', points);
    poly.setAttribute('fill', color);
    poly.setAttribute('opacity', '1');
    poly.setAttribute('class', 'annotation giroversion-head');
    poly.setAttribute('data-id', `${idBase}-head`);
    overlay.appendChild(poly);

    // DECOR
    const decorR = Math.max(1, Math.floor(size * 0.2));
    const decor = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    const decorX = ctrlX;
    const decorY = y + Math.max(2, Math.floor(size * 0.5));
    decor.setAttribute('cx', String(decorX));
    decor.setAttribute('cy', String(decorY));
    decor.setAttribute('r', String(decorR));
    decor.setAttribute('fill', 'transparent');
    decor.setAttribute('opacity', '0.9');
    decor.setAttribute('class', 'annotation giroversion-decor');
    decor.setAttribute('data-id', `${idBase}-decor`);
    overlay.appendChild(decor);

    return true;
  } catch (err) {
    console.error('addGiroversion error', err);
    return false;
  }
}

export function addMissingTooth(toothDataName, color = 'blue') {
  const svg = getSvg();
  if (!svg) return false;
  const toothCenter = centerOfTooth(svg, toothDataName);
  if (toothCenter) {
    const overlay = ensureOverlay(svg);
    let size = 30; // Ajusta el tamaño de la 'X'
    const displacement = 50;
    let adjustedP;
    const quadrant = parseInt(toothDataName.charAt(0));

    if (quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y + displacement };
    } else if (
      quadrant === 3 ||
      quadrant === 4 ||
      quadrant === 7 ||
      quadrant === 8
    ) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y - displacement };
      size = -30;
    }
    const line1 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
    line1.setAttribute('x1', adjustedP.x - size);
    line1.setAttribute('y1', adjustedP.y);
    line1.setAttribute('x2', adjustedP.x + size);
    line1.setAttribute('y2', toothCenter.y - size);
    line1.setAttribute('stroke', color);
    line1.setAttribute('stroke-width', '3');
    line1.setAttribute('data-target', toothDataName);
    line1.setAttribute('class', 'pda-annotation');

    const line2 = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'line'
    );
    line2.setAttribute('x1', adjustedP.x + size);
    line2.setAttribute('y1', adjustedP.y);
    line2.setAttribute('x2', adjustedP.x - size);
    line2.setAttribute('y2', toothCenter.y - size);
    line2.setAttribute('stroke', color);
    line2.setAttribute('stroke-width', '3');
    line2.setAttribute('data-target', toothDataName);
    line2.setAttribute('class', 'pda-annotation');

    overlay.appendChild(line1);
    overlay.appendChild(line2);

    return true;
  }
  return false;
}

export function addPulpotomy(toothDataName, color = 'red') {
  const svg = getSvg();
  if (!svg) return false;

  const toothCenter = centerOfTooth(svg, toothDataName);
  if (!toothCenter) {
    console.warn(`No se encontró el centro para el diente ${toothDataName}.`);
    return false;
  }
  const overlay = ensureOverlay(svg);

  const displacement = 20;

  let adjustedP;
  const quadrant = parseInt(toothDataName.charAt(0));

  if (quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6) {
    adjustedP = { x: toothCenter.x, y: toothCenter.y + displacement };
  } else if (
    quadrant === 3 ||
    quadrant === 4 ||
    quadrant === 7 ||
    quadrant === 8
  ) {
    adjustedP = { x: toothCenter.x, y: toothCenter.y - displacement };
  }

  const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circ.setAttribute('cx', adjustedP.x);
  circ.setAttribute('cy', adjustedP.y);
  circ.setAttribute('r', '10');
  circ.setAttribute('fill', color);
  circ.setAttribute('opacity', '0.75');
  circ.setAttribute('class', 'annotation pulpotomia-mark');
  circ.setAttribute('data-id', `pulpotomia-${toothDataName}-${Date.now()}`);

  overlay.appendChild(circ);

  return true;
}

export function addPegTooth(toothDataName, color = 'blue') {
  const svg = getSvg();
  if (!svg) return false;
  const toothCenter = centerOfTooth(svg, toothDataName);
  if (toothCenter) {
    const overlay = ensureOverlay(svg);
    const displacement = 55;
    const baseHalfWidth = 10;
    let triangleHeight = 20;

    let adjustedP;
    const quadrant = parseInt(toothDataName.charAt(0));
    if (quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y - displacement };
    } else if (
      quadrant === 3 ||
      quadrant === 4 ||
      quadrant === 7 ||
      quadrant === 8
    ) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y + displacement };
      triangleHeight = -20;
    }

    // P1: Esquina inferior izquierda
    const p1x = adjustedP.x - baseHalfWidth;
    const p1y = adjustedP.y;
    // P2: Esquina inferior derecha
    const p2x = adjustedP.x + baseHalfWidth;
    const p2y = adjustedP.y;
    // P3: El ápice superior
    const p3x = adjustedP.x;
    const p3y = adjustedP.y - triangleHeight;

    const points = `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`;

    const triangle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polygon'
    );
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'none'); // Sin relleno
    triangle.setAttribute('stroke', color);
    triangle.setAttribute('stroke-width', '3');
    triangle.setAttribute('data-target', toothDataName); // Para identificar el diente
    triangle.setAttribute('class', 'peg-tooth-annotation');
    triangle.setAttribute('style', 'pointer-events: none;'); // Para que no interfiera con otros clics

    overlay.appendChild(triangle);
    return true;
  }
  return false;
}

export function addDentalProsthesis(color = 'blue', onEnd) {
  const svg = getSvg();
  if (!svg) return { stop() {} };
  const overlay = ensureOverlay(svg);
  const pts = [];
  const names = [];
  const markers = [];
  const offset = 5;
  let drew = false;
  let ended = false;

  function onClick(e) {
    if (!svg.contains(e.target)) return;
    const g = toothGroupFromEventRobust(svg, e);
    if (!g) {
      console.warn('Clic ignorado: No se hizo clic en un diente.');
      return;
    }
    const name = g.getAttribute('data-name');
    if (!name || names.includes(name)) return;
    names.push(name);

    const toothCenter = centerOfTooth(svg, name);
    if (!toothCenter) {
      console.warn(`No se encontró el centro para el diente ${name}.`);
      return;
    }
    // 2. Definir el desplazamiento vertical (hacia la raíz/encía)
    const displacement = 60;

    let adjustedP;
    const quadrant = parseInt(name.charAt(0));

    if (quadrant === 1 || quadrant === 2) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y - displacement };
    } else if (quadrant === 3 || quadrant === 4) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y + displacement };
    } else {
      if (quadrant === 5 || quadrant === 6) {
        adjustedP = { x: toothCenter.x, y: toothCenter.y - displacement };
      } else {
        adjustedP = { x: toothCenter.x, y: toothCenter.y + displacement };
      }
    }
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', adjustedP.x);
    c.setAttribute('cy', adjustedP.y);
    c.setAttribute('r', '4');
    c.setAttribute('fill', color);
    overlay.appendChild(c);
    markers.push(c);
    pts.push(adjustedP);

    if (pts.length === 2) {
      // 1. VALIDACIÓN CLÍNICA
      if (!isValidArcade(names[0], names[1])) {
        toast.error(
          '❌ Error clínico: La Prótesis Removible debe conectar dientes de la misma arcada.'
        );
        cleanup();
        return;
      }
      // 2. Lógica de Dibujo (Doble Línea)
      const p1 = pts[0];
      const p2 = pts[1];
      const dxLine = p2.x - p1.x;
      const dyLine = p2.y - p1.y;
      const angle = Math.atan2(dyLine, dxLine);
      const perpAngle = angle + Math.PI / 2;
      const dx = Math.cos(perpAngle) * offset;
      const dy = Math.sin(perpAngle) * offset;
      const ppfId = `ppr-${names.join('-')}-${Date.now()}`;
      // Línea 1
      const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l1.setAttribute('x1', p1.x + dx);
      l1.setAttribute('y1', p1.y + dy);
      l1.setAttribute('x2', p2.x + dx);
      l1.setAttribute('y2', p2.y + dy);
      l1.setAttribute('stroke', color);
      l1.setAttribute('stroke-width', '5');
      l1.setAttribute('class', 'annotation ppr-linea');
      l1.setAttribute('data-id', `${ppfId}-1`);
      overlay.appendChild(l1);
      // Línea 2
      const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l2.setAttribute('x1', p1.x - dx);
      l2.setAttribute('y1', p1.y - dy);
      l2.setAttribute('x2', p2.x - dx);
      l2.setAttribute('y2', p2.y - dy);
      l2.setAttribute('stroke', color);
      l2.setAttribute('stroke-width', '5');
      l2.setAttribute('class', 'annotation ppr-linea');
      l2.setAttribute('data-id', `${ppfId}-2`);
      overlay.appendChild(l2);

      drew = true;
      cleanup();
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') cleanup();
  }
  function cleanup() {
    svg.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
    markers.forEach((m) => m.remove());
    if (!ended) {
      ended = true;
      if (typeof onEnd === 'function') onEnd(drew);
    }
  }
  svg.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  return { stop: cleanup };
}

export function addPDC(arcada, color = 'blue', typeId) {
  const svg = getSvg();
  if (!svg) return false;

  let toothStartName, toothEndName;
  let displacement;
  const offset = 5;

  // 1. Determinar los dientes terminales y el desplazamiento
  if (arcada === 'superior') {
    if (typeId === 'SUP_PERM') {
      toothStartName = '1.8';
      toothEndName = '2.8';
    } else if (typeId === 'SUP_DECID') {
      toothStartName = '5.5';
      toothEndName = '6.5';
    } else {
      // Fallback a lógica anterior si no hay typeId (opcional)
      const c1_perm = centerOfTooth(svg, '1.8');
      if (c1_perm) {
        toothStartName = '1.8';
        toothEndName = '2.8';
      } else {
        toothStartName = '5.5';
        toothEndName = '6.5';
      }
    }
    displacement = -60;
  } else if (arcada === 'inferior') {
    if (typeId === 'INF_PERM') {
      toothStartName = '4.8';
      toothEndName = '3.8';
    } else if (typeId === 'INF_DECID') {
      toothStartName = '8.5';
      toothEndName = '7.5';
    } else {
      // Fallback a lógica anterior si no hay typeId (opcional)
      const c1_perm = centerOfTooth(svg, '4.8');
      if (c1_perm) {
        toothStartName = '4.8';
        toothEndName = '3.8';
      } else {
        toothStartName = '8.5';
        toothEndName = '7.5';
      }
    }
    // Desplazamiento basado en la lógica de Q3/Q4/Q7/Q8 del usuario: Y hacia abajo (positivo)
    displacement = 60;
  } else {
    toast.error('❌ Arcada no válida.');
    return false;
  }

  // 2. Obtener los centros de los dientes terminales (asumiendo centerOfTooth está disponible)
  const c1 = centerOfTooth(svg, toothStartName);
  const c2 = centerOfTooth(svg, toothEndName);

  if (!c1 || !c2) {
    console.error(
      `No se pudo obtener el centro de los molares terminales (${toothStartName} o ${toothEndName}).`
    );
    return false;
  }

  // 3. Aplicar el desplazamiento para posicionar la línea en la zona radicular
  const p1 = { x: c1.x, y: c1.y + displacement };
  const p2 = { x: c2.x, y: c2.y + displacement };

  const overlay = ensureOverlay(svg);

  const dxLine = p2.x - p1.x;
  const dyLine = p2.y - p1.y;
  const angle = Math.atan2(dyLine, dxLine);
  const perpAngle = angle + Math.PI / 2;
  const dx = Math.cos(perpAngle) * offset;
  const dy = Math.sin(perpAngle) * offset;

  // Línea 1 (offset positivo)
  const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l1.setAttribute('x1', p1.x + dx);
  l1.setAttribute('y1', p1.y + dy);
  l1.setAttribute('x2', p2.x + dx);
  l1.setAttribute('y2', p2.y + dy);
  l1.setAttribute('stroke', color);
  l1.setAttribute('stroke-width', '5');
  l1.setAttribute('class', 'annotation pdc-line-1');
  l1.setAttribute('data-id', `pdc-${arcada}-1-${Date.now()}`);
  overlay.appendChild(l1);

  // Línea 2 (offset negativo)
  const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l2.setAttribute('x1', p1.x - dx);
  l2.setAttribute('y1', p1.y - dy);
  l2.setAttribute('x2', p2.x - dx);
  l2.setAttribute('y2', p2.y - dy);
  l2.setAttribute('stroke', color);
  l2.setAttribute('stroke-width', '5');
  l2.setAttribute('class', 'annotation pdc-line-2');
  l2.setAttribute('data-id', `pdc-${arcada}-2-${Date.now()}`);
  overlay.appendChild(l2);

  return true;
}

export function addPPF(color = 'blue', onEnd) {
  const svg = getSvg();
  if (!svg) return { stop() {} };

  const overlay = ensureOverlay(svg);
  const pts = [];
  const names = [];
  const markers = [];
  const displacement = 55;
  const LINE_WIDTH = 5;
  let offset;
  let drew = false;
  let ended = false;

  toast(
    'Modo PPF: Haz clic en el primer diente pilar y luego en el segundo diente pilar. Presiona ESC para cancelar.'
  );

  function cleanup() {
    svg.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
    markers.forEach((m) => m.remove());
    if (!ended) {
      ended = true;
      if (typeof onEnd === 'function') onEnd(drew);
    }
  }

  function onClick(e) {
    const g = toothGroupFromEventRobust(svg, e);
    if (!g) {
      console.warn('Clic ignorado: No se hizo clic en un diente.');
      return;
    }

    const name = g.getAttribute('data-name');
    if (!name || names.includes(name)) return;
    names.push(name);

    const toothCenter = centerOfTooth(svg, name);
    if (!toothCenter) {
      console.warn(`No se encontró el centro para el diente ${name}.`);
      return;
    }

    // 1. Determinar el punto de conexión ajustado (p1 y p2)
    let adjustedP;
    const quadrant = parseInt(name.charAt(0));

    // Superior: Desplazamiento negativo (hacia ARRIBA/raíz)
    if ((quadrant >= 1 && quadrant <= 2) || (quadrant >= 5 && quadrant <= 6)) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y - displacement };
      offset = -8;

      // Inferior: Desplazamiento positivo (hacia ABAJO/raíz)
    } else if (
      (quadrant >= 3 && quadrant <= 4) ||
      (quadrant >= 7 && quadrant <= 8)
    ) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y + displacement };
      offset = 8;
    } else {
      console.error('Cuadrante no válido.');
      cleanup();
      return;
    }

    // Dibujar marcador temporal
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', adjustedP.x);
    c.setAttribute('cy', adjustedP.y);
    c.setAttribute('r', '4');
    c.setAttribute('fill', color);
    overlay.appendChild(c);
    markers.push(c);
    pts.push(adjustedP); // Almacena P1 / P2 (Punto en el pilar)

    if (pts.length === 2) {
      // 2. VALIDACIÓN CLÍNICA
      if (!isValidArcade(names[0], names[1])) {
        toast.error(
          '❌ Error clínico: La Prótesis Fija debe conectar dientes de la misma arcada.'
        );
        cleanup();
        return;
      }

      // 3. Lógica de Dibujo de la PPF (Conectores en esquina, grosor uniforme)
      const p1 = pts[0]; // Pilar 1
      const p2 = pts[1]; // Pilar 2

      // Calcular ángulo de la línea principal (p1 a p2)
      const dxLine = p2.x - p1.x;
      const dyLine = p2.y - p1.y;
      const angle = Math.atan2(dyLine, dxLine);
      const perpAngle = angle + Math.PI / 2; // Ángulo perpendicular (para la esquina)

      // Calcular el desplazamiento (dx/dy) para movernos del pilar al cuerpo del puente
      const dx = Math.cos(perpAngle) * offset;
      const dy = Math.sin(perpAngle) * offset;

      // Puntos en el CUERPO del puente (P1' y P2')
      const p1_body = { x: p1.x + dx, y: p1.y + dy };
      const p2_body = { x: p2.x + dx, y: p2.y + dy };

      // Función auxiliar para dibujar una línea SVG
      const drawLine = (x1, y1, x2, y2, idSuffix) => {
        const line = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', LINE_WIDTH); // Grosor uniforme
        line.setAttribute('stroke-linecap', 'butt');
        line.setAttribute('class', 'annotation ppf-' + idSuffix);
        line.setAttribute(
          'data-id',
          `ppf-${names.join('-')}-${Date.now()}-${idSuffix}`
        );
        overlay.appendChild(line);
      };
      drawLine(p1.x, p1.y, p1_body.x, p1_body.y, 'conn-1');
      drawLine(p1_body.x, p1_body.y, p2_body.x, p2_body.y, 'main');
      drawLine(p2_body.x, p2_body.y, p2.x, p2.y, 'conn-2');

      drew = true;
      // Eliminar marcadores temporales y finalizar
      cleanup();
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') cleanup();
  }
  svg.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  return { stop: cleanup };
}

export function addTransposition(color = 'blue', onEnd) {
  const svg = getSvg();
  if (!svg) return { stop() {} };

  const overlay = ensureOverlay(svg);
  const pts = []; // Almacena los puntos ajustados {x, y}
  const names = [];
  const markers = [];
  const CURVE_HEIGHT = 20;
  const DISPLACEMENT = 55;
  let drew = false;
  let ended = false;

  // 🔑 AJUSTE CLAVE: Aumentamos el desplazamiento a 25 para evitar superposición
  const ARROW_H_OFFSET = 15;

  toast(
    'Modo Transposición Dentaria: Haz clic en el primer diente y luego en el segundo diente que están transpuestos. Presiona ESC para cancelar.'
  );

  function cleanup() {
    svg.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
    markers.forEach((m) => m.remove());
    if (!ended) {
      ended = true;
      if (typeof onEnd === 'function') onEnd(drew);
    }
  }

  function onClick(e) {
    const g = toothGroupFromEventRobust(svg, e);
    if (!g) {
      console.warn('Clic ignorado: No se hizo clic en un diente.');
      return;
    }

    const name = g.getAttribute('data-name');
    if (!name || names.includes(name)) return;
    names.push(name);

    const toothCenter = centerOfTooth(svg, name);
    if (!toothCenter) {
      console.warn(`No se encontró el centro para el diente ${name}.`);
      return;
    }

    let adjustedP;
    const quadrant = parseInt(name.charAt(0));

    // Cálculo de adjustedP (Y)
    if (quadrant === 1 || quadrant === 2 || quadrant === 5 || quadrant === 6) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y - DISPLACEMENT };
    } else if (
      quadrant === 3 ||
      quadrant === 4 ||
      quadrant === 7 ||
      quadrant === 8
    ) {
      adjustedP = { x: toothCenter.x, y: toothCenter.y + DISPLACEMENT };
    } else {
      console.error('Cuadrante no válido.');
      cleanup();
      return;
    }
    // Dibujar marcador temporal
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', adjustedP.x);
    c.setAttribute('cy', adjustedP.y);
    c.setAttribute('r', '4');
    c.setAttribute('fill', color);
    overlay.appendChild(c);
    markers.push(c);
    pts.push(adjustedP);

    if (pts.length === 2) {
      // 2. VALIDACIÓN CLÍNICA:
      if (!isValidArcade(names[0], names[1])) {
        toast.error(
          '❌ Error clínico: La Transposición debe ser entre dientes de la misma arcada.'
        );
        cleanup();
        return;
      }

      // 3. Lógica de Dibujo de las DOS Curvas
      const p1 = pts[0];
      const p2 = pts[1];

      // Ordenar por posición X
      const startP = p1.x < p2.x ? p1 : p2; // Diente Izquierdo
      const endP = p1.x < p2.x ? p2 : p1; // Diente Derecho

      const curveY = startP.y; // Y común para la curva
      // Determinar la dirección de la curva (solo necesitamos el cuadrante de uno)
      let curveDirection;
      if (
        (quadrant >= 1 && quadrant <= 2) ||
        (quadrant >= 5 && quadrant <= 6)
      ) {
        curveDirection = 1;
      } else if (
        (quadrant >= 3 && quadrant <= 4) ||
        (quadrant >= 7 && quadrant <= 8)
      ) {
        curveDirection = -1; // Inferior: arco hacia abajo
      }

      // Punto de control Y
      const cpY = curveY - curveDirection * CURVE_HEIGHT;

      // --- Función auxiliar para dibujar una flecha (Path de Bézier Cúbico) ---
      const drawArrow = (startX, endX, idSuffix) => {
        const diffX = endX - startX;

        const cp1X = startX + diffX * 0.25;
        const cp2X = startX + diffX * 0.75;

        const pathData = `M ${startX} ${curveY} 
                          C ${cp1X} ${cpY} 
                            ${cp2X} ${cpY} 
                            ${endX} ${curveY}`;

        const path = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path'
        );
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute(
          'marker-end',
          `url(#transposition-arrow-head-${color})`
        );
        path.setAttribute('class', 'annotation transposition-' + idSuffix);
        overlay.appendChild(path);
      };

      // 4. DIBUJAR FLECHA A (Izquierda -> Derecha)
      // INICIO: Se mueve a la derecha del centro de startP
      const startA_X = startP.x - ARROW_H_OFFSET;
      // FIN: Se mueve a la izquierda del centro de endP
      const endA_X = endP.x;

      drawArrow(startA_X, endA_X, 'A');

      // 5. DIBUJAR FLECHA B (Derecha -> Izquierda)
      // INICIO: Se mueve a la izquierda del centro de endP
      const startB_X = endP.x + ARROW_H_OFFSET;
      // FIN: Se mueve a la derecha del centro de startP
      const endB_X = startP.x;

      drawArrow(startB_X, endB_X, 'B');
      ensureArrowMarker(svg, color, 'transposition');

      drew = true;
      cleanup();
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') cleanup();
  }
  svg.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  return { stop: cleanup };
}

// ===================================================================
// HALLAZGOS NTS N° 188-MINSA/DGIESP-2022 ADICIONALES (ADR-0035)
// ===================================================================

const SVGNS = 'http://www.w3.org/2000/svg';
const quadrantOf = (name) => parseInt(String(name).charAt(0), 10);
// En el odontograma, las coronas superiores (cuadrantes 1,2,5,6) apuntan hacia
// ABAJO (oclusal = mayor Y) y las inferiores (3,4,7,8) hacia ARRIBA.
const isUpperQuadrant = (q) => q === 1 || q === 2 || q === 5 || q === 6;

// Escribe una sigla en el recuadro (input) del diente y dibuja una etiqueta
// centrada (con desfase si ya hay etiquetas). Para hallazgos de tipo "sigla":
// caries (MB/CE/CD/CDP), RR, DES, posición anormal (M/D/V/P/L), sellante, TC/PC.
export function addSiglaHallazgo(toothDataName, sigla, color = 'red') {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const info = getToothBBox(svg, toothDataName);
    if (!info) return false;
    const input = inputForToothDOM(svg, toothDataName);
    if (input) {
      input.value = sigla;
      input.style.border = `2px solid ${color}`;
      input.style.color = color;
    }
    drawCenteredToothLabel(
      svg,
      toothDataName,
      sigla,
      color,
      'sigla-hallazgo',
      `sig${String(sigla).replace(/[^a-zA-Z]/g, '')}`
    );
    return true;
  } catch (err) {
    console.error('addSiglaHallazgo error', err);
    return false;
  }
}

// Dibuja una flecha vertical (recta o en zig-zag) con punta, junto a la pieza.
// mode (NTS N° 188-MINSA/DGIESP-2022):
//   'eruption'  (§6.1.23) zig-zag hacia el plano oclusal/incisal.
//   'extrusion' (§6.1.24) recta FUERA del borde oclusal, apuntando hacia AFUERA
//               (sentido de la sobre-erupción).
//   'intrusion' (§6.1.25) recta FUERA del borde oclusal, apuntando HACIA el diente
//               (sentido apical/intrusivo).
// Ambas rectas se dibujan del lado oclusal y se distinguen por el sentido de la
// punta, conforme a las figuras oficiales de la norma.
function drawToothArrow(toothDataName, color, { zigzag = false, mode }) {
  const svg = getSvg();
  if (!svg) return false;
  const info = getToothBBox(svg, toothDataName);
  if (!info) return false;
  const overlay = ensureOverlay(svg);
  if (!overlay) return false;
  const { bbox } = info;
  const x = bbox.x + bbox.width / 2;
  const q = quadrantOf(toothDataName);
  const upper = isUpperQuadrant(q);
  // Borde oclusal/incisal de la pieza y sentido "hacia afuera" (más allá del borde).
  const occlusalY = upper ? bbox.y + bbox.height : bbox.y;
  const outward = upper ? 1 : -1;
  const len = Math.max(28, bbox.height * 0.8);
  let tailY, tipY;
  if (mode === 'extrusion') {
    // Fuera del borde oclusal, la punta apunta hacia afuera (alejándose del diente).
    tailY = occlusalY;
    tipY = occlusalY + outward * len;
  } else if (mode === 'intrusion') {
    // Fuera del borde oclusal, la punta apunta hacia el diente (hacia apical).
    tailY = occlusalY + outward * len;
    tipY = occlusalY;
  } else {
    // Erupción: zig-zag desde el interior de la corona hacia el borde oclusal.
    tailY = occlusalY - outward * len;
    tipY = occlusalY;
  }
  const created = [];
  let shaft;
  if (zigzag) {
    shaft = document.createElementNS(SVGNS, 'polyline');
    const segs = 4;
    const amp = 5;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const y = tailY + (tipY - tailY) * t;
      const xx = x + (i % 2 === 0 ? -amp : amp);
      pts.push(`${xx},${y}`);
    }
    shaft.setAttribute('points', pts.join(' '));
    shaft.setAttribute('fill', 'none');
  } else {
    shaft = document.createElementNS(SVGNS, 'line');
    shaft.setAttribute('x1', String(x));
    shaft.setAttribute('y1', String(tailY));
    shaft.setAttribute('x2', String(x));
    shaft.setAttribute('y2', String(tipY));
  }
  shaft.setAttribute('stroke', color);
  shaft.setAttribute('stroke-width', '2');
  shaft.setAttribute('class', 'annotation tooth-arrow');
  shaft.setAttribute('data-id', `arrow-${toothDataName}-${Date.now()}`);
  overlay.appendChild(shaft);
  created.push(shaft);
  // Punta (triángulo) en el extremo tipY.
  const dir = tipY >= tailY ? 1 : -1; // hacia dónde "avanza" la flecha
  const s = 5;
  const head = document.createElementNS(SVGNS, 'polygon');
  head.setAttribute(
    'points',
    `${x - s},${tipY - dir * s} ${x + s},${tipY - dir * s} ${x},${tipY}`
  );
  head.setAttribute('fill', color);
  head.setAttribute('class', 'annotation tooth-arrow');
  head.setAttribute('data-id', `arrowhead-${toothDataName}-${Date.now()}`);
  overlay.appendChild(head);
  created.push(head);
  return true;
}

// §6.1.23 Pieza en erupción — flecha en zig-zag hacia el plano oclusal.
export function addEruptionArrow(toothDataName, color = 'blue') {
  return drawToothArrow(toothDataName, color, {
    zigzag: true,
    mode: 'eruption',
  });
}

// §6.1.24 Pieza extruida — flecha recta fuera del borde oclusal hacia afuera.
export function addExtrusionArrow(toothDataName, color = 'blue') {
  return drawToothArrow(toothDataName, color, {
    zigzag: false,
    mode: 'extrusion',
  });
}

// §6.1.25 Pieza intruida — flecha recta fuera del borde oclusal hacia el diente.
export function addIntrusionArrow(toothDataName, color = 'blue') {
  return drawToothArrow(toothDataName, color, {
    zigzag: false,
    mode: 'intrusion',
  });
}

// §6.1.26 Pieza supernumeraria — "S" encerrada en una circunferencia, entre los
// ápices de las piezas adyacentes (se dibuja sobre la zona apical de la pieza).
export function addSupernumerario(toothDataName, color = 'blue') {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const info = getToothBBox(svg, toothDataName);
    if (!info) return false;
    const overlay = ensureOverlay(svg);
    if (!overlay) return false;
    const { bbox } = info;
    const q = quadrantOf(toothDataName);
    const upper = isUpperQuadrant(q);
    const cx = bbox.x + bbox.width / 2;
    // Zona apical (donde están los ápices): arriba en superiores, abajo en inf.
    const cy = upper ? bbox.y - 10 : bbox.y + bbox.height + 10;
    const r = Math.max(8, Math.min(14, bbox.width * 0.28));
    const circle = document.createElementNS(SVGNS, 'circle');
    circle.setAttribute('cx', String(cx));
    circle.setAttribute('cy', String(cy));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('class', 'annotation supernumerario');
    circle.setAttribute('data-id', `sup-${toothDataName}-${Date.now()}`);
    overlay.appendChild(circle);
    const text = document.createElementNS(SVGNS, 'text');
    text.setAttribute('x', String(cx));
    text.setAttribute('y', String(cy + r * 0.4));
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(Math.max(9, r)));
    text.setAttribute('font-weight', '700');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'annotation supernumerario');
    text.setAttribute('data-id', `sup-t-${toothDataName}-${Date.now()}`);
    text.textContent = 'S';
    overlay.appendChild(text);
    return true;
  } catch (err) {
    console.error('addSupernumerario error', err);
    return false;
  }
}

// §6.1.8 Espigo muñón — línea vertical en la raíz unida a un cuadrado en la
// corona. azul = buen estado, rojo = mal estado.
export function addEspigoMunon(toothDataName, color = 'blue') {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const info = getToothBBox(svg, toothDataName);
    if (!info) return false;
    const overlay = ensureOverlay(svg);
    if (!overlay) return false;
    const { bbox } = info;
    const q = quadrantOf(toothDataName);
    const upper = isUpperQuadrant(q);
    const cx = bbox.x + bbox.width / 2;
    const occlusalY = upper ? bbox.y + bbox.height : bbox.y;
    const apicalY = upper ? bbox.y : bbox.y + bbox.height;
    // Línea vertical en la raíz (desde el centro hacia el ápice).
    const midY = bbox.y + bbox.height / 2;
    const line = document.createElementNS(SVGNS, 'line');
    line.setAttribute('x1', String(cx));
    line.setAttribute('y1', String(midY));
    line.setAttribute('x2', String(cx));
    line.setAttribute('y2', String(apicalY));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('class', 'annotation espigo-munon');
    line.setAttribute('data-id', `em-l-${toothDataName}-${Date.now()}`);
    overlay.appendChild(line);
    // Cuadrado en la corona (lado oclusal).
    const sq = Math.max(8, Math.min(16, bbox.width * 0.4));
    const rect = document.createElementNS(SVGNS, 'rect');
    rect.setAttribute('x', String(cx - sq / 2));
    rect.setAttribute('y', String(upper ? occlusalY - sq : occlusalY));
    rect.setAttribute('width', String(sq));
    rect.setAttribute('height', String(sq));
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('class', 'annotation espigo-munon');
    rect.setAttribute('data-id', `em-s-${toothDataName}-${Date.now()}`);
    overlay.appendChild(rect);
    return true;
  } catch (err) {
    console.error('addEspigoMunon error', err);
    return false;
  }
}

// §6.1.37 Tratamiento de conducto / pulpectomía — línea vertical de color en la
// raíz + sigla (TC/PC) en el recuadro. azul = buen estado, rojo = mal estado.
export function addRootCanalLine(toothDataName, sigla = 'TC', color = 'blue') {
  try {
    const svg = getSvg();
    if (!svg) return false;
    const info = getToothBBox(svg, toothDataName);
    if (!info) return false;
    const overlay = ensureOverlay(svg);
    if (!overlay) return false;
    const { bbox } = info;
    const q = quadrantOf(toothDataName);
    const upper = isUpperQuadrant(q);
    const cx = bbox.x + bbox.width / 2;
    const apicalY = upper ? bbox.y : bbox.y + bbox.height;
    const midY = bbox.y + bbox.height / 2;
    const line = document.createElementNS(SVGNS, 'line');
    line.setAttribute('x1', String(cx));
    line.setAttribute('y1', String(midY));
    line.setAttribute('x2', String(cx));
    line.setAttribute('y2', String(apicalY));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('class', 'annotation root-canal');
    line.setAttribute('data-id', `rc-${toothDataName}-${Date.now()}`);
    overlay.appendChild(line);
    const input = inputForToothDOM(svg, toothDataName);
    if (input) {
      input.value = sigla;
      input.style.border = `2px solid ${color}`;
      input.style.color = color;
    }
    return true;
  } catch (err) {
    console.error('addRootCanalLine error', err);
    return false;
  }
}

// LESION

// Default export (compatibilidad)
export default {
  getSvg,
  ensureOverlay,
  getToothBBox,
  centerOfTooth,
  clearAnnotations,
  clearLastAnnotation, //AÑADISTE
  clearAnnotationsForTooth, //AÑADISTE
  addCrown,
  startFixedOrthoMode,
  startRemovableOrthoMode,
  addRemovableOrtho,
  startCoronaMode,
  highlightToothBox,
  addDiastemaAtPoint,
  startDiastemaMode,
  addDefect,
  addEdentulousLineBetween,
  addImplant,
  addFosasFisurasProfundas,
  addGerminacion,
  addFusion,
  getFusionCandidates,
  toothHasFusion,
  toothHasGerminacion,
  addGiroversion,
  addMissingTooth,
  addDentalProsthesis,
  addPegTooth,
  addPDC,
  addPPF,
  addPulpotomy,
  addTransposition,
  // Hallazgos NTS-188 adicionales (ADR-0035)
  addSiglaHallazgo,
  addEruptionArrow,
  addExtrusionArrow,
  addIntrusionArrow,
  addSupernumerario,
  addEspigoMunon,
  addRootCanalLine,
};
