// Inventory management UI for the clubhouse.
// - Organizes inventory items by category (laundry, hygiene, medical, etc.).
// - Allows adding, editing, deleting items and updating their stock levels.
// - Persists all changes to Supabase via inventoryApi and keeps local state in sync.
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Package, Sparkles, Heart, Shield, Wrench, FileText, ArrowLeft, Plus, Trash2, Edit, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react';
import { getStockLevelColor, getStockLevelStatus, getStockLevelBackgroundClass } from '../utils/stockHelpers';
import { useInventoryMutations } from '../hooks/useInventoryMutations';
import { InventoryCategoryCard } from './inventory/InventoryCategoryCard';
import { InventoryItemDialog } from './inventory/InventoryItemDialog';
import { InventoryStockDialog } from './inventory/InventoryStockDialog';
import { InventoryQuickRestock } from './inventory/InventoryQuickRestock';
import type { InventoryCategory, InventoryItem } from '../types/index';

export type { InventoryItem };

interface ClubhouseInventoryProps {
  inventoryData: Record<string, InventoryItem[]>;
  setInventoryData: React.Dispatch<React.SetStateAction<Record<string, InventoryItem[]>>>;
}

export function ClubhouseInventory({ inventoryData, setInventoryData }: ClubhouseInventoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRestockCollapsed, setIsRestockCollapsed] = useState(false);

  const categories = [
    { id: 'laundry' as const, title: 'Laundry & Cleaning Supplies', categoryName: 'Laundry & Cleaning Supplies', icon: Sparkles, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', borderColor: 'border-blue-200', bgLight: 'bg-blue-50' },
    { id: 'hygiene' as const, title: 'Hygiene & Personal Care', categoryName: 'Hygiene & Personal Care', icon: Heart, color: 'bg-pink-500', hoverColor: 'hover:bg-pink-600', borderColor: 'border-pink-200', bgLight: 'bg-pink-50' },
    { id: 'medical' as const, title: 'Medical & Safety', categoryName: 'Medical & Safety', icon: Shield, color: 'bg-red-500', hoverColor: 'hover:bg-red-600', borderColor: 'border-red-200', bgLight: 'bg-red-50' },
    { id: 'equipment' as const, title: 'Equipment & Field Support', categoryName: 'Equipment & Field Support', icon: Wrench, color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600', borderColor: 'border-orange-200', bgLight: 'bg-orange-50' },
    { id: 'food' as const, title: 'Food & Beverages', categoryName: 'Food & Beverages', icon: UtensilsCrossed, color: 'bg-green-500', hoverColor: 'hover:bg-green-600', borderColor: 'border-green-200', bgLight: 'bg-green-50' },
    { id: 'miscellaneous' as const, title: 'Miscellaneous / Admin', categoryName: 'Miscellaneous / Admin', icon: FileText, color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600', borderColor: 'border-purple-200', bgLight: 'bg-purple-50' },
  ];

  const m = useInventoryMutations(selectedCategory, setInventoryData, inventoryData, categories);

  const selectedCategoryData = selectedCategory ? categories.find(cat => cat.id === selectedCategory) : null;
  const items = selectedCategory ? (inventoryData[selectedCategory] || []) : [];

  // ── Category detail view ───────────────────────────────────────────────────

  if (selectedCategory && selectedCategoryData) {
    const Icon = selectedCategoryData.icon;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => { setSelectedCategory(null); setIsEditMode(false); }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <Button
                variant={isEditMode ? 'default' : 'outline'}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? 'Done Editing' : 'Edit Items'}
              </Button>
            )}
            <Button onClick={m.handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
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
                <Button onClick={m.handleOpenAddDialog}>
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
                    onClick={() => { if (isEditMode) m.handleOpenEditDialog(item); }}
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
                                  onClick={(e) => { e.stopPropagation(); m.handleOpenStockDialog(item); }}
                                >
                                  Update Stock
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs bg-green-50 border-green-300 hover:bg-green-100"
                                  onClick={(e) => { e.stopPropagation(); m.handleQuickAdjust(item, 'add'); }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs bg-red-50 border-red-300 hover:bg-red-100"
                                  onClick={(e) => { e.stopPropagation(); m.handleQuickAdjust(item, 'used'); }}
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
                          const maxScale = Math.max(item.par_level * 1.5, item.current_stock);
                          const currentPercentage = (item.current_stock / maxScale) * 100;
                          const parPercentage = (item.par_level / maxScale) * 100;
                          return (
                            <>
                              <div className="w-full bg-gray-200 rounded-full h-3 relative">
                                <div
                                  className={`h-3 rounded-full transition-all ${getStockLevelColor(item.current_stock, item.par_level)}`}
                                  style={{ width: `${currentPercentage}%` }}
                                />
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-gray-800"
                                  style={{ left: `${parPercentage}%` }}
                                  title={`Recommended Stock Level: ${item.par_level}`}
                                >
                                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 rounded-full border-2 border-white"></div>
                                </div>
                              </div>
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
                        onClick={(e) => { e.stopPropagation(); m.handleDeleteItem(item.id); }}
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

        <InventoryItemDialog
          isOpen={m.isDialogOpen}
          onOpenChange={(open) => { if (!open) m.resetItemForm(); m.setIsDialogOpen(open); }}
          isEditingItem={m.isEditingItem}
          editingItemId={m.editingItemId}
          newItem={m.newItem}
          setNewItem={m.setNewItem}
          handleAddItem={m.handleAddItem}
          handleDeleteItem={m.handleDeleteItem}
          resetItemForm={m.resetItemForm}
          categoryTitle={selectedCategoryData.title}
        />

        <InventoryStockDialog
          isOpen={m.isStockDialogOpen}
          onOpenChange={m.setIsStockDialogOpen}
          selectedItem={m.selectedItem}
          stockInput={m.stockInput}
          setStockInput={m.setStockInput}
          handleUpdateStock={m.handleUpdateStock}
        />
      </div>
    );
  }

  // ── Overview ───────────────────────────────────────────────────────────────

  const itemsNeedingRestock = Object.entries(inventoryData).flatMap(([categoryId, catItems]) => {
    const categoryData = categories.find(cat => cat.id === categoryId);
    return catItems
      .filter(item => {
        const status = getStockLevelStatus(item.current_stock, item.par_level);
        return status === 'Low' || status === 'Critical';
      })
      .map(item => ({ ...item, categoryData }));
  });

  return (
    <div className="space-y-6">
      <InventoryQuickRestock
        isOpen={m.isQuickAddOpen}
        onOpenChange={m.setIsQuickAddOpen}
        quickAddCategory={m.quickAddCategory}
        setQuickAddCategory={m.setQuickAddCategory}
        quickAddItemId={m.quickAddItemId}
        setQuickAddItemId={m.setQuickAddItemId}
        quickAddStock={m.quickAddStock}
        setQuickAddStock={m.setQuickAddStock}
        handleQuickAddSubmit={m.handleQuickAddSubmit}
        getQuickAddCategoryItems={m.getQuickAddCategoryItems}
        categories={categories}
        inventoryData={inventoryData}
      />

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
                onClick={(e) => { e.stopPropagation(); setIsRestockCollapsed(!isRestockCollapsed); }}
              >
                {isRestockCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
          {!isRestockCollapsed && (
            <CardContent>
              <div className="space-y-3">
                {itemsNeedingRestock.map((item) => {
                  const Icon = item.categoryData?.icon || Package;
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
                                setTimeout(() => m.handleOpenStockDialog(item), 100);
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
            {categories.map((category) => (
              <InventoryCategoryCard
                key={category.id}
                category={category}
                itemCount={(inventoryData[category.id] || []).length}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
