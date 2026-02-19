import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { InventoryItem } from '../../types/index';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: InventoryItem | null;
  stockInput: string;
  setStockInput: (v: string) => void;
  handleUpdateStock: () => Promise<void>;
}

export function InventoryStockDialog({
  isOpen, onOpenChange, selectedItem, stockInput, setStockInput, handleUpdateStock,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedItem?.name}</DialogTitle>
          <DialogDescription>Update the current stock level</DialogDescription>
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
              <p className="text-sm text-gray-500 italic mt-2">Note: {selectedItem.notes}</p>
            )}
            {selectedItem?.link && (
              <p className="text-sm text-blue-600 mt-2">
                <a href={selectedItem.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  🔗 Purchase Link
                </a>
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpdateStock}>Update Stock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
