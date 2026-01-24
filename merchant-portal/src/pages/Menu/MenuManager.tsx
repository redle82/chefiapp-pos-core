import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../../ui/design-system/domain/AdminSidebar';
import { Card } from '../../ui/design-system/primitives/Card';
import { Button } from '../../ui/design-system/primitives/Button';
import { Text } from '../../ui/design-system/primitives/Text';
import { Badge } from '../../ui/design-system/primitives/Badge';
import { Input } from '../../ui/design-system/primitives/Input';
import { Select } from '../../ui/design-system/primitives/Select';
import { EmptyState } from '../../ui/design-system/primitives/EmptyState';
import { useToast } from '../../ui/design-system';
import { colors } from '../../ui/design-system/tokens/colors';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { useMenuState } from './useMenuState';

import { OSCopy } from '../../ui/design-system/sovereign/OSCopy';
import { MenuImport } from './MenuImport';
import { MenuAI } from './MenuAI';
import { VisibilityToggles, DEFAULT_VISIBILITY } from './VisibilityToggles';
import type { SurfaceVisibility } from './VisibilityToggles';

// ------------------------------------------------------------------
// 🍔 MENU MANAGER (State Driven)
// ------------------------------------------------------------------

export const MenuManager: React.FC = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const { viewState, error, data, actions, restaurantId } = useMenuState();
    const { categories, items } = data;

    // Staff-style browser tab title for isolated tool context
    useEffect(() => {
        document.title = 'ChefIApp POS — Menu';
        return () => { document.title = 'ChefIApp POS'; };
    }, []);

    // BUG-016 FIX: Visual error feedback
    useEffect(() => {
        if (error) {
            showError(error.message || OSCopy.menu.feedback.errorLoad);
        }
    }, [error, showError]);

    const [isEditing, setIsEditing] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [catName, setCatName] = useState('');
    const [itemName, setItemName] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [selectedCatId, setSelectedCatId] = useState('');

    // Inventory State
    const [trackStock, setTrackStock] = useState(false);
    const [stockQty, setStockQty] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    // Visibility State
    const [visibility, setVisibility] = useState<SurfaceVisibility>(DEFAULT_VISIBILITY);

    // --- HANDLERS ---
    const onSubmitCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newCat = await actions.addCategory(catName);
            setCatName('');
            setShowAddCategory(false);
            if (!selectedCatId) setSelectedCatId(newCat.id);

            success(OSCopy.menu.feedback.catCreated);
        } catch (err: any) {
            console.error(err);
            showError(err?.message || OSCopy.menu.feedback.errorCreateCat);
        }
    };

    const handleDeleteItem = async (itemId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!window.confirm(OSCopy.actions.confirm)) return; // Simple native confirm for now

        try {
            await actions.deleteItem(itemId);
            success(OSCopy.menu.feedback.prodDeleted);
        } catch (err: any) {
            console.error(err);
            showError(err?.message || OSCopy.menu.feedback.errorDeleteProd);
        }
    };

    const onSubmitItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCatId && !editingItem) {
            showError('Selecione uma categoria primeiro');
            return;
        }
        try {
            const qty = trackStock ? parseInt(stockQty || '0') : 0;

            if (editingItem) {
                // Update existing item
                await actions.updateItem(editingItem.id, {
                    name: itemName,
                    price: parseFloat(itemPrice),
                    category_id: selectedCatId || editingItem.category_id,
                    track_stock: trackStock,
                    stock_quantity: qty,
                    visibility
                });
                success(OSCopy.menu.feedback.prodUpdated);
            } else {
                // Create new item
                await actions.addItem(selectedCatId, itemName, parseFloat(itemPrice), trackStock, qty);
                success(OSCopy.menu.feedback.prodCreated);
            }
            // Reset
            setItemName('');
            setItemPrice('');
            setTrackStock(false);
            setStockQty('');
            setVisibility(DEFAULT_VISIBILITY);
            setShowAddItem(false);
            setEditingItem(null);
        } catch (err: any) {
            console.error(err);
            showError(err?.message || 'Erro ao salvar produto. Tente novamente.');
        }
    };

    const handleEditItem = (item: any) => {
        setEditingItem(item);
        setItemName(item.name);
        setItemPrice(item.price.toString());
        setSelectedCatId(item.category_id);

        // Load Inventory Data
        setTrackStock(item.track_stock || false);
        setStockQty(item.stock_quantity ? item.stock_quantity.toString() : '');

        // Visibility (handle legacy null)
        if (item.visibility) {
            setVisibility(item.visibility);
        } else {
            setVisibility(DEFAULT_VISIBILITY);
        }

        setShowAddItem(true);
        setIsEditing(true);
        // BUG-017 FIX: Scroll to form for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSyncMenu = async () => {
        try {
            setIsSyncing(true);
            // We need to implement syncExternal in useMenuState or just call invoke here.
            // Calling invoke directly for speed as useMenuState might not have it yet.
            const { supabase } = await import('../../core/supabase'); // Dynamic import using index
            const { data, error: fnError } = await supabase.functions.invoke('sync-menu-external', {
                body: { restaurantId }
            });

            if (fnError) throw fnError;

            success(`Sincronizado com sucesso! ${data.synced_items} itens enviados.`);
        } catch (err: any) {
            console.error(err);
            showError('Erro na sincronização. Tente novamente.');
        } finally {
            setIsSyncing(false);
        }
    };

    // --- RENDER HELPERS ---
    const renderDraftBanner = () => (
        <Card surface="layer2" style={{ border: `1px solid ${colors.modes.dashboard.warning.base}40`, backgroundColor: `${colors.modes.dashboard.warning.base}10` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: 4 }}>
                        <Badge status="preparing" label={OSCopy.menu.modeDraft} variant="soft" />
                    </div>
                    <Text size="sm" color="secondary">
                        {OSCopy.menu.draftBanner}
                    </Text>
                </div>
                <Button tone="action" onClick={() => navigate('/app/activation')}>
                    {OSCopy.menu.actions.activate}
                </Button>
            </div>
        </Card>
    );

    const renderEmptyState = () => (
        <EmptyState
            icon={<div style={{ fontSize: 64 }}>🍔</div>}
            title={OSCopy.menu.emptyTitle}
            description={OSCopy.menu.emptyDesc}
            action={{
                label: OSCopy.menu.actions.autoCreator,
                onClick: () => navigate('/app/menu/bootstrap')
            }}
            secondaryAction={{
                label: OSCopy.menu.actions.startZero,
                onClick: () => { setIsEditing(true); setShowAddCategory(true); }
            }}
        />
    );

    const renderHeader = () => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <Text size="3xl" weight="black" color="primary">{OSCopy.menu.title}</Text>
                <Text size="sm" color="tertiary">{OSCopy.menu.subtitle}</Text>
            </div>

            {viewState !== 'EMPTY' && (
                <div style={{ display: 'flex', gap: spacing[3] }}>
                    <Button
                        tone="neutral"
                        variant="ghost"
                        onClick={() => setShowAI(true)}
                    >
                        ✨ IA
                    </Button>

                    <Button
                        tone="neutral"
                        variant="ghost"
                        onClick={handleSyncMenu}
                        disabled={isSyncing}
                    >
                        {isSyncing ? '🔄 ...' : '☁️ Sync Delivery'}
                    </Button>

                    <Button
                        tone="neutral"
                        variant="ghost"
                        onClick={() => setShowImport(true)}
                    >
                        📤 Importar CSV
                    </Button>
                    <Button
                        tone={isEditing ? 'action' : 'neutral'}
                        variant={isEditing ? 'solid' : 'ghost'}
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? OSCopy.menu.actions.lock : OSCopy.menu.actions.edit}
                    </Button>

                    {isEditing && (
                        <>
                            <Button variant="outline" onClick={() => setShowAddCategory(!showAddCategory)}>
                                {OSCopy.menu.actions.addCategory}
                            </Button>
                            <Button tone="action" onClick={() => setShowAddItem(!showAddItem)}>
                                {OSCopy.menu.actions.addProduct}
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    const renderContextContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
            {categories.map(cat => (
                <section key={cat.id}>
                    <div style={{
                        paddingBottom: spacing[4], marginBottom: spacing[4],
                        borderBottom: `1px solid ${colors.modes.dashboard.border.subtle}`,
                        display: 'flex', alignItems: 'center', gap: spacing[3]
                    }}>
                        <Text size="xl" weight="bold" color="primary">{cat.name}</Text>
                        <Badge status="ready" label={`${items.filter(i => i.category_id === cat.id).length} items`} variant="outline" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: spacing[4] }}>
                        {items.filter(i => i.category_id === cat.id).map(item => (
                            <Card
                                key={item.id}
                                surface="layer2"
                                padding="md"
                                hoverable={isEditing}
                                onClick={isEditing ? () => handleEditItem(item) : undefined}
                                style={{ cursor: isEditing ? 'pointer' : 'default' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Text weight="bold" color="primary">{item.name}</Text>

                                            {/* Visibility Indicators */}
                                            <div style={{ display: 'flex', gap: 2, opacity: 0.6 }}>
                                                {(!item.visibility || item.visibility.tpv) && <span title="Visível no Caixa">📠</span>}
                                                {(!item.visibility || item.visibility.web) && <span title="Visível Online">🖥️</span>}
                                                {(!item.visibility || item.visibility.delivery) && <span title="Visível Delivery">🛵</span>}
                                            </div>
                                        </div>

                                        {/* Stock Indicator */}
                                        {item.track_stock && (
                                            <div style={{ marginTop: 4 }}>
                                                {item.stock_quantity > 0 ? (
                                                    <Badge status="success" label={`Estoque: ${item.stock_quantity}`} variant="soft" />
                                                ) : (
                                                    <Badge status="error" label="ESGOTADO" variant="solid" />
                                                )}
                                            </div>
                                        )}

                                        {/* BUG-017 FIX: Clickable Edit Button */}
                                        {isEditing && (
                                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditItem(item);
                                                    }}
                                                    style={{ padding: '4px 8px' }}
                                                >
                                                    {OSCopy.menu.actions.edit}
                                                </Button>
                                                <Button
                                                    tone="destructive"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => handleDeleteItem(item.id, e)}
                                                    style={{ padding: '4px 8px' }}
                                                >
                                                    🗑
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <Text weight="bold" color="success">
                                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: item.currency || 'EUR' }).format(item.price)}
                                        </Text>
                                        {item.cost_price > 0 && (
                                            <div>
                                                <Text size="xs" color={((item.price - item.cost_price) / item.price) < 0.3 ? 'destructive' : 'secondary'}>
                                                    Mg: {Math.round(((item.price - item.cost_price) / item.price) * 100)}%
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            ))
            }
        </div >
    );

    // --- MAIN RENDER ---
    return (
        <AdminLayout
            sidebar={<AdminSidebar activePath="/app/menu" onNavigate={navigate} />}
            content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>

                    {/* STATE RENDER: DRAFT WARNING */}
                    {viewState === 'DRAFT' && renderDraftBanner()}

                    {/* ALWAYS SHOW HEADER except LOADING */}
                    {viewState !== 'LOADING' && renderHeader()}

                    {/* FORMS - Only if Editing */}
                    {showAddCategory && isEditing && (
                        <Card surface="layer2" padding="lg">
                            <form onSubmit={onSubmitCategory} style={{ display: 'flex', gap: spacing[4], alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <Input
                                        label={OSCopy.menu.labels.catName}
                                        value={catName}
                                        onChange={e => setCatName(e.target.value)}
                                        placeholder={OSCopy.menu.labels.catPlaceholder}
                                        required
                                        fullWidth
                                    />
                                </div>
                                <Button tone="action" type="submit">{OSCopy.menu.actions.add}</Button>
                            </form>
                        </Card>
                    )}

                    {showAddItem && isEditing && (
                        <Card surface="layer2" padding="lg">
                            <Text size="lg" weight="bold" style={{ marginBottom: spacing[4] }}>
                                {editingItem ? 'Editar Produto' : 'Adicionar Produto'}
                            </Text>
                            <form onSubmit={onSubmitItem} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: spacing[4], alignItems: 'flex-end' }}>
                                <div>
                                    <Input
                                        label={OSCopy.menu.labels.prodName}
                                        value={itemName}
                                        onChange={e => setItemName(e.target.value)}
                                        placeholder={OSCopy.menu.labels.prodPlaceholder}
                                        required
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    <Input
                                        label={OSCopy.menu.labels.price}
                                        type="number"
                                        step="0.01"
                                        value={itemPrice}
                                        onChange={e => setItemPrice(e.target.value)}
                                        placeholder={OSCopy.menu.labels.pricePlaceholder}
                                        required
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    {/* BUG-015 FIX: UDS Select */}
                                    <Select
                                        label={OSCopy.menu.labels.category}
                                        value={selectedCatId}
                                        onChange={e => setSelectedCatId(e.target.value)}
                                        fullWidth
                                    >
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </Select>
                                </div>

                                {/* Inventory Controls */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={trackStock}
                                            onChange={e => setTrackStock(e.target.checked)}
                                        />
                                        <Text size="sm" weight="bold">Controlar Estoque?</Text>
                                    </label>

                                    {trackStock && (
                                        <Input
                                            label="Qtd."
                                            type="number"
                                            value={stockQty}
                                            onChange={e => setStockQty(e.target.value)}
                                            placeholder="0"
                                            fullWidth
                                        />
                                    )}
                                </div>

                                {/* Visibility (New Column) */}
                                <div>
                                    <VisibilityToggles value={visibility} onChange={setVisibility} />
                                </div>

                                <div style={{ display: 'flex', gap: spacing[2] }}>
                                    <Button tone="action" type="submit">{editingItem ? OSCopy.menu.actions.save : OSCopy.menu.actions.add}</Button>
                                    {editingItem && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setEditingItem(null);
                                                setItemName('');
                                                setItemPrice('');
                                                setShowAddItem(false);
                                            }}
                                        >
                                            {OSCopy.menu.actions.cancel}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* STATE RENDER: CONTENT SWITCH */}
                    {viewState === 'LOADING' && (
                        <div style={{ padding: spacing[12], textAlign: 'center' }}>
                            <Text color="tertiary">Sincronizando arquitetura...</Text>
                        </div>
                    )}

                    {viewState === 'EMPTY' && renderEmptyState()}

                    {(viewState === 'ACTIVE' || viewState === 'DRAFT') && renderContextContent()}

                    {viewState === 'ERROR' && (
                        <div style={{ padding: spacing[8], border: `1px solid ${colors.modes.dashboard.destructive.base}`, borderRadius: 8 }}>
                            <Text color="destructive">{OSCopy.menu.feedback.errorLoad}: {JSON.stringify(error)}</Text>
                            <Button tone="neutral" variant="outline" onClick={() => actions.refresh()}>{OSCopy.actions.loading}</Button>
                        </div>
                    )}

                    {showImport && restaurantId && (
                        <MenuImport
                            restaurantId={restaurantId}
                            onClose={() => setShowImport(false)}
                            onSuccess={() => {
                                setShowImport(false);
                                success('Menu importado com sucesso!');
                            }}
                        />
                    )}

                    {showAI && restaurantId && (
                        <MenuAI
                            restaurantId={restaurantId}
                            onClose={() => setShowAI(false)}
                            onSuccess={(items) => {
                                setShowAI(false);
                                success(`Menu mágico criado com ${items.length} itens!`);
                            }}
                        />
                    )}
                </div>
            }
        />
    );
};
