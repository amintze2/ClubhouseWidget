import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type TaskCategory = 'Medical & Safety' | 'Equipment & Field Support' | 'Laundry & Cleaning' | 'Hygiene & Personal Care' | 'Meals & Nutrition' | 'Misc';

interface SeedUser {
  slugger_user_id: string;
  user_name: string;
  user_role: string;
  user_team: string; // Team name - will be converted to team ID
  inventory: Array<{
    inventory_type: TaskCategory | null;
    inventory_item: string;
    current_stock: number;
    required_stock: number;
    unit: string;
    purchase_link: string | null;
    note: string | null;
  }>;
  tasks: Array<{
    task_name: string;
    task_complete: boolean;
    task_category: TaskCategory | null;
    task_description: string;
    task_type: number | null;
  }>;
}

const seedData: SeedUser[] = [
  {
    slugger_user_id: 'slugger_user_id_1',
    user_name: 'Sarah Johnson',
    user_role: 'Clubhouse Manager',
    user_team: 'long_island_ducks',
    inventory: [
      {
        inventory_type: 'Equipment & Field Support',
        inventory_item: 'Baseballs',
        current_stock: 45,
        required_stock: 100,
        unit: 'count',
        purchase_link: 'https://example.com/baseballs',
        note: 'Need to order more before next game',
      },
      {
        inventory_type: 'Equipment & Field Support',
        inventory_item: 'Bats',
        current_stock: 12,
        required_stock: 15,
        unit: 'count',
        purchase_link: null,
        note: 'Good stock level',
      },
      {
        inventory_type: 'Medical & Safety',
        inventory_item: 'First Aid Kit',
        current_stock: 2,
        required_stock: 3,
        unit: 'count',
        purchase_link: 'https://example.com/firstaid',
        note: 'One kit is almost empty',
      },
      {
        inventory_type: 'Equipment & Field Support',
        inventory_item: 'Helmets',
        current_stock: 8,
        required_stock: 20,
        unit: 'count',
        purchase_link: null,
        note: 'Low stock - urgent',
      },
    ],
    tasks: [
      {
        task_name: 'Inspect field equipment',
        task_complete: true,
        task_category: 'Equipment & Field Support',
        task_description: 'Check all bases, pitching mound, and outfield',
        task_type: 1,
      },
      {
        task_name: 'Restock concession stand',
        task_complete: false,
        task_category: 'Meals & Nutrition',
        task_description: 'Order snacks and drinks for weekend games',
        task_type: 1,
      },
      {
        task_name: 'Schedule maintenance',
        task_complete: false,
        task_category: 'Equipment & Field Support',
        task_description: 'Call maintenance team for field repairs',
        task_type: 2,
      },
      {
        task_name: 'Update team roster',
        task_complete: true,
        task_category: 'Misc',
        task_description: 'Add new players to system',
        task_type: 1,
      },
    ],
  },
  {
    slugger_user_id: 'manager2',
    user_name: 'Mike',
    user_role: 'Clubhouse Manager',
    user_team: 'southern_maryland_bluecrabs',
    inventory: [
      {
        inventory_type: 'Equipment & Field Support',
        inventory_item: 'Softballs',
        current_stock: 60,
        required_stock: 80,
        unit: 'count',
        purchase_link: 'https://example.com/softballs',
        note: 'Adequate stock',
      },
      {
        inventory_type: 'Equipment & Field Support',
        inventory_item: 'Gloves',
        current_stock: 5,
        required_stock: 18,
        unit: 'count',
        purchase_link: null,
        note: 'Very low stock',
      },
      {
        inventory_type: 'Meals & Nutrition',
        inventory_item: 'Water Cooler',
        current_stock: 1,
        required_stock: 2,
        unit: 'count',
        purchase_link: 'https://example.com/cooler',
        note: 'Need backup cooler',
      },
    ],
    tasks: [
      {
        task_name: 'Clean dugout',
        task_complete: true,
        task_category: 'Hygiene & Personal Care',
        task_description: 'Remove trash and organize equipment',
        task_type: 1,
      },
      {
        task_name: 'Check lighting system',
        task_complete: false,
        task_category: 'Equipment & Field Support',
        task_description: 'Test all field lights for evening games',
        task_type: 2,
      },
      {
        task_name: 'Order team uniforms',
        task_complete: false,
        task_category: 'Misc',
        task_description: 'Place order for new season uniforms',
        task_type: 1,
      },
    ],
  },
  {
    slugger_user_id: 'manager3',
    user_name: 'Emily Rodriguez',
    user_role: 'General Manager',
    user_team: 'southern_maryland_bluecrabs',
    inventory: [
      {
        inventory_type: 'Equipment & Field Support',
        inventory_item: 'Catcher Gear',
        current_stock: 3,
        required_stock: 4,
        unit: 'count',
        purchase_link: null,
        note: 'One set needs repair',
      },
      {
        inventory_type: 'Equipment & Field Support',
        inventory_item: 'Scoreboard Batteries',
        current_stock: 0,
        required_stock: 12,
        unit: 'count',
        purchase_link: 'https://example.com/batteries',
        note: 'Out of stock - order immediately',
      },
    ],
    tasks: [
      {
        task_name: 'Update scoreboard',
        task_complete: false,
        task_category: 'Equipment & Field Support',
        task_description: 'Replace batteries and test display',
        task_type: 2,
      },
      {
        task_name: 'Organize storage room',
        task_complete: true,
        task_category: 'Hygiene & Personal Care',
        task_description: 'Sort and label all equipment',
        task_type: 1,
      },
    ],
  },
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    const { error: deleteTasksError } = await supabase.from('task').delete().neq('id', 0);
    if (deleteTasksError) console.warn('Warning deleting tasks:', deleteTasksError.message);

    const { error: deleteInventoryError } = await supabase.from('inventory').delete().neq('id', 0);
    if (deleteInventoryError) console.warn('Warning deleting inventory:', deleteInventoryError.message);

    const { error: deleteUsersError } = await supabase.from('user').delete().neq('id', 0);
    if (deleteUsersError) console.warn('Warning deleting users:', deleteUsersError.message);

    const { error: deleteGamesError } = await supabase.from('games').delete().neq('id', 0);
    if (deleteGamesError) console.warn('Warning deleting games:', deleteGamesError.message);

    const { error: deleteTeamsError } = await supabase.from('teams').delete().neq('id', 0);
    if (deleteTeamsError) console.warn('Warning deleting teams:', deleteTeamsError.message);

    console.log('✅ Existing data cleared\n');

    // Create teams first
    console.log('Creating teams...');
    const uniqueTeamNames = [...new Set(seedData.map(user => user.user_team))];
    const teamMap = new Map<string, number>();

    for (const teamName of uniqueTeamNames) {
      // Format team name: convert snake_case to Title Case
      const formattedName = teamName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ team_name: formattedName })
        .select()
        .single();

      if (teamError) {
        console.error(`❌ Error creating team ${formattedName}:`, teamError);
        continue;
      }

      if (team) {
        teamMap.set(teamName, team.id);
        console.log(`  ✅ Created team: ${formattedName} (ID: ${team.id})`);
      }
    }

    console.log('');

    if (teamMap.size === 0) {
      console.error('❌ No teams were created. Cannot proceed with seeding users.');
      return;
    }

    // Create inventory items for teams
    console.log('Creating inventory items for teams...');
    const teamInventoryMap = new Map<string, typeof seedData[0]['inventory']>();
    
    // Group inventory by team
    for (const userData of seedData) {
      if (userData.inventory.length > 0) {
        const existing = teamInventoryMap.get(userData.user_team) || [];
        teamInventoryMap.set(userData.user_team, [...existing, ...userData.inventory]);
      }
    }

    // Insert inventory for each team (only once per team, using first user's inventory)
    for (const [teamName, inventoryItems] of teamInventoryMap.entries()) {
      const teamId = teamMap.get(teamName);
      if (!teamId) continue;

      // Remove duplicates by inventory_item
      const uniqueItems = Array.from(
        new Map(inventoryItems.map(item => [item.inventory_item, item])).values()
      );

      const inventoryData = uniqueItems.map((item) => ({
        team_id: teamId,
        ...item,
      }));

      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .insert(inventoryData)
        .select();

      if (inventoryError) {
        console.error(`  ❌ Error creating inventory for team ${teamName}:`, inventoryError);
      } else {
        console.log(`  ✅ Created ${inventory?.length || 0} inventory items for team ${teamName}`);
      }
    }

    console.log('');

    // Insert users and their associated data
    for (const userData of seedData) {
      console.log(`Creating user: ${userData.user_name} (${userData.slugger_user_id})...`);

      // Get team ID for this user
      const teamId = teamMap.get(userData.user_team);
      if (!teamId) {
        console.error(`❌ Team not found for user ${userData.user_name}: ${userData.user_team}`);
        continue;
      }

      // Insert user
      const { data: user, error: userError } = await supabase
        .from('user')
        .insert({
          slugger_user_id: userData.slugger_user_id,
          user_name: userData.user_name,
          user_role: userData.user_role,
          user_team: teamId,
        })
        .select()
        .single();

      if (userError) {
        console.error(`❌ Error creating user ${userData.user_name}:`, userError);
        continue;
      }

      if (!user) {
        console.error(`❌ User ${userData.user_name} was not created`);
        continue;
      }

      console.log(`  ✅ User created with ID: ${user.id}`);

      // Insert tasks
      if (userData.tasks.length > 0) {
        const taskItems = userData.tasks.map((task) => ({
          user_id: user.id,
          ...task,
        }));

        const { data: tasks, error: tasksError } = await supabase
          .from('task')
          .insert(taskItems)
          .select();

        if (tasksError) {
          console.error(`  ❌ Error creating tasks for ${userData.user_name}:`, tasksError);
        } else {
          console.log(`  ✅ Created ${tasks?.length || 0} tasks`);
        }
      }

      console.log('');
    }

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📝 Test login credentials:');
    console.log('   - manager1 (Sarah Johnson - Team Alpha)');
    console.log('   - manager2 (Mike Chen - Team Beta)');
    console.log('   - manager3 (Emily Rodriguez - Team Alpha)\n');
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('✨ Seed script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

