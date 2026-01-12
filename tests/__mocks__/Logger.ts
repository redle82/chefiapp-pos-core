/**
 * Mock Logger for tests
 * This avoids import.meta.env issues in Jest
 */
export class Logger {
    private isDev: boolean = false;

    constructor() {
        // Always false in tests
        this.isDev = false;
    }

    log(...args: any[]) {
        // Silent in tests
    }

    error(...args: any[]) {
        // Silent in tests
    }

    warn(...args: any[]) {
        // Silent in tests
    }

    info(...args: any[]) {
        // Silent in tests
    }

    debug(...args: any[]) {
        // Silent in tests
    }
}

export default Logger;
