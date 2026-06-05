import { BottomNavigation, BottomNavigationAction, Box, Paper } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { appNavigationItems, type AppPage } from '../lib/appNavigation';

interface AppBottomNavigationProps {
  activePage: AppPage;
  onPageChange: (page: AppPage) => void;
}

const navigationIcons: Record<AppPage, typeof HomeRoundedIcon> = {
  home: HomeRoundedIcon,
  mine: PersonRoundedIcon,
};

export function AppBottomNavigation({ activePage, onPageChange }: AppBottomNavigationProps) {
  return (
    <Box
      aria-label="主导航"
      component="nav"
      sx={{
        bottom: { xs: 0, md: 18 },
        display: 'flex',
        justifyContent: 'center',
        left: 0,
        pb: { xs: 'max(8px, env(safe-area-inset-bottom))', md: 0 },
        pointerEvents: 'none',
        position: 'fixed',
        px: { xs: 1.25, md: 0 },
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          backdropFilter: 'blur(18px)',
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          border: 1,
          borderColor: 'divider',
          borderRadius: { xs: 3, md: 999 },
          boxShadow: {
            xs: '0 -10px 28px rgba(15, 23, 42, 0.10)',
            md: '0 18px 52px rgba(15, 23, 42, 0.16)',
          },
          maxWidth: { xs: 420, md: 'none' },
          minWidth: { md: 278 },
          overflow: 'hidden',
          pointerEvents: 'auto',
          width: { xs: '100%', md: 'auto' },
        }}
      >
        <BottomNavigation
          showLabels
          value={activePage}
          onChange={(_, value: AppPage) => onPageChange(value)}
          sx={{
            bgcolor: 'transparent',
            height: { xs: 58, md: 52 },
            px: { xs: 0.5, md: 0.75 },
            '& .MuiBottomNavigationAction-root': {
              borderRadius: { xs: 2, md: 999 },
              color: 'text.secondary',
              gap: 0.25,
              minWidth: { xs: 0, md: 112 },
              mx: { xs: 0.25, md: 0.5 },
              px: { xs: 1, md: 1.75 },
              transition: 'background-color 160ms ease, color 160ms ease, transform 160ms ease',
            },
            '& .MuiBottomNavigationAction-root.Mui-selected': {
              bgcolor: 'rgba(29, 78, 216, 0.10)',
              color: 'primary.main',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0,
            },
          }}
        >
          {appNavigationItems.map((item) => {
            const Icon = navigationIcons[item.id];

            return <BottomNavigationAction key={item.id} icon={<Icon />} label={item.label} value={item.id} />;
          })}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
