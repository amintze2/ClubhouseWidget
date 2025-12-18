// Inventory management UI for the clubhouse.
// - Organizes inventory items by category (laundry, hygiene, medical, etc.).
// - Allows adding, editing, deleting items and updating their stock levels.
// - Persists all changes to Supabase via inventoryApi and keeps local state in sync.
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, Sparkles, Heart, Shield, Wrench, FileText, ArrowLeft, Plus, Trash2, Edit, Zap, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { inventoryApi } from '../services/api';

// Helper function to get stock level color
const getStockLevelColor = (current: number, par: number) => {
  const percentage = (current / par) * 100;
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getStockLevelStatus = (current: number, par: number) => {
  const percentage = (current / par) * 100;
  if (percentage >= 80) return 'Good';
  if (percentage >= 40) return 'Low';
  return 'Critical';
};

const getStockLevelIndicatorClass = (current: number, par: number) => {
  const percentage = (current / par) * 100;
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getStockLevelBackgroundClass = (current: number, par: number) => {
  const percentage = (current / par) * 100;
  if (percentage >= 80) return 'bg-green-50 border-green-200 hover:bg-green-100';
  if (percentage >= 40) return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
  return 'bg-red-50 border-red-200 hover:bg-red-100';
};

type InventoryCategory = 
  | 'laundry' 
  | 'hygiene' 
  | 'medical' 
  | 'equipment' 
  | 'food'
  | 'miscellaneous' 
  | null;

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  par_level: number;
  current_stock: number;
  price: number;
  notes?: string;
  link?: string;
}

interface ClubhouseInventoryProps {
  inventoryData: Record<string, InventoryItem[]>;
  setInventoryData: React.Dispatch<React.SetStateAction<Record<string, InventoryItem[]>>>;
}

export function ClubhouseInventory({ inventoryData, setInventoryData }: ClubhouseInventoryProps) {
  const { user: backendUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockInput, setStockInput] = useState('');
  const [isRestockCollapsed, setIsRestockCollapsed] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    unit: '',
    par_level: '',
    price: '',
    notes: '',
    link: '',
  });
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState<string>('');
  const [quickAddItemId, setQuickAddItemId] = useState<string>('');
  const [quickAddStock, setQuickAddStock] = useState('');

  const categories = [
    {
      id: 'laundry' as const,
      title: 'Laundry & Cleaning Supplies',
      categoryName: 'Laundry & Cleaning Supplies',
      icon: Sparkles,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      borderColor: 'border-blue-200',
      bgLight: 'bg-blue-50',
    },
    {
      id: 'hygiene' as const,
      title: 'Hygiene & Personal Care',
      categoryName: 'Hygiene & Personal Care',
      icon: Heart,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
      borderColor: 'border-pink-200',
      bgLight: 'bg-pink-50',
    },
    {
      id: 'medical' as const,
      title: 'Medical & Safety',
      categoryName: 'Medical & Safety',
      icon: Shield,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      borderColor: 'border-red-200',
      bgLight: 'bg-red-50',
    },
    {
      id: 'equipment' as const,
      title: 'Equipment & Field Support',
      categoryName: 'Equipment & Field Support',
      icon: Wrench,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      borderColor: 'border-orange-200',
      bgLight: 'bg-orange-50',
    },
    {
      id: 'food' as const,
      title: 'Food & Beverages',
      categoryName: 'Food & Beverages',
      icon: UtensilsCrossed,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      borderColor: 'border-green-200',
      bgLight: 'bg-green-50',
    },
    {
      id: 'miscellaneous' as const,
      title: 'Miscellaneous / Admin',
      categoryName: 'Miscellaneous / Admin',
      icon: FileText,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      borderColor: 'border-purple-200',
      bgLight: 'bg-purple-50',
    },
  ];

  const handleAddItem = async () => {
    if (!selectedCategory || !newItem.name.trim() || !newItem.unit.trim() || !newItem.par_level || newItem.par_level === '') {
      return;
    }

    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData) return;

    const pricePerUnit = newItem.price ? parseFloat(newItem.price) : null;

    // Map frontend category to backend inventory_type enum
    const categoryToInventoryType: Record<string, string> = {
      'Laundry & Cleaning Supplies': 'Laundry & Cleaning',
      'Hygiene & Personal Care': 'Hygiene & Personal Care',
      'Medical & Safety': 'Medical & Safety',
      'Equipment & Field Support': 'Equipment & Field Support',
      'Meals & Nutrition': 'Meals & Nutrition',
      'Miscellaneous': 'Misc',
    };

    if (isEditingItem && editingItemId) {
      // Update existing item
      if (backendUser?.user_team) {
        try {
          // Update in backend
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

      // Update local state
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
      // Add new item
      if (backendUser?.user_team) {
        try {
          // Save to backend
          const newBackendItem = await inventoryApi.createInventory(backendUser.user_team, {
            inventory_type: categoryToInventoryType[selectedCategoryData.categoryName] as any,
            inventory_item: newItem.name.trim(),
            unit: newItem.unit.trim(),
            required_stock: parseInt(newItem.par_level, 10),
            current_stock: 0,
            price_per_unit: pricePerUnit,
            note: newItem.notes.trim() || null,
            purchase_link: newItem.link.trim() || null,
          });

          // Add to local state with backend ID
          const item: InventoryItem = {
            id: newBackendItem.id.toString(),
            name: newItem.name.trim(),
            category: selectedCategoryData.categoryName,
            unit: newItem.unit.trim(),
            par_level: parseInt(newItem.par_level, 10),
            current_stock: 0,
            price: pricePerUnit || 0,
            ...(newItem.notes.trim() && { notes: newItem.notes.trim() }),
            ...(newItem.link.trim() && { link: newItem.link.trim() }),
          };

          setInventoryData(prev => ({
            ...prev,
            [selectedCategory]: [...prev[selectedCategory], item],
          }));
        } catch (error) {
          console.error('Failed to create inventory item:', error);
          // Fallback to local state if API fails
          const item: InventoryItem = {
            id: Date.now().toString(),
            name: newItem.name.trim(),
            category: selectedCategoryData.categoryName,
            unit: newItem.unit.trim(),
            par_level: parseInt(newItem.par_level, 10),
            current_stock: 0,
            price: pricePerUnit || 0,
            ...(newItem.notes.trim() && { notes: newItem.notes.trim() }),
            ...(newItem.link.trim() && { link: newItem.link.trim() }),
          };

          setInventoryData(prev => ({
            ...prev,
            [selectedCategory]: [...prev[selectedCategory], item],
          }));
        }
      } else {
        // No backend user, just update local state
        const item: InventoryItem = {
          id: Date.now().toString(),
          name: newItem.name.trim(),
          category: selectedCategoryData.categoryName,
          unit: newItem.unit.trim(),
          par_level: parseInt(newItem.par_level, 10),
          current_stock: 0,
          price: pricePerUnit || 0,
          ...(newItem.notes.trim() && { notes: newItem.notes.trim() }),
          ...(newItem.link.trim() && { link: newItem.link.trim() }),
        };

        setInventoryData(prev => ({
          ...prev,
          [selectedCategory]: [...prev[selectedCategory], item],
        }));
      }
    }

    resetItemForm();
  };

  const resetItemForm = () => {
    setNewItem({
      name: '',
      unit: '',
      par_level: '',
      price: '',
      notes: '',
      link: '',
    });
    setIsDialogOpen(false);
    setIsEditingItem(false);
    setEditingItemId(null);
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
      // Delete from database
      await inventoryApi.deleteInventory(parseInt(itemId));
      
      // Update local state
      setInventoryData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].filter(item => item.id !== itemId),
      }));
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      alert('Failed to delete inventory item. Please try again.');
    }
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
      // Update in database
      await inventoryApi.updateInventory(parseInt(selectedItem.id), {
        current_stock: newStock,
      });

      // Update local state
      setInventoryData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].map(item =>
          item.id === selectedItem.id
            ? { ...item, current_stock: newStock }
            : item
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
      // Update in database
      await inventoryApi.updateInventory(parseInt(quickAddItemId), {
        current_stock: newStock,
      });

      // Update local state
      setInventoryData(prev => ({
        ...prev,
        [quickAddCategory]: prev[quickAddCategory].map(item =>
          item.id === quickAddItemId
            ? { ...item, current_stock: newStock }
            : item
        ),
      }));

      // Reset form
      setQuickAddCategory('');
      setQuickAddItemId('');
      setQuickAddStock('');
      setIsQuickAddOpen(false);
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const getQuickAddCategoryItems = () => {
    if (!quickAddCategory) return [];
    return inventoryData[quickAddCategory as InventoryCategory] || [];
  };

  const handleQuickAdjust = async (item: InventoryItem, type: 'add' | 'used') => {
    if (!selectedCategory) return;

    // Calculate increment based on par level
    let increment = 1;
    if (item.par_level >= 100) {
      increment = 10;
    } else if (item.par_level >= 20) {
      increment = 5;
    }

    const newStock = type === 'add' 
      ? item.current_stock + increment 
      : Math.max(0, item.current_stock - increment);

    try {
      // Update in database
      await inventoryApi.updateInventory(parseInt(item.id), {
        current_stock: newStock,
      });

      // Update local state
      setInventoryData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].map(i =>
          i.id === item.id
            ? { ...i, current_stock: newStock }
            : i
        ),
      }));
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const getSelectedCategoryData = () => {
    if (!selectedCategory) return null;
    return categories.find(cat => cat.id === selectedCategory);
  };

  const selectedCategoryData = getSelectedCategoryData();
  const items = selectedCategory ? inventoryData[selectedCategory] : [];

  if (selectedCategory && selectedCategoryData) {
    const Icon = selectedCategoryData.icon;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory(null);
              setIsEditMode(false);
            }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>
          
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <Button
                variant={isEditMode ? "default" : "outline"}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? 'Done Editing' : 'Edit Items'}
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              if (!open) resetItemForm();
              setIsDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setIsEditingItem(false);
                  setEditingItemId(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
                  <DialogDescription>
                    {isEditingItem ? 'Update item details' : `Add a new item to ${selectedCategoryData.title}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      placeholder="e.g., Hand Towels"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-unit">Unit</Label>
                    <Input
                      id="item-unit"
                      placeholder="e.g., unit, box, gallon"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-par-level">Recommended Stock Level</Label>
                    <Input
                      id="item-par-level"
                      type="number"
                      placeholder="e.g., 30"
                      value={newItem.par_level}
                      onChange={(e) => setNewItem({ ...newItem, par_level: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-price">Price per Unit ($) <span className="text-gray-500 text-xs">(Optional - for budget calculations)</span></Label>
                    <Input
                      id="item-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 12.99"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">Enter the price per unit to calculate restocking costs in the Budget tab</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-notes">Notes (Optional)</Label>
                    <Input
                      id="item-notes"
                      placeholder="e.g., Non-scented, approved type"
                      value={newItem.notes}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-link">Purchase Link (Optional)</Label>
                    <Input
                      id="item-link"
                      type="url"
                      placeholder="e.g., https://example.com/product"
                      value={newItem.link}
                      onChange={(e) => setNewItem({ ...newItem, link: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  {isEditingItem && (
                    <Button 
                      variant="destructive" 
                      onClick={async () => {
                        if (editingItemId && window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                          await handleDeleteItem(editingItemId);
                          resetItemForm();
                        }
                      }}
                      className="mr-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                  <Button variant="outline" onClick={resetItemForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem}>
                    {isEditingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-lg ${selectedCategoryData.color} flex items-center justify-center`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>{selectedCategoryData.title}</CardTitle>
                <CardDescription>
                  {items.length} {items.length === 1 ? 'item' : 'items'} in inventory
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg mb-2">No Items Yet</h3>
                <p className="text-gray-600 max-w-md mb-4">
                  No inventory items have been added to this category yet.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${isEditMode ? 'cursor-pointer' : ''} ${getStockLevelBackgroundClass(item.current_stock, item.par_level)}`}
                    onClick={() => {
                      if (isEditMode) {
                        handleOpenEditDialog(item);
                      }
                      // When not in edit mode, clicking the item doesn't do anything
                      // Use the "Update Stock" button instead
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{item.name}</h4>
                            {!isEditMode && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs bg-blue-50 border-blue-300 hover:bg-blue-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenStockDialog(item);
                                  }}
                                >
                                  Update Stock
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs bg-green-50 border-green-300 hover:bg-green-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdjust(item, 'add');
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs bg-red-50 border-red-300 hover:bg-red-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAdjust(item, 'used');
                                  }}
                                >
                                  Used
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Current: {item.current_stock} {item.unit}</span>
                            <span>Recommended: {item.par_level}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar with Par Level Threshold */}
                      <div className="mb-2 relative">
                        {(() => {
                          // Calculate the max scale for the bar (show up to 150% of par or current stock, whichever is higher)
                          const maxScale = Math.max(item.par_level * 1.5, item.current_stock);
                          const currentPercentage = (item.current_stock / maxScale) * 100;
                          const parPercentage = (item.par_level / maxScale) * 100;
                          
                          return (
                            <>
                              {/* Background bar */}
                              <div className="w-full bg-gray-200 rounded-full h-3 relative">
                                {/* Current stock fill */}
                                <div 
                                  className={`h-3 rounded-full transition-all ${getStockLevelColor(item.current_stock, item.par_level)}`}
                                  style={{ width: `${currentPercentage}%` }}
                                />
                                {/* Recommended stock level threshold marker */}
                                <div 
                                  className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
                                  style={{ left: `${parPercentage}%` }}
                                  title={`Recommended Stock Level: ${item.par_level}`}
                                >
                                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 rounded-full border-2 border-white"></div>
                                </div>
                              </div>
                              {/* Recommended stock level label */}
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0</span>
                                <span 
                                  className="absolute text-gray-800"
                                  style={{ left: `${parPercentage}%`, transform: 'translateX(-50%)' }}
                                >
                                  Rec.
                                </span>
                                <span>{Math.ceil(maxScale)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      {item.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">{item.notes}</p>
                      )}
                    </div>
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Stock Dialog */}
        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedItem?.name}</DialogTitle>
              <DialogDescription>
                Update the current stock level
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-stock">Current Stock</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="current-stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                  />
                  <span className="text-gray-600">{selectedItem?.unit}</span>
                </div>
                <p className="text-sm text-gray-600">
                  Recommended Stock Level: {selectedItem?.par_level} {selectedItem?.unit}
                </p>
                {selectedItem?.notes && (
                  <p className="text-sm text-gray-500 italic mt-2">
                    Note: {selectedItem.notes}
                  </p>
                )}
                {selectedItem?.link && (
                  <p className="text-sm text-blue-600 mt-2">
                    <a 
                      href={selectedItem.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      🔗 Purchase Link
                    </a>
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStock}>
                Update Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


      </div>
    );
  }

  // Get all items that need restocking (status is Low or Critical)
  const itemsNeedingRestock = Object.entries(inventoryData).flatMap(([categoryId, items]) => {
    const categoryData = categories.find(cat => cat.id === categoryId);
    return items
      .filter(item => {
        const status = getStockLevelStatus(item.current_stock, item.par_level);
        return status === 'Low' || status === 'Critical';
      })
      .map(item => ({
        ...item,
        categoryData,
      }));
  });

  return (
    <div className="space-y-6">
      {/* Quick Add Section */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Quick Add</CardTitle>
                <CardDescription>Quickly update stock levels</CardDescription>
              </div>
            </div>
            <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Update Stock
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Quick Stock Update</DialogTitle>
                  <DialogDescription>
                    Select a category and item to update its stock level
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-category">Category</Label>
                    <Select
                      value={quickAddCategory}
                      onValueChange={(value) => {
                        setQuickAddCategory(value);
                        setQuickAddItemId('');
                        setQuickAddStock('');
                      }}
                    >
                      <SelectTrigger id="quick-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => {
                          const Icon = category.icon;
                          const itemCount = (inventoryData[category.id] || []).length;
                          return (
                            <SelectItem key={category.id} value={category.id} disabled={itemCount === 0}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{category.title}</span>
                                <span className="text-gray-500">({itemCount})</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {quickAddCategory && (
                    <div className="space-y-2">
                      <Label htmlFor="quick-item">Item</Label>
                      <Select
                        value={quickAddItemId}
                        onValueChange={(value) => {
                          setQuickAddItemId(value);
                          const item = getQuickAddCategoryItems().find(i => i.id === value);
                          if (item) {
                            setQuickAddStock(item.current_stock.toString());
                          }
                        }}
                      >
                        <SelectTrigger id="quick-item">
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {getQuickAddCategoryItems().map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              <div className="flex items-center justify-between gap-4">
                                <span>{item.name}</span>
                                <span className="text-gray-500 text-sm">
                                  ({item.current_stock}/{item.par_level} {item.unit})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {quickAddItemId && (() => {
                    const selectedQuickItem = getQuickAddCategoryItems().find(i => i.id === quickAddItemId);
                    return selectedQuickItem ? (
                      <div className="space-y-2">
                        <Label htmlFor="quick-stock">Current Stock</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="quick-stock"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={quickAddStock}
                            onChange={(e) => setQuickAddStock(e.target.value)}
                          />
                          <span className="text-gray-600">{selectedQuickItem.unit}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Recommended Stock Level: {selectedQuickItem.par_level} {selectedQuickItem.unit}
                        </p>
                        {selectedQuickItem.notes && (
                          <p className="text-sm text-gray-500 italic mt-2">
                            Note: {selectedQuickItem.notes}
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsQuickAddOpen(false);
                    setQuickAddCategory('');
                    setQuickAddItemId('');
                    setQuickAddStock('');
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleQuickAddSubmit}
                    disabled={!quickAddCategory || !quickAddItemId || !quickAddStock}
                  >
                    Update Stock
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Items Needing Restock */}
      {itemsNeedingRestock.length > 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader className="cursor-pointer" onClick={() => setIsRestockCollapsed(!isRestockCollapsed)}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-orange-500 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle>Items Needing Restock</CardTitle>
                <CardDescription>
                  {itemsNeedingRestock.length} {itemsNeedingRestock.length === 1 ? 'item needs' : 'items need'} attention
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRestockCollapsed(!isRestockCollapsed);
                }}
              >
                {isRestockCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          {!isRestockCollapsed && (
            <CardContent>
              <div className="space-y-3">
                {itemsNeedingRestock.map((item) => {
                  const Icon = item.categoryData?.icon || Package;
                  const status = getStockLevelStatus(item.current_stock, item.par_level);
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${getStockLevelBackgroundClass(item.current_stock, item.par_level)}`}
                    >
                      <div className={`h-10 w-10 rounded-lg ${item.categoryData?.color || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <h4 className="font-medium truncate">{item.name}</h4>
                            <p className="text-sm text-gray-600">{item.category}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs bg-blue-50 border-blue-300 hover:bg-blue-100 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              const categoryId = categories.find(cat => cat.categoryName === item.category)?.id;
                              if (categoryId) {
                                setSelectedCategory(categoryId);
                                setTimeout(() => handleOpenStockDialog(item), 100);
                              }
                            }}
                          >
                            Update Stock
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Current: {item.current_stock} {item.unit}</span>
                          <span>Par: {item.par_level}</span>
                          <span className="text-orange-600 font-medium">
                            Need: {item.par_level - item.current_stock} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Items by Category */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Items by Category</CardTitle>
              <CardDescription>Select a category to view and manage inventory</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const itemCount = (inventoryData[category.id] || []).length;
              
              return (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all hover:shadow-lg border-2 ${category.borderColor} ${category.bgLight}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`h-16 w-16 rounded-xl ${category.color} flex items-center justify-center`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{category.title}</h3>
                        <Badge variant="secondary">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
