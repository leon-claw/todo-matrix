const { API_BASE_URL } = require('../config');

const TOKEN_KEY = 'todo_matrix_session_token';
const USER_KEY = 'todo_matrix_user';

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || '';
}

function getUser() {
  const token = getToken();
  const user = wx.getStorageSync(USER_KEY) || null;
  if (user && !token) {
    wx.removeStorageSync(USER_KEY);
    return null;
  }
  return user;
}

function saveSession(payload) {
  if (payload.token) {
    wx.setStorageSync(TOKEN_KEY, payload.token);
  }
  if (payload.user) {
    wx.setStorageSync(USER_KEY, payload.user);
  }
}

function assertSessionPayload(payload) {
  if (!payload || !payload.token || !payload.user) {
    throw new Error('登录成功但后端没有返回小程序会话 token，请重启后端服务并确认代码已更新。');
  }
}

function clearSession() {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(USER_KEY);
}

function request(options) {
  const token = getToken();
  const url = `${API_BASE_URL}${options.url}`;

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token } : {}),
        ...(options.header || {})
      },
      success(response) {
        const statusCode = response.statusCode || 0;
        if (statusCode >= 200 && statusCode < 300) {
          resolve(response.data || {});
          return;
        }

        const message = response.data && response.data.error ? response.data.error : `请求失败：${statusCode}`;
        if (statusCode === 401) {
          clearSession();
        }
        reject(new Error(message));
      },
      fail(error) {
        reject(new Error(error.errMsg || '网络请求失败'));
      }
    });
  });
}

function resolveApiUrl(path) {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith('/api/') ? path.slice('/api'.length) : path;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function login(email, password) {
  const payload = await request({
    url: '/auth/login',
    method: 'POST',
    data: { email, password }
  });
  assertSessionPayload(payload);
  saveSession(payload);
  return payload;
}

async function register(data) {
  const payload = await request({
    url: '/auth/register',
    method: 'POST',
    data
  });
  assertSessionPayload(payload);
  saveSession(payload);
  return payload;
}

async function logout() {
  try {
    await request({ url: '/auth/logout', method: 'POST' });
  } finally {
    clearSession();
  }
}

module.exports = {
  clearSession,
  getToken,
  getUser,
  login,
  logout,
  register,
  request,
  resolveApiUrl,
  saveSession
};
