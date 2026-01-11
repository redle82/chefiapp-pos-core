/**
 * anonymization.test.ts — Testes de Anonymização de Nomes
 */

import { anonymizeText } from '../analyze-sentiment';

describe('anonymizeText', () => {
  it('should replace staff names in common patterns', () => {
    const text = 'O garçom João foi muito atencioso.';
    const result = anonymizeText(text);
    expect(result).toContain('[EQUIPE]');
    expect(result).not.toContain('João');
  });

  it('should handle "o/a [nome]" patterns', () => {
    const text = 'A Maria nos atendeu muito bem.';
    const result = anonymizeText(text);
    expect(result).toContain('[EQUIPE]');
    expect(result).not.toContain('Maria');
  });

  it('should handle multiple names', () => {
    const text = 'O João e a Maria foram excelentes.';
    const result = anonymizeText(text);
    expect(result).toContain('[EQUIPE]');
    expect(result.split('[EQUIPE]').length).toBeGreaterThan(2);
  });

  it('should not replace non-name words', () => {
    const text = 'O restaurante foi excelente.';
    const result = anonymizeText(text);
    expect(result).toBe(text); // No changes
  });

  it('should handle edge cases', () => {
    const text = 'João foi muito bom.';
    const result = anonymizeText(text);
    expect(result).toContain('[EQUIPE]');
  });
});

