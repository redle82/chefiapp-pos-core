/**
 * OpenCashRegisterModal Tests
 * Componente atual é stub (retorna null). Testes verificam que renderiza sem erro.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { OpenCashRegisterModal } from '../../../merchant-portal/src/pages/TPV/components/OpenCashRegisterModal';

describe('OpenCashRegisterModal', () => {
  it('deve renderizar sem lançar erro', () => {
    const { container } = render(<OpenCashRegisterModal />);
    expect(container).toBeInTheDocument();
  });
});
