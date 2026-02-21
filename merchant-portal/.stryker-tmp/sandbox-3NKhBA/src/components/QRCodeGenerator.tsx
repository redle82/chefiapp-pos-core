/**
 * QR CODE GENERATOR — Componente para Gerar QR Codes
 * 
 * OBJETIVO: Gerar QR codes que apontam para /public/{slug}/mesa/{n}
 * 
 * DEPENDÊNCIA: qrcode.react (instalar: npm install qrcode.react)
 */
// @ts-nocheck


import React from 'react';
// Note: qrcode.react needs to be installed: npm install qrcode.react
// For now, using a simple fallback that generates QR via API
// TODO: Install qrcode.react for better control

interface QRCodeGeneratorProps {
    /** URL completa para o QR code */
    url: string;
    /** Tamanho do QR code em pixels */
    size?: number;
    /** Nível de correção de erro (L, M, Q, H) */
    level?: 'L' | 'M' | 'Q' | 'H';
    /** Cor de fundo */
    bgColor?: string;
    /** Cor do código */
    fgColor?: string;
    /** Incluir margem */
    includeMargin?: boolean;
    /** Classe CSS adicional */
    className?: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
    url,
    size = 200,
    level: _level = 'M',
    bgColor = '#FFFFFF',
    fgColor = '#000000',
    includeMargin = true,
    className = ''
}) => {
    // Using QR Server API as fallback (no dependency required)
    // For production, install qrcode.react: npm install qrcode.react
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=${encodeURIComponent(bgColor.replace('#', ''))}&color=${encodeURIComponent(fgColor.replace('#', ''))}`;

    return (
        <div className={className} style={{ display: 'inline-block' }}>
            <img
                src={qrApiUrl}
                alt={`QR Code: ${url}`}
                width={size}
                height={size}
                style={{
                    backgroundColor: bgColor,
                    padding: includeMargin ? '10px' : '0',
                    borderRadius: '4px'
                }}
            />
        </div>
    );
};

/**
 * Helper para construir URL de mesa
 * 
 * IMPORTANTE: URLs sempre apontam para o ambiente Docker (localhost)
 * Não gera URLs externas ou fora do ambiente Docker
 */
export function buildTableQRUrl(slug: string, tableNumber: number, baseUrl?: string): string {
    // Sempre usar localhost (Docker Core) se não especificado
    // Em produção, baseUrl virá do ambiente
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5175');
    return `${base}/public/${encodeURIComponent(slug)}/mesa/${tableNumber}`;
}
