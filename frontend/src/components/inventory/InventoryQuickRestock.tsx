import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Zap } from 'lucide-react';
import type { InventoryItem } from '../../types/index';
import type { CategoryConfig } from '../../hooks/useInventoryMutations';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  quickAddCategory: string;
  setQuickAddCategory: (v: string) => void;
  quickAddItemId: string;
  setQuickAddItemId: (v: string) => void;
  quickAddStock: string;
  setQuickAddStock: (v: string) => void;
  handleQuickAddSubmit: () => Promise<void>;
  getQuickAddCategoryItems: () => InventoryItem[];
  categories: CategoryConfig[];
  inventoryData: Record<string, InventoryItem[]>;
}

export function InventoryQuickRestock({
  isOpen, onOpenChange,
  quickAddCategory, setQuickAddCategory,
  quickAddItemId, setQuickAddItemId,
  quickAddStock, setQuickAddStock,
  handleQuickAddSubmit, getQuickAddCategoryItems,
  categories, inventoryData,
}: Props) {
  const handleCancel = () => {
    onOpenChange(false);
    setQuickAddCategory('');
    setQuickAddItemId('');
    setQuickAddStock('');
  };

  return (
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
          <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Update Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Stock Update</DialogTitle>
                <DialogDescription>Select a category and item to update its stock level</DialogDescription>
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
                        if (item) setQuickAddStock(item.current_stock.toString());
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
                        <p className="text-sm text-gray-500 italic mt-2">Note: {selectedQuickItem.notes}</p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
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
  );
}
