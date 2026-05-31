/**
 * Interceptor global de refresco de sesión (ADR-0019).
 *
 * El access token (cookie httpOnly) expira a los 15 min. Antes, cualquier
 * petición autenticada posterior fallaba con 401 "Invalid token" hasta volver
 * a iniciar sesión (afectaba guardar odontograma, Diagnóstico en clínicas, etc.).
 *
 * Este módulo envuelve `window.fetch` UNA sola vez: ante un 401 de nuestra API,
 * llama a `POST /users/refresh` (que usa el refresh token de 7 días para reemitir
 * el access token) y reintenta la petición original una vez. Si el refresh falla
 * (refresh token también expirado/ausente), se devuelve el 401 original y el
 * usuario deberá iniciar sesión de nuevo.
 *
 * Se eligió un wrapper global en lugar de modificar cada servicio porque hay
 * decenas de llamadas `fetch` directas; el wrapper las cubre todas sin tocarlas.
 */

const API = import.meta.env.VITE_API_URL;

let installed = false;
// Promesa compartida del refresh en curso: evita N refrescos simultáneos cuando
// varias peticiones reciben 401 a la vez (las agrupa en una sola renovación).
let refreshing = null;

export function installAuthRefresh() {
  if (installed || typeof window === 'undefined' || !window.fetch) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url =
      typeof input === 'string' ? input : input && input.url ? input.url : '';

    const esApi = API && url.startsWith(API);
    const esAuthEndpoint =
      url.includes('/users/refresh') ||
      url.includes('/users/login') ||
      url.includes('/users/logout');

    const res = await originalFetch(input, init);

    // Solo intervenimos en 401 de nuestra API, no en endpoints de auth, y solo
    // una vez por petición (init.__retried evita bucles).
    if (res.status !== 401 || !esApi || esAuthEndpoint || init.__retried) {
      return res;
    }

    try {
      if (!refreshing) {
        refreshing = originalFetch(`${API}/users/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
      }
      const refreshRes = await refreshing;
      refreshing = null;

      // Si el refresh falló, devolvemos el 401 original (sesión realmente caída).
      if (!refreshRes.ok) return res;

      // Reintentar la petición original una sola vez con el token renovado.
      return originalFetch(input, {
        ...init,
        credentials: 'include',
        __retried: true,
      });
    } catch {
      refreshing = null;
      return res;
    }
  };
}
