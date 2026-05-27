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
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
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

const taskEditorFormId = 'task-editor-form';
const networkStatusEventName = 'todo-matrix:network-status';

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
  const [clearCompletedDialogOpen, setClearCompletedDialogOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('active');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [isMobileAxisHidden, setIsMobileAxisHidden] = useState(false);

  useEffect(() => {
    setLocalDataResolved(false);
    setTaskFilter('active');
  }, [user?.id]);

  useEffect(() => {
    const updateOnlineState = () => {
      setIsOnline(navigator.onLine);
    };
    const updateApiNetworkState = (event: Event) => {
      const detail = (event as CustomEvent<{ online?: unknown }>).detail;
      if (typeof detail?.online === 'boolean') {
        setIsOnline(detail.online && navigator.onLine);
      }
    };

    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    window.addEventListener(networkStatusEventName, updateApiNetworkState);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
      window.removeEventListener(networkStatusEventName, updateApiNetworkState);
    };
  }, []);

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

  async function confirmClearCompletedTasks() {
    await activeStore.clearCompletedTasks();
    setClearCompletedDialogOpen(false);
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
    const showClearCompletedAction = taskFilter === 'all' || taskFilter === 'completed';

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
          gap: { xs: 2, lg: 2.5 },
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(480px, 0.98fr) minmax(420px, 1.02fr)',
          },
          minHeight: { lg: 'calc(100vh - 132px)' },
        }}
      >
        <Box sx={{ display: 'grid', gap: 1.25, minWidth: 0 }}>
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setIsMobileAxisHidden((current) => !current)}
              size="small"
              startIcon={isMobileAxisHidden ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
              variant="outlined"
              sx={{ bgcolor: 'background.paper' }}
            >
              {isMobileAxisHidden ? '显示坐标轴' : '隐藏坐标轴'}
            </Button>
          </Box>
          <Box sx={{ display: isMobileAxisHidden ? { xs: 'none', lg: 'block' } : 'block', minWidth: 0 }}>
            <PriorityAxis
              onInteractionEnd={isCloudMode ? cloudStore.resumeSync : undefined}
              onInteractionStart={isCloudMode ? cloudStore.pauseSync : undefined}
              onMetricsChange={(taskId: string, metrics: Partial<TaskMetrics>) =>
                activeStore.updateTaskMetrics(taskId, metrics)
              }
              tasks={activeStore.tasks}
            />
          </Box>
        </Box>

        <Box
          component="section"
          aria-label="TODO 列表"
          sx={{
            display: 'grid',
            gap: 1.25,
            minWidth: 0,
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

          {showClearCompletedAction ? (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                color="error"
                disabled={activeStore.stats.completed === 0}
                onClick={() => setClearCompletedDialogOpen(true)}
                size="small"
                startIcon={<DeleteSweepRoundedIcon />}
                variant="outlined"
                sx={{ bgcolor: 'background.paper' }}
              >
                清除所有已完成
              </Button>
            </Box>
          ) : null}

          {activeStore.isLoading || isAuthLoading ? (
            <Paper
              variant="outlined"
              sx={{
                alignItems: 'center',
                borderStyle: 'dashed',
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
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: 1500, px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 1.5, md: 2.5 } }}>
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

      {!isOnline ? (
        <Alert severity="warning" variant="filled" sx={{ borderRadius: 2, mb: 2 }}>
          当前处于离线状态，云端同步会在网络恢复后继续尝试。
        </Alert>
      ) : null}

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
        onClose={(_, reason) => {
          if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            closeEditor();
          }
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              display: 'flex',
              maxHeight: { xs: 'calc(100dvh - 24px)', sm: 'min(760px, calc(100dvh - 64px))' },
              minHeight: 0,
              overflow: 'hidden',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            px: { xs: 2.5, sm: 3 },
            py: { xs: 1.75, sm: 2 },
            position: 'sticky',
            top: 0,
            zIndex: 2,
          }}
        >
          {editorState?.mode === 'create' ? '添加任务' : '编辑任务'}
          <IconButton aria-label="关闭" onClick={closeEditor} size="small">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ flex: 1, overflowY: 'auto', p: { xs: 2.5, sm: 3 } }}>
          {editorState ? (
            <TaskComposer
              formId={taskEditorFormId}
              initialTask={editorState.task}
              mode={editorState.mode}
              onSubmit={handleSubmitTask}
            />
          ) : null}
        </DialogContent>
        <DialogActions
          sx={{
            bgcolor: 'background.paper',
            borderColor: 'divider',
            borderTop: 1,
            bottom: 0,
            px: { xs: 2.5, sm: 3 },
            py: { xs: 1.75, sm: 2 },
            position: 'sticky',
            zIndex: 2,
          }}
        >
          <Button onClick={closeEditor} type="button" variant="outlined">
            取消
          </Button>
          <Button
            disableElevation
            form={taskEditorFormId}
            startIcon={<SaveRoundedIcon />}
            type="submit"
            variant="contained"
          >
            {editorState?.mode === 'create' ? '添加任务' : '保存修改'}
          </Button>
        </DialogActions>
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

      <Dialog open={clearCompletedDialogOpen} onClose={() => setClearCompletedDialogOpen(false)}>
        <DialogTitle>清除所有已完成？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            将清除当前列表中所有已完成 Todo。这个操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearCompletedDialogOpen(false)} variant="outlined">
            取消
          </Button>
          <Button color="error" onClick={confirmClearCompletedTasks} variant="contained">
            清除已完成
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
