import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OdontogramaToolsPanel from '../src/pages/hc/ExamenFisico/odotools.jsx';

// El panel importa react-hot-toast y el hook de utilidades SVG; en jsdom no hay
// SVG montado, pero el render del panel no lo requiere (los helpers solo se
// invocan al hacer clic). Mockeamos toast para evitar efectos colaterales.
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

describe('OdontogramaToolsPanel (render UI con jsdom)', () => {
  it('renderiza las 6 secciones clínicas del panel', () => {
    render(<OdontogramaToolsPanel />);
    expect(screen.getByText(/1 · Ortodoncia/i)).toBeTruthy();
    expect(screen.getByText(/2 · Coronas/i)).toBeTruthy();
    expect(screen.getByText(/3 · Estado dental/i)).toBeTruthy();
    expect(screen.getByText(/4 · Anomalías morfológicas/i)).toBeTruthy();
    expect(screen.getByText(/5 · Posición dental/i)).toBeTruthy();
    expect(screen.getByText(/6 · Prótesis/i)).toBeTruthy();
  });

  it('expone los botones de Fusión y Germinación (anomalías morfológicas)', () => {
    render(<OdontogramaToolsPanel />);
    expect(screen.getAllByText(/9\.\s*Fusión/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10\.\s*Germinación/i).length).toBeGreaterThan(
      0
    );
  });

  it('muestra el banner de diente seleccionado cuando se pasa selectedTooth', () => {
    render(<OdontogramaToolsPanel selectedTooth="1.6" />);
    expect(screen.getByText(/Diente seleccionado/i)).toBeTruthy();
  });
});
