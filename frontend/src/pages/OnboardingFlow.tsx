import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Grid, 
  Card, 
  CardActionArea, 
  CardContent, 
  InputAdornment, 
  Alert, 
  Stack, 
  CircularProgress,
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  LinearProgress,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import api from '../api/axiosConfig';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';
import { useTranslation } from '../i18n/translations';
import LanguageSelector from '../components/LanguageSelector';
import { useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';

// Icons
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';

export default function OnboardingFlow() {
  const theme = useTheme();
  const { mode } = useThemeStore();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)';
  const innerBg = isDark ? 'rgba(5, 11, 20, 0.4)' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const mainBg = isDark ? '#020617' : '#F8FAFC';
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const updateKycStatus = useAuthStore(state => state.updateKycStatus);
  const user = useAuthStore(state => state.user);

  // Form Data (Basic Profile)
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [dateNaissance, setDateNaissance] = useState(user?.dateNaissance || '');
  const [adresse, setAdresse] = useState(user?.adresse || '');

  // Form Data (Regulatory Phase 2)
  const [numeroPasseport, setNumeroPasseport] = useState(user?.numeroPasseport || '');
  const [dateDelivrance, setDateDelivrance] = useState(user?.dateDelivrance || '');
  const [numeroNif, setNumeroNif] = useState(user?.numeroNif || '');
  const [paysResidenceFiscale, setPaysResidenceFiscale] = useState(user?.paysResidenceFiscale || 'Maroc');
  const [profession, setProfession] = useState(user?.profession || '');
  const [trancheRevenus, setTrancheRevenus] = useState(user?.trancheRevenus || '');
  const [origineFonds, setOrigineFonds] = useState(user?.origineFonds || '');

  // Choice Setup
  const [devise, setDevise] = useState('MAD');
  const [typeCompte, setTypeCompte] = useState('STANDARD');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 2 OCR States
  const [documentType, setDocumentType] = useState('CNIE');
  const [idRecto, setIdRecto] = useState<File | null>(null);
  const [idVerso, setIdVerso] = useState<File | null>(null);
  const [proofAddress, setProofAddress] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrLogs, setOcrLogs] = useState<string[]>([]);
  const [ocrProgress, setOcrProgress] = useState(0);

  // OCR Extracted values
  const [extractedNom, setExtractedNom] = useState('');
  const [extractedPrenom, setExtractedPrenom] = useState('');
  const [extractedNumeroPasseport, setExtractedNumeroPasseport] = useState('');
  const [extractedDateNaissance, setExtractedDateNaissance] = useState('');
  const [extractedDateDelivrance, setExtractedDateDelivrance] = useState('');
  const [extractedAdresse, setExtractedAdresse] = useState('');

  const steps = [
    { label: t('onboardingStep1') || 'Profil & Fiscalité', desc: t('onboardingStep1Desc') || 'Informations personnelles & financières' },
    { label: 'Documents & OCR', desc: 'Scan intelligent des pièces' },
    { label: t('onboardingStep3') || 'Plan & Devise', desc: t('onboardingStep3Desc') || 'Choix de l\'offre & carte' }
  ];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const logout = useAuthStore(state => state.logout);

  const fileToBase64 = (file: File | null): Promise<string> => {
    return new Promise((resolve) => {
      if (!file) {
        resolve('');
        return;
      }
      
      // If the file is an image, compress it using canvas to reduce size before base64 conversion
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxWidth = 1200;
            const maxHeight = 1200;

            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(event.target?.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with 75% quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
            resolve(compressedBase64);
          };
          img.onerror = () => resolve(event.target?.result as string);
        };
        reader.onerror = () => resolve('');
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
      }
    });
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const idRectoData = await fileToBase64(idRecto);
      const idVersoData = await fileToBase64(idVerso);
      const proofAddressData = await fileToBase64(proofAddress);
      const selfieData = await fileToBase64(selfie);

      await api.post('/api/kyc/submit', {
        telephone,
        dateNaissance,
        adresse,
        numeroPasseport,
        dateDelivrance,
        numeroNif,
        paysResidenceFiscale,
        profession,
        trancheRevenus,
        origineFonds,
        devise,
        typeCompte,
        idRectoData,
        idVersoData,
        proofAddressData,
        selfieData,
        extractedNom,
        extractedPrenom,
        extractedNumeroPasseport,
        extractedDateNaissance,
        extractedDateDelivrance,
        extractedAdresse
      });
      
      // Update store user object with new fields so it shows immediately in the profile page
      if (user) {
        const updatedUser = {
          ...user,
          kycStatus: 'SUBMITTED',
          telephone,
          dateNaissance,
          adresse,
          numeroPasseport,
          dateDelivrance,
          numeroNif,
          paysResidenceFiscale,
          profession,
          trancheRevenus,
          origineFonds,
          idRectoData,
          idVersoData,
          proofAddressData,
          selfieData,
          extractedNom,
          extractedPrenom,
          extractedNumeroPasseport,
          extractedDateNaissance,
          extractedDateDelivrance,
          extractedAdresse
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        useAuthStore.setState({ user: updatedUser });
      }
      
      updateKycStatus('SUBMITTED');
    } catch (err: any) {
      setError(err.response?.data?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const startOcrScan = async () => {
    if (!idRecto) {
      setError('Veuillez déposer une pièce d\'identité (Recto) pour démarrer.');
      return;
    }
    if (!proofAddress) {
      setError('Veuillez déposer un justificatif de domicile pour démarrer.');
      return;
    }
    setError('');

    setOcrScanning(true);
    setOcrProgress(5);
    setOcrLogs(['Initialisation du moteur OCR local (Tesseract.js)...']);

    let worker: Tesseract.Worker | null = null;
    try {
      // 1. Initialize Tesseract worker
      worker = await Tesseract.createWorker(['eng', 'fra'], 1, {
        langPath: window.location.origin,
        gzip: false,
        logger: (m) => {
          if (m.status === 'recognizing text') {
            // ID scan takes 5% to 50%
            setOcrProgress(Math.round(5 + m.progress * 45));
            setOcrLogs([`Lecture de la pièce d'identité : ${Math.round(m.progress * 100)}%`]);
          }
        }
      });

      // 2. Scan ID Recto
      setOcrLogs(['Lecture de la pièce d\'identité (Recto)...']);
      const resultRecto = await worker.recognize(idRecto);
      const textRecto = resultRecto.data.text || '';
      console.log("ID Recto OCR Text:\n", textRecto);

      // 3. Scan Proof of Address
      setOcrLogs(['Lecture du justificatif de domicile (JDD)...']);
      await worker.reinitialize(['eng', 'fra'] as any);
      const resultAddress = await worker.recognize(proofAddress);
      const textAddress = resultAddress.data.text || '';
      console.log("JDD OCR Text:\n", textAddress);

      setOcrLogs(['Vérification de la concordance des données...']);
      setOcrProgress(95);

      // --- PARSING ID DOCUMENT ---
      const textRectoLower = textRecto.toLowerCase();
      
      // Extract Document/Card Number using regex
      const cnieRegex = /\b([A-Z]{1,2}[0-9]{5,7})\b/i;
      const passportRegex = /\b([A-Z0-9]{9})\b/i;
      
      let ocrDocNumber = '';
      const cnieMatch = textRecto.match(cnieRegex);
      const passportMatch = textRecto.match(passportRegex);
      const hasPassport = textRectoLower.includes('passport') || textRectoLower.includes('passeport') || textRectoLower.includes('pasp');

      if (hasPassport && passportMatch) {
        ocrDocNumber = passportMatch[1].toUpperCase();
      } else if (cnieMatch) {
        ocrDocNumber = cnieMatch[1].toUpperCase();
      } else if (passportMatch) {
        ocrDocNumber = passportMatch[1].toUpperCase();
      }

      // Check if document type is official
      const hasCnie = textRectoLower.includes('carte') || textRectoLower.includes('nationale') || textRectoLower.includes('identite') || textRectoLower.includes('identity') || textRectoLower.includes('cnie') || textRectoLower.includes('maroc') || textRectoLower.includes('royaume');

      if (!ocrDocNumber && !hasPassport && !hasCnie) {
        throw new Error("L'image de votre pièce d'identité est illisible ou n'est pas un document officiel valide (CNIE ou passeport). Veuillez fournir une photo nette.");
      }

      if (!ocrDocNumber) {
        throw new Error("Le numéro du document d'identité est introuvable. Veuillez utiliser une image plus nette.");
      }

      // Check Document Number match
      if (ocrDocNumber.toUpperCase().trim() !== numeroPasseport.toUpperCase().trim()) {
        throw new Error(`Le numéro du document extrait (${ocrDocNumber}) ne correspond pas au numéro saisi (${numeroPasseport}).`);
      }

      // Extract Birthdate (YYYY-MM-DD or DD/MM/YYYY)
      const dateRegex = /\b(\d{2}[\/\.-]\d{2}[\/\.-]\d{4}|\d{4}[\/\.-]\d{2}[\/\.-]\d{2})\b/;
      const dateMatches = textRecto.match(dateRegex);
      let ocrBirthdate = '';
      if (dateMatches) {
        ocrBirthdate = dateMatches[1].replace(/\./g, '-').replace(/\//g, '-');
        if (/^\d{2}-\d{2}-\d{4}$/.test(ocrBirthdate)) {
          const parts = ocrBirthdate.split('-');
          ocrBirthdate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      // Check Birthdate match
      if (!ocrBirthdate) {
        throw new Error("La date de naissance sur le document d'identité est introuvable ou illisible.");
      }

      if (ocrBirthdate !== dateNaissance) {
        throw new Error(`La date de naissance sur le document (${ocrBirthdate}) ne correspond pas à celle saisie (${dateNaissance}).`);
      }

      // Names Match (Fuzzy Check)
      const nomLower = (user?.nom || '').toLowerCase().trim();
      const prenomLower = (user?.prenom || '').toLowerCase().trim();
      
      const containsNom = textRectoLower.includes(nomLower);
      const containsPrenom = textRectoLower.includes(prenomLower);

      if (!containsNom || !containsPrenom) {
        throw new Error(`Le nom ou le prénom sur la pièce d'identité ne correspond pas à votre profil client (${user?.prenom} ${user?.nom}).`);
      }

      // --- VERIFYING PROOF OF ADDRESS (JDD) ---
      const textAddressLower = textAddress.toLowerCase();

      // Check that JDD contains client's name
      const jddContainsNom = textAddressLower.includes(nomLower);
      if (!jddContainsNom) {
        throw new Error("Le justificatif de domicile ne semble pas être à votre nom de famille.");
      }

      // Check JDD contains key parts of address
      const addressClean = adresse.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ");
      
      const addressWords = addressClean.split(' ')
        .filter(w => w.length > 3 && !['rue', 'boulevard', 'avenue', 'route', 'allee', 'residence', 'imm', 'immeuble', 'maroc', 'appartement', 'casablanca', 'rabat', 'tanger', 'fes'].includes(w));

      if (addressWords.length === 0) {
        throw new Error("Veuillez saisir une adresse postale plus détaillée (rue, numéro, quartier).");
      }

      const matchingWords = addressWords.filter(word => textAddressLower.includes(word));
      if (matchingWords.length === 0) {
        throw new Error("L'adresse figurant sur le justificatif de domicile ne correspond pas à l'adresse de résidence saisie.");
      }

      // Extract delivery date of ID if possible
      let ocrDelivrance = '';
      const allDates = textRecto.match(new RegExp(dateRegex, 'g'));
      if (allDates && allDates.length > 1) {
        for (let d of allDates) {
          let parsedD = d.replace(/\./g, '-').replace(/\//g, '-');
          if (/^\d{2}-\d{2}-\d{4}$/.test(parsedD)) {
            const parts = parsedD.split('-');
            parsedD = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          if (parsedD !== dateNaissance && parsedD !== ocrBirthdate) {
            ocrDelivrance = parsedD;
            break;
          }
        }
      }

      // Save OCR Extracted Values in state
      setExtractedNom(user?.nom || '');
      setExtractedPrenom(user?.prenom || '');
      setExtractedNumeroPasseport(ocrDocNumber);
      setExtractedDateNaissance(ocrBirthdate);
      setExtractedDateDelivrance(ocrDelivrance || dateDelivrance || '2020-01-01');
      setExtractedAdresse(adresse);

      setOcrProgress(100);
      setOcrLogs([`Vérification réussie ! Vos documents concordent avec vos saisies.`]);
      setOcrScanning(false);
      setOcrSuccess(true);
    } catch (err: any) {
      console.error('Tesseract Local OCR Error: ', err);
      setError(err.message || "Impossible de valider vos documents. Veuillez vous assurer que les images sont bien nettes et concordent avec les informations saisies.");
      setOcrScanning(false);
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const checkKycStatus = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/api/auth/me');
      if (res.data.kycStatus) {
        updateKycStatus(res.data.kycStatus);
      }
    } catch (err) {
      console.error('Error refreshing KYC status', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.kycStatus === 'SUBMITTED') {
      const interval = setInterval(() => {
        api.get('/api/auth/me')
          .then((res) => {
            if (res.data.kycStatus && res.data.kycStatus !== 'SUBMITTED') {
              updateKycStatus(res.data.kycStatus);
            }
          })
          .catch((err) => console.error('Error during auto refresh', err));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user?.kycStatus]);

  if (user?.kycStatus === 'SUBMITTED') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: mainBg, p: 4, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
          <LanguageSelector />
        </Box>
        <Card sx={{ maxWidth: 500, width: '100%', borderRadius: '5px', p: 5, textAlign: 'center', bgcolor: 'background.paper', boxShadow: 'none' }}>
          <Box sx={{ 
            width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(59, 130, 2462,0.1)', color: '#54E3FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 4}}>
            <VerifiedUserRoundedIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h4" gutterBottom sx={{letterSpacing: '-0.02em', color: 'text.primary', fontWeight: 800}}>
            {t('kycReviewTitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            {t('kycReviewDesc', { name: user.prenom })}
          </Typography>
          <Alert severity="info" sx={{ mb: 4, borderRadius: '5px', textAlign: 'left', bgcolor: 'rgba(59, 130, 2462,0.05)', color: '#54E3FF', border: '1px solid rgba(84, 227, 255, 0.15)' }}>
            {t('kycReviewAlert')}
          </Alert>
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={checkKycStatus} 
              disabled={refreshing}
              fullWidth 
              sx={{ py: 1.5, borderRadius: '5px', bgcolor: '#54E3FF', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
            >
              {refreshing ? t('kycStatusChecking') : t('kycRefreshBtn')}
            </Button>
            <Button variant="outlined" color="primary" onClick={logout} fullWidth sx={{ py: 1.5, borderRadius: '5px', borderColor: '#54E3FF', color: '#54E3FF', '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59, 130, 2462,0.05)' } }}>
              {t('logout')}
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  if (user?.kycStatus === 'REJECTED') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: mainBg, p: 4, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
          <LanguageSelector />
        </Box>
        <Card sx={{ maxWidth: 500, width: '100%', borderRadius: '5px', p: 5, textAlign: 'center', bgcolor: 'background.paper', border: `1px solid ${theme.palette.error.main}33`, boxShadow: 'none' }}>
          <Box sx={{ 
            width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.main',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 4
          }}>
            <PersonOutlineRoundedIcon sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h4" gutterBottom sx={{letterSpacing: '-0.02em', color: 'error.main', fontWeight: 800}}>
            {t('kycRejectedTitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            {t('kycRejectedDesc')}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" sx={{ flex: 1, py: 1.5, borderRadius: '5px', borderColor: '#54E3FF', color: '#54E3FF', '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59, 130, 2462,0.05)' } }} onClick={logout}>
              {t('logout')}
            </Button>
            <Button variant="contained" color="primary" sx={{ flex: 1, py: 1.5, borderRadius: '5px', bgcolor: '#54E3FF', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }} onClick={() => updateKycStatus('PENDING')}>
              {t('kycRestartBtn')}
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: mainBg, overflow: 'hidden' }}>
      
      {/* Left side: Guide & Steps Progress (Stripe-like) */}
      <Box sx={{ 
        flex: { xs: 'none', md: '0 0 35%', lg: '0 0 30%' }, 
        bgcolor: innerBg, 
        borderRight: '1px solid rgba(84, 227, 255, 0.12)',
        p: { xs: 4, lg: 6 },
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <Box>
          <Logo onDarkBg />
          
          <Stack spacing={4} sx={{ mt: 8 }}>
            {steps.map((step, idx) => {
              const isActive = idx === activeStep;
              const isCompleted = idx < activeStep;
              return (
                <Stack key={idx} direction="row" spacing={2} sx={{alignItems: 'flex-start'}}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: isCompleted ? '#10B981' : isActive ? '#54E3FF' : 'transparent',
                    border: isCompleted ? 'none' : isActive ? 'none' : '2px solid rgba(84, 227, 255, 0.2)',
                    color: isCompleted || isActive ? '#000000' : '#B8C4CC',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {isCompleted ? <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#FFFFFF' }} /> : idx + 1}
                  </Box>
                  <Box>
                    <Typography variant="body1" color={isActive ? '#54E3FF' : '#B8C4CC'} sx={{fontWeight: 700}}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.desc}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <LanguageSelector />
          <Typography variant="caption" color="text.secondary">
            {t('onboardingNeedHelp')}
          </Typography>
        </Box>
      </Box>

      {/* Right side: Active form block (Full-width / Edge-to-edge styling) */}
      <Box sx={{ 
        flex: 1, 
        p: { xs: 4, sm: 6, md: 8, lg: 10 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto'
      }}>
        {/* Mobile Header */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Logo onDarkBg size="small" />
          <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
            <LanguageSelector />
            <Typography variant="body2" color="text.secondary" sx={{fontWeight: 600}}>Étape {activeStep + 1} sur 3</Typography>
          </Stack>
        </Box>

        <Box sx={{ maxWidth: 640, width: '100%', mx: 'auto', my: 'auto' }}>
          
          {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '5px', bgcolor: 'rgba(239, 68, 68, 0.05)', color: 'error.main', border: `1px solid ${theme.palette.error.main}33` }}>{error}</Alert>}

          {/* Render Active Step Form Content */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h4" color="text.primary" sx={{letterSpacing: '-0.02em', mb: 1, fontWeight: 800}}>
                {t('profileSetup')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
                Complétez vos informations réglementaires et financières requises par les autorités bancaires.
              </Typography>
              
              <Grid container spacing={3}>
                {/* Basic Fields */}
                <Grid size={{xs: 12, sm: 6}}>
                  <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>{t('phoneLabel')}</Typography>
                  <TextField
                    required
                    fullWidth
                    placeholder="06 12 34 56 78"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">+212</InputAdornment>}
                    }}
                  />
                </Grid>
                <Grid size={{xs: 12, sm: 6}}>
                  <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>{t('birthdateLabel')}</Typography>
                  <TextField
                    required
                    fullWidth
                    type="date"
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                  />
                </Grid>
                <Grid size={{xs: 12}}>
                  <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>{t('addressLabel')}</Typography>
                  <TextField
                    required
                    fullWidth
                    placeholder="Ex: 45 Boulevard d'Anfa, Casablanca 20250"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                  />
                </Grid>

                <Grid size={{xs: 12}} sx={{ my: 1 }}>
                  <Divider sx={{ borderColor: 'rgba(84, 227, 255, 0.08)' }} />
                </Grid>

                {/* Regulatory Fields */}
                <Grid size={{xs: 12, sm: 6}}>
                  <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Numéro de CNIE</Typography>
                  <TextField
                    required
                    fullWidth
                    placeholder="Ex: AB123456"
                    value={numeroPasseport}
                    onChange={(e) => setNumeroPasseport(e.target.value)}
                  />
                </Grid>
                <Grid size={{xs: 12, sm: 6}}>
                  <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Date de délivrance</Typography>
                  <TextField
                    required
                    fullWidth
                    type="date"
                    value={dateDelivrance}
                    onChange={(e) => setDateDelivrance(e.target.value)}
                  />
                </Grid>

                <Grid size={{xs: 12, sm: 6}}>
                  <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Numéro d'Identification Fiscale / CNIE</Typography>
                  <TextField
                    required
                    fullWidth
                    placeholder="Ex: CNIE ou Identifiant Fiscal"
                    value={numeroNif}
                    onChange={(e) => setNumeroNif(e.target.value)}
                  />
                </Grid>
                <Grid size={{xs: 12, sm: 6}}>
                  <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Pays de résidence fiscale</Typography>
                  <TextField
                    required
                    fullWidth
                    placeholder="Ex: Maroc"
                    value={paysResidenceFiscale}
                    onChange={(e) => setPaysResidenceFiscale(e.target.value)}
                  />
                </Grid>

                <Grid size={{xs: 12}} sx={{ my: 1 }}>
                  <Divider sx={{ borderColor: 'rgba(84, 227, 255, 0.08)' }} />
                </Grid>

                {/* Financial Fields */}
                <Grid size={{xs: 12}}>
                  <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Profession / Titre du poste</Typography>
                  <TextField
                    required
                    fullWidth
                    placeholder="Ex: Ingénieur Logiciel, Chef de projet"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                  />
                </Grid>

                <Grid size={{xs: 12, sm: 6}}>
                  <FormControl fullWidth required>
                    <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Tranche de revenus annuels</Typography>
                    <Select
                      value={trancheRevenus}
                      onChange={(e) => setTrancheRevenus(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Sélectionner...</MenuItem>
                      <MenuItem value="< 50k DH" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>&lt; 50 000 DH</MenuItem>
                      <MenuItem value="50k DH - 150k DH" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>50 000 DH - 150 000 DH</MenuItem>
                      <MenuItem value="150k DH - 300k DH" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>150 000 DH - 300 000 DH</MenuItem>
                      <MenuItem value="> 300k DH" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>&gt; 300 000 DH</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{xs: 12, sm: 6}}>
                  <FormControl fullWidth required>
                    <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Origine des fonds</Typography>
                    <Select
                      value={origineFonds}
                      onChange={(e) => setOrigineFonds(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Sélectionner...</MenuItem>
                      <MenuItem value="Salaire" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>Salaire / Revenus professionnels</MenuItem>
                      <MenuItem value="Épargne" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>Épargne personnelle</MenuItem>
                      <MenuItem value="Héritage" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>Héritage / Donation</MenuItem>
                      <MenuItem value="Investissements" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>Placements / Investissements</MenuItem>
                      <MenuItem value="Autre" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>Autre</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h4" color="text.primary" sx={{letterSpacing: '-0.02em', mb: 1, fontWeight: 800}}>
                Pièces Justificatives (OCR Réel)
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Téléversez vos pièces officielles. Notre moteur de reconnaissance optique de caractères (Tesseract) en extrait instantanément les données.
              </Typography>

              {!ocrScanning && !ocrSuccess && (
                <Grid container spacing={3}>
                  <Grid size={{xs: 12}}>
                    <FormControl fullWidth size="small">
                      <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Type de document</Typography>
                      <Select
                        value={documentType}
                        onChange={(e) => {
                          setDocumentType(e.target.value);
                          setIdRecto(null);
                          setIdVerso(null);
                          setError('');
                        }}
                        sx={{ bgcolor: 'background.paper' }}
                      >
                        <MenuItem value="CNIE" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>Carte d'Identité Nationale (CNIE)</MenuItem>
                        <MenuItem value="PASSEPORT" style={{background: 'background.paper', color: isDark ? '#fff' : '#0F172A'}}>Passeport</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {documentType === 'CNIE' ? (
                    <>
                      <Grid size={{xs: 12, sm: 6}}>
                        <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>CNIE (Recto)</Typography>
                        <Card sx={{ border: `2px dashed ${idRecto ? '#54E3FF' : borderColor}`, bgcolor: 'rgba(59, 130, 2462,0.02)', p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#54E3FF' } }}>
                          <label style={{ cursor: 'pointer', display: 'block' }}>
                            <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => setIdRecto(e.target.files?.[0] || null)} />
                            <CloudUploadRoundedIcon sx={{ fontSize: 40, color: idRecto ? '#54E3FF' : 'text.secondary', mb: 1 }} />
                            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                              {idRecto ? idRecto.name : 'Déposez ou sélectionnez'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">PNG, JPG ou PDF (Max. 5 Mo)</Typography>
                          </label>
                        </Card>
                      </Grid>

                      <Grid size={{xs: 12, sm: 6}}>
                        <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>CNIE (Verso)</Typography>
                        <Card sx={{ border: `2px dashed ${idVerso ? '#54E3FF' : borderColor}`, bgcolor: 'rgba(59, 130, 2462,0.02)', p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#54E3FF' } }}>
                          <label style={{ cursor: 'pointer', display: 'block' }}>
                            <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => setIdVerso(e.target.files?.[0] || null)} />
                            <CloudUploadRoundedIcon sx={{ fontSize: 40, color: idVerso ? '#54E3FF' : 'text.secondary', mb: 1 }} />
                            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                              {idVerso ? idVerso.name : 'Déposez ou sélectionnez'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">PNG, JPG ou PDF (Max. 5 Mo)</Typography>
                          </label>
                        </Card>
                      </Grid>
                    </>
                  ) : (
                    <Grid size={{xs: 12}}>
                      <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Passeport (Page principale avec photo)</Typography>
                      <Card sx={{ border: `2px dashed ${idRecto ? '#54E3FF' : borderColor}`, bgcolor: 'rgba(59, 130, 2462,0.02)', p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#54E3FF' } }}>
                        <label style={{ cursor: 'pointer', display: 'block' }}>
                          <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => {
                            setIdRecto(e.target.files?.[0] || null);
                            setIdVerso(null);
                          }} />
                          <CloudUploadRoundedIcon sx={{ fontSize: 40, color: idRecto ? '#54E3FF' : 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                            {idRecto ? idRecto.name : 'Déposez ou sélectionnez'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">PNG, JPG ou PDF (Max. 5 Mo)</Typography>
                        </label>
                      </Card>
                    </Grid>
                  )}

                  <Grid size={{xs: 12}}>
                    <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Justificatif de domicile (de moins de 3 mois)</Typography>
                    <Card sx={{ border: `2px dashed ${proofAddress ? '#54E3FF' : borderColor}`, bgcolor: 'rgba(59, 130, 2462,0.02)', p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#54E3FF' } }}>
                      <label style={{ cursor: 'pointer', display: 'block' }}>
                        <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => setProofAddress(e.target.files?.[0] || null)} />
                        <CloudUploadRoundedIcon sx={{ fontSize: 40, color: proofAddress ? '#54E3FF' : 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                          {proofAddress ? proofAddress.name : 'Déposez ou sélectionnez'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Facture d'électricité, eau, internet ou avis d'imposition</Typography>
                      </label>
                    </Card>
                  </Grid>

                  <Grid size={{xs: 12}}>
                    <Typography variant="body2" color="text.primary" sx={{mb: 1, fontWeight: 700}}>Selfie de Vivacité (Face Verification)</Typography>
                    <Card sx={{ border: `2px dashed ${selfie ? '#54E3FF' : borderColor}`, bgcolor: 'rgba(59, 130, 2462,0.02)', p: 3, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: '#54E3FF' } }}>
                      <label style={{ cursor: 'pointer', display: 'block' }}>
                        <input type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
                        <CloudUploadRoundedIcon sx={{ fontSize: 40, color: selfie ? '#54E3FF' : 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                          {selfie ? selfie.name : 'Prenez un selfie ou sélectionnez une photo'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Capture caméra frontale (mobile) ou JPEG/PNG</Typography>
                      </label>
                    </Card>
                  </Grid>

                  <Grid size={{xs: 12}} sx={{ mt: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={startOcrScan}
                      disabled={!idRecto}
                      fullWidth
                      sx={{ py: 1.5, bgcolor: '#54E3FF', color: '#000000', '&:hover': { bgcolor: '#3B82F6' }, fontWeight: 'bold' }}
                    >
                      Démarrer le scan OCR sémantique
                    </Button>
                  </Grid>
                </Grid>
              )}

              {ocrScanning && (
                <Card sx={{ p: 4, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress size={60} thickness={4} sx={{ color: '#54E3FF', mb: 3 }} />
                  <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>Analyse OCR en cours...</Typography>
                  <Typography variant="body2" color="text.secondary">Veuillez patienter pendant l'extraction des données.</Typography>
                </Card>
              )}

              {ocrSuccess && (
                <Card sx={{ p: 4, bgcolor: 'background.paper', border: `1px solid #10B981`, textAlign: 'center' }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 60, color: '#10B981', mb: 2 }} />
                  <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 'bold', mb: 1 }}>OCR complété avec succès !</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Les informations ont été extraites avec succès de vos documents officiels.
                  </Typography>
                  
                  <Box sx={{ textLayout: 'left', bgcolor: innerBg, p: 3, borderRadius: '5px', mb: 3, textAlign: 'left' }}>
                    <Grid container spacing={2}>
                      <Grid size={{xs: 6}}>
                        <Typography variant="caption" color="text.secondary">Document d'identité :</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {documentType === 'CNIE' ? `CNIE ${numeroPasseport}` : `Passeport ${numeroPasseport}`}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 6}}>
                        <Typography variant="caption" color="text.secondary">Date de délivrance :</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{dateDelivrance}</Typography>
                      </Grid>
                      <Grid size={{xs: 6}}>
                        <Typography variant="caption" color="text.secondary">NIF / CNIE :</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{numeroNif}</Typography>
                      </Grid>
                      <Grid size={{xs: 6}}>
                        <Typography variant="caption" color="text.secondary">Pays de résidence :</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{paysResidenceFiscale}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Button variant="outlined" color="primary" onClick={() => setOcrSuccess(false)} sx={{ borderColor: '#54E3FF', color: '#54E3FF' }}>
                    Modifier les documents
                  </Button>
                </Card>
              )}
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h4" color="text.primary" sx={{letterSpacing: '-0.02em', mb: 1, fontWeight: 800}}>
                {t('planSetup') || 'Configuration du Compte'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
                Sélectionnez votre devise principale ainsi que l'offre de compte et carte bancaire associée.
              </Typography>
              
              <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700, mb: 2 }}>Devise principale de tenue</Typography>
              <Grid container spacing={3} sx={{ mb: 5 }}>
                {[
                  { code: 'MAD', symbol: 'DH', desc: 'Dirham Marocain - العملة الوطنية' }
                ].map((cur) => (
                  <Grid key={cur.code} size={{xs: 12, sm: 12}}>
                    <Card 
                      elevation={0}
                      sx={{ 
                        borderRadius: '5px',
                        border: devise === cur.code ? '2px solid #54E3FF' : '1px solid rgba(84, 227, 255, 0.12)',
                        bgcolor: devise === cur.code ? 'rgba(84, 227, 255, 0.08)' : cardBg,
                        transition: 'all 0.2s',
                        boxShadow: 'none',
                        height: '100%'
                      }}
                    >
                      <CardActionArea onClick={() => setDevise(cur.code)} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h3" color={devise === cur.code ? '#54E3FF' : '#FFFFFF'} sx={{fontWeight: 950}}>
                          {cur.symbol}
                        </Typography>
                        <Typography variant="body1" color={devise === cur.code ? '#54E3FF' : '#FFFFFF'} sx={{fontWeight: 700, mt: 2}}>
                          {cur.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" align="center" sx={{mt: 1}}>
                          {cur.desc}
                        </Typography>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700, mb: 2 }}>Sélectionnez votre produit de carte</Typography>
              <Grid container spacing={4}>
                {/* Standard Plan */}
                <Grid size={{xs: 12, sm: 6}}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: '5px', 
                      border: typeCompte === 'STANDARD' ? '2.5px solid #54E3FF' : '1px solid rgba(84, 227, 255, 0.12)',
                      bgcolor: typeCompte === 'STANDARD' ? 'rgba(84, 227, 255, 0.08)' : cardBg,
                      transition: 'all 0.2s'
                    }}
                  >
                    <CardActionArea onClick={() => setTypeCompte('STANDARD')} sx={{ p: 3 }}>
                      {/* Visual Card */}
                      <Box sx={{ 
                        height: 160, borderRadius: '5px', p: 3, mb: 3, color: 'white', position: 'relative', overflow: 'hidden',
                        background: 'linear-gradient(135deg, #0A192F 0%, #54E3FF 100%)',
                        boxShadow: 'none'
                      }}>
                        <Typography sx={{fontSize: '1.1rem', fontWeight: 900, fontStyle: 'italic'}}>Banque</Typography>
                        <Typography variant="h6" sx={{ position: 'absolute', bottom: 20, left: 20, letterSpacing: 3 }}>•••• 4362</Typography>
                        <Typography variant="body2" sx={{ position: 'absolute', bottom: 20, right: 20, fontWeight: 'bold' }}>VISA</Typography>
                      </Box>
                      <CardContent sx={{ p: 0 }}>
                        <Typography variant="h6" color="text.primary" sx={{fontWeight: 800}}>{t('standardPlan')}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                          {t('standardPlanDesc')}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>

                {/* Premium Plan */}
                <Grid size={{xs: 12, sm: 6}}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: '5px', 
                      border: typeCompte === 'PREMIUM' ? '2.5px solid #54E3FF' : '1px solid rgba(84, 227, 255, 0.12)',
                      bgcolor: typeCompte === 'PREMIUM' ? 'rgba(84, 227, 255, 0.08)' : cardBg,
                      transition: 'all 0.2s'
                    }}
                  >
                    <CardActionArea onClick={() => setTypeCompte('PREMIUM')} sx={{ p: 3 }}>
                      {/* Visual Card */}
                      <Box sx={{ 
                        height: 160, borderRadius: '5px', p: 3, mb: 3, color: isDark ? 'white' : '#0F172A', position: 'relative', overflow: 'hidden',
                        background: isDark ? "linear-gradient(135deg, #07111F 0%, #000000 100%)" : "linear-gradient(135deg, #F1F5F9 0%, #CBD5E1 100%)",
                        border: '1px solid rgba(84, 227, 255, 0.2)',
                        boxShadow: 'none'
                      }}>
                        <Typography color={isDark ? '#54E3FF' : '#00B4D8'} sx={{fontSize: '1.1rem', fontWeight: 900, fontStyle: 'italic'}}>Banque</Typography>
                        <Typography variant="h6" sx={{ position: 'absolute', bottom: 20, left: 20, letterSpacing: 3, color: isDark ? '#54E3FF' : '#00B4D8' }}>•••• 7896</Typography>
                        <Typography variant="body2" sx={{ position: 'absolute', bottom: 20, right: 20, fontWeight: 'bold', color: isDark ? '#54E3FF' : '#00B4D8' }}>VISA</Typography>
                      </Box>
                      <CardContent sx={{ p: 0 }}>
                        <Typography variant="h6" color="text.primary" sx={{fontWeight: 800}}>{t('premiumPlan')}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                          {t('premiumPlanDesc')}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Stepper Buttons (Minimal and clear) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 8 }}>
            <Button 
              disabled={activeStep === 0 || ocrScanning} 
              onClick={handleBack} 
              variant="outlined" 
              sx={{ px: 4, py: 1.2, borderRadius: '5px', borderColor: 'rgba(84, 227, 255, 0.2)', color: '#54E3FF', '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59, 130, 2462,0.05)' } }}
            >
              {t('back')}
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmit} 
                disabled={loading}
                sx={{ px: 4, py: 1.2, borderRadius: '5px', bgcolor: '#54E3FF', color: '#000000', '&:hover': { bgcolor: '#3B82F6' }, fontWeight: 'bold' }}
              >
                {loading ? t('loading') : t('submit')}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNext}
                disabled={
                  ocrScanning || 
                  (activeStep === 0 && (!telephone || !dateNaissance || !adresse || !numeroPasseport || !dateDelivrance || !numeroNif || !profession || !trancheRevenus || !origineFonds)) ||
                  (activeStep === 1 && (!ocrSuccess || !selfie))
                }
                sx={{ px: 4, py: 1.2, borderRadius: '5px', bgcolor: '#54E3FF', color: '#000000', '&:hover': { bgcolor: '#3B82F6' }, fontWeight: 'bold' }}
              >
                {t('continue')}
              </Button>
            )}
          </Box>

        </Box>

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, borderTop: '1px solid rgba(84, 227, 255, 0.08)', pt: 3 }}>
          <Typography variant="caption" color="text.secondary">© 2026 Banque</Typography>
          <Typography variant="caption" color="text.secondary">{t('onboardingTerms')}</Typography>
        </Box>
      </Box>

      {/* Global CSS animations inside style block */}
      <style>{`
        @keyframes scanline {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
      `}</style>

    </Box>
  );
}
