/**
 * P6-6: IoT Kitchen Service
 * 
 * Serviço para integração com equipamentos IoT da cozinha
 */

import { Logger } from '../logger/Logger';

export interface IoTDevice {
    id: string;
    name: string;
    type: 'oven' | 'refrigerator' | 'freezer' | 'dishwasher' | 'fryer' | 'grill';
    status: 'online' | 'offline' | 'error';
    currentTemperature?: number;
    targetTemperature?: number;
    lastMaintenance?: Date;
    nextMaintenance?: Date;
}

export interface IoTAlert {
    deviceId: string;
    deviceName: string;
    type: 'temperature' | 'maintenance' | 'error';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
}

class IoTKitchenService {
    private devices: Map<string, IoTDevice> = new Map();
    private alerts: IoTAlert[] = [];

    /**
     * Register IoT device
     */
    registerDevice(device: IoTDevice): void {
        this.devices.set(device.id, device);
        Logger.info('IoT device registered', { device });
    }

    /**
     * Get device status
     */
    getDeviceStatus(deviceId: string): IoTDevice | null {
        return this.devices.get(deviceId) || null;
    }

    /**
     * Get all devices
     */
    getAllDevices(): IoTDevice[] {
        return Array.from(this.devices.values());
    }

    /**
     * Update device temperature
     */
    updateDeviceTemperature(deviceId: string, temperature: number): void {
        const device = this.devices.get(deviceId);
        if (!device) return;

        device.currentTemperature = temperature;

        // Check for temperature alerts
        if (device.targetTemperature) {
            const diff = Math.abs(temperature - device.targetTemperature);
            if (diff > 10) {
                this.addAlert({
                    deviceId,
                    deviceName: device.name,
                    type: 'temperature',
                    severity: diff > 20 ? 'critical' : 'high',
                    message: `Temperatura fora do alvo: ${temperature}°C (alvo: ${device.targetTemperature}°C)`,
                    timestamp: Date.now(),
                });
            }
        }

        this.devices.set(deviceId, device);
    }

    /**
     * Check maintenance needs
     */
    checkMaintenance(): void {
        const now = Date.now();
        for (const device of this.devices.values()) {
            if (device.nextMaintenance) {
                const daysUntilMaintenance = (device.nextMaintenance.getTime() - now) / (1000 * 60 * 60 * 24);
                
                if (daysUntilMaintenance < 0) {
                    this.addAlert({
                        deviceId: device.id,
                        deviceName: device.name,
                        type: 'maintenance',
                        severity: 'critical',
                        message: `Manutenção atrasada: ${device.name}`,
                        timestamp: now,
                    });
                } else if (daysUntilMaintenance < 7) {
                    this.addAlert({
                        deviceId: device.id,
                        deviceName: device.name,
                        type: 'maintenance',
                        severity: 'medium',
                        message: `Manutenção em ${Math.ceil(daysUntilMaintenance)} dias: ${device.name}`,
                        timestamp: now,
                    });
                }
            }
        }
    }

    /**
     * Add alert
     */
    private addAlert(alert: IoTAlert): void {
        this.alerts.push(alert);
        Logger.warn('IoT alert', { alert });
    }

    /**
     * Get alerts
     */
    getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): IoTAlert[] {
        if (severity) {
            return this.alerts.filter(a => a.severity === severity);
        }
        return [...this.alerts];
    }

    /**
     * Clear alerts
     */
    clearAlerts(): void {
        this.alerts = [];
    }
}

export const iotKitchenService = new IoTKitchenService();
