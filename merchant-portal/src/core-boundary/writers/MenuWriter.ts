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

import type { MenuItemInput } from "../../core/contracts/Menu";
import { validateMenuItemInput } from "../../core/contracts/Menu";
import { DbWriteGate } from "../../core/governance/DbWriteGate";
import { Logger } from "../../core/logger";

export interface CreateProductResult {
  id: string;
  name: string;
  prep_time_seconds: number;
  station: "BAR" | "KITCHEN";
}

/**
 * Cria um produto no menu (com contrato operacional).
 *
 * @param restaurantId ID do restaurante
 * @param item Dados do item (com prep_time_minutes e station obrigatórios)
 */
export async function createMenuItem(
  restaurantId: string,
  item: MenuItemInput,
): Promise<CreateProductResult> {
  // Validar antes de salvar
  const validation = validateMenuItemInput(item);
  if (!validation.valid) {
    throw new Error(`Validação falhou: ${validation.errors.join(", ")}`);
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
    ...(item.id ? { id: item.id } : {}),
  };

  Logger.debug("[MenuWriter] createMenuItem payload (via DbWriteGate)", {
    restaurant_id: restaurantId,
    productData,
  });

  const { data, error } = await DbWriteGate.insert(
    "MenuAuthority",
    "gm_products",
    productData,
    { tenantId: restaurantId },
  );

  if (error) {
    // 409 Conflict / 23505 = unique constraint (ex.: nome duplicado por restaurante)
    const errAny = error as {
      code?: string;
      message?: string;
      status?: number;
    };
    const code = errAny.code;
    const status = errAny.status;
    const msg = String(errAny.message || "").toLowerCase();
    const isConflict =
      status === 409 ||
      code === "23505" ||
      msg.includes("409") ||
      msg.includes("duplicate") ||
      msg.includes("unique") ||
      msg.includes("conflict");
    if (isConflict) {
      throw new Error(
        "Já existe um produto com este nome neste restaurante. Use outro nome.",
      );
    }
    throw new Error(`Failed to create menu item: ${error.message}`);
  }

  // DbWriteGate insert returns single object or mocks it correctly
  return {
    id: data.id,
    name: data.name,
    prep_time_seconds: data.prep_time_seconds,
    station: data.station,
  };
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
  item: Partial<MenuItemInput>,
): Promise<CreateProductResult> {
  // Se tem prep_time_minutes, validar
  if (item.prep_time_minutes !== undefined) {
    const validation = validateMenuItemInput(item as MenuItemInput);
    if (!validation.valid) {
      throw new Error(`Validação falhou: ${validation.errors.join(", ")}`);
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
  if (item.prep_category !== undefined)
    updateData.prep_category = item.prep_category;
  if (item.available !== undefined) updateData.available = item.available;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await DbWriteGate.update(
    "MenuAuthority",
    "gm_products",
    updateData,
    { id: productId },
    { tenantId: restaurantId },
  );

  if (error) {
    throw new Error(`Failed to update menu item: ${error.message}`);
  }

  // DbWriteGate update returns result.data which is array
  const updatedItem = Array.isArray(data) ? data[0] : data;

  if (!updatedItem) {
    throw new Error("Product not found or access denied");
  }

  return {
    id: updatedItem.id,
    name: updatedItem.name,
    prep_time_seconds: updatedItem.prep_time_seconds,
    station: updatedItem.station,
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
  restaurantId: string,
): Promise<void> {
  const { error } = await DbWriteGate.delete(
    "MenuAuthority",
    "gm_products",
    { id: productId, restaurant_id: restaurantId },
    { tenantId: restaurantId },
  );

  if (error) {
    throw new Error(`Failed to delete menu item: ${error.message}`);
  }
}
