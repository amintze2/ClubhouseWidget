import { useState, useEffect } from 'react';
import type { UserWithData, Inventory } from '../services/api';
import type { InventoryItem } from '../components/ClubhouseInventory';

// Maps DB enum values to inventory category keys
const DB_TO_INVENTORY_CATEGORY: Record<string, string> = {
  'medical & safety': 'medical',
  'medical_safety': 'medical',
  'equipment & field support': 'equipment',
  'equipment_field_support': 'equipment',
  'laundry & cleaning': 'laundry',
  'laundry_cleaning': 'laundry',
  'hygiene & personal care': 'hygiene',
  'hygiene_personal_care': 'hygiene',
  'meals & nutrition': 'food',
  'meals_nutrition': 'food',
  'misc': 'miscellaneous',
  'miscellaneous': 'miscellaneous',
};

const EMPTY_GROUPED: Record<string, InventoryItem[]> = {
  laundry: [],
  hygiene: [],
  medical: [],
  equipment: [],
  food: [],
  miscellaneous: [],
};

export function useInventory(userData: UserWithData | null) {
  const [inventoryData, setInventoryData] = useState<Record<string, InventoryItem[]>>(EMPTY_GROUPED);

  useEffect(() => {
    const grouped: Record<string, InventoryItem[]> = {
      laundry: [],
      hygiene: [],
      medical: [],
      equipment: [],
      food: [],
      miscellaneous: [],
    };

    (userData?.inventory || []).forEach((item: Inventory) => {
      const normalizedType = item.inventory_type ? String(item.inventory_type).trim().toLowerCase() : '';
      const category = DB_TO_INVENTORY_CATEGORY[normalizedType] ?? 'miscellaneous';

      if (!grouped[category]) grouped[category] = [];
      grouped[category].push({
        id: item.id.toString(),
        name: item.inventory_item || '',
        category,
        unit: item.unit || '',
        par_level: item.required_stock || 0,
        current_stock: item.current_stock || 0,
        price: item.price_per_unit || 0,
        notes: item.note || undefined,
        link: item.purchase_link || undefined,
      });
    });

    setInventoryData(grouped);
  }, [userData?.inventory]);

  return { inventoryData, setInventoryData };
}
