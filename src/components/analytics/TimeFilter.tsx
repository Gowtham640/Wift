'use client';

export type TimePeriod = 'week' | 'month' | '3months' | '6months' | 'year' | '2years' | 'lifetime';

interface TimeFilterProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const periods = [
  { key: 'week' as TimePeriod, label: 'Past Week' },
  { key: 'month' as TimePeriod, label: 'Past Month' },
  { key: '3months' as TimePeriod, label: '3 Months' },
  { key: '6months' as TimePeriod, label: '6 Months' },
  { key: 'year' as TimePeriod, label: 'Past Year' },
  { key: '2years' as TimePeriod, label: '2 Years' },
  { key: 'lifetime' as TimePeriod, label: 'Lifetime' }
];

export function getDateRangeForPeriod(period: TimePeriod): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(endDate.getDate() - 6);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case '2years':
      startDate.setFullYear(endDate.getFullYear() - 2);
      break;
    case 'lifetime':
      startDate = new Date('2020-01-01'); // Arbitrary early date
      break;
  }

  return { startDate, endDate };
}

export default function TimeFilter({ selectedPeriod, onPeriodChange }: TimeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {periods.map((period) => (
        <button
          key={period.key}
          onClick={() => onPeriodChange(period.key)}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            selectedPeriod === period.key
              ? 'bg-white/20 text-white border border-white/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
