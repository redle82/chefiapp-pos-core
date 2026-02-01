/**
 * Types for Config Tree components
 */

export type ConfigSection = 
  | 'identity'
  | 'location'
  | 'schedule'
  | 'menu'
  | 'inventory'
  | 'people'
  | 'payments'
  | 'integrations'
  | 'status';

export interface ConfigSectionConfig {
  id: ConfigSection;
  label: string;
  icon: string;
  description?: string;
  path: string;
  children?: ConfigSectionConfig[];
}
