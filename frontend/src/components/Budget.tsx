import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  DollarSign,
  Package,
} from "lucide-react";
import { InventoryItem } from "./ClubhouseInventory";
import { Badge } from "./ui/badge";

interface BudgetProps {
  inventoryData: Record<string, InventoryItem[]>;
}

export function Budget({ inventoryData }: BudgetProps) {

  // Get all items that are low in stock (current < par)
  const lowStockItems = Object.values(inventoryData)
    .flat()
    .filter((item) => item.current_stock < item.par_level)
    .map((item) => {
      const quantityNeeded = item.par_level - item.current_stock;
      const pricePerUnit = item.price || 0;
      const hasPrice = item.price > 0;
      return {
        ...item,
        quantityNeeded,
        totalCost: hasPrice ? quantityNeeded * pricePerUnit : 0,
        hasPrice,
      };
    })
    .sort((a, b) => {
      // Sort items with price first, then by quantity needed (descending)
      if (a.hasPrice !== b.hasPrice) {
        return a.hasPrice ? -1 : 1;
      }
      return b.quantityNeeded - a.quantityNeeded;
    });

  // Calculate total cost to restock all low items to par level (only items with price info)
  const itemsWithPrice = lowStockItems.filter((item) => item.hasPrice);
  const totalRestockCost = itemsWithPrice.reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );
  
  const itemsWithoutPrice = lowStockItems.filter((item) => !item.hasPrice);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl">Budget & Expenses</h2>
        <p className="text-sm text-gray-500 mt-1">
          Track and manage clubhouse operational expenses
        </p>
      </div>

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
                  {itemsWithoutPrice.length > 0 && (
                    <span className="text-xs text-gray-500 block">
                      ({itemsWithPrice.length} of {lowStockItems.length} items priced)
                    </span>
                  )}
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
                  <div className="text-right min-w-[140px]">
                    {item.hasPrice ? (
                      <>
                        <p className="text-sm text-gray-600">
                          ${item.price.toFixed(2)} per {item.unit}
                        </p>
                        <p className="text-lg font-semibold text-orange-600">
                          ${item.totalCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          to restock
                        </p>
                      </>
                    ) : (
                      <div className="text-right">
                        <p className="text-sm text-gray-400 italic">
                          Price not set
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Add price in Inventory
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

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