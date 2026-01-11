/**
 * topic-aggregation.test.ts — Testes de Agregação por Tópico
 */

import {
  analyzeSentimentByTopic,
  analyzePriceSentiment,
  Topic,
} from '../analyze-sentiment';

describe('analyzeSentimentByTopic', () => {
  it('should detect service topic with positive sentiment', () => {
    const text = 'Excelente atendimento! Muito atencioso e prestativo.';
    const result = analyzeSentimentByTopic(text);
    
    expect(result.has('service')).toBe(true);
    const serviceData = result.get('service');
    expect(serviceData?.score).toBeGreaterThan(0);
    expect(serviceData?.mentions).toBeGreaterThan(0);
  });

  it('should detect service topic with negative sentiment', () => {
    const text = 'Atendimento ruim. Mal educado e lento.';
    const result = analyzeSentimentByTopic(text);
    
    expect(result.has('service')).toBe(true);
    const serviceData = result.get('service');
    expect(serviceData?.score).toBeLessThan(0);
  });

  it('should detect price topic', () => {
    const text = 'Muito caro para o que oferece. Não vale o preço.';
    const result = analyzeSentimentByTopic(text);
    
    expect(result.has('price')).toBe(true);
    const priceData = result.get('price');
    expect(priceData?.score).toBeLessThan(0);
  });

  it('should detect wait_time topic', () => {
    const text = 'Demorou muito. Espera muito longa.';
    const result = analyzeSentimentByTopic(text);
    
    expect(result.has('wait_time')).toBe(true);
    const waitData = result.get('wait_time');
    expect(waitData?.score).toBeLessThan(0);
  });

  it('should detect multiple topics', () => {
    const text = 'Atendimento ruim e demorou muito. Muito caro também.';
    const result = analyzeSentimentByTopic(text);
    
    expect(result.size).toBeGreaterThan(1);
    expect(result.has('service')).toBe(true);
    expect(result.has('wait_time')).toBe(true);
    expect(result.has('price')).toBe(true);
  });

  it('should return empty map for unrelated text', () => {
    const text = 'O dia estava bonito.';
    const result = analyzeSentimentByTopic(text);
    
    expect(result.size).toBe(0);
  });
});

describe('analyzePriceSentiment', () => {
  it('should detect explicit positive price sentiment', () => {
    const text = 'Preço justo. Vale a pena!';
    const result = analyzePriceSentiment(text);
    
    expect(result.explicit).toBe('positive');
  });

  it('should detect explicit negative price sentiment', () => {
    const text = 'Muito caro. Não vale o preço.';
    const result = analyzePriceSentiment(text);
    
    expect(result.explicit).toBe('negative');
  });

  it('should detect implicit price sentiment (value not perceived)', () => {
    const text = 'Complicado de usar. Não funciona direito.';
    const result = analyzePriceSentiment(text);
    
    expect(result.implicit).toBe(true);
  });

  it('should detect competitive comparison', () => {
    const text = 'Comparado com outros lugares, está caro.';
    const result = analyzePriceSentiment(text);
    
    expect(result.competitive).toBe(true);
  });

  it('should detect friction (technical/operational problems)', () => {
    const text = 'Sistema lento e não funcionou.';
    const result = analyzePriceSentiment(text);
    
    expect(result.friction).toBe(true);
  });

  it('should return not_mentioned when price is not discussed', () => {
    const text = 'Comida boa e atendimento ok.';
    const result = analyzePriceSentiment(text);
    
    expect(result.explicit).toBe('not_mentioned');
    expect(result.implicit).toBe(false);
  });
});

