const api = require('../../utils/api');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Page({
  data: {
    captchaAnswer: '',
    captchaId: '',
    captchaImage: '',
    email: '',
    error: '',
    isLoading: false,
    mode: 'login',
    password: ''
  },

  onLoad() {
    if (this.data.mode === 'register') {
      this.refreshCaptcha();
    }
  },

  setMode(event) {
    const mode = event.currentTarget.dataset.mode;
    this.setData({ mode, error: '' });
    if (mode === 'register' && !this.data.captchaImage) {
      this.refreshCaptcha();
    }
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },

  async refreshCaptcha() {
    this.setData({ isLoading: true, error: '' });
    try {
      const response = await api.request({ url: '/auth/captcha' });
      this.setData({
        captchaAnswer: '',
        captchaId: response.captcha.id,
        captchaImage: api.resolveApiUrl(response.captcha.imageUrl) || response.captcha.image
      });
    } catch (error) {
      this.setData({ error: error.message || '验证码加载失败' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async submit() {
    const email = this.data.email.trim();
    const password = this.data.password;
    this.setData({ error: '' });

    if (!EMAIL_PATTERN.test(email)) {
      this.setData({ error: '请输入有效的邮箱地址。' });
      return;
    }

    if (password.length < 8) {
      this.setData({ error: '密码至少需要 8 位。' });
      return;
    }

    if (this.data.mode === 'register' && !this.data.captchaAnswer.trim()) {
      this.setData({ error: '请输入图片验证码。' });
      return;
    }

    this.setData({ isLoading: true });
    try {
      if (this.data.mode === 'login') {
        await api.login(email, password);
      } else {
        await api.register({
          email,
          password,
          captchaId: this.data.captchaId,
          captchaAnswer: this.data.captchaAnswer.trim()
        });
      }

      wx.showToast({ title: this.data.mode === 'login' ? '已登录' : '已注册' });
      wx.navigateBack();
    } catch (error) {
      this.setData({ error: error.message || '操作失败' });
      if (this.data.mode === 'register') {
        this.refreshCaptcha();
      }
    } finally {
      this.setData({ isLoading: false });
    }
  }
});
