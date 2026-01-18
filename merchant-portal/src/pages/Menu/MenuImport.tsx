import React, { useState, useRef } from 'react';
import { Button } from '../../ui/design-system/Button';
import { InlineAlert } from '../../ui/design-system/InlineAlert';
import { spacing as Spacing } from '../../ui/design-system/tokens/spacing';
import { colors as Colors } from '../../ui/design-system/tokens/colors';
import { radius as Radius } from '../../ui/design-system/tokens/radius';
import { typography as Typography } from '../../ui/design-system/tokens/typography';
import { parseMenuCSV, readFileAsText, downloadTemplate } from './csvParser';
import type { ParsedMenuItem } from './MenuSharedTypes';
import { supabase } from '../../core/supabase';
import { useMenuState } from './useMenuState';

interface MenuImportProps {
    restaurantId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function MenuImport({ restaurantId, onClose, onSuccess }: MenuImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedItems, setParsedItems] = useState<ParsedMenuItem[]>([]);
    const [errors, setErrors] = useState<any[]>([]);
    const [warnings, setWarnings] = useState<any[]>([]);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { actions } = useMenuState();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0]);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        try {
            const content = await readFileAsText(selectedFile);
            const { items, errors, warnings } = parseMenuCSV(content);
            setParsedItems(items);
            setErrors(errors);
            setWarnings(warnings);
            setStep('preview');
        } catch (err) {
            console.error(err);
            setErrors([{ message: 'Erro ao ler arquivo' }]);
        }
    };

    const handleImport = async () => {
        if (!parsedItems.length) return;
        setBusy(true);

        try {
            // 1. Get or create categories
            const uniqueCategories = Array.from(new Set(parsedItems.map(i => i.categoria)));
            const categoryMap = new Map<string, string>(); // name -> id

            for (const catName of uniqueCategories) {
                // Try to find existing
                let { data: matches, error: fetchErr } = await supabase
                    .from('gm_menu_categories')
                    .select('id')
                    .eq('restaurant_id', restaurantId)
                    .ilike('name', catName)
                    .limit(1);

                if (fetchErr) throw fetchErr;

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

                    if (createErr) throw createErr;
                    if (created) categoryMap.set(catName, created.id);
                }
            }

            // 3. Create Products
            const products = parsedItems
                .filter(item => {
                    const catName = item.categoria?.trim();
                    return catName && categoryMap.has(catName);
                })
                .map(item => ({
                    restaurant_id: restaurantId,
                    category: categoryMap.get(item.categoria.trim())!,
                    name: item.produto,
                    price_cents: Math.round(item.preco * 100),
                    // description excluded
                    available: item.ativo,
                    // stock omitted
                }));

            if (products.length === 0) throw new Error("No valid products to import");

            const { error: insErr } = await supabase.from('gm_products').insert(products);

            if (insErr) throw insErr;

            // Done
            await actions.refresh(); // Refresh global state
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error('Import error:', err);
            setErrors(prev => [...prev, { message: `Erro na importação: ${err.message}` }]);
        } finally {
            setBusy(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                width: '90%', maxWidth: '800px', maxHeight: '90vh',
                backgroundColor: Colors.surface, borderRadius: Radius.lg,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{ padding: Spacing.md, borderBottom: `1px solid ${Colors.border}` }}>
                    <h2 style={{ ...Typography.h3, margin: 0 }}>Importar Cardápio (CSV)</h2>
                    <p style={{ ...Typography.small, color: Colors.textMuted, margin: 0 }}>
                        Adicione vários itens de uma vez usando uma planilha.
                    </p>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: Spacing.md }}>

                    {step === 'upload' && (
                        <div
                            style={{
                                border: `2px dashed ${Colors.primary}40`,
                                borderRadius: Radius.md,
                                padding: Spacing.xl,
                                textAlign: 'center',
                                backgroundColor: `${Colors.primary}05`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = Colors.primary; }}
                            onDragLeave={e => { e.currentTarget.style.borderColor = `${Colors.primary}40`; }}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div style={{ fontSize: 48, marginBottom: Spacing.md }}>📂</div>
                            <h3 style={Typography.h4}>Clique ou arraste seu arquivo CSV aqui</h3>
                            <p style={{ color: Colors.textMuted }}>Formatos aceitos: .csv</p>
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />

                            <div style={{ marginTop: Spacing.lg }}>
                                <Button
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                                >
                                    📥 Baixar modelo de exemplo
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div>
                            <div style={{ display: 'flex', gap: Spacing.md, marginBottom: Spacing.md }}>
                                <div style={{ flex: 1 }}>
                                    <strong>Arquivo:</strong> {file?.name} ({parsedItems.length} itens encontrados)
                                </div>
                                <div>
                                    <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                                        Escolher outro
                                    </Button>
                                </div>
                            </div>

                            {errors.length > 0 && (
                                <div style={{ marginBottom: Spacing.md }}>
                                    <InlineAlert type="error" message={`Encontrados ${errors.length} erros que impedem a importação.`} />
                                    <div style={{
                                        marginTop: Spacing.xs, maxHeight: 100, overflowY: 'auto',
                                        background: '#331111', padding: Spacing.xs, borderRadius: Radius.sm, fontSize: 12
                                    }}>
                                        {errors.map((e, i) => (
                                            <div key={i}>Linha {e.lineNumber}: {e.message}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {warnings.length > 0 && (
                                <div style={{ marginBottom: Spacing.md }}>
                                    <InlineAlert type="warning" message={`Encontrados ${warnings.length} alertas (itens serão importados).`} />
                                </div>
                            )}

                            {/* Preview Table */}
                            <div style={{
                                border: `1px solid ${Colors.border}`, borderRadius: Radius.md,
                                overflowX: 'auto', maxHeight: '400px'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: Colors.surfaceHighlight }}>
                                        <tr>
                                            <th style={{ padding: Spacing.sm, textAlign: 'left' }}>Linha</th>
                                            <th style={{ padding: Spacing.sm, textAlign: 'left' }}>Categoria</th>
                                            <th style={{ padding: Spacing.sm, textAlign: 'left' }}>Produto</th>
                                            <th style={{ padding: Spacing.sm, textAlign: 'right' }}>Preço</th>
                                            <th style={{ padding: Spacing.sm, textAlign: 'center' }}>Ativo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedItems.map((item, i) => (
                                            <tr key={i} style={{ borderTop: `1px solid ${Colors.border}` }}>
                                                <td style={{ padding: Spacing.sm, color: Colors.textMuted }}>{item.lineNumber}</td>
                                                <td style={{ padding: Spacing.sm }}>{item.categoria}</td>
                                                <td style={{ padding: Spacing.sm }}>{item.produto}</td>
                                                <td style={{ padding: Spacing.sm, textAlign: 'right' }}>{item.preco.toFixed(2)} €</td>
                                                <td style={{ padding: Spacing.sm, textAlign: 'center' }}>{item.ativo ? '✅' : '❌'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: Spacing.md, borderTop: `1px solid ${Colors.border}`,
                    display: 'flex', justifyContent: 'flex-end', gap: Spacing.sm
                }}>
                    <Button variant="ghost" onClick={onClose} disabled={busy}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleImport}
                        disabled={busy || step !== 'preview' || errors.length > 0 || parsedItems.length === 0}
                        loading={busy}
                    >
                        {busy ? 'Importando...' : `Importar ${parsedItems.length} Itens`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
