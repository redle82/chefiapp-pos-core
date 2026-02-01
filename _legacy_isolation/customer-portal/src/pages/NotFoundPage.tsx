/**
 * NotFoundPage - Página de erro para slug inválido ou não encontrado
 */

interface NotFoundPageProps {
    error?: string | null;
    slug?: string | null;
}

export function NotFoundPage({ error, slug }: NotFoundPageProps) {
    return (
        <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md">
                {/* Icon */}
                <div className="text-6xl mb-6">🍽️</div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-text-primary mb-3">
                    {error && error.includes('Failed to fetch') ? 'Sem conexão' : 'Restaurante não encontrado'}
                </h1>

                {/* Error message */}
                <p className="text-text-secondary mb-6">
                    {error && error.includes('Failed to fetch') ? (
                        'Ops! Estamos sem conexão com o restaurante. Por favor, tente recarregar a página ou chame um garçom.'
                    ) : (
                        error || `Não conseguimos encontrar o restaurante "${slug || 'desconhecido'}".`
                    )}
                </p>

                {/* Suggestions */}
                <div className="bg-surface-elevated rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-text-secondary mb-2">Verifique se:</p>
                    <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                        <li>O link está correto</li>
                        <li>O restaurante ainda está ativo</li>
                        <li>Você digitou o endereço corretamente</li>
                    </ul>
                </div>

                {/* CTA */}
                <a
                    href="https://chefiapp.com"
                    className="inline-block bg-brand-gold text-surface-base font-semibold px-6 py-3 rounded-lg hover:bg-brand-gold/90 transition-colors"
                >
                    Voltar para ChefIApp
                </a>
            </div>
        </div>
    );
}

/**
 * LoadingPage - Página de carregamento enquanto busca o menu
 */
export function LoadingPage() {
    return (
        <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-6">
            <div className="animate-pulse">
                <div className="text-4xl mb-4">🍳</div>
                <p className="text-text-secondary">Carregando cardápio...</p>
            </div>
        </div>
    );
}
