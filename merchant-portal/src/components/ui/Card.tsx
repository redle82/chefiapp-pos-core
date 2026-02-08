/**
 * Card - Card reutilizável
 * 
 * Usado para agrupar conteúdo relacionado
 */

import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'highlighted' | 'alert';
}

export function Card({ title, children, onPress, variant = 'default' }: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'highlighted':
        return {
          border: '2px solid #667eea',
          backgroundColor: '#f8f9fa',
        };
      case 'alert':
        return {
          border: '2px solid #ffc107',
          backgroundColor: '#fff',
        };
      default:
        return {
          border: '1px solid #e0e0e0',
          backgroundColor: '#fff',
        };
    }
  };

  return (
    <div
      onClick={onPress}
      style={{
        ...getVariantStyles(),
        borderRadius: '12px',
        padding: '16px',
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      {title && (
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
