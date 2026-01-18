import React, { useState } from 'react';
import { Button } from '../../ui/design-system/primitives/Button';
import { Card } from '../../ui/design-system/primitives/Card';
import { Text } from '../../ui/design-system/primitives/Text';
import { colors as Colors } from '../../ui/design-system/tokens/colors';
import { spacing as Spacing } from '../../ui/design-system/tokens/spacing';
import { radius as Radius } from '../../ui/design-system/tokens/radius';
import { typography as Typography } from '../../ui/design-system/tokens/typography';
import { InlineAlert } from '../../ui/design-system/InlineAlert';
import type { ParsedMenuItem } from './MenuSharedTypes';
import { generateMenu, generateFromImage, generateFromUrl } from './menuGenerator';
import { supabase } from '../../core/supabase';
import { useMenuState } from './useMenuState';
import { MENU_TEMPLATES, MenuTemplateId } from './MenuTemplates';

interface MenuAIProps {
    onClose: () => void;
    onSuccess: (items: ParsedMenuItem[]) => void;
    restaurantId: string;
}

export const MenuAI: React.FC<MenuAIProps> = ({ onClose, onSuccess, restaurantId }) => {
    const [activeTab, setActiveTab] = useState<'concept' | 'photo' | 'link' | 'template'>('template');
    const [step, setStep] = useState<'input' | 'loading' | 'preview'>('input');

    // Concept State
    const [cuisine, setCuisine] = useState('');
    const [vibe, setVibe] = useState('');

    // Photo State
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

    // Link State
    const [linkUrl, setLinkUrl] = useState('');

    // Template State
    const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplateId | null>(null);

    // Output State
    const [items, setItems] = useState<ParsedMenuItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const { actions } = useMenuState();

    const handleProcess = async () => {
        setStep('loading');
        setError(null);
        try {
            let generated: ParsedMenuItem[] = [];

            if (activeTab === 'template') {
                if (!selectedTemplate) throw new Error('Selecione um template');
                generated = MENU_TEMPLATES[selectedTemplate].items;
                // Add tiny delay for effect
                await new Promise(r => setTimeout(r, 800));
            } else if (activeTab === 'concept') {
                if (!cuisine) throw new Error('Selecione um conceito');
                generated = await generateMenu({ cuisine, vibe, language: 'pt' });
            } else if (activeTab === 'photo') {
                if (!selectedPhoto) throw new Error('Selecione uma foto');
                generated = await generateFromImage(selectedPhoto);
            } else if (activeTab === 'link') {
                if (!linkUrl) throw new Error('Insira uma URL válida');
                generated = await generateFromUrl(linkUrl);
            }

            setItems(generated);
            setStep('preview');
        } catch (err: any) {
            setError(err.message || 'Erro ao processar');
            setStep('input');
        }
    };

    const handleImport = async () => {
        setBusy(true);
        try {
            if (!restaurantId) throw new Error("ID do restaurante inválido");

            // 1. Categories
            // Normalize categories: trim and filter empty
            const uniqueCats = Array.from(new Set(items.map(i => i.categoria?.trim()).filter(Boolean))) as string[];
            const categoryMap = new Map<string, string>();

            for (const catName of uniqueCats) {
                // Check existing
                let { data: matches, error: fetchErr } = await supabase
                    .from('gm_menu_categories')
                    .select('id')
                    .eq('restaurant_id', restaurantId)
                    .ilike('name', catName)
                    .limit(1);

                if (fetchErr) {
                    console.error('Error fetching category:', fetchErr);
                    throw new Error(`Erro ao buscar categoria ${catName}`);
                }

                const existing = matches?.[0];

                if (existing) {
                    categoryMap.set(catName, existing.id);
                } else {
                    // Create new
                    const { data: created, error: createErr } = await supabase
                        .from('gm_menu_categories')
                        .insert({
                            restaurant_id: restaurantId,
                            name: catName,
                            sort_order: 99
                        })
                        .select()
                        .single();

                    if (createErr) {
                        console.error('Error creating category:', createErr);
                        throw new Error(`Erro ao criar categoria ${catName}`);
                    }
                    if (created) categoryMap.set(catName, created.id);
                }
            }

            // 2. Products
            const products = items
                .filter(item => {
                    const catName = item.categoria?.trim();
                    return catName && categoryMap.has(catName);
                })
                .map(item => ({
                    restaurant_id: restaurantId,
                    category_id: categoryMap.get(item.categoria.trim())!, // FIX: Use category_id explicitly
                    // Fallback for older schemas/triggers if needed, but category_id is preferred
                    name: item.produto,
                    price_cents: Math.round(item.preco * 100),
                    // description: item.descricao,
                    available: item.ativo
                }));

            if (products.length === 0) {
                throw new Error("Nenhum produto válido para salvar. Verifique as categorias.");
            }

            const { error: insErr } = await supabase.from('gm_products').insert(products);
            if (insErr) {
                console.error('Error inserting products:', insErr);
                throw insErr;
            }

            await actions.refresh();
            onSuccess(items);

        } catch (err: any) {
            console.error('MenuAI Import Error:', err);
            setError(err.message || 'Erro ao processar menu');
        } finally {
            setBusy(false);
        }
    };

    const isProcessDisabled = () => {
        switch (activeTab) {
            case 'concept': return !cuisine;
            case 'photo': return !selectedPhoto;
            case 'link': return !linkUrl;
            case 'template': return !selectedTemplate;
        }
    };

    const getProcessButtonLabel = () => {
        switch (activeTab) {
            case 'concept': return 'Criar Conceito';
            case 'photo': return 'Ler Foto';
            case 'link': return 'Ler Site';
            case 'template': return 'Ver Template';
        }
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER HELPERS
    // ─────────────────────────────────────────────────────────────

    const renderTabs = () => (
        <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg, borderBottom: `1px solid ${Colors.border}`, paddingBottom: Spacing.md }}>
            {(['template', 'concept', 'photo', 'link'] as const).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                        padding: `${Spacing.sm} ${Spacing.md}`,
                        borderRadius: Radius.md,
                        border: 'none',
                        backgroundColor: activeTab === tab ? Colors.primary : 'transparent',
                        color: activeTab === tab ? Colors.surface : Colors.text,
                        cursor: 'pointer',
                        fontWeight: activeTab === tab ? 600 : 400,
                        transition: 'all 0.2s'
                    }}
                >
                    {tab === 'template' && '⚡ Templates'}
                    {tab === 'concept' && '💡 Conceito'}
                    {tab === 'photo' && '📸 Foto'}
                    {tab === 'link' && '🌐 Link'}
                </button>
            ))}
        </div>
    );

    const renderTemplateInput = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: Spacing.md }}>
            {Object.values(MENU_TEMPLATES).map(tpl => (
                <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    style={{
                        padding: Spacing.md,
                        border: `2px solid ${selectedTemplate === tpl.id ? Colors.primary : Colors.border}`,
                        borderRadius: Radius.md,
                        cursor: 'pointer',
                        backgroundColor: selectedTemplate === tpl.id ? Colors.surfaceHighlight : Colors.surface,
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ fontSize: 32, marginBottom: Spacing.sm }}>{tpl.icon}</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{tpl.label}</div>
                    <div style={{ fontSize: 12, color: Colors.textMuted }}>{tpl.description}</div>
                </div>
            ))}
        </div>
    );

    const renderConceptInput = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.md }}>
            <div>
                <label style={{ display: 'block', marginBottom: Spacing.xs, fontSize: 13, fontWeight: 500 }}>
                    Tipo de Cozinha
                </label>
                <input
                    type="text"
                    value={cuisine}
                    onChange={e => setCuisine(e.target.value)}
                    placeholder="Ex: Italiana, Sushi, Hamburgueria..."
                    style={{
                        width: '100%', padding: Spacing.md,
                        borderRadius: Radius.md, border: `1px solid ${Colors.border}`,
                        fontSize: 14
                    }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: Spacing.xs, fontSize: 13, fontWeight: 500 }}>
                    Vibe / Estilo (Opcional)
                </label>
                <input
                    type="text"
                    value={vibe}
                    onChange={e => setVibe(e.target.value)}
                    placeholder="Ex: Descontraído, Luxuoso, Familiar..."
                    style={{
                        width: '100%', padding: Spacing.md,
                        borderRadius: Radius.md, border: `1px solid ${Colors.border}`,
                        fontSize: 14
                    }}
                />
            </div>
        </div>
    );

    const renderPhotoInput = () => (
        <div style={{
            border: `2px dashed ${Colors.border}`, borderRadius: Radius.lg,
            padding: Spacing.xl, textAlign: 'center', cursor: 'pointer',
            backgroundColor: Colors.surfaceHighlight
        }} onClick={() => document.getElementById('menu-photo-upload')?.click()}>
            <div style={{ fontSize: 48, marginBottom: Spacing.md }}>📸</div>
            <h3 style={Typography.h4}>Upload do Cardápio</h3>
            <p style={{ color: Colors.textMuted, fontSize: 13 }}>Tire uma foto ou carregue uma imagem do cardápio físico</p>
            <input
                id="menu-photo-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                    if (e.target.files?.[0]) setSelectedPhoto(e.target.files[0]);
                }}
            />
            {selectedPhoto && (
                <div style={{ marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: Colors.success, color: 'white', borderRadius: Radius.sm }}>
                    {selectedPhoto.name} selecionado
                </div>
            )}
        </div>
    );

    const renderLinkInput = () => (
        <div>
            <label style={{ display: 'block', marginBottom: Spacing.xs, fontSize: 13, fontWeight: 500 }}>
                Link do Cardápio (PDF ou Site)
            </label>
            <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://restaurante.com/menu"
                style={{
                    width: '100%', padding: Spacing.md,
                    borderRadius: Radius.md, border: `1px solid ${Colors.border}`,
                    fontSize: 14
                }}
            />
            <p style={{ marginTop: Spacing.sm, fontSize: 12, color: Colors.textMuted }}>
                Nossa IA irá ler o site e extrair os produtos automaticamente.
            </p>
        </div>
    );

    const renderLoading = () => (
        <div style={{ textAlign: 'center', padding: Spacing.xl }}>
            <div style={{ fontSize: 48, marginBottom: Spacing.md, animation: 'pulse 1.5s infinite' }}>🤖</div>
            <h3 style={Typography.h3}>A Mágica está acontecendo...</h3>
            <p style={{ color: Colors.textMuted }}>
                {activeTab === 'template' && 'Carregando template...'}
                {activeTab === 'concept' && `Criando conceito ${cuisine}...`}
                {activeTab === 'photo' && 'Lendo sua foto com Visão Computacional...'}
                {activeTab === 'link' && 'Lendo o site externo...'}
            </p>
        </div>
    );

    const renderPreview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ marginBottom: Spacing.md }}>
                <InlineAlert type="success" message={`Encontramos ${items.length} itens!`} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${Colors.border}`, borderRadius: Radius.md }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: Colors.surfaceHighlight }}>
                        <tr>
                            <th style={{ padding: Spacing.sm, textAlign: 'left' }}>Categoria</th>
                            <th style={{ padding: Spacing.sm, textAlign: 'left' }}>Produto</th>
                            <th style={{ padding: Spacing.sm, textAlign: 'right' }}>Preço</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${Colors.border}` }}>
                                <td style={{ padding: Spacing.sm }}>{item.categoria}</td>
                                <td style={{ padding: Spacing.sm }}>
                                    <strong>{item.produto}</strong>
                                    {item.descricao && <div style={{ fontSize: 11, color: Colors.textMuted }}>{item.descricao}</div>}
                                </td>
                                <td style={{ padding: Spacing.sm, textAlign: 'right' }}>{item.preco.toFixed(2)} €</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: Spacing.md, paddingTop: Spacing.md, borderTop: `1px solid ${Colors.border}` }}>
                <Button variant="ghost" onClick={() => setStep('input')}>Voltar</Button>
                <div style={{ display: 'flex', gap: Spacing.sm }}>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleImport} loading={busy}>
                        Confirmar e Salvar
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: '90%', maxWidth: '700px', height: '80vh',
                backgroundColor: Colors.surface, borderRadius: Radius.lg,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div style={{ padding: Spacing.md, borderBottom: `1px solid ${Colors.border}`, backgroundColor: Colors.surfaceHighlight }}>
                    <h2 style={{ ...Typography.h3, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ✨ ChefIApp Magic Menu
                    </h2>
                </div>

                <div style={{ flex: 1, padding: Spacing.lg, overflowY: 'auto' }}>

                    {step === 'input' && renderTabs()}

                    {error && <div style={{ marginBottom: Spacing.md }}><InlineAlert type="error" message={error} /></div>}

                    {step === 'input' && (
                        <>
                            {activeTab === 'template' && renderTemplateInput()}
                            {activeTab === 'concept' && renderConceptInput()}
                            {activeTab === 'photo' && renderPhotoInput()}
                            {activeTab === 'link' && renderLinkInput()}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: Spacing.xl }}>
                                <Button variant="primary" size="lg" onClick={handleProcess} disabled={isProcessDisabled()}>
                                    {getProcessButtonLabel()}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'loading' && renderLoading()}
                    {step === 'preview' && renderPreview()}
                </div>
            </div>
        </div>
    );
};
