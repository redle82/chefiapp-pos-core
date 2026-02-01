/**
 * (tabs)/index — Redirect para Turno (staff)
 *
 * CORE_APPSTAFF_CONTRACT §9: o ecrã correcto ao abrir (tabs) é Turno (tarefas + mini TPV).
 * Em Expo Router, (tabs) resolve para (tabs)/index; este redirect garante que se abre em Turno.
 */
import { Redirect } from 'expo-router';

export default function TabsIndexRedirect() {
  return <Redirect href="/(tabs)/staff" />;
}
