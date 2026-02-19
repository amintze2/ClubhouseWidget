import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Trash2 } from 'lucide-react';

type NewItemForm = {
  name: string;
  unit: string;
  par_level: string;
  price: string;
  notes: string;
  link: string;
};

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditingItem: boolean;
  editingItemId: string | null;
  newItem: NewItemForm;
  setNewItem: React.Dispatch<React.SetStateAction<NewItemForm>>;
  handleAddItem: () => Promise<void>;
  handleDeleteItem: (id: string) => Promise<void>;
  resetItemForm: () => void;
  categoryTitle: string;
}

export function InventoryItemDialog({
  isOpen, onOpenChange, isEditingItem, editingItemId,
  newItem, setNewItem, handleAddItem, handleDeleteItem,
  resetItemForm, categoryTitle,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetItemForm(); onOpenChange(open); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
          <DialogDescription>
            {isEditingItem ? 'Update item details' : `Add a new item to ${categoryTitle}`}
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
            <Label htmlFor="item-price">
              Price per Unit ($) <span className="text-gray-500 text-xs">(Optional - for budget calculations)</span>
            </Label>
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
          <Button variant="outline" onClick={resetItemForm}>Cancel</Button>
          <Button onClick={handleAddItem}>{isEditingItem ? 'Update Item' : 'Add Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
