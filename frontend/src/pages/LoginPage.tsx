import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Grid, Alert, Stack, IconButton } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';
import { useTranslation } from '../i18n/translations';
import LanguageSelector from '../components/LanguageSelector';
import { useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';

// Icons
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

interface LoginPageProps {
  defaultSignUp?: boolean;
}

export default function LoginPage({ defaultSignUp = false }: LoginPageProps) {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Sliding state
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Sync state with location path
  useEffect(() => {
    if (location.pathname === '/registre') {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  // Sign Up State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailRegister, setEmailRegister] = useState('');
  const [passwordRegister, setPasswordRegister] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    
    // Client-side validation
    if (!email.trim() || !password.trim()) {
      setSignInError('Veuillez remplir tous les champs.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setSignInError('Format de l\'adresse e-mail invalide.');
      return;
    }

    setSignInLoading(true);

    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, ...userData } = response.data;
      login(userData, token);
      
      if (userData.role === 'ROLE_CLIENT' && userData.kycStatus === 'PENDING') {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setSignInError(
        err.response?.data?.message || t('error')
      );
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');
    setSignUpSuccess('');
    
    // Client-side validation
    if (!firstName.trim() || !lastName.trim() || !emailRegister.trim() || !passwordRegister.trim()) {
      setSignUpError('Veuillez remplir tous les champs.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRegister.trim())) {
      setSignUpError('Format de l\'adresse e-mail invalide.');
      return;
    }
    if (passwordRegister.length < 6) {
      setSignUpError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setSignUpLoading(true);

    try {
      await api.post('/api/auth/register', {
        nom: lastName,
        prenom: firstName,
        email: emailRegister,
        password: passwordRegister,
        role: 'client'
      });
      setSignUpSuccess(t('success') + ' ! Redirection...');
      
      // Auto-toggle to Login state after successful sign up
      setTimeout(() => {
        setSignUpSuccess('');
        setEmail(emailRegister);
        setPassword('');
        navigate('/login');
      }, 2200);
    } catch (err: any) {
      setSignUpError(err.response?.data?.message || t('error'));
    } finally {
      setSignUpLoading(false);
    }
  };

  const toggleToSignUp = () => {
    navigate('/registre');
  };

  const toggleToSignIn = () => {
    navigate('/login');
  };

  return (
    <Box className={`auth-wrapper ${isSignUp ? 'sign-up-active' : ''}`}>
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

      {/* Auth sliding container */}
      <Box className={`auth-card ${isSignUp ? 'sign-up-active' : (isFirstRender ? '' : 'sign-in-active')}`}>
        
        {/* 1. SIGN IN FORM CONTAINER */}
        <Box className="auth-form-wrapper sign-in-wrapper">
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Logo size="medium" />
            </Link>
          </Box>
          
          <Typography variant="h4" color="text.primary" sx={{ letterSpacing: '-0.02em', mb: 1, fontWeight: 800 }}>
            {t('loginTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4.5 }}>
            {t('loginSub')}
          </Typography>

          {signInError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '5px', bgcolor: 'rgba(239, 68, 68, 0.05)', color: 'error.main', border: '1px solid rgba(239,68,68,0.2)' }}>
              {signInError}
            </Alert>
          )}

          <form onSubmit={handleSignIn} noValidate>
            <Stack spacing={2.5}>
              <TextField
                required
                fullWidth
                id="email"
                label={t('emailLabel')}
                name="email"
                autoComplete="email"
                autoFocus={!isSignUp}
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                <Link to="/forgot-password" className="auth-link">
                  Mot de passe oublié ?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={signInLoading}
                sx={{ py: 1.5, mt: 1 }}
              >
                {signInLoading ? t('loggingIn') : t('loginBtn')}
              </Button>
            </Stack>
          </form>

          <Typography align="center" variant="body2" sx={{ mt: 4, display: { xs: 'block', md: 'none' }, color: 'text.secondary' }}>
            {t('newToBank')}{' '}
            <span onClick={toggleToSignUp} className="auth-toggle-link">
              {t('createAccount')}
            </span>
          </Typography>
        </Box>

        {/* 2. SIGN UP FORM CONTAINER */}
        <Box className="auth-form-wrapper sign-up-wrapper">
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Logo size="medium" />
            </Link>
          </Box>

          <Typography variant="h4" color="text.primary" sx={{ letterSpacing: '-0.02em', mb: 1, fontWeight: 800 }}>
            {t('registerTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
            {t('registerSub')}
          </Typography>

          {signUpError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '5px', bgcolor: 'rgba(239, 68, 68, 0.05)', color: 'error.main', border: '1px solid rgba(239,68,68,0.2)' }}>
              {signUpError}
            </Alert>
          )}
          {signUpSuccess && (
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: '5px', bgcolor: 'rgba(16, 185, 129, 0.05)', color: 'success.main', border: '1px solid rgba(16,185,129,0.2)' }}>
              {signUpSuccess}
            </Alert>
          )}

          <form onSubmit={handleSignUp} noValidate>
            <Stack spacing={2.2}>
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
                id="emailRegister"
                label={t('emailLabel')}
                name="emailRegister"
                autoComplete="email"
                value={emailRegister}
                onChange={(e) => setEmailRegister(e.target.value)}
              />
              <TextField
                required
                fullWidth
                name="passwordRegister"
                label={t('passwordLabel')}
                type="password"
                id="passwordRegister"
                autoComplete="new-password"
                value={passwordRegister}
                onChange={(e) => setPasswordRegister(e.target.value)}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={signUpLoading}
                sx={{ py: 1.5, mt: 1 }}
              >
                {signUpLoading ? t('registering') : t('registerBtn')}
              </Button>
            </Stack>
          </form>

          <Typography align="center" variant="body2" sx={{ mt: 3, display: { xs: 'block', md: 'none' }, color: 'text.secondary' }}>
            {t('alreadyHaveAccount')}{' '}
            <span onClick={toggleToSignIn} className="auth-toggle-link">
              {t('connect')}
            </span>
          </Typography>
        </Box>

        {/* 3. SLIDING OVERLAY CONTAINER */}
        <Box className="auth-overlay-container" sx={{ display: { xs: 'none', md: 'block' } }}>
          <Box className="auth-overlay">
            {/* Dynamic rotating background layer */}
            <div className="auth-overlay-bg"></div>
            
            {/* Left Overlay panel (displays when Sign Up is active, guides to Sign In) */}
            <Box className="overlay-panel overlay-left">
              <Typography variant="h4" color="white" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                Ravi de vous revoir !
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, maxWidth: 320 }}>
                Pour rester connecté avec nous, veuillez vous connecter avec vos identifiants personnels.
              </Typography>
              <Button
                onClick={toggleToSignIn}
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

            {/* Right Overlay panel (displays when Sign In is active, guides to Sign Up) */}
            <Box className="overlay-panel overlay-right">
              <Typography variant="h4" color="white" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                Bienvenue !
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, maxWidth: 320 }}>
                Entrez vos données personnelles et commencez votre voyage bancaire sécurisé avec nous.
              </Typography>
              <Button
                onClick={toggleToSignUp}
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
                {t('createAccount')}
              </Button>
            </Box>

          </Box>
        </Box>

      </Box>
    </Box>
  );
}
