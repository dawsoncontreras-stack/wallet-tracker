'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase, OrderDetail } from '@/lib/supabase';
import { LogOut, Package, Trophy, Search, CheckSquare } from 'lucide-react';
import OrderCard from '@/components/sewer/OrderCard';
import DateRangePicker from '@/components/shared/DateRangePicker';
import { getToday, isWithinDateRange } from '@/lib/dateUtils';

export default function SewerDashboard() {
  const { currentSewer, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'orders' | 'completed'>('orders');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(getToday());
  const [currentPreset, setCurrentPreset] = useState<string>('today');

 const loadOrders = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from('order_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setOrders(data || []);
  } catch (err) {
    console.error('Error loading orders:', err);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  if (!currentSewer) {
    router.push('/');
    return;
  }

  loadOrders();
  
  const channel = supabase
    .channel('order-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      (payload) => {
        console.log('Order change detected:', payload);
        loadOrders();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to order changes');
      }
    });

  return () => {
    channel.unsubscribe();
  };
}, [currentSewer, loadOrders]);

  if (!currentSewer) return null;

  // Filter for open orders (pending and in_progress)
  const openOrders = orders.filter(o => {
    if (o.status !== 'pending' && o.status !== 'in_progress') return false;
    // if (o.status === 'void') return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesOrderNumber = o.order_number.toLowerCase().includes(query);
      const matchesOrderer = o.orderer_name?.toLowerCase().includes(query);
      return matchesOrderNumber || matchesOrderer;
    }
    
    return true;
  });

  // Filter for completed orders by this sewer (with date range)
  const completedOrders = orders.filter(o => {
    if (o.claimed_by !== currentSewer.id) return false;
    if (o.status !== 'completed') return false;
    if (!o.completed_at) return false;
    
    return isWithinDateRange(new Date(o.completed_at), dateRange.start, dateRange.end);
  });

  const rangePoints = completedOrders.reduce((sum, o) => sum + o.points, 0);

  const handleCompleteOrder = async (orderId: string) => {
    setConfirmingOrderId(orderId);
  };

  const confirmComplete = async () => {
    if (!confirmingOrderId || !currentSewer) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          claimed_by: currentSewer.id
        })
        .eq('id', confirmingOrderId);

      if (error) throw error;

      // Reload orders
      await loadOrders();
      setConfirmingOrderId(null);
    } catch (err) {
      console.error('Error completing order:', err);
      alert('Failed to complete order');
    }
  };

  const handleUncompleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'in_progress',
          completed_at: null,
          claimed_by: null
        })
        .eq('id', orderId);

      if (error) throw error;

      // Reload orders
      await loadOrders();
    } catch (err) {
      console.error('Error uncompleting order:', err);
      alert('Failed to uncomplete order');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const confirmingOrder = orders.find(o => o.id === confirmingOrderId);
  const displayedOrders = view === 'orders' ? openOrders : completedOrders;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Confirmation Modal */}
      {confirmingOrderId && confirmingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-neutral-900">Complete Order?</h3>
            <p className="text-neutral-600">
              Would you like to complete order <span className="font-semibold">{confirmingOrder.order_number}</span> ({confirmingOrder.wallet_type})?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmComplete}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Yes, Complete
              </button>
              <button
                onClick={() => setConfirmingOrderId(null)}
                className="flex-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Welcome, {currentSewer.name}</h1>
              <p className="text-sm text-neutral-500">Sewer Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{rangePoints}</span>
            </div>
            <p className="text-primary-100 text-sm font-medium">Points in Range</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-neutral-400" />
              <span className="text-3xl font-bold text-neutral-900">{openOrders.length}</span>
            </div>
            <p className="text-neutral-500 text-sm font-medium">Available Orders</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6 border-b border-neutral-200">
          <button
            onClick={() => setView('orders')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              view === 'orders'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Orders ({openOrders.length})
          </button>
          <button
            onClick={() => setView('completed')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              view === 'completed'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Completed ({completedOrders.length})
          </button>
        </div>

        {/* Search (only on Orders tab) */}
        {view === 'orders' && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by order # or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Date Filter for Completed tab */}
        {view === 'completed' && (
          <div className="flex justify-end mb-6">
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={setDateRange}
              currentPreset={currentPreset}
              onPresetChange={setCurrentPreset}
            />
          </div>
        )}

        {/* Orders Grid */}
        {displayedOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {view === 'orders' ? 'No orders found' : 'No completed orders'}
            </h3>
            <p className="text-neutral-500">
              {view === 'orders' 
                ? (searchQuery ? 'Try a different search term' : 'Check back later for new orders')
                : 'Complete some orders to see them here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={{
                  id: order.id,
                  orderNumber: order.order_number,
                  walletType: order.wallet_type || 'Unknown',
                  walletTypeName: order.wallet_type || 'Unknown', // Use wallet_type directly
                  points: order.points,
                  status: order.status,
                  ordererName: order.orderer_name || undefined,
                  claimedBy: order.claimed_by || undefined,
                  claimedByName: order.claimed_by_name || undefined,
                  claimedAt: order.claimed_at ? new Date(order.claimed_at) : undefined,
                  completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
                  createdAt: new Date(order.created_at)
                }}
                onComplete={handleCompleteOrder}
                onUncomplete={handleUncompleteOrder}
                showCompleteButton={view === 'orders'}
                showUncompleteButton={view === 'completed'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
