import { Plus } from 'lucide-react';
import { InstallPrompt } from './InstallPrompt';

interface AppHeaderProps {
  onCreateTask: () => void;
}

export function AppHeader({ onCreateTask }: AppHeaderProps) {
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

      <div className="status-row" aria-label="任务操作">
        <InstallPrompt />
        <button className="header-action-button" onClick={onCreateTask} type="button">
          <Plus size={16} aria-hidden="true" />
          添加任务
        </button>
      </div>
    </header>
  );
}
