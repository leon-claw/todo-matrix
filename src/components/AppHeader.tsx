import { Box, Button, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

interface AppHeaderProps {
  onCreateTask?: () => void;
}

export function AppHeader({ onCreateTask }: AppHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 18px 45px rgba(17, 24, 39, 0.06)',
        mb: { xs: 2, md: 2.5 },
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            aria-hidden="true"
            sx={{
              bgcolor: 'grey.900',
              borderRadius: 2,
              boxShadow: '0 12px 28px rgba(17, 24, 39, 0.14)',
              display: 'grid',
              flex: '0 0 auto',
              gap: 0.5,
              gridTemplateColumns: 'repeat(2, 13px)',
              height: 42,
              p: '6px',
              width: 42,
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
            <Typography noWrap variant="h1">
              Todo Matrix
            </Typography>
            <Typography color="text.secondary" noWrap variant="subtitle2">
              基于艾森豪威尔方法论的待办小工具
            </Typography>
          </Box>
        </Stack>

        {onCreateTask ? (
          <Button
            disableElevation
            onClick={onCreateTask}
            startIcon={<AddRoundedIcon />}
            type="button"
            variant="contained"
            sx={{ flex: '0 0 auto' }}
          >
            添加任务
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}
