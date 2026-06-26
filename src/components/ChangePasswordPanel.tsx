import { FormEvent, useState } from 'react';
import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import { useTranslation } from 'react-i18next';

interface ChangePasswordPanelProps {
  error: string | null;
  isLoading?: boolean;
  onSubmit: (currentPassword: string, nextPassword: string) => Promise<void>;
}

export function ChangePasswordPanel({ error, isLoading = false, onSubmit }: ChangePasswordPanelProps) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (nextPassword.length < 8) {
      setLocalError(t('password.nextMin'));
      return;
    }

    if (nextPassword !== confirmPassword) {
      setLocalError(t('password.mismatch'));
      return;
    }

    await onSubmit(currentPassword, nextPassword).catch(() => undefined);
  }

  return (
    <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
      <Box>
        <Typography variant="h2">{t('password.title')}</Typography>
        <Typography color="text.secondary" variant="body2">
          {t('password.subtitle')}
        </Typography>
      </Box>

      {error || localError ? <Alert severity="error">{error || localError}</Alert> : null}

      <TextField
        autoComplete="current-password"
        autoFocus
        fullWidth
        label={t('password.current')}
        onChange={(event) => setCurrentPassword(event.target.value)}
        required
        type="password"
        value={currentPassword}
      />
      <TextField
        autoComplete="new-password"
        fullWidth
        helperText={t('auth.passwordHelper')}
        label={t('password.next')}
        onChange={(event) => setNextPassword(event.target.value)}
        required
        type="password"
        value={nextPassword}
      />
      <TextField
        autoComplete="new-password"
        fullWidth
        label={t('password.confirm')}
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
        {t('password.save')}
      </Button>
    </Stack>
  );
}
