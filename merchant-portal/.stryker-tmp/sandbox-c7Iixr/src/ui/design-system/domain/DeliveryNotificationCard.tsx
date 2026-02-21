import React from 'react';
import './DeliveryNotificationCard.css';

interface DeliveryItem {
    id: string;
    name: string;
    quantity: number;
    price?: number;
}

interface DeliveryOrder {
    id: string;
    external_id: string;
    reference?: string;
    source: string; // 'glovo', 'ubereats'
    customer_name: string;
    delivery_address: string;
    total_cents: number;
    currency?: string;
    items: DeliveryItem[];
}

interface DeliveryNotificationCardProps {
    order: DeliveryOrder;
    onAccept: (order: DeliveryOrder) => void;
    onReject: (orderId: string) => void;
}

export const DeliveryNotificationCard: React.FC<DeliveryNotificationCardProps> = ({
    order,
    onAccept,
    onReject
}) => {
    // Color mapping based on source
    const getSourceColor = (source: string) => {
        switch (source.toLowerCase()) {
            case 'glovo': return '#FFC244';
            case 'ubereats': return '#06C167';
            default: return '#3B82F6';
        }
    };

    const sourceColor = getSourceColor(order.source);

    return (
        <div className="delivery-card">
            <div className="delivery-card-header">
                <div className="delivery-source">
                    <span
                        className="delivery-dot"
                        style={{
                            backgroundColor: sourceColor,
                            boxShadow: `0 0 8px ${sourceColor}50`
                        }}
                    />
                    <span className="delivery-platform">{order.source}</span>
                </div>
                <span className="delivery-ref">
                    #{order.reference || order.external_id.slice(0, 8)}
                </span>
            </div>

            <div className="delivery-card-content">
                <div className="delivery-info-row">
                    <div>
                        <h3 className="delivery-customer">{order.customer_name}</h3>
                        <p className="delivery-address">{order.delivery_address}</p>
                    </div>
                    <div className="delivery-price">
                        <span className="delivery-total">
                            {new Intl.NumberFormat('pt-PT', {
                                style: 'currency',
                                currency: order.currency || 'EUR'
                            }).format(order.total_cents / 100)}
                        </span>
                        <span className="delivery-total-label">Total</span>
                    </div>
                </div>

                <div className="delivery-items">
                    {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="delivery-item">
                            <span>{item.quantity}x {item.name}</span>
                        </div>
                    ))}
                    {order.items.length > 3 && (
                        <p className="delivery-more-items">
                            + {order.items.length - 3} itens...
                        </p>
                    )}
                </div>

                <div className="delivery-actions">
                    <button
                        className="btn-reject"
                        onClick={() => onReject(order.id)}
                    >
                        REJEITAR
                    </button>
                    <button
                        className="btn-accept"
                        style={{
                            backgroundColor: sourceColor,
                            color: order.source === 'dro' ? '#fff' : '#000' // Better contrast
                        }}
                        onClick={() => onAccept(order)}
                    >
                        ACEITAR
                    </button>
                </div>
            </div>
        </div>
    );
};
