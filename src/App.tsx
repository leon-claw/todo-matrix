import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { PriorityAxis } from './components/PriorityAxis';
import { StatsStrip } from './components/StatsStrip';
import { TaskComposer } from './components/TaskComposer';
import { TodoList } from './components/TodoList';
import { useLocalTasks } from './hooks/useLocalTasks';
import type { MatrixTask, TaskFilter, TaskFormValues } from './types';

type EditorState =
  | { mode: 'create'; task: null }
  | { mode: 'edit'; task: MatrixTask };

export function App() {
  const {
    tasks,
    isLoading,
    storageError,
    stats,
    addTask,
    updateTask,
    toggleTask,
    updateTaskMetrics,
    toggleAxisVisibility,
    deleteTask,
  } = useLocalTasks();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('active');

  const visibleTasks = useMemo(() => {
    if (taskFilter === 'all') {
      return tasks;
    }

    if (taskFilter === 'completed') {
      return tasks.filter((task) => task.completed);
    }

    if (taskFilter === 'axis') {
      return tasks.filter((task) => task.showOnAxis && !task.completed);
    }

    return tasks.filter((task) => !task.completed);
  }, [taskFilter, tasks]);

  function openCreateTask() {
    setEditorState({ mode: 'create', task: null });
  }

  function openEditTask(task: MatrixTask) {
    setEditorState({ mode: 'edit', task });
  }

  function closeEditor() {
    setEditorState(null);
  }

  function handleSubmitTask(values: TaskFormValues) {
    if (!editorState) {
      return;
    }

    if (editorState.mode === 'edit') {
      updateTask(editorState.task.id, values);
    } else {
      addTask(values);
    }

    closeEditor();
  }

  return (
    <div className="app-shell">
      <AppHeader onCreateTask={openCreateTask} />

      <main className="workspace">
        <PriorityAxis onMetricsChange={updateTaskMetrics} tasks={tasks} />

        <section className="todo-panel" aria-label="TODO 列表">
          {storageError ? <p className="storage-error">{storageError}</p> : null}

          <StatsStrip
            active={stats.active}
            activeFilter={taskFilter}
            completed={stats.completed}
            onFilterChange={setTaskFilter}
            shownOnAxis={stats.shownOnAxis}
            total={stats.total}
          />

          {isLoading ? (
            <div className="loading-state">正在读取本地数据...</div>
          ) : (
            <TodoList
              onDeleteTask={deleteTask}
              onEditTask={openEditTask}
              onMetricsChange={updateTaskMetrics}
              onToggleAxis={toggleAxisVisibility}
              onToggleTask={toggleTask}
              tasks={visibleTasks}
            />
          )}
        </section>
      </main>

      {editorState ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeEditor}>
          <section
            aria-label={editorState.mode === 'create' ? '添加任务' : '编辑任务'}
            aria-modal="true"
            className="task-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="关闭"
              className="icon-button modal-close"
              onClick={closeEditor}
              title="关闭"
              type="button"
            >
              <X size={18} aria-hidden="true" />
            </button>
            <TaskComposer
              initialTask={editorState.task}
              mode={editorState.mode}
              onCancel={closeEditor}
              onSubmit={handleSubmitTask}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
