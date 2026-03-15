import { WebPlugin } from '@capacitor/core';
import type { CapacitorNfcPlugin, NfcStateChangeEvent, NfcEvent, ShareTagOptions, StartScanningOptions, WriteTagOptions, PluginListenerHandle } from './definitions';
export declare class CapacitorNfcWeb extends WebPlugin implements CapacitorNfcPlugin {
    private unsupported;
    startScanning(_options?: StartScanningOptions): Promise<void>;
    stopScanning(): Promise<void>;
    write(_options: WriteTagOptions): Promise<void>;
    erase(): Promise<void>;
    makeReadOnly(): Promise<void>;
    share(_options: ShareTagOptions): Promise<void>;
    unshare(): Promise<void>;
    getStatus(): Promise<{
        status: 'NO_NFC';
    }>;
    showSettings(): Promise<void>;
    getPluginVersion(): Promise<{
        version: string;
    }>;
    isSupported(): Promise<{
        supported: boolean;
    }>;
    addListener(eventName: 'nfcEvent', listenerFunc: (event: NfcEvent) => void): Promise<PluginListenerHandle>;
    addListener(eventName: 'tagDiscovered' | 'ndefDiscovered' | 'ndefMimeDiscovered' | 'ndefFormatableDiscovered', listenerFunc: (event: NfcEvent) => void): Promise<PluginListenerHandle>;
    addListener(eventName: 'nfcStateChange', listenerFunc: (event: NfcStateChangeEvent) => void): Promise<PluginListenerHandle>;
}
