import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Stack, Alert, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import api from '../api/axiosConfig';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from '../i18n/translations';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)';
  const mainBg = isDark ? '#020617' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError(t('emailRequired') || 'Veuillez saisir votre adresse e-mail.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSuccess(res.data.message || t('success'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('error'));
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
              {t('forgotPasswordTitle') || 'Mot de passe oublié'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              {t('forgotPasswordSub') || 'Saisissez votre e-mail pour recevoir un lien de réinitialisation sécurisé.'}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: '5px' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: '5px' }}>{success}</Alert>}

          {!success && (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={3}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label={t('emailLabel') || 'Adresse e-mail'}
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, bgcolor: '#54E3FF', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
                >
                  {loading ? t('sendingLink') : t('sendLink')}
                </Button>
              </Stack>
            </Box>
          )}

          <Typography align="center" variant="body2" sx={{ mt: success ? 0 : 2 }}>
            <Link to="/login" style={{ color: '#54E3FF', textDecoration: 'none', fontWeight: 600 }}>
              {t('backToLogin') || 'Retour à la page de connexion'}
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
