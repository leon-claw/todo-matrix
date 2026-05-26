import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { InstallPrompt } from './InstallPrompt';
import type { CurrentUser } from '../types/auth';

interface AppHeaderProps {
  isCloudMode: boolean;
  isSyncing?: boolean;
  onChangePassword: () => void;
  onCreateTask: () => void;
  onLogin: () => void;
  onLogout: () => void;
  user: CurrentUser | null;
}

export function AppHeader({
  isCloudMode,
  isSyncing = false,
  onChangePassword,
  onCreateTask,
  onLogin,
  onLogout,
  user,
}: AppHeaderProps) {
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null);
  const accountMenuOpen = Boolean(accountAnchor);

  function closeAccountMenu() {
    setAccountAnchor(null);
  }

  function handleChangePassword() {
    closeAccountMenu();
    onChangePassword();
  }

  function handleLogout() {
    closeAccountMenu();
    onLogout();
  }

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
        position: 'relative',
      }}
    >
      {user ? (
        <Box sx={{ position: 'absolute', right: { xs: 12, sm: 16 }, top: { xs: 12, sm: 16 }, zIndex: 3 }}>
          <Button
            aria-controls={accountMenuOpen ? 'account-menu' : undefined}
            aria-expanded={accountMenuOpen ? 'true' : undefined}
            aria-haspopup="menu"
            color={isCloudMode ? 'primary' : 'inherit'}
            endIcon={<ArrowDropDownRoundedIcon />}
            onClick={(event) => setAccountAnchor(event.currentTarget)}
            type="button"
            variant={isCloudMode ? 'contained' : 'outlined'}
            sx={{ minHeight: 34, px: 1.25 }}
          >
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <span>{isCloudMode ? '云端模式' : '本地模式'}</span>
              {isCloudMode && isSyncing ? (
                <CircularProgress aria-label="正在同步云端数据" color="inherit" size={14} />
              ) : null}
            </Stack>
          </Button>
          <Menu
            id="account-menu"
            anchorEl={accountAnchor}
            open={accountMenuOpen}
            onClose={closeAccountMenu}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 2,
                  minWidth: 240,
                  mt: 1,
                  boxShadow: '0 18px 44px rgba(17, 24, 39, 0.16)',
                },
              },
            }}
          >
            <Box sx={{ maxWidth: 300, px: 2, py: 1.25 }}>
              <Typography color="text.secondary" noWrap variant="caption">
                {user.email}
              </Typography>
            </Box>
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <ListItemIcon>
                <CloudDoneRoundedIcon color={isCloudMode ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={isCloudMode ? '云端模式' : '本地模式'} />
              {isCloudMode && isSyncing ? <CircularProgress size={16} /> : null}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleChangePassword}>
              <ListItemIcon>
                <LockResetRoundedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="修改密码" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutRoundedIcon color="error" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="退出登录"
                slotProps={{
                  primary: { color: 'error' },
                }}
              />
            </MenuItem>
          </Menu>
        </Box>
      ) : null}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          pr: user ? { xs: 0, sm: 18 } : 0,
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', minWidth: 0, pr: user ? { xs: 15, sm: 0 } : 0 }}
        >
          <Box
            aria-hidden="true"
            sx={{
              bgcolor: 'grey.900',
              borderRadius: 2,
              boxShadow: '0 12px 28px rgba(17, 24, 39, 0.14)',
              display: 'grid',
              flex: '0 0 auto',
              gap: 0.5,
              gridTemplateColumns: 'repeat(2, 13px)',
              height: 42,
              p: '6px',
              width: 42,
              '& span': {
                borderRadius: '4px',
              },
              '& span:nth-of-type(1)': { bgcolor: 'warning.main' },
              '& span:nth-of-type(2)': { bgcolor: 'success.main' },
              '& span:nth-of-type(3)': { bgcolor: 'info.main' },
              '& span:nth-of-type(4)': { bgcolor: 'secondary.main' },
            }}
          >
            <span />
            <span />
            <span />
            <span />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h1">Todo Matrix</Typography>
            <Typography color="text.secondary" variant="subtitle2">
              离线优先的 TODO 坐标轴
            </Typography>
          </Box>
        </Stack>

        <Stack
          aria-label="任务操作"
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            pt: user ? { xs: 1.25, sm: 0 } : 0,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {!user ? (
            <Button onClick={onLogin} startIcon={<LoginRoundedIcon />} type="button" variant="outlined">
              登录/注册
            </Button>
          ) : null}
          <InstallPrompt />
          <Button
            disableElevation
            onClick={onCreateTask}
            startIcon={<AddRoundedIcon />}
            type="button"
            variant="contained"
          >
            添加任务
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
