import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useOnboarding } from './OnboardingState';
// OnboardingLayout removed per FOE Constitution (Universal RitualScreen)
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { Button } from '../../ui/design-system/primitives/Button';
import { Input } from '../../ui/design-system/primitives/Input';
import { Skeleton } from '../../ui/design-system/primitives/Skeleton';
import { PlacesMock } from './PlacesMock';
import type { GooglePlace } from './PlacesMock';

import { RitualScreen } from './RitualScreen';
import { resolveRealityConflict } from '../../core/kernel/GenesisKernel';



export const ScreenInviteCode = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);

    const handleVerify = async () => {
        setVerifying(true);
        // Mock verification
        setTimeout(() => {
            setVerifying(false);
            if (code.length > 5) {
                alert('Convite Válido! Acesso concedido.');
                // Here we would actually bind the user to the restaurant
                window.location.href = '/app/dashboard?role=manager';
            } else {
                alert('Código inválido.');
            }
        }, 1000);
    };

    return (
        <RitualScreen
            id="invite"
            title="Ingresso via Convite"
            subtitle="Insira a chave de acesso fornecida pelo fundador."
            primaryAction={{
                label: 'Validar Acesso',
                onClick: handleVerify,
                disabled: code.length < 5
            }}
            secondaryAction={{
                label: 'Voltar',
                onClick: () => navigate('/onboarding/start')
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '40px 0' }}>
                <div style={{ fontSize: 48 }}>🎟️</div>
                <div style={{ width: '100%', maxWidth: 320 }}>
                    <Input
                        label="Código do Convite"
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        placeholder="Ex: GM-A1B2C"
                        autoFocus
                        style={{ textAlign: 'center', letterSpacing: 3, fontSize: 24, textTransform: 'uppercase' }}
                    />
                </div>
                <Text size="sm" color="secondary">
                    Solicite este código ao proprietário do estabelecimento.
                </Text>
            </div>
        </RitualScreen>
    );
};




// --- 1. TELA DOURADA: IDENTIDADE DO SISTEMA (LOCALIZAR NO GOOGLE) ---
const ScreenSystemIdentity = () => {
    const { updateDraft, initializeSovereign, entryContext } = useOnboarding();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GooglePlace[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 3) {
                setIsSearching(true);
                try {
                    const res = await PlacesMock.search(query);
                    setResults(res);

                    const isUrl = query.startsWith('http') || query.includes('google.com/maps');
                    if (isUrl && res.length === 1) {
                        setSelectedPlace(res[0]);
                        setQuery(res[0].name);
                        setResults([]);
                    }
                } catch (err) {
                    console.error('Search error:', err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, selectedPlace]);

    const handleSelect = (place: GooglePlace) => {
        setSelectedPlace(place);
        setQuery(place.name);
        setResults([]);
    };

    const handleFounderMode = async () => {
        setIsLoading(true);
        try {
            updateDraft({
                restaurantName: 'Meu Novo Estabelecimento',
                city: 'A definir',
                businessType: 'Restaurant',
                onboardingLevel: 'founder'
            });
            await initializeSovereign();
            navigate('/onboarding/existence');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        if (!selectedPlace) return;

        setIsLoading(true);
        setError(null);

        try {
            let topology = { dineIn: true, delivery: false, takeaway: true };
            let flowType: 'a_la_carte' | 'fast_casual' | 'dark_kitchen' = 'a_la_carte';

            const cat = selectedPlace.category;
            if (cat === 'FastFood' || cat === 'DarkKitchen') {
                topology = { dineIn: false, delivery: true, takeaway: true };
                flowType = 'fast_casual';
            } else if (cat === 'Cafe') {
                flowType = 'fast_casual';
            }

            const country = selectedPlace.countryCode;
            const currency = country === 'PT' || country === 'ES' ? 'EUR (€)' : 'BRL (R$)';
            const mainMethod = country === 'PT' ? 'MBWay' : country === 'ES' ? 'Bizum' : 'Pix';
            const finance = { currency, methods: ['cash', 'card', mainMethod.toLowerCase()] };

            updateDraft({
                restaurantName: selectedPlace.name,
                city: selectedPlace.city,
                address: selectedPlace.address,
                countryCode: selectedPlace.countryCode,
                lat: selectedPlace.lat,
                lng: selectedPlace.lng,
                placeId: selectedPlace.placeId,
                businessType: selectedPlace.category as any,
                onboardingLevel: 'verified_gold',
                topology,
                flowType,
                finance
            });

            await initializeSovereign();
            navigate('/onboarding/existence');
        } catch (error: any) {
            console.error('[ScreenSystemIdentity] Genesis Failed:', error);
            setError(error?.message || 'Erro ao criar entidade.');
        } finally {
            setIsLoading(false);
        }
    };

    const isInternal = entryContext === 'internal_app';

    return (
        <RitualScreen
            id="identity"
            title={isInternal ? "Confirmar Estabelecimento" : "Identidade do Sistema"}
            subtitle={isInternal
                ? "Vamos localizar seu negócio para configurar o sistema corretamente."
                : "A primeira lei sobeana: nomear aquilo que existe."}
            primaryAction={selectedPlace ? {
                label: isInternal ? 'Confirmar e Iniciar' : 'Prosseguir',
                onClick: handleNext,
                isLoading
            } : undefined}
            secondaryAction={!isInternal ? {
                label: 'Não encontrei no Google',
                onClick: handleFounderMode
            } : undefined}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '24px 0' }}>
                <div style={{ fontSize: 64 }}>{isInternal ? '🏪' : '💠'}</div>

                {error && (
                    <div style={{ padding: '12px', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid #ff453a', borderRadius: '8px', color: '#ff453a', fontSize: '14px' }}>
                        {error}
                    </div>
                )}

                {/* SEARCH INPUT */}
                <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
                    <Input
                        label={isInternal ? "Nome do Restaurante" : "Qual o nome da entidade?"}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedPlace(null);
                        }}
                        placeholder="Nome no Google ou link do Google Maps"
                        autoFocus
                    />

                    {isSearching && (
                        <div style={{ position: 'absolute', right: 12, top: 40, color: '#F5A623' }}>
                            <Skeleton variant="circular" width={20} height={20} />
                        </div>
                    )}

                    {results.length > 0 && (
                        <Card surface="layer3" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 4, maxHeight: 200, overflowY: 'auto' }}>
                            {results.map(p => (
                                <div
                                    key={p.placeId}
                                    onClick={() => handleSelect(p)}
                                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    <Text weight="bold">{p.name}</Text>
                                    <Text size="xs" color="secondary">{p.address} · {p.city}</Text>
                                </div>
                            ))}
                        </Card>
                    )}
                </div>

                {selectedPlace && (
                    <Card surface="layer2" padding="md" style={{ border: '1px solid rgba(245, 166, 35, 0.3)', background: 'rgba(245, 166, 35, 0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Text size="xl">📍</Text>
                            <div>
                                <Text size="xs" color="warning" weight="bold" style={{ textTransform: 'uppercase' }}>Estabelecimento Identificado</Text>
                                <Text weight="bold">{selectedPlace.name}</Text>
                                <Text size="sm" color="secondary">{selectedPlace.address}</Text>
                                <Text size="xs" color="secondary" style={{ opacity: 0.7 }}>{selectedPlace.category} · {selectedPlace.city}, {selectedPlace.countryCode}</Text>
                            </div>
                        </div>
                    </Card>
                )}

                <div style={{ padding: '0 8px', textAlign: 'center' }}>
                    <Text size="xs" color="secondary" style={{ fontStyle: 'italic', opacity: 0.6 }}>
                        Puxaremos automaticamente horários, telefone e localização para que você não precise digitar nada.
                    </Text>
                    {/* Fallback for Internal Mode if they really can't find it */}
                    {isInternal && (
                        <div style={{ marginTop: 16 }}>
                            <Button tone="neutral" variant="ghost" size="sm" onClick={handleFounderMode}>
                                Não encontrei meu negócio
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </RitualScreen>
    );
};

// --- 2. TELA DOURADA: PAPEL E AUTORIDADE (QUEM MANDA?) ---
// --- 2. TELA DOURADA: PAPEL E AUTORIDADE (QUEM MANDA?) ---
const ScreenAuthority = () => {
    const { draft, updateDraft, advanceState } = useOnboarding();
    const navigate = useNavigate();
    const [role, setRole] = useState<'Owner' | 'Manager' | null>(null);

    const handleNext = async () => {
        if (!role) return;

        // 1. Caminho do Gestor (Fluxo Curto)
        if (role === 'Manager') {
            updateDraft({ userRole: 'Manager' });
            navigate('/join'); // Redirect to isolated Join Flow
            return;
        }

        // 2. Caminho do Soberano (Funda a Autoridade)
        if (role === 'Owner') {
            try {
                // 🔑 OFFICIAL RITUAL OF POSSESSION (Core FOE Logic)
                // Resolve o "Reality Mismatch" confirmando que este Draft é dono deste Tenant
                const resolvedDraft = await resolveRealityConflict(draft, {
                    action: 'bind_existing',
                    tenantId: draft.tenantId!, // Exists because EntryContext found it
                });

                updateDraft(resolvedDraft);

                // 🔒 Advance State
                await advanceState('authority', {
                    userRole: 'Owner',
                });
                navigate('/onboarding/topology');
            } catch (error) {
                console.error('[ScreenAuthority] Ritual of Possession Failed:', error);
                alert('Falha ao assumir propriedade. Tente novamente.');
            }
            return;
        }
    };

    return (
        <RitualScreen
            id="authority"
            title="Soberania & Acesso"
            subtitle={`Qual é o seu papel oficial em "${draft.restaurantName || 'neste estabelecimento'}"?`}
            primaryAction={{
                label: role ? (role === 'Owner' ? 'Assumir Propriedade' : 'Ir para Acesso de Equipe') : 'Escolha um Papel',
                onClick: handleNext,
                disabled: !role
            }}
            secondaryAction={{ label: 'Voltar', onClick: () => navigate(-1) }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* IDENTIDADE (Leitura - vinda do Google) */}
                <Card surface="layer1" padding="md" style={{ borderLeft: '4px solid #F5A623', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 24 }}>🏢</div>
                    <div>
                        <Text weight="bold" size="lg">{draft.restaurantName || 'Estabelecimento'}</Text>
                        <Text size="xs" color="secondary">{draft.address || 'Localização confirmada'}</Text>
                    </div>
                </Card>

                {/* SELEÇÃO DE PAPEL */}
                <div style={{ display: 'grid', gap: 12 }}>
                    <Button
                        tone={role === 'Owner' ? 'action' : 'neutral'}
                        variant={role === 'Owner' ? 'solid' : 'outline'}
                        onClick={() => setRole('Owner')}
                        title="Sou o Proprietário / Fundador"
                        style={{ height: 'auto', padding: 16, justifyContent: 'flex-start' }}
                    >
                        <div style={{ textAlign: 'left' }}>
                            <Text weight="bold" size="lg" style={{ display: 'block' }}>👑 Sou o Dono (Fundar)</Text>
                            <Text size="sm" style={{ opacity: 0.8 }}>Configurar o restaurante e assumir controle.</Text>
                        </div>
                    </Button>

                    <Button
                        tone={role === 'Manager' ? 'action' : 'neutral'}
                        variant={role === 'Manager' ? 'solid' : 'outline'}
                        onClick={() => setRole('Manager')}
                        title="Tenho um Código de Convite"
                        style={{ height: 'auto', padding: 16, justifyContent: 'flex-start' }}
                    >
                        <div style={{ textAlign: 'left' }}>
                            <Text weight="bold" size="lg" style={{ display: 'block' }}>🎟️ Tenho um Convite (Equipe)</Text>
                            <Text size="sm" style={{ opacity: 0.8 }}>Entrar com código da loja.</Text>
                        </div>
                    </Button>
                </div>

                {/* FAIL-SAFE EXIT (RESET) */}
                <div style={{ marginTop: 24, padding: '0 24px', textAlign: 'center' }}>
                    <Text size="xs" color="secondary" style={{ opacity: 0.6 }}>
                        Está vendo o estabelecimento errado?
                    </Text>
                    <Button
                        tone="destructive"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                            if (confirm('Isso apagará seus dados locais e reiniciará o processo. Confirmar?')) {
                                await resolveRealityConflict(draft, { action: 'reset_and_restart' });
                                window.location.href = '/onboarding/start';
                            }
                        }}
                    >
                        🔄 Reiniciar Identidade
                    </Button>
                </div>
            </div>
        </RitualScreen>
    );
};

// MOCK EXTERNAL SERVICE (For local testing)
const GoogleBusinessMock = {
    connect: async () => {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        return {
            title: 'Sofia Gastrobar',
            address: {
                city: 'Lisboa',
                street: 'Rua Augusta',
                number: '120',
                zip: '1100-050'
            },
            id: 'ChIJ...' // Mock PlaceID
        };
    }
};

// --- 3. TELA DOURADA: PROVA DE EXISTÊNCIA (REALIDADE) ---
const ScreenExistence = () => {
    const { advanceState, updateDraft, draft } = useOnboarding();
    const navigate = useNavigate();
    const [subStep, setSubStep] = useState<'selection' | 'diagnostic' | 'connecting'>('selection');
    const [progress, setProgress] = useState(0);
    const [placeDetails, setPlaceDetails] = useState<GooglePlace | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // steps removed; RitualScreen handles checks internally
    useEffect(() => {
        // If we already have a placeId from Screen 1, jump to diagnostic
        if (draft.placeId && subStep === 'selection') {
            setSubStep('diagnostic');
            fetchDetails();
        }
    }, [draft.placeId]);

    const fetchDetails = async () => {
        if (!draft.placeId) return;
        setIsLoadingDetails(true);
        try {
            const details = await PlacesMock.getDetails(draft.placeId);
            setPlaceDetails(details);
        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const calculateHealth = (details: GooglePlace | null) => {
        if (!details) return 0;
        let score = 100; // Formula v1 Base

        if (details.rating < 4.0) score -= 30; // Heavy penalty
        if (details.rating < 4.5) score -= 10;
        if (details.reviewCount < 20) score -= 25;
        if (!details.website) score -= 15;
        if (!details.hours) score -= 15;
        if (details.reviewCount < 100) score -= 5;

        return Math.max(score, 0);
    };

    const getHealthLevel = (score: number) => {
        if (score >= 90) return { label: 'Dominante', color: '#4CAF50' };
        if (score >= 75) return { label: 'Forte', color: '#8BC34A' };
        if (score >= 50) return { label: 'Instável', color: '#FF9800' };
        return { label: 'Em Risco', color: '#F44336' };
    };

    const getAlerts = (details: GooglePlace | null) => {
        const alerts = [];
        if (!details?.hours) alerts.push('🕒 Horários: Sua operação não informa quando está aberta no Google.');
        if (!details?.website) alerts.push('🌐 Site: A falta de um link oficial reduz sua autoridade digital.');
        if (details && details.reviewCount < 20) alerts.push('⭐ Reputação: Volume de avaliações insuficiente para confiança total.');
        if (details && details.rating < 4.2) alerts.push('📉 Qualidade: Rating atual abaixo da média competitiva (4.2+).');
        return alerts;
    };

    const startConnection = async () => {
        // Skip the fake "connecting" animation - user wants speed
        await finalizeExistence();
    };

    const finalizeExistence = async () => {
        const healthScore = calculateHealth(placeDetails);
        const alerts = getAlerts(placeDetails);

        try {
            await advanceState('existence', {
                evidence: {
                    evidence_type: placeDetails ? 'google_business' : 'founder_mode',
                    status: 'connected',
                    source: placeDetails ? 'google' : 'manual',
                    data: placeDetails || { reason: 'manual_setup' },
                    healthScore,
                    alerts
                },
                onboardingLevel: placeDetails ? 'verified_gold' : 'founder',
                modulesUnlocked: placeDetails ? ['website', 'reputation', 'seo'] : ['settings']
            });
            navigate('/onboarding/topology');
        } catch (error) {
            console.error(error);
            setSubStep('diagnostic');
            alert('Falha ao sincronizar. Tente novamente.');
        }
    };

    if (subStep === 'connecting') {
        return (
            <RitualScreen
                id="existence"
                title="Sincronizando Realidade..."
                subtitle="Ritual de conexão em curso. Espelhando sua presença física no núcleo digital."
            >
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <div style={{ marginBottom: 24 }}>
                        <Text size="xl" weight="bold" color="warning">Ritual de Conexão em Curso...</Text>
                    </div>
                    <div style={{ width: '100%', height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #F5A623, #FFD080)', transition: 'width 0.4s ease' }} />
                    </div>
                    <Text size="md" color="secondary">{Math.round(progress)}% Sincronizado</Text>
                </div>
            </RitualScreen>
        );
    }

    if (subStep === 'diagnostic') {
        const health = calculateHealth(placeDetails);
        const alerts = getAlerts(placeDetails);

        return (
            <RitualScreen
                id="existence"
                title="Leitura da Presença Pública"
                subtitle="Sincronizamos os sinais vitais do seu estabelecimento via Google."
                primaryAction={{ label: 'Confirmar e Sincronizar', onClick: startConnection }}
                secondaryAction={{ label: 'Alterar Estabelecimento', onClick: () => navigate('/onboarding/identity') }}
            >
                {isLoadingDetails ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Skeleton variant="rectangular" height={100} />
                        <Skeleton variant="rectangular" height={150} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <Card surface="layer2" padding="lg" style={{ textAlign: 'center', border: `1px solid ${getHealthLevel(health).color}33`, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: getHealthLevel(health).color }} />
                            <Text size="xs" color="secondary" weight="bold" style={{ textTransform: 'uppercase' }}>Score de Saúde Digital</Text>
                            <div style={{ fontSize: '48px', fontWeight: '900', color: getHealthLevel(health).color, margin: '8px 0' }}>{health}%</div>
                            <div style={{ background: `${getHealthLevel(health).color}22`, padding: '4px 12px', borderRadius: 12, display: 'inline-block' }}>
                                <Text size="sm" weight="bold" style={{ color: getHealthLevel(health).color }}>{getHealthLevel(health).label}</Text>
                            </div>
                        </Card>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <Card surface="layer2" padding="md">
                                <Text size="xs" color="secondary">Rating</Text>
                                <Text weight="bold">⭐ {placeDetails?.rating}</Text>
                            </Card>
                            <Card surface="layer2" padding="md">
                                <Text size="xs" color="secondary">Status Google</Text>
                                <Text weight="bold" color="success">Ativo</Text>
                            </Card>
                        </div>

                        {alerts.length > 0 && (
                            <Card surface="layer1" padding="md" style={{ background: 'rgba(255, 69, 58, 0.05)', border: '1px solid rgba(255, 69, 58, 0.2)' }}>
                                <Text size="xs" weight="bold" color="secondary" style={{ marginBottom: 8, display: 'block' }}>RECOMENDAÇÕES DE MELHORIA</Text>
                                {alerts.map((a, i) => <Text key={i} size="xs" style={{ display: 'block', marginBottom: 4 }}>{a}</Text>)}
                            </Card>
                        )}

                        <Card surface="layer3" padding="md">
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{ fontSize: 24 }}>🏢</div>
                                <div>
                                    <Text weight="bold">{placeDetails?.name}</Text>
                                    <Text size="xs" color="secondary" style={{ display: 'block' }}>{placeDetails?.address}</Text>
                                    <Text size="xs" color="warning" style={{ display: 'block', marginTop: 4 }}>{placeDetails?.phone || 'Telefone não detectado'}</Text>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </RitualScreen>
        );
    }

    // FALLBACK: Selection (If no Google match or user chose manual)
    return (
        <RitualScreen
            id="existence"
            title="Leitura da Presença Pública"
            subtitle="Como seu negócio existe hoje no mundo real?"
            secondaryAction={{ label: 'Voltar', onClick: () => navigate(-1) }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div onClick={() => navigate('/onboarding/identity')} style={{ cursor: 'pointer' }}>
                    <Card surface="layer2" padding="lg" style={{ border: '1px solid #F5A623' }}>
                        <Text size="lg" weight="bold">🎯 Localizar no Google</Text>
                        <Text size="sm" color="secondary">Recomendado para importar dados e ganhar tempo.</Text>
                    </Card>
                </div>
                <div onClick={startConnection} style={{ cursor: 'pointer' }}>
                    <Card surface="layer1" padding="lg">
                        <Text size="lg" weight="bold">🏗️ Modo Construção</Text>
                        <Text size="sm" color="secondary">Não possuo presença pública ainda.</Text>
                    </Card>
                </div>
            </div>
        </RitualScreen>
    );
};

// --- 4. TELA DOURADA: TOPOLOGIA (TERRITÓRIO FÍSICO) ---
const ScreenTopology = () => {
    const { draft, advanceState, updateDraft } = useOnboarding();
    const navigate = useNavigate();

    // REDUNDANCY HUNT: Trust the draft first (Genesis Inference)
    const [hasTables, setHasTables] = useState(() => draft.topology?.dineIn ?? true);
    const [hasDelivery, setHasDelivery] = useState(() => draft.topology?.delivery ?? false);

    const handleNext = async () => {
        const topologyData = { dineIn: hasTables, delivery: hasDelivery, takeaway: true };
        updateDraft({ topology: topologyData });
        await advanceState('topology', { topology: topologyData });
        navigate('/onboarding/flow');
    };

    return (
        <RitualScreen
            id="topology"
            title="Território Operacional"
            subtitle={`Baseado no perfil ${draft.businessType || 'do estabelecimento'}, pré-configuramos sua estrutura.`}
            primaryAction={{ label: 'Confirmar Estrutura', onClick: handleNext }}
            secondaryAction={{ label: 'Voltar', onClick: () => navigate(-1) }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* LOGO INSTITUCIONAL DO CHEFIAPP */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <Text size="2xl" weight="black" style={{ letterSpacing: -1 }}>CHEF<span style={{ color: '#F5A623' }}>I</span>APP</Text>
                </div>

                <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase', marginBottom: 4 }}>Canais Ativos</Text>

                <div
                    onClick={() => setHasTables(!hasTables)}
                    style={{
                        padding: 16, borderRadius: 12, cursor: 'pointer',
                        border: hasTables ? '1px solid #F5A623' : '1px solid #333',
                        backgroundColor: hasTables ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 24 }}>🪑</div>
                        <div>
                            <Text size="md" weight="bold">Salão com Mesas</Text>
                            <Text size="sm" color="secondary">Gestão de mesas, garçons e comandos.</Text>
                        </div>
                    </div>
                    {hasTables && <Text>✅</Text>}
                </div>

                <div
                    onClick={() => setHasDelivery(!hasDelivery)}
                    style={{
                        padding: 16, borderRadius: 12, cursor: 'pointer',
                        border: hasDelivery ? '1px solid #F5A623' : '1px solid #333',
                        backgroundColor: hasDelivery ? 'rgba(245, 166, 35, 0.1)' : 'transparent',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 24 }}>🛵</div>
                        <div>
                            <Text size="md" weight="bold">Delivery & Encomendas</Text>
                            <Text size="sm" color="secondary">Fluxo de expedição e logística.</Text>
                        </div>
                    </div>
                    {hasDelivery && <Text>✅</Text>}
                </div>
            </div>
        </RitualScreen>
    );
};

// --- 5. TELA DOURADA: FLUXO (RITMO DE OPERAÇÃO) ---
const ScreenFlow = () => {
    const { draft, advanceState, updateDraft } = useOnboarding();
    const navigate = useNavigate();

    // TRUST THE DRAFT (Already inferred by SystemIdentity)
    const [style, setStyle] = useState<'carte' | 'quick'>(() => {
        return draft.flowType === 'a_la_carte' ? 'carte' : 'quick';
    });

    const handleNext = async () => {
        const flow = style === 'carte' ? 'a_la_carte' : 'fast_casual';
        updateDraft({ flowType: flow });
        await advanceState('flow', { flowType: flow });
        navigate('/onboarding/cash');
    };

    return (
        <RitualScreen
            id="flow"
            title="Ritmo Operacional"
            subtitle="Identificamos este padrão de atendimento para sua operação."
            primaryAction={{ label: 'Confirmar Ritmo', onClick: handleNext }}
            secondaryAction={{ label: 'Voltar', onClick: () => navigate(-1) }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* LOGO INSTITUCIONAL DO CHEFIAPP */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <Text size="2xl" weight="black" style={{ letterSpacing: -1 }}>CHEF<span style={{ color: '#F5A623' }}>I</span>APP</Text>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase' }}>Modelo Sugerido:</Text>
                    <div style={{ padding: '2px 8px', borderRadius: 4, background: '#F5A623', color: 'black', fontWeight: 'bold', fontSize: 10 }}>RECOMENDADO</div>
                </div>

                <Button
                    variant={style === 'carte' ? 'solid' : 'outline'}
                    tone={style === 'carte' ? 'action' : 'neutral'}
                    onClick={() => setStyle('carte')}
                    style={{ justifyContent: 'flex-start', height: 'auto', padding: 16 }}
                >
                    <div style={{ textAlign: 'left' }}>
                        <Text weight="bold" style={{ display: 'block' }}>À La Carte (Tradicional)</Text>
                        <Text size="sm" style={{ opacity: 0.8 }}>Senta ➡️ Pede ➡️ Come ➡️ Paga</Text>
                    </div>
                </Button>

                <Button
                    variant={style === 'quick' ? 'solid' : 'outline'}
                    tone={style === 'quick' ? 'action' : 'neutral'}
                    onClick={() => setStyle('quick')}
                    style={{ justifyContent: 'flex-start', height: 'auto', padding: 16 }}
                >
                    <div style={{ textAlign: 'left' }}>
                        <Text weight="bold" style={{ display: 'block' }}>Fast / Balcão</Text>
                        <Text size="sm" style={{ opacity: 0.8 }}>Pede ➡️ Paga ➡️ Recebe</Text>
                    </div>
                </Button>
            </div>
        </RitualScreen>
    );
};

// --- 6. TELA DOURADA: CAIXA (COFRE & CÂMBIO) ---
const ScreenCash = () => {
    const { draft, advanceState, updateDraft } = useOnboarding();
    const navigate = useNavigate();

    // Auto-detect currency based on Country Code, or use draft
    const currency = draft.finance?.currency || (draft.countryCode === 'PT' || draft.countryCode === 'ES' ? 'EUR (€)' : 'BRL (R$)');
    const methodRaw = draft.finance?.methods?.[2] || (draft.countryCode === 'PT' ? 'mbway' : draft.countryCode === 'ES' ? 'bizum' : 'pix');
    const mainMethod = methodRaw === 'mbway' ? 'MBWay' : methodRaw === 'bizum' ? 'Bizum' : methodRaw === 'pix' ? 'Pix' : methodRaw;

    const handleNext = async () => {
        const financeData = { currency: currency, methods: ['cash', 'card', mainMethod.toLowerCase()] };
        updateDraft({ finance: financeData });
        await advanceState('cash', { finance: financeData });
        navigate('/onboarding/team');
    };

    return (
        <RitualScreen
            id="cash"
            title="Ritual de Câmbio"
            subtitle="Sincronização de moeda e meios de pagamento fundamentais."
            primaryAction={{ label: 'Registrar Financeiro', onClick: handleNext }}
            secondaryAction={{ label: 'Voltar', onClick: () => navigate(-1) }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* LOGO INSTITUCIONAL DO CHEFIAPP */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <Text size="2xl" weight="black" style={{ letterSpacing: -1 }}>CHEF<span style={{ color: '#F5A623' }}>I</span>APP</Text>
                </div>

                <Card surface="layer2" padding="md">
                    <Text size="xs" color="secondary" weight="bold">MOEDA DETECTADA</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>{currency}</div>
                </Card>

                <div>
                    <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Métodos de Pagamento Sugeridos</Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ padding: '8px 16px', background: '#333', borderRadius: 8, fontSize: '14px' }}>💵 Dinheiro</span>
                        <span style={{ padding: '8px 16px', background: '#333', borderRadius: 8, fontSize: '14px' }}>💳 Cartão</span>
                        <span style={{ padding: '8px 16px', background: 'rgba(245, 166, 35, 0.1)', border: '1px solid #F5A623', borderRadius: 8, fontSize: '14px', color: '#F5A623' }}>📱 {mainMethod}</span>
                    </div>
                </div>
            </div>
        </RitualScreen>
    );
};

// --- 7. TELA DOURADA: EQUIPE (HIERARQUIA HUMANA) ---
const ScreenTeam = () => {
    const { draft, updateDraft, advanceState } = useOnboarding();
    const navigate = useNavigate();

    // Default or Existing state
    const [waiters, setWaiters] = useState(draft.teamStructure?.expectedWaiters || 2);
    const [cooks, setCooks] = useState(draft.teamStructure?.expectedCooks || 2);
    const [hasManager, setHasManager] = useState(draft.teamStructure?.hasManager || false);

    const handleNext = async () => {
        const structure = {
            expectedWaiters: waiters,
            expectedCooks: cooks,
            hasManager,
            hasCashier: true // Default for now
        };
        updateDraft({ teamStructure: structure });
        await advanceState('team', { teamStructure: structure });
        navigate('/onboarding/consecration');
    };

    return (
        <RitualScreen
            id="team"
            title="Arquitetura de Equipe"
            subtitle="Defina o esqueleto humano da sua operação. Quem ocupará o espaço?"
            primaryAction={{ label: 'Confirmar Estrutura', onClick: handleNext }}
            secondaryAction={{ label: 'Voltar', onClick: () => navigate(-1) }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480, margin: '0 auto' }}>
                {/* LOGO INSTITUCIONAL DO CHEFIAPP */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <Text size="2xl" weight="black" style={{ letterSpacing: -1 }}>CHEF<span style={{ color: '#F5A623' }}>I</span>APP</Text>
                </div>

                <Card surface="layer2" padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 32 }}>🤵</div>
                        <div style={{ flex: 1 }}>
                            <Text weight="bold">Salão / Atendimento</Text>
                            <Text size="sm" color="secondary">Garçons e atendentes de mesa.</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Button size="sm" variant="outline" onClick={() => setWaiters(Math.max(0, waiters - 1))}>-</Button>
                            <Text size="xl" weight="bold">{waiters}</Text>
                            <Button size="sm" variant="outline" onClick={() => setWaiters(waiters + 1)}>+</Button>
                        </div>
                    </div>
                </Card>

                <Card surface="layer2" padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 32 }}>🧑‍🍳</div>
                        <div style={{ flex: 1 }}>
                            <Text weight="bold">Cozinha / Produção</Text>
                            <Text size="sm" color="secondary">Chefs, auxiliares e copeiros.</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Button size="sm" variant="outline" onClick={() => setCooks(Math.max(0, cooks - 1))}>-</Button>
                            <Text size="xl" weight="bold">{cooks}</Text>
                            <Button size="sm" variant="outline" onClick={() => setCooks(cooks + 1)}>+</Button>
                        </div>
                    </div>
                </Card>

                <div
                    onClick={() => setHasManager(!hasManager)}
                    style={{
                        padding: 24, borderRadius: 12, cursor: 'pointer',
                        border: hasManager ? '1px solid #F5A623' : '1px solid #333',
                        background: hasManager ? 'rgba(245, 166, 35, 0.05)' : 'rgba(255,255,255,0.02)',
                        display: 'flex', alignItems: 'center', gap: 16
                    }}
                >
                    <div style={{ fontSize: 32, opacity: hasManager ? 1 : 0.5 }}>👔</div>
                    <div style={{ flex: 1 }}>
                        <Text weight="bold" color={hasManager ? 'primary' : 'secondary'}>Gerência Operacional</Text>
                        <Text size="sm" color="secondary">Existe um gerente além de você?</Text>
                    </div>
                    {hasManager ? <Text size="xl">✅</Text> : <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #666' }} />}
                </div>

                <Text size="xs" color="secondary" style={{ textAlign: 'center', marginTop: 16 }}>
                    * Você poderá convidar as pessoas reais após a ativação do sistema.
                </Text>
            </div>
        </RitualScreen>
    );
};


// --- 7. TELA DOURADA: CONSAGRAÇÃO (O NASCIMENTO) ---
const ScreenConsecration = () => {
    const { draft, consecrateSystem } = useOnboarding();
    const navigate = useNavigate();
    const [statusIndex, setStatusIndex] = useState(0);
    const [isSealing, setIsSealing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const statusMessages = [
        "Validando Provas de Existência...",
        "Assinando Constituição Soberana...",
        "Emitindo Permit de Operação...",
        "Consagrando Sistema..."
    ];

    // steps removed; RitualScreen handles checks internally
    const handleConsecration = async () => {
        if (!draft.teamStructure) {
            alert('Erro: Estrutura de equipe não definida.');
            navigate('/onboarding/team');
            return;
        }

        setIsSealing(true);
        try {
            // Ritual de Animação (Fast-Forwarded)
            setStatusIndex(0);

            // O Ato Real (DB)
            await consecrateSystem();

            setStatusIndex(3);

            // Fim do Ritual -> Vai para Fundação (Handoff)
            navigate('/onboarding/foundation');
        } catch (err: any) {
            console.error("Consecration Failed:", err);
            setError(err.message || "Falha no ritual de consagração.");
            setIsSealing(false);
        }
    };

    if (error) {
        return (
            <RitualScreen
                id="consecration"
                title="Falha na Consagração"
                subtitle="O sistema rejeitou o boot."
            >
                <Card surface="layer1" padding="lg" style={{ border: '1px solid #ff453a' }}>
                    <Text color="destructive" style={{ marginBottom: 16, display: 'block' }}>{error}</Text>
                    <Button tone="neutral" onClick={() => setError(null)}>Tentar Novamente</Button>
                </Card>
            </RitualScreen>
        );
    }

    if (isSealing) {
        return (
            <RitualScreen
                id="consecration"
                title="Consagrando..."
                subtitle="O sistema está nascendo."
            >
                <Card surface="layer2" padding="xl" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: 24, fontSize: 40, animation: 'pulse 2s infinite' }}>⚡</div>
                    <Text size="xl" weight="bold" style={{ marginBottom: 8 }}>{statusMessages[statusIndex]}</Text>
                    <Text size="sm" color="tertiary">Aguarde a finalização do protocolo.</Text>
                    <style>{`@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
                </Card>
            </RitualScreen>
        );
    }

    // Tela de Revisão Final antes do "Click"
    return (
        <RitualScreen
            id="consecration"
            title="Consagração"
            subtitle="O ato final de fundação."
            primaryAction={{ label: 'Concluir Fundação', onClick: handleConsecration }}
            secondaryAction={{ label: 'Revisar Leis', onClick: () => navigate(-1) }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* LOGO INSTITUCIONAL DO CHEFIAPP */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <Text size="2xl" weight="black" style={{ letterSpacing: -1 }}>CHEF<span style={{ color: '#F5A623' }}>I</span>APP</Text>
                </div>

                <Card surface="layer2" padding="xl" style={{ border: '1px solid #333' }}>
                    <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '1px solid #333', paddingBottom: 16 }}>
                        <Text size="xs" color="secondary" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: 2 }}>{draft.onboardingLevel === 'founder' ? 'Modo Construção' : 'Licença de Operação'}</Text>
                        <br />
                        <Text size="2xl" weight="black" color="primary">{draft.restaurantName}</Text>
                        <Text size="md" color="secondary">{draft.city}</Text>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text color="secondary">Soberano</Text>
                            <Text weight="bold">{draft.userName}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text color="secondary">Nível de Realidade</Text>
                            <Text weight="bold" color="action">
                                {draft.onboardingLevel === 'verified_gold' ? '🏆 GOLD (Full)' :
                                    draft.onboardingLevel === 'verified_silver' ? '🥈 SILVER (Ops)' :
                                        draft.onboardingLevel === 'verified_bronze' ? '🥉 BRONZE (Delivery)' :
                                            '🚧 FOUNDER (Construction)'}
                            </Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text color="secondary">Módulos Ativos</Text>
                            <Text weight="bold">{draft.modulesUnlocked?.length || 0} Unidades</Text>
                        </div>
                    </div>

                    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed #333', textAlign: 'center' }}>
                        <Text size="xs" color="tertiary" style={{ fontFamily: 'monospace' }}>ID: {draft.tenantId || 'PENDING_MINT'}</Text>
                        <Text size="xs" color="secondary" style={{ display: 'block', marginTop: 8 }}>
                            Ao inaugurar, você declara que as informações fornecidas são verdadeiras e assume responsabilidade legal pela operação.
                        </Text>
                    </div>
                </Card>
            </div>
        </RitualScreen>
    );
};

// --- 8. TELA FINAL: HANDOFF (SOVEREIGN FOUNDATION) ---
function ScreenFoundation() {
    const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>(() => {
        const w = window.innerWidth;
        if (w < 768) return 'mobile';
        if (w < 1024) return 'tablet';
        return 'desktop';
    });

    const [isConsolidating, setIsConsolidating] = useState(false);

    useEffect(() => {
        const handleResize = async () => {
            const w = window.innerWidth;
            let currentDevice: 'mobile' | 'tablet' | 'desktop' = 'desktop';
            if (w < 768) currentDevice = 'mobile';
            else if (w < 1024) currentDevice = 'tablet';

            setDevice(currentDevice);
            const { setTabIsolated } = await import('../../core/storage/TabIsolatedStorage');
            setTabIsolated('chefiapp_device_role', currentDevice);
        };

        // Initial set
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const copyLink = () => {
        const url = window.location.origin + '/app/dashboard';
        navigator.clipboard.writeText(url);
        alert('Link do Painel copiado com sucesso.\nEnvie para seu computador para iniciar a operação.');
    };

    const enterDashboard = () => {
        setIsConsolidating(true);
        // User Request: "juntando todas as informações"
        setTimeout(() => {
            window.location.href = '/app/dashboard';
        }, 2500);
    };

    if (isConsolidating) {
        return (
            <RitualScreen
                id="loading"
                title="Consolidando Lei de Fundação..."
                subtitle="Juntando todas as informações para o Banco e Painel de Comando."
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '40px 0' }}>
                    <div style={{ width: 60, height: 60, border: '4px solid #333', borderTopColor: '#F5A623', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ textAlign: 'center', maxWidth: 400 }}>
                        <Text size="lg" weight="bold" style={{ display: 'block', marginBottom: 8 }}>Finalizando Arquitetura</Text>
                        <Text size="md" color="secondary">Estamos gerando o núcleo operacional do seu restaurante com base nas definições deste ritual.</Text>
                    </div>
                </div>
            </RitualScreen>
        );
    }

    // 📱 MOBILE VIEW (Companion / Foundation)
    if (device === 'mobile') {
        return (
            <RitualScreen
                id="foundation"
                title="Fundação Concluída"
                subtitle="Sua entidade soberana nasceu com sucesso."
                primaryAction={{
                    label: 'Baixar App ChefIApp',
                    onClick: () => alert('Em breve: Link para Loja de Apps.'),
                    disabled: false // Future: leads to store
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: 64 }}>📱</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Text size="xl" weight="bold">Modo Companion Ativado</Text>
                        <Text size="md" color="secondary">
                            Este dispositivo funciona como controle remoto, alertas e acompanhamento da operação.
                        </Text>
                    </div>

                    <Card surface="layer2" padding="lg" style={{ border: '1px solid #F5A623', background: 'rgba(245, 166, 35, 0.05)' }}>
                        <Text weight="bold" color="action" style={{ display: 'block', marginBottom: 8 }}>PARA OPERAR</Text>
                        <Text size="sm">
                            Para acesso completo a pedidos, caixa e cozinha, utilize um <strong style={{ color: 'white' }}>Computador</strong> ou <strong style={{ color: 'white' }}>Tablet</strong>.
                        </Text>
                    </Card>

                    <div style={{ textAlign: 'left', width: '100%', padding: '0 8px', opacity: 0.8 }}>
                        <Text size="xs" weight="bold" color="secondary" style={{ textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>ℹ️ O que posso fazer pelo celular?</Text>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: '#888' }}>
                            <li>Alertas de pedidos</li>
                            <li>Status do restaurante</li>
                            <li>Notificações importantes</li>
                        </ul>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                        <Button tone="neutral" variant="outline" onClick={copyLink}>
                            🔗 Copiar Link da Operação
                        </Button>
                    </div>
                </div>
            </RitualScreen>
        );
    }

    // 💻 DESKTOP VIEW (Command Center)
    if (device === 'desktop') {
        return (
            <RitualScreen
                id="foundation"
                title="Ativação do Sistema Sovereign"
                subtitle="O nascimento da sua entidade digital. Selando as leis da operação."
                primaryAction={{
                    label: 'Entrar no Painel Operacional',
                    onClick: enterDashboard,
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: 64 }}>🖥️</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Text size="xl" weight="bold">Centro de Comando Operacional</Text>
                        <Text size="md" color="secondary">
                            Operação, pedidos, caixa e decisões em tempo real.
                        </Text>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                        <Button tone="neutral" variant="ghost" onClick={copyLink}>
                            🔗 Link para outros dispositivos
                        </Button>
                    </div>
                </div>
            </RitualScreen>
        );
    }

    // 📟 TABLET VIEW (Hybrid)
    return (
        <RitualScreen
            id="foundation"
            title="Fundação Concluída"
            subtitle="Este dispositivo está autorizado a operar."
            primaryAction={{
                label: 'Entrar no Painel Operacional',
                onClick: enterDashboard,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 64 }}>📟</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Text size="xl" weight="bold">Tablet Detectado</Text>
                    <Text size="md" color="secondary">
                        Acesso autorizado para POS, Caixa e Cozinha.
                    </Text>
                </div>

                <Card surface="layer1" padding="md" style={{ border: '1px dashed #666' }}>
                    <Text size="sm" color="tertiary">
                        Algumas áreas administrativas e relatórios avançados funcionam melhor em Desktop.
                    </Text>
                </Card>
            </div>
        </RitualScreen>
    );
}


const OnboardingWizard = () => {
    const { loading, entryContext } = useOnboarding();
    const navigate = useNavigate();

    // Loading State
    if (loading) {
        return (
            <RitualScreen id="loading" title="Carregando..." subtitle="Aguarde um instante.">
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Skeleton variant="rectangular" width={400} height={200} />
                </div>
            </RitualScreen>
        );
    }

    return (
        <Routes>
            {/* FOE v2: IDENTITY FIRST (Role-Agnostic Entry) */}
            <Route path="identity" element={<ScreenSystemIdentity />} />
            <Route path="existence" element={<ScreenExistence />} />

            {/* DECISION POINT: Only for Invite Managers */}
            {/* DECISION POINT: Only for Invite Managers */}
            <Route
                path="start"
                element={
                    entryContext === 'invite_manager'
                        ? <ScreenAuthority />
                        : <Navigate to="/onboarding/identity" replace />
                }
            />
            {/* Redundant safety route */}
            <Route path="authority" element={<ScreenAuthority />} />

            {/* 🛡️ PROTECTED ROUTES (Require Role = Owner) */}
            <Route path="topology" element={<ScreenTopology />} />
            <Route path="flow" element={<ScreenFlow />} />
            <Route path="cash" element={<ScreenCash />} />
            <Route path="team" element={<ScreenTeam />} />
            <Route path="consecration" element={<ScreenConsecration />} />
            <Route path="foundation" element={<ScreenFoundation />} />

            {/* INVITE PATH */}
            {/* INVITE PATH - MOVED TO GLOBAL /join */}

            {/* DEFAULT: Check Context & Draft to Decide Entry */}
            <Route path="*" element={<Navigate to="/onboarding/start" replace />} />
        </Routes>
    );
};

export default OnboardingWizard;
