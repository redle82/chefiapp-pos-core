/**
 * Mock dos 7 módulos para a página "Mis productos".
 * Ref: plano página_mis_productos_módulos — Essenciais + Canais e crescimento.
 */

import type { Module } from "../types";

export const MODULES_MOCK: Module[] = [
  // Essenciais do dia a dia
  {
    id: "tpv",
    name: "Software TPV",
    description: "Gestiona tu Sala, pedidos de Delivery y Take away en un mismo sitio.",
    status: "active",
    icon: "🖥️",
    primaryAction: "Open",
    secondaryAction: "Desactivar",
    block: "essenciais",
  },
  {
    id: "fichaje",
    name: "Sistema de fichaje",
    description: "Simplifica el control horario de tu equipo. Los empleados pueden fichar entrada y salida en el TPV.",
    status: "inactive",
    icon: "👥",
    primaryAction: "Activate",
    block: "essenciais",
  },
  {
    id: "stock",
    name: "Stock",
    description: "Gestiona tu inventario. Seguimiento de niveles, notificaciones de stock bajo e informes desde el TPV.",
    status: "inactive",
    icon: "📦",
    primaryAction: "Activate",
    block: "essenciais",
  },
  // Canais e crescimento
  {
    id: "tienda-online",
    name: "Tienda online",
    description: "Vende comida con tu propio canal de venta para delivery y take away.",
    status: "inactive",
    icon: "🛒",
    primaryAction: "Activate",
    dependencies: ["Catálogo", "Pagos"],
    block: "canais",
  },
  {
    id: "qr-ordering",
    name: "QR ORDERING",
    description: "Combina lo mejor de la carta digital con toda la tecnología de un e-commerce.",
    status: "active",
    icon: "📱",
    primaryAction: "Configure",
    secondaryAction: "Desactivar",
    dependencies: ["Catálogo"],
    block: "canais",
  },
  {
    id: "reservas",
    name: "Reservas",
    description: "Consigue más reservas a través de tu página web, redes sociales y teléfono.",
    status: "active",
    icon: "📅",
    primaryAction: "Configure",
    secondaryAction: "Desactivar",
    block: "canais",
  },
  {
    id: "delivery-integrator",
    name: "Integrador de delivery",
    description: "Integra tus canales de delivery y recibe todos los pedidos en un mismo lugar.",
    status: "active",
    icon: "🚚",
    primaryAction: "Configure",
    secondaryAction: "Desactivar",
    dependencies: ["Integraciones"],
    block: "canais",
  },
];
