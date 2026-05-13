import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { PriorityAxis } from './components/PriorityAxis';
import { StatsStrip } from './components/StatsStrip';
import { TaskComposer } from './components/TaskComposer';
import { TodoList } from './components/TodoList';
import { useLocalTasks } from './hooks/useLocalTasks';

export function App() {
  const {
    tasks,
    isLoading,
    storageError,
    stats,
    addTask,
    toggleTask,
    updateTaskMetrics,
    toggleAxisVisibility,
    deleteTask,
  } = useLocalTasks();
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const updateNetworkState = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);

    return () => {
      window.removeEventListener('online', updateNetworkState);
      window.removeEventListener('offline', updateNetworkState);
    };
  }, []);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => !task.completed);
  }, [tasks]);

  return (
    <div className="app-shell">
      <AppHeader isOffline={isOffline} totalTasks={stats.total} />

      <main className="workspace">
        <PriorityAxis onMetricsChange={updateTaskMetrics} tasks={tasks} />

        <section className="todo-panel" aria-label="TODO 列表">
          <TaskComposer onAddTask={addTask} />
          {storageError ? <p className="storage-error">{storageError}</p> : null}

          <StatsStrip
            active={stats.active}
            completed={stats.completed}
            shownOnAxis={stats.shownOnAxis}
            total={stats.total}
          />

          {isLoading ? (
            <div className="loading-state">正在读取本地数据...</div>
          ) : (
            <TodoList
              onDeleteTask={deleteTask}
              onMetricsChange={updateTaskMetrics}
              onToggleAxis={toggleAxisVisibility}
              onToggleTask={toggleTask}
              tasks={visibleTasks}
            />
          )}
        </section>
      </main>
    </div>
  );
}
