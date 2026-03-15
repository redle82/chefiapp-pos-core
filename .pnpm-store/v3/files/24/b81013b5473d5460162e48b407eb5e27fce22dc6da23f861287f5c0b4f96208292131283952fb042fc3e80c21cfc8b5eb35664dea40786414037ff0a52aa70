import { WebPlugin } from '@capacitor/core';
export class CapacitorNfcWeb extends WebPlugin {
    unsupported(method) {
        throw this.unimplemented(`CapacitorNfc.${method} is not available in a browser environment.`);
    }
    async startScanning(_options) {
        this.unsupported('startScanning');
    }
    async stopScanning() {
        this.unsupported('stopScanning');
    }
    async write(_options) {
        this.unsupported('write');
    }
    async erase() {
        this.unsupported('erase');
    }
    async makeReadOnly() {
        this.unsupported('makeReadOnly');
    }
    async share(_options) {
        this.unsupported('share');
    }
    async unshare() {
        this.unsupported('unshare');
    }
    async getStatus() {
        return { status: 'NO_NFC' };
    }
    async showSettings() {
        this.unsupported('showSettings');
    }
    async getPluginVersion() {
        return { version: '0.0.0-web' };
    }
    async isSupported() {
        return { supported: false };
    }
    async addListener(eventName, _listenerFunc) {
        this.unsupported(`addListener(${eventName})`);
    }
}
//# sourceMappingURL=web.js.map