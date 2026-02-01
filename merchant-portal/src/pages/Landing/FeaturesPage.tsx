/**
 * PUBLIC_SITE_CONTRACT: /features — Site do sistema (marketing).
 * NÃO carrega Runtime nem Core. Funciona offline.
 */
import { Link } from "react-router-dom";

export function FeaturesPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">Funcionalidades</h1>
      <p className="text-neutral-400 mb-8 max-w-md text-center">
        TPV, KDS, cardápio, pedidos, caixa e muito mais. Em breve.
      </p>
      <div className="flex gap-4">
        <Link to="/" className="text-amber-500 hover:underline">Voltar ao início</Link>
        <Link to="/auth" className="text-amber-500 hover:underline">Entrar</Link>
      </div>
    </main>
  );
}
