import { useCart } from '../context/CartContext';
import clsx from 'clsx';

export function CartFloatingButton() {
    const { items, totalCents, setIsCartOpen } = useCart();
    const count = items.reduce((acc, item) => acc + item.qty, 0);

    if (count === 0) return null;

    return (
        <div className="fixed bottom-6 left-0 right-0 px-md z-30 flex justify-center pointer-events-none">
            <button
                onClick={() => setIsCartOpen(true)}
                className={clsx(
                    "pointer-events-auto max-w-md w-full",
                    "bg-brand-gold text-surface-base shadow-brand",
                    "flex items-center justify-between px-lg py-3 rounded-full",
                    "transform active:scale-95 transition-all duration-200"
                )}
            >
                <div className="flex items-center gap-2">
                    <div className="bg-surface-base/20 w-8 h-8 rounded-full flex items-center justify-center">
                        <span className="font-bold text-sm">{count}</span>
                    </div>
                    <span className="font-bold">Ver Carrinho</span>
                </div>

                <span className="font-bold">
                    {(totalCents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
            </button>
        </div>
    );
}
