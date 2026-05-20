import { z } from 'zod';

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
  .default('#2563eb');

const metricSchema = z.number().finite().min(0).max(100);

export const authSchema = z.object({
  email: z.string().email().max(255).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

export const registerSchema = authSchema.extend({
  captchaId: z.string().trim().min(1),
  captchaAnswer: z.string().trim().min(1).max(12),
});

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(1000).default(''),
  importance: metricSchema.default(50),
  urgency: metricSchema.default(50),
  color: hexColorSchema,
  progress: metricSchema.default(0),
  showOnAxis: z.boolean().default(true),
  completed: z.boolean().default(false),
});

export const taskPatchSchema = taskInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required',
);

export const migrationReplaceSchema = z.object({
  tasks: z.array(taskInputSchema).max(2000),
});

export type TaskInput = z.infer<typeof taskInputSchema>;
