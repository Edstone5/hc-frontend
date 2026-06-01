import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fetchPatient from '../src/services/fetchPatient';
import {
  useAdultPatients,
  useCreatePatient,
  useUpdatePatient,
} from '../src/hooks/usePatients';

vi.mock('../src/services/fetchPatients.js', () => ({
  fetchAdultPatients: vi.fn(() =>
    Promise.resolve([{ id: 'p1' }, { id: 'p2' }])
  ),
}));
vi.mock('../src/services/fetchPatient', () => ({
  fetchCreatePatient: vi.fn(() => Promise.resolve({ id: 'p3' })),
  fetchUpdatePatient: vi.fn(() => Promise.resolve({ id: 'p3', updated: true })),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('usePatients hooks', () => {
  it('useAdultPatients returns array', async () => {
    const { result } = renderHook(() => useAdultPatients('stu1'), { wrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 'p1' }, { id: 'p2' }]);
    });
  });

  it('useCreatePatient mutation works', async () => {
    const { result } = renderHook(() => useCreatePatient(), { wrapper });
    await result.current.mutateAsync({ nombre: 'Nuevo' });
    expect(fetchPatient.fetchCreatePatient).toHaveBeenCalled();
  });

  it('useUpdatePatient mutation works', async () => {
    const { result } = renderHook(() => useUpdatePatient(), { wrapper });
    await result.current.mutateAsync({ id: 'p3', nombre: 'Actualizado' });
    expect(fetchPatient.fetchUpdatePatient).toHaveBeenCalled();
  });
});
