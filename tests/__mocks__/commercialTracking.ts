/**
 * Mock para commercial/tracking — evita import.meta.env e CommercialTrackingService em Jest/Node.
 * CoreOrdersApi e outros importam deste barrel; o mock fornece stubs para as funções usadas.
 */
export const commercialTracking = {
  track: jest.fn(),
};

export const isCommercialTrackingEnabled = jest.fn(() => false);

export const detectDevice = jest.fn(() => "desktop");
