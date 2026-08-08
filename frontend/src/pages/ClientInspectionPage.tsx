import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Button, Card, Grid, Stack, Avatar, Alert, CircularProgress,
  IconButton, Chip, Divider, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Checkbox, FormControlLabel, TextField, Select, MenuItem, FormControl,
  Tabs, Tab, Dialog, DialogContent, Switch
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';
import { useConfigStore } from '../store/configStore';
import api from '../api/axiosConfig';
import Tesseract from 'tesseract.js';

// Icons
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import ContactPageRoundedIcon from '@mui/icons-material/ContactPageRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import LocalPoliceRoundedIcon from '@mui/icons-material/LocalPoliceRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import ShieldCheckIcon from '@mui/icons-material/VerifiedUserRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

interface Compte {
  id: number;
  numeroCompte: string;
  typeCompte: string;
  devise: string;
  solde: number;
  statut: string;
}

interface Client {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateNaissance: string;
  adresse: string;
  kycStatus: string;
  statut: string;
  comptes: Compte[];
  numeroPasseport?: string;
  dateDelivrance?: string;
  numeroNif?: string;
  paysResidenceFiscale?: string;
  profession?: string;
  trancheRevenus?: string;
  origineFonds?: string;
  idRectoData?: string;
  idVersoData?: string;
  proofAddressData?: string;
  selfieData?: string;
  extractedNom?: string;
  extractedPrenom?: string;
  extractedNumeroPasseport?: string;
  extractedDateNaissance?: string;
  extractedDateDelivrance?: string;
  extractedAdresse?: string;
  identityDocumentReadable?: boolean;
  nameAndSurnameMatching?: boolean;
  identityDocumentValid?: boolean;
  proofOfAddressConform?: boolean;
  noFraudSuspicion?: boolean;
  amlPepNegative?: boolean;
  selfieLivenessMatched?: boolean;
  kycConformityScore?: number;
  kycNotes?: string;
  contratGenere?: boolean;
  contratSigne?: boolean;
  contratContenu?: string;
  dateSignature?: string;
  signatureBase64?: string;
}

// Helper: open a base64 image in a new window as a proper HTML page
const openDocumentInNewTab = (dataUrl: string, label: string) => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${label}</title>
        <style>
          body { margin: 0; background: #111; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; }
          img { max-width: 100%; height: auto; display: block; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="${label}" />
      </body>
    </html>
  `);
  win.document.close();
};

export default function ClientInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode } = useThemeStore();
  const { bankName } = useConfigStore();
  const isDark = theme.palette.mode === 'dark';
  
  // Custom design tokens
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)';
  const innerBg = isDark ? 'rgba(5, 11, 20, 0.4)' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  const mainBg = isDark ? '#020617' : '#F8FAFC';
  const rowHoverBg = isDark ? 'rgba(48, 207, 239, 0.04)' : 'rgba(0, 0, 0, 0.01)';

  const [activeTab, setActiveTab] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [ocrResults, setOcrResults] = useState({
    nomMatch: false, extractedNom: '',
    prenomMatch: false, extractedPrenom: '',
    numeroPasseportMatch: false, extractedNumeroPasseport: '',
    dateNaissanceMatch: false, extractedDateNaissance: '',
    dateDelivranceMatch: false, extractedDateDelivrance: '',
    adresseMatch: false, extractedAdresse: '',
    resume: ''
  });
  const [aiEnabled, setAiEnabled] = useState(false);
  
  // Operations state
  const [opAmount, setOpAmount] = useState('');
  const [opDesc, setOpDesc] = useState('');
  const [opLoading, setOpLoading] = useState(false);
  const [selectedIban, setSelectedIban] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  
  // Compliance / Conformity state
  const [notes, setNotes] = useState('');
  const [checks, setChecks] = useState({
    identityLegible: true,
    nameMatch: true,
    notExpired: true,
    addressMatch: true,
    noFraudSuspicion: true,
    amlScreeningClear: true,
    selfieLivenessMatched: true
  });
  const [contractText, setContractText] = useState('');
  const [contractSendLoading, setContractSendLoading] = useState(false);

  const handleLoadTemplate = () => {
    const todayStr = new Date().toLocaleDateString('fr-FR');
    const temp = `CONTRAT D'OUVERTURE DE COMPTE DE DÉPÔT ET DE SERVICES BANCAIRES

Entre les soussignés :
La banque ${bankName}, ci-après dénommée "la Banque", d'une part,
Et :
M./Mme ${(client?.nom || '').toUpperCase()} ${client?.prenom || ''}, demeurant au ${client?.adresse || 'Non renseignée'}, né(e) le ${client?.dateNaissance || 'Non renseignée'}, titulaire du numéro de téléphone ${client?.telephone || 'Non renseigné'}, ci-après dénommé(e) "le Client", d'autre part.

Article 1 : Objet du contrat
Le présent contrat a pour objet de définir les conditions générales d'ouverture, de fonctionnement et de clôture du compte de dépôt du Client auprès de la Banque.

Article 2 : Fonctionnement du compte
Le compte est destiné à enregistrer les opérations de dépôt, de retrait, de virement et de paiement. Le Client s'engage à maintenir un solde créditeur ou nul.

Article 3 : Moyens de paiement & Epargne
Le Client bénéficie de services de banque en ligne, de cartes de débit associées, ainsi que de services d'épargne intelligente en option.

Article 4 : Signature électronique
Conformément aux lois en vigueur, l'apposition de la signature électronique par le Client vaut consentement exprès aux termes du présent contrat et a valeur de signature manuscrite.

Fait le ${todayStr} à Casablanca.`;
    setContractText(temp);
  };

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/employe/clients');
        const found = res.data.find((c: Client) => c.id.toString() === id);
        if (found) {
          setClient(found);
          setChecks({
            identityLegible: found.identityDocumentReadable !== false,
            nameMatch: found.nameAndSurnameMatching !== false,
            notExpired: found.identityDocumentValid !== false,
            addressMatch: found.proofOfAddressConform !== false,
            noFraudSuspicion: found.noFraudSuspicion !== false,
            amlScreeningClear: found.amlPepNegative !== false,
            selfieLivenessMatched: found.selfieLivenessMatched !== false
          });
          setNotes(found.kycNotes || '');
          setContractText(found.contratContenu || '');
          
          const checkMatch = (a?: string, b?: string) => {
             if (!a || !b) return false;
             return a.toUpperCase().trim() === b.toUpperCase().trim();
          };
          
          const checkContains = (a?: string, b?: string) => {
             if (!a || !b) return false;
             return b.toUpperCase().includes(a.toUpperCase()) || a.toUpperCase().includes(b.toUpperCase());
          };

          if (found.extractedNom || found.extractedNumeroPasseport) {
            setOcrResults({
              nomMatch: checkMatch(found.nom, found.extractedNom), extractedNom: found.extractedNom || '',
              prenomMatch: checkMatch(found.prenom, found.extractedPrenom), extractedPrenom: found.extractedPrenom || '',
              numeroPasseportMatch: checkMatch(found.numeroPasseport, found.extractedNumeroPasseport), extractedNumeroPasseport: found.extractedNumeroPasseport || '',
              dateNaissanceMatch: checkMatch(found.dateNaissance, found.extractedDateNaissance), extractedDateNaissance: found.extractedDateNaissance || '',
              dateDelivranceMatch: checkMatch(found.dateDelivrance, found.extractedDateDelivrance), extractedDateDelivrance: found.extractedDateDelivrance || '',
              adresseMatch: checkContains(found.adresse, found.extractedAdresse), extractedAdresse: found.extractedAdresse || '',
              resume: found.kycNotes || ''
            });
            setOcrDone(true);
          }

          if (found.comptes && found.comptes.length > 0) {
            setSelectedIban(found.comptes[0].numeroCompte);
          }
        } else {
          setAlertInfo({ type: 'error', message: "Client introuvable." });
        }
      } catch (err) {
        console.error(err);
        setAlertInfo({ type: 'error', message: "Erreur lors du chargement des données." });
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/api/messages/conversation/${id}`);
        setChatMessages(res.data);
      } catch(e) { console.error(e); }
    };
    if (client) {
      fetchMessages();
    }
  }, [id, client]);

  const handleKycAction = async (status: 'validated' | 'rejected') => {
    if (!client) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/api/employe/clients/${client.id}/kyc?status=${status}`, {
        identityDocumentReadable: checks.identityLegible,
        nameAndSurnameMatching: checks.nameMatch,
        identityDocumentValid: checks.notExpired,
        proofOfAddressConform: checks.addressMatch,
        noFraudSuspicion: checks.noFraudSuspicion,
        amlPepNegative: checks.amlScreeningClear,
        selfieLivenessMatched: checks.selfieLivenessMatched,
        kycNotes: notes
      });
      setAlertInfo({ type: 'success', message: res.data.message });
      setClient({
        ...client,
        kycStatus: status.toUpperCase(),
        identityDocumentReadable: checks.identityLegible,
        nameAndSurnameMatching: checks.nameMatch,
        identityDocumentValid: checks.notExpired,
        proofOfAddressConform: checks.addressMatch,
        noFraudSuspicion: checks.noFraudSuspicion,
        amlPepNegative: checks.amlScreeningClear,
        selfieLivenessMatched: checks.selfieLivenessMatched,
        kycNotes: notes,
        kycConformityScore: scorePct
      });
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Erreur de mise à jour KYC.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckChange = (field: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const runOcrAnalysis = async () => {
    if (!client?.idRectoData) {
      setAlertInfo({ type: 'error', message: "Aucun document recto fourni pour l'OCR." });
      return;
    }
    setOcrLoading(true);
    try {
      const res = await api.post('/api/ocr/analyze', { 
        image: client.idRectoData,
        clientId: client.id,
        ai: aiEnabled
      });
      const data = res.data;
      
      const checkMatch = (a?: string, b?: string) => {
         if (!a || !b) return false;
         return a.toUpperCase().trim() === b.toUpperCase().trim();
      };
      
      const checkContains = (a?: string, b?: string) => {
         if (!a || !b) return false;
         return b.toUpperCase().includes(a.toUpperCase()) || a.toUpperCase().includes(b.toUpperCase());
      };

      setOcrResults({
        nomMatch: checkMatch(client.nom, data.nom), extractedNom: data.nom || '',
        prenomMatch: checkMatch(client.prenom, data.prenom), extractedPrenom: data.prenom || '',
        numeroPasseportMatch: checkMatch(client.numeroPasseport, data.numeroPasseport), extractedNumeroPasseport: data.numeroPasseport || '',
        dateNaissanceMatch: checkMatch(client.dateNaissance, data.dateNaissance), extractedDateNaissance: data.dateNaissance || '',
        dateDelivranceMatch: checkMatch(client.dateDelivrance, data.dateDelivrance), extractedDateDelivrance: data.dateDelivrance || '',
        adresseMatch: checkContains(client.adresse, data.adresse), extractedAdresse: data.adresse || '',
        resume: data.resume || ''
      });
      setOcrDone(true);

      if (aiEnabled) {
        setChecks({
          identityLegible: data.identityDocumentReadable !== false,
          nameMatch: data.nameAndSurnameMatching !== false,
          notExpired: data.identityDocumentValid !== false,
          addressMatch: data.proofOfAddressConform !== false,
          noFraudSuspicion: data.noFraudSuspicion !== false,
          amlScreeningClear: data.amlPepNegative !== false,
          selfieLivenessMatched: data.selfieLivenessMatched !== false
        });
        if (data.resume) {
          setNotes(data.resume);
        }
      }

      setAlertInfo({ 
        type: 'success', 
        message: aiEnabled ? "Analyse IA complétée avec succès (Visualisation de Vivacité & Conformité)." : "Matching OCR local chargé." 
      });
    } catch (error) {
      console.error("OCR AI Error:", error);
      setAlertInfo({ type: 'error', message: "L'analyse a échoué." });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleOperation = async (type: 'depot' | 'retrait') => {
    if (!selectedIban || !opAmount) return;
    setOpLoading(true);
    try {
      await api.post(`/api/employe/comptes/${selectedIban}/${type}`, { montant: opAmount, description: opDesc });
      setAlertInfo({ type: 'success', message: 'Opération réussie !' });
      setOpAmount('');
      setOpDesc('');
      // Ideally re-fetch client or accounts
    } catch(e: any) {
      setAlertInfo({ type: 'error', message: e.response?.data?.message || 'Erreur lors de l\'opération' });
    } finally {
      setOpLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    try {
      const res = await api.post('/api/messages/send', { destinataireId: id, contenu: chatInput });
      setChatMessages(prev => [...prev, res.data]);
      setChatInput('');
    } catch(e: any) {
      setChatError(e.response?.data?.message || 'Erreur envoi message');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: mainBg }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 4, bgcolor: mainBg, height: '100vh' }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Retour</Button>
        <Alert severity="error">Client introuvable</Alert>
      </Box>
    );
  }

  // Document type label logic
  let documentTypeLabel = "Passeport / Autre";
  let isMoroccanID = false;
  if (client.numeroPasseport && /^[A-Z]{1,2}\d{5,9}$/i.test(client.numeroPasseport)) {
    documentTypeLabel = "CNIE Marocaine";
    isMoroccanID = true;
  }

  // Document type label logic

  const checkStrength = Object.values(checks).filter(Boolean).length;
  const scorePct = Math.round((checkStrength / Object.keys(checks).length) * 100);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: mainBg, display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Panel */}
      <Box sx={{ 
        height: 60, 
        bgcolor: 'background.paper', 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 3
      }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary', p: 1 }}>
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Espace Conseiller &nbsp;&gt;&nbsp; <span style={{ color: '#54E3FF', fontWeight: 600 }}>Rapport de Conformité #{client.id}</span>
          </Typography>
        </Stack>
        <Chip 
          label={`Statut Actuel: ${client.kycStatus}`} 
          color={
            client.kycStatus === 'VALIDATED' ? 'success' :
            client.kycStatus === 'SUBMITTED' ? 'warning' :
            client.kycStatus === 'REJECTED' ? 'error' : 'default'
          }
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
        />
      </Box>

      {/* Main Layout Area */}
      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
        
        {alertInfo && (
          <Alert severity={alertInfo.type} onClose={() => setAlertInfo(null)} sx={{ mb: 2, borderRadius: '5px' }}>
            {alertInfo.message}
          </Alert>
        )}

        {/* Top Mini Summary Bar */}
        <Card sx={{ p: 2, borderRadius: '5px', bgcolor: 'background.paper', mb: 2 }}>
          <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Grid size={{xs: 12, md: 6}}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Avatar sx={{ bgcolor: 'rgba(84, 227, 255, 0.1)', color: 'primary.main', width: 46, height: 46, fontWeight: 700, fontSize: '1.2rem' }}>
                  {(client.prenom || '?')[0]?.toUpperCase()}{(client.nom || '?')[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 800 }}>
                    {client.prenom} {client.nom}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {client.email} &bull; {client.telephone || 'Aucun numéro'}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            
            <Grid size={{xs: 12, md: 6}}>
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small"
                  startIcon={<CancelRoundedIcon />}
                  onClick={() => handleKycAction('rejected')}
                  disabled={actionLoading || client.kycStatus === 'REJECTED'}
                  sx={{ borderRadius: '5px', textTransform: 'none', py: 0.6 }}
                >
                  Rejeter
                </Button>
                <Button 
                  variant="contained" 
                  color="success" 
                  size="small"
                  startIcon={<CheckCircleRoundedIcon />}
                  onClick={() => handleKycAction('validated')}
                  disabled={actionLoading || client.kycStatus === 'VALIDATED'}
                  sx={{ 
                    borderRadius: '5px', 
                    textTransform: 'none',
                    py: 0.6,
                    color: 'black', 
                    bgcolor: '#10B981', 
                    '&:hover': { bgcolor: '#059669' } 
                  }}
                >
                  Valider la conformité
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Card>

        {/* Mobile / Tablet Responsive Tab Bar for PWAs */}
        <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 2, bgcolor: 'background.paper', borderRadius: '5px', p: 0.5 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, val) => setActiveTab(val)} 
            variant="fullWidth" 
            textColor="primary" 
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                minHeight: 44,
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                }
              }
            }}
          >
            <Tab label="Conformité" />
            <Tab label="Documents" />
            <Tab label="Actions & Chat" />
          </Tabs>
        </Box>

        <Grid container spacing={2}>
          
          {/* LEFT PANEL: Extracted & Regulatory Data Comparison */}
          <Grid size={{xs: 12, lg: 7}}>
            <Stack spacing={2}>
              
              {/* Comparative Verification Table */}
              <Card sx={{ p: 2.5, borderRadius: '5px', bgcolor: 'background.paper', display: { xs: activeTab === 0 ? 'block' : 'none', lg: 'block' } }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ContactPageRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} /> Verification & OCR Matching Analysis
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <FormControlLabel
                      control={
                        <Switch 
                          size="small" 
                          checked={aiEnabled} 
                          onChange={(e) => setAiEnabled(e.target.checked)} 
                          color="primary" 
                        />
                      }
                      label={<Typography variant="caption" sx={{ fontWeight: 700 }}>Activer l'Analyse IA (Vision)</Typography>}
                      sx={{ mr: 0 }}
                    />
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={runOcrAnalysis} 
                      disabled={ocrLoading}
                      startIcon={ocrLoading && <CircularProgress size={16} />}
                    >
                      {ocrLoading ? 'Analyse en cours...' : 'Lancer l\'OCR'}
                    </Button>
                  </Stack>
                </Stack>
                
                <TableContainer component={Box} sx={{ borderRadius: '5px', bgcolor: innerBg, overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Champ Document</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Données Client (Saisies)</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1 }}>Extraction OCR (Scan)</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1, textAlign: 'center' }}>Statut Match</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { field: 'Nom de famille', profile: client.nom?.toUpperCase(), match: ocrResults.nomMatch, extracted: ocrResults.extractedNom },
                        { field: 'Prénom', profile: client.prenom, match: ocrResults.prenomMatch, extracted: ocrResults.extractedPrenom },
                        { field: 'Numéro ID / Passeport', profile: client.numeroPasseport, match: ocrResults.numeroPasseportMatch, extracted: ocrResults.extractedNumeroPasseport },
                        { field: 'Date de Naissance', profile: client.dateNaissance, match: ocrResults.dateNaissanceMatch, extracted: ocrResults.extractedDateNaissance },
                        { field: 'Date de Délivrance', profile: client.dateDelivrance || 'N/A', match: ocrResults.dateDelivranceMatch, extracted: ocrResults.extractedDateDelivrance },
                        { field: 'Adresse Postale', profile: client.adresse, match: ocrResults.adresseMatch, extracted: ocrResults.extractedAdresse }
                      ].map((row, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { bgcolor: rowHoverBg } }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 0.8 }}>{row.field}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', py: 0.8 }}>{row.profile || '-'}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', py: 0.8 }}>
                            {ocrDone ? (row.extracted ? row.extracted : <Typography variant="caption" color="error" sx={{ fontStyle: 'italic' }}>Non détecté</Typography>) : '-'}
                          </TableCell>
                          <TableCell sx={{ py: 0.8, textAlign: 'center' }}>
                            {ocrDone ? (
                              <Chip 
                                label={row.match ? "Match Confirmé" : "Mismatch (Non Trouvé)"} 
                                color={row.match ? "success" : "error"}
                                size="small"
                                variant="outlined"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, borderRadius: '5px' }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">En attente...</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {ocrDone && ocrResults.resume && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(66,232,255,0.05)', borderRadius: '5px'}}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>Résumé & Analyse IA</Typography>
                    <Typography variant="body2" color="text.secondary">{ocrResults.resume}</Typography>
                  </Box>
                )}
              </Card>

              {/* Financial Profile & Fiscal Settings */}
              <Card sx={{ p: 2.5, borderRadius: '5px', bgcolor: 'background.paper', display: { xs: activeTab === 0 ? 'block' : 'none', lg: 'block' } }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} /> Profil Économique & Fiscalité
                </Typography>
                
                <Grid container spacing={2}>
                  {[
                    { label: "NIF / Identifiant Fiscal", value: client.numeroNif || 'Non renseigné' },
                    { label: "Résidence Fiscale", value: client.paysResidenceFiscale || 'Non renseigné' },
                    { label: "Profession", value: client.profession || 'Non renseigné' },
                    { label: "Tranche de Revenus", value: client.trancheRevenus || 'Non renseigné' },
                    { label: "Origine des Fonds", value: client.origineFonds || 'Non renseigné' },
                    { label: "Type d'Identité", value: documentTypeLabel }
                  ].map((item, idx) => (
                    <Grid size={{xs: 6}} key={idx}>
                      <Box sx={{ p: 1.5, bgcolor: innerBg, borderRadius: '5px' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{item.value}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Card>

              {/* Compliance & Risk Screening Assessment */}
              <Card sx={{ p: 2.5, borderRadius: '5px', bgcolor: 'background.paper', display: { xs: activeTab === 0 ? 'block' : 'none', lg: 'block' } }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalPoliceRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} /> Risk & AML Screening Checklist
                </Typography>
                
                {client.kycNotes && (
                  <Box sx={{ 
                    p: 2, 
                    mb: 2.5, 
                    bgcolor: isDark ? 'rgba(84, 227, 255, 0.04)' : '#F0FDFA', 
                    borderLeft: '4px solid #54E3FF', 
                    borderRadius: '4px' 
                  }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, color: '#54E3FF' }}>
                      Rapport d'Analyse Automatique par l'IA
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                      {client.kycNotes}
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={2}>
                  {/* Left checklist column */}
                  <Grid size={{xs: 12, md: 6}}>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={checks.identityLegible} onChange={() => handleCheckChange('identityLegible')} color="primary" />}
                        label={<Typography variant="body2">Document d'identité lisible</Typography>}
                      />
                      <FormControlLabel
                        control={<Checkbox size="small" checked={checks.nameMatch} onChange={() => handleCheckChange('nameMatch')} color="primary" />}
                        label={<Typography variant="body2">Nom et Prénom correspondants</Typography>}
                      />
                      <FormControlLabel
                        control={<Checkbox size="small" checked={checks.notExpired} onChange={() => handleCheckChange('notExpired')} color="primary" />}
                        label={<Typography variant="body2">Document d'identité valide (Non expiré)</Typography>}
                      />
                    </Stack>
                  </Grid>

                  {/* Right checklist column */}
                  <Grid size={{xs: 12, md: 6}}>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={checks.addressMatch} onChange={() => handleCheckChange('addressMatch')} color="primary" />}
                        label={<Typography variant="body2">Justificatif de domicile conforme</Typography>}
                      />
                      <FormControlLabel
                        control={<Checkbox size="small" checked={checks.noFraudSuspicion} onChange={() => handleCheckChange('noFraudSuspicion')} color="primary" />}
                        label={<Typography variant="body2">Aucune suspicion de fraude</Typography>}
                      />
                      <FormControlLabel
                        control={<Checkbox size="small" checked={checks.amlScreeningClear} onChange={() => handleCheckChange('amlScreeningClear')} color="primary" />}
                        label={<Typography variant="body2">Filtrage AML / PEP Négatif</Typography>}
                      />
                      <FormControlLabel
                        control={<Checkbox size="small" checked={checks.selfieLivenessMatched} onChange={() => handleCheckChange('selfieLivenessMatched')} color="primary" />}
                        label={<Typography variant="body2">Selfie & Vivacité validés</Typography>}
                      />
                    </Stack>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2, borderColor }} />

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Conformité Générale</Typography>
                    <Typography variant="caption" color="text.secondary">Score de confiance global basé sur les vérifications</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color={scorePct >= 80 ? "success.main" : "error.main"} sx={{ fontWeight: 800 }}>
                      {scorePct}%
                    </Typography>
                    <Chip 
                      label={scorePct === 100 ? "Conforme" : scorePct >= 80 ? "Vérification requise" : "Non Conforme"} 
                      color={scorePct === 100 ? "success" : scorePct >= 80 ? "warning" : "error"}
                      size="small"
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </Box>
                </Stack>
              </Card>

              {/* Advisor Notes */}
              <Card sx={{ p: 2.5, borderRadius: '5px', bgcolor: 'background.paper', display: { xs: activeTab === 0 ? 'block' : 'none', lg: 'block' } }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 800, mb: 1.5 }}>
                  Notes de l'Analyste Conformité
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  variant="outlined"
                  placeholder="Saisissez vos remarques ou motifs de rejet pour ce dossier..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ 
                    bgcolor: innerBg,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor },
                      '&:hover fieldset': { borderColor: '#54E3FF' }
                    }
                  }}
                />
              </Card>

              {/* Contract Preparation & Follow-up */}
              {client.kycStatus === 'VALIDATED' && (
                <Card sx={{ p: 2.5, borderRadius: '5px', bgcolor: 'background.paper', display: { xs: activeTab === 0 ? 'block' : 'none', lg: 'block' } }}>
                  <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} /> Préparation & Suivi du Contrat
                  </Typography>
                  
                  {!client.contratGenere ? (
                    <Stack spacing={2}>
                      <Alert severity="info" sx={{ borderRadius: '5px' }}>
                        Le KYC de ce client est validé. Vous pouvez maintenant préparer, modifier et lui envoyer son contrat d'ouverture de compte.
                      </Alert>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                          Contenu du contrat :
                        </Typography>
                        <Button 
                          size="small" 
                          variant="text" 
                          onClick={handleLoadTemplate}
                          sx={{ textTransform: 'none', py: 0.2, fontWeight: 700, color: 'primary.main' }}
                        >
                          Charger le modèle type
                        </Button>
                      </Stack>
                      <TextField
                        fullWidth
                        multiline
                        rows={10}
                        variant="outlined"
                        value={contractText}
                        onChange={(e) => setContractText(e.target.value)}
                        sx={{ 
                          bgcolor: innerBg,
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor },
                            '&:hover fieldset': { borderColor: '#54E3FF' }
                          }
                        }}
                      />
                      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={async () => {
                            if (!client) return;
                            setContractSendLoading(true);
                            try {
                              const res = await api.post(`/api/employe/clients/${client.id}/send-contract`, { contenu: contractText });
                              setAlertInfo({ type: 'success', message: res.data.message || 'Contrat envoyé avec succès !' });
                              setClient(prev => prev ? {
                                ...prev,
                                contratGenere: true,
                                contratContenu: contractText,
                                contratSigne: false
                              } : null);
                            } catch (err: any) {
                              console.error(err);
                              setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Erreur lors de l\'envoi du contrat.' });
                            } finally {
                              setContractSendLoading(false);
                            }
                          }}
                          disabled={contractSendLoading || !contractText.trim()}
                          startIcon={contractSendLoading ? <CircularProgress size={16} /> : <SendRoundedIcon />}
                          sx={{
                            color: 'black', 
                            bgcolor: '#54E3FF', 
                            '&:hover': { bgcolor: '#3B82F6' }
                          }}
                        >
                          {contractSendLoading ? 'Envoi...' : 'Générer & Envoyer'}
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack spacing={2}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary">Statut du contrat :</Typography>
                        <Chip 
                          label={client.contratSigne ? "Signé" : "En attente de signature"}
                          color={client.contratSigne ? "success" : "warning"}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>

                      {client.contratSigne && client.dateSignature && (
                        <Box sx={{ p: 2, bgcolor: innerBg, borderRadius: '5px', border: `1px solid ${borderColor}` }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Date de signature :</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{new Date(client.dateSignature).toLocaleString('fr-FR')}</Typography>
                          
                          {client.signatureBase64 && (
                            <>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Signature numérisée :</Typography>
                              <Box sx={{ bgcolor: '#FFFFFF', p: 1, borderRadius: '4px', display: 'inline-block', border: '1px solid #ddd' }}>
                                <img src={client.signatureBase64} alt="Signature client" style={{ maxHeight: '80px', maxWidth: '100%' }} />
                              </Box>
                            </>
                          )}
                        </Box>
                      )}

                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700 }}>
                        Contenu du contrat :
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          maxHeight: '200px', 
                          overflowY: 'auto', 
                          bgcolor: innerBg, 
                          borderColor,
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          whiteSpace: 'pre-line'
                        }}
                      >
                        {client.contratContenu}
                      </Paper>
                      
                      {!client.contratSigne && (
                        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              if (client.contratContenu) {
                                setContractText(client.contratContenu);
                              }
                              setClient(prev => prev ? { ...prev, contratGenere: false } : null);
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Modifier et Renvoyer
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Card>
              )}

              {/* Opérations Bancaires Conseiller */}
              <Card sx={{ p: 2.5, borderRadius: '5px', bgcolor: 'background.paper', display: { xs: activeTab === 2 ? 'block' : 'none', lg: 'block' } }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoneyRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} /> Opérations Manuelles (Guichet)
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{xs: 12, md: 6}}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedIban}
                        onChange={(e) => setSelectedIban(e.target.value)}
                        displayEmpty
                        sx={{ bgcolor: innerBg }}
                      >
                        {client.comptes && client.comptes.length > 0 ? (
                          client.comptes.map((c: any) => (
                            <MenuItem key={c.numeroCompte} value={c.numeroCompte}>
                              {c.type} - {c.numeroCompte} ({c.solde} {c.devise})
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem value="" disabled>Aucun compte actif</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{xs: 12, md: 6}}>
                    <TextField
                      fullWidth size="small" placeholder="Montant" type="number"
                      value={opAmount} onChange={e => setOpAmount(e.target.value)}
                      sx={{ bgcolor: innerBg }}
                    />
                  </Grid>
                  <Grid size={{xs: 12}}>
                    <TextField
                      fullWidth size="small" placeholder="Motif de l'opération"
                      value={opDesc} onChange={e => setOpDesc(e.target.value)}
                      sx={{ bgcolor: innerBg }}
                    />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                  <Button variant="outlined" color="error" onClick={() => handleOperation('retrait')} disabled={opLoading || !selectedIban || !opAmount}>
                    Effectuer un Retrait
                  </Button>
                  <Button variant="contained" color="success" onClick={() => handleOperation('depot')} disabled={opLoading || !selectedIban || !opAmount} sx={{ color: 'black' }}>
                    Effectuer un Dépôt
                  </Button>
                </Stack>
              </Card>

              {/* Chat Conseiller ↔ Client */}
              <Card sx={{ p: 2.5, borderRadius: '5px', bgcolor: 'background.paper', height: 400, display: { xs: activeTab === 2 ? 'flex' : 'none', lg: 'flex' }, flexDirection: 'column' }}>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ForumRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} /> Messagerie Sécurisée
                </Typography>
                
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, bgcolor: innerBg, borderRadius: '5px', mb: 2 }}>
                  {chatMessages.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>Aucun message.</Typography>
                  ) : (
                    chatMessages.map((msg, idx) => {
                      // current user is employe, so if senderId != id => it's my message
                      const isMe = msg.senderId !== parseInt(id as string);
                      return (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1, gap: 1, alignItems: 'flex-start' }}>
                          {!isMe && (
                            <Avatar src={msg.senderAvatar} sx={{ bgcolor: 'secondary.main', width: 24, height: 24, fontSize: '0.7rem', borderRadius: '5px' }}>
                              {client?.prenom?.[0]?.toUpperCase() || 'C'}
                            </Avatar>
                          )}
                          <Box sx={{ 
                            p: 1.2, 
                            borderRadius: '5px', 
                            bgcolor: isMe ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.05)' : '#fff'),
                            color: isMe ? '#000' : 'text.primary',
                            border: isMe ? 'none' : `1px solid ${borderColor}`,
                            maxWidth: '80%'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: isMe ? 600 : 400 }}>{msg.content}</Typography>
                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.7, mt: 0.5, fontSize: '10px' }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Typography>
                          </Box>
                          {isMe && (
                            <Avatar src={msg.senderAvatar} sx={{ bgcolor: 'primary.dark', width: 24, height: 24, fontSize: '0.7rem', borderRadius: '5px' }}>
                              U
                            </Avatar>
                          )}
                        </Box>
                      );
                    })
                  )}
                </Box>
                
                <Stack direction="row" spacing={1}>
                  <TextField 
                    fullWidth size="small" placeholder="Votre message..." 
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={chatLoading}
                  />
                  <Button variant="contained" color="primary" onClick={handleSendMessage} disabled={chatLoading || !chatInput.trim()} sx={{ minWidth: 40, p: 0 }}>
                    <SendRoundedIcon fontSize="small" />
                  </Button>
                </Stack>
                {chatError && <Typography variant="caption" color="error">{chatError}</Typography>}
              </Card>

            </Stack>
          </Grid>
          
          {/* RIGHT PANEL: Pièces Justificatives Visualizer */}
          <Grid size={{xs: 12, lg: 5}} sx={{ display: { xs: activeTab === 1 ? 'block' : 'none', lg: 'block' } }}>
            <Card sx={{ p: 2.5, borderRadius: '5px', bgcolor: 'background.paper', height: '100%' }}>
              <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} /> Pièces Justificatives Fournies
              </Typography>
              
              <Stack spacing={3}>
                {/* Recto */}
                <Box>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#54E3FF' }}>Document d'identité (Recto)</Typography>
                    <IconButton size="small" sx={{ p: 0.5, color: 'primary.main' }} onClick={() => { setPreviewImage(client.idRectoData || null); setPreviewLabel("Document d'identité - Recto"); }}>
                      <ZoomInRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  {client.idRectoData ? (
                    <Box sx={{ borderRadius: '5px', overflow: 'hidden', bgcolor: innerBg, display: 'flex', justifyContent: 'center', p: 1 }}>
                      <img src={client.idRectoData} alt="ID Recto" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '5px' }} />
                    </Box>
                  ) : (
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: innerBg, border: `1px dashed ${borderColor}` }} elevation={0}>
                      <Typography variant="caption" color="text.secondary">Aucun document recto fourni</Typography>
                    </Paper>
                  )}
                </Box>

                {/* Verso */}
                <Box>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#54E3FF' }}>Document d'identité (Verso)</Typography>
                    <IconButton size="small" sx={{ p: 0.5, color: 'primary.main' }} onClick={() => { setPreviewImage(client.idVersoData || null); setPreviewLabel("Document d'identité - Verso"); }}>
                      <ZoomInRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  {client.idVersoData ? (
                    <Box sx={{ borderRadius: '5px', overflow: 'hidden', bgcolor: innerBg, display: 'flex', justifyContent: 'center', p: 1 }}>
                      <img src={client.idVersoData} alt="ID Verso" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '5px' }} />
                    </Box>
                  ) : (
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: innerBg, border: `1px dashed ${borderColor}` }} elevation={0}>
                      <Typography variant="caption" color="text.secondary">Aucun document verso fourni</Typography>
                    </Paper>
                  )}
                </Box>

                {/* Proof of address */}
                <Box>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#54E3FF' }}>Justificatif de domicile</Typography>
                    <IconButton size="small" sx={{ p: 0.5, color: 'primary.main' }} onClick={() => { setPreviewImage(client.proofAddressData || null); setPreviewLabel("Justificatif de domicile"); }}>
                      <ZoomInRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  {client.proofAddressData ? (
                    <Box sx={{ borderRadius: '5px', overflow: 'hidden', bgcolor: innerBg, display: 'flex', justifyContent: 'center', p: 1 }}>
                      <img src={client.proofAddressData} alt="Justificatif Domicile" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '5px' }} />
                    </Box>
                  ) : (
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: innerBg, border: `1px dashed ${borderColor}` }} elevation={0}>
                      <Typography variant="caption" color="text.secondary">Aucun justificatif fourni</Typography>
                    </Paper>
                  )}
                </Box>

                {/* Selfie */}
                <Box>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#54E3FF' }}>Selfie de Vivacité</Typography>
                    <IconButton size="small" sx={{ p: 0.5, color: 'primary.main' }} onClick={() => { setPreviewImage(client.selfieData || null); setPreviewLabel("Selfie de Vivacité"); }}>
                      <ZoomInRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  {client.selfieData ? (
                    <Box sx={{ borderRadius: '5px', overflow: 'hidden', bgcolor: innerBg, display: 'flex', justifyContent: 'center', p: 1 }}>
                      <img src={client.selfieData} alt="Selfie" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '5px' }} />
                    </Box>
                  ) : (
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: innerBg, border: `1px dashed ${borderColor}` }} elevation={0}>
                      <Typography variant="caption" color="text.secondary">Aucun selfie fourni</Typography>
                    </Paper>
                  )}
                </Box>

              </Stack>
            </Card>
          </Grid>

        </Grid>
      </Box>

      {/* Document Preview Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            className: 'glass-dialog-paper',
            sx: {
              p: 1,
              border: 'none',
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderBottom: `1px solid ${borderColor}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>{previewLabel}</Typography>
          <IconButton onClick={() => setPreviewImage(null)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
          {previewImage && (
            <img src={previewImage} alt={previewLabel} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '5px' }} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
