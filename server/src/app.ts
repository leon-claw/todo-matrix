import express from 'express';
import cookieParser from 'cookie-parser';
import { Prisma } from '@prisma/client';
import { attachUser, clearSessionCookie, createSession, hashPassword, requireAuth, userResponse, verifyPassword } from './auth';
import { createCaptchaChallenge, readCaptchaImage, verifyCaptchaChallenge } from './captcha';
import { prisma } from './prisma';
import {
  authSchema,
  changePasswordSchema,
  migrationReplaceSchema,
  registerSchema,
  taskInputSchema,
  taskPatchSchema,
  taskSyncSchema,
} from './schemas';
import { calculateSubtaskProgress, normalizeSubtasks, toTaskCreateInput, toTaskResponse } from './tasks';

export const app = express();

const allowedCorsOrigins = new Set([
  'https://todo-matrix.localhost',
  ...(process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []),
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedCorsOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).send();
    return;
  }

  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(attachUser);

function readTaskId(req: express.Request) {
  const value = req.params.id;
  return Array.isArray(value) ? value[0] : value;
}

function handleError(error: unknown, res: express.Response) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({ error: 'Conflict' });
    return;
  }

  if (error && typeof error === 'object' && 'issues' in error) {
    res.status(400).json({ error: 'Invalid request', details: error });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.currentUser ? userResponse(req.currentUser) : null });
});

app.get('/api/auth/captcha', (_req, res) => {
  res.json({ captcha: createCaptchaChallenge() });
});

app.get('/api/auth/captcha/:id.svg', (req, res) => {
  const svg = readCaptchaImage(req.params.id);
  if (!svg) {
    res.status(404).send('Not found');
    return;
  }

  res.type('image/svg+xml').send(svg);
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);
    const captcha = verifyCaptchaChallenge(input.captchaId, input.captchaAnswer);
    if (!captcha.ok) {
      res.status(400).json({
        error: captcha.reason === 'expired' ? '验证码已过期，请刷新后重试' : '验证码不正确，请重新输入',
      });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
      },
      select: { id: true, email: true },
    });

    const session = await createSession(res, user.id);
    res.status(201).json({ user, token: session.token, expiresAt: session.expiresAt.toISOString() });
  } catch (error) {
    handleError(error, res);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const input = authSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const session = await createSession(res, user.id);
    res.json({ user: { id: user.id, email: user.email }, token: session.token, expiresAt: session.expiresAt.toISOString() });
  } catch (error) {
    handleError(error, res);
  }
});

app.post('/api/auth/logout', async (req, res) => {
  if (req.sessionTokenHash) {
    await prisma.session.delete({ where: { tokenHash: req.sessionTokenHash } }).catch(() => undefined);
  }
  clearSessionCookie(res);
  res.status(204).send();
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const input = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.currentUser!.id },
      select: { id: true, passwordHash: true },
    });

    if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
      res.status(401).json({ error: '当前密码不正确' });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.nextPassword) },
    });
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
});

app.get('/api/tasks', requireAuth, async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.currentUser!.id },
    orderBy: [{ completed: 'asc' }, { updatedAt: 'desc' }],
  });

  res.json({ tasks: tasks.map(toTaskResponse) });
});

app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const input = taskInputSchema.parse(req.body);
    const task = await prisma.task.create({
      data: toTaskCreateInput(req.currentUser!.id, input),
    });

    res.status(201).json({ task: toTaskResponse(task) });
  } catch (error) {
    handleError(error, res);
  }
});

app.put('/api/tasks/sync', requireAuth, async (req, res) => {
  try {
    const input = taskSyncSchema.parse(req.body);
    const userId = req.currentUser!.id;
    const taskIds = input.tasks.map((task) => task.id);

    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: {
          userId,
          ...(taskIds.length ? { id: { notIn: taskIds } } : {}),
        },
      });

      for (const task of input.tasks) {
        const createData = toTaskCreateInput(userId, task);
        const { userId: _userId, ...updateData } = createData;
        const updated = await tx.task.updateMany({
          where: { id: task.id, userId },
          data: updateData,
        });

        if (updated.count === 0) {
          await tx.task.create({
            data: {
              ...createData,
              id: task.id,
              ...(task.createdAt ? { createdAt: new Date(task.createdAt) } : {}),
            },
          });
        }
      }
    });

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ completed: 'asc' }, { updatedAt: 'desc' }],
    });
    res.json({ tasks: tasks.map(toTaskResponse) });
  } catch (error) {
    handleError(error, res);
  }
});

app.patch('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const input = taskPatchSchema.parse(req.body);
    const taskId = readTaskId(req);
    const data = { ...input };

    if (data.autoProgress !== undefined || data.subtasks !== undefined) {
      const currentTask = await prisma.task.findFirst({
        where: { id: taskId, userId: req.currentUser!.id },
      });

      if (!currentTask) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      const subtasks = normalizeSubtasks(data.subtasks ?? currentTask.subtasks);
      const autoProgress = data.autoProgress ?? currentTask.autoProgress;
      data.subtasks = subtasks;

      if (autoProgress) {
        data.progress = calculateSubtaskProgress(subtasks);
      }
    }

    if (Object.keys(data).length > 0) {
      const task = await prisma.task.updateMany({
        where: { id: taskId, userId: req.currentUser!.id },
        data,
      });

      if (task.count === 0) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
    }

    const updatedTask = await prisma.task.findFirst({
      where: { id: taskId, userId: req.currentUser!.id },
    });
    if (!updatedTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ task: toTaskResponse(updatedTask) });
  } catch (error) {
    handleError(error, res);
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  const taskId = readTaskId(req);
  const task = await prisma.task.deleteMany({
    where: { id: taskId, userId: req.currentUser!.id },
  });

  if (task.count === 0) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.status(204).send();
});

app.post('/api/migration/replace-tasks', requireAuth, async (req, res) => {
  try {
    const input = migrationReplaceSchema.parse(req.body);
    const userId = req.currentUser!.id;
    await prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({ where: { userId } });
      if (input.tasks.length > 0) {
        await tx.task.createMany({
          data: input.tasks.map((task) => toTaskCreateInput(userId, task)),
        });
      }
    });

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: [{ completed: 'asc' }, { updatedAt: 'desc' }],
    });
    res.json({ tasks: tasks.map(toTaskResponse) });
  } catch (error) {
    handleError(error, res);
  }
});
