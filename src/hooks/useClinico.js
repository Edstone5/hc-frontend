/**
 * Hooks React Query para todos los módulos clínicos nuevos.
 * Patrón unificado: useQuery para lectura, useMutation para escritura.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConsentimientos,
  addConsentimiento,
  deleteConsentimiento,
  fetchOdontograma,
  addOdontogramaEntrada,
  deleteOdontogramaEntrada,
  fetchOdontogramaSvg,
  addOdontogramaSvg,
  fetchIhoS,
  saveIhoS,
  fetchEpb,
  saveEpb,
  fetchPrescripciones,
  addPrescripcion,
  deletePrescripcion,
  fetchAdjuntos,
  subirAdjunto,
  deleteAdjunto,
  fetchFichasOperacion,
  fetchFichaOperacion,
  addFichaOperacion,
  updateFichaOperacion,
  deleteFichaOperacion,
  fetchFichaEvaluacion,
  evaluarFicha,
  fetchEvaluacionesDocente,
  fetchCitas,
  addCita,
  updateCitaEstado,
  deleteCita,
  fetchMisCitas,
  fetchAuditoriaHC,
  fetchNotificaciones,
  fetchNoLeidas,
  marcarLeidaNotif,
  marcarTodasLeidas,
  fetchReporteAdmin,
  fetchReporteDocente,
  fetchReporteAnonimo,
  fetchEquipos,
  addEquipo,
  updateEquipo,
  fetchPrestamos,
  registrarPrestamo,
  registrarDevolucion,
} from '@services/fetchClinico.js';

// ── Consentimiento Informado (RF-09) ─────────────────────────────────────────
export const useConsentimientos = (id) =>
  useQuery({
    queryKey: ['consentimientos', id],
    queryFn: () => fetchConsentimientos(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useAddConsentimiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addConsentimiento,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['consentimientos', v.idHistory] }),
  });
};
export const useDeleteConsentimiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteConsentimiento,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['consentimientos', v.idHistory] }),
  });
};

// ── Odontograma ──────────────────────────────────────────────────────────────
export const useOdontograma = (id) =>
  useQuery({
    queryKey: ['odontograma', id],
    queryFn: () => fetchOdontograma(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useAddOdontogramaEntrada = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addOdontogramaEntrada,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['odontograma', v.idHistory] }),
  });
};
export const useDeleteOdontogramaEntrada = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOdontogramaEntrada,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['odontograma', v.idHistory] }),
  });
};

// SVG serializado (enfoque híbrido RF-06)
export const useOdontogramaSvg = (id, tipo) =>
  useQuery({
    queryKey: ['odontograma-svg', id, tipo ?? 'ALL'],
    queryFn: () => fetchOdontogramaSvg({ idHistory: id, tipo }),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useAddOdontogramaSvg = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addOdontogramaSvg,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['odontograma-svg', v.idHistory] }),
  });
};

// ── IHO-S (Índice de Higiene Oral Simplificado) ───────────────────────────────
export const useIhoS = (id) =>
  useQuery({
    queryKey: ['iho-s', id],
    queryFn: () => fetchIhoS(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useSaveIhoS = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveIhoS,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['iho-s', v.idHistory] }),
  });
};

// ── EPB (Examen Periodontal Básico / PSR) ─────────────────────────────────────
export const useEpb = (id) =>
  useQuery({
    queryKey: ['epb', id],
    queryFn: () => fetchEpb(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useSaveEpb = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveEpb,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['epb', v.idHistory] }),
  });
};

// ── Prescripciones ───────────────────────────────────────────────────────────
export const usePrescripciones = (id) =>
  useQuery({
    queryKey: ['prescripciones', id],
    queryFn: () => fetchPrescripciones(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useAddPrescripcion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addPrescripcion,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['prescripciones', v.idHistory] }),
  });
};
export const useDeletePrescripcion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePrescripcion,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['prescripciones', v.idHistory] }),
  });
};

// ── Adjuntos ─────────────────────────────────────────────────────────────────
export const useAdjuntos = (id) =>
  useQuery({
    queryKey: ['adjuntos', id],
    queryFn: () => fetchAdjuntos(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useSubirAdjunto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: subirAdjunto,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['adjuntos', v.idHistory] }),
  });
};
export const useDeleteAdjunto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdjunto,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['adjuntos', v.idHistory] }),
  });
};

// ── Fichas de Operación ───────────────────────────────────────────────────────
export const useFichasOperacion = (id) =>
  useQuery({
    queryKey: ['fichas-operacion', id],
    queryFn: () => fetchFichasOperacion(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useFichaOperacion = (idHistory, idFicha) =>
  useQuery({
    queryKey: ['ficha-operacion', idFicha],
    queryFn: () => fetchFichaOperacion({ idHistory, idFicha }),
    enabled: !!(idHistory && idFicha),
    refetchOnWindowFocus: false,
  });
export const useAddFichaOperacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addFichaOperacion,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['fichas-operacion', v.idHistory] }),
  });
};
export const useUpdateFichaOperacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateFichaOperacion,
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['fichas-operacion', v.idHistory] });
      qc.invalidateQueries({ queryKey: ['ficha-operacion', v.idFicha] });
    },
  });
};
export const useDeleteFichaOperacion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFichaOperacion,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['fichas-operacion', v.idHistory] }),
  });
};

// ── Fichas de Evaluación ──────────────────────────────────────────────────────
export const useFichaEvaluacion = (idHistory, idFicha) =>
  useQuery({
    queryKey: ['ficha-evaluacion', idFicha],
    queryFn: () => fetchFichaEvaluacion({ idHistory, idFicha }),
    enabled: !!(idHistory && idFicha),
    refetchOnWindowFocus: false,
  });
export const useEvaluarFicha = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: evaluarFicha,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['ficha-evaluacion', v.idFicha] }),
  });
};
export const useEvaluacionesDocente = () =>
  useQuery({
    queryKey: ['evaluaciones-docente'],
    queryFn: fetchEvaluacionesDocente,
    refetchOnWindowFocus: false,
  });

// ── Citas ────────────────────────────────────────────────────────────────────
export const useCitas = (id) =>
  useQuery({
    queryKey: ['citas', id],
    queryFn: () => fetchCitas(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
export const useMisCitas = (params) =>
  useQuery({
    queryKey: ['mis-citas', params],
    queryFn: () => fetchMisCitas(params),
    refetchOnWindowFocus: false,
  });
export const useAddCita = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addCita,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['citas', v.idHistory] }),
  });
};
export const useUpdateCitaEstado = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCitaEstado,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['citas', v.idHistory] }),
  });
};
export const useDeleteCita = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCita,
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ['citas', v.idHistory] }),
  });
};

// ── Auditoría / Historial ─────────────────────────────────────────────────────
export const useAuditoriaHC = (id) =>
  useQuery({
    queryKey: ['auditoria-hc', id],
    queryFn: () => fetchAuditoriaHC(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

// ── Notificaciones ────────────────────────────────────────────────────────────
export const useNotificaciones = () =>
  useQuery({
    queryKey: ['notificaciones'],
    queryFn: fetchNotificaciones,
    refetchInterval: 30000,
  });
export const useNoLeidas = () =>
  useQuery({
    queryKey: ['notif-no-leidas'],
    queryFn: fetchNoLeidas,
    refetchInterval: 30000,
  });
export const useMarcarLeida = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marcarLeidaNotif,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificaciones'] });
      qc.invalidateQueries({ queryKey: ['notif-no-leidas'] });
    },
  });
};
export const useMarcarTodasLeidas = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marcarTodasLeidas,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificaciones'] });
      qc.invalidateQueries({ queryKey: ['notif-no-leidas'] });
    },
  });
};

// ── Reportes ─────────────────────────────────────────────────────────────────
export const useReporteAdmin = (params) =>
  useQuery({
    queryKey: ['reporte-admin', params],
    queryFn: () => fetchReporteAdmin(params),
    refetchOnWindowFocus: false,
  });
export const useReporteDocente = () =>
  useQuery({
    queryKey: ['reporte-docente'],
    queryFn: fetchReporteDocente,
    refetchOnWindowFocus: false,
  });
export const useReporteAnonimo = (params) =>
  useQuery({
    queryKey: ['reporte-anonimo', params],
    queryFn: () => fetchReporteAnonimo(params),
    enabled: false,
    refetchOnWindowFocus: false,
  });

// ── Equipos ───────────────────────────────────────────────────────────────────
export const useEquipos = () =>
  useQuery({
    queryKey: ['equipos'],
    queryFn: fetchEquipos,
    refetchOnWindowFocus: false,
  });
export const useAddEquipo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addEquipo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipos'] }),
  });
};
export const useUpdateEquipo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateEquipo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipos'] }),
  });
};
export const usePrestamos = (params) =>
  useQuery({
    queryKey: ['prestamos', params],
    queryFn: () => fetchPrestamos(params),
    refetchOnWindowFocus: false,
  });
export const useRegistrarPrestamo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registrarPrestamo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prestamos'] });
      qc.invalidateQueries({ queryKey: ['equipos'] });
    },
  });
};
export const useRegistrarDevolucion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: registrarDevolucion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prestamos'] });
      qc.invalidateQueries({ queryKey: ['equipos'] });
    },
  });
};
