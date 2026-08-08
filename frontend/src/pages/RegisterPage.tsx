import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Grid, Alert, Stack } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Logo from '../components/Logo';
import { useTranslation } from '../i18n/translations';
import LanguageSelector from '../components/LanguageSelector';
import { useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';

export default function RegisterPage() {
  const theme = useTheme();
  const { mode } = useThemeStore();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/api/auth/register', {
        nom: lastName,
        prenom: firstName,
        email: email,
        password: password,
        role: 'client'
      });
      setSuccess(t('success') + ' ! Redirection...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#000000', color: '#FFFFFF' }}>
      
      {/* Left side: Form */}
      <Box sx={{ 
        flex: { xs: '1 1 100%', md: '0 0 50%', lg: '0 0 45%' }, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        p: { xs: 4, sm: 6, md: 8 },
        borderRight: '1px solid rgba(84, 227, 255, 0.08)'
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size="medium" />
          </Link>
          <LanguageSelector />
        </Box>

        {/* Form Container */}
        <Box sx={{ maxWidth: 380, width: '100%', mx: 'auto', my: 'auto' }}>
          <Typography variant="h4" color="text.primary" gutterBottom sx={{letterSpacing: '-0.02em', mb: 1, fontWeight: 800}}>
            {t('registerTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {t('registerSub')}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '5px', bgcolor: 'rgba(239, 68, 68, 0.05)', color: 'error.main', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '5px', bgcolor: 'rgba(16, 185, 129, 0.05)', color: 'success.main', border: '1px solid rgba(16,185,129,0.2)' }}>{success}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{xs: 6}}>
                  <TextField
                    required
                    fullWidth
                    id="firstName"
                    label={t('firstName')}
                    name="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Grid>
                <Grid size={{xs: 6}}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label={t('lastName')}
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </Grid>
              </Grid>
              <TextField
                required
                fullWidth
                id="email"
                label={t('emailLabel')}
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                required
                fullWidth
                name="password"
                label={t('passwordLabel')}
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, mt: 1, bgcolor: '#54E3FF', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
              >
                {loading ? t('registering') : t('registerBtn')}
              </Button>
            </Stack>
          </form>

          <Typography align="center" variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" style={{ color: '#54E3FF', textDecoration: 'none', fontWeight: 600 }}>
              {t('connect')}
            </Link>
          </Typography>
        </Box>

        {/* Footer */}
        <Box>
          <Typography variant="caption" color="text.secondary">
            © 2026 Banque. Tous droits réservés.
          </Typography>
        </Box>
      </Box>

      {/* Right side: Aesthetic background with mock credit card */}
      <Box sx={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #07111F 0%, #54E3FF 100%)',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        p: 6
      }}>
        {/* Soft glowing mesh circles */}
        <Box sx={{ position: 'absolute', top: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,232,255,0.15) 0%, transparent 70%)' }} />
        <Box sx={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 2462,0.1) 0%, transparent 70%)' }} />

        {/* Realistic Card Mockup */}
        <Box sx={{ 
          width: 380, 
          height: 240, 
          background: 'linear-gradient(135deg, rgba(7,17,31,0.9) 0%, rgba(0,0,0,0.9) 100%)',
          border: '1px solid rgba(84, 227, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '5px',
          p: 4,
          color: 'white',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          mb: 4,
          transform: 'rotate(-5deg)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" color="#54E3FF" sx={{fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em'}}>Banque</Typography>
            <Typography color="#54E3FF" sx={{fontWeight: 800, fontStyle: 'italic'}}>VISA</Typography>
          </Box>
          <Box>
            <Typography variant="h5" sx={{fontWeight: 700, mb: 1, letterSpacing: 3}}>•••• •••• •••• 7896</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary' }}>PREMIUM CLIENT</Typography>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>07/28</Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="h4" color="white" align="center" sx={{maxWidth: 440, letterSpacing: '-0.02em', mb: 2, fontWeight: 800}}>
          {t('heroFeatureTag')}
        </Typography>
        <Typography variant="body1" color="rgba(255,255,255,0.7)" align="center" sx={{ maxWidth: 400 }}>
          {t('heroFeatureDesc')}
        </Typography>
      </Box>

    </Box>
  );
}
