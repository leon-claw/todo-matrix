import { BarChart3, Check, CircleDot } from 'lucide-react';

interface StatsStripProps {
  active: number;
  completed: number;
  shownOnAxis: number;
  total: number;
}

export function StatsStrip({
  active,
  completed,
  shownOnAxis,
  total,
}: StatsStripProps) {
  return (
    <section className="stats-strip" aria-label="任务概览">
      <div className="stat">
        <BarChart3 size={18} aria-hidden="true" />
        <span>{total}</span>
        <small>全部</small>
      </div>
      <div className="stat">
        <CircleDot size={18} aria-hidden="true" />
        <span>{active}</span>
        <small>进行中</small>
      </div>
      <div className="stat">
        <Check size={18} aria-hidden="true" />
        <span>{completed}</span>
        <small>已完成</small>
      </div>
      <div className="stat">
        <CircleDot size={18} aria-hidden="true" />
        <span>{shownOnAxis}</span>
        <small>坐标轴</small>
      </div>
    </section>
  );
}
