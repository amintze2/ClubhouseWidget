import { useState, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarTrigger, SidebarFooter } from './components/ui/sidebar';
import { ClipboardList, LogOut, User, Calendar, BarChart3, Trophy, FileText, Package, Repeat, DollarSign, Utensils } from 'lucide-react';
import { ClubhouseChecklist } from './components/ClubhouseChecklist';
import { ClubhouseStatus } from './components/ClubhouseStatus';
import { CalendarView } from './components/CalendarView';
import { GameSchedule, GameSeries } from './components/GameSchedule';
import { TaskTemplates, TemplateTask } from './components/TaskTemplates';
import { ClubhouseInventory, InventoryItem } from './components/ClubhouseInventory';
import { RecurringTasks, RecurringTask } from './components/RecurringTasks';
import { Budget } from './components/Budget';
import { MealPlanning, PlayerDietaryInfo } from './components/MealPlanning';
import { MockLogin } from './components/MockLogin';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';

type View = 'checklist' | 'status' | 'calendar' | 'games' | 'templates' | 'inventory' | 'recurring' | 'budget' | 'meals';

interface User {
  username: string;
  jobRole: string;
  team?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  category: 'sanitation' | 'laundry' | 'food' | 'communication' | 'maintenance' | 'administration';
  completed: boolean;
  assignedTo: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>(
    user?.jobRole === 'general_manager' ? 'status' : 'checklist'
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Template tasks for non-game days
  const [nonGameDayTasks, setNonGameDayTasks] = useState<TemplateTask[]>([
    {
      id: '1',
      title: '🧼 Scrub and sanitize showers, toilets, sinks, and locker areas',
      description: '',
      category: 'sanitation',
    },
    {
      id: '2',
      title: '🧰 Restock toilet paper, paper towels, shower soap, and sanitizer stations',
      description: '',
      category: 'maintenance',
    },
    {
      id: '3',
      title: '🧰 Confirm AED is accessible and at least one trained person is on-site',
      description: '',
      category: 'maintenance',
    },
    {
      id: '4',
      title: '🧰 Inspect plumbing, showerheads, and hot water for functionality',
      description: '',
      category: 'maintenance',
    },
    {
      id: '5',
      title: '🧰 Ensure training area is organized and has:',
      description: 'Ice in sufficient quantities, 10+ hot and cold packs, 15+ clean PT towels, Electrical power available',
      category: 'maintenance',
    },
    {
      id: '6',
      title: '🧺 Wash, dry, and fold all towels, uniforms, and rags from prior day',
      description: '',
      category: 'laundry',
    },
    {
      id: '7',
      title: '🧼 Vacuum carpets, clean hard surfaces, and empty all trash cans',
      description: '',
      category: 'sanitation',
    },
    {
      id: '8',
      title: '💬 Communicate with stadium operations about any maintenance or facility issues',
      description: '',
      category: 'communication',
    },
    {
      id: '9',
      title: '🧰 Check washer/dryer systems for lint buildup or leaks',
      description: '',
      category: 'maintenance',
    },
  ]);
  
  // Template tasks for game days - organized by time period
  const gameDayTasks: Array<TemplateTask & { timePeriod: 'morning' | 'pre-game' | 'post-game' }> = [
    // Morning / Pre-Arrival
    {
      id: 'gd-1',
      title: '🧼 Sanitize showers, toilets, and locker areas before players and umpires arrive',
      description: '',
      category: 'sanitation',
      timePeriod: 'morning',
    },
    {
      id: 'gd-2',
      title: '🧰 Restock toilet paper and shower soap',
      description: '',
      category: 'maintenance',
      timePeriod: 'morning',
    },
    {
      id: 'gd-3',
      title: '🧺 Place minimum of 30 clean full-sized towels in each clubhouse and ≥4 in umpire dressing room',
      description: '',
      category: 'laundry',
      timePeriod: 'morning',
    },
    {
      id: 'gd-4',
      title: '🧰 Ensure AED is accessible and one trained individual is present',
      description: '',
      category: 'maintenance',
      timePeriod: 'morning',
    },
    {
      id: 'gd-5',
      title: '🧰 Verify training area is stocked (ice, hot/cold packs, PT towels, electrical power)',
      description: '',
      category: 'maintenance',
      timePeriod: 'morning',
    },
    {
      id: 'gd-6',
      title: '💬 Post in visiting training room:',
      description: 'Emergency medical contact info, Pharmacy contact info, Trainer/medical provider contact info, Evacuation procedures, AED locations, GM/Senior Operator contact info, Local hospital & urgent care locations',
      category: 'communication',
      timePeriod: 'morning',
    },
    {
      id: 'gd-7',
      title: '🧼 Empty trash, clean surfaces, and vacuum carpets',
      description: '',
      category: 'sanitation',
      timePeriod: 'morning',
    },
    // Pre-Game
    {
      id: 'gd-8',
      title: '🍽️ Provide fruit and healthy snacks',
      description: '',
      category: 'food',
      timePeriod: 'pre-game',
    },
    {
      id: 'gd-9',
      title: '🍽️ Provide pre-game snack or light meal (sandwiches or equivalent)',
      description: '',
      category: 'food',
      timePeriod: 'pre-game',
    },
    {
      id: 'gd-10',
      title: '💬 Ensure clubhouse attendant is present before and after game',
      description: '',
      category: 'communication',
      timePeriod: 'pre-game',
    },
    // Post-Game / End of Day
    {
      id: 'gd-11',
      title: '🍽️ Provide nutritious post-game meal and beverages for players, staff, and umpires',
      description: '',
      category: 'food',
      timePeriod: 'post-game',
    },
    {
      id: 'gd-12',
      title: '🧺 Wash and fold used towels and uniforms (per team arrangements)',
      description: '',
      category: 'laundry',
      timePeriod: 'post-game',
    },
    {
      id: 'gd-13',
      title: '🧺 Clean player, manager, coach, and umpire footwear',
      description: '',
      category: 'laundry',
      timePeriod: 'post-game',
    },
    {
      id: 'gd-14',
      title: '🧼 Sanitize showers and toilet areas again post-game',
      description: '',
      category: 'sanitation',
      timePeriod: 'post-game',
    },
    {
      id: 'gd-15',
      title: '💵 Record compliance completion for day',
      description: '',
      category: 'administration',
      timePeriod: 'post-game',
    },
  ];
  
  // Track completion status of non-game day tasks
  const [nonGameDayTaskCompletions, setNonGameDayTaskCompletions] = useState<Record<string, boolean>>({});
  
  // Track completion status of game day tasks by date
  const [gameDayTaskCompletions, setGameDayTaskCompletions] = useState<Record<string, Record<string, boolean>>>({});
  
  // Track the last game date to know when to reset
  const [lastGameDate, setLastGameDate] = useState<string | null>(null);

  const [gameSeries, setGameSeries] = useState<GameSeries[]>([
    // April 2026
    {
      id: 'cdb-1',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Lexington Legends',
      games: [
        { id: 'cdb-1-1', date: new Date(2026, 3, 21), gameNumber: 1 },
        { id: 'cdb-1-2', date: new Date(2026, 3, 22), gameNumber: 2 },
        { id: 'cdb-1-3', date: new Date(2026, 3, 23), gameNumber: 3 },
      ],
    },
    {
      id: 'cdb-2',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Lexington Legends',
      games: [
        { id: 'cdb-2-1', date: new Date(2026, 3, 24), gameNumber: 1, notes: 'School Day 10:35 AM' },
        { id: 'cdb-2-2', date: new Date(2026, 3, 25), gameNumber: 2, notes: 'School Day 10:35 AM' },
      ],
    },
    {
      id: 'cdb-3',
      homeTeam: 'Hagerstown Flying Boxcars',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-3-1', date: new Date(2026, 3, 28), gameNumber: 1 },
        { id: 'cdb-3-2', date: new Date(2026, 3, 29), gameNumber: 2 },
        { id: 'cdb-3-3', date: new Date(2026, 3, 30), gameNumber: 3 },
      ],
    },
    // May 2026
    {
      id: 'cdb-4',
      homeTeam: 'Hagerstown Flying Boxcars',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-4-1', date: new Date(2026, 4, 1), gameNumber: 1 },
        { id: 'cdb-4-2', date: new Date(2026, 4, 2), gameNumber: 2 },
        { id: 'cdb-4-3', date: new Date(2026, 4, 3), gameNumber: 3 },
      ],
    },
    {
      id: 'cdb-5',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Staten Island FerryHawks',
      games: [
        { id: 'cdb-5-1', date: new Date(2026, 4, 5), gameNumber: 1 },
        { id: 'cdb-5-2', date: new Date(2026, 4, 6), gameNumber: 2 },
        { id: 'cdb-5-3', date: new Date(2026, 4, 7), gameNumber: 3 },
        { id: 'cdb-5-4', date: new Date(2026, 4, 8), gameNumber: 4 },
        { id: 'cdb-5-5', date: new Date(2026, 4, 9), gameNumber: 5 },
        { id: 'cdb-5-6', date: new Date(2026, 4, 10), gameNumber: 6 },
      ],
    },
    {
      id: 'cdb-6',
      homeTeam: 'Lexington Legends',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-6-1', date: new Date(2026, 4, 12), gameNumber: 1 },
        { id: 'cdb-6-2', date: new Date(2026, 4, 13), gameNumber: 2 },
        { id: 'cdb-6-3', date: new Date(2026, 4, 14), gameNumber: 3 },
        { id: 'cdb-6-4', date: new Date(2026, 4, 15), gameNumber: 4 },
        { id: 'cdb-6-5', date: new Date(2026, 4, 16), gameNumber: 5 },
        { id: 'cdb-6-6', date: new Date(2026, 4, 17), gameNumber: 6 },
      ],
    },
    {
      id: 'cdb-7',
      homeTeam: 'Gastonia Ghost Peppers',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-7-1', date: new Date(2026, 4, 19), gameNumber: 1 },
        { id: 'cdb-7-2', date: new Date(2026, 4, 20), gameNumber: 2 },
        { id: 'cdb-7-3', date: new Date(2026, 4, 21), gameNumber: 3 },
        { id: 'cdb-7-4', date: new Date(2026, 4, 22), gameNumber: 4 },
        { id: 'cdb-7-5', date: new Date(2026, 4, 23), gameNumber: 5 },
        { id: 'cdb-7-6', date: new Date(2026, 4, 24), gameNumber: 6 },
      ],
    },
    {
      id: 'cdb-8',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Gastonia Ghost Peppers',
      games: [
        { id: 'cdb-8-1', date: new Date(2026, 4, 26), gameNumber: 1, notes: 'Fireworks; School Day May 27 10:35 AM' },
        { id: 'cdb-8-2', date: new Date(2026, 4, 27), gameNumber: 2, notes: 'Fireworks; School Day May 27 10:35 AM' },
        { id: 'cdb-8-3', date: new Date(2026, 4, 28), gameNumber: 3, notes: 'Fireworks; School Day May 27 10:35 AM' },
        { id: 'cdb-8-4', date: new Date(2026, 4, 29), gameNumber: 4, notes: 'Fireworks; School Day May 27 10:35 AM' },
        { id: 'cdb-8-5', date: new Date(2026, 4, 30), gameNumber: 5, notes: 'Fireworks; School Day May 27 10:35 AM' },
        { id: 'cdb-8-6', date: new Date(2026, 4, 31), gameNumber: 6, notes: 'Fireworks; School Day May 27 10:35 AM' },
      ],
    },
    // June 2026
    {
      id: 'cdb-9',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'York Revolution',
      games: [
        { id: 'cdb-9-1', date: new Date(2026, 5, 2), gameNumber: 1 },
        { id: 'cdb-9-2', date: new Date(2026, 5, 3), gameNumber: 2 },
        { id: 'cdb-9-3', date: new Date(2026, 5, 4), gameNumber: 3 },
        { id: 'cdb-9-4', date: new Date(2026, 5, 5), gameNumber: 4 },
        { id: 'cdb-9-5', date: new Date(2026, 5, 6), gameNumber: 5 },
      ],
    },
    {
      id: 'cdb-10',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Hagerstown Flying Boxcars',
      games: [
        { id: 'cdb-10-1', date: new Date(2026, 5, 9), gameNumber: 1 },
        { id: 'cdb-10-2', date: new Date(2026, 5, 10), gameNumber: 2 },
        { id: 'cdb-10-3', date: new Date(2026, 5, 11), gameNumber: 3 },
        { id: 'cdb-10-4', date: new Date(2026, 5, 12), gameNumber: 4 },
        { id: 'cdb-10-5', date: new Date(2026, 5, 13), gameNumber: 5 },
      ],
    },
    {
      id: 'cdb-11',
      homeTeam: 'Hagerstown Flying Boxcars',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-11-1', date: new Date(2026, 5, 16), gameNumber: 1 },
        { id: 'cdb-11-2', date: new Date(2026, 5, 17), gameNumber: 2 },
        { id: 'cdb-11-3', date: new Date(2026, 5, 18), gameNumber: 3 },
        { id: 'cdb-11-4', date: new Date(2026, 5, 19), gameNumber: 4 },
        { id: 'cdb-11-5', date: new Date(2026, 5, 20), gameNumber: 5 },
      ],
    },
    {
      id: 'cdb-12',
      homeTeam: 'York Revolution',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-12-1', date: new Date(2026, 5, 23), gameNumber: 1 },
        { id: 'cdb-12-2', date: new Date(2026, 5, 24), gameNumber: 2 },
        { id: 'cdb-12-3', date: new Date(2026, 5, 25), gameNumber: 3 },
        { id: 'cdb-12-4', date: new Date(2026, 5, 26), gameNumber: 4 },
        { id: 'cdb-12-5', date: new Date(2026, 5, 27), gameNumber: 5 },
      ],
    },
    {
      id: 'cdb-13',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'High Point Rockers',
      games: [
        { id: 'cdb-13-1', date: new Date(2026, 5, 29), gameNumber: 1 },
        { id: 'cdb-13-2', date: new Date(2026, 5, 30), gameNumber: 2 },
      ],
    },
    // July 2026
    {
      id: 'cdb-14',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'High Point Rockers',
      games: [
        { id: 'cdb-14-1', date: new Date(2026, 6, 1), gameNumber: 1, notes: 'Fireworks July 4' },
        { id: 'cdb-14-2', date: new Date(2026, 6, 2), gameNumber: 2, notes: 'Fireworks July 4' },
        { id: 'cdb-14-3', date: new Date(2026, 6, 3), gameNumber: 3, notes: 'Fireworks July 4' },
        { id: 'cdb-14-4', date: new Date(2026, 6, 4), gameNumber: 4, notes: 'Fireworks July 4' },
      ],
    },
    {
      id: 'cdb-15',
      homeTeam: 'Long Island Ducks',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-15-1', date: new Date(2026, 6, 7), gameNumber: 1 },
        { id: 'cdb-15-2', date: new Date(2026, 6, 8), gameNumber: 2 },
        { id: 'cdb-15-3', date: new Date(2026, 6, 9), gameNumber: 3 },
        { id: 'cdb-15-4', date: new Date(2026, 6, 10), gameNumber: 4 },
        { id: 'cdb-15-5', date: new Date(2026, 6, 11), gameNumber: 5 },
      ],
    },
    {
      id: 'cdb-16',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Gastonia Ghost Peppers',
      games: [
        { id: 'cdb-16-1', date: new Date(2026, 6, 14), gameNumber: 1 },
        { id: 'cdb-16-2', date: new Date(2026, 6, 15), gameNumber: 2 },
        { id: 'cdb-16-3', date: new Date(2026, 6, 16), gameNumber: 3 },
        { id: 'cdb-16-4', date: new Date(2026, 6, 17), gameNumber: 4 },
        { id: 'cdb-16-5', date: new Date(2026, 6, 18), gameNumber: 5 },
        { id: 'cdb-16-6', date: new Date(2026, 6, 19), gameNumber: 6 },
      ],
    },
    {
      id: 'cdb-17',
      homeTeam: 'High Point Rockers',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-17-1', date: new Date(2026, 6, 21), gameNumber: 1 },
        { id: 'cdb-17-2', date: new Date(2026, 6, 22), gameNumber: 2 },
        { id: 'cdb-17-3', date: new Date(2026, 6, 23), gameNumber: 3 },
        { id: 'cdb-17-4', date: new Date(2026, 6, 24), gameNumber: 4 },
        { id: 'cdb-17-5', date: new Date(2026, 6, 25), gameNumber: 5 },
        { id: 'cdb-17-6', date: new Date(2026, 6, 26), gameNumber: 6 },
      ],
    },
    {
      id: 'cdb-18',
      homeTeam: 'Gastonia Ghost Peppers',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-18-1', date: new Date(2026, 6, 28), gameNumber: 1 },
        { id: 'cdb-18-2', date: new Date(2026, 6, 29), gameNumber: 2 },
        { id: 'cdb-18-3', date: new Date(2026, 6, 30), gameNumber: 3 },
        { id: 'cdb-18-4', date: new Date(2026, 6, 31), gameNumber: 4 },
      ],
    },
    // August 2026
    {
      id: 'cdb-19',
      homeTeam: 'High Point Rockers',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-19-1', date: new Date(2026, 7, 1), gameNumber: 1 },
        { id: 'cdb-19-2', date: new Date(2026, 7, 2), gameNumber: 2 },
        { id: 'cdb-19-3', date: new Date(2026, 7, 3), gameNumber: 3 },
      ],
    },
    {
      id: 'cdb-20',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Lexington Legends',
      games: [
        { id: 'cdb-20-1', date: new Date(2026, 7, 4), gameNumber: 1 },
        { id: 'cdb-20-2', date: new Date(2026, 7, 5), gameNumber: 2 },
        { id: 'cdb-20-3', date: new Date(2026, 7, 6), gameNumber: 3 },
        { id: 'cdb-20-4', date: new Date(2026, 7, 7), gameNumber: 4 },
        { id: 'cdb-20-5', date: new Date(2026, 7, 8), gameNumber: 5 },
        { id: 'cdb-20-6', date: new Date(2026, 7, 9), gameNumber: 6 },
        { id: 'cdb-20-7', date: new Date(2026, 7, 10), gameNumber: 7 },
      ],
    },
    {
      id: 'cdb-21',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Hagerstown Flying Boxcars',
      games: [
        { id: 'cdb-21-1', date: new Date(2026, 7, 11), gameNumber: 1 },
        { id: 'cdb-21-2', date: new Date(2026, 7, 12), gameNumber: 2 },
        { id: 'cdb-21-3', date: new Date(2026, 7, 13), gameNumber: 3 },
        { id: 'cdb-21-4', date: new Date(2026, 7, 14), gameNumber: 4 },
        { id: 'cdb-21-5', date: new Date(2026, 7, 15), gameNumber: 5 },
        { id: 'cdb-21-6', date: new Date(2026, 7, 16), gameNumber: 6 },
        { id: 'cdb-21-7', date: new Date(2026, 7, 17), gameNumber: 7 },
      ],
    },
    {
      id: 'cdb-22',
      homeTeam: 'Gastonia Ghost Peppers',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-22-1', date: new Date(2026, 7, 18), gameNumber: 1 },
        { id: 'cdb-22-2', date: new Date(2026, 7, 19), gameNumber: 2 },
        { id: 'cdb-22-3', date: new Date(2026, 7, 20), gameNumber: 3 },
        { id: 'cdb-22-4', date: new Date(2026, 7, 21), gameNumber: 4 },
        { id: 'cdb-22-5', date: new Date(2026, 7, 22), gameNumber: 5 },
        { id: 'cdb-22-6', date: new Date(2026, 7, 23), gameNumber: 6 },
        { id: 'cdb-22-7', date: new Date(2026, 7, 24), gameNumber: 7 },
      ],
    },
    {
      id: 'cdb-23',
      homeTeam: 'Lancaster Stormers',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-23-1', date: new Date(2026, 7, 25), gameNumber: 1 },
        { id: 'cdb-23-2', date: new Date(2026, 7, 26), gameNumber: 2 },
        { id: 'cdb-23-3', date: new Date(2026, 7, 27), gameNumber: 3 },
        { id: 'cdb-23-4', date: new Date(2026, 7, 28), gameNumber: 4 },
        { id: 'cdb-23-5', date: new Date(2026, 7, 29), gameNumber: 5 },
      ],
    },
    // September 2026
    {
      id: 'cdb-24',
      homeTeam: 'Charleston Dirty Birds',
      visitingTeam: 'Lexington Legends',
      games: [
        { id: 'cdb-24-1', date: new Date(2026, 8, 1), gameNumber: 1 },
        { id: 'cdb-24-2', date: new Date(2026, 8, 2), gameNumber: 2 },
        { id: 'cdb-24-3', date: new Date(2026, 8, 3), gameNumber: 3 },
      ],
    },
    {
      id: 'cdb-25',
      homeTeam: 'High Point Rockers',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-25-1', date: new Date(2026, 8, 4), gameNumber: 1 },
        { id: 'cdb-25-2', date: new Date(2026, 8, 5), gameNumber: 2 },
        { id: 'cdb-25-3', date: new Date(2026, 8, 6), gameNumber: 3 },
      ],
    },
    {
      id: 'cdb-26',
      homeTeam: 'Lexington Legends',
      visitingTeam: 'Charleston Dirty Birds',
      games: [
        { id: 'cdb-26-1', date: new Date(2026, 8, 8), gameNumber: 1 },
        { id: 'cdb-26-2', date: new Date(2026, 8, 9), gameNumber: 2 },
        { id: 'cdb-26-3', date: new Date(2026, 8, 10), gameNumber: 3 },
        { id: 'cdb-26-4', date: new Date(2026, 8, 11), gameNumber: 4 },
      ],
    },
  ]);

  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([
    {
      id: 'rt-1',
      title: 'Deep clean locker room',
      description: 'Complete sanitization of all locker areas, showers, and bathroom facilities',
      category: 'sanitation',
      taskType: 'off-day',
      time: '09:00 AM',
      enabled: true,
    },
    {
      id: 'rt-2',
      title: 'Inventory check - Laundry supplies',
      description: 'Check stock levels of detergent, fabric softener, and dryer sheets',
      category: 'laundry',
      taskType: 'off-day',
      time: '10:30 AM',
      enabled: true,
    },
    {
      id: 'rt-3',
      title: 'Prepare pre-game snacks',
      description: 'Set out fresh fruit, energy bars, and hydration stations',
      category: 'food',
      taskType: 'game-day',
      time: '02:00 PM',
      timePeriod: 'pre-game',
      enabled: true,
    },
    {
      id: 'rt-4',
      title: 'Stock clubhouse beverages',
      description: 'Ensure coolers are filled with Gatorade, water, and sports drinks',
      category: 'food',
      taskType: 'game-day',
      time: '01:00 PM',
      timePeriod: 'pre-game',
      enabled: true,
    },
    {
      id: 'rt-5',
      title: 'Post-game laundry',
      description: 'Collect and begin washing all game-day uniforms and towels',
      category: 'laundry',
      taskType: 'game-day',
      time: '10:00 PM',
      timePeriod: 'post-game',
      enabled: true,
    },
    {
      id: 'rt-6',
      title: 'Weekly equipment inspection',
      description: 'Check batting helmets, protective gear, and training equipment',
      category: 'maintenance',
      taskType: 'off-day',
      time: '11:00 AM',
      enabled: true,
    },
  ]);
  
  const [playerDietaryInfo, setPlayerDietaryInfo] = useState<PlayerDietaryInfo[]>([]);
  const [gameMealPlans, setGameMealPlans] = useState<{ gameId: string; preGameSnack: string; postGameMeal: string }[]>([]);

  const [inventoryData, setInventoryData] = useState<Record<string, InventoryItem[]>>({
    laundry: [
      {
        id: 'laundry-1',
        name: 'Laundry Detergent (HE)',
        category: 'Laundry & Cleaning Supplies',
        unit: 'gallon',
        par_level: 5,
        current_stock: 3,
        price: 12.99,
        notes: 'Non-scented, approved type for uniforms',
        link: 'https://www.amazon.com/s?k=he+laundry+detergent+unscented',
      },
      {
        id: 'laundry-2',
        name: 'Fabric Softener',
        category: 'Laundry & Cleaning Supplies',
        unit: 'gallon',
        par_level: 3,
        current_stock: 2,
        price: 8.99,
      },
      {
        id: 'laundry-3',
        name: 'Bleach (Color-Safe)',
        category: 'Laundry & Cleaning Supplies',
        unit: 'gallon',
        par_level: 4,
        current_stock: 1,
        price: 6.99,
        notes: 'Color-safe formula only',
        link: 'https://www.amazon.com/s?k=color+safe+bleach',
      },
      {
        id: 'laundry-4',
        name: 'Dryer Sheets',
        category: 'Laundry & Cleaning Supplies',
        unit: 'box',
        par_level: 6,
        current_stock: 4,
        price: 9.99,
        notes: '240-count boxes',
      },
      {
        id: 'laundry-5',
        name: 'Stain Remover Spray',
        category: 'Laundry & Cleaning Supplies',
        unit: 'bottle',
        par_level: 8,
        current_stock: 3,
        price: 7.49,
        notes: 'For grass and dirt stains',
      },
      {
        id: 'laundry-6',
        name: 'All-Purpose Cleaner',
        category: 'Laundry & Cleaning Supplies',
        unit: 'bottle',
        par_level: 10,
        current_stock: 6,
        price: 4.99,
      },
      {
        id: 'laundry-7',
        name: 'Disinfectant Wipes',
        category: 'Laundry & Cleaning Supplies',
        unit: 'container',
        par_level: 15,
        current_stock: 8,
        price: 5.99,
        notes: '75-count containers',
        link: 'https://www.amazon.com/s?k=disinfectant+wipes',
      },
      {
        id: 'laundry-8',
        name: 'Paper Towels',
        category: 'Laundry & Cleaning Supplies',
        unit: 'case',
        par_level: 12,
        current_stock: 10,
        price: 24.99,
        notes: '12-roll case',
      },
      {
        id: 'laundry-9',
        name: 'Trash Bags (55-gallon)',
        category: 'Laundry & Cleaning Supplies',
        unit: 'box',
        par_level: 8,
        current_stock: 5,
        price: 19.99,
        notes: 'Heavy-duty, 50-count',
      },
      {
        id: 'laundry-10',
        name: 'Mop Heads',
        category: 'Laundry & Cleaning Supplies',
        unit: 'unit',
        par_level: 6,
        current_stock: 4,
        price: 8.99,
      },
    ],
    hygiene: [
      {
        id: 'hygiene-1',
        name: 'Hand Towels',
        category: 'Hygiene Products',
        unit: 'pack',
        par_level: 20,
        current_stock: 12,
        price: 15.99,
        notes: '12-pack white towels',
        link: 'https://www.amazon.com/s?k=white+hand+towels',
      },
      {
        id: 'hygiene-2',
        name: 'Hand Soap (Liquid)',
        category: 'Hygiene Products',
        unit: 'bottle',
        par_level: 12,
        current_stock: 8,
        price: 6.99,
        notes: 'Pump bottle, antibacterial',
      },
      {
        id: 'hygiene-3',
        name: 'Shower Gel/Body Wash',
        category: 'Hygiene Products',
        unit: 'bottle',
        par_level: 15,
        current_stock: 10,
        price: 5.99,
        notes: 'Large bottles, unscented',
      },
      {
        id: 'hygiene-4',
        name: 'Shampoo',
        category: 'Hygiene Products',
        unit: 'bottle',
        par_level: 12,
        current_stock: 7,
        price: 7.99,
        notes: 'Large bottles',
      },
      {
        id: 'hygiene-5',
        name: 'Conditioner',
        category: 'Hygiene Products',
        unit: 'bottle',
        par_level: 10,
        current_stock: 5,
        price: 7.99,
      },
      {
        id: 'hygiene-6',
        name: 'Deodorant',
        category: 'Hygiene Products',
        unit: 'unit',
        par_level: 20,
        current_stock: 15,
        price: 4.99,
        notes: 'Variety of scents',
      },
      {
        id: 'hygiene-7',
        name: 'Razors (Disposable)',
        category: 'Hygiene Products',
        unit: 'pack',
        par_level: 10,
        current_stock: 6,
        price: 12.99,
        notes: '12-pack',
      },
      {
        id: 'hygiene-8',
        name: 'Shaving Cream',
        category: 'Hygiene Products',
        unit: 'can',
        par_level: 8,
        current_stock: 4,
        price: 3.99,
      },
      {
        id: 'hygiene-9',
        name: 'Toilet Paper',
        category: 'Hygiene Products',
        unit: 'case',
        par_level: 15,
        current_stock: 12,
        price: 29.99,
        notes: '24-roll mega pack',
        link: 'https://www.amazon.com/s?k=toilet+paper+bulk',
      },
      {
        id: 'hygiene-10',
        name: 'Tissues (Facial)',
        category: 'Hygiene Products',
        unit: 'box',
        par_level: 12,
        current_stock: 8,
        price: 2.49,
      },
      {
        id: 'hygiene-11',
        name: 'Toothbrushes',
        category: 'Hygiene Products',
        unit: 'pack',
        par_level: 10,
        current_stock: 6,
        price: 8.99,
        notes: '4-pack',
      },
      {
        id: 'hygiene-12',
        name: 'Toothpaste',
        category: 'Hygiene Products',
        unit: 'tube',
        par_level: 8,
        current_stock: 5,
        price: 4.99,
      },
    ],
    medical: [
      {
        id: 'medical-1',
        name: 'AED (Defibrillator)',
        category: 'Medical & Safety',
        unit: 'unit',
        par_level: 1,
        current_stock: 1,
        price: 1200.00,
        notes: 'Must be visible and functional',
      },
      {
        id: 'medical-2',
        name: 'First Aid Kit',
        category: 'Medical & Safety',
        unit: 'kit',
        par_level: 2,
        current_stock: 2,
        price: 45.00,
        link: 'https://www.amazon.com/s?k=first+aid+kit+sports',
      },
      {
        id: 'medical-3',
        name: 'Instant Ice Packs',
        category: 'Medical & Safety',
        unit: 'box',
        par_level: 10,
        current_stock: 6,
        price: 24.99,
        notes: 'Box of 24',
      },
      {
        id: 'medical-4',
        name: 'Athletic Tape',
        category: 'Medical & Safety',
        unit: 'roll',
        par_level: 20,
        current_stock: 15,
        price: 3.99,
        notes: '1.5" width',
        link: 'https://www.amazon.com/s?k=athletic+tape',
      },
      {
        id: 'medical-5',
        name: 'Pre-Wrap (Foam)',
        category: 'Medical & Safety',
        unit: 'roll',
        par_level: 30,
        current_stock: 22,
        price: 2.49,
      },
      {
        id: 'medical-6',
        name: 'Bandages (Assorted)',
        category: 'Medical & Safety',
        unit: 'box',
        par_level: 8,
        current_stock: 5,
        price: 8.99,
        notes: '100-count variety pack',
      },
      {
        id: 'medical-7',
        name: 'Antiseptic Spray',
        category: 'Medical & Safety',
        unit: 'bottle',
        par_level: 6,
        current_stock: 4,
        price: 6.99,
      },
      {
        id: 'medical-8',
        name: 'Ibuprofen',
        category: 'Medical & Safety',
        unit: 'bottle',
        par_level: 4,
        current_stock: 3,
        price: 12.99,
        notes: '500-count bottle',
      },
      {
        id: 'medical-9',
        name: 'Acetaminophen',
        category: 'Medical & Safety',
        unit: 'bottle',
        par_level: 4,
        current_stock: 2,
        price: 12.99,
        notes: '500-count bottle',
      },
      {
        id: 'medical-10',
        name: 'Eye Wash Station',
        category: 'Medical & Safety',
        unit: 'unit',
        par_level: 1,
        current_stock: 1,
        price: 89.99,
        notes: 'Wall-mounted',
      },
      {
        id: 'medical-11',
        name: 'Nitrile Gloves',
        category: 'Medical & Safety',
        unit: 'box',
        par_level: 10,
        current_stock: 7,
        price: 14.99,
        notes: '100-count, size Large',
      },
      {
        id: 'medical-12',
        name: 'Biofreeze (Pain Relief Gel)',
        category: 'Medical & Safety',
        unit: 'tube',
        par_level: 6,
        current_stock: 3,
        price: 11.99,
      },
    ],
    equipment: [
      {
        id: 'equipment-1',
        name: 'Grip Tape',
        category: 'Equipment & Field Support',
        unit: 'roll',
        par_level: 10,
        current_stock: 7,
        price: 3.50,
        link: 'https://www.amazon.com/s?k=bat+grip+tape',
      },
      {
        id: 'equipment-2',
        name: 'Pine Tar',
        category: 'Equipment & Field Support',
        unit: 'jar',
        par_level: 5,
        current_stock: 3,
        price: 8.99,
      },
      {
        id: 'equipment-3',
        name: 'Batting Gloves',
        category: 'Equipment & Field Support',
        unit: 'pair',
        par_level: 15,
        current_stock: 10,
        price: 24.99,
        notes: 'Assorted sizes',
      },
      {
        id: 'equipment-4',
        name: 'Baseballs (Practice)',
        category: 'Equipment & Field Support',
        unit: 'dozen',
        par_level: 20,
        current_stock: 15,
        price: 39.99,
        link: 'https://www.amazon.com/s?k=practice+baseballs+dozen',
      },
      {
        id: 'equipment-5',
        name: 'Batting Helmets',
        category: 'Equipment & Field Support',
        unit: 'unit',
        par_level: 30,
        current_stock: 28,
        price: 45.00,
        notes: 'Various sizes',
      },
      {
        id: 'equipment-6',
        name: 'Sunflower Seeds',
        category: 'Equipment & Field Support',
        unit: 'bag',
        par_level: 25,
        current_stock: 18,
        price: 4.99,
        notes: 'Assorted flavors, 5lb bags',
      },
      {
        id: 'equipment-7',
        name: 'Bubble Gum (Team Supply)',
        category: 'Equipment & Field Support',
        unit: 'tub',
        par_level: 8,
        current_stock: 5,
        price: 14.99,
        notes: 'Big League Chew style',
      },
      {
        id: 'equipment-8',
        name: 'Rosin Bags',
        category: 'Equipment & Field Support',
        unit: 'unit',
        par_level: 12,
        current_stock: 8,
        price: 6.99,
      },
      {
        id: 'equipment-9',
        name: 'Batting Tees',
        category: 'Equipment & Field Support',
        unit: 'unit',
        par_level: 4,
        current_stock: 4,
        price: 35.00,
      },
      {
        id: 'equipment-10',
        name: 'Equipment Bags',
        category: 'Equipment & Field Support',
        unit: 'unit',
        par_level: 10,
        current_stock: 7,
        price: 49.99,
        notes: 'Team logo bags',
      },
      {
        id: 'equipment-11',
        name: 'Towels (Game Day)',
        category: 'Equipment & Field Support',
        unit: 'pack',
        par_level: 15,
        current_stock: 12,
        price: 22.99,
        notes: '6-pack white towels',
      },
      {
        id: 'equipment-12',
        name: 'Cooler Jugs (5-gallon)',
        category: 'Equipment & Field Support',
        unit: 'unit',
        par_level: 6,
        current_stock: 6,
        price: 89.99,
      },
    ],
    food: [
      {
        id: 'food-1',
        name: 'Gatorade (Assorted Flavors)',
        category: 'Food & Beverages',
        unit: 'case',
        par_level: 20,
        current_stock: 14,
        price: 24.99,
        notes: '24-pack bottles',
        link: 'https://www.amazon.com/s?k=gatorade+24+pack',
      },
      {
        id: 'food-2',
        name: 'Energy Bars',
        category: 'Food & Beverages',
        unit: 'box',
        par_level: 15,
        current_stock: 11,
        price: 18.99,
        notes: 'Assorted flavors, 12-pack',
        link: 'https://www.amazon.com/s?k=energy+bars+variety',
      },
      {
        id: 'food-3',
        name: 'Bottled Water',
        category: 'Food & Beverages',
        unit: 'case',
        par_level: 30,
        current_stock: 22,
        price: 5.99,
        notes: '24-pack, 16.9oz bottles',
        link: 'https://www.amazon.com/s?k=bottled+water+24+pack',
      },
      {
        id: 'food-4',
        name: 'Protein Powder',
        category: 'Food & Beverages',
        unit: 'container',
        par_level: 5,
        current_stock: 3,
        price: 39.99,
        notes: 'Vanilla and Chocolate flavors',
      },
      {
        id: 'food-5',
        name: 'Fresh Fruit (Bananas)',
        category: 'Food & Beverages',
        unit: 'bunch',
        par_level: 10,
        current_stock: 8,
        price: 3.50,
        notes: 'Order twice weekly',
      },
      {
        id: 'food-6',
        name: 'Peanut Butter',
        category: 'Food & Beverages',
        unit: 'jar',
        par_level: 8,
        current_stock: 5,
        price: 6.99,
        notes: 'Creamy, large jar',
      },
      {
        id: 'food-7',
        name: 'Bread (Whole Wheat)',
        category: 'Food & Beverages',
        unit: 'loaf',
        par_level: 12,
        current_stock: 9,
        price: 3.99,
        notes: 'Check expiration dates',
      },
      {
        id: 'food-8',
        name: 'Jelly/Jam',
        category: 'Food & Beverages',
        unit: 'jar',
        par_level: 6,
        current_stock: 4,
        price: 5.99,
        notes: 'Assorted flavors',
      },
      {
        id: 'food-9',
        name: 'Protein Shakes (Ready-to-Drink)',
        category: 'Food & Beverages',
        unit: 'case',
        par_level: 8,
        current_stock: 5,
        price: 32.99,
        notes: '12-pack, chocolate flavor',
      },
      {
        id: 'food-10',
        name: 'Granola',
        category: 'Food & Beverages',
        unit: 'bag',
        par_level: 6,
        current_stock: 4,
        price: 8.99,
        notes: 'Large bags',
      },
      {
        id: 'food-11',
        name: 'Coffee (Ground)',
        category: 'Food & Beverages',
        unit: 'container',
        par_level: 4,
        current_stock: 3,
        price: 12.99,
        notes: 'Large container',
      },
      {
        id: 'food-12',
        name: 'Electrolyte Powder Mix',
        category: 'Food & Beverages',
        unit: 'container',
        par_level: 5,
        current_stock: 2,
        price: 19.99,
        notes: 'For 5-gallon coolers',
      },
      {
        id: 'food-13',
        name: 'Sports Drinks (Powerade)',
        category: 'Food & Beverages',
        unit: 'case',
        par_level: 15,
        current_stock: 10,
        price: 22.99,
        notes: '24-pack bottles',
      },
      {
        id: 'food-14',
        name: 'Trail Mix',
        category: 'Food & Beverages',
        unit: 'bag',
        par_level: 10,
        current_stock: 7,
        price: 9.99,
        notes: '2lb bags',
      },
      {
        id: 'food-15',
        name: 'Beef Jerky',
        category: 'Food & Beverages',
        unit: 'bag',
        par_level: 8,
        current_stock: 4,
        price: 14.99,
        notes: 'Original flavor',
      },
    ],
    miscellaneous: [
      {
        id: 'misc-1',
        name: 'Copy Paper',
        category: 'Miscellaneous / Admin',
        unit: 'ream',
        par_level: 10,
        current_stock: 7,
        price: 8.99,
        notes: 'Letter size, white',
      },
      {
        id: 'misc-2',
        name: 'Pens (Black)',
        category: 'Miscellaneous / Admin',
        unit: 'box',
        par_level: 5,
        current_stock: 3,
        price: 12.99,
        notes: '12-pack box',
      },
      {
        id: 'misc-3',
        name: 'Clipboards',
        category: 'Miscellaneous / Admin',
        unit: 'unit',
        par_level: 8,
        current_stock: 6,
        price: 4.99,
      },
      {
        id: 'misc-4',
        name: 'Dry Erase Markers',
        category: 'Miscellaneous / Admin',
        unit: 'pack',
        par_level: 6,
        current_stock: 4,
        price: 9.99,
        notes: 'Assorted colors, 8-pack',
      },
      {
        id: 'misc-5',
        name: 'Folders (Manila)',
        category: 'Miscellaneous / Admin',
        unit: 'box',
        par_level: 4,
        current_stock: 3,
        price: 14.99,
        notes: '100-count',
      },
      {
        id: 'misc-6',
        name: 'Printer Ink Cartridges',
        category: 'Miscellaneous / Admin',
        unit: 'pack',
        par_level: 3,
        current_stock: 2,
        price: 49.99,
        notes: 'Black and color',
      },
      {
        id: 'misc-7',
        name: 'Stapler',
        category: 'Miscellaneous / Admin',
        unit: 'unit',
        par_level: 3,
        current_stock: 3,
        price: 12.99,
      },
      {
        id: 'misc-8',
        name: 'Staples',
        category: 'Miscellaneous / Admin',
        unit: 'box',
        par_level: 5,
        current_stock: 4,
        price: 3.99,
        notes: 'Standard size',
      },
      {
        id: 'misc-9',
        name: 'Batteries (AA)',
        category: 'Miscellaneous / Admin',
        unit: 'pack',
        par_level: 6,
        current_stock: 4,
        price: 15.99,
        notes: '24-pack',
      },
      {
        id: 'misc-10',
        name: 'Batteries (AAA)',
        category: 'Miscellaneous / Admin',
        unit: 'pack',
        par_level: 4,
        current_stock: 3,
        price: 15.99,
        notes: '24-pack',
      },
      {
        id: 'misc-11',
        name: 'Extension Cords',
        category: 'Miscellaneous / Admin',
        unit: 'unit',
        par_level: 4,
        current_stock: 4,
        price: 19.99,
        notes: '25-foot, heavy duty',
      },
      {
        id: 'misc-12',
        name: 'Duct Tape',
        category: 'Miscellaneous / Admin',
        unit: 'roll',
        par_level: 6,
        current_stock: 4,
        price: 6.99,
      },
      {
        id: 'misc-13',
        name: 'Binder Clips (Assorted)',
        category: 'Miscellaneous / Admin',
        unit: 'box',
        par_level: 4,
        current_stock: 3,
        price: 8.99,
      },
      {
        id: 'misc-14',
        name: 'Whiteboard',
        category: 'Miscellaneous / Admin',
        unit: 'unit',
        par_level: 2,
        current_stock: 2,
        price: 79.99,
        notes: '4x6 feet',
      },
      {
        id: 'misc-15',
        name: 'USB Flash Drives',
        category: 'Miscellaneous / Admin',
        unit: 'unit',
        par_level: 5,
        current_stock: 3,
        price: 12.99,
        notes: '32GB',
      },
    ],
  });

  const handleRoleSelect = (role: 'player' | 'clubhouse_manager' | 'general_manager', team?: string) => {
    const roleNames = {
      player: 'Player',
      clubhouse_manager: 'Clubhouse Manager',
      general_manager: 'General Manager',
    };

    const newUser = {
      username: roleNames[role],
      jobRole: role,
      team: team,
    };

    setUser(newUser);
    // Set initial view based on role
    setActiveView(role === 'general_manager' ? 'status' : 'checklist');
  };

  const handleSignOut = () => {
    setUser(null);
  };

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleAddGameSeries = (series: Omit<GameSeries, 'id'>) => {
    const newSeries: GameSeries = {
      ...series,
      id: Date.now().toString(),
    };
    setGameSeries([...gameSeries, newSeries]);
  };

  const handleDeleteGameSeries = (seriesId: string) => {
    setGameSeries(gameSeries.filter(series => series.id !== seriesId));
  };

  const handleAddNonGameDayTask = (task: Omit<TemplateTask, 'id'>) => {
    const newTask: TemplateTask = {
      ...task,
      id: Date.now().toString(),
    };
    setNonGameDayTasks([...nonGameDayTasks, newTask]);
  };

  const handleDeleteNonGameDayTask = (taskId: string) => {
    setNonGameDayTasks(nonGameDayTasks.filter(task => task.id !== taskId));
  };

  const handleToggleNonGameDayTask = (taskId: string) => {
    setNonGameDayTaskCompletions(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleResetNonGameDayTasks = () => {
    setNonGameDayTaskCompletions({});
  };

  const handleToggleGameDayTask = (date: string, taskId: string) => {
    setGameDayTaskCompletions(prev => ({
      ...prev,
      [date]: {
        ...(prev[date] || {}),
        [taskId]: !(prev[date]?.[taskId] || false),
      },
    }));
  };

  const handleAddRecurringTask = (task: Omit<RecurringTask, 'id'>) => {
    const newTask: RecurringTask = {
      ...task,
      id: Date.now().toString(),
    };
    setRecurringTasks([...recurringTasks, newTask]);
  };

  const handleUpdateRecurringTask = (task: RecurringTask) => {
    setRecurringTasks(recurringTasks.map(t => t.id === task.id ? task : t));
  };

  const handleDeleteRecurringTask = (taskId: string) => {
    setRecurringTasks(recurringTasks.filter(task => task.id !== taskId));
  };

  // Check if we need to reset non-game day tasks
  useEffect(() => {
    if (!user?.team) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Check if there's a game today for this team
    const hasGameToday = gameSeries.some(series => {
      if (series.homeTeam !== user.team) return false;
      return series.games.some(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        return gameDate.toISOString().split('T')[0] === todayStr;
      });
    });

    // If there's no game today but there was a game before, reset tasks
    if (!hasGameToday && lastGameDate && lastGameDate !== todayStr) {
      const lastGame = new Date(lastGameDate);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // If the last game was yesterday or earlier, and today has no game, reset
      if (lastGame <= yesterday) {
        handleResetNonGameDayTasks();
        setLastGameDate(null);
      }
    }

    // If there's a game today, update the last game date
    if (hasGameToday) {
      setLastGameDate(todayStr);
    }
  }, [user?.team, gameSeries, lastGameDate]);

  if (!user) {
    return <MockLogin onRoleSelect={handleRoleSelect} />;
  }

  // Different menu items based on role
  const getMenuItems = () => {
    if (user.jobRole === 'general_manager') {
      return [
        { id: 'status' as View, icon: BarChart3, label: 'Clubhouse Status' },
        { id: 'games' as View, icon: Trophy, label: 'Game Schedule' },
        { id: 'templates' as View, icon: FileText, label: 'Task Templates' },
        { id: 'budget' as View, icon: DollarSign, label: 'Budget' },
      ];
    }
    return [
      { id: 'checklist' as View, icon: ClipboardList, label: 'Daily Checklists' },
      { id: 'calendar' as View, icon: Calendar, label: 'Task Calendar' },
      { id: 'recurring' as View, icon: Repeat, label: 'Recurring Tasks' },
      { id: 'inventory' as View, icon: Package, label: 'Inventory' },
      { id: 'meals' as View, icon: Utensils, label: 'Meal Planning' },
      { id: 'budget' as View, icon: DollarSign, label: 'Budget' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50">
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base">Clubhouse Manager</h2>
                <p className="text-xs text-gray-500">Baseball Operations</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.id)}
                        isActive={activeView === item.id}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center gap-3 mb-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">
                  {user.team ? `${user.team} ${user.jobRole.replace(/_/g, ' ')}` : user.jobRole.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1">
          <header className="bg-white border-b px-8 py-4 flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1>{menuItems.find(item => item.id === activeView)?.label}</h1>
              <p className="text-sm text-gray-500">Manage your clubhouse operations</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user.username}</span>
            </div>
          </header>

          <main className="p-8">
            {activeView === 'checklist' && (
              <ClubhouseChecklist 
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                gameSeries={gameSeries}
                userTeam={user.team}
                nonGameDayTasks={nonGameDayTasks}
                nonGameDayTaskCompletions={nonGameDayTaskCompletions}
                onToggleNonGameDayTask={handleToggleNonGameDayTask}
                gameDayTasks={gameDayTasks}
                gameDayTaskCompletions={gameDayTaskCompletions}
                onToggleGameDayTask={handleToggleGameDayTask}
              />
            )}
            {activeView === 'status' && (
              <ClubhouseStatus tasks={tasks} />
            )}
            {activeView === 'games' && (
              <GameSchedule
                gameSeries={gameSeries}
                onAddGameSeries={handleAddGameSeries}
                onDeleteGameSeries={handleDeleteGameSeries}
                userTeam={user.team}
              />
            )}
            {activeView === 'templates' && (
              <TaskTemplates
                nonGameDayTasks={nonGameDayTasks}
                gameDayTasks={gameDayTasks}
                onAddNonGameDayTask={handleAddNonGameDayTask}
                onDeleteNonGameDayTask={handleDeleteNonGameDayTask}
              />
            )}
            {activeView === 'calendar' && (
              <CalendarView 
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                gameSeries={gameSeries}
                userTeam={user.team}
                nonGameDayTasks={nonGameDayTasks}
                nonGameDayTaskCompletions={nonGameDayTaskCompletions}
                onToggleNonGameDayTask={handleToggleNonGameDayTask}
                gameDayTasks={gameDayTasks}
                gameDayTaskCompletions={gameDayTaskCompletions}
                onToggleGameDayTask={handleToggleGameDayTask}
              />
            )}
            {activeView === 'inventory' && (
              <ClubhouseInventory 
                inventoryData={inventoryData}
                setInventoryData={setInventoryData}
              />
            )}
            {activeView === 'recurring' && (
              <RecurringTasks
                tasks={recurringTasks}
                onAddTask={handleAddRecurringTask}
                onUpdateTask={handleUpdateRecurringTask}
                onDeleteTask={handleDeleteRecurringTask}
              />
            )}
            {activeView === 'meals' && (
              <MealPlanning 
                players={playerDietaryInfo}
                setPlayers={setPlayerDietaryInfo}
                gameSeries={gameSeries}
                userTeam={user.team}
                gameMealPlans={gameMealPlans}
                setGameMealPlans={setGameMealPlans}
              />
            )}
            {activeView === 'budget' && (
              <Budget inventoryData={inventoryData} />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
