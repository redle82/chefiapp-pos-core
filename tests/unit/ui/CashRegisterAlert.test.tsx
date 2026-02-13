/**
 * CashRegisterAlert Tests
 * Componente atual é stub. Testes verificam que renderiza sem erro.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CashRegisterAlert } from '../../../merchant-portal/src/pages/TPV/components/CashRegisterAlert';

describe('CashRegisterAlert', () => {
  it('deve renderizar sem lançar erro', () => {
    const { container } = render(<CashRegisterAlert />);
    expect(container).toBeInTheDocument();
  });

  it('deve exibir o conteúdo do stub', () => {
    render(<CashRegisterAlert />);
    expect(screen.getByText('CashRegisterAlert')).toBeInTheDocument();
  });
});
