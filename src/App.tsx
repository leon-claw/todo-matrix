import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
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
  const [deleteTarget, setDeleteTarget] = useState<MatrixTask | null>(null);
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

  function requestDeleteTask(taskId: string) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    if (task) {
      setDeleteTarget(task);
    }
  }

  function confirmDeleteTask() {
    if (!deleteTarget) {
      return;
    }

    deleteTask(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: 1480, py: { xs: 2, md: 3 } }}>
      <AppHeader onCreateTask={openCreateTask} />

      <Box
        component="main"
        sx={{
          alignItems: 'start',
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(460px, 0.92fr) minmax(420px, 1.08fr)',
          },
        }}
      >
        <PriorityAxis onMetricsChange={updateTaskMetrics} tasks={tasks} />

        <Paper
          component="section"
          aria-label="TODO 列表"
          variant="outlined"
          sx={{
            display: 'grid',
            gap: 1.5,
            p: { xs: 1.5, md: 2 },
          }}
        >
          {storageError ? <Alert severity="error">{storageError}</Alert> : null}

          <StatsStrip
            active={stats.active}
            activeFilter={taskFilter}
            completed={stats.completed}
            onFilterChange={setTaskFilter}
            shownOnAxis={stats.shownOnAxis}
            total={stats.total}
          />

          {isLoading ? (
            <Paper
              variant="outlined"
              sx={{
                alignItems: 'center',
                color: 'text.secondary',
                display: 'flex',
                gap: 1.5,
                justifyContent: 'center',
                minHeight: 280,
                p: 3,
              }}
            >
              <CircularProgress size={20} />
              正在读取本地数据...
            </Paper>
          ) : (
            <TodoList
              onDeleteTask={requestDeleteTask}
              onEditTask={openEditTask}
              onMetricsChange={updateTaskMetrics}
              onToggleAxis={toggleAxisVisibility}
              onToggleTask={toggleTask}
              tasks={visibleTasks}
            />
          )}
        </Paper>
      </Box>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={Boolean(editorState)}
        onClose={closeEditor}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
            },
          },
        }}
      >
        <IconButton
          aria-label="关闭"
          onClick={closeEditor}
          sx={{ position: 'absolute', right: 12, top: 12, zIndex: 1 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          {editorState ? (
            <TaskComposer
              initialTask={editorState.task}
              mode={editorState.mode}
              onCancel={closeEditor}
              onSubmit={handleSubmitTask}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        slotProps={{
          paper: {
            sx: { borderRadius: 3 },
          },
        }}
      >
        <DialogTitle>确认删除任务？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            删除后将从本地数据中移除“{deleteTarget?.title}”。这个操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined">
            取消
          </Button>
          <Button color="error" onClick={confirmDeleteTask} variant="contained">
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
