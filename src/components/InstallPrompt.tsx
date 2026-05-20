import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setShowInstallHelp(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  function handleInstall() {
    if (!promptEvent || isStandaloneMode()) {
      setShowInstallHelp(true);
      return;
    }

    promptEvent.prompt();
    promptEvent.userChoice.finally(() => setPromptEvent(null));
  }

  return (
    <>
      <Button
        color="inherit"
        onClick={handleInstall}
        startIcon={<DownloadRoundedIcon />}
        title={promptEvent ? '安装到设备' : '浏览器暂未开放安装弹窗时，可从浏览器菜单安装'}
        type="button"
        variant="outlined"
      >
        安装到设备
      </Button>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={showInstallHelp}
        onClose={() => setShowInstallHelp(false)}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle>安装到设备</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2">
            当前浏览器没有开放自动安装弹窗，或者应用已经安装。可以按下面的方式手动安装。
          </Typography>
          <List dense sx={{ mt: 1 }}>
            <ListItem disablePadding>
              <ListItemText primary="Chrome / Edge 桌面端" secondary="点击地址栏右侧的安装图标，或打开浏览器菜单，选择“安装应用”。" />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary="Android Chrome" secondary="打开右上角菜单，选择“安装应用”或“添加到主屏幕”。" />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary="iPhone / iPad Safari" secondary="点击分享按钮，选择“添加到主屏幕”。iOS 通常不会触发网页内安装弹窗。" />
            </ListItem>
          </List>
          <Typography color="text.secondary" variant="caption">
            安装能力通常要求使用 HTTPS，localhost 开发环境除外。生产部署时请确保 service worker 和 manifest 可以正常访问。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowInstallHelp(false)} variant="contained">
            知道了
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
