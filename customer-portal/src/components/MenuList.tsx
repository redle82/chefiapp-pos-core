import { useMenu, type MenuItem } from '../context/MenuContext';

interface MenuListProps {
    onProductSelect: (item: MenuItem) => void;
}

export function MenuList({ onProductSelect }: MenuListProps) {
    const { categories, items, isLoading, error } = useMenu();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-xl">
                <div className="text-secondary animate-pulse">Carregando menu...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-xl text-center">
                <div className="text-risk-high mb-sm">Erro ao carregar menu</div>
                <div className="text-sm text-text-secondary">{error}</div>
            </div>
        );
    }

    // Group items by category
    const itemsByCategory = categories.reduce((acc, cat) => {
        acc[cat.id] = items.filter(item => item.category_id === cat.id);
        return acc;
    }, {} as Record<string, typeof items>);

    return (
        <div className="w-full max-w-md mx-auto space-y-xl px-2">
            {categories.map(category => {
                const categoryItems = itemsByCategory[category.id];
                if (!categoryItems?.length) return null;

                return (
                    <section key={category.id} className="space-y-md">
                        <h2 className="text-xl font-bold text-brand-gold border-b border-white/10 pb-2 px-md sticky top-16 bg-surface-base/95 backdrop-blur-sm z-10 pt-2">
                            {category.name}
                        </h2>

                        <div className="space-y-md px-md">
                            {categoryItems.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => onProductSelect(item)}
                                    className="group relative flex gap-md bg-surface-highlight/20 hover:bg-surface-highlight/40 rounded-lg p-md transition-colors cursor-pointer active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-text-primary mb-1">{item.name}</h3>
                                        {item.description && (
                                            <p className="text-sm text-text-secondary line-clamp-2 mb-2">{item.description}</p>
                                        )}
                                        <div className="text-brand-gold font-medium">
                                            {(item.price_cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: item.currency })}
                                        </div>
                                    </div>

                                    {item.photo_url && (
                                        <div className="w-24 h-24 rounded-md overflow-hidden bg-surface-highlight/50 flex-shrink-0">
                                            <img
                                                src={item.photo_url}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
