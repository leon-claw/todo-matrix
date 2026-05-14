import type { MatrixTask } from '../types';
import { TASK_COLOR_PRESETS } from '../constants/taskAppearance';

const now = new Date().toISOString();

export const sampleTasks: MatrixTask[] = [
  {
    id: 'seed-1',
    title: '确认今天必须完成的任务',
    notes: '先判断是否真的紧急，再决定要不要立即处理。',
    importance: 82,
    urgency: 78,
    color: TASK_COLOR_PRESETS[0],
    progress: 15,
    showOnAxis: true,
    completed: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'seed-2',
    title: '推进长期目标的一小步',
    notes: '重要但不一定紧急，适合安排一个固定时间块。',
    importance: 88,
    urgency: 34,
    color: TASK_COLOR_PRESETS[6],
    progress: 40,
    showOnAxis: true,
    completed: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'seed-3',
    title: '处理临时打断事项',
    notes: '如果不重要，可以降低优先级或晚些再看。',
    importance: 36,
    urgency: 72,
    color: TASK_COLOR_PRESETS[4],
    progress: 0,
    showOnAxis: true,
    completed: false,
    createdAt: now,
    updatedAt: now,
  },
];
