import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as fetchHistoria from '../src/services/fetchHistoria';
import {
  useAssignPatient,
  usePatientByHistory,
  useCreateHistoriaClinica,
  useRegisterHc,
} from '../src/hooks/useHistoria';

vi.mock('../src/services/fetchHistoria', () => ({
  fetchAssignPatient: vi.fn(() => Promise.resolve({ success: true })),
  fetchPatientByHistory: vi.fn(() => Promise.resolve({ nombre: 'Paciente' })),
  registerHc: vi.fn(() => Promise.resolve({ id: 'hc123' })),
}));

// Los hooks notifican el éxito con react-hot-toast (no window.alert).
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const queryClient = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useHistoria hooks', () => {
  it('useAssignPatient mutation works', async () => {
    const { result } = renderHook(() => useAssignPatient(), { wrapper });
    await result.current.mutateAsync({ idHistory: 'hc123', patientId: 'p1' });
    expect(fetchHistoria.fetchAssignPatient).toHaveBeenCalled();
  });

  it('usePatientByHistory returns data', async () => {
    const { result } = renderHook(() => usePatientByHistory('hc123'), {
      wrapper,
    });
    await waitFor(() => {
      expect(result.current.data).toEqual({ nombre: 'Paciente' });
    });
  });

  it('useCreateHistoriaClinica mutation works', async () => {
    const { result } = renderHook(() => useCreateHistoriaClinica(), {
      wrapper,
    });
    await result.current.mutateAsync('stu1');
    expect(fetchHistoria.registerHc).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Historia Clínica creada con éxito'
      );
    });
  });

  it('useRegisterHc mutation works', async () => {
    const { result } = renderHook(() => useRegisterHc(), { wrapper });
    await result.current.mutateAsync('stu1');
    expect(fetchHistoria.registerHc).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Historia Clínica registrada con éxito'
      );
    });
  });
});
