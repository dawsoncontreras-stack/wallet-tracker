'use client';

import { OrderDetail, Sewer, supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { MoreVertical, UserCircle, CheckCircle, XCircle, Search } from 'lucide-react';
import { useState, useRef, useEffect, MutableRefObject } from 'react';

interface OrdersTableProps {
  orders: OrderDetail[];
  sewers: Sewer[];
  onReassign: (orderId: string, newSewerId: string) => Promise<void>;
  onToggleComplete: (orderId: string) => Promise<void>;
  onVoid: (orderId: string) => Promise<void>;
}

export default function OrdersTable({ orders, sewers, onReassign, onToggleComplete, onVoid }: OrdersTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showReassignFor, setShowReassignFor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const reassignRef = useRef<HTMLDivElement | null>(null) as MutableRefObject<HTMLDivElement | null>;
  const [isProcessing, setIsProcessing] = useState(false);

  const activeSewers = sewers.filter(s => s.is_active);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
      if (reassignRef.current && !reassignRef.current.contains(event.target as Node)) {
        setShowReassignFor(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOrders = orders.filter(o => {
    if (o.status === 'void') return false;
    
    // Status filter
    if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesOrderNumber = o.order_number.toLowerCase().includes(query);
      const matchesOrderer = o.orderer_name?.toLowerCase().includes(query);
      const matchesWalletType = o.wallet_type?.toLowerCase().includes(query);
      return matchesOrderNumber || matchesOrderer || matchesWalletType;
    }
    
    return true;
  });

  const getStatusBadge = (status: OrderDetail['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      void: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      void: 'Void',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">Order Management</h2>
        <div className="flex gap-2">
          {(['all', 'in_progress', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
                      data-order={order.id}
                      ref={(el) => {
                        if (el && activeMenu === order.id) {
                          const rect = el.getBoundingClientRect();
                          const dropdown = document.getElementById(`dropdown-${order.id}`);
                          if (dropdown) {
                            const dropdownHeight = dropdown.offsetHeight || 400; // estimate if not rendered
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;
                            
                            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                              // Position above if more space
                              dropdown.style.top = `${rect.top - dropdownHeight - 8}px`;
                            } else {
                              // Position below
                              dropdown.style.top = `${rect.bottom + 8}px`;
                            }
                            dropdown.style.left = `${rect.right - 224}px`;
                          }
                        }
                      }}
                      onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                      className="p-1 hover:bg-neutral-200 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-neutral-600" />
                    </button>
                    
                    {activeMenu === order.id && !isProcessing && (
                      <>
                        {/* Backdrop to close menu on click outside */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setActiveMenu(null)}
                        />
                        
                        {/* Menu */}
                        <div 
                          id={`dropdown-${order.id}`}
                          ref={menuRef}
                          className="fixed z-50 w-56 bg-white rounded-lg shadow-xl border border-neutral-200 py-1"
                        >
                          {/* Toggle Complete/Uncomplete */}
                          {order.status !== 'void' && (
                            <button
                              onClick={async () => {
                                setIsProcessing(true);
                                await onToggleComplete(order.id);
                                setActiveMenu(null);
                                setTimeout(() => setIsProcessing(false), 100);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {order.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                            </button>
                          )}
                          
                          {/* Reassign - for all non-void orders */}
                          {order.status !== 'void' && order.status !== 'completed' && (
                            <>
                              <div className="border-t border-neutral-200 my-1"></div>
                              <button
                                onClick={() => {
                                  setShowReassignFor(order.id);
                                  setActiveMenu(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                              >
                                <UserCircle className="w-4 h-4" />
                                {order.claimed_by ? 'Reassign' : 'Assign to Sewer'}
                              </button>
                            </>
                          )}
                          
                          <div className="border-t border-neutral-200 my-1"></div>
                          
                          {/* Void */}
                          <button
                            onClick={() => {
                              onVoid(order.id);
                              setActiveMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Void Order
                          </button>
                        </div>
                      </>
                    )}
                    
                    {/* Reassign Submenu */}
                    {showReassignFor === order.id && !isProcessing && (
                      <>
                        {/* Backdrop */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowReassignFor(null)}
                        />
                        
                        {/* Reassign Menu */}
                        <div 
                          id={`reassign-${order.id}`}
                          ref={(el) => {
                            reassignRef.current = el;
                            if (el) {
                              const button = document.querySelector(`button[data-order="${order.id}"]`);
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                const dropdownHeight = el.offsetHeight || 400;
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const spaceAbove = rect.top;
                                
                                if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                                  el.style.top = `${rect.top - dropdownHeight - 8}px`;
                                } else {
                                  el.style.top = `${rect.bottom + 8}px`;
                                }
                                el.style.left = `${rect.right - 224}px`;
                              }
                            }
                          }}
                          className="fixed z-50 w-56 bg-white rounded-lg shadow-xl border border-neutral-200 py-1 max-h-96 overflow-y-auto"
                        >
                          <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase">
                            {order.claimed_by ? 'Reassign to' : 'Assign to'}
                          </div>
                          {activeSewers.length > 0 ? (
                            activeSewers.map((sewer) => (
                              <button
                                key={sewer.id}
                                onClick={async () => {
                                  setIsProcessing(true);
                                  setShowReassignFor(null);
                                  await onReassign(order.id, sewer.id);
                                  setTimeout(() => setIsProcessing(false), 100);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 flex items-center gap-2"
                                disabled={sewer.id === order.claimed_by}
                              >
                                <UserCircle className="w-4 h-4" />
                                {sewer.name}
                                {sewer.id === order.claimed_by && (
                                  <span className="ml-auto text-xs text-primary-600">(current)</span>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-neutral-500">No active sewers</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            No orders found for this filter
          </div>
        )}
      </div>
    </div>
  );
}
