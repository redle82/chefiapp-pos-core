/**
 * Permission Wrapper - Bug #12 Fix
 * 
 * UI nunca é segurança. Ação SEMPRE valida permissão.
 */

import { Permission } from '@/context/ContextPolicy';
import { Alert } from 'react-native';

type ActionFunction = (...args: any[]) => Promise<any> | any;

/**
 * withPermission - Wrapper que valida permissão antes de executar ação
 * 
 * Regra inegociável: Todas as ações críticas devem usar este wrapper
 * 
 * @param permission - Permissão necessária
 * @param action - Função a ser executada
 * @param canAccess - Função que verifica permissão
 * @returns Função wrapper que valida antes de executar
 */
export function withPermission(
    permission: Permission,
    action: ActionFunction,
    canAccess: (p: Permission) => boolean
): ActionFunction {
    return async (...args: any[]) => {
        // Bug #12 Fix: Validação SEMPRE antes de executar
        if (!canAccess(permission)) {
            Alert.alert(
                'Sem Permissão',
                `Você não tem permissão para executar esta ação. (Requer: ${permission})`
            );
            throw new Error(`Permission denied: ${permission}`);
        }

        // Se tem permissão, executa ação
        return action(...args);
    };
}

/**
 * deny - Helper para negar ação
 */
export function deny(reason?: string): never {
    Alert.alert('Ação Negada', reason || 'Você não tem permissão para esta ação.');
    throw new Error(`Action denied: ${reason || 'No permission'}`);
}
