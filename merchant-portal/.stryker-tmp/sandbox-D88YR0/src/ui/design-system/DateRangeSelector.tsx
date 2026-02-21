import React, { useState } from 'react';
import { cn } from './tokens';
import './DateRangeSelector.css';

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeSelectorProps {
  onSelect: (range: DateRange, preset: DatePreset) => void;
  initialPreset?: DatePreset;
}

/**
 * DateRangeSelector: Period selector with presets
 * Presets: today, yesterday, week, month
 * Custom: date range picker
 */
export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  onSelect,
  initialPreset = 'today',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(initialPreset);
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const getDateRange = (preset: DatePreset): DateRange => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        return { from: today, to: new Date() };

      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: yesterday, to: today };
      }

      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: weekAgo, to: new Date() };
      }

      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { from: monthAgo, to: new Date() };
      }

      case 'custom': {
        return {
          from: customFrom ? new Date(customFrom) : today,
          to: customTo ? new Date(customTo) : new Date(),
        };
      }

      default:
        return { from: today, to: new Date() };
    }
  };

  const handlePresetSelect = (preset: DatePreset) => {
    setSelectedPreset(preset);
    const range = getDateRange(preset);
    onSelect(range, preset);
  };

  const handleCustomSubmit = () => {
    const range = getDateRange('custom');
    onSelect(range, 'custom');
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="date-range-selector">
      {/* Presets */}
      <div className="date-range-selector__presets">
        <button
          className={cn(
            'date-range-selector__preset',
            selectedPreset === 'today' ? 'date-range-selector__preset--active' : ''
          )}
          onClick={() => handlePresetSelect('today')}
        >
          Hoje
        </button>
        <button
          className={cn(
            'date-range-selector__preset',
            selectedPreset === 'yesterday' ? 'date-range-selector__preset--active' : ''
          )}
          onClick={() => handlePresetSelect('yesterday')}
        >
          Ontem
        </button>
        <button
          className={cn(
            'date-range-selector__preset',
            selectedPreset === 'week' ? 'date-range-selector__preset--active' : ''
          )}
          onClick={() => handlePresetSelect('week')}
        >
          7 dias
        </button>
        <button
          className={cn(
            'date-range-selector__preset',
            selectedPreset === 'month' ? 'date-range-selector__preset--active' : ''
          )}
          onClick={() => handlePresetSelect('month')}
        >
          30 dias
        </button>
      </div>

      {/* Custom Range */}
      <div className="date-range-selector__custom">
        <input
          type="date"
          className="date-range-selector__input"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          placeholder="De"
        />
        <span className="date-range-selector__separator">—</span>
        <input
          type="date"
          className="date-range-selector__input"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          placeholder="Até"
        />
        {(customFrom || customTo) && (
          <button
            className="date-range-selector__custom-btn"
            onClick={handleCustomSubmit}
          >
            ✓
          </button>
        )}
      </div>

      {/* Selected Range Display */}
      <div className="date-range-selector__display">
        {selectedPreset !== 'custom' ? (
          <span className="date-range-selector__display-text">
            {selectedPreset === 'today' && 'Hoje'}
            {selectedPreset === 'yesterday' && 'Ontem'}
            {selectedPreset === 'week' && 'Últimos 7 dias'}
            {selectedPreset === 'month' && 'Últimos 30 dias'}
          </span>
        ) : customFrom && customTo ? (
          <span className="date-range-selector__display-text">
            {formatDate(new Date(customFrom))} — {formatDate(new Date(customTo))}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default DateRangeSelector;
