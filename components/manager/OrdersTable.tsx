// components/manager/OrdersTable.tsx
// UPDATED to handle new wallet_type format (full product names)

'use client';

import { useState } from 'react';
import { OrderDetail, Sewer } from '@/lib/supabase';
import { Search, MoreVertical, Trash2, UserPlus, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface OrdersTableProps {
  orders: OrderDetail[];
  sewers: Sewer[];
  onReassign: (orderId: string, newSewerId: string) => Promise<void>;
  onToggleComplete: (orderId: string) => Promise<void>;
  onVoid: (orderId: string) => Promise<void>;
}

export default function OrdersTable({ orders, sewers, onReassign, onToggleComplete, onVoid }: OrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'void'>('all');
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
  const [showReassignFor, setShowReassignFor] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      void: 'bg-neutral-100 text-neutral-500'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(query) ||
        order.orderer_name?.toLowerCase().includes(query) ||
        order.wallet_type?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'pending', 'in_progress', 'completed', 'void'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by order #, customer name, or wallet type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Order #</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Wallet Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Points</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Assigned To</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Created</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 px-4 text-sm font-medium text-neutral-900">{order.order_number}</td>
                <td className="py-3 px-4 text-sm text-neutral-700">
                  {/* Display wallet_type directly (now contains full product names) */}
                  {order.wallet_type || <span className="text-neutral-400">Unknown</span>}
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-primary-600">{order.points}</td>
                <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                <td className="py-3 px-4 text-sm text-neutral-700">
                  {order.claimed_by_name || <span className="text-neutral-400">Unassigned</span>}
                </td>
                <td className="py-3 px-4 text-sm text-neutral-600">
                  {format(new Date(order.created_at), 'MMM d, h:mm a')}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setShowActionsFor(showActionsFor === order.id ? null : order.id)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-neutral-600" />
                    </button>
                    
                    {showActionsFor === order.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 z-10">
                        {/* Toggle Complete/Uncomplete */}
                        {order.status !== 'void' && (
                          <button
                            onClick={async () => {
                              await onToggleComplete(order.id);
                              setShowActionsFor(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {order.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                          </button>
                        )}
                        
                        {/* Reassign */}
                        {order.status !== 'void' && order.status !== 'completed' && (
                          <button
                            onClick={() => {
                              setShowReassignFor(order.id);
                              setShowActionsFor(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Reassign
                          </button>
                        )}
                        
                        {/* Void */}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to void order ${order.order_number}?`)) {
                              onVoid(order.id);
                              setShowActionsFor(null);
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Void Order
                        </button>
                      </div>
                    )}
                    
                    {/* Reassign Modal */}
                    {showReassignFor === order.id && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 z-20 p-4">
                        <h4 className="font-semibold text-sm mb-3">Reassign to:</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {sewers.filter(s => s.is_active).map(sewer => (
                            <button
                              key={sewer.id}
                              onClick={async () => {
                                await onReassign(order.id, sewer.id);
                                setShowReassignFor(null);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded"
                            >
                              {sewer.name}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowReassignFor(null)}
                          className="mt-3 w-full px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
}
