/**
 * Servicios fetch para módulos clínicos: odontograma, prescripciones,
 * adjuntos, fichas de operación, fichas de evaluación, citas.
 */
const API = import.meta.env.VITE_API_URL;
const opts = { credentials: 'include' };

async function handleResponse(r) {
  if (!r.ok) {
    const body = await r.json().catch(() => null);
    throw new Error(body?.error || `Error ${r.status}`);
  }
  return r.json();
}

// ── ODONTOGRAMA ──────────────────────────────────────────────────────────────
export const fetchOdontograma = (id) =>
  fetch(`${API}/hc/${id}/odontograma`, opts).then(handleResponse);

export const addOdontogramaEntrada = ({ idHistory, data }) =>
  fetch(`${API}/hc/${idHistory}/odontograma`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const deleteOdontogramaEntrada = ({ idHistory, idEntrada }) =>
  fetch(`${API}/hc/${idHistory}/odontograma/${idEntrada}`, {
    method: 'DELETE',
    ...opts,
  }).then(handleResponse);

// SVG serializado (enfoque híbrido RF-06). `tipo` = INICIAL | EVOLUCION
export const fetchOdontogramaSvg = ({ idHistory, tipo } = {}) => {
  const p = new URLSearchParams();
  if (tipo) p.set('tipo', tipo);
  return fetch(`${API}/hc/${idHistory}/odontograma/svg?${p}`, opts).then(
    handleResponse
  );
};

export const addOdontogramaSvg = ({ idHistory, data }) =>
  fetch(`${API}/hc/${idHistory}/odontograma/svg`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

// ── IHO-S (Índice de Higiene Oral Simplificado) ───────────────────────────────
export const fetchIhoS = (idHistory) =>
  fetch(`${API}/hc/${idHistory}/iho-s`, opts).then(handleResponse);

export const saveIhoS = ({ idHistory, data }) =>
  fetch(`${API}/hc/${idHistory}/iho-s`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

// ── EPB (Examen Periodontal Básico / PSR) ─────────────────────────────────────
export const fetchEpb = (idHistory) =>
  fetch(`${API}/hc/${idHistory}/epb`, opts).then(handleResponse);

export const saveEpb = ({ idHistory, data }) =>
  fetch(`${API}/hc/${idHistory}/epb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

// ── PRESCRIPCIONES ───────────────────────────────────────────────────────────
export const fetchPrescripciones = (id) =>
  fetch(`${API}/hc/${id}/prescripciones`, opts).then(handleResponse);

export const addPrescripcion = ({ idHistory, data }) =>
  fetch(`${API}/hc/${idHistory}/prescripciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const deletePrescripcion = ({ idHistory, idPrescripcion }) =>
  fetch(`${API}/hc/${idHistory}/prescripciones/${idPrescripcion}`, {
    method: 'DELETE',
    ...opts,
  }).then(handleResponse);

// ── ADJUNTOS ─────────────────────────────────────────────────────────────────
export const fetchAdjuntos = (id) =>
  fetch(`${API}/hc/${id}/adjuntos`, opts).then(handleResponse);

export const subirAdjunto = ({ idHistory, formData }) =>
  fetch(`${API}/hc/${idHistory}/adjuntos`, {
    method: 'POST',
    body: formData,
    ...opts,
  }).then(handleResponse);

export const deleteAdjunto = ({ idHistory, idAdjunto }) =>
  fetch(`${API}/hc/${idHistory}/adjuntos/${idAdjunto}`, {
    method: 'DELETE',
    ...opts,
  }).then(handleResponse);

// ── FICHAS DE OPERACIÓN ───────────────────────────────────────────────────────
export const fetchFichasOperacion = (id) =>
  fetch(`${API}/hc/${id}/fichas-operacion`, opts).then(handleResponse);

export const fetchFichaOperacion = ({ idHistory, idFicha }) =>
  fetch(`${API}/hc/${idHistory}/fichas-operacion/${idFicha}`, opts).then(
    handleResponse
  );

export const addFichaOperacion = ({ idHistory, data }) =>
  fetch(`${API}/hc/${idHistory}/fichas-operacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const updateFichaOperacion = ({ idHistory, idFicha, data }) =>
  fetch(`${API}/hc/${idHistory}/fichas-operacion/${idFicha}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const deleteFichaOperacion = ({ idHistory, idFicha }) =>
  fetch(`${API}/hc/${idHistory}/fichas-operacion/${idFicha}`, {
    method: 'DELETE',
    ...opts,
  }).then(handleResponse);

// ── FICHAS DE EVALUACIÓN ──────────────────────────────────────────────────────
export const fetchFichaEvaluacion = ({ idHistory, idFicha }) =>
  fetch(
    `${API}/hc/${idHistory}/fichas-operacion/${idFicha}/evaluacion`,
    opts
  ).then(handleResponse);

export const evaluarFicha = ({ idHistory, idFicha, data }) =>
  fetch(`${API}/hc/${idHistory}/fichas-operacion/${idFicha}/evaluacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const fetchEvaluacionesDocente = () =>
  fetch(`${API}/hc/docente/evaluaciones`, opts).then(handleResponse);

// ── CITAS ────────────────────────────────────────────────────────────────────
export const fetchCitas = (id) =>
  fetch(`${API}/hc/${id}/citas`, opts).then(handleResponse);

export const addCita = ({ idHistory, data }) =>
  fetch(`${API}/hc/${idHistory}/citas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const updateCitaEstado = ({ idHistory, idCita, estado }) =>
  fetch(`${API}/hc/${idHistory}/citas/${idCita}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
    ...opts,
  }).then(handleResponse);

export const deleteCita = ({ idHistory, idCita }) =>
  fetch(`${API}/hc/${idHistory}/citas/${idCita}`, {
    method: 'DELETE',
    ...opts,
  }).then(handleResponse);

export const fetchMisCitas = ({ desde, hasta } = {}) => {
  const p = new URLSearchParams();
  if (desde) p.set('desde', desde);
  if (hasta) p.set('hasta', hasta);
  return fetch(`${API}/hc/mis-citas?${p}`, opts).then(handleResponse);
};

// ── AUDITORÍA / HISTORIAL ────────────────────────────────────────────────────
export const fetchAuditoriaHC = (id) =>
  fetch(`${API}/hc/${id}/auditoria`, opts).then(handleResponse);

// ── TRANSFERENCIA ────────────────────────────────────────────────────────────
export const transferirHC = ({ idHistory, idNuevoEstudiante, razon }) =>
  fetch(`${API}/hc/${idHistory}/transferir`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idNuevoEstudiante, razon }),
    ...opts,
  }).then(handleResponse);

// ── NOTIFICACIONES ────────────────────────────────────────────────────────────
export const fetchNotificaciones = () =>
  fetch(`${API}/notificaciones`, opts).then(handleResponse);

export const fetchNoLeidas = () =>
  fetch(`${API}/notificaciones/no-leidas`, opts).then(handleResponse);

export const marcarLeidaNotif = (idNotif) =>
  fetch(`${API}/notificaciones/${idNotif}/leer`, {
    method: 'PATCH',
    ...opts,
  }).then(handleResponse);

export const marcarTodasLeidas = () =>
  fetch(`${API}/notificaciones/leer-todas`, { method: 'PATCH', ...opts }).then(
    handleResponse
  );

// ── REPORTES ─────────────────────────────────────────────────────────────────
export const fetchReporteAdmin = ({ desde, hasta, idEstudiante } = {}) => {
  const p = new URLSearchParams();
  if (desde) p.set('desde', desde);
  if (hasta) p.set('hasta', hasta);
  if (idEstudiante) p.set('idEstudiante', idEstudiante);
  return fetch(`${API}/reportes/admin?${p}`, opts).then(handleResponse);
};

export const fetchReporteDocente = () =>
  fetch(`${API}/reportes/docente`, opts).then(handleResponse);

export const fetchReporteAnonimo = ({ desde, hasta } = {}) => {
  const p = new URLSearchParams();
  if (desde) p.set('desde', desde);
  if (hasta) p.set('hasta', hasta);
  return fetch(`${API}/reportes/anonimo?${p}`, opts).then(handleResponse);
};

// ── EQUIPOS ───────────────────────────────────────────────────────────────────
export const fetchEquipos = () =>
  fetch(`${API}/equipos`, opts).then(handleResponse);

export const addEquipo = (data) =>
  fetch(`${API}/equipos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const updateEquipo = ({ id, data }) =>
  fetch(`${API}/equipos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const fetchPrestamos = ({ estado } = {}) => {
  const p = new URLSearchParams();
  if (estado) p.set('estado', estado);
  return fetch(`${API}/equipos/prestamos?${p}`, opts).then(handleResponse);
};

export const registrarPrestamo = (data) =>
  fetch(`${API}/equipos/prestamos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const registrarDevolucion = (id) =>
  fetch(`${API}/equipos/prestamos/${id}/devolver`, {
    method: 'PATCH',
    ...opts,
  }).then(handleResponse);

// ── CONSENTIMIENTO INFORMADO (RF-09) ─────────────────────────────────────────
export const fetchConsentimientos = (idHistoria) =>
  fetch(`${API}/hc/${idHistoria}/consentimiento`, opts).then(handleResponse);

export const addConsentimiento = ({ idHistory, data }) =>
  fetch(`${API}/hc/${idHistory}/consentimiento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    ...opts,
  }).then(handleResponse);

export const deleteConsentimiento = ({ idHistory, idConsentimiento }) =>
  fetch(`${API}/hc/${idHistory}/consentimiento/${idConsentimiento}`, {
    method: 'DELETE',
    ...opts,
  }).then(handleResponse);
