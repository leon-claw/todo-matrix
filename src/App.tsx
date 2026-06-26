import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  IconButton,
  Paper,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { useTranslation } from 'react-i18next';
import { AppBottomNavigation } from './components/AppBottomNavigation';
import { AppHeader } from './components/AppHeader';
import { AuthPanel } from './components/AuthPanel';
import { ChangePasswordPanel } from './components/ChangePasswordPanel';
import { DataResolutionPanel } from './components/DataResolutionPanel';
import { MinePage } from './components/MinePage';
import { PriorityAxis } from './components/PriorityAxis';
import { StatsStrip } from './components/StatsStrip';
import { TaskComposer } from './components/TaskComposer';
import { TodoList } from './components/TodoList';
import { LanguageBootstrap } from './i18n/LanguageBootstrap';
import { useAuth } from './hooks/useAuth';
import { useCloudTasks } from './hooks/useCloudTasks';
import { useLocalTasks } from './hooks/useLocalTasks';
import { useAppRoute } from './hooks/useAppRoute';
import { useServerConfig } from './hooks/useServerConfig';
import { ApiError } from './lib/apiClient';
import { APP_RELEASES_URL } from './lib/appDownloads';
import { getPrimaryPage } from './lib/appRouter';
import type { MatrixTask, TaskFilter, TaskFormValues, TaskMetrics } from './types';

type EditorState =
  | { mode: 'create'; task: null }
  | { mode: 'edit'; task: MatrixTask };

const taskEditorFormId = 'task-editor-form';
const networkStatusEventName = 'todo-matrix:network-status';

export function App() {
  const { t } = useTranslation();
  const { serverConfig, setServerConfig } = useServerConfig();
  const {
    authError,
    changePassword,
    hasStoredCloudSession,
    isAuthLoading,
    login,
    logout,
    register,
    setAuthError,
    user,
  } = useAuth(serverConfig.apiBaseUrl);
  const localStore = useLocalTasks();
  const [localDataResolved, setLocalDataResolved] = useState(false);
  const migrationRequired = Boolean(user && localStore.tasks.length > 0 && !localDataResolved);
  const isCloudMode = Boolean(user && !migrationRequired);
  const cloudStore = useCloudTasks(Boolean(user));
  const activeStore = isCloudMode ? cloudStore : localStore;
  const isCloudInitialLoading =
    (isAuthLoading && hasStoredCloudSession) || (isCloudMode && cloudStore.isInitialLoading);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MatrixTask | null>(null);
  const [clearCompletedDialogOpen, setClearCompletedDialogOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('active');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [isMobileAxisHidden, setIsMobileAxisHidden] = useState(false);
  const { navigate, route } = useAppRoute();
  const activePage = getPrimaryPage(route);

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
      setAuthError(error instanceof ApiError && error.status === 401 ? t('errors.invalidCredentials') : t('errors.loginFailed'));
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
        setAuthError(t('errors.registerEmailUsed'));
      } else if (error instanceof ApiError && error.message.includes('验证码已过期')) {
        setAuthError(t('errors.captchaExpired'));
      } else if (error instanceof ApiError && error.message.includes('验证码不正确')) {
        setAuthError(t('errors.captchaIncorrect'));
      } else {
        setAuthError(t('errors.registerFailed'));
      }
      throw error;
    }
  }

  async function requestLogout() {
    setLogoutConfirmOpen(true);
  }

  async function confirmLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      setChangePasswordDialogOpen(false);
      setLocalDataResolved(false);
      setLogoutConfirmOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleChangePassword(currentPassword: string, nextPassword: string) {
    setIsPasswordChanging(true);
    setChangePasswordError(null);
    try {
      await changePassword({ currentPassword, nextPassword });
      setChangePasswordDialogOpen(false);
    } catch (error) {
      setChangePasswordError(
        error instanceof ApiError && error.status === 401
          ? t('errors.currentPasswordIncorrect')
          : t('errors.changePasswordFailed'),
      );
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

  async function handleImportTasks(tasks: MatrixTask[]) {
    if (isCloudMode) {
      await cloudStore.replaceCloudTasks(tasks);
      return;
    }

    await localStore.replaceLocalTasks(tasks);
  }

  function renderTodoSurface() {
    const showClearCompletedAction = taskFilter === 'all' || taskFilter === 'completed';

    if (migrationRequired) {
      return (
        <DataResolutionPanel
          isBusy={migrationBusy}
          localCount={localStore.tasks.length}
          onClearLocal={handleClearLocalOnly}
          onLogout={requestLogout}
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
              {isMobileAxisHidden ? t('app.showAxis') : t('app.hideAxis')}
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
          aria-label={t('app.todoList')}
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
                {t('app.clearCompleted')}
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
              {t('app.loadingData')}
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
    <Container
      aria-busy={isCloudInitialLoading}
      maxWidth={false}
      sx={{
        maxWidth: 1500,
        pb: { xs: 'calc(88px + env(safe-area-inset-bottom))', md: 12 },
        pt: { xs: 1.5, md: 2.5 },
        px: { xs: 1.5, sm: 2.5, md: 3 },
      }}
    >
      <LanguageBootstrap />
      {activePage === 'home' ? (
        <AppHeader
          hasUser={Boolean(user)}
          isAuthLoading={isAuthLoading}
          isCloudMode={isCloudMode}
          isSyncing={isCloudMode && cloudStore.isSyncing}
          onCreateTask={openCreateTask}
          onLogin={() => setAuthDialogOpen(true)}
        />
      ) : null}

      {!isOnline ? (
        <Alert severity="warning" variant="filled" sx={{ borderRadius: 2, mb: 2 }}>
          {t('app.offlineWarning')}
        </Alert>
      ) : null}

      {activePage === 'home' ? (
        renderTodoSurface()
      ) : (
        <MinePage
          isCloudMode={isCloudMode}
          isOnline={isOnline}
          isSyncing={isCloudMode && cloudStore.isSyncing}
          onChangePassword={() => {
            setChangePasswordError(null);
            setChangePasswordDialogOpen(true);
          }}
          onLogin={() => setAuthDialogOpen(true)}
          onLogout={requestLogout}
          onOpenReleases={() => {
            window.open(APP_RELEASES_URL, '_blank', 'noopener,noreferrer');
          }}
          onImportTasks={handleImportTasks}
          stats={activeStore.stats}
          serverConfig={serverConfig}
          tasks={activeStore.tasks}
          user={user}
        />
      )}

      <AppBottomNavigation
        activePage={activePage}
        onPageChange={(page) => navigate({ id: page }, 'replace')}
      />

      {activePage === 'home' ? (
        <Fab
          aria-label={t('app.addTask')}
          color="primary"
          onClick={openCreateTask}
          sx={{
            bottom: 'calc(92px + env(safe-area-inset-bottom))',
            boxShadow: '0 18px 42px rgba(37, 99, 235, 0.34)',
            display: { xs: 'inline-flex', sm: 'none' },
            position: 'fixed',
            right: 18,
            zIndex: (theme) => theme.zIndex.appBar + 2,
          }}
        >
          <AddRoundedIcon />
        </Fab>
      ) : null}

      <Dialog
        fullWidth
        maxWidth="sm"
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <IconButton
          aria-label={t('app.close')}
          onClick={() => setAuthDialogOpen(false)}
          sx={{ position: 'absolute', right: 12, top: 12, zIndex: 1 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
        <DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <AuthPanel
            error={authError}
            isLoading={isAuthLoading}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onServerConfigChange={(nextServerConfig) => {
              setAuthError(null);
              return setServerConfig(nextServerConfig);
            }}
            serverConfig={serverConfig}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        aria-labelledby="logout-confirm-title"
        fullWidth
        maxWidth="xs"
        open={logoutConfirmOpen}
        onClose={(_, reason) => {
          if (!isLoggingOut && reason !== 'backdropClick') {
            setLogoutConfirmOpen(false);
          }
        }}
        role="alertdialog"
      >
        <DialogTitle id="logout-confirm-title">{t('app.logoutTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('app.logoutDescription')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isLoggingOut} onClick={() => setLogoutConfirmOpen(false)}>
            {t('app.cancel')}
          </Button>
          <Button
            color="error"
            disabled={isLoggingOut}
            onClick={() => void confirmLogout()}
            startIcon={isLoggingOut ? <CircularProgress color="inherit" size={16} /> : undefined}
            variant="contained"
          >
            {t('app.confirmLogout')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <IconButton
          aria-label={t('app.close')}
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
          {editorState?.mode === 'create' ? t('app.addTask') : t('app.editTask')}
          <IconButton aria-label={t('app.close')} onClick={closeEditor} size="small">
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
            {t('app.cancel')}
          </Button>
          <Button
            disableElevation
            form={taskEditorFormId}
            startIcon={<SaveRoundedIcon />}
            type="submit"
            variant="contained"
          >
            {editorState?.mode === 'create' ? t('app.addTask') : t('app.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{t('app.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('app.deleteDescription', { title: deleteTarget?.title ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined">
            {t('app.cancel')}
          </Button>
          <Button color="error" onClick={confirmDeleteTask} variant="contained">
            {t('app.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clearCompletedDialogOpen} onClose={() => setClearCompletedDialogOpen(false)}>
        <DialogTitle>{t('app.clearCompletedTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('app.clearCompletedDescription')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClearCompletedDialogOpen(false)} variant="outlined">
            {t('app.cancel')}
          </Button>
          <Button color="error" onClick={confirmClearCompletedTasks} variant="contained">
            {t('app.clearCompleted')}
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop
        open={isCloudInitialLoading}
        sx={{
          backdropFilter: 'blur(10px)',
          bgcolor: 'rgba(241, 245, 249, 0.72)',
          color: 'text.primary',
          zIndex: (theme) => theme.zIndex.modal + 1,
        }}
      >
        <Paper
          elevation={0}
          role="status"
          sx={{
            alignItems: 'center',
            border: 1,
            borderColor: 'rgba(148, 163, 184, 0.36)',
            borderRadius: 3,
            boxShadow: '0 22px 70px rgba(15, 23, 42, 0.18)',
            display: 'grid',
            gap: 1.25,
            justifyItems: 'center',
            maxWidth: 360,
            mx: 2,
            p: { xs: 2.5, sm: 3 },
            textAlign: 'center',
          }}
        >
          <CircularProgress size={30} thickness={4} />
          <Box component="strong" sx={{ fontSize: 17, lineHeight: 1.35 }}>
            {t('app.syncingCloudTasks')}
          </Box>
          <Box component="span" sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>
            {t('app.pullingData')}
          </Box>
        </Paper>
      </Backdrop>
    </Container>
  );
}
