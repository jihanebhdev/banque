import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Card, 
  Grid, 
  Stack, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  Avatar, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { useAuthStore } from '../store/authStore';
import { useConfigStore } from '../store/configStore';
import Logo from '../components/Logo';
import api from '../api/axiosConfig';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from '../i18n/translations';

// Icons
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';

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
  contratGenere?: boolean;
  contratSigne?: boolean;
  contratContenu?: string;
  dateSignature?: string;
}

interface Transaction {
  id: number;
  montant: number;
  description: string;
  dateOperation: string;
  type: string;
  compteSource: Compte | null;
  compteDestination: Compte | null;
}

export default function EmployeWorkspace() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const { bankName } = useConfigStore();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)';
  const innerBg = isDark ? 'rgba(5, 11, 20, 0.4)' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const mainBg = isDark ? '#020617' : '#F8FAFC';
  const sidebarBg = isDark ? 'rgba(7, 17, 31, 0.18)' : 'rgba(255, 255, 255, 0.35)';

  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('sidebarCollapsed') === 'true');

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('sidebarCollapsed', String(newVal));
      return newVal;
    });
  };
  
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Profile Update State
  const [profileNom, setProfileNom] = useState(user?.nom || '');
  const [profilePrenom, setProfilePrenom] = useState(user?.prenom || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Password Update State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }
    try {
      setPasswordLoading(true);
      await api.put('/api/auth/change-password', { oldPassword, newPassword });
      setPasswordSuccess("Mot de passe mis à jour avec succès.");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Erreur de mise à jour du mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      await api.put('/api/auth/profile', {
        nom: profileNom,
        prenom: profilePrenom,
        email: profileEmail
      });
      updateUser({ nom: profileNom, prenom: profilePrenom, email: profileEmail });
      setProfileSuccess("Profil mis à jour avec succès !");
    } catch (err: any) {
      setProfileError(err.response?.data?.message || "Erreur de mise à jour du profil.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("L'image est trop volumineuse (max 2 Mo).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setProfileLoading(true);
      setProfileError('');
      setProfileSuccess('');
      try {
        await api.put('/api/auth/profile', { avatar: base64String });
        updateUser({ avatar: base64String });
        setProfileSuccess("Photo de profil mise à jour !");
      } catch (err: any) {
        setProfileError(err.response?.data?.message || "Erreur de mise à jour de la photo.");
      } finally {
        setProfileLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };


  const fetchClients = async () => {
    try {
      const res = await api.get('/api/employe/clients');
      setClients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/employe/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      await fetchClients();
      await fetchTransactions();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleKycAction = async (clientId: number, status: 'validated' | 'rejected') => {
    try {
      setActionLoading(true);
      const res = await api.post(`/api/employe/clients/${clientId}/kyc?status=${status}`);
      setAlertInfo({ type: 'success', message: res.data.message });
      await fetchClients();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Erreur de mise à jour KYC.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCompte = async (compteId: number) => {
    try {
      setActionLoading(true);
      const res = await api.post(`/api/employe/comptes/${compteId}/toggle`);
      setAlertInfo({ type: 'success', message: res.data.message });
      await fetchClients();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Erreur de gel du compte.' });
    } finally {
      setActionLoading(false);
    }
  };



  const navigate = useNavigate();
  
  const handleOpenClientDetails = (client: Client) => {
    navigate(`/employe/client/${client.id}`);
  };

  // Filter clients based on search query
  const filteredClients = (clients || []).filter(c => 
    (c.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.prenom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter submitted or pending KYC cases
  const kycRequests = (clients || []).filter(c => c.kycStatus === 'SUBMITTED' || c.kycStatus === 'PENDING');

  const renderSidebarContent = () => (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      py: 3, 
      px: sidebarCollapsed ? 1 : 2, 
      justifyContent: 'space-between',
      bgcolor: isDark ? 'rgba(7, 17, 31, 0.45)' : 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      transition: 'padding 0.2s ease-in-out'
    }}>
      <Stack spacing={4}>
        {/* Brand Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: 1.5, px: 1, cursor: 'pointer' }} onClick={() => { setActiveTab(0); setMobileMenuOpen(false); }}>
          {sidebarCollapsed ? (
            <Box sx={{
              width: 42,
              height: 42,
              borderRadius: '5px',
              bgcolor: 'rgba(84, 227, 255, 0.1)',
              border: '2px solid #54E3FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(84, 227, 255, 0.3)'
            }}>
              <Typography sx={{ fontWeight: 950, fontStyle: 'italic', color: '#54E3FF', fontSize: '1.2rem' }}>
                {bankName.substring(0, 2).toUpperCase()}
              </Typography>
            </Box>
          ) : (
            <Logo size="medium" onDarkBg={isDark} />
          )}
        </Box>

        {/* Nav Links List */}
        <Stack spacing={1}>
          {[
            { id: 0, label: sidebarCollapsed ? `KYC (${kycRequests.length})` : `Validation KYC (${kycRequests.length})`, fullLabel: `Validation KYC (${kycRequests.length})`, icon: <BadgeRoundedIcon /> },
            { id: 1, label: 'Gestion Clients', fullLabel: 'Gestion Clients', icon: <PeopleAltRoundedIcon /> },
            { id: 2, label: 'Transactions', fullLabel: 'Transactions', icon: <CompareArrowsRoundedIcon /> },
            { id: 3, label: 'Paramètres Profil', fullLabel: 'Paramètres Profil', icon: <SettingsOutlinedIcon /> }
          ].map((item) => {
            const isActive = activeTab === item.id;
            const btnContent = (
              <Button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                variant="text"
                sx={{
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  px: sidebarCollapsed ? 0 : 2,
                  py: 1.2,
                  minWidth: sidebarCollapsed ? 48 : 0,
                  borderRadius: '5px',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  bgcolor: isActive ? 'rgba(84, 227, 255, 0.08)' : 'transparent',
                  borderLeft: (!sidebarCollapsed && isActive) ? '3px solid #54E3FF' : '3px solid transparent',
                  border: (sidebarCollapsed && isActive) ? '1px solid rgba(84, 227, 255, 0.2)' : '1px solid transparent',
                  '&:hover': { backgroundColor: 'transparent' },
                  '& .MuiButton-startIcon': {
                    margin: sidebarCollapsed ? 0 : '0 12px 0 0'
                  }
                }}
                startIcon={item.icon}
              >
                {!sidebarCollapsed && (
                  <Box sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {item.label}
                  </Box>
                )}
              </Button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id} title={item.fullLabel} placement="right" arrow>
                  {btnContent}
                </Tooltip>
              );
            }
            return btnContent;
          })}
        </Stack>
      </Stack>

      <Stack spacing={2}>
        {/* Toggle Collapse Button (Desktop Only) */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: sidebarCollapsed ? 'center' : 'flex-end', px: 1 }}>
          <IconButton size="small" onClick={toggleSidebar} sx={{ color: 'text.secondary', bgcolor: 'rgba(84,227,255,0.05)', '&:hover': { bgcolor: 'rgba(84,227,255,0.1)' } }}>
            {sidebarCollapsed ? <ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} /> : <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Box>

        {sidebarCollapsed ? (
          <Tooltip title="Déconnexion" placement="right" arrow>
            <Button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              variant="text"
              sx={{
                justifyContent: 'center',
                px: 0,
                py: 1.2,
                minWidth: 48,
                borderRadius: '5px',
                color: 'text.secondary',
                '&:hover': { backgroundColor: 'transparent' },
                '& .MuiButton-startIcon': { margin: 0 }
              }}
              startIcon={<LogoutRoundedIcon />}
            />
          </Tooltip>
        ) : (
          <Button
            onClick={() => { logout(); setMobileMenuOpen(false); }}
            variant="text"
            sx={{
              justifyContent: 'flex-start',
              px: 2,
              py: 1.2,
              borderRadius: '5px',
              color: 'text.secondary',
              '&:hover': { backgroundColor: 'transparent' },
              '& .MuiButton-startIcon': {
                margin: '0 12px 0 0'
              }
            }}
            startIcon={<LogoutRoundedIcon />}
          >
            <Box sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              Déconnexion
            </Box>
          </Button>
        )}
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: mainBg, overflow: 'hidden' }}>
      
      {/* 1. Desktop Left Vertical Nav Bar */}
      <Box sx={{ 
        width: sidebarCollapsed ? 80 : 240, 
        minWidth: sidebarCollapsed ? 80 : 240,
        bgcolor: sidebarBg, 
        backdropFilter: 'blur(24px) saturate(180%)',
        borderRight: `1px solid ${borderColor}`,
        display: { xs: 'none', md: 'flex' }, 
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease-in-out, min-width 0.2s ease-in-out'
      }}>
        {renderSidebarContent()}
      </Box>

      {/* Mobile Drawer Navigation */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 260,
              bgcolor: isDark ? '#020617' : '#F8FAFC',
              borderRight: `1px solid ${borderColor}`,
            }
          }
        }}
      >
        {renderSidebarContent()}
      </Drawer>

      {/* Main Container for Header + Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* 2. Top Header Navigation (Full Width) */}
        <Box sx={{ 
          height: 80, 
          minHeight: 80,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: isDark ? 'rgba(2, 6, 23, 0.35)' : 'rgba(248, 250, 252, 0.35)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: { xs: 2, sm: 4 }
        }}>
          {/* Left: Hamburger menu & Breadcrumbs */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' }, color: 'primary.main', mr: 1 }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
              Banque &nbsp;&gt;&nbsp; Espace Conseiller &nbsp;&gt;&nbsp; <span style={{ color: 'primary.main', fontWeight: 600 }}>
                {activeTab === 0 && "Validation KYC"}
                {activeTab === 1 && "Gestion Clients"}
                {activeTab === 2 && "Transactions"}
                {activeTab === 3 && "Paramètres Profil"}
              </span>
            </Typography>
          </Stack>

          {/* Right: Actions & User Info */}
          <Stack direction="row" spacing={3} sx={{alignItems: 'center'}}>
            <LanguageSelector />
            <IconButton onClick={toggleTheme} sx={{ color: 'primary.main' }}>
              {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" color="text.primary" sx={{fontWeight: 700}}>
                {user?.prenom} {user?.nom}
              </Typography>
              <Typography variant="caption" color="primary.main" sx={{fontWeight: 600}}>
                Conseiller
              </Typography>
            </Box>
            <IconButton sx={{ color: 'primary.main' }} onClick={() => setActiveTab(3)}><SettingsOutlinedIcon /></IconButton>
            <IconButton sx={{ color: 'primary.main', position: 'relative' }}>
              <NotificationsOutlinedIcon />
              {kycRequests.length > 0 && (
                <Box sx={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
              )}
            </IconButton>
            <Avatar 
              src={user?.avatar}
              onClick={() => setActiveTab(3)}
              sx={{ width: 38, height: 38, bgcolor: 'primary.main', color: '#000000', fontWeight: 700, cursor: 'pointer' }}
            >
              {!user?.avatar && `${user?.prenom?.[0]?.toUpperCase() || 'E'}${user?.nom?.[0]?.toUpperCase() || ''}`}
            </Avatar>
          </Stack>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, pb: 10 }}>
          

          {alertInfo && (
            <Alert severity={alertInfo.type} onClose={() => setAlertInfo(null)} sx={{ borderRadius: '5px' }}>
              {alertInfo.message}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <>
              {/* TAB 0: KYC Validations */}
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h5" color="text.primary" sx={{fontWeight: 700, mb: 3}}>
                    Dossiers KYC en attente de vérification
                  </Typography>
                  
                  {kycRequests.length === 0 ? (
                    <Card sx={{ p: 5, textAlign: 'center', borderRadius: '5px', bgcolor: 'background.paper'}}>
                      <CheckCircleOutlineRoundedIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                      <Typography variant="h6" sx={{fontWeight: 700}}>Tous les dossiers sont validés</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>Aucun client en attente de validation KYC pour le moment.</Typography>
                    </Card>
                  ) : (
                    <Grid container spacing={3}>
                      {kycRequests.map((client) => (
                        <Grid key={client.id} size={{xs: 12}}>
                          <Card sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
                            <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                              <Grid size={{xs: 12, md: 4}}>
                                <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                                  <Avatar sx={{ bgcolor: isDark ? 'rgba(59, 130, 2462,0.1)' : 'rgba(84, 227, 255, 0.1)', color: 'primary.main', width: 56, height: 56, fontWeight: 700 }}>
                                    {(client.prenom || '?')[0]?.toUpperCase()}{(client.nom || '?')[0]?.toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6" color="text.primary" sx={{fontWeight: 700}}>{client.prenom} {client.nom}</Typography>
                                    <Typography variant="caption" color="text.secondary">{client.email}</Typography>
                                  </Box>
                                </Stack>
                              </Grid>
                              <Grid size={{xs: 12, sm: 6, md: 5}}>
                                <Grid container spacing={2}>
                                  <Grid size={{xs: 6}}>
                                    <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>TÉLÉPHONE</Typography>
                                    <Typography variant="body2" sx={{fontWeight: 600}}>{client.telephone || 'Non renseigné'}</Typography>
                                  </Grid>
                                  <Grid size={{xs: 6}}>
                                    <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>DATE DE NAISSANCE</Typography>
                                    <Typography variant="body2" sx={{fontWeight: 600}}>{client.dateNaissance || 'Non renseignée'}</Typography>
                                  </Grid>
                                  <Grid size={{xs: 12}}>
                                    <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>ADRESSE</Typography>
                                    <Typography variant="body2" sx={{fontWeight: 600}}>{client.adresse || 'Non renseignée'}</Typography>
                                  </Grid>
                                </Grid>
                              </Grid>
                              <Grid sx={{ textAlign: { md: 'right' } }} size={{xs: 12, sm: 6, md: 3}}>
                                <Stack direction="row" spacing={1.5} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                  <Button 
                                    variant="outlined" 
                                    onClick={() => handleOpenClientDetails(client)}
                                    sx={{ borderRadius: '5px', borderColor: '#54E3FF', color: 'primary.main', '&:hover': { borderColor: '#3B82F6' } }}
                                  >
                                    Inspecter
                                  </Button>
                                  <Button 
                                    variant="outlined" 
                                    color="error" 
                                    startIcon={<CancelRoundedIcon />}
                                    onClick={() => handleKycAction(client.id, 'rejected')}
                                    sx={{ borderRadius: '5px' }}
                                  >
                                    Rejeter
                                  </Button>
                                  <Button 
                                    variant="contained" 
                                    color="success" 
                                    startIcon={<CheckCircleRoundedIcon />}
                                    onClick={() => handleKycAction(client.id, 'validated')}
                                    sx={{ borderRadius: '5px', color: 'black', bgcolor: 'success.main', '&:hover': { bgcolor: '#059669' } }}
                                  >
                                    Valider
                                  </Button>
                                </Stack>
                              </Grid>
                            </Grid>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}

              {/* TAB 1: Client Management */}
              {activeTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" color="text.primary" sx={{fontWeight: 700}}>
                      Répertoire Clients & Comptes
                    </Typography>
                    <TextField
                      placeholder="Rechercher un client..."
                      size="small"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ color: 'text.secondary' }} /></InputAdornment>}
                      }}
                      sx={{ width: 300, bgcolor: 'background.paper', '& .MuiOutlinedInput-root': { borderRadius: '5px' } }}
                    />
                  </Box>

                  <Box className="responsive-table-wrapper">
                    <TableContainer component={Paper} sx={{ borderRadius: '5px', overflow: 'hidden', boxShadow: 'none', bgcolor: 'background.paper' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Client</TableCell>
                          <TableCell>KYC</TableCell>
                          <TableCell>Status Client</TableCell>
                          <TableCell>Contrat</TableCell>
                          <TableCell>Comptes associés</TableCell>
                          <TableCell>Solde Total</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredClients.map((client) => {
                          const totalSolde = (client.comptes || []).reduce((acc, c) => acc + c.solde, 0);
                          const isBlocked = client.statut === 'BLOCKED';
                          return (
                            <TableRow key={client.id} hover>
                              <TableCell>
                                <Stack direction="row" spacing={2} onClick={() => handleOpenClientDetails(client)} sx={{ cursor: 'pointer', alignItems: 'center' }}>
                                  <Avatar sx={{ bgcolor: isDark ? 'rgba(84, 227, 255, 0.08)' : 'rgba(48, 207, 239, 0.06)', color: 'primary.main', fontWeight: 600 }}>
                                    {client.prenom?.[0]?.toUpperCase()}
                                    {client.nom?.[0]?.toUpperCase() || ''}
                                  </Avatar>
                                  <Box>
                                    <Typography color="text.primary" sx={{fontWeight: 700}}>{client.prenom} {client.nom}</Typography>
                                    <Typography variant="caption" color="text.secondary">{client.email}</Typography>
                                  </Box>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={client.kycStatus} 
                                  color={
                                    client.kycStatus === 'VALIDATED' ? 'success' :
                                    client.kycStatus === 'SUBMITTED' ? 'warning' :
                                    client.kycStatus === 'REJECTED' ? 'error' : 'default'
                                  }
                                  size="small"
                                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={client.statut || 'ACTIVE'} 
                                  color={isBlocked ? 'error' : 'success'}
                                  size="small"
                                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={
                                    client.contratSigne ? "Signé" :
                                    client.contratGenere ? "En attente" : "Non préparé"
                                  } 
                                  color={
                                    client.contratSigne ? "success" :
                                    client.contratGenere ? "warning" : "default"
                                  }
                                  size="small"
                                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                />
                              </TableCell>
                              <TableCell>
                                <Stack spacing={0.5}>
                                  {(client.comptes || []).map((c) => (
                                    <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }} color="text.primary">
                                        {c.numeroCompte.substring(0, 10)}... ({c.typeCompte})
                                      </Typography>
                                      <Chip 
                                        label={c.statut} 
                                        size="small" 
                                        color={c.statut === 'ACTIF' ? 'success' : 'error'}
                                        sx={{ fontSize: '0.65rem', height: 16 }}
                                      />
                                    </Box>
                                  ))}
                                  {(!client.comptes || client.comptes.length === 0) && (
                                    <Typography variant="caption" color="text.secondary">Aucun compte</Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography color="#54E3FF" sx={{fontWeight: 700}}>
                                  {totalSolde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleOpenClientDetails(client)}
                                    sx={{ borderRadius: '5px', py: 0.5, fontSize: '0.75rem', borderColor: '#54E3FF', color: 'primary.main' }}
                                  >
                                    Inspecter profil
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filteredClients.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Aucun client trouvé.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  </Box>
                </Box>
              )}

              {/* TAB 2: Transactions Flow */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h5" color="text.primary" sx={{fontWeight: 700, mb: 3}}>
                    Journal Global des Transactions Banque
                  </Typography>

                  <Box className="responsive-table-wrapper">
                    <TableContainer component={Paper} sx={{ borderRadius: '5px', overflow: 'hidden', boxShadow: 'none', bgcolor: 'background.paper' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Source</TableCell>
                          <TableCell>Destination</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Montant</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.map((t) => (
                          <TableRow key={t.id} hover>
                            <TableCell>
                              <Typography variant="body2">{new Date(t.dateOperation).toLocaleString('fr-FR')}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={t.type} 
                                color={t.type === 'DEPOT' ? 'success' : t.type === 'VIREMENT' ? 'primary' : 'error'}
                                size="small"
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell>
                              {t.compteSource ? (
                                <Box>
                                  <Typography variant="body2" sx={{fontWeight: 600}}>
                                    {(t.compteSource as any).client?.prenom} {(t.compteSource as any).client?.nom}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }} color="text.secondary">
                                    {t.compteSource.numeroCompte}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography color="text.secondary" variant="body2">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {t.compteDestination ? (
                                <Box>
                                  <Typography variant="body2" sx={{fontWeight: 600}}>
                                    {(t.compteDestination as any).client?.prenom} {(t.compteDestination as any).client?.nom}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }} color="text.secondary">
                                    {t.compteDestination.numeroCompte}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography color="text.secondary" variant="body2">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{fontWeight: 500}}>{t.description}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography color={t.type === 'DEPOT' ? '#10B981' : '#EF4444'} sx={{fontWeight: 800}}>
                                {t.type === 'DEPOT' ? '+' : '-'}{t.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        {transactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                              <Typography color="text.secondary">Aucune transaction enregistrée.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  </Box>
                </Box>
              )}

              {/* TAB 3: settings */}
              {activeTab === 3 && (
                <Stack spacing={4}>
                  <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
                    <Typography variant="h5" color="text.primary" sx={{fontWeight: 800, mb: 3}}>
                      Détails de votre Profil Conseiller
                    </Typography>

                    {profileError && <Alert severity="error" sx={{ mb: 3, borderRadius: '5px' }}>{profileError}</Alert>}
                    {profileSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: '5px' }}>{profileSuccess}</Alert>}

                    <Grid container spacing={4}>
                      <Grid sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} size={{xs: 12, md: 4}}>
                        <Box sx={{ position: 'relative', mb: 2 }}>
                          <Avatar 
                            src={user?.avatar}
                            sx={{ width: 110, height: 110, bgcolor: 'primary.main', color: '#000000', fontSize: '3rem', fontWeight: 'bold', boxShadow: 'none' }}
                          >
                            {!user?.avatar && `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`}
                          </Avatar>
                          
                          <Button
                            variant="contained"
                            component="label"
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: -10,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              borderRadius: '5px',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.7rem',
                              textTransform: 'none',
                              bgcolor: '#54E3FF',
                              color: 'black',
                              '&:hover': { bgcolor: '#3B82F6' }
                            }}
                          >
                            Changer
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleAvatarUpload}
                            />
                          </Button>
                        </Box>

                        <Typography variant="h6" color="text.primary" sx={{fontWeight: 800, mt: 1}}>
                          {user?.prenom} {user?.nom}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                          {user?.email}
                        </Typography>
                        
                        <Chip label="Conseiller Client" color="primary" sx={{ fontWeight: 700 }} />
                      </Grid>

                      <Grid size={{xs: 12, md: 8}}>
                        <Typography variant="subtitle1" color="text.primary" sx={{fontWeight: 700, mb: 2}}>
                          Modifier mes informations
                        </Typography>
                        
                        <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                          <Grid container spacing={2}>
                            <Grid size={{xs: 12, sm: 6}}>
                              <TextField
                                fullWidth
                                label="Prénom"
                                size="small"
                                value={profilePrenom}
                                onChange={(e) => setProfilePrenom(e.target.value)}
                              />
                            </Grid>
                            <Grid size={{xs: 12, sm: 6}}>
                              <TextField
                                fullWidth
                                label="Nom"
                                size="small"
                                value={profileNom}
                                onChange={(e) => setProfileNom(e.target.value)}
                              />
                            </Grid>
                            <Grid size={{xs: 12}}>
                              <TextField
                                fullWidth
                                label="Adresse e-mail"
                                size="small"
                                value={profileEmail}
                                onChange={(e) => setProfileEmail(e.target.value)}
                              />
                            </Grid>
                          </Grid>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={profileLoading}
                            sx={{ alignSelf: 'flex-start', bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
                          >
                            {profileLoading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Password Changer */}
                  <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
                    <Typography variant="h6" color="text.primary" sx={{fontWeight: 700, mb: 1}}>
                      Sécurité & Mot de passe
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                      Mettez à jour votre mot de passe pour sécuriser votre compte.
                    </Typography>

                    {passwordError && <Alert severity="error" sx={{ mb: 2, borderRadius: '5px' }}>{passwordError}</Alert>}
                    {passwordSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '5px' }}>{passwordSuccess}</Alert>}

                    <Box component="form" onSubmit={handleUpdatePassword} sx={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField 
                        fullWidth
                        size="small"
                        label="Mot de passe actuel"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                      <TextField 
                        fullWidth
                        size="small"
                        label="Nouveau mot de passe"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <TextField 
                        fullWidth
                        size="small"
                        label="Confirmer le nouveau mot de passe"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={passwordLoading}
                        sx={{ mt: 1, alignSelf: 'flex-start', bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
                      >
                        {passwordLoading ? 'Mise à jour...' : 'Changer le mot de passe'}
                      </Button>
                    </Box>
                  </Paper>
                </Stack>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Mobile bottom navigation bar */}
      <Box className="mobile-nav-capsule" sx={{ display: { xs: 'flex', md: 'none' } }}>
        <Box 
          className={`mobile-nav-item ${activeTab === 0 ? 'active' : ''}`} 
          onClick={() => setActiveTab(0)}
        >
          <div className="mobile-nav-active-glow" />
          <BadgeRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">KYC</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 1 ? 'active' : ''}`} 
          onClick={() => setActiveTab(1)}
        >
          <div className="mobile-nav-active-glow" />
          <PeopleAltRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Clients</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 2 ? 'active' : ''}`} 
          onClick={() => setActiveTab(2)}
        >
          <div className="mobile-nav-active-glow" />
          <CompareArrowsRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Trans.</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 3 ? 'active' : ''}`} 
          onClick={() => setActiveTab(3)}
        >
          <div className="mobile-nav-active-glow" />
          <SettingsOutlinedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Profil</span>
        </Box>
        <Box 
          className="mobile-nav-item" 
          onClick={() => setMobileMenuOpen(true)}
        >
          <MenuRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Plus</span>
        </Box>
      </Box>
    </Box>
  );
}
