// components/sewer/OrderCard.tsx
// UPDATED to handle new wallet_type format (full product names)

'use client';

import { Order } from '@/lib/mockData';
import { Package, Clock, Award } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onComplete?: (orderId: string) => void;
  onUncomplete?: (orderId: string) => void;
  showCompleteButton?: boolean;
  showUncompleteButton?: boolean;
}

export default function OrderCard({ 
  order, 
  onComplete, 
  onUncomplete, 
  showCompleteButton = false,
  showUncompleteButton = false
}: OrderCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              {/* Display walletTypeName (full product name) */}
              <h3 className="font-semibold text-neutral-900">{order.walletTypeName}</h3>
              <p className="text-sm text-neutral-500">{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-primary-50 px-3 py-1 rounded-full">
            <Award className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-semibold text-primary-600">{order.points} pts</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {order.ordererName && (
            <div className="text-neutral-600">
              <span className="font-medium">Customer:</span> {order.ordererName}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-neutral-600">
            <Clock className="w-4 h-4" />
            <span>
              {order.completedAt 
                ? `Completed ${formatDistanceToNow(order.completedAt, { addSuffix: true })}`
                : order.claimedAt
                ? `Claimed ${formatDistanceToNow(order.claimedAt, { addSuffix: true })}`
                : `Created ${formatDistanceToNow(order.createdAt, { addSuffix: true })}`
              }
            </span>
          </div>
        </div>

        {/* Actions */}
        {showCompleteButton && !order.completedAt && (
          <button
            onClick={() => onComplete?.(order.id)}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            Mark Complete
          </button>
        )}

        {showUncompleteButton && order.completedAt && (
          <button
            onClick={() => onUncomplete?.(order.id)}
            className="w-full py-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg transition-colors"
          >
            Undo Complete
          </button>
        )}
      </div>
    </div>
  );
}
