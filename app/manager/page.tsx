'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase, OrderDetail, Sewer } from '@/lib/supabase';
import { LogOut, TrendingUp, Package, Clock, Users, UserPlus } from 'lucide-react';
import PerformanceCalendar from '@/components/manager/PerformanceCalendar';
import OrdersTable from '@/components/manager/OrdersTable';
import SewerMetrics from '@/components/manager/SewerMetrics';
import SewerManagement from '@/components/manager/SewerManagement';
import { getToday } from '@/lib/dateUtils';
import DateRangePicker from '@/components/shared/DateRangePicker';

export default function ManagerDashboard() {
  const { isManager, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [sewers, setSewers] = useState<Sewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'orders' | 'metrics' | 'sewers'>('calendar');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(getToday());
  const [currentPreset, setCurrentPreset] = useState<string>('today');

  const loadData = useCallback(async () => {
  try {
    // Load orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('order_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;
    setOrders(ordersData || []);

    // Load sewers
    const { data: sewersData, error: sewersError } = await supabase
      .from('sewers')
      .select('*')
      .order('name');

    if (sewersError) throw sewersError;
    setSewers(sewersData || []);
  } catch (err) {
    console.error('Error loading data:', err);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  if (!isManager) {
    router.push('/');
    return; // Early return
  }

  loadData();
  
  // Set up real-time subscriptions for all relevant tables
  const ordersChannel = supabase
    .channel('manager-order-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      (payload) => {
        console.log('Order change detected:', payload);
        loadData();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to order changes');
      }
    });

  const sewersChannel = supabase
    .channel('manager-sewer-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sewers'
      },
      (payload) => {
        console.log('Sewer change detected:', payload);
        loadData();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to sewer changes');
      }
    });

  const dailyPointsChannel = supabase
    .channel('manager-daily-points-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'daily_points'
      },
      (payload) => {
        console.log('Daily points change detected:', payload);
        loadData();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to daily points changes');
      }
    });

  // Proper cleanup - use unsubscribe() instead of removeChannel()
  return () => {
    ordersChannel.unsubscribe();
    sewersChannel.unsubscribe();
    dailyPointsChannel.unsubscribe();
  };
}, [isManager, loadData]); // Include loadData in dependencies

if (!isManager) return null;


  // Calculate stats
  const totalOrders = orders.filter(o => o.status !== 'void').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
  const totalPendingPoints = orders
    .filter(o => o.status === 'pending' || o.status === 'in_progress')
    .reduce((sum, o) => sum + o.points, 0);
  
  const estimatedTime = Math.ceil(totalPendingPoints * 5 / 30); // 15 min per point
  const activeSewers = sewers.filter(s => s.is_active).length;

  const handleReassignOrder = async (orderId: string, newSewerId: string) => {
    try {
      const updateData = { 
        claimed_by: newSewerId,
        claimed_at: new Date().toISOString(),
        status: 'completed',
        completed_at: new Date().toISOString()
      };
      
      const { error, data } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select();

      if (error) throw error;
      
      await loadData();
    } catch (err) {
      alert('Failed to reassign order');
    }
  };

  const handleToggleComplete = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      if (order.status === 'completed') {
        // Mark as incomplete and remove assignment
        const updateData = {
          status: 'pending',
          completed_at: null,
          claimed_by: null,
          claimed_at: null
        };
        
        const { error, data } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId)
          .select();

        if (error) throw error;
      } else {
        // Mark as complete
        const updateData = {
          status: 'completed',
          completed_at: new Date().toISOString()
        };
        
        const { error, data } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId)
          .select();

        if (error) throw error;
      }
      
      await loadData();
    } catch (err) {
      alert('Failed to update order');
    }
  };

  const handleVoidOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'void',
          voided_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('Error voiding order:', err);
      alert('Failed to void order');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 ">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Manager Dashboard</h1>
              <p className="text-sm text-neutral-500">Production Overview & Metrics</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>
    

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        
       {/* View Tabs - Now Mobile Friendly */}
        <div className="mb-6 mt-2">
          {/* Tabs Container */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
            {/* Tabs - Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setView('calendar')}
                className={`px-4 sm:px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                  view === 'calendar'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Performance Calendar
              </button>
              <button
                onClick={() => setView('metrics')}
                className={`px-4 sm:px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                  view === 'metrics'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Sewer Metrics
              </button>
              <button
                onClick={() => setView('orders')}
                className={`px-4 sm:px-6 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                  view === 'orders'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Orders Management
              </button>
              <button
                onClick={() => setView('sewers')}
                className={`px-4 sm:px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  view === 'sewers'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Manage</span> Sewers
              </button>
            </div>
            
            {/* Date Range Picker - Stacks on mobile */}
            {view && (
              <div className="flex-shrink-0">
                <DateRangePicker
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onChange={setDateRange}
                  currentPreset={currentPreset}
                  onPresetChange={setCurrentPreset}
                />
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ">
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-neutral-900">{totalOrders}</span>
            </div>
            <p className="text-neutral-500 text-sm font-medium">Total Orders</p>
            <div className="mt-2 text-xs text-neutral-400">
              {completedOrders} completed
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{activeOrders}</span>
            </div>
            <p className="text-primary-100 text-sm font-medium">Active Orders</p>
            <div className="mt-2 text-xs text-primary-200">
              {totalPendingPoints} pending points
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-500" />
              <span className="text-3xl font-bold text-neutral-900">{estimatedTime}h</span>
            </div>
            <p className="text-neutral-500 text-sm font-medium">Est. Completion</p>
            <div className="mt-2 text-xs text-neutral-400">
              Based on average pace
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-500" />
              <span className="text-3xl font-bold text-neutral-900">{activeSewers}</span>
            </div>
            <p className="text-neutral-500 text-sm font-medium">Active Sewers</p>
            <div className="mt-2 text-xs text-neutral-400">
              Production team
            </div>
          </div>
        </div>

        

        {/* Content Area */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 sm:p-6">
          
          {view === 'calendar' && (
            <PerformanceCalendar 
              orders={orders}
              sewers={sewers}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              currentPreset={currentPreset}
              onPresetChange={setCurrentPreset}
            />
          )}
          
          {view === 'orders' && (
            <OrdersTable
              orders={orders}
              sewers={sewers}
              onReassign={handleReassignOrder}
              onToggleComplete={handleToggleComplete}
              onVoid={handleVoidOrder}
            />
          )}
          
          {view === 'metrics' && (
            <SewerMetrics 
              orders={orders}
              sewers={sewers}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              currentPreset={currentPreset}
              onPresetChange={setCurrentPreset}
            />
          )}

          {view === 'sewers' && (
            <SewerManagement
              sewers={sewers}
              onSewerAdded={loadData}
              onSewerRemoved={loadData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
