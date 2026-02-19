// Manages inventory form state and all async CRUD operations.
// Extracted from ClubhouseInventory.tsx to reduce component complexity.
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { inventoryApi } from '../services/api';
import type { InventoryItem, InventoryCategory } from '../types/index';
import { CATEGORY_NAME_TO_INVENTORY_TYPE } from '../utils/categoryMappings';

export type CategoryConfig = {
  id: NonNullable<InventoryCategory>;
  title: string;
  categoryName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
  borderColor: string;
  bgLight: string;
};

export function useInventoryMutations(
  selectedCategory: InventoryCategory,
  setInventoryData: React.Dispatch<React.SetStateAction<Record<string, InventoryItem[]>>>,
  inventoryData: Record<string, InventoryItem[]>,
  categories: CategoryConfig[],
) {
  const { user: backendUser } = useAuth();

  // Add / edit form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '', unit: '', par_level: '', price: '', notes: '', link: '',
  });

  // Stock update dialog state
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockInput, setStockInput] = useState('');

  // Quick add dialog state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState<string>('');
  const [quickAddItemId, setQuickAddItemId] = useState<string>('');
  const [quickAddStock, setQuickAddStock] = useState('');

  const resetItemForm = () => {
    setNewItem({ name: '', unit: '', par_level: '', price: '', notes: '', link: '' });
    setIsDialogOpen(false);
    setIsEditingItem(false);
    setEditingItemId(null);
  };

  const handleOpenAddDialog = () => {
    setIsEditingItem(false);
    setEditingItemId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (item: InventoryItem) => {
    setNewItem({
      name: item.name,
      unit: item.unit,
      par_level: item.par_level.toString(),
      price: item.price.toString(),
      notes: item.notes || '',
      link: item.link || '',
    });
    setIsEditingItem(true);
    setEditingItemId(item.id);
    setIsDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedCategory) return;
    try {
      await inventoryApi.deleteInventory(parseInt(itemId));
      setInventoryData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].filter(item => item.id !== itemId),
      }));
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      alert('Failed to delete inventory item. Please try again.');
    }
  };

  const handleAddItem = async () => {
    if (!selectedCategory || !newItem.name.trim() || !newItem.unit.trim() || !newItem.par_level || newItem.par_level === '') {
      return;
    }
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData) return;

    const pricePerUnit = newItem.price ? parseFloat(newItem.price) : null;

    if (isEditingItem && editingItemId) {
      if (backendUser?.user_team) {
        try {
          await inventoryApi.updateInventory(parseInt(editingItemId), {
            inventory_item: newItem.name.trim(),
            unit: newItem.unit.trim(),
            required_stock: parseInt(newItem.par_level, 10),
            price_per_unit: pricePerUnit,
            note: newItem.notes.trim() || null,
            purchase_link: newItem.link.trim() || null,
          });
        } catch (error) {
          console.error('Failed to update inventory item:', error);
        }
      }
      setInventoryData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].map(item =>
          item.id === editingItemId
            ? {
                ...item,
                name: newItem.name.trim(),
                unit: newItem.unit.trim(),
                par_level: parseInt(newItem.par_level, 10),
                price: pricePerUnit || 0,
                notes: newItem.notes.trim() || undefined,
                link: newItem.link.trim() || undefined,
              }
            : item
        ),
      }));
    } else {
      const buildItem = (id: string): InventoryItem => ({
        id,
        name: newItem.name.trim(),
        category: selectedCategoryData.categoryName,
        unit: newItem.unit.trim(),
        par_level: parseInt(newItem.par_level, 10),
        current_stock: 0,
        price: pricePerUnit || 0,
        ...(newItem.notes.trim() && { notes: newItem.notes.trim() }),
        ...(newItem.link.trim() && { link: newItem.link.trim() }),
      });

      if (backendUser?.user_team) {
        try {
          const newBackendItem = await inventoryApi.createInventory(backendUser.user_team, {
            inventory_type: CATEGORY_NAME_TO_INVENTORY_TYPE[selectedCategoryData.categoryName] as any,
            inventory_item: newItem.name.trim(),
            unit: newItem.unit.trim(),
            required_stock: parseInt(newItem.par_level, 10),
            current_stock: 0,
            price_per_unit: pricePerUnit,
            note: newItem.notes.trim() || null,
            purchase_link: newItem.link.trim() || null,
          });
          setInventoryData(prev => ({
            ...prev,
            [selectedCategory]: [...prev[selectedCategory], buildItem(newBackendItem.id.toString())],
          }));
        } catch (error) {
          console.error('Failed to create inventory item:', error);
          setInventoryData(prev => ({
            ...prev,
            [selectedCategory]: [...prev[selectedCategory], buildItem(Date.now().toString())],
          }));
        }
      } else {
        setInventoryData(prev => ({
          ...prev,
          [selectedCategory]: [...prev[selectedCategory], buildItem(Date.now().toString())],
        }));
      }
    }
    resetItemForm();
  };

  const handleOpenStockDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockInput(item.current_stock.toString());
    setIsStockDialogOpen(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedItem || !selectedCategory) return;
    const newStock = parseInt(stockInput, 10);
    if (isNaN(newStock) || newStock < 0) return;
    try {
      await inventoryApi.updateInventory(parseInt(selectedItem.id), { current_stock: newStock });
      setInventoryData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].map(item =>
          item.id === selectedItem.id ? { ...item, current_stock: newStock } : item
        ),
      }));
      setIsStockDialogOpen(false);
      setSelectedItem(null);
      setStockInput('');
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddCategory || !quickAddItemId || !quickAddStock) return;
    const newStock = parseInt(quickAddStock, 10);
    if (isNaN(newStock) || newStock < 0) return;
    try {
      await inventoryApi.updateInventory(parseInt(quickAddItemId), { current_stock: newStock });
      setInventoryData(prev => ({
        ...prev,
        [quickAddCategory]: prev[quickAddCategory].map(item =>
          item.id === quickAddItemId ? { ...item, current_stock: newStock } : item
        ),
      }));
      setQuickAddCategory('');
      setQuickAddItemId('');
      setQuickAddStock('');
      setIsQuickAddOpen(false);
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const handleQuickAdjust = async (item: InventoryItem, type: 'add' | 'used') => {
    if (!selectedCategory) return;
    let increment = 1;
    if (item.par_level >= 100) increment = 10;
    else if (item.par_level >= 20) increment = 5;
    const newStock = type === 'add'
      ? item.current_stock + increment
      : Math.max(0, item.current_stock - increment);
    try {
      await inventoryApi.updateInventory(parseInt(item.id), { current_stock: newStock });
      setInventoryData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].map(i =>
          i.id === item.id ? { ...i, current_stock: newStock } : i
        ),
      }));
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const getQuickAddCategoryItems = () => {
    if (!quickAddCategory) return [];
    return inventoryData[quickAddCategory] || [];
  };

  return {
    // Item dialog
    isDialogOpen, setIsDialogOpen,
    isEditingItem, editingItemId,
    newItem, setNewItem,
    handleAddItem, handleOpenAddDialog, handleOpenEditDialog, handleDeleteItem, resetItemForm,
    // Stock dialog
    isStockDialogOpen, setIsStockDialogOpen,
    selectedItem, stockInput, setStockInput,
    handleOpenStockDialog, handleUpdateStock,
    // Quick add
    isQuickAddOpen, setIsQuickAddOpen,
    quickAddCategory, setQuickAddCategory,
    quickAddItemId, setQuickAddItemId,
    quickAddStock, setQuickAddStock,
    handleQuickAddSubmit, handleQuickAdjust, getQuickAddCategoryItems,
  };
}
