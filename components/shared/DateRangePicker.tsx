'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (range: { start: Date; end: Date }) => void;
  currentPreset?: string;
  onPresetChange?: (preset: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange, currentPreset, onPresetChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lastClick, setLastClick] = useState<{ date: string; time: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setError('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyDateRange = () => {
    setError('');
    
    if (!tempStart || !tempEnd) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(tempStart);
    const end = new Date(tempEnd);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Invalid date format');
      return;
    }
    
    if (start > end) {
      setError('Start date must be before end date');
      return;
    }
    
    onChange({ start, end });
    onPresetChange?.('custom');
    setIsOpen(false);
    setError('');
  };

  const handleDateClick = (inputType: 'start' | 'end', value: string) => {
    const now = Date.now();
    
    // Check for double-click (within 300ms)
    if (lastClick && lastClick.date === value && now - lastClick.time < 300) {
      // Double-click detected - set both dates to same day
      setTempStart(value);
      setTempEnd(value);
      setLastClick(null);
      
      // Auto-apply single day selection
      setTimeout(() => {
        const singleDay = new Date(value);
        onChange({ start: singleDay, end: singleDay });
        onPresetChange?.('custom');
        setIsOpen(false);
        setError('');
      }, 100);
    } else {
      // Single click - just update the field
      if (inputType === 'start') {
        setTempStart(value);
      } else {
        setTempEnd(value);
      }
      setLastClick({ date: value, time: now });
      setError('');
    }
  };

  const applyPreset = (preset: 'today' | 'this-week' | 'this-month' | 'last-30-days') => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = now;
        break;
      case 'this-week':
        const day = now.getDay();
        const diff = now.getDate() - day;
        start = new Date(now.getFullYear(), now.getMonth(), diff);
        break;
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-30-days':
        start = new Date(now);
        start.setDate(now.getDate() - 30);
        break;
    }

    onChange({ start, end });
    onPresetChange?.(preset);
    setIsOpen(false);
    setError('');
  };

  const openPicker = () => {
    setTempStart(format(startDate, 'yyyy-MM-dd'));
    setTempEnd(format(endDate, 'yyyy-MM-dd'));
    setError('');
    setIsOpen(true);
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = format(start, 'MMM d');
    const endStr = format(end, 'MMM d, yyyy');
    
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }
    
    return `${startStr} - ${endStr}`;
  };

  const getPresetLabel = () => {
    if (!currentPreset || currentPreset === 'custom') {
      return formatDateRange(startDate, endDate);
    }
    
    const presetNames = {
      'today': 'Today',
      'this-week': 'This Week',
      'this-month': 'This Month',
      'last-30-days': 'Last 30 Days',
    };
    
    return `${presetNames[currentPreset as keyof typeof presetNames]} (${formatDateRange(startDate, endDate)})`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={openPicker}
        className="flex items-center gap-2 px-4 py-3 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <Calendar className="w-5 h-5 text-neutral-400" />
        <span className="text-sm font-medium text-neutral-700">
          {getPresetLabel()}
        </span>
        <ChevronDown className="w-4 h-4 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-neutral-200 p-4 z-50">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-2">Quick Select</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => applyPreset('today')}
                  className="px-3 py-2 text-sm bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors text-left"
                >
                  Today
                </button>
                <button
                  onClick={() => applyPreset('this-week')}
                  className="px-3 py-2 text-sm bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors text-left"
                >
                  This Week
                </button>
                <button
                  onClick={() => applyPreset('this-month')}
                  className="px-3 py-2 text-sm bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors text-left"
                >
                  This Month
                </button>
                <button
                  onClick={() => applyPreset('last-30-days')}
                  className="px-3 py-2 text-sm bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors text-left"
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Custom Range</h4>
              
              {error && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => handleDateClick('start', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => handleDateClick('end', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={applyDateRange}
                  disabled={!tempStart || !tempEnd}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
