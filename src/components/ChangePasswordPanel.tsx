import { FormEvent, useState } from 'react';
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';

interface ChangePasswordPanelProps {
  error: string | null;
  isLoading?: boolean;
  onSubmit: (currentPassword: string, nextPassword: string) => Promise<void>;
}

export function ChangePasswordPanel({ error, isLoading = false, onSubmit }: ChangePasswordPanelProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (nextPassword.length < 8) {
      setLocalError('新密码至少需要 8 位。');
      return;
    }

    if (nextPassword !== confirmPassword) {
      setLocalError('两次输入的新密码不一致。');
      return;
    }

    await onSubmit(currentPassword, nextPassword).catch(() => undefined);
  }

  return (
    <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
      <Box>
        <Typography variant="h2">修改密码</Typography>
        <Typography color="text.secondary" variant="body2">
          修改后下次登录请使用新密码。当前设备的登录状态会保持。
        </Typography>
      </Box>

      {error || localError ? <Alert severity="error">{error || localError}</Alert> : null}

      <TextField
        autoComplete="current-password"
        autoFocus
        fullWidth
        label="当前密码"
        onChange={(event) => setCurrentPassword(event.target.value)}
        required
        type="password"
        value={currentPassword}
      />
      <TextField
        autoComplete="new-password"
        fullWidth
        helperText="至少 8 位"
        label="新密码"
        onChange={(event) => setNextPassword(event.target.value)}
        required
        type="password"
        value={nextPassword}
      />
      <TextField
        autoComplete="new-password"
        fullWidth
        label="确认新密码"
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        type="password"
        value={confirmPassword}
      />

      <Divider />

      <Button
        disabled={isLoading || !currentPassword || nextPassword.length < 8 || nextPassword !== confirmPassword}
        disableElevation
        startIcon={<LockResetRoundedIcon />}
        type="submit"
        variant="contained"
      >
        保存新密码
      </Button>
    </Stack>
  );
}
