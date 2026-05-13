import { CheckCircle2, CloudOff, Database, MonitorSmartphone } from 'lucide-react';
import { InstallPrompt } from './InstallPrompt';

interface AppHeaderProps {
  isOffline: boolean;
  totalTasks: number;
}

export function AppHeader({ isOffline, totalTasks }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div>
          <h1>Todo Matrix</h1>
          <p>离线优先的本地 TODO 坐标轴</p>
        </div>
      </div>

      <div className="status-row" aria-label="应用状态">
        <span className="status-pill">
          <Database size={16} aria-hidden="true" />
          本地存储
        </span>
        <InstallPrompt />
        <span className="status-pill">
          <MonitorSmartphone size={16} aria-hidden="true" />
          PC / 移动端
        </span>
        <span className={isOffline ? 'status-pill warning' : 'status-pill success'}>
          {isOffline ? <CloudOff size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
          {isOffline ? '离线可用' : '已就绪'}
        </span>
        <span className="task-total">{totalTasks} 项</span>
      </div>
    </header>
  );
}
