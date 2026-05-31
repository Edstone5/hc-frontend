// src/pages/hc/ExamenFisico/odonto.jsx
//
// RF-06: Contiene dos sub-módulos complementarios:
//   1. Odontograma SVG interactivo (24 herramientas, guarda en localStorage)
//   2. Registro de intervenciones en BD (tabla, formulario) — integrado desde
//      OdontogramaPage.jsx (2026-05-30). El archivo original se conserva en
//      src/pages/hc/Odontograma/OdontogramaPage.jsx para post-evaluación.
//
// Justificación de la integración:
//   - El SVG registra el estado visual; la tabla registra intervenciones estructuradas.
//   - Ambos son parte de RF-06: "odontograma inicial" (SVG) + "evolutivo" (tabla en BD).
//   - Tenerlos en la misma vista evita que el estudiante navegue entre dos secciones.

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import toast from 'react-hot-toast';
import OdontogramaToolsPanel from './odotools';
import IhoSPanel from './IhoSPanel';
import EpbPanel from './EpbPanel';
import LeyendaOdonto from './LeyendaOdonto';
import OdontogramaRegistros from './OdontogramaRegistros';
import ExportarPDF from '@components/PdfExport/ExportarPDF';
import { calcularIndices } from './indicesOdonto';
import {
  useOdontograma,
  useOdontogramaSvg,
  useAddOdontogramaSvg,
} from '@hooks/useClinico';

// Tipos de odontograma según RF-06 / NTS N° 188-MINSA:
//   INICIAL   → estado en que llegó el paciente (uno por historia)
//   EVOLUCION → cambios/tratamientos por sesión (varios por historia)
const TIPO_INICIAL = 'INICIAL';
const TIPO_EVOLUCION = 'EVOLUCION';

function formatFecha(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-PE');
}

const CRITICAL_SVG_STYLES = `
  .letra {
    border: 1px solid #000;
    padding: 4px;
    border-radius: 4px;
  }
  .line { stroke-width: 2; }
  .thin { stroke-width: 1 !important; }
  .posnumber { font-size: 10px; fill: #333; }
  .tooth-name { font-size: 10px; fill: #111; pointer-events: none; }
  .part { cursor: pointer; stroke: black; fill: none; }
  .tooth-group:hover .highlight rect,
  .tooth-group:hover .highlight polygon,
  .tooth-group:hover .highlight path { stroke: #e33; stroke-width: 2.5; }
  input.letra, textarea.letra { font-size: 12px; } 
  .annotation { display: block; }
`;
export default function Odontograma() {
  // ── OBTENER EL ID DESDE LA URL ────────────────────────────────────────────
  const { id: patientId } = useParams();

  // ── CLAVE ÚNICA DE LOCALSTORAGE (versiones SVG) ───────────────────────────
  const STORAGE_KEY = `odontogramaVersions_${patientId}`;

  // Entradas estructuradas (solo lectura aquí) para los índices CPO-D/CEO-D.
  // El registro/edición vive en <OdontogramaRegistros>. React Query deduplica
  // esta query con la del componente hijo (mismo queryKey).
  const { data: entradas = [] } = useOdontograma(patientId);

  // ── TIPO DE ODONTOGRAMA (INICIAL / EVOLUCION) — RF-06 ─────────────────────
  const [tipoOdontograma, setTipoOdontograma] = useState(TIPO_EVOLUCION);

  // Vista de solo lectura del último odontograma SVG guardado en BD (Track C2).
  const [verGuardadoBD, setVerGuardadoBD] = useState(false);

  // SVG persistido en BD (enfoque híbrido). Consultamos todos para saber si
  // ya existe un INICIAL (que es único por historia).
  const { data: svgsGuardados = [] } = useOdontogramaSvg(patientId);
  const { mutate: guardarSvgBD } = useAddOdontogramaSvg();
  const svgInicial = svgsGuardados.find((s) => s.tipo === TIPO_INICIAL) || null;
  const yaExisteInicial = Boolean(svgInicial);
  // Último SVG guardado del tipo activo (o el más reciente) para la vista BD.
  const svgGuardadoActual =
    svgsGuardados.find((s) => s.tipo === tipoOdontograma) ||
    svgsGuardados[0] ||
    null;

  // Índices CPO-D / CEO-D derivados de las entradas estructuradas (Bloque 3).
  const indices = calcularIndices(entradas);

  // ── SELECCIÓN DE DIENTE POR CLICK (Track B) ───────────────────────────────
  // Permite elegir el diente haciendo click en el SVG en lugar de teclearlo en
  // un window.prompt (apto para tablet, alineado con NTS-188 y software comercial).
  const [selectedTooth, setSelectedTooth] = useState(null);

  // Selecciona el diente MÁS CERCANO al punto de click (no requiere acertar el
  // trazo del diente, cuyo relleno es transparente). Mucho más usable en tablet.
  const handleToothClick = useCallback((e) => {
    const svg = document.querySelector('svg.odo');
    if (!svg) return;

    // 1) Si el click cae directamente sobre un grupo de diente, úsalo.
    const directo =
      e.target.closest && e.target.closest('.tooth-group[data-name]');
    if (directo) {
      const nombre = directo.getAttribute('data-name');
      if (nombre) {
        setSelectedTooth(nombre.trim());
        return;
      }
    }

    // 2) Si no cayó sobre el trazo, el click debe caer DENTRO del bounding box
    //    de un diente (su área visual) para seleccionarlo. Clicar en el espacio
    //    vacío entre dientes NO selecciona nada (evita selecciones accidentales).
    //    Si varios bounding boxes contienen el punto (solapamiento de dientes
    //    contiguos), se elige aquel cuyo centro esté más cerca del click.
    const grupos = svg.querySelectorAll('.tooth-group[data-name]');
    let mejor = null;
    let mejorDist = Infinity;
    grupos.forEach((g) => {
      let rect;
      try {
        rect = g.getBoundingClientRect();
      } catch {
        return;
      }
      if (!rect || (rect.width === 0 && rect.height === 0)) return;
      // El punto de click debe estar dentro del rectángulo del diente.
      const dentro =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!dentro) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const d = Math.hypot(cx - e.clientX, cy - e.clientY);
      if (d < mejorDist) {
        mejorDist = d;
        mejor = g.getAttribute('data-name');
      }
    });
    if (mejor) setSelectedTooth(mejor.trim());
  }, []);

  // Resalta el diente seleccionado marcando su etiqueta (FDI) en el SVG.
  const [showHistory, setShowHistory] = useState(false);
  useEffect(() => {
    const svg = document.querySelector('svg.odo');
    if (!svg) return;
    svg.querySelectorAll('text.tooth-name').forEach((t) => {
      const activo = t.textContent.trim() === selectedTooth;
      t.style.fill = activo ? '#2563eb' : '';
      t.style.fontWeight = activo ? '700' : '';
      t.style.fontSize = activo ? '13px' : '';
    });
  }, [selectedTooth, entradas, showHistory]);

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => {
    // ... Carga del script visorOdonto.js ...
    const script = document.createElement('script');
    script.src = '/visorOdonto.js';
    script.async = false;
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch {
        /* ignore error */
      }
    };
  }, []);

  // Función para GUARDAR la versión actual
  const saveOdontogramaVersion = useCallback(() => {
    const svgElement = document.querySelector('svg.odo');
    if (!svgElement) return toast.error('SVG no encontrado.');

    // 1. OBTENER LOS VALORES ACTUALES DEL DOM ACTIVO
    const dateInput = document.querySelector('input[type="date"]');
    const especificacionesEl = document.querySelector('#inputEspecificaciones');
    const observacionesEl = document.querySelector('#inputObservaciones');

    const currentDate = dateInput ? dateInput.value : '';
    const currentEspec = especificacionesEl ? especificacionesEl.value : '';
    const currentObs = observacionesEl ? observacionesEl.value : '';

    const toothInputs = document.querySelectorAll('foreignObject input.letra');

    // 2. Clonar el SVG
    const svgClone = svgElement.cloneNode(true);

    // 3. INYECTAR VALORES Y ESTILOS EN EL SVG CLONADO ANTES DE GUARDAR

    // A. Inyectar Fecha
    const clonedDateInput = svgClone.querySelector('input[type="date"]');
    if (clonedDateInput) {
      clonedDateInput.setAttribute('value', currentDate);
    }

    // B. Inyectar Especificaciones y Observaciones
    const clonedEspecEl = svgClone.querySelector('#inputEspecificaciones');
    const clonedObsEl = svgClone.querySelector('#inputObservaciones');

    if (clonedEspecEl) {
      clonedEspecEl.textContent = currentEspec;
    }
    if (clonedObsEl) {
      clonedObsEl.textContent = currentObs;
    }

    // C. Inyectar valores de los INPUTS DE DIENTES
    const clonedToothInputs = svgClone.querySelectorAll(
      'foreignObject input.letra'
    );

    clonedToothInputs.forEach((clonedInput, index) => {
      const originalInput = toothInputs[index];
      if (originalInput) {
        clonedInput.setAttribute('value', originalInput.value);
      }
    });

    // D. INYECTAR ESTILOS DENTRO DEL SVG CLONADO
    const styleEl = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'style'
    );
    styleEl.setAttribute('type', 'text/css');
    styleEl.textContent = CRITICAL_SVG_STYLES;
    svgClone.prepend(styleEl);

    // 4. Serializar el SVG
    const svgContent = new XMLSerializer().serializeToString(svgClone);

    // 5. Crear el objeto de datos
    const data = {
      date: currentDate,
      svg: svgContent,
      especificaciones: currentEspec,
      observaciones: currentObs,
      timestamp: new Date().toLocaleString(),
      id: Date.now(),
    };

    // 6. Cargar el historial existente, añadir la nueva versión y guardar
    // USAMOS LA CLAVE ESPECÍFICA DEL PACIENTE (STORAGE_KEY)
    const existingVersions = localStorage.getItem(STORAGE_KEY);
    let versions = existingVersions ? JSON.parse(existingVersions) : [];

    versions.unshift(data);

    const MAX_VERSIONS = 10;
    if (versions.length > MAX_VERSIONS) {
      versions = versions.slice(0, MAX_VERSIONS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));

    // ── Persistencia en BD (enfoque híbrido RF-06) ─────────────────────────
    // El localStorage queda como respaldo offline; la BD es la fuente oficial.
    // Regla RF-06: el odontograma INICIAL es único por historia y debe existir
    // antes que cualquier EVOLUCIÓN (no puede haber evolución sin línea base).
    let tipoEfectivo = tipoOdontograma;

    // CONTINGENCIA: si se intenta guardar una EVOLUCIÓN y aún NO existe un
    // INICIAL para la historia, este primer odontograma se guarda como INICIAL
    // automáticamente (la evolución requiere una línea base previa).
    if (tipoOdontograma === TIPO_EVOLUCION && !yaExisteInicial) {
      tipoEfectivo = TIPO_INICIAL;
      toast(
        'Aún no existía un odontograma INICIAL para este paciente; este se ha guardado como INICIAL (línea base).',
        { icon: 'ℹ️', duration: 6000 }
      );
    }

    // El INICIAL es único: si ya existe, no se permite crear otro.
    if (tipoEfectivo === TIPO_INICIAL && yaExisteInicial) {
      toast.error(
        'Ya existe un odontograma INICIAL para esta historia. Use el tipo EVOLUCIÓN para registrar cambios.'
      );
      return;
    }

    guardarSvgBD(
      {
        idHistory: patientId,
        data: {
          tipo: tipoEfectivo,
          svg: svgContent,
          especificaciones: currentEspec,
          observaciones: currentObs,
          fecha: currentDate || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            `Odontograma ${tipoEfectivo} guardado en la historia clínica (paciente ${patientId}).`
          );
          // Mantener la UI coherente con lo realmente guardado.
          if (tipoEfectivo !== tipoOdontograma)
            setTipoOdontograma(tipoEfectivo);
        },
        onError: (e) =>
          toast.error(
            e.message ||
              'El dibujo se guardó localmente, pero falló el guardado en BD.'
          ),
      }
    );
  }, [patientId, STORAGE_KEY, tipoOdontograma, yaExisteInicial, guardarSvgBD]);

  // Función para CARGAR el historial de versiones
  const loadHistory = useCallback(() => {
    // USAMOS LA CLAVE ESPECÍFICA DEL PACIENTE (STORAGE_KEY)
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data)
      return toast.error(
        `No hay versiones guardadas en el historial para este paciente (ID: ${patientId}).`
      );

    const parsedData = JSON.parse(data);
    setHistoryList(parsedData);
    setShowHistory(true);
    setSelectedVersion(null);
  }, [patientId, STORAGE_KEY]); // <--- patientId como dependencia

  // Función para SELECCIONAR y visualizar una versión específica
  const selectAndShowVersion = useCallback((versionData) => {
    setSelectedVersion(versionData);
  }, []);

  // Función para CERRAR la vista del historial
  const closeHistory = useCallback(() => {
    setShowHistory(false);
    setSelectedVersion(null);
    setHistoryList([]);
  }, []);

  // --- NUEVO RENDERIZADO: MODOS DE VISTA ---

  // 0. Vista de solo lectura del último odontograma guardado en BD (Track C2)
  if (verGuardadoBD && svgGuardadoActual) {
    return (
      <div style={{ padding: 20, background: '#eef2ff', borderRadius: 8 }}>
        <button
          onClick={() => setVerGuardadoBD(false)}
          style={{
            marginBottom: 15,
            padding: '8px 15px',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
          }}
        >
          ← Volver al odontograma editable
        </button>
        <h2 style={{ marginBottom: 4 }}>
          Odontograma guardado en BD — {svgGuardadoActual.tipo}
        </h2>
        <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>
          Fecha:{' '}
          {formatFecha(svgGuardadoActual.fecha || svgGuardadoActual.created_at)}
        </p>
        {/* SVG serializado tal cual se guardó (solo lectura) */}
        <div
          dangerouslySetInnerHTML={{ __html: svgGuardadoActual.svg }}
          style={{
            border: '1px solid #ccc',
            padding: 10,
            background: 'white',
            overflow: 'auto',
          }}
        />
        {(svgGuardadoActual.especificaciones ||
          svgGuardadoActual.observaciones) && (
          <div style={{ marginTop: 16 }}>
            {svgGuardadoActual.especificaciones && (
              <p>
                <strong>Especificaciones:</strong>{' '}
                {svgGuardadoActual.especificaciones}
              </p>
            )}
            {svgGuardadoActual.observaciones && (
              <p>
                <strong>Observaciones:</strong>{' '}
                {svgGuardadoActual.observaciones}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // 1. Vista de una versión seleccionada (Historial abierto)
  if (showHistory && selectedVersion) {
    return (
      <div style={{ padding: 20, background: '#e0f7fa', borderRadius: 8 }}>
        <button
          onClick={() => setSelectedVersion(null)}
          style={{
            marginBottom: 15,
            padding: '8px 15px',
            background: '#00bcd4',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
          }}
        >
          ← Volver al Historial
        </button>
        <h2>Odontograma Guardado ({selectedVersion.timestamp})</h2>

        <p>
          <strong>Fecha del Examen:</strong>{' '}
          {selectedVersion.date || 'No especificada'}
        </p>

        <div
          dangerouslySetInnerHTML={{ __html: selectedVersion.svg }}
          style={{ border: '1px solid #ccc', padding: 10, background: 'white' }}
        />

        <div style={{ marginTop: 20 }}>
          <h3>Especificaciones:</h3>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              border: '1px solid #eee',
              padding: 10,
              background: '#fafafa',
            }}
          >
            {selectedVersion.especificaciones || 'Sin texto.'}
          </p>
          <h3>Observaciones:</h3>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              border: '1px solid #eee',
              padding: 10,
              background: '#fafafa',
            }}
          >
            {selectedVersion.observaciones || 'Sin texto.'}
          </p>
        </div>
      </div>
    );
  }

  // 2. Vista de la lista del historial
  if (showHistory) {
    return (
      <div style={{ padding: 20, background: '#f0f4c3', borderRadius: 8 }}>
        <button
          onClick={closeHistory}
          style={{
            marginBottom: 15,
            padding: '8px 15px',
            background: '#e53935',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
          }}
        >
          ← Cerrar Historial y Volver al Odontograma Actual
        </button>
        <h2>
          Historial de Versiones Guardadas para el Paciente ID: {patientId} (
          {historyList.length})
        </h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {historyList.map((version, index) => (
            <li
              key={version.id}
              style={{
                padding: '10px 15px',
                margin: '5px 0',
                borderBottom: '1px solid #ccc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: index === 0 ? '#ffecb3' : '#fff',
              }}
            >
              <span>
                <strong>Versión #{historyList.length - index}:</strong>{' '}
                {version.timestamp}
                {index === 0 && (
                  <span
                    style={{ marginLeft: 10, fontSize: '12px', color: 'green' }}
                  >
                    {' '}
                    (Más Reciente)
                  </span>
                )}
              </span>
              <button
                onClick={() => selectAndShowVersion(version)}
                style={{
                  padding: '5px 10px',
                  background: '#1e88e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer',
                }}
              >
                Ver
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      {/* ── SELECTOR DE TIPO DE ODONTOGRAMA (RF-06) ─────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          background: 'white',
          padding: '12px 16px',
          borderRadius: 8,
          margin: '0 0 8px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
          Tipo de odontograma:
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {[TIPO_INICIAL, TIPO_EVOLUCION].map((t) => {
            const activo = tipoOdontograma === t;
            const deshabilitado = t === TIPO_INICIAL && yaExisteInicial;
            return (
              <button
                key={t}
                onClick={() => setTipoOdontograma(t)}
                disabled={deshabilitado && !activo}
                title={
                  deshabilitado
                    ? 'Ya existe un odontograma INICIAL para esta historia'
                    : t === TIPO_INICIAL
                      ? 'Estado en que llegó el paciente (único por historia)'
                      : 'Cambios y tratamientos por sesión'
                }
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: activo
                    ? '2px solid var(--color-primary)'
                    : '2px solid #e5e7eb',
                  background: activo ? 'var(--color-primary)' : 'white',
                  color: activo ? 'white' : '#374151',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: deshabilitado && !activo ? 'not-allowed' : 'pointer',
                  opacity: deshabilitado && !activo ? 0.5 : 1,
                }}
              >
                {t === TIPO_INICIAL ? 'Inicial' : 'Evolución'}
              </button>
            );
          })}
        </div>
        {yaExisteInicial && (
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Inicial registrado el{' '}
            {formatFecha(svgInicial?.fecha || svgInicial?.created_at)}
          </span>
        )}

        {/* Acciones: ver guardado en BD (C2) + exportar PDF (C3) */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          {svgGuardadoActual && (
            <button
              onClick={() => setVerGuardadoBD(true)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: 8,
                border: '2px solid var(--color-primary)',
                background: 'white',
                color: 'var(--color-primary)',
                cursor: 'pointer',
              }}
            >
              Ver guardado (BD)
            </button>
          )}
          <ExportarPDF
            targetId="odontograma-export"
            nombreArchivo="odontograma"
            titulo="Odontograma"
            idHistoria={patientId}
          />
        </div>
      </div>
      <p
        style={{
          fontSize: 11,
          color: '#9ca3af',
          margin: '0 0 8px',
          padding: '0 4px',
        }}
      >
        El tipo seleccionado se aplica al guardar el dibujo y al registrar
        intervenciones (azul = buen estado, rojo = mal estado — NTS N° 188).
      </p>

      {/* Leyenda normativa de hallazgos (NTS N° 188-2022) */}
      <LeyendaOdonto />

      <div
        className="flex gap-4 p-4"
        style={{ minHeight: '80vh', background: '#f8fafc' }}
      >
        {/* Contenedor que delega los clicks de los dientes del SVG. La vía
            accesible alternativa (teclado) es el ingreso manual del diente por
            prompt, que sigue disponible como respaldo. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          id="odontograma-export"
          onClick={handleToothClick}
          style={{
            flex: 1,
            overflow: 'auto',
            background: 'white',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <style>{`
          .letra {
            border: 1px solid #000;
            padding: 4px;
            border-radius: 4px;
          }
          .line {stroke-width: 2;}
          .thin { stroke-width: 1 !important; }
          .posnumber { font-size: 10px; fill: #333; }
          .tooth-name { font-size: 10px; fill: #111; pointer-events: none; }
          .part { cursor: pointer; stroke: black; fill: none; }
          .tooth-group { cursor: pointer; }
          .tooth-group:hover .part { stroke: #2563eb; }
          .tooth-group:hover .highlight rect,
          .tooth-group:hover .highlight polygon,
          .tooth-group:hover .highlight path { stroke: #e33; stroke-width: 2.5; }
          input.letra { font-size:12px; }
        `}</style>

          {/* SVG completo — responsive (Track D): escala al ancho del
              contenedor preservando el viewBox (apto para tablet). */}
          <svg
            className="odo"
            width="100%"
            height="auto"
            viewBox="0 0 1400 1400"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            style={{
              background: 'white',
              fontFamily: 'Arial, sans-serif',
              display: 'block',
              width: '100%',
              height: 'auto',
              minWidth: 320,
            }}
          >
            <foreignObject x="1170" y="20" width="270" height="40">
              <div>
                <label
                  htmlFor="fecha"
                  style={{ fontSize: '12px', marginRight: '10px' }}
                >
                  Fecha:
                </label>
                <input
                  id="fecha"
                  type="date"
                  className="letra"
                  style={{ width: '100px' }}
                />
              </div>
            </foreignObject>
            {/* ======= DEFINICIÓN DE LOS 8 DISEÑOS (design1..design8) ======= */}
            <defs>
              {/* DESIGN 1 */}
              <g id="design1">
                <polygon
                  id="d1_part1"
                  className="part line"
                  points="50,100 80,100 80,70 50,30"
                  data-name="corona-izq"
                />
                <polygon
                  id="d1_part2"
                  className="part line"
                  points="80,70 100,30 120,70 120,100 80,100"
                  data-name="corona-centro"
                />
                <polygon
                  id="d1_part3"
                  className="part line"
                  points="150,100 120,100 120,70 150,30"
                  data-name="corona-der"
                />
                <polygon
                  id="d1_part4"
                  className="part line"
                  points="50,200 78,170 78,130 50,100"
                  data-name="raiz-izq"
                />
                <polygon
                  id="d1_part5"
                  className="part line"
                  points="150,200 120,170 120,130 150,100"
                  data-name="raiz-der"
                />
                <polygon
                  id="d1_part6"
                  className="part line"
                  points="150,200 120,170 80,170 50,200"
                  data-name="base"
                />
                <polygon
                  id="d1_part7"
                  className="part line"
                  points="50,100 80,130 120,130 150,100"
                  data-name="cingulo"
                />
                <rect
                  id="d1_part8"
                  className="part thin"
                  x="78"
                  y="130"
                  width="14"
                  height="20"
                  data-name="fosa1"
                />
                <rect
                  id="d1_part9"
                  className="part thin"
                  x="93"
                  y="130"
                  width="12"
                  height="20"
                  data-name="fosa2"
                />
                <rect
                  id="d1_part10"
                  className="part thin"
                  x="106"
                  y="130"
                  width="13"
                  height="20"
                  data-name="fosa3"
                />
                <rect
                  id="d1_part11"
                  className="part thin"
                  x="78"
                  y="150"
                  width="14"
                  height="20"
                  data-name="surco1"
                />
                <rect
                  id="d1_part12"
                  className="part thin"
                  x="93"
                  y="150"
                  width="12"
                  height="20"
                  data-name="surco2"
                />
                <rect
                  id="d1_part13"
                  className="part thin"
                  x="106"
                  y="150"
                  width="13"
                  height="20"
                  data-name="surco3"
                />
                <title>Design 1 (13 partes)</title>
              </g>

              {/* DESIGN 2 */}
              <g id="design2">
                <g transform="rotate(180,100,100)">
                  <polygon
                    id="d2_part1"
                    className="part line"
                    points="50,70 75,30 100,70 100,100 50,100"
                    data-name="corona-izq"
                  />
                  <polygon
                    id="d2_part2"
                    className="part line"
                    points="100,70 120,30 150,70 150,100 100,100"
                    data-name="corona-der"
                  />
                  <polygon
                    id="d2_part3"
                    className="part line"
                    points="50,200 78,170 78,130 50,100"
                    data-name="raiz-izq"
                  />
                  <polygon
                    id="d2_part4"
                    className="part line"
                    points="150,200 120,170 120,130 150,100"
                    data-name="raiz-der"
                  />
                  <polygon
                    id="d2_part5"
                    className="part line"
                    points="150,200 120,170 80,170 50,200"
                    data-name="base"
                  />
                  <polygon
                    id="d2_part6"
                    className="part line"
                    points="50,100 80,130 120,130 150,100"
                    data-name="cingulo"
                  />
                  <rect
                    id="d2_part7"
                    className="part thin"
                    x="78"
                    y="130"
                    width="14"
                    height="20"
                    data-name="fosa1"
                  />
                  <rect
                    id="d2_part8"
                    className="part thin"
                    x="93"
                    y="130"
                    width="12"
                    height="20"
                    data-name="fosa2"
                  />
                  <rect
                    id="d2_part9"
                    className="part thin"
                    x="106"
                    y="130"
                    width="13"
                    height="20"
                    data-name="fosa3"
                  />
                  <rect
                    id="d2_part10"
                    className="part thin"
                    x="78"
                    y="150"
                    width="14"
                    height="20"
                    data-name="surco1"
                  />
                  <rect
                    id="d2_part11"
                    className="part thin"
                    x="93"
                    y="150"
                    width="12"
                    height="20"
                    data-name="surco2"
                  />
                  <rect
                    id="d2_part12"
                    className="part thin"
                    x="106"
                    y="150"
                    width="13"
                    height="20"
                    data-name="surco3"
                  />
                  <title>Design 2 (12 partes) - girado</title>
                </g>
              </g>

              {/* DESIGN 3 */}
              <g id="design3">
                <polygon
                  id="d3_part1"
                  className="part line"
                  points="100,30 70,100 130,100"
                  data-name="corona-tri"
                />
                <polygon
                  id="d3_part2"
                  className="part line"
                  points="50,200 78,170 78,130 50,100"
                  data-name="raiz-izq"
                />
                <polygon
                  id="d3_part3"
                  className="part line"
                  points="150,200 120,170 120,130 150,100"
                  data-name="raiz-der"
                />
                <polygon
                  id="d3_part4"
                  className="part line"
                  points="150,200 120,170 80,170 50,200"
                  data-name="base"
                />
                <polygon
                  id="d3_part5"
                  className="part line"
                  points="50,100 80,130 120,130 150,100"
                  data-name="cingulo"
                />
                <rect
                  id="d3_part6"
                  className="part thin"
                  x="78"
                  y="130"
                  width="42"
                  height="20"
                  data-name="fosas"
                />
                <rect
                  id="d3_part7"
                  className="part thin"
                  x="78"
                  y="150"
                  width="42"
                  height="20"
                  data-name="surcos"
                />
                <title>Design 3 (7 partes)</title>
              </g>

              {/* DESIGN 4 */}
              <g id="design4">
                <g transform="rotate(180,100,120)">
                  <polygon
                    id="d4_part1"
                    className="part line"
                    points="100,30 70,100 130,100"
                    data-name="corona-tri"
                  />
                  <polygon
                    id="d4_part2"
                    className="part line"
                    points="50,200 78,170 78,130 50,100"
                    data-name="raiz-izq"
                  />
                  <polygon
                    id="d4_part3"
                    className="part line"
                    points="150,200 120,170 120,130 150,100"
                    data-name="raiz-der"
                  />
                  <polygon
                    id="d4_part4"
                    className="part line"
                    points="150,200 120,170 80,170 50,200"
                    data-name="base"
                  />
                  <polygon
                    id="d4_part5"
                    className="part line"
                    points="50,100 80,130 120,130 150,100"
                    data-name="cingulo"
                  />
                  <rect
                    id="d4_part6"
                    className="part thin"
                    x="78"
                    y="130"
                    width="42"
                    height="20"
                    data-name="fosas"
                  />
                  <rect
                    id="d4_part7"
                    className="part thin"
                    x="78"
                    y="150"
                    width="42"
                    height="20"
                    data-name="surcos"
                  />
                  <title>Design 4 (7 partes) - girado</title>
                </g>
              </g>

              {/* DESIGN 5 */}
              <g id="design5">
                <polygon
                  id="d5_part1"
                  className="part line"
                  points="80,30 60,100 100,100"
                  data-name="corona-l1"
                />
                <polygon
                  id="d5_part2"
                  className="part line"
                  points="120,30 100,100 140,100"
                  data-name="corona-l2"
                />
                <polygon
                  id="d5_part3"
                  className="part line"
                  points="50,200 78,170 78,130 50,100"
                  data-name="raiz-izq"
                />
                <polygon
                  id="d5_part4"
                  className="part line"
                  points="150,200 120,170 120,130 150,100"
                  data-name="raiz-der"
                />
                <polygon
                  id="d5_part5"
                  className="part line"
                  points="150,200 120,170 80,170 50,200"
                  data-name="base"
                />
                <polygon
                  id="d5_part6"
                  className="part line"
                  points="50,100 80,130 120,130 150,100"
                  data-name="cingulo"
                />
                <title>Design 5 (1.4)</title>
              </g>

              {/* DESIGN 6 */}
              <g id="design6">
                <polygon
                  id="d6_part1"
                  className="part line"
                  points="80,30 60,100 100,100"
                  data-name="corona-l1"
                />
                <polygon
                  id="d6_part2"
                  className="part line"
                  points="120,30 100,100 140,100"
                  data-name="corona-l2"
                />
                <polygon
                  id="d6_part3"
                  className="part line"
                  points="50,200 78,170 78,130 50,100"
                  data-name="raiz-izq"
                />
                <polygon
                  id="d6_part4"
                  className="part line"
                  points="150,200 120,170 120,130 150,100"
                  data-name="raiz-der"
                />
                <polygon
                  id="d6_part5"
                  className="part line"
                  points="150,200 120,170 80,170 50,200"
                  data-name="base"
                />
                <polygon
                  id="d6_part6"
                  className="part line"
                  points="50,100 80,130 120,130 150,100"
                  data-name="cingulo"
                />
                <rect
                  id="d6_part7"
                  className="part thin"
                  x="78"
                  y="130"
                  width="42"
                  height="20"
                  data-name="fosas"
                />
                <rect
                  id="d6_part8"
                  className="part thin"
                  x="78"
                  y="150"
                  width="42"
                  height="20"
                  data-name="surcos"
                />
                <title>Design 6 (8 partes)</title>
              </g>

              {/* DESIGN 7 */}
              <g id="design7">
                <polygon
                  id="d7_part1"
                  className="part line"
                  points="100,30 50,100 150,100"
                  data-name="corona"
                />
                <polygon
                  id="d7_part2"
                  className="part line"
                  points="50,100 80,150 120,150 150,100"
                  data-name="paredes"
                />
                <polygon
                  id="d7_part3"
                  className="part line"
                  points="150,200 120,150 80,150 50,200"
                  data-name="base"
                />
                <polygon
                  id="d7_part4"
                  className="part line"
                  points="50,100 50,200 80,150"
                  data-name="lado-izq"
                />
                <polygon
                  id="d7_part5"
                  className="part line"
                  points="150,100 150,200 120,150"
                  data-name="lado-der"
                />
                <title>Design 7 (5 partes)</title>
              </g>

              {/* DESIGN 8 */}
              <g id="design8">
                <g transform="rotate(180,100,120)">
                  <polygon
                    id="d8_part1"
                    className="part line"
                    points="100,30 50,100 150,100"
                    data-name="corona"
                  />
                  <polygon
                    id="d8_part2"
                    className="part line"
                    points="50,100 80,150 120,150 150,100"
                    data-name="paredes"
                  />
                  <polygon
                    id="d8_part3"
                    className="part line"
                    points="150,200 120,150 80,150 50,200"
                    data-name="base"
                  />
                  <polygon
                    id="d8_part4"
                    className="part line"
                    points="50,100 50,200 80,150"
                    data-name="lado-izq"
                  />
                  <polygon
                    id="d8_part5"
                    className="part line"
                    points="150,100 150,200 120,150"
                    data-name="lado-der"
                  />
                  <title>Design 8 (5 partes) - girado</title>
                </g>
              </g>
            </defs>

            <foreignObject x="570" y="20" width="600" height="30">
              <div xmlns="http://www.w3.org/1999/xhtml">
                <label
                  htmlFor="odontograma-title"
                  style={{
                    fontSize: '25px',
                    marginRight: '10px',
                    WebkitTextStrokeWidth: '2px',
                  }}
                >
                  Odontograma
                </label>
                <span id="odontograma-title" style={{ display: 'none' }}></span>
              </div>
            </foreignObject>

            {/* FILAS (1..52) */}
            {/* ----------------- FILA 1 (1..16) ----------------- */}

            <g id="fila1" transform="translate(20,110)">
              <g
                id="tooth_1_8"
                className="tooth-group"
                data-name="1.8"
                transform="translate(0,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="55" y="-2" className="tooth-name">
                1.8
              </text>
              <foreignObject x="25" y="-45" width="68" height="30" id="input1">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_1_7"
                className="tooth-group"
                data-name="1.7"
                transform="translate(80,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="135" y="-2" className="tooth-name">
                1.7
              </text>
              <foreignObject x="105" y="-45" width="68" height="30" id="input2">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_1_6"
                className="tooth-group"
                data-name="1.6"
                transform="translate(160,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="215" y="-2" className="tooth-name">
                1.6
              </text>
              <foreignObject x="185" y="-45" width="68" height="30" id="input3">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_1_5"
                className="tooth-group"
                data-name="1.5"
                transform="translate(240,0) scale(0.6)"
              >
                <use xlinkHref="#design3" />
              </g>
              <text x="295" y="-2" className="tooth-name">
                1.5
              </text>
              <foreignObject x="265" y="-45" width="68" height="30" id="input4">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_1_4"
                className="tooth-group"
                data-name="1.4"
                transform="translate(320,0) scale(0.6)"
              >
                <use xlinkHref="#design5" />
              </g>
              <text x="375" y="-2" className="tooth-name">
                1.4
              </text>
              <foreignObject x="345" y="-45" width="68" height="30" id="input5">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_1_3"
                className="tooth-group"
                data-name="1.3"
                transform="translate(400,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="455" y="-2" className="tooth-name">
                1.3
              </text>
              <foreignObject x="430" y="-45" width="60" height="30" id="input6">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_1_2"
                className="tooth-group"
                data-name="1.2"
                transform="translate(480,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="530" y="-2" className="tooth-name">
                1.2
              </text>
              <foreignObject x="506" y="-45" width="60" height="30" id="input7">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_1_1"
                className="tooth-group"
                data-name="1.1"
                transform="translate(560,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="603" y="-2" className="tooth-name">
                1.1
              </text>
              <foreignObject x="583" y="-45" width="60" height="30" id="input8">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_2_1"
                className="tooth-group"
                data-name="2.1"
                transform="translate(640,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="685" y="-2" className="tooth-name">
                2.1
              </text>
              <foreignObject x="660" y="-45" width="60" height="30" id="input9">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_2_2"
                className="tooth-group"
                data-name="2.2"
                transform="translate(720,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="765" y="-3" className="tooth-name">
                2.2
              </text>
              <foreignObject
                x="740"
                y="-45"
                width="60"
                height="30"
                id="input10"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_2_3"
                className="tooth-group"
                data-name="2.3"
                transform="translate(800,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="845" y="-3" className="tooth-name">
                2.3
              </text>
              <foreignObject
                x="820"
                y="-45"
                width="60"
                height="30"
                id="input11"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_2_4"
                className="tooth-group"
                data-name="2.4"
                transform="translate(880,0) scale(0.6)"
              >
                <use xlinkHref="#design6" />
              </g>
              <text x="930" y="-3" className="tooth-name">
                2.4
              </text>
              <foreignObject
                x="900"
                y="-45"
                width="68"
                height="30"
                id="input12"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_2_5"
                className="tooth-group"
                data-name="2.5"
                transform="translate(960,0) scale(0.6)"
              >
                <use xlinkHref="#design3" />
              </g>
              <text x="1015" y="-3" className="tooth-name">
                2.5
              </text>
              <foreignObject
                x="985"
                y="-45"
                width="68"
                height="30"
                id="input13"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_2_6"
                className="tooth-group"
                data-name="2.6"
                transform="translate(1040,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="1090" y="-3" className="tooth-name">
                2.6
              </text>
              <foreignObject
                x="1060"
                y="-45"
                width="68"
                height="30"
                id="input14"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_2_7"
                className="tooth-group"
                data-name="2.7"
                transform="translate(1120,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="1175" y="-3" className="tooth-name">
                2.7
              </text>
              <foreignObject
                x="1145"
                y="-45"
                width="68"
                height="30"
                id="input15"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_2_8"
                className="tooth-group"
                data-name="2.8"
                transform="translate(1200,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="1250" y="-3" className="tooth-name">
                2.8
              </text>
              <foreignObject
                x="1220"
                y="-45"
                width="68"
                height="30"
                id="input16"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>
            </g>

            {/* FILA 2 (17..26) */}
            <g id="fila2" transform="translate(261,320)">
              <g
                id="tooth_5_1"
                className="tooth-group"
                data-name="5.5"
                transform="translate(0,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="55" y="1" className="tooth-name">
                5.5
              </text>
              <foreignObject x="20" y="-45" width="68" height="30" id="input17">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_5_2"
                className="tooth-group"
                data-name="5.4"
                transform="translate(80,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="135" y="1" className="tooth-name">
                5.4
              </text>
              <foreignObject
                x="100"
                y="-45"
                width="68"
                height="30"
                id="input18"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_5_3"
                className="tooth-group"
                data-name="5.3"
                transform="translate(160,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="210" y="1" className="tooth-name">
                5.3
              </text>
              <foreignObject
                x="180"
                y="-45"
                width="60"
                height="30"
                id="input19"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_5_4"
                className="tooth-group"
                data-name="5.2"
                transform="translate(240,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="285" y="1" className="tooth-name">
                5.2
              </text>
              <foreignObject
                x="255"
                y="-45"
                width="60"
                height="30"
                id="input20"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_5_5"
                className="tooth-group"
                data-name="5.1"
                transform="translate(320,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="365" y="1" className="tooth-name">
                5.1
              </text>
              <foreignObject
                x="335"
                y="-45"
                width="60"
                height="30"
                id="input21"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_6_1"
                className="tooth-group"
                data-name="6.1"
                transform="translate(400,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="445" y="1" className="tooth-name">
                6.1
              </text>
              <foreignObject
                x="415"
                y="-45"
                width="60"
                height="30"
                id="input22"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_6_2"
                className="tooth-group"
                data-name="6.2"
                transform="translate(480,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="525" y="1" className="tooth-name">
                6.2
              </text>
              <foreignObject
                x="495"
                y="-45"
                width="60"
                height="30"
                id="input23"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_6_3"
                className="tooth-group"
                data-name="6.3"
                transform="translate(560,0) scale(0.6)"
              >
                <use xlinkHref="#design7" />
              </g>
              <text x="605" y="1" className="tooth-name">
                6.3
              </text>
              <foreignObject
                x="575"
                y="-45"
                width="60"
                height="30"
                id="input24"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_6_4"
                className="tooth-group"
                data-name="6.4"
                transform="translate(640,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="700" y="1" className="tooth-name">
                6.4
              </text>
              <foreignObject
                x="670"
                y="-45"
                width="68"
                height="30"
                id="input25"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_6_5"
                className="tooth-group"
                data-name="6.5"
                transform="translate(720,0) scale(0.6)"
              >
                <use xlinkHref="#design1" />
              </g>
              <text x="780" y="1" className="tooth-name">
                6.5
              </text>
              <foreignObject
                x="750"
                y="-45"
                width="68"
                height="30"
                id="input26"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>
            </g>

            {/* FILA 3 (27..36) */}
            <g id="fila3" transform="translate(261,570)">
              <g
                id="tooth_8_5"
                className="tooth-group"
                data-name="8.5"
                transform="translate(0,-70) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="55" y="50" className="tooth-name">
                8.5
              </text>
              <foreignObject x="25" y="70" width="68" height="30" id="input27">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_8_4"
                className="tooth-group"
                data-name="8.4"
                transform="translate(80,-70) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="140" y="50" className="tooth-name">
                8.4
              </text>
              <foreignObject x="105" y="70" width="68" height="30" id="input28">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_8_3"
                className="tooth-group"
                data-name="8.3"
                transform="translate(160,-95) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="205" y="50" className="tooth-name">
                8.3
              </text>
              <foreignObject x="185" y="70" width="55" height="30" id="input29">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_8_2"
                className="tooth-group"
                data-name="8.2"
                transform="translate(240,-95) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="285" y="50" className="tooth-name">
                8.2
              </text>
              <foreignObject x="260" y="70" width="60" height="30" id="input30">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_8_1"
                className="tooth-group"
                data-name="8.1"
                transform="translate(320,-95) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="365" y="50" className="tooth-name">
                8.1
              </text>
              <foreignObject x="340" y="70" width="60" height="30" id="input31">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_7_1"
                className="tooth-group"
                data-name="7.1"
                transform="translate(400,-95) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="440" y="50" className="tooth-name">
                7.1
              </text>
              <foreignObject x="420" y="70" width="65" height="30" id="input32">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_7_2"
                className="tooth-group"
                data-name="7.2"
                transform="translate(480,-95) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="525" y="50" className="tooth-name">
                7.2
              </text>
              <foreignObject x="500" y="70" width="60" height="30" id="input33">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_7_3"
                className="tooth-group"
                data-name="7.3"
                transform="translate(560,-95) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="605" y="50" className="tooth-name">
                7.3
              </text>
              <foreignObject x="575" y="70" width="65" height="30" id="input34">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_7_4"
                className="tooth-group"
                data-name="7.4"
                transform="translate(640,-70) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="700" y="50" className="tooth-name">
                7.4
              </text>
              <foreignObject x="665" y="70" width="68" height="30" id="input35">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_7_5"
                className="tooth-group"
                data-name="7.5"
                transform="translate(720,-70) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="780" y="50" className="tooth-name">
                7.5
              </text>
              <foreignObject x="750" y="70" width="68" height="30" id="input36">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>
            </g>

            {/* FILA 4 (37..52) */}
            <g id="fila4" transform="translate(20,795)">
              <g
                id="tooth_4_8"
                className="tooth-group"
                data-name="4.8"
                transform="translate(0,-80) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="55" y="50" className="tooth-name">
                4.8
              </text>
              <foreignObject x="30" y="60" width="60" height="30" id="input37">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_4_7"
                className="tooth-group"
                data-name="4.7"
                transform="translate(80,-80) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="135" y="50" className="tooth-name">
                4.7
              </text>
              <foreignObject x="110" y="60" width="60" height="30" id="input38">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_4_6"
                className="tooth-group"
                data-name="4.6"
                transform="translate(160,-80) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="215" y="50" className="tooth-name">
                4.6
              </text>
              <foreignObject x="190" y="60" width="60" height="30" id="input39">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_4_5"
                className="tooth-group"
                data-name="4.5"
                transform="translate(240,-105) scale(0.6)"
              >
                <use xlinkHref="#design4" />
              </g>
              <text x="290" y="50" className="tooth-name">
                4.5
              </text>
              <foreignObject x="265" y="60" width="60" height="30" id="input40">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_4_4"
                className="tooth-group"
                data-name="4.4"
                transform="translate(320,-105) scale(0.6)"
              >
                <use xlinkHref="#design4" />
              </g>
              <text x="375" y="50" className="tooth-name">
                4.4
              </text>
              <foreignObject x="350" y="60" width="60" height="30" id="input41">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_4_3"
                className="tooth-group"
                data-name="4.3"
                transform="translate(400,-105) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="445" y="50" className="tooth-name">
                4.3
              </text>
              <foreignObject x="430" y="60" width="60" height="30" id="input42">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_4_2"
                className="tooth-group"
                data-name="4.2"
                transform="translate(480,-105) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="525" y="50" className="tooth-name">
                4.2
              </text>
              <foreignObject x="505" y="60" width="60" height="30" id="input43">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_4_1"
                className="tooth-group"
                data-name="4.1"
                transform="translate(560,-105) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="605" y="50" className="tooth-name">
                4.1
              </text>
              <foreignObject x="580" y="60" width="60" height="30" id="input44">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_3_1"
                className="tooth-group"
                data-name="3.1"
                transform="translate(640,-105) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="685" y="50" className="tooth-name">
                3.1
              </text>
              <foreignObject x="662" y="60" width="55" height="30" id="input45">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_3_2"
                className="tooth-group"
                data-name="3.2"
                transform="translate(720,-105) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="765" y="50" className="tooth-name">
                3.2
              </text>
              <foreignObject x="740" y="60" width="60" height="30" id="input46">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_3_3"
                className="tooth-group"
                data-name="3.3"
                transform="translate(800,-105) scale(0.6)"
              >
                <use xlinkHref="#design8" />
              </g>
              <text x="845" y="50" className="tooth-name">
                3.3
              </text>
              <foreignObject x="820" y="60" width="60" height="30" id="input47">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_3_4"
                className="tooth-group"
                data-name="3.4"
                transform="translate(880,-105) scale(0.6)"
              >
                <use xlinkHref="#design4" />
              </g>
              <text x="935" y="50" className="tooth-name">
                3.4
              </text>
              <foreignObject x="910" y="60" width="60" height="30" id="input48">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_3_5"
                className="tooth-group"
                data-name="3.5"
                transform="translate(960,-105) scale(0.6)"
              >
                <use xlinkHref="#design4" />
              </g>
              <text x="1010" y="50" className="tooth-name">
                3.5
              </text>
              <foreignObject x="990" y="60" width="60" height="30" id="input49">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_3_6"
                className="tooth-group"
                data-name="3.6"
                transform="translate(1040,-80) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="1095" y="50" className="tooth-name">
                3.6
              </text>
              <foreignObject
                x="1070"
                y="60"
                width="60"
                height="30"
                id="input50"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_3_7"
                className="tooth-group"
                data-name="3.7"
                transform="translate(1120,-80) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="1175" y="50" className="tooth-name">
                3.7
              </text>
              <foreignObject
                x="1150"
                y="60"
                width="60"
                height="30"
                id="input51"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>

              <g
                id="tooth_3_8"
                className="tooth-group"
                data-name="3.8"
                transform="translate(1200,-80) scale(0.6)"
              >
                <use xlinkHref="#design2" />
              </g>
              <text x="1255" y="50" className="tooth-name">
                3.8
              </text>
              <foreignObject
                x="1230"
                y="60"
                width="65"
                height="30"
                id="input52"
              >
                <div xmlns="http://www.w3.org/1999/xhtml">
                  <input type="text" className="letra" />
                </div>
              </foreignObject>
            </g>
            <foreignObject x="50" y="900" width="1270" height="160">
              <div xmlns="http://www.w3.org/1999/xhtml">
                <label
                  htmlFor="inputEspecificaciones"
                  style={{ fontSize: '14px', fontWeight: 'bold' }}
                >
                  Especificaciones:
                </label>

                <textarea
                  id="inputEspecificaciones"
                  className="letra"
                  rows="2"
                  style={{ width: '100%', resize: 'none' }}
                ></textarea>
              </div>
            </foreignObject>
            <foreignObject x="50" y="1000" width="1270" height="60">
              <div xmlns="http://www.w3.org/1999/xhtml">
                <label
                  htmlFor="inputObservaciones"
                  style={{ fontSize: '14px', fontWeight: 'bold' }}
                >
                  Observaciones:
                </label>

                <textarea
                  id="inputObservaciones"
                  className="letra"
                  rows="2"
                  style={{ width: '100%', resize: 'none' }}
                ></textarea>
              </div>
            </foreignObject>
          </svg>
        </div>

        <OdontogramaToolsPanel
          onSaveVersion={saveOdontogramaVersion}
          onLoadVersion={loadHistory}
          selectedTooth={selectedTooth}
          onClearTooth={() => setSelectedTooth(null)}
        />
      </div>

      {/* ── ÍNDICES CPO-D / CEO-D (Bloque 3 — RF-12) ───────────────────────
        Calculados automáticamente desde las entradas estructuradas (hallazgos).
      ─────────────────────────────────────────────────────────────────── */}
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
          Índices de experiencia de caries
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280' }}>
          CPO-D (permanentes) y CEO-D (deciduos) — derivados de los hallazgos
          registrados. Cada diente se cuenta una sola vez.
        </p>

        {indices.sinDatos ? (
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            Aún no hay hallazgos clasificables (Cariado, Perdido/Extraído u
            Obturado) para calcular los índices. Registra intervenciones con un
            hallazgo del catálogo NTS N° 150.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* CPO-D */}
            <div
              style={{
                flex: '1 1 280px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: 8,
                }}
              >
                CPO-D (dentición permanente)
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  ['C', indices.cpod.c, 'Cariados'],
                  ['P', indices.cpod.p, 'Perdidos'],
                  ['O', indices.cpod.o, 'Obturados'],
                ].map(([k, v, label]) => (
                  <div
                    key={k}
                    title={label}
                    style={{
                      flex: 1,
                      minWidth: 60,
                      textAlign: 'center',
                      background: '#f9fafb',
                      borderRadius: 6,
                      padding: '8px 4px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b7280',
                        fontWeight: 600,
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
                <div
                  style={{
                    flex: 1,
                    minWidth: 60,
                    textAlign: 'center',
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 6,
                    padding: '8px 4px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600 }}>CPO-D</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {indices.cpod.total}
                  </div>
                </div>
              </div>
            </div>

            {/* CEO-D */}
            <div
              style={{
                flex: '1 1 280px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: 8,
                }}
              >
                CEO-D (dentición decidua)
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  ['c', indices.ceod.c, 'Cariados'],
                  ['e', indices.ceod.e, 'Extraídos'],
                  ['o', indices.ceod.o, 'Obturados'],
                ].map(([k, v, label]) => (
                  <div
                    key={k}
                    title={label}
                    style={{
                      flex: 1,
                      minWidth: 60,
                      textAlign: 'center',
                      background: '#f9fafb',
                      borderRadius: 6,
                      padding: '8px 4px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#6b7280',
                        fontWeight: 600,
                      }}
                    >
                      {k}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
                <div
                  style={{
                    flex: 1,
                    minWidth: 60,
                    textAlign: 'center',
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 6,
                    padding: '8px 4px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600 }}>CEO-D</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {indices.ceod.total}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── IHO-S (Bloque 4) ──────────────────────────────────────────────── */}
      <IhoSPanel patientId={patientId} />

      {/* ── EPB / PSR (Bloque 5) ──────────────────────────────────────────── */}
      <EpbPanel patientId={patientId} />

      {/* Registro de intervenciones estructuradas (RF-06) — extraído (Track D) */}
      <OdontogramaRegistros
        patientId={patientId}
        tipo={tipoOdontograma}
        selectedTooth={selectedTooth}
      />
    </>
  );
}
