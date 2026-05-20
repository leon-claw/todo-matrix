import { randomBytes, randomInt } from 'node:crypto';

const CAPTCHA_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CAPTCHA_TTL_MS = 5 * 60 * 1000;

interface CaptchaRecord {
  answer: string;
  expiresAt: number;
  svg: string;
}

const captchaStore = new Map<string, CaptchaRecord>();

function cleanupExpiredCaptchas(now = Date.now()) {
  for (const [id, record] of captchaStore) {
    if (record.expiresAt <= now) {
      captchaStore.delete(id);
    }
  }
}

function createCaptchaText() {
  let value = '';
  for (let index = 0; index < 5; index += 1) {
    value += CAPTCHA_CHARS[randomInt(CAPTCHA_CHARS.length)];
  }
  return value;
}

function createSvgCaptcha(text: string) {
  const lines = Array.from({ length: 7 }, () => {
    const x1 = randomInt(0, 160);
    const y1 = randomInt(0, 56);
    const x2 = randomInt(0, 160);
    const y2 = randomInt(0, 56);
    const opacity = (randomInt(14, 30) / 100).toFixed(2);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="1" opacity="${opacity}" />`;
  }).join('');

  const dots = Array.from({ length: 24 }, () => {
    const cx = randomInt(4, 156);
    const cy = randomInt(4, 52);
    const radius = randomInt(1, 3);
    const opacity = (randomInt(18, 36) / 100).toFixed(2);
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#475569" opacity="${opacity}" />`;
  }).join('');

  const letters = text
    .split('')
    .map((char, index) => {
      const x = 18 + index * 27 + randomInt(-2, 3);
      const y = 36 + randomInt(-4, 5);
      const rotate = randomInt(-18, 19);
      const colors = ['#0f172a', '#1d4ed8', '#047857', '#7c3aed'];
      const color = colors[randomInt(colors.length)];
      return `<text x="${x}" y="${y}" rotate="${rotate}" fill="${color}" font-size="28" font-weight="700" font-family="Arial, sans-serif">${char}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="56" viewBox="0 0 160 56" role="img" aria-label="captcha">
  <rect width="160" height="56" rx="10" fill="#f8fafc" />
  ${lines}
  ${dots}
  <g>${letters}</g>
</svg>`;
}

export function createCaptchaChallenge() {
  cleanupExpiredCaptchas();
  const id = randomBytes(16).toString('hex');
  const answer = createCaptchaText();
  const expiresAt = Date.now() + CAPTCHA_TTL_MS;
  const svg = createSvgCaptcha(answer);

  captchaStore.set(id, { answer, expiresAt, svg });

  return {
    expiresAt: new Date(expiresAt).toISOString(),
    id,
    image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    imageUrl: `/api/auth/captcha/${id}.svg`,
  };
}

export function readCaptchaImage(id: string) {
  cleanupExpiredCaptchas();
  return captchaStore.get(id)?.svg ?? null;
}

export function verifyCaptchaChallenge(id: string, answer: string) {
  cleanupExpiredCaptchas();
  const record = captchaStore.get(id);
  captchaStore.delete(id);

  if (!record) {
    return { ok: false, reason: 'expired' as const };
  }

  const normalizedAnswer = answer.trim().toUpperCase();
  return {
    ok: normalizedAnswer === record.answer,
    reason: normalizedAnswer === record.answer ? null : ('invalid' as const),
  };
}
