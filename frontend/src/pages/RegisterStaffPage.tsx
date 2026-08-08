import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Grid, Alert, Stack, MenuItem, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import Logo from '../components/Logo';
import { useTranslation } from '../i18n/translations';
import LanguageSelector from '../components/LanguageSelector';
import { useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';

// Icons
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

export default function RegisterStaffPage() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employe');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Format de l\'adresse e-mail invalide.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/register', {
        nom: lastName,
        prenom: firstName,
        email: email,
        password: password,
        role: role
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
    <Box className="auth-wrapper">
      {/* Background geometric shapes */}
      <div className="auth-bg-shape auth-bg-shape-1"></div>
      <div className="auth-bg-shape auth-bg-shape-2"></div>

      {/* Floating Theme / Lang Toolbar */}
      <Box sx={{ position: 'absolute', top: 25, right: 30, zIndex: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
        <LanguageSelector />
        <IconButton onClick={toggleTheme} sx={{ color: 'primary.main', border: '1px solid var(--border)', bgcolor: 'var(--social-bg)', backdropFilter: 'blur(4px)' }}>
          {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Auth centered card - Taller height (680px) to accommodate extra fields + errors with generous padding */}
      <Box className="auth-card" sx={{ height: { xs: 'auto', md: '680px' } }}>
        
        {/* Left Side: Form Container */}
        <Box className="auth-form-wrapper" sx={{ left: 0, width: { xs: '100%', md: '50%' }, p: { xs: '20px 24px', md: '40px 60px' }, justifyContent: 'center' }}>
          <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'flex-start' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Logo size="medium" />
            </Link>
          </Box>
          
          <Typography color="text.primary" sx={{ fontSize: '1.75rem', letterSpacing: '-0.02em', mb: 0.8, fontWeight: 800, lineHeight: 1.2 }}>
            {t('staffRegisterTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.35 }}>
            {t('staffRegisterSub')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '5px', py: 0.5, bgcolor: 'rgba(239, 68, 68, 0.05)', color: 'error.main', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '5px', py: 0.5, bgcolor: 'rgba(16, 185, 129, 0.05)', color: 'success.main', border: '1px solid rgba(16,185,129,0.2)' }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
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
                <Grid size={{ xs: 6 }}>
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
              <TextField
                select
                fullWidth
                label={t('roleStaff')}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="employe">{t('roleEmploye')}</MenuItem>
                <MenuItem value="admin">{t('roleAdmin')}</MenuItem>
              </TextField>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, mt: 1 }}
              >
                {loading ? t('registering') : t('registerBtn')}
              </Button>
            </Stack>
          </form>

          <Typography align="center" variant="body2" sx={{ mt: 3, display: { xs: 'block', md: 'none' }, color: 'text.secondary' }}>
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="auth-toggle-link" style={{ textDecoration: 'none' }}>
              {t('connect')}
            </Link>
          </Typography>
        </Box>

        {/* Right Side: Welcome Static Overlay Panel */}
        <Box className="auth-overlay-container" sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box className="auth-overlay" sx={{ left: '-480px !important' }}>
            {/* Overlay background layer */}
            <div className="auth-overlay-bg"></div>
            
            <Box className="overlay-panel overlay-right" sx={{ pl: { md: 9, lg: 11 }, pr: { md: 4, lg: 5 } }}>
              <Typography variant="h4" color="white" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                Espace Collaborateurs
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, maxWidth: 320 }}>
                Créez votre compte professionnel pour accéder à l'interface d'administration et de gestion des clients.
              </Typography>
              <Button
                onClick={() => navigate('/login')}
                variant="outlined"
                sx={{
                  color: '#FFFFFF',
                  borderColor: '#FFFFFF',
                  px: 4,
                  py: 1,
                  fontWeight: 700,
                  '&:hover': {
                    borderColor: 'var(--accent)',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {t('connect')}
              </Button>
            </Box>
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
