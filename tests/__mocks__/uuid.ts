/**
 * Mock for uuid module to fix ES6 module issue in Jest
 * 
 * This mock provides a simple implementation of uuid v4
 * that works in Jest's CommonJS environment.
 */

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Export as default and named exports to match uuid package API
export default uuidv4;
export const v4 = uuidv4;
export const v1 = uuidv4; // Mock v1 as v4 for simplicity
export const v3 = uuidv4; // Mock v3 as v4 for simplicity
export const v5 = uuidv4; // Mock v5 as v4 for simplicity
