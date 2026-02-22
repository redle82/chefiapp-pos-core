/**
 * FiscalConfigAlert Tests — alinhado à API atual (componente stub).
 *
 * Testa: renderização do componente (sem props; UI fiscal adiada).
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FiscalConfigAlert } from '../../../merchant-portal/src/pages/TPV/components/FiscalConfigAlert';

const defaultProps = { restaurantId: 'rest-1' as string | null };

describe('FiscalConfigAlert', () => {
  it('deve renderizar o componente (stub)', () => {
    const { container } = render(<FiscalConfigAlert {...defaultProps} />);

    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('FiscalConfigAlert')).toBeInTheDocument();
  });

  it('deve ter classe hidden', () => {
    const { container } = render(<FiscalConfigAlert {...defaultProps} />);

    const el = container.querySelector('.hidden');
    expect(el).toBeInTheDocument();
  });
});
