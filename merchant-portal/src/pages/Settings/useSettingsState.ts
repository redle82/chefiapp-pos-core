import { useState } from 'react';
import { AuditService } from '../../core/logger/AuditService';

// --- TYPES ---

export interface RestaurantProfile {
    name: string;
    address: string;
    phone: string;
    timezone: string;
}

export type LegalCountry = 'BR' | 'PT' | 'ES';

export interface LegalProfile {
    country: LegalCountry;
    requireRestMinHours: number;
    allowOvertime: boolean;
    photoConsentRequired: boolean;
}

export interface HaccpSettings {
    coldChainEnabled: boolean;
    coldChainMinTemp: number;
    coldChainMaxTemp: number;
    sanitationLogEnabled: boolean;
    criticalTasksDoubleValidation: boolean;
}

export interface CertificateEntry {
    id: string;
    name: string;
    status: 'valid' | 'expiring-soon' | 'expired';
    expiresAt?: Date;
}

export interface SupplierSettings {
    enabled: boolean;
    showBadges: boolean;
}

// --- HOOK ---

export function useSettingsState() {

    // 1. Restaurant Profile
    const [restaurant, setRestaurant] = useState<RestaurantProfile>({
        name: 'Restaurante ChefI',
        address: 'Rua das Flores, 123 - Centro, São Paulo, SP',
        phone: '+55 11 99999-8888',
        timezone: 'America/Sao_Paulo',
    });

    // 2. Legal Profile
    const [legal, setLegal] = useState<LegalProfile>({
        country: 'BR',
        requireRestMinHours: 11,
        allowOvertime: false,
        photoConsentRequired: true,
    });

    // 3. HACCP
    const [haccp, setHaccp] = useState<HaccpSettings>({
        coldChainEnabled: true,
        coldChainMinTemp: -18,
        coldChainMaxTemp: 5,
        sanitationLogEnabled: true,
        criticalTasksDoubleValidation: true,
    });

    // 4. Certificates
    const [certs] = useState<CertificateEntry[]>([
        { id: 'c1', name: 'HACCP • Freezer - Câmara 1', status: 'valid', expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
        { id: 'c2', name: 'Food Safety • Cozinha Quente', status: 'expiring-soon', expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
        { id: 'c3', name: 'Treinamento • Boas Práticas', status: 'expired', expiresAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
    ]);

    // 5. Supplier Visibility
    const [supplierSettings, setSupplierSettings] = useState<SupplierSettings>({
        enabled: true,
        showBadges: true,
    });

    // --- COMPUTED ---
    const complianceState: 'live' | 'ghost' = haccp.sanitationLogEnabled && haccp.coldChainEnabled ? 'live' : 'ghost';

    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = (() => {
        const expired = certs.some((c) => c.status === 'expired');
        const expSoon = certs.some((c) => c.status === 'expiring-soon');
        if (expired) return 'HIGH';
        if (expSoon) return 'MEDIUM';
        return 'LOW';
    })();

    // --- ACTIONS ---

    const updateRestaurant = (field: keyof RestaurantProfile, value: string) => {
        setRestaurant((prev) => ({ ...prev, [field]: value }));
    };

    const updateLegalCountry = (country: LegalCountry) => {
        const presets: Record<LegalCountry, LegalProfile> = {
            BR: { country: 'BR', requireRestMinHours: 11, allowOvertime: false, photoConsentRequired: true },
            PT: { country: 'PT', requireRestMinHours: 11, allowOvertime: true, photoConsentRequired: true },
            ES: { country: 'ES', requireRestMinHours: 12, allowOvertime: true, photoConsentRequired: false },
        };
        setLegal(presets[country]);
        AuditService.log({
            action: 'settings.legal_country_changed',
            entity: 'legal_profile',
            entityId: 'global',
            metadata: { from: legal.country, to: country }
        });
    };

    const updateLegalCustom = (field: keyof LegalProfile, value: any) => {
        setLegal((prev) => ({ ...prev, [field]: value }));
    };

    const updateHaccp = <K extends keyof HaccpSettings>(key: K, value: HaccpSettings[K]) => {
        setHaccp((prev) => ({ ...prev, [key]: value }));
        // Log changes
        AuditService.log({
            action: `settings.haccp_changed`,
            entity: 'haccp_profile',
            entityId: 'global',
            metadata: { key, value }
        });
    };

    return {
        data: {
            restaurant,
            legal,
            haccp,
            certs,
            supplierSettings,
            complianceState,
            riskLevel
        },
        actions: {
            updateRestaurant,
            updateLegalCountry,
            updateLegalCustom,
            updateHaccp,
            setSupplierSettings
        }
    };
}
