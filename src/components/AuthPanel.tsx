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
      setLocalError('验证码加载失败，请稍后重试。');
    } finally {
      setIsCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'register' && !serverNeedsApply) {
      void refreshCaptcha();
    }
  }, [mode, refreshCaptcha, serverConfig.apiBaseUrl, serverNeedsApply]);

  async function applySelectedServer() {
    setLocalError(null);

    if (!selectedServerConfig) {
      setLocalError('请输入有效的自定义服务器地址。');
      return null;
    }

    setIsServerChecking(true);
    try {
      if (selectedServerConfig.mode === 'custom') {
        await checkApiHealth(selectedServerConfig.apiBaseUrl);
      }

      return onServerConfigChange(selectedServerConfig);
    } catch {
      setLocalError('服务器连接失败，请确认地址正确，并且后端 /api/health 可以访问。');
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
      setLocalError('服务器已切换，请输入新的验证码后继续注册。');
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setLocalError('请输入有效的邮箱地址。');
      return;
    }

    if (password.length < 8) {
      setLocalError('密码至少需要 8 位。');
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
          setLocalError('请输入图片验证码。');
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
        <Typography variant="h2">{mode === 'login' ? '登录云端账号' : '注册云端账号'}</Typography>
        <Typography color="text.secondary" variant="body2">
          可使用默认云接口，也可以连接自己的私有化服务器。
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
        <ToggleButton value="login">登录</ToggleButton>
        <ToggleButton value="register">注册</ToggleButton>
      </ToggleButtonGroup>

      <Stack spacing={1.25}>
        <Typography sx={{ fontWeight: 800 }} variant="body2">
          服务器
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
            默认云接口
          </ToggleButton>
          <ToggleButton value="custom">
            <DnsRoundedIcon fontSize="small" sx={{ mr: 0.75 }} />
            自定义服务器
          </ToggleButton>
        </ToggleButtonGroup>

        {serverMode === 'custom' ? (
          <TextField
            fullWidth
            helperText="例如：https://todo.example.com 或 https://todo.example.com/api"
            label="服务器地址"
            onChange={(event) => setCustomServerUrl(event.target.value)}
            placeholder="https://todo.example.com"
            value={customServerUrl}
          />
        ) : (
          <Typography color="text.secondary" variant="caption">
            当前默认：{getRuntimeOfficialApiBase() || DEFAULT_OFFICIAL_API_BASE}
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
            {serverMode === 'custom' ? '测试并使用服务器' : '使用默认云接口'}
          </Button>
        ) : null}
      </Stack>

      {error || localError ? <Alert severity="error">{error || localError}</Alert> : null}

      <TextField
        autoComplete="email"
        autoFocus
        error={emailError}
        fullWidth
        helperText={emailError ? '邮箱格式不正确' : ' '}
        label="邮箱"
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
        helperText="至少 8 位"
        label="密码"
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />

      {mode === 'register' ? (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            component="img"
            alt="图片验证码"
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
            aria-label="刷新验证码"
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
            label="验证码"
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
        {mode === 'login' ? '登录' : '注册并登录'}
      </Button>
    </Stack>
  );
}
