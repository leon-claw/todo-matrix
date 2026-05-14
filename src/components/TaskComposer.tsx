import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  FormControlLabel,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { FormEvent, useEffect, useState } from 'react';
import { DEFAULT_TASK_COLOR, TASK_COLOR_PRESETS } from '../constants/taskAppearance';
import type { MatrixTask, TaskFormValues } from '../types';

interface TaskComposerProps {
  initialTask?: MatrixTask | null;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSubmit: (task: TaskFormValues) => void;
}

const emptyTask: TaskFormValues = {
  title: '',
  notes: '',
  importance: 60,
  urgency: 50,
  color: DEFAULT_TASK_COLOR,
  progress: 0,
  showOnAxis: true,
};

function getInitialValues(task?: MatrixTask | null): TaskFormValues {
  if (!task) {
    return emptyTask;
  }

  return {
    title: task.title,
    notes: task.notes,
    importance: task.importance,
    urgency: task.urgency,
    color: task.color,
    progress: task.progress,
    showOnAxis: task.showOnAxis,
  };
}

export function TaskComposer({
  initialTask,
  mode,
  onCancel,
  onSubmit,
}: TaskComposerProps) {
  const [values, setValues] = useState<TaskFormValues>(() => getInitialValues(initialTask));

  useEffect(() => {
    setValues(getInitialValues(initialTask));
  }, [initialTask]);

  function updateValue<Key extends keyof TaskFormValues>(key: Key, value: TaskFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.title.trim()) {
      return;
    }

    onSubmit(values);
  }

  return (
    <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
      <Box>
        <Typography variant="h2">{mode === 'create' ? '添加任务' : '编辑任务'}</Typography>
      </Box>

      <TextField
        autoComplete="off"
        autoFocus
        fullWidth
        label="任务标题"
        onChange={(event) => updateValue('title', event.target.value)}
        placeholder="例如：做晚饭"
        slotProps={{ htmlInput: { maxLength: 80 } }}
        value={values.title}
      />

      <TextField
        fullWidth
        label="备注"
        multiline
        onChange={(event) => updateValue('notes', event.target.value)}
        placeholder="补充上下文、负责人或下一步动作"
        rows={3}
        slotProps={{ htmlInput: { maxLength: 180 } }}
        value={values.notes}
      />

      <Box>
        <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 700, mb: 1 }} variant="caption">
          颜色标签
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {TASK_COLOR_PRESETS.map((color) => {
            const selected = values.color.toLowerCase() === color.toLowerCase();

            return (
              <ButtonBase
                aria-label={`选择颜色 ${color}`}
                aria-pressed={selected}
                key={color}
                onClick={() => updateValue('color', color)}
                sx={{
                  alignItems: 'center',
                  bgcolor: color,
                  border: 2,
                  borderColor: selected ? 'text.primary' : 'background.paper',
                  borderRadius: '50%',
                  boxShadow: selected ? '0 0 0 4px rgba(37, 99, 235, 0.12)' : '0 4px 12px rgba(15, 23, 42, 0.12)',
                  color: '#fff',
                  display: 'inline-flex',
                  height: 34,
                  justifyContent: 'center',
                  width: 34,
                }}
                type="button"
              >
                {selected ? <CheckRoundedIcon fontSize="small" /> : null}
              </ButtonBase>
            );
          })}
          <TextField
            label="自定义"
            onChange={(event) => updateValue('color', event.target.value)}
            size="small"
            sx={{ width: 112 }}
            type="color"
            value={values.color}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }} variant="caption">
            重要程度 {values.importance}
          </Typography>
          <Slider
            aria-label="重要程度"
            max={100}
            min={0}
            value={values.importance}
            valueLabelDisplay="auto"
            onChange={(_, value) => updateValue('importance', Array.isArray(value) ? value[0] : value)}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }} variant="caption">
            紧急程度 {values.urgency}
          </Typography>
          <Slider
            aria-label="紧急程度"
            max={100}
            min={0}
            value={values.urgency}
            valueLabelDisplay="auto"
            onChange={(_, value) => updateValue('urgency', Array.isArray(value) ? value[0] : value)}
          />
        </Box>
      </Stack>

      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography color="text.secondary" sx={{ fontWeight: 700 }} variant="caption">
            进度
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {values.progress}%
          </Typography>
        </Stack>
        <Slider
          aria-label="进度"
          max={100}
          min={0}
          value={values.progress}
          valueLabelDisplay="auto"
          onChange={(_, value) => updateValue('progress', Array.isArray(value) ? value[0] : value)}
        />
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={values.showOnAxis}
            onChange={(event) => updateValue('showOnAxis', event.target.checked)}
          />
        }
        label="显示在坐标轴中"
      />

      <Stack direction="row" spacing={1.25} sx={{ justifyContent: 'flex-end', pt: 1 }}>
        <Button onClick={onCancel} type="button" variant="outlined">
          取消
        </Button>
        <Button
          disableElevation
          disabled={!values.title.trim()}
          startIcon={<SaveRoundedIcon />}
          type="submit"
          variant="contained"
        >
          {mode === 'create' ? '添加任务' : '保存修改'}
        </Button>
      </Stack>
    </Stack>
  );
}
