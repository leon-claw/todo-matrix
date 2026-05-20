import { useEffect, useMemo, useState } from 'react';
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
import { AuthPanel } from './components/AuthPanel';
import { ChangePasswordPanel } from './components/ChangePasswordPanel';
import { DataResolutionPanel } from './components/DataResolutionPanel';
import { PriorityAxis } from './components/PriorityAxis';
import { StatsStrip } from './components/StatsStrip';
import { TaskComposer } from './components/TaskComposer';
import { TodoList } from './components/TodoList';
import { useAuth } from './hooks/useAuth';
import { useCloudTasks } from './hooks/useCloudTasks';
import { useLocalTasks } from './hooks/useLocalTasks';
import { ApiError } from './lib/apiClient';
import type { MatrixTask, TaskFilter, TaskFormValues, TaskMetrics } from './types';

type EditorState =
  | { mode: 'create'; task: null }
  | { mode: 'edit'; task: MatrixTask };

export function App() {
  const {
    authError,
    changePassword,
    isAuthLoading,
    login,
    logout,
    register,
    setAuthError,
    user,
  } = useAuth();
  const localStore = useLocalTasks();
  const [localDataResolved, setLocalDataResolved] = useState(false);
  const migrationRequired = Boolean(user && localStore.tasks.length > 0 && !localDataResolved);
  const isCloudMode = Boolean(user && !migrationRequired);
  const cloudStore = useCloudTasks(Boolean(user));
  const activeStore = isCloudMode ? cloudStore : localStore;
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MatrixTask | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('active');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);

  useEffect(() => {
    setLocalDataResolved(false);
    setTaskFilter('active');
  }, [user?.id]);

  const visibleTasks = useMemo(() => {
    const tasks = activeStore.tasks;

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
  }, [activeStore.tasks, taskFilter]);

  function openCreateTask() {
    setEditorState({ mode: 'create', task: null });
  }

  function openEditTask(task: MatrixTask) {
    setEditorState({ mode: 'edit', task });
  }

  function closeEditor() {
    setEditorState(null);
  }

  async function handleSubmitTask(values: TaskFormValues) {
    if (!editorState) {
      return;
    }

    if (editorState.mode === 'edit') {
      await activeStore.updateTask(editorState.task.id, values);
    } else {
      await activeStore.addTask(values);
    }

    closeEditor();
  }

  function requestDeleteTask(taskId: string) {
    const task = activeStore.tasks.find((currentTask) => currentTask.id === taskId);
    if (task) {
      setDeleteTarget(task);
    }
  }

  async function confirmDeleteTask() {
    if (!deleteTarget) {
      return;
    }

    await activeStore.deleteTask(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleLogin(email: string, password: string) {
    try {
      await login({ email, password });
      setAuthDialogOpen(false);
    } catch (error) {
      setAuthError(error instanceof ApiError ? error.message : '登录失败，请检查邮箱和密码。');
      throw error;
    }
  }

  async function handleRegister(
    email: string,
    password: string,
    captcha: { captchaId: string; captchaAnswer: string },
  ) {
    try {
      await register({ email, password, ...captcha });
      setAuthDialogOpen(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setAuthError('注册失败，这个邮箱已经被使用。');
      } else {
        setAuthError(error instanceof ApiError ? error.message : '注册失败，可能邮箱已被使用或后端暂不可用。');
      }
      throw error;
    }
  }

  async function handleLogout() {
    await logout();
    setChangePasswordDialogOpen(false);
    setLocalDataResolved(false);
  }

  async function handleChangePassword(currentPassword: string, nextPassword: string) {
    setIsPasswordChanging(true);
    setChangePasswordError(null);
    try {
      await changePassword({ currentPassword, nextPassword });
      setChangePasswordDialogOpen(false);
    } catch (error) {
      setChangePasswordError(error instanceof ApiError ? error.message : '修改密码失败，请稍后重试。');
      throw error;
    } finally {
      setIsPasswordChanging(false);
    }
  }

  async function handleReplaceCloudWithLocal() {
    setMigrationBusy(true);
    try {
      await cloudStore.replaceCloudTasks(localStore.tasks);
      await localStore.clearLocalTasks();
      setLocalDataResolved(true);
      await cloudStore.reloadTasks();
    } finally {
      setMigrationBusy(false);
    }
  }

  async function handleClearLocalOnly() {
    setMigrationBusy(true);
    try {
      await localStore.clearLocalTasks();
      setLocalDataResolved(true);
      await cloudStore.reloadTasks();
    } finally {
      setMigrationBusy(false);
    }
  }

  function renderTodoSurface() {
    if (migrationRequired) {
      return (
        <DataResolutionPanel
          isBusy={migrationBusy}
          localCount={localStore.tasks.length}
          onClearLocal={handleClearLocalOnly}
          onLogout={handleLogout}
          onReplaceCloud={handleReplaceCloudWithLocal}
        />
      );
    }

    return (
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
        <PriorityAxis
          onMetricsChange={(taskId: string, metrics: Partial<TaskMetrics>) =>
            activeStore.updateTaskMetrics(taskId, metrics)
          }
          tasks={activeStore.tasks}
        />

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
          {activeStore.storageError ? <Alert severity="error">{activeStore.storageError}</Alert> : null}

          <StatsStrip
            active={activeStore.stats.active}
            activeFilter={taskFilter}
            completed={activeStore.stats.completed}
            onFilterChange={setTaskFilter}
            shownOnAxis={activeStore.stats.shownOnAxis}
            total={activeStore.stats.total}
          />

          {activeStore.isLoading || isAuthLoading ? (
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
              正在读取数据...
            </Paper>
          ) : (
            <TodoList
              onDeleteTask={requestDeleteTask}
              onEditTask={openEditTask}
              onMetricsChange={(taskId, metrics) => activeStore.updateTaskMetrics(taskId, metrics)}
              onToggleAxis={activeStore.toggleAxisVisibility}
              onToggleTask={activeStore.toggleTask}
              tasks={visibleTasks}
            />
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: 1480, py: { xs: 2, md: 3 } }}>
      <AppHeader
        isCloudMode={isCloudMode}
        isSyncing={isCloudMode && cloudStore.isSyncing}
        onChangePassword={() => {
          setChangePasswordError(null);
          setChangePasswordDialogOpen(true);
        }}
        onCreateTask={openCreateTask}
        onLogin={() => setAuthDialogOpen(true)}
        onLogout={handleLogout}
        user={user}
      />

      {renderTodoSurface()}

      <Dialog
        fullWidth
        maxWidth="sm"
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <IconButton
          aria-label="关闭"
          onClick={() => setAuthDialogOpen(false)}
          sx={{ position: 'absolute', right: 12, top: 12, zIndex: 1 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <AuthPanel error={authError} isLoading={isAuthLoading} onLogin={handleLogin} onRegister={handleRegister} />
        </DialogContent>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <IconButton
          aria-label="关闭"
          onClick={() => setChangePasswordDialogOpen(false)}
          sx={{ position: 'absolute', right: 12, top: 12, zIndex: 1 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <ChangePasswordPanel
            error={changePasswordError}
            isLoading={isPasswordChanging}
            onSubmit={handleChangePassword}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={Boolean(editorState)}
        onClose={closeEditor}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
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

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>确认删除任务？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            删除后将移除“{deleteTarget?.title}”。这个操作无法撤销。
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
