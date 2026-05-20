import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { apiRequest } from '../lib/apiClient';

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
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPanel({ error, isLoading = false, onLogin, onRegister }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const normalizedEmail = email.trim();
  const emailError = useMemo(() => Boolean(normalizedEmail) && !EMAIL_PATTERN.test(normalizedEmail), [normalizedEmail]);

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
    if (mode === 'register') {
      void refreshCaptcha();
    }
  }, [mode, refreshCaptcha]);

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
    emailError ||
    !normalizedEmail ||
    password.length < 8 ||
    (mode === 'register' && (!captcha || !captchaAnswer.trim() || isCaptchaLoading));

  return (
    <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
      <Box>
        <Typography variant="h2">{mode === 'login' ? '登录云端账号' : '注册云端账号'}</Typography>
        <Typography color="text.secondary" variant="body2">
          登录后使用云端数据库保存任务，未登录时仍可继续使用本地模式。
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
            disabled={isCaptchaLoading}
            onClick={refreshCaptcha}
            type="button"
          >
            <RefreshRoundedIcon />
          </IconButton>
          <TextField
            autoComplete="off"
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
