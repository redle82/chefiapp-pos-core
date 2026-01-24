export interface HardwareCapability {
    name: 'USB' | 'Serial' | 'Bluetooth';
    available: boolean;
    error?: string;
}

export const checkHardwareCapabilities = (): HardwareCapability[] => {
    const capabilities: HardwareCapability[] = [];

    // WebUSB
    if (navigator.usb) {
        capabilities.push({ name: 'USB', available: true });
    } else {
        capabilities.push({ name: 'USB', available: false, error: 'Not supported in this browser (use Chrome/Edge)' });
    }

    // WebSerial
    if (navigator.serial) {
        capabilities.push({ name: 'Serial', available: true });
    } else {
        capabilities.push({ name: 'Serial', available: false, error: 'Not supported in this browser' });
    }

    // WebBluetooth
    if (navigator.bluetooth) {
        capabilities.push({ name: 'Bluetooth', available: true });
    } else {
        capabilities.push({ name: 'Bluetooth', available: false, error: 'Not supported in this browser' });
    }

    return capabilities;
};
