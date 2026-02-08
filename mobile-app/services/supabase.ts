/**
 * Backend único: Docker Core (PostgREST). Sem @supabase/supabase-js.
 * Exporta o cliente Core com o nome "supabase" para compatibilidade com imports existentes.
 */
import 'react-native-url-polyfill/auto';
import { coreClient } from './coreClient';

export const supabase = coreClient;
