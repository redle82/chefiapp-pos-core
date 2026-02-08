/**
 * Mock PostgresLink para testes jsdom (módulo gate3-persistence removido).
 */
export const PostgresLink = {
  getInstance: jest.fn(() => ({
    getPool: jest.fn(() => ({ query: jest.fn() })),
    query: jest.fn(),
  })),
};
