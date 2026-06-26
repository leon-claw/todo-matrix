import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useTranslation } from 'react-i18next';

type PendingAction = 'replace-cloud' | 'clear-local' | null;

interface DataResolutionPanelProps {
  isBusy: boolean;
  localCount: number;
  onClearLocal: () => Promise<void>;
  onLogout: () => Promise<void>;
  onReplaceCloud: () => Promise<void>;
}

export function DataResolutionPanel({
  isBusy,
  localCount,
  onClearLocal,
  onLogout,
  onReplaceCloud,
}: DataResolutionPanelProps) {
  const { t } = useTranslation();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const isReplace = pendingAction === 'replace-cloud';
  const dialogTitle = isReplace ? t('dataResolution.replaceTitle') : t('dataResolution.clearTitle');
  const dialogText = isReplace
    ? t('dataResolution.replaceText', { count: localCount })
    : t('dataResolution.clearText', { count: localCount });

  async function confirmAction() {
    if (pendingAction === 'replace-cloud') {
      await onReplaceCloud();
    }

    if (pendingAction === 'clear-local') {
      await onClearLocal();
    }

    setPendingAction(null);
  }

  return (
    <>
      <Paper
        component="section"
        variant="outlined"
        sx={{
          display: 'grid',
          gap: 2,
          maxWidth: 680,
          mx: 'auto',
          p: { xs: 2.5, sm: 3 },
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h2">{t('dataResolution.title')}</Typography>
          <Typography color="text.secondary" variant="body2">
            {t('dataResolution.description', { count: localCount })}
          </Typography>
        </Stack>

        <Alert severity="info">
          {t('dataResolution.info')}
        </Alert>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <Button
            disabled={isBusy}
            disableElevation
            fullWidth
            onClick={() => setPendingAction('replace-cloud')}
            startIcon={<CloudUploadRoundedIcon />}
            variant="contained"
          >
            {t('dataResolution.replaceAction')}
          </Button>
          <Button
            color="error"
            disabled={isBusy}
            fullWidth
            onClick={() => setPendingAction('clear-local')}
            startIcon={<DeleteSweepRoundedIcon />}
            variant="outlined"
          >
            {t('dataResolution.clearAction')}
          </Button>
        </Stack>

        <Button disabled={isBusy} onClick={onLogout} startIcon={<LogoutRoundedIcon />} variant="text">
          {t('dataResolution.logoutLocal')}
        </Button>
      </Paper>

      <Dialog open={Boolean(pendingAction)} onClose={() => setPendingAction(null)}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogText}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={isBusy} onClick={() => setPendingAction(null)} variant="outlined">
            {t('app.cancel')}
          </Button>
          <Button color={isReplace ? 'primary' : 'error'} disabled={isBusy} onClick={confirmAction} variant="contained">
            {t('app.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
