import { Box, Paper, Stack, Typography } from '@mui/material';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  if (!tasks.length) {
    return (
      <Paper
        aria-label={t('app.todoList')}
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
        <Typography sx={{ fontWeight: 600 }}>{t('task.empty')}</Typography>
      </Paper>
    );
  }

  return (
    <Stack aria-label={t('app.todoList')} component="section" spacing={1}>
      {tasks.map((task) => (
        <Box key={task.id}>
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
