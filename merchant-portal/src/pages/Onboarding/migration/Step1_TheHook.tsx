import React from 'react';

interface Step1Props {
    onSelect: (source: 'NONE' | 'GLORIAFOOD' | 'OTHER') => void;
}

export const Step1_TheHook: React.FC<Step1Props> = ({ onSelect }) => {
    return (
        <div>
            <h2 className="migration-step-title">Você já tem uma história?</h2>
            <p className="migration-step-subtitle">
                O ChefIApp não começa do zero.<br />
                Nós respeitamos o passado do seu restaurante.
            </p>

            <div className="migration-cards">
                <div className="migration-card" onClick={() => onSelect('GLORIAFOOD')}>
                    <span className="card-icon">🍊</span>
                    <div className="card-title">Uso GloriaFood</div>
                </div>

                <div className="migration-card" onClick={() => onSelect('OTHER')}>
                    <span className="card-icon">📠</span>
                    <div className="card-title">Resgatar histórico (CSV/PDF)</div>
                </div>

                <div className="migration-card" onClick={() => onSelect('NONE')}>
                    <span className="card-icon">🌱</span>
                    <div className="card-title">Estou começando agora</div>
                </div>
            </div>
        </div>
    );
};
