import { Checkbox, Stack, Typography } from '@mui/material';
import type { SubTodo } from '../types';

interface SubtasksPreviewProps {
  subtasks: SubTodo[];
}

export function SubtasksPreview({ subtasks }: SubtasksPreviewProps) {
  if (!subtasks.length) {
    return null;
  }

  return (
    <Stack spacing={0.5}>
      {subtasks.map((subtask) => (
        <Stack key={subtask.id} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Checkbox checked={subtask.completed} disabled size="small" sx={{ p: 0 }} />
          <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }} variant="body2">
            {subtask.title}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
