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
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import SystemUpdateRoundedIcon from '@mui/icons-material/SystemUpdateRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import { InstallPrompt } from './InstallPrompt';
import { createTaskBackupFile, parseTaskBackup, saveTaskBackupFile } from '../lib/taskBackup';
import type { MatrixTask } from '../types';
import type { CurrentUser } from '../types/auth';

interface MinePageProps {
  isCloudMode: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  onChangePassword: () => void;
  onImportTasks: (tasks: MatrixTask[]) => Promise<void>;
  onLogin: () => void;
  onLogout: () => void;
  onOpenReleases: () => void;
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

function readRuntimeLabel() {
  if (window.todoMatrixDesktop?.isDesktop) {
    return 'Windows 桌面端';
  }

  if (window.Capacitor?.isNativePlatform?.()) {
    return 'Android 原生端';
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
  stats,
  tasks,
  user,
}: MinePageProps) {
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
  const runtimeLabel = readRuntimeLabel();
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
      setExportToast({ message: '暂无任务数据可导出', severity: 'info' });
      return;
    }

    try {
      await saveTaskBackupFile(file);
      setExportToast({ message: '数据已导出为 JSON 文件', severity: 'success' });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setExportToast({ message: '数据导出失败，请稍后重试', severity: 'error' });
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
      setExportToast({
        message: error instanceof Error ? error.message : '备份文件读取失败',
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
        message: `已导入 ${importCandidate.tasks.length} 项任务`,
        severity: 'success',
      });
    } catch {
      setExportToast({
        message: isCloudMode ? '云端数据导入失败，请稍后重试' : '本地数据导入失败，请稍后重试',
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
        设置
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
              rightText={user ? '已绑定' : '未登录'}
              title="账号绑定"
            />
            <SettingsRow
              disabled={!user}
              icon={LockResetRoundedIcon}
              onClick={user ? onChangePassword : undefined}
              title="修改密码"
            />
            <SettingsRow
              disabled
              icon={CloudDoneRoundedIcon}
              rightText={isCloudMode ? '云端模式' : '本地模式'}
              title="数据模式"
            />
            <SettingsRow
              icon={FileDownloadRoundedIcon}
              onClick={() => void handleExportData()}
              rightText="JSON"
              title="导出数据"
            />
            <SettingsRow
              icon={FileUploadRoundedIcon}
              onClick={() => importInputRef.current?.click()}
              rightText="JSON"
              title="导入数据"
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow icon={DownloadRoundedIcon} onClick={onOpenReleases} title="下载应用" />
            {canShowInstallPrompt ? <InstallRow runtimeLabel={runtimeLabel} /> : null}
            <SettingsRow icon={SystemUpdateRoundedIcon} rightText={`Version ${nativeVersion}`} title="版本更新" />
            <SettingsRow disabled icon={CleaningServicesRoundedIcon} rightText="0.00MB" title="清理缓存" />
            <SettingsRow icon={InfoRoundedIcon} rightText={runtimeLabel} title="关于 Todo Matrix" />
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
                退出登录
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
        <DialogTitle>覆盖并导入数据？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            将从“{importCandidate?.fileName}”导入 {importCandidate?.tasks.length ?? 0} 项任务，并覆盖当前
            {isCloudMode ? '云端' : '本地'}模式下的全部任务。此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isImporting} onClick={() => setImportCandidate(null)}>
            取消
          </Button>
          <Button
            color="error"
            disabled={isImporting}
            onClick={() => void confirmImportData()}
            startIcon={isImporting ? <CircularProgress color="inherit" size={16} /> : <FileUploadRoundedIcon />}
            variant="contained"
          >
            覆盖并导入
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
            {user ? user.email : '未登录'}
          </Typography>
          <Typography color="text.secondary" noWrap variant="body2">
            {isCloudMode ? '云端数据已隔离存储' : '当前使用本地存储'}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', mt: 1 }}>
            <Chip
              color={isCloudMode ? 'primary' : 'default'}
              icon={isCloudMode ? <CloudDoneRoundedIcon /> : <StorageRoundedIcon />}
              label={isCloudMode ? '云端模式' : '本地模式'}
              size="small"
              variant={isCloudMode ? 'filled' : 'outlined'}
            />
            {isCloudMode && isSyncing ? (
              <Chip
                color="primary"
                icon={<CircularProgress color="inherit" size={14} />}
                label="同步中"
                size="small"
                variant="outlined"
              />
            ) : null}
            {!isOnline ? (
              <Chip color="warning" icon={<WifiOffRoundedIcon />} label="离线" size="small" variant="outlined" />
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
        <Typography variant="h2">任务数据</Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        }}
      >
        {[
          ['全部', stats.total],
          ['进行中', stats.active],
          ['已完成', stats.completed],
          ['坐标轴', stats.shownOnAxis],
        ].map(([label, value]) => (
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

function InstallRow({ runtimeLabel }: { runtimeLabel: string }) {
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
          安装到设备
        </Typography>
        <Typography color="text.secondary" noWrap variant="caption">
          {runtimeLabel}
        </Typography>
      </Box>
      <InstallPrompt />
    </Box>
  );
}
