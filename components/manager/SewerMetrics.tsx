'use client';

import { OrderDetail, Sewer } from '@/lib/supabase';
import { BarChart3, TrendingUp } from 'lucide-react';
import { isWithinDateRange } from '@/lib/dateUtils';
import { format } from 'date-fns';

interface SewerMetricsProps {
  orders: OrderDetail[];
  sewers: Sewer[];
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  currentPreset?: string;
  onPresetChange?: (preset: string) => void;
}

export default function SewerMetrics({ orders, sewers, dateRange }: SewerMetricsProps) {
  const activeSewers = sewers.filter(s => s.is_active);

  const sewerStats = activeSewers.map(sewer => {
    const completedOrders = orders.filter(o => 
      o.claimed_by === sewer.id && 
      o.status === 'completed' &&
      o.completed_at &&
      isWithinDateRange(new Date(o.completed_at), dateRange.start, dateRange.end)
    );

    const totalPoints = completedOrders.reduce((sum, o) => sum + o.points, 0);
    const averagePoints = completedOrders.length > 0 
      ? Math.round(totalPoints / completedOrders.length * 10) / 10 
      : 0;

    return {
      sewer,
      completedOrders: completedOrders.length,
      totalPoints,
      averagePoints,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Sewer Performance Metrics</h2>
        </div>
      </div>

      {/* Date Range Header */}
      <div className="bg-neutral-100 rounded-lg px-4 py-2">
        <p className="text-sm font-medium text-neutral-700">
          {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sewerStats.map((stat, index) => (
          <div 
            key={stat.sewer.id} 
            className="border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white relative"
          >
            {/* Rank Badge */}
            {index < 3 && stat.totalPoints > 0 && (
              <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
              }`}>
                {index + 1}
              </div>
            )}

            {/* Sewer Name Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">{stat.sewer.name}</h3>
            </div>

            {/* Centered Metrics Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">{stat.completedOrders}</div>
                <div className="text-xs text-neutral-500 mt-1">Completed</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{stat.totalPoints}</div>
                <div className="text-xs text-neutral-500 mt-1">Total Points</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stat.averagePoints}</div>
                <div className="text-xs text-neutral-500 mt-1">Avg Points</div>
              </div>
            </div>
          </div>
        ))}

        {sewerStats.length === 0 && (
          <div className="col-span-3 text-center py-12 text-neutral-500">
            No active sewers found
          </div>
        )}
      </div>

      <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-neutral-900 mb-1">Metrics Insight</h4>
            <p className="text-sm text-neutral-600">
              Performance is calculated based on completed orders within the selected date range. 
              Rankings are determined by total points earned.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
