import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { MatrixTask, TaskMetrics } from '../types';

interface TaskCardProps {
  task: MatrixTask;
  onDelete: (taskId: string) => void;
  onEdit: (task: MatrixTask) => void;
  onMetricsChange: (taskId: string, metrics: Partial<TaskMetrics>) => void;
  onToggle: (taskId: string) => void;
  onToggleAxis: (taskId: string) => void;
}

export function TaskCard({
  task,
  onDelete,
  onEdit,
  onMetricsChange,
  onToggle,
  onToggleAxis,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className={task.completed ? 'task-card completed' : 'task-card'}>
      <button
        aria-label={task.completed ? '标记为未完成' : '标记为完成'}
        className="icon-button"
        onClick={() => onToggle(task.id)}
        title={task.completed ? '标记为未完成' : '标记为完成'}
        type="button"
      >
        {task.completed ? <Check size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}
      </button>

      <div className="task-copy">
        <button
          aria-expanded={isExpanded}
          className="task-title-button"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          <h3>{task.title}</h3>
        </button>

        {isExpanded ? (
          <div className="task-details">
            {task.notes ? <p>{task.notes}</p> : null}

            <div className="task-metrics" aria-label="任务指标">
              <label>
                <span>重要 {task.importance}</span>
                <input
                  max={100}
                  min={0}
                  onChange={(event) =>
                    onMetricsChange(task.id, { importance: Number(event.target.value) })
                  }
                  type="range"
                  value={task.importance}
                />
              </label>
              <label>
                <span>紧急 {task.urgency}</span>
                <input
                  max={100}
                  min={0}
                  onChange={(event) =>
                    onMetricsChange(task.id, { urgency: Number(event.target.value) })
                  }
                  type="range"
                  value={task.urgency}
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>

      <div className="task-card-actions">
        <button
          aria-label={isExpanded ? '折叠任务' : '展开任务'}
          className="icon-button"
          onClick={() => setIsExpanded((current) => !current)}
          title={isExpanded ? '折叠任务' : '展开任务'}
          type="button"
        >
          {isExpanded ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
        </button>
        <button
          aria-label="编辑任务"
          className="icon-button"
          onClick={() => onEdit(task)}
          title="编辑任务"
          type="button"
        >
          <Pencil size={17} aria-hidden="true" />
        </button>
        <button
          aria-label={task.showOnAxis ? '从坐标轴隐藏' : '显示在坐标轴上'}
          className={task.showOnAxis ? 'icon-button active' : 'icon-button'}
          onClick={() => onToggleAxis(task.id)}
          title={task.showOnAxis ? '从坐标轴隐藏' : '显示在坐标轴上'}
          type="button"
        >
          {task.showOnAxis ? <Eye size={17} aria-hidden="true" /> : <EyeOff size={17} aria-hidden="true" />}
        </button>
        <button
          aria-label="删除任务"
          className="icon-button danger"
          onClick={() => onDelete(task.id)}
          title="删除任务"
          type="button"
        >
          <Trash2 size={17} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
