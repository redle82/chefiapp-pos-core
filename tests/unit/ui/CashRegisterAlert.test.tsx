/**
 * CashRegisterAlert Tests
 * Componente atual é stub. Testes verificam que renderiza sem erro.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CashRegisterAlert } from '../../../merchant-portal/src/pages/TPV/components/CashRegisterAlert';

const defaultProps = {
  isOpen: true,
  onOpenCash: () => {},
};

describe('CashRegisterAlert', () => {
  it('deve renderizar sem lançar erro', () => {
    const { container } = render(<CashRegisterAlert {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('deve exibir o conteúdo do stub', () => {
    render(<CashRegisterAlert {...defaultProps} />);
    expect(screen.getByText('CashRegisterAlert')).toBeInTheDocument();
  });
});
