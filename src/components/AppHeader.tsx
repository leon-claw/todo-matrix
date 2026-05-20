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
    <Box component="header" sx={{ mb: 3, position: 'relative' }}>
      {user ? (
        <Box sx={{ position: 'absolute', right: 0, top: 0, zIndex: 3 }}>
          <Button
            aria-controls={accountMenuOpen ? 'account-menu' : undefined}
            aria-expanded={accountMenuOpen ? 'true' : undefined}
            aria-haspopup="menu"
            color={isCloudMode ? 'primary' : 'inherit'}
            endIcon={<ArrowDropDownRoundedIcon />}
            onClick={(event) => setAccountAnchor(event.currentTarget)}
            type="button"
            variant={isCloudMode ? 'contained' : 'outlined'}
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
          sx={{ alignItems: 'center', minWidth: 0, pr: user ? { xs: 16, sm: 0 } : 0 }}
        >
          <Box
            aria-hidden="true"
            sx={{
              bgcolor: 'grey.900',
              borderRadius: 2,
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
              display: 'grid',
              flex: '0 0 auto',
              gap: 0.5,
              gridTemplateColumns: 'repeat(2, 14px)',
              height: 44,
              p: '6px',
              width: 44,
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
            pt: user ? { xs: 1, sm: 0 } : 0,
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
