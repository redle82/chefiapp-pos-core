import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEYS = {
    APP_STAFF: '@chefiapp_staff_v1',
    ORDER_CTX: '@chefiapp_orders_v1',
};

// Generic Save
export const saveData = async (key: string, value: any) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error('Failed to save data', e);
    }
};

// Generic Load
export const loadData = async (key: string) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Failed to load data', e);
        return null;
    }
};

// Clear
export const clearData = async (key: string) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error('Failed to clear data', e);
    }
};

export const PersistenceService = {
    saveAppStaff: (data: any) => saveData(KEYS.APP_STAFF, data),
    loadAppStaff: () => loadData(KEYS.APP_STAFF),

    saveOrders: (data: any) => saveData(KEYS.ORDER_CTX, data),
    loadOrders: () => loadData(KEYS.ORDER_CTX),

    clearAll: async () => {
        await clearData(KEYS.APP_STAFF);
        await clearData(KEYS.ORDER_CTX);
    }
};
