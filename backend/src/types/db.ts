export type User = {
    id: number;
    slugger_user_id: string;
    user_name: string;
    user_role: string;
    user_team: string;
  };
  
  export type Task = {
    id: number;
    user_id: number;
    task_name: string;
    task_complete: boolean;
    task_category: number;
    task_description: string;
    task_type: number;
  };
  
  export type Inventory = {
    id: number;
    user_id: number;
    inventory_item: string;
    current_stock: number;
    required_stock: number;
    unit: string;
    purchase_link: string;
    note: string;
  };
  