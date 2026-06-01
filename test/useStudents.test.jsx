import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStudents } from '../src/hooks/useStudents';

vi.mock('../src/services/fetchStudents', () => ({
  fetchStudents: vi.fn(() => Promise.resolve([{ id: 'stu1' }, { id: 'stu2' }])),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useStudents hook', () => {
  it('returns array of students', async () => {
    const { result } = renderHook(() => useStudents(), { wrapper });
    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 'stu1' }, { id: 'stu2' }]);
    });
  });
});
