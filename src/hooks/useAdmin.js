import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBusquedaHC,
  patchUserStatus,
  fetchPagosHC,
  registrarPagoHC,
} from '@services/fetchAdmin.js';

export const useBusquedaHC = ({ q, year } = {}) => {
  return useQuery({
    queryKey: ['busqueda-hc', q, year],
    queryFn: () => fetchBusquedaHC({ q, year }),
    enabled: !!(q || year),
    refetchOnWindowFocus: false,
  });
};

export const usePatchUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const usePagosHC = (idHistoria) => {
  return useQuery({
    queryKey: ['pagos-hc', idHistoria],
    queryFn: () => fetchPagosHC(idHistoria),
    enabled: !!idHistoria,
    refetchOnWindowFocus: false,
  });
};

export const useRegistrarPago = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registrarPagoHC,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['pagos-hc', vars.idHistoria],
      });
    },
  });
};
