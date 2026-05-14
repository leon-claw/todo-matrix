import { Button, Snackbar } from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showFallbackHint, setShowFallbackHint] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setShowFallbackHint(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  function handleInstall() {
    if (!promptEvent) {
      setShowFallbackHint(true);
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
      <Snackbar
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        autoHideDuration={2600}
        message="请从浏览器菜单安装"
        open={showFallbackHint}
        onClose={() => setShowFallbackHint(false)}
      />
    </>
  );
}
