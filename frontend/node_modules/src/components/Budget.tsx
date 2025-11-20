import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  DollarSign,
  Wallet,
  Edit,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { InventoryItem } from "./ClubhouseInventory";
import { Badge } from "./ui/badge";

interface BudgetProps {
  inventoryData: Record<string, InventoryItem[]>;
}

export function Budget({ inventoryData }: BudgetProps) {
  const [clubhouseFunds, setClubhouseFunds] = useState(2450.0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleUpdateFunds = () => {
    const amount = parseFloat(inputValue);
    if (!isNaN(amount) && amount >= 0) {
      setClubhouseFunds(amount);
      setInputValue("");
      setIsDialogOpen(false);
    }
  };

  // Get all items that are low in stock (current < par)
  const lowStockItems = Object.values(inventoryData)
    .flat()
    .filter((item) => item.current_stock < item.par_level)
    .map((item) => ({
      ...item,
      quantityNeeded: item.par_level - item.current_stock,
      totalCost:
        (item.par_level - item.current_stock) * item.price,
    }));

  // Calculate total cost to restock all low items to par level
  const totalRestockCost = lowStockItems.reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Budget & Expenses</h2>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage clubhouse operational expenses
        </p>
      </div>

      {/* Clubhouse Funds */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Clubhouse Funds</CardTitle>
                <CardDescription>
                  Available balance for operations
                </CardDescription>
              </div>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Update Clubhouse Funds
                  </DialogTitle>
                  <DialogDescription>
                    Enter the current balance of the clubhouse
                    funds.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={inputValue}
                      onChange={(e) =>
                        setInputValue(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUpdateFunds();
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateFunds}>
                    Update Funds
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-semibold text-green-700">
            $
            {clubhouseFunds.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </CardContent>
      </Card>

      {/* Low Inventory Items */}
      {lowStockItems.length > 0 ? (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Items Needing Restock</CardTitle>
                  <CardDescription>
                    {lowStockItems.length}{" "}
                    {lowStockItems.length === 1
                      ? "item needs"
                      : "items need"}{" "}
                    to be restocked to recommended stock level
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Total Cost to Restock
                </p>
                <p className="text-2xl font-semibold text-orange-600">
                  $
                  {totalRestockCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">
                        {item.name}
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-white"
                      >
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Current: {item.current_stock}{" "}
                        {item.unit}
                      </span>
                      <span>
                        Recommended: {item.par_level}{" "}
                        {item.unit}
                      </span>
                      <span className="text-orange-600 font-medium">
                        Need: {item.quantityNeeded} {item.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      ${item.price.toFixed(2)} per {item.unit}
                    </p>
                    <p className="text-lg font-semibold text-orange-600">
                      ${item.totalCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalRestockCost > clubhouseFunds && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">
                    Insufficient Funds
                  </p>
                  <p className="text-sm text-red-700">
                    Additional $
                    {(
                      totalRestockCost - clubhouseFunds
                    ).toFixed(2)}{" "}
                    needed to restock all items to recommended
                    stock level.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg mb-2">
              All Items at Recommended Stock Level
            </h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              All inventory items are currently at or above
              their recommended stock level. No restocking
              needed at this time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State for future features */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg mb-2">
            Expense Tracking Coming Soon
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Track individual expenses, categorize spending, and
            generate reports for clubhouse operations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}