import clsx from 'clsx';
import { Minus, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { type MenuItem } from '../context/MenuContext';

interface ProductModalProps {
    product: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState('');
    const { addToCart } = useCart();

    if (!isOpen || !product) return null;

    const handleAdd = () => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price_cents,
            quantity: qty,
            notes
        });
        onClose();
        // Reset state for next time
        setQty(1);
        setNotes('');
    };

    const increment = () => setQty(q => Math.min(99, q + 1));
    const decrement = () => setQty(q => Math.max(1, q - 1));

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-surface-elevated w-full max-w-md rounded-t-xl sm:rounded-xl shadow-brand border-t border-white/10 p-lg pointer-events-auto transform transition-transform duration-300 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-start mb-md">
                    <h2 className="text-xl font-bold text-text-primary pr-8">{product.name}</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <X size={24} />
                    </button>
                </div>

                {/* Description */}
                {product.description && (
                    <p className="text-text-secondary mb-lg text-sm">{product.description}</p>
                )}

                {/* Notes (Optional) */}
                <div className="mb-lg">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Observações
                    </label>
                    <textarea
                        className="w-full bg-surface-base border border-surface-border rounded-lg p-3 text-text-primary text-sm focus:border-brand-gold outline-none resize-none"
                        placeholder="Ex: Sem cebola, ponto bem passado..."
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-md">
                    {/* Qty Stepper */}
                    <div className="flex items-center gap-4 bg-surface-base rounded-lg border border-surface-border p-2">
                        <button
                            onClick={decrement}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-highlight text-text-primary"
                            disabled={qty <= 1}
                        >
                            <Minus size={18} />
                        </button>
                        <span className="text-lg font-bold w-6 text-center">{qty}</span>
                        <button
                            onClick={increment}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-highlight text-text-primary"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAdd}
                        className={clsx(
                            "flex-1 bg-brand-gold hover:bg-brand-gold-light text-surface-base font-bold py-3 px-4 rounded-lg transition-colors flex justify-between items-center"
                        )}
                    >
                        <span>Adicionar</span>
                        <span>
                            {((product.price_cents * qty) / 100).toLocaleString('pt-PT', { style: 'currency', currency: product.currency })}
                        </span>
                    </button>
                </div>

            </div>
        </div>
    );
}
