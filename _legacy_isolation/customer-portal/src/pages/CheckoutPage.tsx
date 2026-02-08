import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useMenu } from '../context/MenuContext';
import { supabase } from '../supabaseClient'; // Ensure this client exists and is configured

export function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const { profile } = useMenu();
    const navigate = useNavigate();

    const [customerName, setCustomerName] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!profile || items.length === 0) return;
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('create_order_atomic', {
                p_restaurant_id: profile.restaurant_id,
                p_items: items.map(i => ({
                    product_id: i.id,
                    name: i.name,
                    quantity: i.quantity,
                    unit_price: i.price
                })),
                p_payment_method: 'app'
            });

            if (error) throw error;

            clearCart();
            alert('Pedido enviado com sucesso (ID: ' + data.short_id + ')!');
            navigate(`/${profile.slug}`); // Back to menu
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar pedido.');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return <div className="p-8 text-center text-gray-500">Seu carrinho está vazio.</div>;
    }

    return (
        <div className="p-6 max-w-md mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Confirmar Pedido</h1>

            <div className="space-y-4 mb-8">
                {items.map(item => (
                    <div key={item.id} className="flex justify-between border-b pb-2">
                        <div>
                            <span className="font-medium">{item.quantity}x {item.name}</span>
                        </div>
                        <div>
                            {((item.price * item.quantity)/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between font-bold text-xl mb-8">
                <span>Total:</span>
                <span>{(total/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>

            <div className="space-y-4 mb-8">
                <input
                    type="text"
                    placeholder="Seu Nome"
                    className="w-full p-3 border rounded shadow-sm"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Número da Mesa"
                    className="w-full p-3 border rounded shadow-sm"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? 'Enviando...' : 'FAZER PEDIDO'}
            </button>

            <button
                onClick={() => navigate(-1)}
                className="w-full mt-4 text-gray-500 py-2"
            >
                Voltar ao Cardápio
            </button>
        </div>
    );
}
