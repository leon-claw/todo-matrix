import { useLayoutEffect, useRef } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import type { MatrixTask, TaskMetrics } from '../types';
import { TaskCard } from './TaskCard';

interface TodoListProps {
  tasks: MatrixTask[];
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: MatrixTask) => void;
  onMetricsChange: (taskId: string, metrics: Partial<TaskMetrics>) => void;
  onToggleAxis: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export function TodoList({
  tasks,
  onDeleteTask,
  onEditTask,
  onMetricsChange,
  onToggleAxis,
  onToggleTask,
}: TodoListProps) {
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const previousRectsRef = useRef(new Map<string, DOMRect>());
  const activeAnimationsRef = useRef(new Map<string, Animation>());

  useLayoutEffect(() => {
    const shouldReduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nextRects = new Map<string, DOMRect>();

    tasks.forEach((task) => {
      const element = itemRefs.current.get(task.id);
      if (element) {
        nextRects.set(task.id, element.getBoundingClientRect());
      }
    });

    if (shouldReduceMotion) {
      previousRectsRef.current = nextRects;
      return;
    }

    tasks.forEach((task) => {
      const element = itemRefs.current.get(task.id);
      const previousRect = previousRectsRef.current.get(task.id);
      const nextRect = nextRects.get(task.id);
      if (!element || !previousRect || !nextRect) {
        return;
      }

      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
        return;
      }

      activeAnimationsRef.current.get(task.id)?.cancel();
      element.style.willChange = 'transform';
      const animation = element.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration: 260,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
        },
      );
      activeAnimationsRef.current.set(task.id, animation);
      void animation.finished
        .catch(() => undefined)
        .then(() => {
          if (activeAnimationsRef.current.get(task.id) === animation) {
            activeAnimationsRef.current.delete(task.id);
            element.style.willChange = '';
          }
        });
    });

    previousRectsRef.current = nextRects;
  }, [tasks]);

  if (!tasks.length) {
    return (
      <Paper
        aria-label="TODO 列表"
        component="section"
        variant="outlined"
        sx={{
          alignItems: 'center',
          borderStyle: 'dashed',
          color: 'text.secondary',
          display: 'grid',
          gap: 1,
          minHeight: 220,
          p: 3,
          placeItems: 'center',
          textAlign: 'center',
        }}
      >
        <InboxRoundedIcon />
        <Typography sx={{ fontWeight: 600 }}>暂无任务</Typography>
      </Paper>
    );
  }

  return (
    <Stack aria-label="TODO 列表" component="section" spacing={1}>
      {tasks.map((task) => (
        <Box
          key={task.id}
          ref={(element: HTMLDivElement | null) => {
            if (element) {
              itemRefs.current.set(task.id, element);
              return;
            }

            itemRefs.current.delete(task.id);
            activeAnimationsRef.current.get(task.id)?.cancel();
            activeAnimationsRef.current.delete(task.id);
          }}
        >
          <TaskCard
            onDelete={onDeleteTask}
            onEdit={onEditTask}
            onMetricsChange={onMetricsChange}
            onToggle={onToggleTask}
            onToggleAxis={onToggleAxis}
            task={task}
          />
        </Box>
      ))}
    </Stack>
  );
}
