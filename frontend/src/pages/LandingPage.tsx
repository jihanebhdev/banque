import React from 'react';
import { Box, Button, Typography, Stack, Grid, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import { useTranslation } from '../i18n/translations';
import LanguageSelector from '../components/LanguageSelector';
import { useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';
import IconButton from '@mui/material/IconButton';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

export default function LandingPage() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)';
  const innerBg = isDark ? 'rgba(5, 11, 20, 0.4)' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const mainBg = isDark ? '#020617' : '#F8FAFC';
  const { t } = useTranslation();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: mainBg, 
      color: 'text.primary',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      
      {/* Background Glowing Effects */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 2462,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: '20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,232,255,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Header / Navbar */}
      <Box sx={{ 
        px: { xs: 3, md: 8 },
        py: 2.5, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        
        backdropFilter: 'blur(10px)',
        zIndex: 10,
        position: 'sticky',
        top: 0,
        bgcolor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Logo onDarkBg={isDark} />
        <Stack direction="row" spacing={3} sx={{alignItems: 'center'}}>
          <LanguageSelector />
          <IconButton onClick={toggleTheme} sx={{ color: 'primary.main' }}>
            {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
          </IconButton>
          <Button component={Link} to="/login" sx={{ color: 'text.secondary', fontWeight: 600, '&:hover': { color: 'primary.main' } }}>
            {t('connect')}
          </Button>
          <Button component={Link} to="/registre" variant="contained" sx={{ bgcolor: 'primary.main', color: isDark ? '#000000' : '#FFFFFF', px: 3, '&:hover': { bgcolor: isDark ? '#3B82F6' : '#3B82F6' } }}>
            {t('register')}
          </Button>
        </Stack>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ pt: { xs: 8, md: 14 }, pb: { xs: 8, md: 12 }, zIndex: 2 }}>
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          <Grid size={{xs: 12, lg: 6.5}}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2.5, py: 1, bgcolor: 'rgba(59, 130, 2462,0.1)', border: '1px solid rgba(84, 227, 255, 0.15)', color: '#54E3FF', borderRadius: '5px', mb: 4, fontWeight: 700, fontSize: '0.85rem' }}>
              <FlashOnRoundedIcon sx={{ fontSize: 16 }} /> {t('heroFeatureTag')}
            </Box>
            <Typography variant="h1" sx={{ color: 'text.primary', mb: 3, fontWeight: 900, lineHeight: 1.1, fontSize: { xs: '3rem', sm: '4rem', md: '4.8rem' }, letterSpacing: '-0.04em' }}>
              {t('landingTitle')}
            </Typography>
            <Typography variant="body1" sx={{ mb: 5, fontSize: '1.2rem', color: 'text.secondary', maxWidth: '540px', lineHeight: 1.6 }}>
               {t('landingSub')}
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <Button component={Link} to="/registre" variant="contained" size="large" sx={{ py: 1.8, px: 4, fontSize: '1.05rem', bgcolor: 'primary.main', color: isDark ? '#000000' : '#FFFFFF', '&:hover': { bgcolor: isDark ? '#3B82F6' : '#3B82F6' } }} endIcon={<ArrowForwardRoundedIcon />}>
                {t('heroButton')}
              </Button>
              <Button component={Link} to="/login" variant="outlined" size="large" sx={{ py: 1.8, px: 4, fontSize: '1.05rem', color: 'primary.main', borderColor: 'primary.main', '&:hover': { borderColor: isDark ? '#3B82F6' : '#3B82F6', bgcolor: isDark ? 'rgba(59, 130, 2462,0.05)' : 'rgba(84, 227, 255, 0.05)' } }}>
                {t('connect')}
              </Button>
            </Stack>
          </Grid>
          
          <Grid size={{xs: 12, lg: 5.5}}>
            {/* Elegant Floating App Interface Graphic */}
            <Box sx={{ 
              position: 'relative',
              width: '100%',
              display: { xs: 'none', lg: 'block' }
            }}>
              {/* Premium Dark Glassmorphism Card */}
              <Box sx={{ 
                bgcolor: 'background.paper', 
                borderRadius: '5px', 
                border: '1px solid rgba(84, 227, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                p: 4.5, 
                boxShadow: 'none',
                width: '100%',
                maxWidth: 520,
                ml: 'auto',
                position: 'relative',
                zIndex: 2
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="body2" color="#B8C4CC" sx={{fontWeight: 700, letterSpacing: 1}}>SOLDE CONSOLIDÉ</Typography>
                  <Logo onDarkBg={isDark} size="small" />
                </Box>
                
                <Typography variant="h3" sx={{mb: 1, letterSpacing: '-0.02em', color: 'text.primary', fontWeight: 900}}>$3,567.37</Typography>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700, bgcolor: 'rgba(16,185,129,0.1)', display: 'inline-block', px: 1.5, py: 0.5, borderRadius: '5px' }}>
                  + 26% ce mois
                </Typography>

                {/* Simulated Credit Card inside hero */}
                <Box sx={{ 
                  mt: 5, 
                  height: 180, 
                  borderRadius: '5px', 
                  background: isDark ? 'linear-gradient(135deg, #07111F 0%, #54E3FF 100%)' : 'linear-gradient(135deg, #F1F5F9 0%, #54E3FF 100%)',
                  border: '1px solid rgba(84, 227, 255, 0.2)',
                  p: 3, 
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'none'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography sx={{color: '#FFFFFF', fontWeight: 800, fontStyle: 'italic'}}>Banque</Typography>
                    <Typography color="#54E3FF" sx={{fontWeight: 800, fontStyle: 'italic'}}>VISA</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{color: '#FFFFFF', fontWeight: 700, letterSpacing: 3}}>•••• •••• •••• 7896</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>PREMIUM MEMBER</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Grid of Key Features */}
      <Box sx={{ bgcolor: 'background.paper', py: 10, borderTop: `1px solid ${borderColor}` }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {[
              { icon: <SecurityRoundedIcon sx={{ color: '#54E3FF', fontSize: 32 }} />, title: t('feature1Title'), desc: t('feature1Desc') },
              { icon: <FlashOnRoundedIcon sx={{ color: '#54E3FF', fontSize: 32 }} />, title: t('feature2Title'), desc: t('feature2Desc') },
              { icon: <AccountBalanceRoundedIcon sx={{ color: '#54E3FF', fontSize: 32 }} />, title: t('feature3Title'), desc: t('feature3Desc') }
            ].map((feature, idx) => (
              <Grid key={idx} size={{xs: 12, md: 4}}>
                <Box sx={{ p: 4, borderRadius: '5px', bgcolor: mainBg, height: '100%', boxShadow: 'none' }}>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" color="text.primary" sx={{fontWeight: 700, mb: 1}}>{feature.title}</Typography>
                  <Typography variant="body2" color="#B8C4CC" sx={{ lineHeight: 1.6 }}>{feature.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

    </Box>
  );
}
