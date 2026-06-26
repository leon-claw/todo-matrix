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
import { useTranslation } from 'react-i18next';

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

function InstallPromptContent() {
  const { t } = useTranslation();
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
        title={promptEvent ? t('install.title') : t('install.unavailableTitle')}
        type="button"
        variant="outlined"
      >
        {t('install.title')}
      </Button>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={showInstallHelp}
        onClose={() => setShowInstallHelp(false)}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle>{t('install.title')}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2">
            {t('install.helpDescription')}
          </Typography>
          <List dense sx={{ mt: 1 }}>
            <ListItem disablePadding>
              <ListItemText primary={t('install.chromeDesktop')} secondary={t('install.chromeDesktopHelp')} />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary={t('install.androidChrome')} secondary={t('install.androidChromeHelp')} />
            </ListItem>
            <ListItem disablePadding>
              <ListItemText primary={t('install.iosSafari')} secondary={t('install.iosSafariHelp')} />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowInstallHelp(false)} variant="contained">
            {t('install.gotIt')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function InstallPrompt() {
  if (window.todoMatrixDesktop?.isDesktop || window.Capacitor?.isNativePlatform?.()) {
    return null;
  }

  return <InstallPromptContent />;
}
