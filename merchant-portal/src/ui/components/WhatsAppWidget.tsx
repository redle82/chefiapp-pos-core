import React from 'react';
import { colors } from '../../ui/design-system/tokens/colors';

export const WhatsAppWidget = () => {
    // 1. Config
    const PHONE_NUMBER = "5511999999999"; // TODO: Replace with real number
    const MESSAGE = "Vi o Sistema Nervoso Operacional. Quero entender se serve para minha cozinha.";

    // 2. Link Builder
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-scale"
            style={{
                position: 'fixed',
                bottom: '32px',
                right: '32px',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                background: '#25D366', // Official WhatsApp Color
                borderRadius: '100px',
                boxShadow: '0 8px 30px rgba(37, 211, 102, 0.3)',
                textDecoration: 'none',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid rgba(255,255,255,0.2)'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(37, 211, 102, 0.4)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(37, 211, 102, 0.3)';
            }}
        >
            <span style={{ fontSize: '24px' }}>💬</span>
            <span>Falar com um humano</span>
        </a>
    );
};
