// Stock level display helpers for inventory items.
// Extracted from ClubhouseInventory.tsx — all four functions were defined there.
// Note: getStockLevelIndicatorClass was a dead function (identical to getStockLevelColor,
// never called in JSX) and has been omitted here.

export function getStockLevelColor(current: number, par: number): string {
  const percentage = (current / par) * 100;
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getStockLevelStatus(current: number, par: number): 'Good' | 'Low' | 'Critical' {
  const percentage = (current / par) * 100;
  if (percentage >= 80) return 'Good';
  if (percentage >= 40) return 'Low';
  return 'Critical';
}

export function getStockLevelBackgroundClass(current: number, par: number): string {
  const percentage = (current / par) * 100;
  if (percentage >= 80) return 'bg-green-50 border-green-200 hover:bg-green-100';
  if (percentage >= 40) return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
  return 'bg-red-50 border-red-200 hover:bg-red-100';
}
