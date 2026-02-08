/**
 * RESTAURANT PROFILES - Teste Massivo Nível 5
 * 
 * Gerador de perfis de restaurantes (400, 350, 200, 50).
 */

import type { RestaurantProfile, RestaurantProfileConfig, RestaurantData } from './types';
import { v4 as uuidv4 } from 'uuid';

export function generateRestaurantProfiles(): RestaurantProfileConfig[] {
  return [
    {
      name: 'Ambulante/Micro',
      count: 400,
      tablesRange: [0, 3],
      locationsRange: [1, 2],
      productsRange: [10, 20],
      ingredientsRange: [15, 30],
      peopleRange: [1, 3],
      behavior: {
        orderFrequency: 'LOW',
        peakHours: [{ start: 12, end: 14 }, { start: 19, end: 21 }],
        orderComplexity: 'SIMPLE',
        stockManagement: 'BASIC',
      },
    },
    {
      name: 'Pequeno/Médio',
      count: 350,
      tablesRange: [10, 20],
      locationsRange: [2, 3],
      productsRange: [30, 50],
      ingredientsRange: [40, 60],
      peopleRange: [5, 10],
      behavior: {
        orderFrequency: 'MEDIUM',
        peakHours: [{ start: 12, end: 14 }, { start: 19, end: 22 }],
        orderComplexity: 'MEDIUM',
        stockManagement: 'ADVANCED',
      },
    },
    {
      name: 'Grande',
      count: 200,
      tablesRange: [40, 80],
      locationsRange: [3, 4],
      productsRange: [50, 80],
      ingredientsRange: [60, 100],
      peopleRange: [15, 30],
      behavior: {
        orderFrequency: 'HIGH',
        peakHours: [{ start: 12, end: 14 }, { start: 19, end: 22 }],
        orderComplexity: 'COMPLEX',
        stockManagement: 'ADVANCED',
      },
    },
    {
      name: 'Enterprise',
      count: 50,
      tablesRange: [120, 300],
      locationsRange: [4, 6],
      productsRange: [80, 150],
      ingredientsRange: [100, 200],
      peopleRange: [50, 150],
      behavior: {
        orderFrequency: 'EXTREME',
        peakHours: [{ start: 11, end: 15 }, { start: 18, end: 23 }],
        orderComplexity: 'COMPLEX',
        stockManagement: 'ENTERPRISE',
      },
    },
  ];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
