import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, Checkbox, FormControlLabel, Paper, Stack, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosConfig';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import BorderColorRoundedIcon from '@mui/icons-material/BorderColorRounded';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import { useConfigStore } from '../store/configStore';

export default function ContractSigningPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { bankName } = useConfigStore();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const checkContractStatus = async () => {
    setRefreshing(true);
    setError('');
    try {
      const res = await api.get('/api/auth/me');
      updateUser({
        contratGenere: res.data.contratGenere,
        contratSigne: res.data.contratSigne,
        contratContenu: res.data.contratContenu,
        opensignEnvelopeId: res.data.opensignEnvelopeId,
        opensignSigningUrl: res.data.opensignSigningUrl
      });
      if (res.data.contratGenere) {
        if (res.data.contratSigne) {
          setSuccess('Votre contrat a été signé avec succès !');
        } else {
          setSuccess('Votre contrat est prêt ! Veuillez le signer via la plateforme OpenSign.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Impossible de rafraîchir le statut. Veuillez réessayer.');
    } finally {
      setRefreshing(false);
    }
  };

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const innerBg = isDark ? 'rgba(5, 11, 20, 0.4)' : '#F8FAFC';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.75)';
  const mainBg = isDark ? 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Setup drawing canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on container
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = (rect?.width || 500) - 32; // padding offset
      canvas.height = 200;
      
      // Draw signature line/guide
      clearCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isDark]);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // For touch devices
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    // For mouse clicks
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isDark ? '#54E3FF' : '#0F172A'; // Neon blue styling on dark, dark slate on light
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw guide line
    ctx.beginPath();
    ctx.strokeStyle = isDark ? 'rgba(84, 227, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.moveTo(30, canvas.height - 40);
    ctx.lineTo(canvas.width - 30, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
    
    // Draw "X" placeholder
    ctx.fillStyle = isDark ? 'rgba(84, 227, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
    ctx.font = '16px Outfit, sans-serif';
    ctx.fillText('X', 40, canvas.height - 48);

    setHasSigned(false);
  };

  const handleSignContract = async () => {
    if (!accepted) {
      setError('Veuillez accepter les termes du contrat avant de signer.');
      return;
    }
    if (!hasSigned) {
      setError('Veuillez apposer votre signature sur le pad.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    setError('');
    
    try {
      const signatureBase64 = canvas.toDataURL('image/png');
      const res = await api.post('/api/auth/sign-contract', { signatureBase64 });
      
      setSuccess(res.data.message || 'Contrat signé avec succès !');
      
      // Update local storage and Zustand auth store
      updateUser({ contratSigne: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la signature du contrat.');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.contratGenere) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: mainBg,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glows */}
        {isDark && (
          <>
            <Box className="liquid-blur-1" />
            <Box className="liquid-blur-2" />
          </>
        )}

        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: '550px',
            p: { xs: 4, sm: 5 },
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            background: cardBg,
            backdropFilter: 'blur(20px)',
            position: 'relative',
            zIndex: 5,
            textAlign: 'center'
          }}
        >
          <Stack spacing={4} sx={{ alignItems: 'center' }}>
            <Box sx={{ 
              width: 80, height: 80, borderRadius: '50%', 
              bgcolor: isDark ? 'rgba(84, 227, 255, 0.08)' : 'rgba(59, 130, 246, 0.1)', 
              color: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <HourglassEmptyRoundedIcon sx={{ fontSize: 40 }} />
            </Box>

            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.03em' }}>
                Préparation du contrat
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, px: 2 }}>
                Félicitations ! Votre dossier KYC a été approuvé avec succès par nos services de conformité.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, px: 2 }}>
                Votre conseiller prépare actuellement votre contrat personnalisé d'ouverture de compte. Vous pourrez le signer ici dès qu'il sera prêt.
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ borderRadius: '5px', width: '100%' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ borderRadius: '5px', width: '100%' }}>{success}</Alert>}

            <Stack direction="row" spacing={2} sx={{ width: '100%', mt: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={logout}
                sx={{ flex: 1, py: 1.2, textTransform: 'none' }}
              >
                Déconnexion
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={checkContractStatus}
                disabled={refreshing}
                startIcon={refreshing ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{
                  flex: 1,
                  py: 1.2,
                  textTransform: 'none',
                  color: '#000000',
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: '#3B82F6' }
                }}
              >
                {refreshing ? 'Vérification...' : 'Rafraîchir'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      background: mainBg,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glows */}
      {isDark && (
        <>
          <Box className="liquid-blur-1" />
          <Box className="liquid-blur-2" />
        </>
      )}

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: '750px',
          p: { xs: 3, sm: 5 },
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          background: cardBg,
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 5
        }}
      >
        <Stack spacing={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <BorderColorRoundedIcon sx={{ color: 'primary.main', fontSize: '2rem' }} /> Signature de votre Contrat
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Votre KYC a été validé ! Veuillez lire et signer votre contrat d'ouverture pour activer définitivement votre compte auprès de {bankName}.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: '5px' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: '5px' }}>{success}</Alert>}

          {/* Contract Content Scroll Box */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: '240px',
              overflowY: 'auto',
              bgcolor: isDark ? 'rgba(5, 11, 20, 0.5)' : '#F8FAFC',
              borderColor: borderColor,
              borderRadius: '5px'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-line',
                color: 'text.primary',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '0.85rem',
                lineHeight: 1.6
              }}
            >
              {user?.contratContenu || `CONTRAT D'OUVERTURE DE COMPTE DE DÉPÔT ET DE SERVICES BANCAIRES

              La banque ${bankName} d'une part, et M./Mme ${user?.nom?.toUpperCase()} ${user?.prenom} d'autre part.
              
              Article 1 : Objet du contrat
              Le présent contrat régit les relations entre le Client et la Banque pour les comptes ouverts auprès de ${bankName}.
              
              Article 2 : Fonctionnement du compte
              Le compte fonctionne sous forme de compte de dépôt à vue. Le solde du compte doit toujours être suffisant pour couvrir les opérations initiées.
              
              Article 3 : Signature électronique
              La signature manuscrite numérisée apposée par le Client vaut signature électronique au sens de la réglementation.`}
            </Typography>
          </Paper>

          {/* Accept Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                Je reconnais avoir pris connaissance du contrat et j'accepte sans réserve ses termes et conditions générales d'utilisation.
              </Typography>
            }
          />

          {/* Signature Canvas Box */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <BorderColorRoundedIcon fontSize="small" sx={{ color: 'primary.main' }} /> Apposez votre signature ci-dessous :
            </Typography>
            
            <Box
              sx={{
                border: `1px solid ${isDark ? 'rgba(84, 227, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)'}`,
                borderRadius: '5px',
                bgcolor: isDark ? 'rgba(5, 11, 20, 0.8)' : '#FFFFFF',
                position: 'relative',
                touchAction: 'none',
                overflow: 'hidden'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{
                  display: 'block',
                  cursor: 'crosshair',
                  width: '100%'
                }}
              />
            </Box>
            
            <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1.5 }}>
              <Button
                variant="text"
                color="inherit"
                size="small"
                startIcon={<DeleteSweepRoundedIcon />}
                onClick={clearCanvas}
                sx={{ textTransform: 'none', color: 'text.secondary' }}
              >
                Effacer le dessin
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                * Utilisez votre souris ou écran tactile pour signer.
              </Typography>
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mt: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={logout}
              sx={{ px: 4, py: 1.2, textTransform: 'none' }}
            >
              Déconnexion
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSignContract}
              disabled={loading || !accepted || !hasSigned}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleRoundedIcon />}
              sx={{
                px: 5,
                py: 1.2,
                textTransform: 'none',
                color: '#000000',
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: '#3B82F6' }
              }}
            >
              {loading ? 'Signature...' : 'Signer & Activer le compte'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
