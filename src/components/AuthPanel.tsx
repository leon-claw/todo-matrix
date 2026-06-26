import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CloudQueueRoundedIcon from '@mui/icons-material/CloudQueueRounded';
import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useTranslation } from 'react-i18next';
import { apiRequest, checkApiHealth } from '../lib/apiClient';
import {
  DEFAULT_OFFICIAL_API_BASE,
  type ServerConfig,
  type ServerMode,
  getRuntimeOfficialApiBase,
  normalizeServerApiBase,
  serverConfigEquals,
} from '../lib/serverConfig';

type AuthMode = 'login' | 'register';

interface CaptchaChallenge {
  id: string;
  image: string;
  expiresAt: string;
}

interface AuthPanelProps {
  error: string | null;
  isLoading?: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, captcha: { captchaId: string; captchaAnswer: string }) => Promise<void>;
  onServerConfigChange: (config: ServerConfig) => ServerConfig;
  serverConfig: ServerConfig;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getOfficialConfig(): ServerConfig {
  return {
    apiBaseUrl: getRuntimeOfficialApiBase(),
    mode: 'official',
  };
}

export function AuthPanel({
  error,
  isLoading = false,
  onLogin,
  onRegister,
  onServerConfigChange,
  serverConfig,
}: AuthPanelProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [serverMode, setServerMode] = useState<ServerMode>(serverConfig.mode);
  const [customServerUrl, setCustomServerUrl] = useState(
    serverConfig.mode === 'custom' ? serverConfig.apiBaseUrl : '',
  );
  const [isServerChecking, setIsServerChecking] = useState(false);

  useEffect(() => {
    setServerMode(serverConfig.mode);
    if (serverConfig.mode === 'custom') {
      setCustomServerUrl(serverConfig.apiBaseUrl);
    }
  }, [serverConfig]);

  const normalizedEmail = email.trim();
  const emailError = useMemo(() => Boolean(normalizedEmail) && !EMAIL_PATTERN.test(normalizedEmail), [normalizedEmail]);

  const selectedServerConfig = useMemo<ServerConfig | null>(() => {
    if (serverMode === 'official') {
      return getOfficialConfig();
    }

    try {
      return {
        apiBaseUrl: normalizeServerApiBase(customServerUrl),
        mode: 'custom',
      };
    } catch {
      return null;
    }
  }, [customServerUrl, serverMode]);

  const serverNeedsApply = selectedServerConfig ? !serverConfigEquals(serverConfig, selectedServerConfig) : true;

  const refreshCaptcha = useCallback(async () => {
    setIsCaptchaLoading(true);
    try {
      const response = await apiRequest<{ captcha: CaptchaChallenge }>('/api/auth/captcha');
      setCaptcha(response.captcha);
      setCaptchaAnswer('');
    } catch {
      setLocalError(t('auth.captchaLoadFailed'));
    } finally {
      setIsCaptchaLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (mode === 'register' && !serverNeedsApply) {
      void refreshCaptcha();
    }
  }, [mode, refreshCaptcha, serverConfig.apiBaseUrl, serverNeedsApply]);

  async function applySelectedServer() {
    setLocalError(null);

    if (!selectedServerConfig) {
      setLocalError(t('auth.invalidServerUrl'));
      return null;
    }

    setIsServerChecking(true);
    try {
      if (selectedServerConfig.mode === 'custom') {
        await checkApiHealth(selectedServerConfig.apiBaseUrl);
      }

      return onServerConfigChange(selectedServerConfig);
    } catch {
      setLocalError(t('auth.serverCheckFailed'));
      return null;
    } finally {
      setIsServerChecking(false);
    }
  }

  async function ensureServerReadyForSubmit() {
    if (!serverNeedsApply) {
      return true;
    }

    const appliedConfig = await applySelectedServer();
    if (!appliedConfig) {
      return false;
    }

    if (mode === 'register') {
      await refreshCaptcha();
      setLocalError(t('auth.serverSwitched'));
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setLocalError(t('auth.invalidEmail'));
      return;
    }

    if (password.length < 8) {
      setLocalError(t('auth.passwordMin'));
      return;
    }

    if (!(await ensureServerReadyForSubmit())) {
      return;
    }

    try {
      if (mode === 'login') {
        await onLogin(normalizedEmail, password);
      } else {
        if (!captcha || !captchaAnswer.trim()) {
          setLocalError(t('auth.captchaRequired'));
          return;
        }
        await onRegister(normalizedEmail, password, {
          captchaAnswer,
          captchaId: captcha.id,
        });
      }
    } catch {
      if (mode === 'register') {
        void refreshCaptcha();
      }
    }
  }

  const submitDisabled =
    isLoading ||
    isServerChecking ||
    emailError ||
    !normalizedEmail ||
    password.length < 8 ||
    (mode === 'register' && (!captcha || !captchaAnswer.trim() || isCaptchaLoading));

  return (
    <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
      <Box>
        <Typography variant="h2">{mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}</Typography>
        <Typography color="text.secondary" variant="body2">
          {t('auth.subtitle')}
        </Typography>
      </Box>

      <ToggleButtonGroup
        exclusive
        fullWidth
        onChange={(_, nextMode) => {
          if (nextMode) {
            setMode(nextMode);
            setLocalError(null);
          }
        }}
        size="small"
        value={mode}
      >
        <ToggleButton value="login">{t('account.login')}</ToggleButton>
        <ToggleButton value="register">{t('auth.register')}</ToggleButton>
      </ToggleButtonGroup>

      <Stack spacing={1.25}>
        <Typography sx={{ fontWeight: 800 }} variant="body2">
          {t('auth.server')}
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          onChange={(_, nextMode) => {
            if (nextMode) {
              setServerMode(nextMode);
              setLocalError(null);
            }
          }}
          size="small"
          value={serverMode}
        >
          <ToggleButton value="official">
            <CloudQueueRoundedIcon fontSize="small" sx={{ mr: 0.75 }} />
            {t('auth.officialServer')}
          </ToggleButton>
          <ToggleButton value="custom">
            <DnsRoundedIcon fontSize="small" sx={{ mr: 0.75 }} />
            {t('auth.customServer')}
          </ToggleButton>
        </ToggleButtonGroup>

        {serverMode === 'custom' ? (
          <TextField
            fullWidth
            helperText={t('auth.serverUrlExample')}
            label={t('auth.serverUrl')}
            onChange={(event) => setCustomServerUrl(event.target.value)}
            placeholder="https://todo.example.com"
            value={customServerUrl}
          />
        ) : (
          <Typography color="text.secondary" variant="caption">
            {t('auth.currentDefault', { url: getRuntimeOfficialApiBase() || DEFAULT_OFFICIAL_API_BASE })}
          </Typography>
        )}

        {serverNeedsApply ? (
          <Button
            disabled={isServerChecking || (serverMode === 'custom' && !customServerUrl.trim())}
            onClick={() => void applySelectedServer()}
            startIcon={isServerChecking ? <CircularProgress color="inherit" size={16} /> : undefined}
            type="button"
            variant="outlined"
          >
            {serverMode === 'custom' ? t('auth.testAndUseServer') : t('auth.useDefaultServer')}
          </Button>
        ) : null}
      </Stack>

      {error || localError ? <Alert severity="error">{error || localError}</Alert> : null}

      <TextField
        autoComplete="email"
        autoFocus
        error={emailError}
        fullWidth
        helperText={emailError ? t('auth.emailFormatInvalid') : ' '}
        label={t('auth.email')}
        onChange={(event) => setEmail(event.target.value)}
        required
        slotProps={{
          htmlInput: {
            inputMode: 'email',
            pattern: EMAIL_PATTERN.source,
          },
        }}
        type="email"
        value={email}
      />
      <TextField
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        fullWidth
        helperText={t('auth.passwordHelper')}
        label={t('auth.password')}
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />

      {mode === 'register' ? (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            component="img"
            alt={t('auth.captchaAlt')}
            src={captcha?.image}
            sx={{
              bgcolor: 'grey.100',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              height: 56,
              objectFit: 'contain',
              width: 160,
            }}
          />
          <IconButton
            aria-label={t('auth.refreshCaptcha')}
            disabled={isCaptchaLoading || serverNeedsApply}
            onClick={refreshCaptcha}
            type="button"
          >
            <RefreshRoundedIcon />
          </IconButton>
          <TextField
            autoComplete="off"
            disabled={serverNeedsApply}
            fullWidth
            label={t('auth.captcha')}
            onChange={(event) => setCaptchaAnswer(event.target.value.toUpperCase())}
            required
            value={captchaAnswer}
          />
        </Stack>
      ) : null}

      <Divider />

      <Button
        disabled={submitDisabled}
        disableElevation
        startIcon={mode === 'login' ? <LoginRoundedIcon /> : <PersonAddAltRoundedIcon />}
        type="submit"
        variant="contained"
      >
        {mode === 'login' ? t('account.login') : t('auth.registerAndLogin')}
      </Button>
    </Stack>
  );
}
