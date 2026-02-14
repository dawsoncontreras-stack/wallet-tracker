'use client';

import { OrderDetail, Sewer } from '@/lib/supabase';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { Calendar, TrendingUp } from 'lucide-react';

interface PerformanceCalendarProps {
  orders: OrderDetail[];
  sewers: Sewer[];
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  currentPreset?: string;
  onPresetChange?: (preset: string) => void;
}

interface DayData {
  date: Date;
  sewerStats: Array<{
    sewerId: string;
    sewerName: string;
    points: number;
    ordersCompleted: number;
  }>;
}

export default function PerformanceCalendar({ orders, sewers, dateRange }: PerformanceCalendarProps) {
  const activeSewers = sewers.filter(s => s.is_active);
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

  const dailyData: DayData[] = days.map(day => {
    const dayStart = startOfDay(day);
    
    const sewerStats = activeSewers.map(sewer => {
      const dayOrders = orders.filter(o => 
        o.claimed_by === sewer.id &&
        o.status === 'completed' &&
        o.completed_at &&
        startOfDay(new Date(o.completed_at)).getTime() === dayStart.getTime()
      );
      
      return {
        sewerId: sewer.id,
        sewerName: sewer.name,
        points: dayOrders.reduce((sum, o) => sum + o.points, 0),
        ordersCompleted: dayOrders.length,
      };
    }).filter(s => s.points > 0);

    return {
      date: day,
      sewerStats,
    };
  });

  const maxPoints = Math.max(
    ...dailyData.flatMap(d => d.sewerStats.map(s => s.points)),
    1
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Performance Calendar</h2>
        </div>
      </div>

      <div className="space-y-4">
        {dailyData.map((dayData) => {
          const totalDayPoints = dayData.sewerStats.reduce((sum, s) => sum + s.points, 0);
          
          return (
            <div key={dayData.date.toISOString()} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-700">
                  {format(dayData.date, 'EEE, MMM d, yyyy')}
                </div>
                {totalDayPoints > 0 && (
                  <div className="flex items-center gap-1 text-primary-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">{totalDayPoints} pts</span>
                  </div>
                )}
              </div>

              {dayData.sewerStats.length === 0 ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                  <p className="text-sm text-neutral-500 text-center">No activity</p>
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
                  {dayData.sewerStats.map((stat) => {
                    const barWidth = (stat.points / maxPoints) * 100;
                    
                    return (
                      <div key={stat.sewerId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-neutral-700">{stat.sewerName}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-neutral-500">{stat.ordersCompleted} orders</span>
                            <span className="font-semibold text-primary-600">{stat.points} pts</span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {dailyData.every(d => d.sewerStats.length === 0) && (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">No completed orders in this time range</p>
            <p className="text-neutral-500 text-sm mt-1">Orders will appear here once completed</p>
          </div>
        )}
      </div>
    </div>
  );
}
