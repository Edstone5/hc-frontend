const API_URL = import.meta.env.VITE_API_URL;

// ── Búsqueda de historias clínicas ──────────────────────────────────────────
export const fetchBusquedaHC = async ({ q = '', year = '' } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (year) params.set('year', year);
  const response = await fetch(`${API_URL}/hc/search?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Error en la búsqueda');
  return response.json();
};

// ── Estado de usuario (habilitar / deshabilitar) ────────────────────────────
export const patchUserStatus = async ({ id, activo }) => {
  const response = await fetch(`${API_URL}/users/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo }),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Error al actualizar estado del usuario');
  return response.json();
};

// ── Pagos por historia clínica ──────────────────────────────────────────────
export const fetchPagosHC = async (idHistoria) => {
  const response = await fetch(`${API_URL}/hc/${idHistoria}/pago`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Error al obtener pagos');
  return response.json();
};

export const registrarPagoHC = async ({ idHistoria, monto = 2.0 }) => {
  const response = await fetch(`${API_URL}/hc/${idHistoria}/pago`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monto }),
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Error al registrar pago');
  return response.json();
};

// ── Auditoría / historial de versiones ─────────────────────────────────────
export const fetchAuditoriaHC = async (idHistoria) => {
  const response = await fetch(`${API_URL}/hc/${idHistoria}/auditoria`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Error al obtener auditoría');
  return response.json();
};
