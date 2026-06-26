import { useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import SystemUpdateRoundedIcon from '@mui/icons-material/SystemUpdateRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import { useTranslation } from 'react-i18next';
import { InstallPrompt } from './InstallPrompt';
import { LanguageSwitcher } from './LanguageSwitcher';
import { TaskBackupParseError, createTaskBackupFile, parseTaskBackup, saveTaskBackupFile } from '../lib/taskBackup';
import type { MatrixTask } from '../types';
import type { CurrentUser } from '../types/auth';
import type { ServerConfig } from '../lib/serverConfig';

interface MinePageProps {
  isCloudMode: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  onChangePassword: () => void;
  onImportTasks: (tasks: MatrixTask[]) => Promise<void>;
  onLogin: () => void;
  onLogout: () => void;
  onOpenReleases: () => void;
  serverConfig: ServerConfig;
  stats: {
    active: number;
    completed: number;
    shownOnAxis: number;
    total: number;
  };
  tasks: MatrixTask[];
  user: CurrentUser | null;
}

interface SettingsRowProps {
  disabled?: boolean;
  icon: React.ElementType;
  onClick?: () => void;
  rightText?: string;
  title: string;
}

const canShowInstallPrompt = !window.todoMatrixDesktop?.isDesktop && !window.Capacitor?.isNativePlatform?.();

function readRuntimeLabel(labels: { android: string; windows: string }) {
  if (window.todoMatrixDesktop?.isDesktop) {
    return labels.windows;
  }

  if (window.Capacitor?.isNativePlatform?.()) {
    return labels.android;
  }

  return 'Web / PWA';
}

function readVersion(value: string | undefined) {
  return value && value !== '0.0.0' ? value : 'development';
}

export function MinePage({
  isCloudMode,
  isOnline,
  isSyncing,
  onChangePassword,
  onImportTasks,
  onLogin,
  onLogout,
  onOpenReleases,
  serverConfig,
  stats,
  tasks,
  user,
}: MinePageProps) {
  const { t } = useTranslation();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importCandidate, setImportCandidate] = useState<{
    fileName: string;
    tasks: MatrixTask[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [exportToast, setExportToast] = useState<{
    message: string;
    severity: 'error' | 'info' | 'success';
  } | null>(null);
  const runtimeLabel = readRuntimeLabel({
    android: t('settings.androidRuntime'),
    windows: t('settings.windowsRuntime'),
  });
  const nativeVersion = readVersion(
    typeof __TODO_MATRIX_NATIVE_VERSION__ === 'undefined' ? undefined : __TODO_MATRIX_NATIVE_VERSION__,
  );
  const avatarLabel = user?.email.slice(0, 1).toUpperCase() || 'M';

  async function handleExportData() {
    const file = createTaskBackupFile({
      storageMode: isCloudMode ? 'cloud' : 'local',
      tasks,
    });

    if (file.type === 'empty') {
      setExportToast({ message: t('settings.noTasksToExport'), severity: 'info' });
      return;
    }

    try {
      await saveTaskBackupFile(file, { title: t('backup.shareTitle') });
      setExportToast({ message: t('settings.exportSuccess'), severity: 'success' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setExportToast({ message: t('settings.exportFailed'), severity: 'error' });
    }
  }

  async function handleImportFile(file: File) {
    try {
      const backup = parseTaskBackup(await file.text());
      setImportCandidate({
        fileName: file.name,
        tasks: backup.tasks,
      });
    } catch (error) {
      const backupErrorMessage =
        error instanceof TaskBackupParseError
          ? t(error.code === 'invalid-json' ? 'backup.invalidJson' : 'backup.unsupportedFormat')
          : null;

      setExportToast({
        message: backupErrorMessage ?? (error instanceof Error ? error.message : t('settings.readBackupFailed')),
        severity: 'error',
      });
    }
  }

  async function confirmImportData() {
    if (!importCandidate) {
      return;
    }

    setIsImporting(true);
    try {
      await onImportTasks(importCandidate.tasks);
      setImportCandidate(null);
      setExportToast({
        message: t('settings.importedTasks', { count: importCandidate.tasks.length }),
        severity: 'success',
      });
    } catch {
      setExportToast({
        message: isCloudMode ? t('settings.importCloudFailed') : t('settings.importLocalFailed'),
        severity: 'error',
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Box component="main" sx={{ mx: 'auto', width: '100%' }}>
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: 17, md: 24 },
          fontWeight: 900,
          mb: { xs: 1.5, md: 2 },
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        {t('settings.title')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, lg: 2 },
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px, 0.42fr) minmax(0, 0.58fr)' },
          maxWidth: 1120,
          mx: 'auto',
        }}
      >
        <Stack spacing={{ xs: 1.5, lg: 2 }}>
          <ProfilePanel
            avatarLabel={avatarLabel}
            isCloudMode={isCloudMode}
            isOnline={isOnline}
            isSyncing={isSyncing}
            user={user}
          />
          <TaskStatsPanel stats={stats} />
        </Stack>

        <Stack spacing={{ xs: 1.5, lg: 2 }}>
          <SettingsGroup>
            <SettingsRow
              icon={AccountCircleRoundedIcon}
              onClick={user ? undefined : onLogin}
              rightText={user ? t('settings.bound') : t('settings.unbound')}
              title={t('settings.account')}
            />
            <SettingsRow
              disabled={!user}
              icon={LockResetRoundedIcon}
              onClick={user ? onChangePassword : undefined}
              title={t('settings.changePassword')}
            />
            <SettingsRow
              disabled
              icon={CloudDoneRoundedIcon}
              rightText={isCloudMode ? t('account.cloudMode') : t('account.localMode')}
              title={t('settings.dataMode')}
            />
            <SettingsRow
              disabled
              icon={DnsRoundedIcon}
              rightText={serverConfig.mode === 'custom' ? t('settings.customServer') : t('settings.defaultServer')}
              title={t('settings.server')}
            />
            <LanguageRow />
            <SettingsRow
              icon={FileDownloadRoundedIcon}
              onClick={() => void handleExportData()}
              rightText="JSON"
              title={t('settings.exportData')}
            />
            <SettingsRow
              icon={FileUploadRoundedIcon}
              onClick={() => importInputRef.current?.click()}
              rightText="JSON"
              title={t('settings.importData')}
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow icon={DownloadRoundedIcon} onClick={onOpenReleases} title={t('settings.downloadApp')} />
            {canShowInstallPrompt ? <InstallRow runtimeLabel={runtimeLabel} /> : null}
            <SettingsRow
              icon={SystemUpdateRoundedIcon}
              rightText={t('settings.versionText', { version: nativeVersion })}
              title={t('settings.versionUpdate')}
            />
            <SettingsRow disabled icon={CleaningServicesRoundedIcon} rightText="0.00MB" title={t('settings.clearCache')} />
            <SettingsRow icon={InfoRoundedIcon} rightText={runtimeLabel} title={t('settings.about')} />
          </SettingsGroup>

          {user ? (
            <Paper elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
              <Button
                color="error"
                fullWidth
                onClick={onLogout}
                startIcon={<LogoutRoundedIcon />}
                sx={{ borderRadius: 0, minHeight: 52 }}
                variant="text"
              >
                {t('settings.logout')}
              </Button>
            </Paper>
          ) : null}
        </Stack>
      </Box>

      <Snackbar
        autoHideDuration={3000}
        onClose={() => setExportToast(null)}
        open={Boolean(exportToast)}
      >
        {exportToast ? (
          <Alert
            onClose={() => setExportToast(null)}
            severity={exportToast.severity}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {exportToast.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      <input
        ref={importInputRef}
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) {
            void handleImportFile(file);
          }
        }}
        type="file"
      />

      <Dialog
        fullWidth
        maxWidth="xs"
        open={Boolean(importCandidate)}
        onClose={(_, reason) => {
          if (!isImporting && reason !== 'backdropClick') {
            setImportCandidate(null);
          }
        }}
      >
        <DialogTitle>{t('settings.importTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('settings.importDescription', {
              count: importCandidate?.tasks.length ?? 0,
              fileName: importCandidate?.fileName,
              mode: isCloudMode ? t('settings.cloudModeName') : t('settings.localModeName'),
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isImporting} onClick={() => setImportCandidate(null)}>
            {t('app.cancel')}
          </Button>
          <Button
            color="error"
            disabled={isImporting}
            onClick={() => void confirmImportData()}
            startIcon={isImporting ? <CircularProgress color="inherit" size={16} /> : <FileUploadRoundedIcon />}
            variant="contained"
          >
            {t('settings.importAction')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ProfilePanel({
  avatarLabel,
  isCloudMode,
  isOnline,
  isSyncing,
  user,
}: {
  avatarLabel: string;
  isCloudMode: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  user: CurrentUser | null;
}) {
  const { t } = useTranslation();

  return (
    <Paper elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 2, p: { xs: 1.5, sm: 2 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Avatar
          sx={{
            bgcolor: user ? 'primary.main' : 'grey.100',
            border: 1,
            borderColor: user ? 'primary.main' : 'divider',
            color: user ? 'primary.contrastText' : 'text.primary',
            fontWeight: 900,
            height: 54,
            width: 54,
          }}
        >
          {avatarLabel}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap variant="h2">
            {user ? user.email : t('settings.unbound')}
          </Typography>
          <Typography color="text.secondary" noWrap variant="body2">
            {isCloudMode ? t('settings.cloudStored') : t('settings.localStored')}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mt: 1 }}>
            <Chip
              color={isCloudMode ? 'primary' : 'default'}
              icon={isCloudMode ? <CloudDoneRoundedIcon /> : <StorageRoundedIcon />}
              label={isCloudMode ? t('account.cloudMode') : t('account.localMode')}
              size="small"
              variant={isCloudMode ? 'filled' : 'outlined'}
            />
            {isCloudMode && isSyncing ? (
              <Chip
                color="primary"
                icon={<CircularProgress color="inherit" size={14} />}
                label={t('settings.syncing')}
                size="small"
                variant="outlined"
              />
            ) : null}
            {!isOnline ? (
              <Chip color="warning" icon={<WifiOffRoundedIcon />} label={t('settings.offline')} size="small" variant="outlined" />
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

function TaskStatsPanel({
  stats,
}: {
  stats: {
    active: number;
    completed: number;
    shownOnAxis: number;
    total: number;
  };
}) {
  const { t } = useTranslation();
  const statItems = [
    [t('stats.all'), stats.total],
    [t('stats.active'), stats.active],
    [t('stats.completed'), stats.completed],
    [t('stats.axis'), stats.shownOnAxis],
  ] as const;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        display: { xs: 'none', sm: 'block' },
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.5 }}>
        <StorageRoundedIcon color="primary" />
        <Typography variant="h2">{t('settings.taskData')}</Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        }}
      >
        {statItems.map(([label, value]) => (
          <Box
            key={label}
            sx={{
              bgcolor: 'background.default',
              borderRadius: 2,
              p: 1.25,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 900, lineHeight: 1 }} variant="h2">
              {value}
            </Typography>
            <Typography color="text.secondary" sx={{ display: 'block', mt: 0.5 }} variant="caption">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
      <List disablePadding>{children}</List>
    </Paper>
  );
}

function SettingsRow({ disabled = false, icon: Icon, onClick, rightText, title }: SettingsRowProps) {
  const isClickable = Boolean(onClick) && !disabled;

  return (
    <ListItemButton
      disabled={disabled && !rightText}
      onClick={isClickable ? onClick : undefined}
      sx={{
        minHeight: 52,
        px: { xs: 1.75, sm: 2 },
        '& + &': {
          borderTop: 1,
          borderColor: 'divider',
        },
      }}
    >
      <ListItemIcon sx={{ color: 'text.primary', minWidth: 36 }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={title} slotProps={{ primary: { sx: { fontWeight: 700 }, variant: 'body2' } }} />
      {rightText ? (
        <Typography color="text.secondary" noWrap variant="caption">
          {rightText}
        </Typography>
      ) : null}
      {isClickable ? <ChevronRightRoundedIcon color="disabled" fontSize="small" sx={{ ml: 0.5 }} /> : null}
    </ListItemButton>
  );
}

function LanguageRow() {
  const { t } = useTranslation();

  return (
    <ListItemButton
      component="div"
      disableRipple
      sx={{
        cursor: 'default',
        minHeight: 52,
        px: { xs: 1.75, sm: 2 },
        '& + &': {
          borderTop: 1,
          borderColor: 'divider',
        },
        '&:hover': {
          bgcolor: 'transparent',
        },
      }}
    >
      <ListItemIcon sx={{ color: 'text.primary', minWidth: 36 }}>
        <TranslateRoundedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('language.label')} slotProps={{ primary: { sx: { fontWeight: 700 }, variant: 'body2' } }} />
      <LanguageSwitcher />
    </ListItemButton>
  );
}

function InstallRow({ runtimeLabel }: { runtimeLabel: string }) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        alignItems: 'center',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        gap: 1,
        minHeight: 58,
        px: { xs: 1.75, sm: 2 },
      }}
    >
      <ListItemIcon sx={{ color: 'text.primary', minWidth: 36 }}>
        <DownloadRoundedIcon fontSize="small" />
      </ListItemIcon>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }} variant="body2">
          {t('install.title')}
        </Typography>
        <Typography color="text.secondary" noWrap variant="caption">
          {runtimeLabel}
        </Typography>
      </Box>
      <InstallPrompt />
    </Box>
  );
}
