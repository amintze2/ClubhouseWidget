import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import type { CategoryConfig } from '../../hooks/useInventoryMutations';

interface Props {
  category: CategoryConfig;
  itemCount: number;
  onClick: () => void;
}

export function InventoryCategoryCard({ category, itemCount, onClick }: Props) {
  const Icon = category.icon;
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${category.borderColor} ${category.bgLight}`}
      onClick={onClick}
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
}
