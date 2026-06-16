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
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const isReplace = pendingAction === 'replace-cloud';
  const dialogTitle = isReplace ? '覆盖云端并删除本地？' : '删除本地任务？';
  const dialogText = isReplace
    ? `将用当前 ${localCount} 个本地任务替换云端任务。成功后会删除本地任务，之后进入云端模式。`
    : `将删除当前 ${localCount} 个本地任务，并保留云端任务。这个操作无法撤销。`;

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
          <Typography variant="h2">处理本地任务</Typography>
          <Typography color="text.secondary" variant="body2">
            你已登录云端账号，但当前设备还有 {localCount} 个本地任务。为了避免两端数据混乱，请先选择如何处理。
          </Typography>
        </Stack>

        <Alert severity="info">
          云端模式会优先使用服务器数据库。本地任务处理完成后，应用会进入当前账号的云端任务列表。
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
            用本地覆盖云端
          </Button>
          <Button
            color="error"
            disabled={isBusy}
            fullWidth
            onClick={() => setPendingAction('clear-local')}
            startIcon={<DeleteSweepRoundedIcon />}
            variant="outlined"
          >
            删除本地，保留云端
          </Button>
        </Stack>

        <Button disabled={isBusy} onClick={onLogout} startIcon={<LogoutRoundedIcon />} variant="text">
          退出登录，继续本地模式
        </Button>
      </Paper>

      <Dialog open={Boolean(pendingAction)} onClose={() => setPendingAction(null)}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogText}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button disabled={isBusy} onClick={() => setPendingAction(null)} variant="outlined">
            取消
          </Button>
          <Button color={isReplace ? 'primary' : 'error'} disabled={isBusy} onClick={confirmAction} variant="contained">
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
