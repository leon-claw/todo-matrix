import {
  Box,
  ButtonBase,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { type MouseEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTaskDisplayTitle } from '../lib/taskPresentation';
import type { MatrixTask, TaskMetrics } from '../types';
import { SubtasksPreview } from './SubtasksPreview';

interface TaskCardProps {
  task: MatrixTask;
  onDelete: (taskId: string) => void;
  onEdit: (task: MatrixTask) => void;
  onMetricsChange: (taskId: string, metrics: Partial<TaskMetrics>) => void;
  onToggle: (taskId: string) => void;
  onToggleAxis: (taskId: string) => void;
}

export function TaskCard({
  task,
  onDelete,
  onEdit,
  onMetricsChange,
  onToggle,
  onToggleAxis,
}: TaskCardProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleLabel = task.completed ? t('task.markIncomplete') : t('task.markComplete');
  const expandLabel = isExpanded ? t('task.collapse') : t('task.expand');
  const axisLabel = task.showOnAxis ? t('task.hideFromAxis') : t('task.showInAxis');

  function stopClickPropagation(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        bgcolor: task.completed ? 'rgba(248, 250, 252, 0.92)' : 'background.paper',
        borderColor: task.completed ? 'divider' : 'rgba(215, 222, 232, 0.96)',
        opacity: task.completed ? 0.78 : 1,
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, background-color 160ms ease',
        '&::before': {
          bgcolor: task.color,
          bottom: 0,
          content: '""',
          left: 0,
          position: 'absolute',
          top: 0,
          width: 3,
        },
        '&:hover': {
          borderColor: task.completed ? 'divider' : task.color,
          boxShadow: '0 14px 34px rgba(17, 24, 39, 0.08)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', p: { xs: 1.1, sm: 1.25 }, pl: 1.75 }}>
        <Tooltip title={toggleLabel}>
          <IconButton
            aria-label={toggleLabel}
            onClick={(event) => {
              stopClickPropagation(event);
              onToggle(task.id);
            }}
            size="small"
            sx={{ color: task.completed ? 'success.main' : task.color, position: 'relative', zIndex: 2 }}
          >
            {task.completed ? <CheckCircleRoundedIcon /> : <RadioButtonUncheckedRoundedIcon />}
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <ButtonBase
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
            sx={{
              alignItems: 'flex-start',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'flex-start',
              minHeight: 40,
              pt: '9px',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <Typography
              component="h3"
              sx={{
                fontWeight: 700,
                lineHeight: 1.35,
                minWidth: 0,
                overflowWrap: 'anywhere',
                textDecoration: task.completed ? 'line-through' : 'none',
              }}
              variant="body1"
            >
              {formatTaskDisplayTitle(task)}
            </Typography>
          </ButtonBase>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ flex: '0 0 auto', position: 'relative', zIndex: 2 }}>
          <Tooltip title={expandLabel}>
            <IconButton
              aria-label={expandLabel}
              onClick={(event) => {
                stopClickPropagation(event);
                setIsExpanded((current) => !current);
              }}
              size="small"
            >
              {isExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('task.edit')}>
            <IconButton
              aria-label={t('task.edit')}
              onClick={(event) => {
                stopClickPropagation(event);
                onEdit(task);
              }}
              size="small"
            >
              <EditRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={axisLabel}>
            <IconButton
              aria-label={axisLabel}
              color={task.showOnAxis ? 'primary' : 'default'}
              onClick={(event) => {
                stopClickPropagation(event);
                onToggleAxis(task.id);
              }}
              size="small"
            >
              {task.showOnAxis ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('task.delete')}>
            <IconButton
              aria-label={t('task.delete')}
              color="error"
              onClick={(event) => {
                stopClickPropagation(event);
                onDelete(task.id);
              }}
              size="small"
            >
              <DeleteOutlineRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Collapse in={isExpanded} timeout={180} unmountOnExit sx={{ width: '100%' }}>
        <Box
          sx={{
            bgcolor: 'rgba(248, 250, 252, 0.72)',
            borderTop: 1,
            borderColor: 'divider',
            maxWidth: '100%',
            px: { xs: 1.75, sm: 2 },
            py: 1.5,
            width: '100%',
          }}
        >
          {task.subtasks.length ? <SubtasksPreview subtasks={task.subtasks} /> : null}
          {task.notes ? (
            <Typography
              color="text.secondary"
              sx={{ mt: task.subtasks.length ? 1 : 0, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
              variant="body2"
            >
              {task.notes}
            </Typography>
          ) : null}

          <Divider sx={{ my: 1.5 }} />

          <Box>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography color="text.secondary" sx={{ fontWeight: 700 }} variant="caption">
                {t('task.progress')}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {task.progress}%
              </Typography>
            </Stack>
            <Slider
              aria-label={t('task.progress')}
              disabled={task.autoProgress}
              max={100}
              min={0}
              size="small"
              value={task.progress}
              valueLabelDisplay="auto"
              onChange={(_, value) =>
                onMetricsChange(task.id, { progress: Array.isArray(value) ? value[0] : value })
              }
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
