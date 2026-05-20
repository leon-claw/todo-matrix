import type { NextFunction, Request, Response } from 'express';
import { randomBytes, createHash } from 'node:crypto';
import argon2 from 'argon2';
import { config } from './config';
import { prisma } from './prisma';

export interface CurrentUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
      sessionTokenHash?: string;
    }
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function sessionExpiry() {
  return new Date(Date.now() + config.sessionDays * 24 * 60 * 60 * 1000);
}

export function userResponse(user: CurrentUser) {
  return {
    id: user.id,
    email: user.email,
  };
}

export async function hashPassword(password: string) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export async function createSession(res: Response, userId: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = sessionExpiry();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  res.cookie(config.cookieName, token, {
    httpOnly: true,
    maxAge: config.sessionDays * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  });
}

export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[config.cookieName];
  if (!token || typeof token !== 'string') {
    next();
    return;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    next();
    return;
  }

  req.sessionTokenHash = tokenHash;
  req.currentUser = {
    id: session.user.id,
    email: session.user.email,
  };
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
