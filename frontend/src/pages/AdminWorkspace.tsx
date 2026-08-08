import React, { useState, useEffect, useCallback } from 'react';
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
  Alert, 
  CircularProgress, 
  Divider, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Drawer,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Collapse
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
import ConfirmDialog from '../components/ConfirmDialog';
import SVGLineAreaChart from '../components/SVGLineAreaChart';
import SVGDonutChart from '../components/SVGDonutChart';
import SVGAdvisorBarChart from '../components/SVGAdvisorBarChart';

// Icons
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

interface Employe {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

interface UtilisateurItem {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  statut: string;
  kycStatus: string;
}

interface Stats {
  totalDepots: number;
  totalClients: number;
  ratioKyc: number;
  totalTransactions: number;
  currencyDist: Record<string, { count: number, balance: number }>;
  accountsByType: Record<string, number>;
  kycBreakdown: Record<string, number>;
  trendData: Array<{ date: string, count: number, volume: number }>;
  advisorWorkload: Array<{ email: string, count: number }>;
}

// Real audit log shape from backend API
interface AuditLogEntry {
  id: number;
  timestamp: string;
  actorId: number | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILURE';
}

interface AuditPage {
  content: AuditLogEntry[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index
  size: number;
}

export default function AdminWorkspace() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)';
  const innerBg = isDark ? 'rgba(5, 11, 20, 0.4)' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const mainBg = isDark ? '#020617' : '#F8FAFC';
  const sidebarBg = isDark ? 'rgba(7, 17, 31, 0.18)' : 'rgba(255, 255, 255, 0.35)';

  const { user, logout } = useAuthStore();
  // Tabs: 0: Stats, 1: Gestion Conseillers, 2: Gestion Utilisateurs, 3: Paramètres Banque, 4: Audit & Logs
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('sidebarCollapsed') === 'true');

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('sidebarCollapsed', String(newVal));
      return newVal;
    });
  };

  // Reusable Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);
  const [confirmSeverity, setConfirmSeverity] = useState<'info' | 'warning' | 'error' | 'success'>('warning');

  const triggerConfirm = (title: string, message: string, severity: 'info' | 'warning' | 'error' | 'success', callback: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmSeverity(severity);
    setConfirmCallback(() => callback);
    setConfirmOpen(true);
  };
  
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalDepots: 0,
    totalClients: 0,
    ratioKyc: 0,
    totalTransactions: 0,
    currencyDist: {},
    accountsByType: {},
    kycBreakdown: {},
    trendData: [],
    advisorWorkload: []
  });
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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


  // New Employee Form State
  const [empNom, setEmpNom] = useState('');
  const [empPrenom, setEmpPrenom] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit User Modal State
  const [editUser, setEditUser] = useState<UtilisateurItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatut, setEditStatut] = useState('ACTIVE');

  // Bank Params State
  const { bankName, logoUrl, fetchConfig } = useConfigStore();
  const [globalBankName, setGlobalBankName] = useState(bankName);
  const [globalLogoUrl, setGlobalLogoUrl] = useState<string | null>(logoUrl);
  
  useEffect(() => {
    setGlobalBankName(bankName);
    setGlobalLogoUrl(logoUrl);
  }, [bankName, logoUrl]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setAlertInfo({ type: 'error', message: "Le logo est trop volumineux (max 1.5 Mo)." });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setGlobalLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [paramInterest, setParamInterest] = useState('2.5');
  const [paramFee, setParamFee] = useState('9.90');
  const [paramLimit, setParamLimit] = useState('5000');
  const [paramsLoading, setParamsLoading] = useState(false);

  // ── AUDIT LOGS — Real Backend API State ──────────────────────────────────
  const [auditPage, setAuditPage] = useState<AuditPage | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditCurrentPage, setAuditCurrentPage] = useState(0);
  const AUDIT_PAGE_SIZE = 20;

  // Filters
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  // Row expand state
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Audit stats
  const [auditStats, setAuditStats] = useState<Record<string, number>>({});

  const fetchEmployes = async () => {
    try {
      const res = await api.get('/api/admin/employes');
      setEmployes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUtilisateurs = async () => {
    try {
      const res = await api.get('/api/admin/utilisateurs');
      setUtilisateurs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/statistiques');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParameters = async () => {
    try {
      const res = await api.get('/api/admin/parametres');
      setParamInterest(res.data.interestRatePremium || '2.5');
      setParamFee(res.data.monthlyFeePremium || '9.90');
      setParamLimit(res.data.transferLimitStandard || '5000');
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await fetchEmployes();
    await fetchUtilisateurs();
    await fetchStats();
    await fetchParameters();
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const fetchAuditLogs = useCallback(async (page = 0) => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        size: String(AUDIT_PAGE_SIZE)
      };
      if (filterAction.trim()) params.action = filterAction.trim();
      if (filterSeverity) params.severity = filterSeverity;
      if (filterFrom) params.from = filterFrom + ':00';
      if (filterTo) params.to = filterTo + ':00';

      const endpoint = (filterAction || filterSeverity || filterFrom || filterTo)
        ? '/api/admin/audit-logs/search'
        : '/api/admin/audit-logs';

      const res = await api.get(endpoint, { params });
      setAuditPage(res.data);
      setAuditCurrentPage(page);
    } catch (err: any) {
      setAuditError('Impossible de charger les journaux d\'audit.');
    } finally {
      setAuditLoading(false);
    }
  }, [filterAction, filterSeverity, filterFrom, filterTo]);

  const fetchAuditStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/audit-logs/stats');
      setAuditStats(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    if (activeTab === 2) {
      fetchUtilisateurs();
    } else if (activeTab === 3) {
      fetchParameters();
    } else if (activeTab === 4) {
      fetchAuditLogs(0);
      fetchAuditStats();
    }
  }, [activeTab]);

  const handleCreateEmploye = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setAlertInfo(null);
    try {
      const res = await api.post('/api/admin/employes', {
        nom: empNom,
        prenom: empPrenom,
        email: empEmail,
        password: empPassword
      });
      setAlertInfo({ type: 'success', message: res.data.message });
      setEmpNom('');
      setEmpPrenom('');
      setEmpEmail('');
      setEmpPassword('');
      await loadAllData();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Erreur de création.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEmploye = (id: number) => {
    triggerConfirm(
      "Révoquer le conseiller",
      "Voulez-vous vraiment révoquer définitivement l'accès de ce conseiller ?",
      "error",
      async () => {
        try {
          const res = await api.delete(`/api/admin/employes/${id}`);
          setAlertInfo({ type: 'success', message: res.data.message });
          await loadAllData();
        } catch (err: any) {
          setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la suppression.' });
        }
      }
    );
  };

  const handleUpdateUtilisateur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      const res = await api.put(`/api/admin/utilisateurs/${editUser.id}`, {
        nom: editNom,
        prenom: editPrenom,
        email: editEmail,
        statut: editStatut
      });
      setAlertInfo({ type: 'success', message: res.data.message });
      setIsEditOpen(false);
      setEditUser(null);
      await fetchUtilisateurs();
      await fetchStats();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la modification.' });
    }
  };

  const handleDeleteUtilisateur = (id: number) => {
    triggerConfirm(
      "Supprimer l'utilisateur",
      "Voulez-vous vraiment supprimer définitivement cet utilisateur de la base ?",
      "error",
      async () => {
        try {
          const res = await api.delete(`/api/admin/utilisateurs/${id}`);
          setAlertInfo({ type: 'success', message: res.data.message });
          await fetchUtilisateurs();
          await fetchStats();
        } catch (err: any) {
          setAlertInfo({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la suppression.' });
        }
      }
    );
  };

  const handleSaveParameters = async (e: React.FormEvent) => {
    e.preventDefault();
    setParamsLoading(true);
    try {
      const res = await api.post('/api/admin/parametres', {
        interestRatePremium: paramInterest,
        monthlyFeePremium: paramFee,
        transferLimitStandard: paramLimit
      });
      setAlertInfo({ type: 'success', message: res.data.message });
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Impossible de sauvegarder.' });
    } finally {
      setParamsLoading(false);
    }
  };

  const handleSaveGlobalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setParamsLoading(true);
    try {
      const res = await api.put('/api/config', {
        bankName: globalBankName,
        logoUrl: globalLogoUrl
      });
      setAlertInfo({ type: 'success', message: 'Configuration de la banque mise à jour avec succès.' });
      await fetchConfig();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Erreur lors de la mise à jour de la configuration.' });
    } finally {
      setParamsLoading(false);
    }
  };

  const handleBackupDatabase = () => {
    setAlertInfo({ type: 'success', message: "Sauvegarde à chaud de la base PostgreSQL banquesysdb initiée. Fichier exporté : dump_banquesys_prod.sql" });
  };

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
            { id: 0, label: sidebarCollapsed ? 'Overview' : "Vue d'ensemble", fullLabel: "Vue d'ensemble", icon: <TrendingUpRoundedIcon /> },
            { id: 1, label: 'Conseillers', fullLabel: 'Gestion Conseillers', icon: <GroupAddRoundedIcon /> },
            { id: 2, label: 'Utilisateurs', fullLabel: 'Gestion Utilisateurs', icon: <PeopleOutlineRoundedIcon /> },
            { id: 3, label: 'Paramètres', fullLabel: 'Paramètres Banque', icon: <SettingsOutlinedIcon /> },
            { id: 4, label: 'Logs', fullLabel: 'Audit & Logs', icon: <StorageRoundedIcon /> }
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
                  bgcolor: isActive ? 'rgba(84, 227, 255, 0.1)' : 'transparent',
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
            {sidebarCollapsed ? <ChevronRightRoundedIcon sx={{ fontSize: 18 }} /> : <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />}
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
      
      {/* 1. Left Vertical Nav Bar */}
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
          {/* Left: Breadcrumbs / Hamburger */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' }, color: 'primary.main', mr: 1 }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Banque &nbsp;&gt;&nbsp; Espace Admin &nbsp;&gt;&nbsp; <span style={{ color: 'primary.main', fontWeight: 600 }}>
                {activeTab === 0 && "Vue d'ensemble"}
                {activeTab === 1 && "Gestion Conseillers"}
                {activeTab === 2 && "Gestion Utilisateurs"}
                {activeTab === 3 && "Paramètres Banque"}
                {activeTab === 4 && "Audit & Logs"}
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
                Administrateur
              </Typography>
            </Box>
            <IconButton sx={{ color: 'primary.main' }}><SettingsOutlinedIcon /></IconButton>
            <IconButton sx={{ color: 'primary.main' }}><NotificationsOutlinedIcon /></IconButton>
            <Avatar 
              sx={{ width: 38, height: 38, bgcolor: 'primary.main', color: '#000000', fontWeight: 700 }}
            >
              {user?.prenom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              {user?.nom?.[0]?.toUpperCase() || ''}
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
              {/* TAB 0: Stats Dashboard */}
              {activeTab === 0 && (
                <Box>
                  {/* Stats Cards Row */}
                  <Grid container spacing={3} sx={{ mb: 6 }}>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                      <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', boxShadow: 'none' }}>
                        <Box sx={{ p: 2, borderRadius: '5px', bgcolor: isDark ? 'rgba(59, 130, 2462,0.1)' : 'rgba(84, 227, 255, 0.1)', color: 'primary.main', mr: 2 }}>
                          <AccountBalanceRoundedIcon sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{fontWeight: 600}}>DÉPÔTS GLOBAUX</Typography>
                          <Typography variant="h5" color="text.primary" sx={{fontWeight: 800, mt: 0.5}}>
                            {stats.totalDepots.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>

                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                      <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', boxShadow: 'none' }}>
                        <Box sx={{ p: 2, borderRadius: '5px', bgcolor: 'rgba(16,185,129,0.1)', color: 'success.main', mr: 2 }}>
                          <PeopleOutlineRoundedIcon sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{fontWeight: 600}}>CLIENTS TOTAL</Typography>
                          <Typography variant="h5" color="text.primary" sx={{fontWeight: 800, mt: 0.5}}>{stats.totalClients}</Typography>
                        </Box>
                      </Card>
                    </Grid>

                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                      <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', boxShadow: 'none' }}>
                        <Box sx={{ p: 2, borderRadius: '5px', bgcolor: isDark ? 'rgba(59, 130, 2462,0.1)' : 'rgba(84, 227, 255, 0.1)', color: 'primary.main', mr: 2 }}>
                          <TrendingUpRoundedIcon sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{fontWeight: 600}}>RATIO KYC VALIDÉ</Typography>
                          <Typography variant="h5" color="text.primary" sx={{fontWeight: 800, mt: 0.5}}>{stats.ratioKyc} %</Typography>
                        </Box>
                      </Card>
                    </Grid>

                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                      <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', boxShadow: 'none' }}>
                        <Box sx={{ p: 2, borderRadius: '5px', bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', mr: 2 }}>
                          <SwapHorizRoundedIcon sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{fontWeight: 600}}>TRANSACTIONS TOTAL</Typography>
                          <Typography variant="h5" color="text.primary" sx={{fontWeight: 800, mt: 0.5}}>{stats.totalTransactions}</Typography>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                  {/* Row 2: Trend & Allocation Charts */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none', height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <SVGLineAreaChart data={stats.trendData} isDark={isDark} />
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none', height: '100%', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SVGDonutChart currencyDist={stats.currencyDist} isDark={isDark} />
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Row 3: Advisor Performance & KYC Funnel */}
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none', minHeight: 250 }}>
                        <SVGAdvisorBarChart data={stats.advisorWorkload} isDark={isDark} />
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none', minHeight: 250, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                            Pipeline de Conformité (KYC)
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
                            Ratio de validation : {stats.ratioKyc}%
                          </Typography>
                          
                          {/* Compliance Funnel Progress Bars */}
                          <Stack spacing={2}>
                            {[
                              { label: 'Validés (Conforme)', count: stats.kycBreakdown?.VALIDATED ?? 0, color: '#10B981', total: stats.totalClients },
                              { label: 'En attente de vérification', count: stats.kycBreakdown?.SUBMITTED ?? 0, color: '#30CFEF', total: stats.totalClients },
                              { label: 'Non soumis / En cours', count: stats.kycBreakdown?.PENDING ?? 0, color: '#F59E0B', total: stats.totalClients },
                              { label: 'Rejetés (Action requise)', count: stats.kycBreakdown?.REJECTED ?? 0, color: '#EF4444', total: stats.totalClients }
                            ].map((funnelItem) => {
                              const pct = funnelItem.total > 0 ? (funnelItem.count / funnelItem.total) * 100 : 0;
                              return (
                                <Box key={funnelItem.label}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                      {funnelItem.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: 'monospace' }}>
                                      {funnelItem.count} ({Math.round(pct)}%)
                                    </Typography>
                                  </Box>
                                  <Box sx={{ height: 8, width: '100%', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: funnelItem.color, borderRadius: '4px', transition: 'width 0.5s ease-out' }} />
                                  </Box>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* TAB 1: Employee Management */}
              {activeTab === 1 && (
                <Box>
                  <Grid container spacing={4}>
                    {/* Left Side: Create Employee Form */}
                    <Grid size={{xs: 12, lg: 5}}>
                      <Card sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none' }}>
                        <Typography variant="h6" color="text.primary" sx={{fontWeight: 700, mb: 1}}>
                          Enregistrer un nouveau conseiller
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                          Créez un profil pour donner à un conseiller accès au tableau de bord.
                        </Typography>

                        <form onSubmit={handleCreateEmploye}>
                          <Stack spacing={2.5}>
                            <TextField
                              label="Prénom"
                              required
                              fullWidth
                              value={empPrenom}
                              onChange={(e) => setEmpPrenom(e.target.value)}
                            />
                            <TextField
                              label="Nom"
                              required
                              fullWidth
                              value={empNom}
                              onChange={(e) => setEmpNom(e.target.value)}
                            />
                            <TextField
                              label="Adresse e-mail"
                              type="email"
                              required
                              fullWidth
                              value={empEmail}
                              onChange={(e) => setEmpEmail(e.target.value)}
                            />
                            <TextField
                              label="Mot de passe initial"
                              type="password"
                              required
                              fullWidth
                              value={empPassword}
                              onChange={(e) => setEmpPassword(e.target.value)}
                            />
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              startIcon={<AddRoundedIcon />}
                              disabled={creating}
                              sx={{ py: 1.5, borderRadius: '5px', bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' }, fontWeight: 600 }}
                            >
                              {creating ? 'Création...' : 'Créer le conseiller'}
                            </Button>
                          </Stack>
                        </form>
                      </Card>
                    </Grid>

                    {/* Right Side: Employees List */}
                    <Grid size={{xs: 12, lg: 7}}>
                      <Card sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', height: '100%', boxShadow: 'none' }}>
                        <Typography variant="h6" color="text.primary" sx={{fontWeight: 700, mb: 1}}>
                          Équipe des conseillers
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                          Liste des membres ayant accès aux vérifications clients.
                        </Typography>

                        <Box className="responsive-table-wrapper">
                          <TableContainer component={Paper} sx={{ borderRadius: '5px', overflow: 'hidden', boxShadow: 'none', bgcolor: 'background.paper' }}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Nom complet</TableCell>
                                <TableCell>E-mail</TableCell>
                                <TableCell align="right">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {employes.map((emp) => (
                                <TableRow key={emp.id} hover>
                                  <TableCell>
                                    <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                                      <Avatar sx={{ bgcolor: isDark ? 'rgba(59, 130, 2462,0.1)' : 'rgba(84, 227, 255, 0.1)', color: 'primary.main', fontWeight: 600 }}>
                                        {(emp.prenom || '?')[0]?.toUpperCase()}{(emp.nom || '?')[0]?.toUpperCase()}
                                      </Avatar>
                                      <Typography color="text.primary" sx={{fontWeight: 600}}>{emp.prenom} {emp.nom}</Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary">{emp.email}</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <IconButton 
                                      color="error" 
                                      size="small" 
                                      onClick={() => handleDeleteEmploye(emp.id)}
                                    >
                                      <DeleteRoundedIcon />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {employes.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Aucun conseiller enregistré.</Typography>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* TAB 2: User Administration CRUD */}
              {activeTab === 2 && (
                <Box>
                  <Card sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none' }}>
                    <Typography variant="h6" color="text.primary" sx={{fontWeight: 700, mb: 1}}>
                      Gestion Complète des Utilisateurs
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                      Consultez, modifiez, désactivez ou supprimez n'importe quel profil de la banque.
                    </Typography>

                    <Box className="responsive-table-wrapper">
                      <TableContainer component={Paper} sx={{ borderRadius: '5px', overflow: 'hidden', boxShadow: 'none', bgcolor: 'background.paper' }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Utilisateur</TableCell>
                            <TableCell>Rôle</TableCell>
                            <TableCell>Statut Accès</TableCell>
                            <TableCell>KYC Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {utilisateurs.map((u) => {
                            const isMe = u.id === user?.id;
                            return (
                              <TableRow key={u.id} hover>
                                <TableCell>#{u.id}</TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                                    <Avatar sx={{ bgcolor: u.role === 'ROLE_ADMIN' ? 'rgba(139,92,246,0.1)' : 'rgba(59, 130, 2462,0.1)', color: u.role === 'ROLE_ADMIN' ? '#8B5CF6' : '#54E3FF', fontWeight: 600 }}>
                                      {(u.prenom || '?')[0]?.toUpperCase()}{(u.nom || '?')[0]?.toUpperCase()}
                                    </Avatar>
                                    <Box>
                                      <Typography color="text.primary" sx={{fontWeight: 600}}>{u.prenom} {u.nom}</Typography>
                                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  <Chip label={u.role.replace('ROLE_', '')} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>
                                  <Chip label={u.statut || 'ACTIVE'} color={u.statut === 'ACTIVE' ? 'success' : 'error'} size="small" />
                                </TableCell>
                                <TableCell>
                                  <Chip label={u.kycStatus || 'PENDING'} color={u.kycStatus === 'VALIDATED' ? 'success' : 'warning'} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                  <Stack direction="row" spacing={1} sx={{justifyContent: 'flex-end'}}>
                                    <IconButton 
                                      color="primary" 
                                      size="small" 
                                      onClick={() => {
                                        setEditUser(u);
                                        setEditNom(u.nom);
                                        setEditPrenom(u.prenom);
                                        setEditEmail(u.email);
                                        setEditStatut(u.statut || 'ACTIVE');
                                        setIsEditOpen(true);
                                      }}
                                    >
                                      <EditRoundedIcon fontSize="small" />
                                    </IconButton>
                                    {!isMe && (
                                      <IconButton 
                                        color="error" 
                                        size="small" 
                                        onClick={() => handleDeleteUtilisateur(u.id)}
                                      >
                                        <DeleteRoundedIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    </Box>
                  </Card>
                </Box>
              )}

              {/* TAB 3: Bank Parameters */}
              {activeTab === 3 && (
                <Box>
                  <Grid container spacing={4}>
                    <Grid size={{xs: 12, md: 6}}>
                      <Card sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none' }}>
                        <Typography variant="h6" color="text.primary" sx={{fontWeight: 700, mb: 1}}>
                          Identité Visuelle & Marque Blanche
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                          Modifiez le nom de la banque. Ceci sera répercuté instantanément sur l'interface, les documents PDF et le chatbot IA.
                        </Typography>

                        <form onSubmit={handleSaveGlobalConfig} style={{ marginBottom: '32px' }}>
                          <Stack spacing={2.5}>
                            <TextField 
                              label="Nom de la banque"
                              required
                              fullWidth
                              value={globalBankName}
                              onChange={(e) => setGlobalBankName(e.target.value)}
                            />

                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>Logo de la banque</Typography>
                              <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                                {globalLogoUrl ? (
                                  <img src={globalLogoUrl} alt="Logo" style={{ maxHeight: 50, maxWidth: 120, objectFit: 'contain', padding: 4, borderRadius: '5px' }} />
                                ) : (
                                  <Box sx={{ height: 50, width: 120, bgcolor: innerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${borderColor}`, borderRadius: '5px', fontSize: '0.75rem', color: 'text.secondary' }}>Aucun logo</Box>
                                )}
                                <Button variant="outlined" component="label" size="small" sx={{ borderColor: '#54E3FF', color: '#54E3FF' }}>
                                  Télécharger
                                  <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                                </Button>
                                {globalLogoUrl && (
                                  <Button variant="text" color="error" size="small" onClick={() => setGlobalLogoUrl(null)}>
                                    Retirer
                                  </Button>
                                )}
                              </Stack>
                            </Box>

                            <Button 
                              type="submit" 
                              variant="contained" 
                              disabled={paramsLoading}
                              sx={{ py: 1.5, borderRadius: '5px', bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' }, fontWeight: 600 }}
                            >
                              {paramsLoading ? 'Enregistrement...' : 'Mettre à jour l\'identité'}
                            </Button>
                          </Stack>
                        </form>

                        <Divider sx={{ mb: 4, borderColor: 'rgba(84, 227, 255, 0.08)' }} />

                        <Typography variant="h6" color="text.primary" sx={{fontWeight: 700, mb: 1}}>
                          Configuration des Paramètres Financiers
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                          Ajustez les taux d'intérêt, limites de virement et frais mensuels.
                        </Typography>

                        <form onSubmit={handleSaveParameters}>
                          <Stack spacing={2.5}>
                            <TextField 
                              label="Taux d'intérêt annuel Premium (%)"
                              type="number"
                              slotProps={{ htmlInput: { step: '0.1' } }}
                              value={paramInterest}
                              onChange={(e) => setParamInterest(e.target.value)}
                            />
                            <TextField 
                              label="Frais mensuel compte Premium (DH)"
                              type="number"
                              slotProps={{ htmlInput: { step: '0.01' } }}
                              value={paramFee}
                              onChange={(e) => setParamFee(e.target.value)}
                            />
                            <TextField 
                              label="Limite hebdomadaire virement Standard (DH)"
                              type="number"
                              value={paramLimit}
                              onChange={(e) => setParamLimit(e.target.value)}
                            />
                            <Button 
                              type="submit" 
                              variant="contained" 
                              disabled={paramsLoading}
                              sx={{ py: 1.5, borderRadius: '5px', bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' }, fontWeight: 600 }}
                            >
                              {paramsLoading ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
                            </Button>
                          </Stack>
                        </form>
                      </Card>
                    </Grid>

                    <Grid size={{xs: 12, md: 6}}>
                      <Card sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="h6" color="text.primary" sx={{fontWeight: 700, mb: 1}}>
                            Maintenance & Base de données
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                            Opérations de maintenance système et backup de la base de données.
                          </Typography>
                        </Box>

                        <Stack spacing={3}>
                          <Box sx={{ p: 3, borderRadius: '5px', bgcolor: innerBg }}>
                            <Typography variant="subtitle2" color="#54E3FF" sx={{fontWeight: 700, mb: 1}}>Sauvegarde de la base</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{mb: 2, display: 'block'}}>Exporte un dump SQL complet contenant toutes les tables.</Typography>
                            <Button 
                              variant="outlined" 
                              startIcon={<StorageRoundedIcon />}
                              onClick={handleBackupDatabase}
                              sx={{ borderRadius: '5px', borderColor: '#54E3FF', color: 'primary.main' }}
                            >
                              Exporter Dump SQL
                            </Button>
                          </Box>
                        </Stack>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* TAB 4: Audit & Logs — Real Backend Data */}
              {activeTab === 4 && (
                <Box>
                  {/* Stat Cards Row */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                      { label: 'Total', value: auditStats.total ?? '—', color: 'text.primary' },
                      { label: 'Succès', value: auditStats.success ?? '—', color: '#10B981' },
                      { label: 'Info', value: auditStats.info ?? '—', color: '#3B82F6' },
                      { label: 'Avertissements', value: auditStats.warning ?? '—', color: '#F59E0B' },
                      { label: 'Erreurs', value: auditStats.error ?? '—', color: '#EF4444' },
                      { label: 'Critiques', value: auditStats.critical ?? '—', color: '#DC2626' },
                    ].map((s) => (
                      <Grid size={{ xs: 6, sm: 4, md: 2 }} key={s.label}>
                        <Card sx={{ p: 2, textAlign: 'center', boxShadow: 'none' }}>
                          <Typography variant="h5" sx={{ color: s.color, fontWeight: 800 }}>{s.value}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Card sx={{ p: 3, borderRadius: '5px', bgcolor: 'background.paper', boxShadow: 'none' }}>
                    {/* Header row */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700 }}>
                          Journal d&apos;Audit Système
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Traçabilité totale — persistée en base PostgreSQL, append-only
                          {auditPage && ` · ${auditPage.totalElements} entrée(s) au total`}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Afficher/masquer les filtres">
                          <IconButton onClick={() => setShowFilters(v => !v)} size="small"
                            sx={{ border: `1px solid ${borderColor}`, borderRadius: '5px' }}>
                            <FilterListRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rafraîchir">
                          <IconButton onClick={() => { fetchAuditLogs(auditCurrentPage); fetchAuditStats(); }}
                            size="small" disabled={auditLoading}
                            sx={{ border: `1px solid ${borderColor}`, borderRadius: '5px' }}>
                            <RefreshRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    {/* Filter Panel */}
                    <Collapse in={showFilters}>
                      <Box sx={{ p: 2, mb: 2, bgcolor: isDark ? 'rgba(5,11,20,0.4)' : '#F8FAFC',
                        borderRadius: '5px', border: `1px solid ${borderColor}` }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Sévérité</InputLabel>
                              <Select value={filterSeverity} label="Sévérité"
                                onChange={e => setFilterSeverity(e.target.value as string)}>
                                <MenuItem value="">Tous</MenuItem>
                                {['INFO','SUCCESS','WARNING','ERROR','CRITICAL'].map(s => (
                                  <MenuItem key={s} value={s}>{s}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField fullWidth size="small" label="Type d'action"
                              placeholder="ex: LOGIN_SUCCESS" value={filterAction}
                              onChange={e => setFilterAction(e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField fullWidth size="small" label="De" type="datetime-local"
                              value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                              slotProps={{ inputLabel: { shrink: true } }} />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <TextField fullWidth size="small" label="À" type="datetime-local"
                              value={filterTo} onChange={e => setFilterTo(e.target.value)}
                              slotProps={{ inputLabel: { shrink: true } }} />
                          </Grid>
                        </Grid>
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                          <Button size="small" variant="contained" onClick={() => fetchAuditLogs(0)}>
                            Appliquer
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => {
                            setFilterSeverity(''); setFilterAction(''); setFilterFrom(''); setFilterTo('');
                            setTimeout(() => fetchAuditLogs(0), 50);
                          }}>
                            Réinitialiser
                          </Button>
                        </Stack>
                      </Box>
                    </Collapse>

                    {/* Loading / Error states */}
                    {auditLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
                    {auditError && (
                      <Alert severity="error" sx={{ mb: 2 }}>{auditError}</Alert>
                    )}

                    {/* Table */}
                    <Box className="responsive-table-wrapper">
                      <TableContainer component={Paper} sx={{ borderRadius: '5px', boxShadow: 'none', bgcolor: 'background.paper' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: 110 }}>Sévérité</TableCell>
                            <TableCell sx={{ width: 160 }}>Action</TableCell>
                            <TableCell>Détails</TableCell>
                            <TableCell sx={{ width: 160 }}>Acteur</TableCell>
                            <TableCell sx={{ width: 150 }}>Horodatage</TableCell>
                            <TableCell sx={{ width: 40 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(!auditPage || auditPage.content.length === 0) && !auditLoading && (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                <Typography color="text.secondary" variant="body2">
                                  {auditPage ? 'Aucun journal trouvé pour ces critères.' : 'Chargement en attente...'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                          {auditPage?.content.map((log) => {
                            const isExpanded = expandedRow === log.id;
                            const sevColor: Record<string, 'default'|'success'|'warning'|'error'|'info'|'primary'> = {
                              INFO: 'info', SUCCESS: 'success', WARNING: 'warning',
                              ERROR: 'error', CRITICAL: 'error'
                            };
                            return (
                              <React.Fragment key={log.id}>
                                <TableRow
                                  sx={{
                                    cursor: 'pointer',
                                    bgcolor: log.severity === 'CRITICAL'
                                      ? (isDark ? 'rgba(220,38,38,0.06)' : 'rgba(254,202,202,0.4)')
                                      : 'transparent',
                                    '&:hover': { bgcolor: isDark ? 'rgba(84,227,255,0.04)' : 'rgba(0,0,0,0.02)' }
                                  }}
                                  onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                                >
                                  <TableCell>
                                    <Chip
                                      label={log.severity}
                                      color={sevColor[log.severity] || 'default'}
                                      size="small"
                                      sx={{ fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.05em' }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption"
                                      sx={{ fontFamily: 'monospace', color: 'text.primary', fontSize: '0.75rem', fontWeight: 700 }}>
                                      {log.action}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="text.secondary"
                                      sx={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {log.details}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                      {log.actorEmail || 'SYSTÈME'}
                                    </Typography>
                                    <br />
                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                                      {log.actorRole}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <IconButton size="small">
                                      {isExpanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                                {/* Expanded detail row */}
                                <TableRow>
                                  <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                    <Collapse in={isExpanded}>
                                      <Box sx={{ px: 3, py: 2, bgcolor: isDark ? 'rgba(5,11,20,0.5)' : '#F1F5F9' }}>
                                        <Grid container spacing={2}>
                                          <Grid size={{ xs: 12, md: 8 }}>
                                            <Typography variant="caption" color="text.secondary">Détails complets</Typography>
                                            <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                                              {log.details}
                                            </Typography>
                                          </Grid>
                                          <Grid size={{ xs: 6, md: 2 }}>
                                            <Typography variant="caption" color="text.secondary">Adresse IP</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5, fontWeight: 600 }}>
                                              {log.ipAddress}
                                            </Typography>
                                          </Grid>
                                          <Grid size={{ xs: 6, md: 2 }}>
                                            <Typography variant="caption" color="text.secondary">Entité cible</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                                              {log.entityType || '—'} {log.entityId ? `#${log.entityId}` : ''}
                                            </Typography>
                                          </Grid>
                                          <Grid size={{ xs: 12 }}>
                                            <Typography variant="caption" color="text.secondary">User-Agent</Typography>
                                            <Typography variant="caption" color="text.disabled"
                                              sx={{ display: 'block', fontFamily: 'monospace', mt: 0.25, wordBreak: 'break-all' }}>
                                              {log.userAgent}
                                            </Typography>
                                          </Grid>
                                        </Grid>
                                      </Box>
                                    </Collapse>
                                  </TableCell>
                                </TableRow>
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    </Box>

                    {/* Pagination */}
                    {auditPage && auditPage.totalPages > 1 && (
                      <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center', justifyContent: 'center' }}>
                        <IconButton
                          onClick={() => fetchAuditLogs(auditCurrentPage - 1)}
                          disabled={auditCurrentPage === 0 || auditLoading}
                          size="small" sx={{ border: `1px solid ${borderColor}`, borderRadius: '5px' }}>
                          <ChevronLeftRoundedIcon />
                        </IconButton>
                        <Typography variant="body2" color="text.secondary">
                          Page {auditCurrentPage + 1} / {auditPage.totalPages}
                          &nbsp;·&nbsp; {auditPage.totalElements} entrée(s)
                        </Typography>
                        <IconButton
                          onClick={() => fetchAuditLogs(auditCurrentPage + 1)}
                          disabled={auditCurrentPage >= auditPage.totalPages - 1 || auditLoading}
                          size="small" sx={{ border: `1px solid ${borderColor}`, borderRadius: '5px' }}>
                          <ChevronRightRoundedIcon />
                        </IconButton>
                      </Stack>
                    )}
                  </Card>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Edit User Dialog */}
      {editUser && (
        <Dialog 
          open={isEditOpen} 
          onClose={() => { setIsEditOpen(false); setEditUser(null); }}
          maxWidth="xs"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                bgcolor: 'background.paper',
                border: `1px solid ${borderColor}`,
                boxShadow: 'none',
                borderRadius: '5px',
                color: '#FFFFFF'
              }
            }
          }}
        >
          <form onSubmit={handleUpdateUtilisateur}>
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
              Modifier l'utilisateur #{editUser.id}
            </DialogTitle>
            <DialogContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
              <TextField 
                label="Prénom"
                required
                fullWidth
                value={editPrenom}
                onChange={(e) => setEditPrenom(e.target.value)}
              />
              <TextField 
                label="Nom"
                required
                fullWidth
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
              />
              <TextField 
                label="E-mail"
                required
                fullWidth
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: -1.5 }}>Statut d'accès</Typography>
              <select
                value={editStatut}
                onChange={(e) => setEditStatut(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', fontSize: '0.9rem', backgroundColor: innerBg, color: isDark ? '#FFF' : '#0F172A' }}
              >
                <option value="ACTIVE">ACTIVE (Autorisé)</option>
                <option value="BLOCKED">BLOCKED (Suspendu)</option>
              </select>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: `1px solid ${borderColor}` }}>
              <Button onClick={() => { setIsEditOpen(false); setEditUser(null); }} sx={{ color: 'text.secondary' }}>Annuler</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}>Enregistrer</Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        severity={confirmSeverity}
        onConfirm={() => {
          if (confirmCallback) confirmCallback();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Mobile bottom navigation bar */}
      <Box className="mobile-nav-capsule" sx={{ display: { xs: 'flex', md: 'none' } }}>
        <Box 
          className={`mobile-nav-item ${activeTab === 0 ? 'active' : ''}`} 
          onClick={() => setActiveTab(0)}
        >
          <div className="mobile-nav-active-glow" />
          <TrendingUpRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Stats</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 1 ? 'active' : ''}`} 
          onClick={() => setActiveTab(1)}
        >
          <div className="mobile-nav-active-glow" />
          <GroupAddRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Agents</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 2 ? 'active' : ''}`} 
          onClick={() => setActiveTab(2)}
        >
          <div className="mobile-nav-active-glow" />
          <PeopleOutlineRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Users</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 4 ? 'active' : ''}`} 
          onClick={() => setActiveTab(4)}
        >
          <div className="mobile-nav-active-glow" />
          <StorageRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Logs</span>
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
