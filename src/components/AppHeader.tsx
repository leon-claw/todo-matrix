import { Box, Button, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { InstallPrompt } from './InstallPrompt';

interface AppHeaderProps {
  onCreateTask: () => void;
}

export function AppHeader({ onCreateTask }: AppHeaderProps) {
  return (
    <Stack
      component="header"
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        mb: 3,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Box
          aria-hidden="true"
          sx={{
            bgcolor: 'grey.900',
            borderRadius: 2,
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
            display: 'grid',
            flex: '0 0 auto',
            gap: 0.5,
            gridTemplateColumns: 'repeat(2, 14px)',
            height: 44,
            p: '6px',
            width: 44,
            '& span': {
              borderRadius: '4px',
            },
            '& span:nth-of-type(1)': { bgcolor: 'warning.main' },
            '& span:nth-of-type(2)': { bgcolor: 'success.main' },
            '& span:nth-of-type(3)': { bgcolor: 'info.main' },
            '& span:nth-of-type(4)': { bgcolor: 'secondary.main' },
          }}
        >
          <span />
          <span />
          <span />
          <span />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h1">Todo Matrix</Typography>
          <Typography color="text.secondary" variant="subtitle2">
            离线优先的本地 TODO 坐标轴
          </Typography>
        </Box>
      </Stack>

      <Stack
        aria-label="任务操作"
        direction="row"
        spacing={1}
        sx={{ flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}
      >
        <InstallPrompt />
        <Button
          disableElevation
          onClick={onCreateTask}
          startIcon={<AddRoundedIcon />}
          type="button"
          variant="contained"
        >
          添加任务
        </Button>
      </Stack>
    </Stack>
  );
}
