/**
 * Order Schemas
 *
 * Schemas Zod para validação de payloads de pedidos.
 */

import { z } from "zod";

/** Schema para status de pedido */
export const OrderStatusSchema = z.enum([
  "OPEN",
  "PREPARING",
  "READY",
  "DELIVERED",
  "PAID",
  "CANCELLED",
]);

/** Schema para tipo de pedido */
export const OrderTypeSchema = z.enum(["dine_in", "takeaway", "delivery"]);

/** Schema para modificador de item */
export const OrderItemModifierSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});

/** Schema para item de pedido */
export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  modifiers: z.array(OrderItemModifierSchema).optional(),
  notes: z.string().optional(),
});

/** Schema para pedido completo */
export const OrderSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  status: OrderStatusSchema,
  type: OrderTypeSchema,
  items: z.array(OrderItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  discount: z.number(),
  total: z.number(),
  tableNumber: z.string().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Schema para criação de pedido */
export const CreateOrderSchema = z.object({
  restaurantId: z.string().min(1),
  type: OrderTypeSchema,
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      modifiers: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }),
  ).min(1),
  tableNumber: z.string().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

/** Schema para atualização de status */
export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: OrderStatusSchema,
});

/** Tipos inferidos dos schemas */
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type OrderType = z.infer<typeof OrderTypeSchema>;
export type OrderItemModifier = z.infer<typeof OrderItemModifierSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>;
