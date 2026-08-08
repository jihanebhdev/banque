import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Button, Paper, Stack, CircularProgress, Alert, Checkbox, FormControlLabel } from '@mui/material';
import api from '../api/axiosConfig';
import DrawIcon from '@mui/icons-material/Draw';
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

export default function MockOpenSignPage() {
  const [searchParams] = useSearchParams();
  const envelopeId = searchParams.get('envelopeId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [contractContent, setContractContent] = useState('');
  const [fetchingContract, setFetchingContract] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Fetch contract content by envelopeId (or get from user/endpoint if needed)
  useEffect(() => {
    const fetchContract = async () => {
      if (!envelopeId) {
        setError('ID d\'enveloppe manquant.');
        setFetchingContract(false);
        return;
      }
      try {
        // We will call a public endpoint or search for client contract info
        // Wait, instead of creating a complex lookup, the webhook controller does it.
        // Can we get the contract content?
        // Since we know the client has the contract, can we load it?
        // Let's call a public endpoint or fetch it. We can add a simple public endpoint to fetch the contract text
        // or since it's a simulation, we can just show a default contract or fetch it from `/api/auth/opensign/contract-detail?envelopeId=...`
        // Let's make a call to a public endpoint we'll add on OpenSignController!
        const res = await api.post('/api/auth/opensign/complete', { envelopeId, checkOnly: 'true' });
        // Wait, let's check if the controller can return the contract.
        // Let's check what OpenSignController does.
        // In OpenSignController, we can return the contract when checking or complete it.
        // Let's create an endpoint GET /api/auth/opensign/contract/{envelopeId} to retrieve it!
        // That is extremely clean!
        const getRes = await api.get(`/api/auth/opensign/contract/${envelopeId}`);
        setContractContent(getRes.data.contratContenu || '');
      } catch (err: any) {
        console.error(err);
        setError('Impossible de charger le document à signer. L\'enveloppe est peut-être invalide.');
      } finally {
        setFetchingContract(false);
      }
    };
    fetchContract();
  }, [envelopeId]);

  // Setup drawing canvas
  useEffect(() => {
    if (fetchingContract || success || error) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = (rect?.width || 500) - 32;
      canvas.height = 180;
      clearCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [fetchingContract, success, error]);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
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
    ctx.strokeStyle = '#0F172A';
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
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.moveTo(30, canvas.height - 40);
    ctx.lineTo(canvas.width - 30, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.font = '16px sans-serif';
    ctx.fillText('X', 40, canvas.height - 48);

    setHasSigned(false);
  };

  const handleSign = async () => {
    if (!accepted) {
      setError('Veuillez accepter les conditions.');
      return;
    }
    if (!hasSigned) {
      setError('Veuillez apposer votre signature.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    setError('');

    try {
      const signatureBase64 = canvas.toDataURL('image/png');
      // Trigger the webhook simulation
      await api.post('/api/auth/opensign/webhook', {
        envelopeId,
        event: 'envelope_signed',
        signatureBase64
      });
      
      // Update local storage user state directly since we are on the same domain
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.contratSigne = true;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Failed to update local storage user', e);
      }

      setSuccess(true);
    } catch (err: any) {
      setError('Erreur lors de la communication de la signature.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingContract) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#F8FAFC' }}>
        <CircularProgress color="success" />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>
          Chargement sécurisé d'OpenSign Labs...
        </Typography>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#F8FAFC', p: 3 }}>
        <Paper elevation={3} sx={{ maxWidth: 500, width: '100%', p: 5, borderRadius: '8px', textAlign: 'center' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#E6F4EA', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 45 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#137333', mb: 2 }}>
            Document Signé !
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            Félicitations, votre contrat d'ouverture de compte a été légalement signé et crypté via la plateforme certifiée OpenSign Labs.
          </Typography>
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={() => window.location.href = 'http://localhost:3000/'}
            sx={{ py: 1.5, fontWeight: 'bold', textTransform: 'none' }}
          >
            Retourner au portail bancaire
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ height: 64, bgcolor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 4, color: '#FFFFFF' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ bgcolor: '#10B981', color: 'white', px: 1.5, py: 0.5, borderRadius: '4px', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
            OpenSign
          </Box>
          <Typography variant="subtitle2" sx={{ opacity: 0.7, fontSize: '0.8rem', display: { xs: 'none', sm: 'block' } }}>
            Labs • Secure signing workspace
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', opacity: 0.8 }}>
          Enveloppe : {envelopeId?.substring(0, 18)}...
        </Typography>
      </Box>

      {/* Simulator bar */}
      <Box sx={{ bgcolor: '#FEF3C7', color: '#92400E', py: 1, px: 4, textAlign: 'center', borderBottom: '1px solid #FCD34D' }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          ⚠️ SIMULATION OPENSIGN LABS — Ce portail simule l'intégration officielle OpenSign de votre banque.
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Paper elevation={2} sx={{ maxWidth: 750, width: '100%', p: { xs: 3, md: 5 }, borderRadius: '8px', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Signature requise du contrat d'ouverture
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Veuillez lire le document ci-dessous, accepter les termes et dessiner votre signature sur le pad.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            {/* Document Viewer */}
            <Paper variant="outlined" sx={{ p: 3, height: 250, overflowY: 'auto', bgcolor: '#F8FAFC', borderRadius: '4px' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>
                {contractContent || 'Chargement du contrat...'}
              </Typography>
            </Paper>

            <FormControlLabel
              control={<Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} color="success" />}
              label={
                <Typography variant="body2" color="text.primary">
                  Je consens à apposer ma signature électronique sur ce contrat certifié par OpenSign.
                </Typography>
              }
            />

            {/* Signature Area */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DrawIcon sx={{ color: '#10B981' }} /> Dessinez votre signature :
              </Typography>
              <Box sx={{ border: '1px solid #CBD5E1', borderRadius: '4px', bgcolor: '#FFFFFF', touchAction: 'none' }}>
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ display: 'block', cursor: 'crosshair', width: '100%' }}
                />
              </Box>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
                <Button
                  variant="text"
                  color="inherit"
                  size="small"
                  startIcon={<DeleteSweepRoundedIcon />}
                  onClick={clearCanvas}
                  sx={{ textTransform: 'none', color: 'text.secondary' }}
                >
                  Effacer
                </Button>
                <Typography variant="caption" color="text.secondary">
                  * Utilisez votre doigt ou votre souris.
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              onClick={handleSign}
              disabled={loading || !accepted || !hasSigned}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{ py: 1.5, fontWeight: 'bold', textTransform: 'none', bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
            >
              {loading ? 'Cryptage & Enregistrement...' : 'Valider la signature du contrat'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
