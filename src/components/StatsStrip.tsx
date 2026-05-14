import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import ScatterPlotRoundedIcon from '@mui/icons-material/ScatterPlotRounded';
import type { TaskFilter } from '../types';

interface StatsStripProps {
  active: number;
  activeFilter: TaskFilter;
  completed: number;
  onFilterChange: (filter: TaskFilter) => void;
  shownOnAxis: number;
  total: number;
}

const filterOptions: Array<{
  icon: typeof BarChartRoundedIcon;
  id: TaskFilter;
  label: string;
}> = [
  { id: 'all', label: '全部', icon: BarChartRoundedIcon },
  { id: 'active', label: '进行中', icon: RadioButtonUncheckedRoundedIcon },
  { id: 'completed', label: '已完成', icon: CheckRoundedIcon },
  { id: 'axis', label: '坐标轴', icon: ScatterPlotRoundedIcon },
];

export function StatsStrip({
  active,
  activeFilter,
  completed,
  onFilterChange,
  shownOnAxis,
  total,
}: StatsStripProps) {
  const counts: Record<TaskFilter, number> = {
    all: total,
    active,
    completed,
    axis: shownOnAxis,
  };

  return (
    <Box aria-label="任务筛选" component="section">
      <ToggleButtonGroup
        exclusive
        fullWidth
        color="primary"
        value={activeFilter}
        onChange={(_, value: TaskFilter | null) => {
          if (value) {
            onFilterChange(value);
          }
        }}
        sx={{
          alignItems: 'stretch',
          display: 'grid',
          gap: 1,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' },
          '& .MuiToggleButtonGroup-grouped': {
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            m: 0,
          },
        }}
      >
        {filterOptions.map((option) => {
          const Icon = option.icon;

          return (
            <ToggleButton key={option.id} value={option.id} sx={{ justifyContent: 'flex-start', px: 1.5, py: 1.25 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', width: '100%' }}>
                <Icon fontSize="small" />
                <Box sx={{ minWidth: 0, textAlign: 'left' }}>
                  <Typography sx={{ lineHeight: 1 }} variant="h6">
                    {counts[option.id]}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontWeight: 700, lineHeight: 1.2 }} variant="caption">
                    {option.label}
                  </Typography>
                </Box>
              </Stack>
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    </Box>
  );
}
