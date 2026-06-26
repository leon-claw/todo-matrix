import { Box, Button, Checkbox, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useTranslation } from 'react-i18next';
import { createSubTodo, normalizeSubtasks } from '../lib/subtasks';
import type { SubTodo } from '../types';

interface SubtasksEditorProps {
  onChange: (subtasks: SubTodo[]) => void;
  subtasks: SubTodo[];
}

export function SubtasksEditor({ onChange, subtasks }: SubtasksEditorProps) {
  const { t } = useTranslation();

  function commit(nextSubtasks: SubTodo[]) {
    onChange(normalizeSubtasks(nextSubtasks));
  }

  function updateSubtask(subtaskId: string, patch: Partial<SubTodo>) {
    onChange(subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, ...patch } : subtask)));
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Typography color="text.secondary" sx={{ fontWeight: 700 }} variant="caption">
          {t('task.subtasks')}
        </Typography>
        <Button
          onClick={() => onChange([...subtasks, createSubTodo()])}
          size="small"
          startIcon={<AddRoundedIcon />}
          type="button"
          variant="text"
        >
          {t('task.addSubtask')}
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          bgcolor: 'background.default',
          display: 'grid',
          gap: 0.75,
          p: 1,
        }}
      >
        {subtasks.length ? (
          subtasks.map((subtask) => (
            <Stack key={subtask.id} direction="row" spacing={0.75} sx={{ alignItems: 'flex-start' }}>
              <Checkbox
                checked={subtask.completed}
                onChange={(event) => updateSubtask(subtask.id, { completed: event.target.checked })}
                size="small"
                sx={{ mt: 0.25, p: 0.5 }}
              />
              <TextField
                fullWidth
                multiline
                minRows={1}
                onBlur={() => commit(subtasks)}
                onChange={(event) => updateSubtask(subtask.id, { title: event.target.value })}
                placeholder={t('task.subtaskPlaceholder')}
                size="small"
                value={subtask.title}
                variant="standard"
                slotProps={{ htmlInput: { maxLength: 120 } }}
              />
              <Tooltip title={t('task.deleteSubtask')}>
                <IconButton
                  aria-label={t('task.deleteSubtask')}
                  onClick={() => onChange(subtasks.filter((current) => current.id !== subtask.id))}
                  size="small"
                  sx={{ mt: 0.25 }}
                  type="button"
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ px: 0.5, py: 0.75 }} variant="body2">
            {t('task.emptySubtasks')}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
