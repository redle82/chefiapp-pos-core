/**
 * ActionButton - Botão de ação reutilizável
 * 
 * Usado para ações principais, secundárias e perigosas
 */

import React from 'react';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
}: ActionButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#ccc' : '#667eea',
          color: '#fff',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: '#fff',
          color: '#666',
          border: '1px solid #e0e0e0',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#ccc' : '#dc3545',
          color: '#fff',
          border: 'none',
        };
      default:
        return {
          backgroundColor: '#fff',
          color: '#666',
          border: '1px solid #e0e0e0',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: '6px 12px', fontSize: '12px' };
      case 'medium':
        return { padding: '8px 16px', fontSize: '14px' };
      case 'large':
        return { padding: '12px 24px', fontSize: '16px' };
      default:
        return { padding: '8px 16px', fontSize: '14px' };
    }
  };

  const styles = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    borderRadius: '8px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      style={styles}
    >
      {label}
    </button>
  );
}
