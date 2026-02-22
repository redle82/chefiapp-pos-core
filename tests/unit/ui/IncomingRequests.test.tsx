/**
 * IncomingRequests Tests
 * Componente atual é stub. Testes verificam que renderiza sem erro.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { IncomingRequests } from '../../../merchant-portal/src/pages/TPV/components/IncomingRequests';

const defaultProps = {
  restaurantId: 'rest-1',
  onOrderAccepted: () => {},
};

describe('IncomingRequests', () => {
  it('deve renderizar sem lançar erro', () => {
    const { container } = render(<IncomingRequests {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('deve exibir o conteúdo do stub', () => {
    render(<IncomingRequests {...defaultProps} />);
    expect(screen.getByText('IncomingRequests')).toBeInTheDocument();
  });
});
