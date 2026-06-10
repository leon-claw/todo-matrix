import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import AndroidRoundedIcon from '@mui/icons-material/AndroidRounded';
import AppleIcon from '@mui/icons-material/Apple';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LaptopWindowsRoundedIcon from '@mui/icons-material/LaptopWindowsRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import SystemUpdateRoundedIcon from '@mui/icons-material/SystemUpdateRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import { InstallPrompt } from './InstallPrompt';
import { appDownloadLinks, type AppDownloadPlatform } from '../lib/appDownloads';
import type { CurrentUser } from '../types/auth';

type MineView = 'downloads' | 'settings';

interface MinePageProps {
  isAuthLoading: boolean;
  isCloudMode: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  onChangePassword: () => void;
  onLogin: () => void;
  onLogout: () => void;
  stats: {
    active: number;
    completed: number;
    shownOnAxis: number;
    total: number;
  };
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

const downloadIcons: Record<AppDownloadPlatform, typeof LaptopWindowsRoundedIcon> = {
  android: AndroidRoundedIcon,
  macos: AppleIcon,
  windows: LaptopWindowsRoundedIcon,
};

const downloadPlatformDetails: Record<AppDownloadPlatform, { color: string; environment: string }> = {
  android: { color: 'success.main', environment: 'Android' },
  macos: { color: 'grey.900', environment: 'macOS' },
  windows: { color: 'primary.main', environment: 'Windows 10 / 11' },
};

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
  isAuthLoading,
  isCloudMode,
  isOnline,
  isSyncing,
  onChangePassword,
  onLogin,
  onLogout,
  stats,
  user,
}: MinePageProps) {
  const [mineView, setMineView] = useState<MineView>('settings');
  const runtimeLabel = readRuntimeLabel();
  const webBundleVersion = readVersion(
    typeof __TODO_MATRIX_WEB_BUNDLE_VERSION__ === 'undefined' ? undefined : __TODO_MATRIX_WEB_BUNDLE_VERSION__,
  );
  const nativeVersion = readVersion(
    typeof __TODO_MATRIX_NATIVE_VERSION__ === 'undefined' ? undefined : __TODO_MATRIX_NATIVE_VERSION__,
  );
  const avatarLabel = user?.email.slice(0, 1).toUpperCase() || 'M';

  if (mineView === 'downloads') {
    return (
      <DownloadsPage
        nativeVersion={nativeVersion}
        onBack={() => setMineView('settings')}
        runtimeLabel={runtimeLabel}
        webBundleVersion={webBundleVersion}
      />
    );
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
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow icon={DownloadRoundedIcon} onClick={() => setMineView('downloads')} title="下载应用" />
            {canShowInstallPrompt ? <InstallRow runtimeLabel={runtimeLabel} /> : null}
            <SettingsRow icon={SystemUpdateRoundedIcon} rightText={`Version ${nativeVersion}`} title="版本更新" />
            <SettingsRow disabled icon={CleaningServicesRoundedIcon} rightText="0.00MB" title="清理缓存" />
            <SettingsRow icon={InfoRoundedIcon} rightText={runtimeLabel} title="关于 Todo Matrix" />
          </SettingsGroup>

          <Paper elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
            {user ? (
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
            ) : (
              <Button
                disabled={isAuthLoading}
                fullWidth
                onClick={onLogin}
                startIcon={isAuthLoading ? <CircularProgress size={16} /> : <LoginRoundedIcon />}
                sx={{ borderRadius: 0, minHeight: 52 }}
                variant="text"
              >
                登录/注册
              </Button>
            )}
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              display: { xs: 'none', lg: 'block' },
              p: 2,
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
              {isOnline ? <InfoRoundedIcon color="primary" /> : <CloudOffRoundedIcon color="warning" />}
              <Typography variant="h2">应用信息</Typography>
            </Stack>
            <InfoRow label="运行环境" value={runtimeLabel} />
            <InfoRow label="应用版本" value={nativeVersion} />
            <InfoRow label="资源版本" value={webBundleVersion} />
          </Paper>
        </Stack>
      </Box>
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

function DownloadsPage({
  nativeVersion,
  onBack,
  runtimeLabel,
  webBundleVersion,
}: {
  nativeVersion: string;
  onBack: () => void;
  runtimeLabel: string;
  webBundleVersion: string;
}) {
  return (
    <Box component="main" sx={{ maxWidth: 1120, mx: 'auto', width: '100%' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: { xs: 1.5, md: 2 } }}>
        <IconButton aria-label="返回我的页面" onClick={onBack}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" variant="h2">
            应用下载
          </Typography>
          <Typography color="text.secondary" variant="body2">
            选择适合当前设备的安装包
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, md: 2 },
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        {appDownloadLinks.map((link) => {
          const Icon = downloadIcons[link.platform];
          const platformDetails = downloadPlatformDetails[link.platform];

          return (
            <Paper key={link.platform} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: platformDetails.color,
                      color: 'primary.contrastText',
                      height: 48,
                      width: 48,
                    }}
                  >
                    <Icon />
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h2">{link.title}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {link.fileLabel}
                    </Typography>
                  </Box>
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {link.description}
                </Typography>
                <Divider />
                <Stack spacing={0.75}>
                  <InfoRow label="运行环境" value={platformDetails.environment} />
                  <InfoRow label="壳版本" value={nativeVersion} />
                  <InfoRow label="资源版本" value={webBundleVersion} />
                  <InfoRow label="当前环境" value={runtimeLabel} />
                </Stack>
                <Box sx={{ flex: 1 }} />
                <Button
                  component="a"
                  fullWidth
                  href={link.href}
                  rel="noreferrer"
                  startIcon={<DownloadRoundedIcon />}
                  target="_blank"
                  variant="contained"
                >
                  下载{link.title}
                </Button>
              </Stack>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: 0,
      }}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography noWrap sx={{ fontWeight: 700, minWidth: 0 }} variant="body2">
        {value}
      </Typography>
    </Stack>
  );
}
