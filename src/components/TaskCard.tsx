import { Box, ButtonBase, Collapse, Divider, IconButton, Paper, Slider, Stack, Tooltip, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { useState } from 'react';
import type { MatrixTask, TaskMetrics } from '../types';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        bgcolor: task.completed ? 'grey.50' : 'background.paper',
        opacity: task.completed ? 0.78 : 1,
        p: 1.25,
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Tooltip title={task.completed ? '标记为未完成' : '标记为完成'}>
          <IconButton
            aria-label={task.completed ? '标记为未完成' : '标记为完成'}
            color={task.completed ? 'success' : 'default'}
            onClick={() => onToggle(task.id)}
            size="small"
          >
            {task.completed ? <CheckCircleRoundedIcon /> : <RadioButtonUncheckedRoundedIcon />}
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ButtonBase
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((current) => !current)}
            sx={{
              borderRadius: 1,
              display: 'block',
              py: 0.5,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <Typography
              component="h3"
              sx={{
                fontWeight: 700,
                overflowWrap: 'anywhere',
                textDecoration: task.completed ? 'line-through' : 'none',
              }}
              variant="body1"
            >
              {task.title}
            </Typography>
          </ButtonBase>

          <Collapse in={isExpanded} timeout={180} unmountOnExit>
            <Box sx={{ pt: 1 }}>
              {task.notes ? (
                <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }} variant="body2">
                  {task.notes}
                </Typography>
              ) : null}

              <Divider sx={{ my: 1.5 }} />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }} variant="caption">
                    重要程度 {task.importance}
                  </Typography>
                  <Slider
                    aria-label="重要程度"
                    max={100}
                    min={0}
                    size="small"
                    value={task.importance}
                    onChange={(_, value) =>
                      onMetricsChange(task.id, { importance: Array.isArray(value) ? value[0] : value })
                    }
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography color="text.secondary" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }} variant="caption">
                    紧急程度 {task.urgency}
                  </Typography>
                  <Slider
                    aria-label="紧急程度"
                    max={100}
                    min={0}
                    size="small"
                    value={task.urgency}
                    onChange={(_, value) =>
                      onMetricsChange(task.id, { urgency: Array.isArray(value) ? value[0] : value })
                    }
                  />
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ flex: '0 0 auto' }}>
          <Tooltip title={isExpanded ? '折叠任务' : '展开任务'}>
            <IconButton
              aria-label={isExpanded ? '折叠任务' : '展开任务'}
              onClick={() => setIsExpanded((current) => !current)}
              size="small"
            >
              {isExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="编辑任务">
            <IconButton aria-label="编辑任务" onClick={() => onEdit(task)} size="small">
              <EditRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={task.showOnAxis ? '从坐标轴隐藏' : '显示在坐标轴中'}>
            <IconButton
              aria-label={task.showOnAxis ? '从坐标轴隐藏' : '显示在坐标轴中'}
              color={task.showOnAxis ? 'primary' : 'default'}
              onClick={() => onToggleAxis(task.id)}
              size="small"
            >
              {task.showOnAxis ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="删除任务">
            <IconButton aria-label="删除任务" color="error" onClick={() => onDelete(task.id)} size="small">
              <DeleteOutlineRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}
