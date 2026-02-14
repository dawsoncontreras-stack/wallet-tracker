'use client';

import { Order } from '@/lib/mockData';
import { Award, TrendingUp, Package, Clock } from 'lucide-react';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { isWithinDateRange } from '@/lib/dateUtils';
import DateRangePicker from '@/components/shared/DateRangePicker';

interface SewerMetricsProps {
  orders: Order[];
  sewerId: string;
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
}

export default function SewerMetrics({ orders, sewerId, dateRange, onDateRangeChange }: SewerMetricsProps) {
  const completedOrders = orders.filter(
    o => o.claimedBy === sewerId && 
    o.status === 'completed' && 
    o.completedAt &&
    isWithinDateRange(o.completedAt, dateRange.start, dateRange.end)
  );

  const inProgressOrders = orders.filter(
    o => o.claimedBy === sewerId && 
    o.status === 'in_progress'
  );

  const totalPoints = completedOrders.reduce((sum, o) => sum + o.points, 0);
  const averagePoints = completedOrders.length > 0 
    ? Math.round(totalPoints / completedOrders.length * 10) / 10 
    : 0;

  // Group by day
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  const dailyData = days.map(day => {
    const dayStart = startOfDay(day);
    const dayOrders = completedOrders.filter(o => {
      const completedDay = startOfDay(new Date(o.completedAt!));
      return completedDay.getTime() === dayStart.getTime();
    });
    
    return {
      date: day,
      points: dayOrders.reduce((sum, o) => sum + o.points, 0),
      orders: dayOrders.length,
    };
  });

  const maxDailyPoints = Math.max(...dailyData.map(d => d.points), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">My Performance Metrics</h2>
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={onDateRangeChange}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{totalPoints}</span>
          </div>
          <p className="text-primary-100 text-sm font-medium">Total Points</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 text-green-500" />
            <span className="text-3xl font-bold text-neutral-900">{completedOrders.length}</span>
          </div>
          <p className="text-neutral-500 text-sm font-medium">Orders Completed</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <span className="text-3xl font-bold text-neutral-900">{averagePoints}</span>
          </div>
          <p className="text-neutral-500 text-sm font-medium">Avg Points/Order</p>
        </div>
      </div>

      {/* In Progress Section */}
      {inProgressOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Currently Working On</h3>
          </div>
          <div className="space-y-2">
            {inProgressOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <span className="text-blue-800">
                  {order.orderNumber} - {order.walletTypeName}
                </span>
                <span className="font-semibold text-blue-600">{order.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Daily Breakdown</h3>
        
        {dailyData.every(d => d.points === 0) ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500">No orders completed in this date range</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyData.map((day) => (
              <div key={day.date.toISOString()} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-700">
                    {format(day.date, 'EEE, MMM d')}
                  </span>
                  {day.points > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-600">{day.orders} orders</span>
                      <span className="font-semibold text-primary-600">{day.points} pts</span>
                    </div>
                  )}
                </div>
                
                {day.points > 0 ? (
                  <div className="h-8 bg-neutral-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-end px-3"
                      style={{ width: `${(day.points / maxDailyPoints) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {day.points}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-8 bg-neutral-50 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-neutral-400">No activity</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
