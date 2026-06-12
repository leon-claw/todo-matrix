import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import { getHeaderAccountState } from '../lib/headerAccountState';

interface AppHeaderProps {
  hasUser: boolean;
  isAuthLoading: boolean;
  isCloudMode: boolean;
  isSyncing: boolean;
  onCreateTask?: () => void;
  onLogin: () => void;
}

export function AppHeader({
  hasUser,
  isAuthLoading,
  isCloudMode,
  isSyncing,
  onCreateTask,
  onLogin,
}: AppHeaderProps) {
  const accountState = getHeaderAccountState({
    hasUser,
    isAuthLoading,
    isCloudMode,
    isSyncing,
  });

  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 18px 45px rgba(17, 24, 39, 0.06)',
        mb: { xs: 2, md: 2.5 },
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack
        direction="row"
        spacing={{ xs: 1, sm: 2 }}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            alt=""
            aria-hidden="true"
            component="img"
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            sx={{
              borderRadius: 2,
              boxShadow: '0 12px 28px rgba(17, 24, 39, 0.14)',
              flex: '0 0 auto',
              height: 42,
              objectFit: 'cover',
              width: 42,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap variant="h1">
              Todo Matrix
            </Typography>
            <Typography color="text.secondary" noWrap variant="subtitle2">
              基于艾森豪威尔方法论的待办小工具
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: '0 0 auto' }}>
          {onCreateTask ? (
            <Button
              aria-label="添加任务"
              disableElevation
              onClick={onCreateTask}
              startIcon={<AddRoundedIcon />}
              type="button"
              variant="contained"
              sx={{
                flex: '0 0 auto',
                minWidth: { xs: 42, sm: 96 },
                px: { xs: 1, sm: 1.75 },
                '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                添加任务
              </Box>
            </Button>
          ) : null}

          {accountState.kind === 'login' ? (
            <Button
              disabled={accountState.disabled}
              onClick={onLogin}
              startIcon={
                accountState.loading ? (
                  <CircularProgress aria-label="登录状态加载中" color="inherit" size={14} />
                ) : (
                  <LoginRoundedIcon />
                )
              }
              type="button"
              variant="outlined"
              sx={{ flex: '0 0 auto', minWidth: { xs: 68, sm: 82 } }}
            >
              {accountState.label}
            </Button>
          ) : (
            <Chip
              color={isCloudMode ? 'primary' : 'default'}
              icon={
                accountState.loading ? (
                  <CircularProgress aria-label="同步中" color="inherit" size={14} />
                ) : isCloudMode ? (
                  <CloudDoneRoundedIcon />
                ) : (
                  <StorageRoundedIcon />
                )
              }
              label={accountState.label}
              size="small"
              variant={isCloudMode ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
