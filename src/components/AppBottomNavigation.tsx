import { Box, ButtonBase, Paper, Typography } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <Box
      aria-label={t('navigation.primary')}
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
        sx={(theme) => ({
          backdropFilter: 'blur(22px) saturate(1.2)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.88))',
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.12),
          borderRadius: { xs: 3, md: 999 },
          boxShadow: {
            xs: `0 -14px 36px ${alpha(theme.palette.grey[900], 0.12)}`,
            md: `0 18px 54px ${alpha(theme.palette.grey[900], 0.16)}`,
          },
          maxWidth: { xs: 430, md: 'none' },
          minWidth: { md: 276 },
          overflow: 'hidden',
          p: 0.5,
          pointerEvents: 'auto',
          position: 'relative',
          width: { xs: '100%', md: 'auto' },
        })}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 0.5,
            gridTemplateColumns: `repeat(${appNavigationItems.length}, minmax(0, 1fr))`,
          }}
        >
          {appNavigationItems.map((item) => {
            const Icon = navigationIcons[item.id];
            const selected = item.id === activePage;

            return (
              <ButtonBase
                key={item.id}
                aria-current={selected ? 'page' : undefined}
                onClick={() => onPageChange(item.id)}
                sx={(theme) => ({
                  alignItems: 'center',
                  borderRadius: { xs: 2.5, md: 999 },
                  color: selected ? 'primary.main' : 'text.secondary',
                  display: 'flex',
                  gap: { xs: 0.75, md: 0.85 },
                  justifyContent: 'center',
                  minHeight: { xs: 54, md: 48 },
                  minWidth: { xs: 0, md: 126 },
                  overflow: 'hidden',
                  px: { xs: 1.25, md: 1.75 },
                  position: 'relative',
                  transition:
                    'color 180ms ease, transform 180ms ease, background-color 180ms ease',
                  '&::before': {
                    background: selected
                      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(
                          theme.palette.secondary.main,
                          0.1,
                        )})`
                      : 'transparent',
                    border: selected ? `1px solid ${alpha(theme.palette.primary.main, 0.13)}` : '1px solid transparent',
                    borderRadius: 'inherit',
                    content: '""',
                    inset: 0,
                    position: 'absolute',
                    transition: 'background 180ms ease, border-color 180ms ease',
                  },
                  '&:hover': {
                    bgcolor: selected ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
                    color: selected ? 'primary.main' : 'text.primary',
                    transform: { xs: 'none', md: 'translateY(-1px)' },
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                })}
              >
                <Box
                  sx={(theme) => ({
                    alignItems: 'center',
                    bgcolor: selected ? 'primary.main' : alpha(theme.palette.grey[500], 0.1),
                    borderRadius: 999,
                    color: selected ? 'primary.contrastText' : 'text.secondary',
                    display: 'inline-flex',
                    flex: '0 0 auto',
                    height: { xs: 30, md: 28 },
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'background-color 180ms ease, color 180ms ease, box-shadow 180ms ease',
                    width: { xs: 30, md: 28 },
                    zIndex: 1,
                    ...(selected
                      ? {
                          boxShadow: `0 10px 22px ${alpha(theme.palette.primary.main, 0.28)}`,
                        }
                      : null),
                  })}
                >
                  <Icon sx={{ fontSize: 19 }} />
                </Box>
                <Typography
                  component="span"
                  sx={{
                    fontSize: 12,
                    fontWeight: selected ? 900 : 800,
                    letterSpacing: 0,
                    lineHeight: 1,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {t(`navigation.${item.id}`)}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
