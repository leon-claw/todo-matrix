import 'dotenv/config';

function readNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export const config = {
  cookieName: process.env.COOKIE_NAME || 'todo_matrix_session',
  isProduction: process.env.NODE_ENV === 'production',
  port: readNumber('SERVER_PORT', 3001),
  sessionDays: readNumber('SESSION_DAYS', 30),
};

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
