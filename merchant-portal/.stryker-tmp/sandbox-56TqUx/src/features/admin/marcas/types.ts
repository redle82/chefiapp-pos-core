/**
 * Tipos para Marcas — marca principal e sub-marcas.
 */
// @ts-nocheck


export interface Brand {
  id: string;
  name: string;
  description: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
}
