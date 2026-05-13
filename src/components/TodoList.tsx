import { Inbox } from 'lucide-react';
import type { MatrixTask, TaskMetrics } from '../types';
import { TaskCard } from './TaskCard';

interface TodoListProps {
  tasks: MatrixTask[];
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: MatrixTask) => void;
  onMetricsChange: (taskId: string, metrics: Partial<TaskMetrics>) => void;
  onToggleAxis: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export function TodoList({
  tasks,
  onDeleteTask,
  onEditTask,
  onMetricsChange,
  onToggleAxis,
  onToggleTask,
}: TodoListProps) {
  if (!tasks.length) {
    return (
      <section className="todo-list empty" aria-label="TODO 列表">
        <Inbox size={28} aria-hidden="true" />
        <p>暂无任务</p>
      </section>
    );
  }

  return (
    <section className="todo-list" aria-label="TODO 列表">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
          onMetricsChange={onMetricsChange}
          onToggle={onToggleTask}
          onToggleAxis={onToggleAxis}
          task={task}
        />
      ))}
    </section>
  );
}
