/**
 * MENU WRITER — Adaptador de Escrita do Menu
 * 
 * FASE 4: Menu como Eixo de Produção
 * 
 * REGRAS:
 * - Menu é contrato operacional
 * - prep_time_seconds é obrigatório
 * - station é obrigatório
 * - Validação antes de salvar
 */

import { dockerCoreClient } from '../docker-core/connection';
import type { MenuItemInput } from '../../core/contracts/Menu';
import { validateMenuItemInput } from '../../core/contracts/Menu';
import { addPilotProduct, getPilotProducts, isNetworkError, type PilotProductStored } from '../menuPilotFallback';

export interface CreateProductResult {
  id: string;
  name: string;
  prep_time_seconds: number;
  station: 'BAR' | 'KITCHEN';
}

/**
 * Cria um produto no menu (com contrato operacional).
 * 
 * @param restaurantId ID do restaurante
 * @param item Dados do item (com prep_time_minutes e station obrigatórios)
 */
export async function createMenuItem(
  restaurantId: string,
  item: MenuItemInput
): Promise<CreateProductResult> {
  // Validar antes de salvar
  const validation = validateMenuItemInput(item);
  if (!validation.valid) {
    throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
  }

  // Converter minutos para segundos
  const prep_time_seconds = Math.round(item.prep_time_minutes * 60);

  const productData = {
    restaurant_id: restaurantId,
    category_id: item.category_id || null,
    name: item.name,
    description: item.description || null,
    price_cents: item.price_cents,
    station: item.station,
    prep_time_seconds: prep_time_seconds,
    prep_category: item.prep_category || null,
    available: item.available !== false,
  };

  try {
    const { data, error } = await dockerCoreClient
      .from('gm_products')
      .insert(productData)
      .select('id, name, prep_time_seconds, station')
      .single();

    if (error) {
      throw new Error(`Failed to create menu item: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      prep_time_seconds: data.prep_time_seconds,
      station: data.station,
    };
  } catch (err) {
    // B1 48h: fallback localStorage quando Core não responde (docs/product/B1_MENU_CONTENCAO.md)
    if (isNetworkError(err)) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const pilot: PilotProductStored = {
        id,
        restaurant_id: restaurantId,
        name: item.name,
        price_cents: item.price_cents,
        available: item.available !== false,
        station: item.station,
        prep_time_seconds,
        prep_category: item.prep_category || null,
        category_id: item.category_id || null,
        created_at: now,
        updated_at: now,
      };
      addPilotProduct(restaurantId, pilot);
      return { id, name: item.name, prep_time_seconds, station: item.station };
    }
    throw err;
  }
}

/**
 * Atualiza um produto no menu.
 * 
 * @param productId ID do produto
 * @param restaurantId ID do restaurante (para validação)
 * @param item Dados atualizados
 */
export async function updateMenuItem(
  productId: string,
  restaurantId: string,
  item: Partial<MenuItemInput>
): Promise<CreateProductResult> {
  // Se tem prep_time_minutes, validar
  if (item.prep_time_minutes !== undefined) {
    const validation = validateMenuItemInput(item as MenuItemInput);
    if (!validation.valid) {
      throw new Error(`Validação falhou: ${validation.errors.join(', ')}`);
    }
  }

  const updateData: any = {};

  if (item.name !== undefined) updateData.name = item.name;
  if (item.description !== undefined) updateData.description = item.description;
  if (item.price_cents !== undefined) updateData.price_cents = item.price_cents;
  if (item.category_id !== undefined) updateData.category_id = item.category_id;
  if (item.station !== undefined) updateData.station = item.station;
  if (item.prep_time_minutes !== undefined) {
    updateData.prep_time_seconds = Math.round(item.prep_time_minutes * 60);
  }
  if (item.prep_category !== undefined) updateData.prep_category = item.prep_category;
  if (item.available !== undefined) updateData.available = item.available;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await dockerCoreClient
    .from('gm_products')
    .update(updateData)
    .eq('id', productId)
    .eq('restaurant_id', restaurantId)
    .select('id, name, prep_time_seconds, station')
    .single();

  if (error) {
    throw new Error(`Failed to update menu item: ${error.message}`);
  }

  if (!data) {
    throw new Error('Product not found or does not belong to restaurant');
  }

  return {
    id: data.id,
    name: data.name,
    prep_time_seconds: data.prep_time_seconds,
    station: data.station,
  };
}

/**
 * Deleta um produto do menu.
 * 
 * @param productId ID do produto
 * @param restaurantId ID do restaurante (para validação)
 */
export async function deleteMenuItem(
  productId: string,
  restaurantId: string
): Promise<void> {
  const { error } = await dockerCoreClient
    .from('gm_products')
    .delete()
    .eq('id', productId)
    .eq('restaurant_id', restaurantId);

  if (error) {
    throw new Error(`Failed to delete menu item: ${error.message}`);
  }
}
