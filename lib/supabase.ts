// lib/supabase.ts
// UPDATED for new wallet attributes schema

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

// Wallet attributes structure
export interface WalletAttributes {
  color?: string;
  leather_type?: string;
  thread_color?: string;
  has_monogram?: boolean;
  monogram_text?: string;
  monogram_font?: string;
  has_special_engraving?: boolean;
  special_engraving_text?: string;
  engraving_font?: string;
  engraving_location?: string;
  has_custom_id?: boolean;
  custom_id_text?: string;
  has_custom_logo?: boolean;
  custom_logo_details?: string;
  has_badge_cutout?: boolean;
  badge_type?: string;
  customer_note?: string;
  other_customizations?: Array<{ name: string; value: string }>;
}

// Order line item (individual wallet or accessory)
export interface OrderLineItem {
  id: string;
  order_id: string;
  order_number: string;
  item_type: 'wallet' | 'accessory';
  product_id: string | null;
  variant_id: string | null;
  sku: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
  wallet_type: string | null; // Full product name like "The Georgetown Minimalist Wallet"
  points: number;
  wallet_attributes: WalletAttributes | null;
  status: 'pending' | 'claimed' | 'in_progress' | 'completed' | 'void';
  claimed_by: string | null;
  claimed_by_name: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  shopify_line_item: any;
}

export interface Order {
  id: string;
  order_number: string;
  shopify_order_id: string;
  wallet_type: string | null; // Now stores comma-separated full names like "Wallet A, Wallet B"
  status: 'pending' | 'in_progress' | 'completed' | 'void';
  points: number;
  orderer_name: string | null;
  total_wallets: number;
  total_accessories: number;
  claimed_by: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  voided_at: string | null;
  created_at: string;
  updated_at: string;
  shopify_metadata: any;
}

export interface OrderDetail extends Order {
  claimed_by_name: string | null;
  sewer_is_active?: boolean;
}

// For displaying in UI - converts Order to the format components expect
export interface OrderDisplayData {
  id: string;
  orderNumber: string;
  walletType: string;
  walletTypeName: string; // Same as walletType now (full product name)
  points: number;
  status: 'pending' | 'in_progress' | 'completed' | 'void';
  ordererName?: string;
  claimedBy?: string;
  claimedByName?: string;
  claimedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// Helper to convert database Order to display format
export function orderToDisplayData(order: OrderDetail): OrderDisplayData {
  return {
    id: order.id,
    orderNumber: order.order_number,
    walletType: order.wallet_type || '',
    walletTypeName: order.wallet_type || 'Unknown', // Use wallet_type directly
    points: order.points,
    status: order.status,
    ordererName: order.orderer_name || undefined,
    claimedBy: order.claimed_by || undefined,
    claimedByName: order.claimed_by_name || undefined,
    claimedAt: order.claimed_at ? new Date(order.claimed_at) : undefined,
    completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
    createdAt: new Date(order.created_at),
  };
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