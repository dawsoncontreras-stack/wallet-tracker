import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Create Supabase client with realtime configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: false,
  },
});

// Types matching our database schema
export interface Sewer {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletType {
  id: string;
  name: string;
  points: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  wallet_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'void';
  points: number;
  orderer_name: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail extends Order {
  wallet_type_name: string;
  claimed_by_name: string | null;
}

export interface DailyPoint {
  id: string;
  sewer_id: string;
  date: string;
  points: number;
  orders_completed: number;
  created_at: string;
  updated_at: string;
}

export interface SewerLeaderboard {
  id: string;
  name: string;
  total_points: number;
  total_orders: number;
  avg_points_per_order: number;
}