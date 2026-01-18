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
import { useToast } from '../../ui/design-system';
import { spacing } from '../../ui/design-system/tokens/spacing';
import { colors } from '../../ui/design-system/tokens/colors';
import { InventoryEngine } from '../../core/inventory/InventoryEngine';
import { InventoryItem, Recipe } from './context/InventoryTypes';
import { supabase } from '../../core/supabase/client';
import { useSupabaseAuth } from '../../core/auth/SupabaseAuthProvider';

type Tab = 'ingredients' | 'recipes';

export const InventoryManager: React.FC = () => {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const { restaurantId } = useSupabaseAuth();

    const [activeTab, setActiveTab] = useState<Tab>('ingredients');

    // Ingredients State
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [showCriticalOnly, setShowCriticalOnly] = useState(false);
    const [name, setName] = useState('');
    const [unit, setUnit] = useState('unit');
    const [stock, setStock] = useState('0');
    const [cost, setCost] = useState('0');

    // Recipes State
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);
    const [editingRecipe, setEditingRecipe] = useState<{ inventoryItemId: string, quantity: number }[]>([]);

    useEffect(() => {
        if (restaurantId) {
            loadInventory();
            if (activeTab === 'recipes') {
                loadMenuAndRecipes();
            }
        }
    }, [restaurantId, activeTab]);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const data = await InventoryEngine.getItems(restaurantId!);
            setItems(data);
        } catch (err: any) {
            console.error(err);
            showError('Erro ao carregar estoque');
        } finally {
            setLoading(false);
        }
    };

    const loadMenuAndRecipes = async () => {
        try {
            // Fetch Menu Items
            const { data: menuData, error: menuError } = await supabase
                .from('gm_menu_items')
                .select('id, name, price')
                .eq('restaurant_id', restaurantId!)
                .eq('available', true)
                .order('name');

            if (menuError) throw menuError;
            setMenuItems(menuData || []);

            // Fetch Existing Recipes
            const recipeData = await InventoryEngine.getRecipes(restaurantId!);
            setRecipes(recipeData);

        } catch (err: any) {
            showError('Erro ao carregar menu/receitas');
            console.error(err);
        }
    };

    // --- Ingredient Actions ---

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('gm_inventory_items').insert({
                restaurant_id: restaurantId,
                name,
                unit,
                stock_quantity: parseFloat(stock),
                cost_per_unit: parseInt(cost) // Cents
            });

            if (error) throw error;
            success('Ingrediente criado!');
            setName('');
            setStock('0');
            setCost('0');
            setShowAdd(false);
            loadInventory();
        } catch (err: any) {
            showError(err.message);
        }
    };

    const handleQuickStock = async (item: InventoryItem, delta: number) => {
        try {
            await InventoryEngine.updateStock(item.id, delta, delta > 0 ? 'IN' : 'OUT', 'Manual Adjustment');
            success('Estoque atualizado');
            loadInventory();
        } catch (err: any) {
            showError(err.message);
        }
    };

    // --- Recipe Actions ---

    const selectMenuItem = (id: string) => {
        setSelectedMenuItemId(id);
        // Find existing recipe items for this menu item
        const existing = recipes
            .filter(r => r.menu_item_id === id)
            .map(r => ({
                inventoryItemId: r.inventory_item_id,
                quantity: r.quantity_required
            }));
        setEditingRecipe(existing);
    };

    const addIngredientToRecipe = (inventoryItemId: string) => {
        if (editingRecipe.some(i => i.inventoryItemId === inventoryItemId)) return;
        setEditingRecipe([...editingRecipe, { inventoryItemId, quantity: 1 }]); // Default 1
    };

    const removeIngredientFromRecipe = (inventoryItemId: string) => {
        setEditingRecipe(editingRecipe.filter(i => i.inventoryItemId !== inventoryItemId));
    };

    const updateIngredientQuantity = (inventoryItemId: string, qty: number) => {
        setEditingRecipe(editingRecipe.map(i =>
            i.inventoryItemId === inventoryItemId ? { ...i, quantity: qty } : i
        ));
    };

    const saveRecipe = async () => {
        if (!selectedMenuItemId) return;
        try {
            await InventoryEngine.updateRecipe(selectedMenuItemId, editingRecipe);
            success('Receita salva!');
            loadMenuAndRecipes(); // Refresh
        } catch (err: any) {
            showError(err.message);
        }
    };

    // --- Render ---

    return (
        <AdminLayout
            sidebar={<AdminSidebar activePath="/app/inventory" onNavigate={navigate} />}
            content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>

                    {/* Header & Tabs */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Text size="3xl" weight="black" color="primary">Inventário (Beta)</Text>
                            <Text size="sm" color="tertiary">Gerencie seus ingredientes e fichas técnicas</Text>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: spacing[2], borderBottom: `1px solid ${colors.neutral[200]}` }}>
                        <Button
                            variant={activeTab === 'ingredients' ? 'primary' : 'ghost'}
                            onClick={() => setActiveTab('ingredients')}
                        >
                            Ingredientes
                        </Button>
                        <Button
                            variant={activeTab === 'recipes' ? 'primary' : 'ghost'}
                            onClick={() => setActiveTab('recipes')}
                        >
                            Fichas Técnicas (Receitas)
                        </Button>
                    </div>

                    {/* INGREDIENTS TAB */}
                    {activeTab === 'ingredients' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* Alerts Filter */}
                                {items.some(i => i.stock_quantity < 5) && (
                                    <Button
                                        tone="critical"
                                        variant={showCriticalOnly ? 'solid' : 'light'}
                                        onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                                    >
                                        ⚠️ Alertas de Estoque ({items.filter(i => i.stock_quantity < 5).length})
                                    </Button>
                                )}
                                {!items.some(i => i.stock_quantity < 5) && <div />} {/* Spacer */}

                                <Button tone="action" onClick={() => setShowAdd(!showAdd)}>
                                    {showAdd ? 'Cancelar' : 'Adicionar Ingrediente'}
                                </Button>
                            </div>

                            {showAdd && (
                                <Card surface="layer2" padding="lg">
                                    <form onSubmit={handleCreateItem} style={{ display: 'flex', gap: spacing[4], alignItems: 'flex-end' }}>
                                        <div style={{ flex: 2 }}>
                                            <Input
                                                label="Nome"
                                                value={name} onChange={e => setName(e.target.value)}
                                                required fullWidth placeholder="ex: Tomates"
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Select
                                                label="Unidade"
                                                value={unit} onChange={e => setUnit(e.target.value)}
                                                fullWidth
                                            >
                                                <option value="unit">Unid.</option>
                                                <option value="kg">KG</option>
                                                <option value="lt">Litro</option>
                                                <option value="g">Grama</option>
                                                <option value="ml">ML</option>
                                            </Select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Input
                                                label="Estoque"
                                                type="number" step="0.01"
                                                value={stock} onChange={e => setStock(e.target.value)}
                                                required fullWidth
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Button tone="action" type="submit" fullWidth>Salvar</Button>
                                        </div>
                                    </form>
                                </Card>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing[4] }}>
                                {items
                                    .filter(item => !showCriticalOnly || item.stock_quantity < 5)
                                    .map(item => (
                                        <Card key={item.id} surface="layer2" padding="md">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[4] }}>
                                                <div>
                                                    <Text weight="bold" size="lg">{item.name}</Text>
                                                    <Text size="xs" color="tertiary">Unit: {item.unit}</Text>
                                                </div>
                                                <Badge
                                                    status={item.stock_quantity > 0 ? (item.stock_quantity < 5 ? 'warning' : 'success') : 'error'}
                                                    label={`${item.stock_quantity} ${item.unit}`}
                                                    variant="pill"
                                                />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2] }}>
                                                <Button size="sm" variant="outline" onClick={() => handleQuickStock(item, -1)}>-</Button>
                                                <Button size="sm" variant="outline" onClick={() => handleQuickStock(item, 1)}>+</Button>
                                            </div>
                                        </Card>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* RECIPES TAB */}
                    {activeTab === 'recipes' && (
                        <div style={{ display: 'flex', gap: spacing[6], height: 'calc(100vh - 200px)' }}>
                            {/* Left: Menu Items */}
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <Text size="lg" weight="bold" style={{ marginBottom: spacing[4] }}>Produtos</Text>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                                    {menuItems.map(menuItem => {
                                        const hasRecipe = recipes.some(r => r.menu_item_id === menuItem.id);
                                        return (
                                            <Card
                                                key={menuItem.id}
                                                surface={selectedMenuItemId === menuItem.id ? 'layer3' : 'layer1'}
                                                onClick={() => selectMenuItem(menuItem.id)}
                                                style={{ cursor: 'pointer', border: selectedMenuItemId === menuItem.id ? `2px solid ${colors.primary.base}` : undefined }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Text weight="medium">{menuItem.name}</Text>
                                                    {hasRecipe && <Text size="xs">📝</Text>}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Recipe Editor */}
                            <Card style={{ flex: 2, display: 'flex', flexDirection: 'column' }} surface="layer2">
                                {!selectedMenuItemId ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Text color="tertiary">Selecione um produto para editar a receita</Text>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: spacing[4] }}>
                                        <div style={{ borderBottom: `1px solid ${colors.neutral[200]}`, paddingBottom: spacing[4] }}>
                                            <Text size="xl" weight="bold">
                                                {menuItems.find(m => m.id === selectedMenuItemId)?.name}
                                            </Text>
                                            <Text size="sm" color="tertiary">Composição da Ficha Técnica</Text>
                                        </div>

                                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                                            {editingRecipe.length === 0 && <Text color="tertiary">Nenhum ingrediente adicionado.</Text>}
                                            {editingRecipe.map((line, idx) => {
                                                const item = items.find(i => i.id === line.inventoryItemId);
                                                if (!item) return null;
                                                return (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: spacing[4], background: colors.background.layer1, padding: spacing[2], borderRadius: 4 }}>
                                                        <Text style={{ flex: 2 }}>{item.name} ({item.unit})</Text>
                                                        <Input
                                                            type="number" step="0.001"
                                                            value={line.quantity}
                                                            onChange={(e) => updateIngredientQuantity(line.inventoryItemId, parseFloat(e.target.value))}
                                                            style={{ width: 100 }}
                                                        />
                                                        <Button
                                                            variant="ghost" tone="critical" size="sm"
                                                            onClick={() => removeIngredientFromRecipe(line.inventoryItemId)}
                                                        >
                                                            🗑️
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div style={{ borderTop: `1px solid ${colors.neutral[200]}`, paddingTop: spacing[4], display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                                            <Text weight="medium">Adicionar Ingrediente:</Text>
                                            <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                                                {items.filter(i => !editingRecipe.some(r => r.inventoryItemId === i.id)).map(item => (
                                                    <Button
                                                        key={item.id} size="sm" variant="outline"
                                                        onClick={() => addIngredientToRecipe(item.id)}
                                                    >
                                                        + {item.name}
                                                    </Button>
                                                ))}
                                            </div>
                                            <Button tone="action" fullWidth onClick={saveRecipe}>
                                                Salvar Ficha Técnica
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            }
        />
    );
};
