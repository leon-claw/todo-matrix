import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const accountState = getHeaderAccountState({
    hasUser,
    isAuthLoading,
    isCloudMode,
    isSyncing,
  });
  const accountLabel =
    accountState.kind === 'login' ? t('account.login') : isCloudMode ? t('account.cloudMode') : t('account.localMode');

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
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            minWidth: 0,
            flex: '1 1 auto',
          }}
        >
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
            <Typography
              color="text.secondary"
              noWrap
              variant="subtitle2"
              sx={{
                '@media (max-width: 359.95px)': {
                  display: 'none',
                },
              }}
            >
              {t('app.tagline')}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: 'center',
            display: 'flex',
            flex: '0 0 auto',
          }}
        >
          {onCreateTask ? (
            <Button
              aria-label={t('app.addTask')}
              disableElevation
              onClick={onCreateTask}
              startIcon={<AddRoundedIcon />}
              type="button"
              variant="contained"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                flex: '0 0 auto',
                height: 36.5,
                minWidth: 96,
                px: 1.75,
              }}
            >
              {t('app.addTask')}
            </Button>
          ) : null}

          {accountState.kind === 'login' ? (
            <Button
              disabled={accountState.disabled}
              onClick={onLogin}
              startIcon={
                accountState.loading ? (
                  <CircularProgress aria-label={t('account.login')} color="inherit" size={14} />
                ) : (
                  <LoginRoundedIcon />
                )
              }
              type="button"
              variant="outlined"
              sx={{
                flex: '0 0 auto',
                height: { xs: 42, sm: 36.5 },
                minWidth: { xs: 0, sm: 82 },
                px: { xs: 1.25, sm: 1.75 },
                whiteSpace: 'nowrap',
              }}
            >
              {accountLabel}
            </Button>
          ) : (
            <Chip
              color={isCloudMode ? 'primary' : 'default'}
              icon={
                accountState.loading ? (
                  <CircularProgress aria-label={t('settings.syncing')} color="inherit" size={14} />
                ) : isCloudMode ? (
                  <CloudDoneRoundedIcon />
                ) : (
                  <StorageRoundedIcon />
                )
              }
              label={accountLabel}
              size="small"
              variant={isCloudMode ? 'filled' : 'outlined'}
              sx={{
                '& .MuiChip-icon': {
                  ml: { xs: 0, sm: 0.5 },
                  mr: { xs: 0, sm: -0.5 },
                },
                '& .MuiChip-label': {
                  display: { xs: 'none', sm: 'block' },
                  px: { xs: 0, sm: 1 },
                },
                fontWeight: 700,
                height: { xs: 42, sm: 32 },
                justifyContent: 'center',
                minWidth: { xs: 42, sm: 0 },
                px: { xs: 0, sm: 0.25 },
                width: { xs: 42, sm: 'auto' },
              }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
