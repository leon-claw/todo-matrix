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
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          display: 'grid',
          gap: { xs: 0.75, sm: 1 },
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          p: 0.75,
          '& .MuiToggleButtonGroup-grouped': {
            border: 0,
            borderRadius: 2,
            m: 0,
            transition: 'background-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
          },
          '& .Mui-selected': {
            bgcolor: 'primary.main',
            boxShadow: '0 8px 18px rgba(29, 78, 216, 0.18)',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '& .MuiTypography-root': {
              color: 'inherit',
            },
          },
        }}
      >
        {filterOptions.map((option) => {
          const Icon = option.icon;

          return (
            <ToggleButton
              key={option.id}
              value={option.id}
              sx={{
                justifyContent: { xs: 'center', sm: 'flex-start' },
                minWidth: 0,
                px: { xs: 0.5, sm: 1.5 },
                py: { xs: 0.75, sm: 1 },
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.25, sm: 1.25 }}
                sx={{ alignItems: 'center', minWidth: 0, width: '100%' }}
              >
                <Icon fontSize="small" />
                <Box sx={{ minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 800, lineHeight: 1 }} variant="h6">
                    {counts[option.id]}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ display: 'block', fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    variant="caption"
                  >
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
