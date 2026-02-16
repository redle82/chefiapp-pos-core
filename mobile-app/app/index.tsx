/**
 * Rota raiz "/" — redireciona para o AppStaff web (WebView).
 * Sem este ficheiro o Expo Router não tem ecrã para "/" e pode mostrar ecrã em branco.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/appstaff-web" />;
}
