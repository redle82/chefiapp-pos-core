/**
 * INVENTORY STOCK READER
 * 
 * Lê dados de inventário (equipamentos, locais) e estoque (ingredientes, níveis).
 */

import { dockerCoreClient } from '../docker-core/connection';

export interface CoreLocation {
  id: string;
  restaurant_id: string;
  name: string;
  kind: 'KITCHEN' | 'BAR' | 'STORAGE' | 'SERVICE' | 'OTHER';
  created_at: string;
  updated_at?: string;
}

export interface CoreEquipment {
  id: string;
  restaurant_id: string;
  location_id?: string;
  name: string;
  kind: 'FRIDGE' | 'FREEZER' | 'OVEN' | 'GRILL' | 'PLANCHA' | 'COFFEE_MACHINE' | 'ICE_MACHINE' | 'KEG_SYSTEM' | 'SHELF' | 'OTHER';
  capacity_note?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CoreIngredient {
  id: string;
  restaurant_id: string;
  name: string;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'unit';
  created_at: string;
  updated_at?: string;
}

export interface CoreStockLevel {
  id: string;
  restaurant_id: string;
  location_id: string;
  ingredient_id: string;
  qty: number;
  min_qty: number;
  updated_at: string;
}

export interface CoreProductBOM {
  id: string;
  restaurant_id: string;
  product_id: string;
  ingredient_id: string;
  qty_per_unit: number;
  station: 'KITCHEN' | 'BAR';
  preferred_location_kind?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Lê locais de um restaurante.
 */
export async function readLocations(restaurantId: string): Promise<CoreLocation[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_locations')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to read locations: ${error.message}`);
  }

  return (data || []) as CoreLocation[];
}

/**
 * Lê equipamentos de um restaurante.
 */
export async function readEquipment(restaurantId: string): Promise<CoreEquipment[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_equipment')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to read equipment: ${error.message}`);
  }

  return (data || []) as CoreEquipment[];
}

/**
 * Lê ingredientes de um restaurante.
 */
export async function readIngredients(restaurantId: string): Promise<CoreIngredient[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_ingredients')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to read ingredients: ${error.message}`);
  }

  return (data || []) as CoreIngredient[];
}

/**
 * Lê níveis de estoque de um restaurante (com joins para ingrediente e local).
 */
export async function readStockLevels(restaurantId: string): Promise<(CoreStockLevel & { ingredient: CoreIngredient; location: CoreLocation })[]> {
  const { data, error } = await dockerCoreClient
    .from('gm_stock_levels')
    .select(`
      *,
      ingredient:gm_ingredients(*),
      location:gm_locations(*)
    `)
    .eq('restaurant_id', restaurantId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to read stock levels: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    ...item,
    ingredient: item.ingredient as CoreIngredient,
    location: item.location as CoreLocation,
  })) as (CoreStockLevel & { ingredient: CoreIngredient; location: CoreLocation })[];
}

/**
 * Lê BOM (receitas) de produtos de um restaurante.
 */
export async function readProductBOM(restaurantId: string, productId?: string): Promise<(CoreProductBOM & { ingredient: CoreIngredient })[]> {
  let query = dockerCoreClient
    .from('gm_product_bom')
    .select(`
      *,
      ingredient:gm_ingredients(*)
    `)
    .eq('restaurant_id', restaurantId);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to read product BOM: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    ...item,
    ingredient: item.ingredient as CoreIngredient,
  })) as (CoreProductBOM & { ingredient: CoreIngredient })[];
}
