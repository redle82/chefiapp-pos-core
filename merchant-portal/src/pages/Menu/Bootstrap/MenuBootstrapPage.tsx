import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../core/supabase';
import { MenuBootstrapService, type BootstrapContext } from '../../../core/menu/MenuBootstrapService';
import { getTabIsolated } from '../../../core/storage/TabIsolatedStorage';
import {
    Rocket, Coffee, Beer, Utensils, ArrowRight, ArrowLeft,
    Store, Truck, User, Zap, Scale, List, FileText, Globe, PenTool,
    CheckCircle, ShieldAlert, BadgeCheck, Timer, Brain
} from 'lucide-react';
import { Button } from '../../../ui/design-system/Button';
import { ErrorBoundary } from '../../../ui/design-system/ErrorBoundary';

// STEPS
type BootstrapStep = 'MODE' | 'QUESTIONS' | 'BUSINESS' | 'SERVICE' | 'SPEED' | 'SOURCE' | 'CONFIRM';

// INTERNAL COMPONENT
const MenuBootstrapContent: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState<BootstrapStep>('MODE');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Context Data
    const [context, setContext] = useState<BootstrapContext>({
        mode: 'QUICK',
        businessType: '',
        serviceStyle: [],
        operationSpeed: '',
        cuisine: '',
        priceTier: 'MID',
        sellsAlcohol: true,
        hasBreakfast: false,
        hasMenuOfDay: false
    });
    const [sourceType, setSourceType] = useState<'PRESET' | 'PDF' | 'URL' | 'MANUAL' | ''>('');

    // --- NAVIGATION ---
    const handleNext = () => {
        if (step === 'MODE') {
            if (context.mode === 'GUIDED') setStep('QUESTIONS');
            else setStep('BUSINESS');
        }
        else if (step === 'QUESTIONS') setStep('BUSINESS');
        else if (step === 'BUSINESS') setStep('SERVICE');
        else if (step === 'SERVICE') setStep('SPEED');
        else if (step === 'SPEED') setStep('SOURCE');
        else if (step === 'SOURCE') setStep('CONFIRM');
    };

    const handleBack = () => {
        if (step === 'QUESTIONS') setStep('MODE');
        else if (step === 'BUSINESS') {
            if (context.mode === 'GUIDED') setStep('QUESTIONS');
            else setStep('MODE');
        }
        else if (step === 'SERVICE') setStep('BUSINESS');
        else if (step === 'SPEED') setStep('SERVICE');
        else if (step === 'SOURCE') setStep('SPEED');
        else if (step === 'CONFIRM') setStep('SOURCE');
    };

    // --- HANDLERS ---
    const selectMode = (mode: 'QUICK' | 'GUIDED') => {
        setContext({ ...context, mode });
        if (mode === 'QUICK') setStep('BUSINESS');
        else setStep('QUESTIONS');
    };

    const handleSelectBusiness = (type: string) => {
        setContext({ ...context, businessType: type });
        setStep('SERVICE');
    };

    const toggleService = (style: string) => {
        const current = context.serviceStyle;
        const createNew = current.includes(style)
            ? current.filter(s => s !== style)
            : [...current, style];
        setContext({ ...context, serviceStyle: createNew });
    };

    const handleSelectSpeed = (speed: string) => {
        setContext({ ...context, operationSpeed: speed });
        setStep('SOURCE');
    };

    const handleSelectSource = (source: 'PRESET' | 'PDF' | 'URL' | 'MANUAL') => {
        setSourceType(source);
        setStep('CONFIRM');
    };

    // EXECUTION
    const executeBootstrap = async () => {
        const restaurantId = getTabIsolated('chefiapp_restaurant_id');
        if (!restaurantId) {
            setError('Sessão inválida. Faça login novamente.');
            return;
        }

        setIsLoading(true);
        try {
            const service = new MenuBootstrapService(supabase);

            // Map Business Type to Preset ID
            let presetId = 'RESTAURANT_V1'; // Default
            if (context.businessType === 'CAFE') presetId = 'CAFE_V1';
            if (context.businessType === 'BAR') presetId = 'BAR_V1';

            // Only PRESET logic is implemented in V1 Service
            // Even PDF/URL/Manual use Preset as "Template Base" in V1
            await service.injectPreset(restaurantId, presetId, context);

            navigate('/app/menu');

        } catch (err: any) {
            console.error('[MBE] Execution Failed', err);
            setError(err.message || 'Erro ao criar menu.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- UI HELPERS ---
    const StepIndicator = ({ current }: { current: string }) => {
        const steps = context.mode === 'GUIDED'
            ? ['MODE', 'QUESTIONS', 'BUSINESS', 'SERVICE', 'SPEED', 'SOURCE', 'CONFIRM']
            : ['MODE', 'BUSINESS', 'SERVICE', 'SPEED', 'SOURCE', 'CONFIRM'];

        return (
            <div className="flex justify-center space-x-2 mb-8">
                {steps.map((s) => (
                    <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s === current ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
                ))}
            </div>
        );
    };

    const SelectionCard = ({ icon, title, desc, selected, onClick, multi = false, highlightColor = 'blue' }: any) => (
        <button
            onClick={onClick}
            className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all w-full text-center ${selected
                ? `border-${highlightColor}-600 bg-${highlightColor}-50 text-${highlightColor}-900 shadow-md transform scale-[1.02]`
                : `border-slate-100 hover:border-${highlightColor}-200 hover:bg-slate-50 text-slate-600`
                }`}
        >
            <div className={`mb-3 ${selected ? `text-${highlightColor}-600` : 'text-slate-400'}`}>{icon}</div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-xs opacity-70 leading-relaxed">{desc}</p>
            {multi && selected && <div className={`mt-2 text-${highlightColor}-600 font-bold text-xs`}>✓ SELECIONADO</div>}
        </button>
    );

    return (
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="bg-white p-8 border-b border-slate-100 flex justify-between items-center">
                {step !== 'MODE' ? (
                    <button onClick={handleBack} className="text-slate-400 hover:text-slate-600">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                ) : <div className="w-6" />}

                <div className="text-center">
                    <h1 className="text-xl font-bold text-slate-800">Criar Cardápio</h1>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
                        {step === 'MODE' && 'Como prefere começar?'}
                        {step === 'QUESTIONS' && 'Detalhes da Operação'}
                        {step === 'BUSINESS' && 'Tipo de Negócio'}
                        {step === 'SERVICE' && 'Estilo de Serviço'}
                        {step === 'SPEED' && 'Velocidade Operacional'}
                        {step === 'SOURCE' && 'Fonte de Dados'}
                        {step === 'CONFIRM' && 'Confirmação'}
                    </p>
                </div>

                <div className="w-6" />
            </div>

            {/* Progress */}
            <div className="pt-6">
                <StepIndicator current={step} />
            </div>

            {/* Body */}
            <div className="flex-1 p-8 overflow-y-auto">
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
                        {error}
                    </div>
                )}

                {step === 'MODE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center">
                        <SelectionCard
                            icon={<Timer className="w-10 h-10" />}
                            title="Modo Rápido (30s)"
                            desc="Ideal se você quer começar a vender hoje."
                            onClick={() => selectMode('QUICK')}
                            selected={false}
                            highlightColor="green"
                        />
                        <SelectionCard
                            icon={<Brain className="w-10 h-10" />}
                            title="Modo Guiado (5 min)"
                            desc="Ideal se você quer ajustar tudo ao seu estilo."
                            onClick={() => selectMode('GUIDED')}
                            selected={false}
                            highlightColor="blue"
                        />
                    </div>
                )}

                {step === 'QUESTIONS' && (
                    <div className="space-y-8 max-w-2xl mx-auto">
                        {/* Cuisine */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Qual a cozinha principal?</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['Mediterrânea', 'Italiana', 'Brasileira', 'Japonesa', 'Mexicana', 'Local', 'Mista'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setContext({ ...context, cuisine: c })}
                                        className={`p-2 text-xs rounded-lg border ${context.cuisine === c ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-slate-50 border-slate-200'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price & Boolean Flags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Faixa de Preço</label>
                                <div className="flex space-x-2">
                                    {['BUDGET', 'MID', 'PREMIUM'].map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setContext({ ...context, priceTier: p as any })}
                                            className={`flex-1 p-3 text-sm rounded-lg border ${context.priceTier === p ? 'bg-green-100 border-green-500 text-green-800' : 'bg-slate-50 border-slate-200'}`}
                                        >
                                            {p === 'BUDGET' ? '€' : p === 'MID' ? '€€' : '€€€'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={context.sellsAlcohol}
                                        onChange={e => setContext({ ...context, sellsAlcohol: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium">Vende Álcool?</span>
                                </label>
                                <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={context.hasBreakfast}
                                        onChange={e => setContext({ ...context, hasBreakfast: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium">Serve Café da Manhã?</span>
                                </label>
                            </div>
                        </div>

                        <div className="text-center pt-4">
                            <Button variant="primary" onClick={handleNext}>
                                Próximo <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'BUSINESS' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <p className="col-span-1 md:col-span-3 text-center text-slate-500 text-sm mb-4">Isso só define uma base inicial. Você poderá mudar tudo depois.</p>
                        <SelectionCard
                            icon={<Coffee className="w-8 h-8" />}
                            title="Café & Bistro"
                            desc="Bebidas rápidas, pastelaria e snacks."
                            onClick={() => handleSelectBusiness('CAFE')}
                            selected={context.businessType === 'CAFE'}
                        />
                        <SelectionCard
                            icon={<Beer className="w-8 h-8" />}
                            title="Bar & Pub"
                            desc="Foco em bebidas alcoólicas e petiscos."
                            onClick={() => handleSelectBusiness('BAR')}
                            selected={context.businessType === 'BAR'}
                        />
                        <SelectionCard
                            icon={<Utensils className="w-8 h-8" />}
                            title="Restaurante"
                            desc="Menu completo com cozinha quente."
                            onClick={() => handleSelectBusiness('RESTAURANT')}
                            selected={context.businessType === 'RESTAURANT'}
                        />
                    </div>
                )}

                {step === 'SERVICE' && (
                    <div className="space-y-6">
                        <p className="text-center text-slate-500 mb-4">Como o cliente pede? (Múltipla escolha)</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SelectionCard
                                icon={<User className="w-8 h-8" />}
                                title="Mesa / Garçom"
                                desc="Pedido anotado na mesa."
                                onClick={() => toggleService('TABLE')}
                                selected={context.serviceStyle.includes('TABLE')}
                                multi
                            />
                            <SelectionCard
                                icon={<Store className="w-8 h-8" />}
                                title="Balcão / Caixa"
                                desc="Pedido direto no caixa."
                                onClick={() => toggleService('COUNTER')}
                                selected={context.serviceStyle.includes('COUNTER')}
                                multi
                            />
                            <SelectionCard
                                icon={<Truck className="w-8 h-8" />}
                                title="Delivery"
                                desc="Pedidos de fora."
                                onClick={() => toggleService('DELIVERY')}
                                selected={context.serviceStyle.includes('DELIVERY')}
                                multi
                            />
                        </div>
                        <div className="flex flex-col items-center mt-8">
                            {context.serviceStyle.length > 0 && context.serviceStyle.length < 3 && (
                                <p className="text-slate-500 text-xs mb-4">Você pode escolher mais de uma opção.</p>
                            )}
                            {context.serviceStyle.length === 3 && (
                                <p className="text-green-600 text-sm font-medium mb-4">Perfeito. Sistema preparado para múltiplos canais.</p>
                            )}
                            <div className="flex justify-center">
                                <Button variant="primary" onClick={handleNext} disabled={context.serviceStyle.length === 0}>
                                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'SPEED' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectionCard
                            icon={<Zap className="w-8 h-8" />}
                            title="Rápido"
                            desc="Poucos itens, giro alto."
                            onClick={() => handleSelectSpeed('FAST')}
                            selected={context.operationSpeed === 'FAST'}
                        />
                        <SelectionCard
                            icon={<Scale className="w-8 h-8" />}
                            title="Equilibrado"
                            desc="Menu padrão."
                            onClick={() => handleSelectSpeed('BALANCED')}
                            selected={context.operationSpeed === 'BALANCED'}
                        />
                        <SelectionCard
                            icon={<List className="w-8 h-8" />}
                            title="Detalhado"
                            desc="Muitas opções."
                            onClick={() => handleSelectSpeed('DETAILED')}
                            selected={context.operationSpeed === 'DETAILED'}
                        />
                    </div>
                )}

                {step === 'SOURCE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectionCard
                            icon={<Rocket className="w-8 h-8" />}
                            title="Usar Modelo (Preset)"
                            desc="Menu base pronto para editar."
                            onClick={() => handleSelectSource('PRESET')}
                            selected={sourceType === 'PRESET'}
                        />
                        <SelectionCard
                            icon={<FileText className="w-8 h-8" />}
                            title="Baseado em Foto/PDF"
                            desc="Partir do preset + sua foto (upload futuro)."
                            onClick={() => handleSelectSource('PDF')}
                            selected={sourceType === 'PDF'}
                        />
                        <SelectionCard
                            icon={<Globe className="w-8 h-8" />}
                            title="Baseado em Site"
                            desc="Partir do preset + link (import futuro)."
                            onClick={() => handleSelectSource('URL')}
                            selected={sourceType === 'URL'}
                        />
                        <SelectionCard
                            icon={<PenTool className="w-8 h-8" />}
                            title="100% Manual"
                            desc="Criar tudo do zero."
                            onClick={() => handleSelectSource('MANUAL')}
                            selected={sourceType === 'MANUAL'}
                        />
                    </div>
                )}

                {step === 'CONFIRM' && (
                    <div className="text-center max-w-md mx-auto">
                        <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-900 mb-4">Resumo da Operação</h3>
                            <ul className="text-left space-y-3 text-sm text-slate-600">
                                <li className="flex justify-between border-b border-blue-100 pb-2">
                                    <span>Modo:</span>
                                    <span className="font-bold text-blue-800">{context.mode === 'QUICK' ? 'Rápido ⚡' : 'Guiado 🧠'}</span>
                                </li>
                                <li className="flex justify-between border-b border-blue-100 pb-2">
                                    <span>Negócio:</span>
                                    <span className="font-bold text-blue-800">{context.businessType}</span>
                                </li>
                                {context.mode === 'GUIDED' && (
                                    <>
                                        <li className="flex justify-between border-b border-blue-100 pb-2">
                                            <span>Cozinha:</span>
                                            <span>{context.cuisine || 'N/A'}</span>
                                        </li>
                                        <li className="flex justify-between border-b border-blue-100 pb-2">
                                            <span>Álcool:</span>
                                            <span>{context.sellsAlcohol ? 'Sim' : 'Não'}</span>
                                        </li>
                                    </>
                                )}
                                <li className="flex justify-between">
                                    <span>Origem:</span>
                                    <span className="font-bold text-blue-800">{sourceType}</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-sm text-slate-500 mb-8">
                            Criando <strong>primeiro rascunho do cardápio</strong>.
                            {sourceType !== 'PRESET' && " (Como você escolheu Manual/PDF, o sistema criará a estrutura base e você poderá ajustar depois)."}
                        </p>

                        <button
                            onClick={executeBootstrap}
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all ${isLoading
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 hover:scale-[1.02] shadow-green-200'
                                }`}
                        >
                            {isLoading ? 'Configurando Sistema...' : '🚀 Criar Rascunho'}
                        </button>
                        <p className="mt-4 text-xs text-slate-400">Você poderá editar tudo depois.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// EXPORT WITH HARDENING
export const MenuBootstrapPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
            <ErrorBoundary context="MenuBootstrap">
                <MenuBootstrapContent />
            </ErrorBoundary>
        </div>
    );
};
