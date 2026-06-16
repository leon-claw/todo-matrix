import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { requireEnv } from './config';

const adapter = new PrismaMariaDb(requireEnv('DATABASE_URL'));

export const prisma = new PrismaClient({ adapter });
