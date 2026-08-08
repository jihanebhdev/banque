import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Stack, Alert, Paper } from '@mui/material';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import api from '../api/axiosConfig';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from '../i18n/translations';

export default function ResetPasswordPage() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)';
  const mainBg = isDark ? '#020617' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError(t('resetError') || 'Jeton de réinitialisation de mot de passe manquant dans le lien.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess('');

    if (!token) {
      setError(t('resetError') || 'Jeton de réinitialisation de mot de passe manquant.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordMismatch') || 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/auth/reset-password', {
        token: token.trim(),
        password: password
      });
      setSuccess(res.data.message || t('resetSuccess'));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('error') || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      bgcolor: mainBg, 
      alignItems: 'center', 
      justifyContent: 'center',
      px: 3,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glowing Effects */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 2462,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
      
      <Paper elevation={1} sx={{ 
        width: '100%', 
        maxWidth: 450, 
        p: { xs: 4, sm: 6 }, 
        borderRadius: '5px',
        bgcolor: 'background.paper',
        zIndex: 2,
        boxShadow: 'none'
      }}>
        <Stack spacing={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Logo onDarkBg={isDark} />
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 3, textAlign: 'center', color: 'text.primary' }}>
              {t('resetPasswordTitle') || 'Nouveau mot de passe'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {t('resetPasswordSub') || 'Choisissez un mot de passe sécurisé pour votre compte.'}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: '5px' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: '5px' }}>{success}</Alert>}

          {!success && token && (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={3}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label={t('newPasswordLabel') || 'Nouveau mot de passe'}
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label={t('confirmPasswordLabel') || 'Confirmer le nouveau mot de passe'}
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, bgcolor: '#54E3FF', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
                >
                  {loading ? t('resetting') : t('resetBtn')}
                </Button>
              </Stack>
            </Box>
          )}

          <Typography align="center" variant="body2">
            <Link to="/login" style={{ color: '#54E3FF', textDecoration: 'none', fontWeight: 600 }}>
              {t('backToLogin') || 'Retour à la page de connexion'}
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
