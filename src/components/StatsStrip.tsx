import { BarChart3, Check, CircleDot } from 'lucide-react';
import type { TaskFilter } from '../types';

interface StatsStripProps {
  active: number;
  activeFilter: TaskFilter;
  completed: number;
  onFilterChange: (filter: TaskFilter) => void;
  shownOnAxis: number;
  total: number;
}

const filterOptions: Array<{
  icon: typeof BarChart3;
  id: TaskFilter;
  label: string;
}> = [
  { id: 'all', label: '全部', icon: BarChart3 },
  { id: 'active', label: '进行中', icon: CircleDot },
  { id: 'completed', label: '已完成', icon: Check },
  { id: 'axis', label: '坐标轴', icon: CircleDot },
];

export function StatsStrip({
  active,
  activeFilter,
  completed,
  onFilterChange,
  shownOnAxis,
  total,
}: StatsStripProps) {
  const counts: Record<TaskFilter, number> = {
    all: total,
    active,
    completed,
    axis: shownOnAxis,
  };

  return (
    <section className="stats-strip" aria-label="任务筛选">
      {filterOptions.map((option) => {
        const Icon = option.icon;
        const selected = activeFilter === option.id;

        return (
          <button
            aria-pressed={selected}
            className={selected ? 'stat stat-button active' : 'stat stat-button'}
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            type="button"
          >
            <Icon size={18} aria-hidden="true" />
            <span>{counts[option.id]}</span>
            <small>{option.label}</small>
          </button>
        );
      })}
    </section>
  );
}
