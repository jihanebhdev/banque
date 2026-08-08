import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Stack,
  Button,
  Grid,
  Divider,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Popover,
  Badge,
  InputAdornment,
  Drawer,
  Dialog,
  DialogContent,
  Tooltip
} from '@mui/material';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';
import api from '../api/axiosConfig';
import { useTheme } from '@mui/material/styles';
import { useThemeStore } from '../store/themeStore';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from '../i18n/translations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useConfigStore } from '../store/configStore';
import jsQR from 'jsqr';
import QrCodeRoundedIcon from '@mui/icons-material/QrCodeRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';

// Icons
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

// Helper to render basic markdown and emojis nicely in the chat message
const renderMessageText = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    let currentLine = line;
    const isBulletList = currentLine.trim().startsWith('* ') || currentLine.trim().startsWith('- ');
    const isNumberedList = /^\d+\.\s/.test(currentLine.trim());

    if (isBulletList) {
      currentLine = currentLine.trim().substring(2);
    } else if (isNumberedList) {
      const match = currentLine.trim().match(/^(\d+\.)\s(.*)/);
      if (match) {
        currentLine = match[2];
      }
    }

    // Parse bold text **text** -> <strong>text</strong>
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    while ((match = boldRegex.exec(currentLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push(currentLine.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index}>{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < currentLine.length) {
      parts.push(currentLine.substring(lastIndex));
    }

    const renderedContent = parts.length > 0 ? parts : currentLine;

    if (isBulletList) {
      return (
        <Box key={lineIdx} component="ul" sx={{ m: 0, pl: 2, pb: 0.5 }}>
          <Box component="li">
            <Typography variant="body2" sx={{ fontSize: '0.95rem', display: 'list-item' }}>
              {renderedContent}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (isNumberedList) {
      return (
        <Box key={lineIdx} component="ol" sx={{ m: 0, pl: 2, pb: 0.5 }}>
          <Box component="li">
            <Typography variant="body2" sx={{ fontSize: '0.95rem', display: 'list-item' }}>
              {renderedContent}
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Typography key={lineIdx} variant="body2" sx={{ fontSize: '0.95rem', minHeight: '1.2em', mb: lineIdx === lines.length - 1 ? 0 : 0.75 }}>
        {renderedContent}
      </Typography>
    );
  });
};

export default function Dashboard() {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const { t, language } = useTranslation();
  const { bankName } = useConfigStore();
  const isDark = theme.palette.mode === 'dark';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.75)';
  const innerBg = isDark ? 'rgba(5, 11, 20, 0.4)' : '#F8FAFC';
  const borderColor = isDark ? 'rgba(84, 227, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const mainBg = isDark ? '#020617' : '#F8FAFC';
  const sidebarBg = isDark ? 'rgba(7, 17, 31, 0.18)' : 'rgba(255, 255, 255, 0.35)';

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Active Tab: 'dashboard' | 'stats' | 'wallet' | 'transfers' | 'bills' | 'profile'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('sidebarCollapsed') === 'true');

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('sidebarCollapsed', String(newVal));
      return newVal;
    });
  };

  // States for dynamic data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentAccount, setCurrentAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // AI Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'bot', text: 'Bonjour ! Je suis votre conseiller virtuel Banque. Saisissez votre question ou tapez "aide" pour démarrer.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const chatEndRefPopup = useRef<HTMLDivElement>(null);
  const chatEndRefPage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        chatEndRefPopup.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    if (activeTab === 'chatbot') {
      setTimeout(() => {
        chatEndRefPage.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [chatMessages, activeTab]);

  // Support Conseiller State
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [advisorInfo, setAdvisorInfo] = useState<any>(null);
  const [supportInput, setSupportInput] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Password Update State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Profile Update State
  const [profilePhone, setProfilePhone] = useState(user?.telephone || '');
  const [profileAddress, setProfileAddress] = useState(user?.adresse || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Transfer Form States
  const [destIban, setDestIban] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  // Beneficiaries States
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [newBName, setNewBName] = useState('');
  const [newBIban, setNewBIban] = useState('');
  const [newBBank, setNewBBank] = useState('');
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState('');
  const [bSuccess, setBSuccess] = useState('');

  // Top Up States
  const [topupAmount, setTopupAmount] = useState('');
  const [topupCard, setTopupCard] = useState('');
  const [topupExpiry, setTopupExpiry] = useState('');
  const [topupCvv, setTopupCvv] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');
  const [topupSuccess, setTopupSuccess] = useState('');

  // ML & Analytics States
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(true);
  const [analyticsError, setAnalyticsError] = useState<string>('');

  const getCardBrand = (cardNumber: string) => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
    if (/^(34|37)/.test(clean)) return 'amex';
    return 'unknown';
  };

  // Bills States
  const [bills, setBills] = useState<any[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billsError, setBillsError] = useState('');
  const [billsSuccess, setBillsSuccess] = useState('');

  // Cards States
  const [cards, setCards] = useState<any[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState('');
  const [cardsSuccess, setCardsSuccess] = useState('');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [newPin, setNewPin] = useState('');
  const [limitePaiementVal, setLimitePaiementVal] = useState('');
  const [limiteRetraitVal, setLimiteRetraitVal] = useState('');
  const [showCardDetails, setShowCardDetails] = useState<Record<number, boolean>>({});
  const [orderType, setOrderType] = useState('VIRTUELLE');
  const [orderColor, setOrderColor] = useState('DARK');
  const [orderPin, setOrderPin] = useState('');

  // RIB & QR Scanner States
  const [isRibOpen, setIsRibOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScannerError, setQrScannerError] = useState('');
  const [qrScannerSuccess, setQrScannerSuccess] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // RIB & QR Scanner Methods
  const startQrCamera = async () => {
    setQrScannerError('');
    setQrScannerSuccess('');
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = stream;
        qrVideoRef.current.setAttribute('playsinline', 'true');
        qrVideoRef.current.play();
        requestAnimationFrame(tickQrScan);
      }
    } catch (err: any) {
      console.error(err);
      setQrScannerError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setCameraActive(false);
    }
  };

  const stopQrCamera = () => {
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (qrVideoRef.current) {
      qrVideoRef.current.srcObject = null;
    }
  };

  const tickQrScan = () => {
    if (!streamRef.current) return;
    const video = qrVideoRef.current;
    const canvas = qrCanvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code) {
          handleQrData(code.data);
          return;
        }
      }
    }
    requestAnimationFrame(tickQrScan);
  };

  const handleQrData = async (dataStr: string) => {
    setQrScannerError('');
    setQrScannerSuccess('');
    try {
      let iban = '';
      try {
        const data = JSON.parse(dataStr);
        iban = data.iban;
      } catch (e) {
        iban = dataStr.trim();
      }

      if (!iban) {
        setQrScannerError("Format de QR Code invalide (IBAN manquant).");
        return;
      }

      const res = await api.get(`/api/comptes/check-iban?iban=${iban}`);
      setDestIban(res.data.numeroCompte);
      setQrScannerSuccess(`RIB validé : ${res.data.prenom} ${res.data.nom}`);
      
      stopQrCamera();
      setTimeout(() => {
        setIsQrScannerOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setQrScannerError(err.response?.data?.message || "Données QR Code incorrectes ou RIB introuvable.");
    }
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQrScannerError('');
    setQrScannerSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleQrData(code.data);
          } else {
            setQrScannerError("Aucun QR Code lisible n'a été trouvé dans cette image.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isQrScannerOpen) {
      startQrCamera();
    } else {
      stopQrCamera();
    }
    return () => stopQrCamera();
  }, [isQrScannerOpen]);

  // Fetch Accounts and Operations
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const resAccounts = await api.get('/api/comptes/my-accounts');
      setAccounts(resAccounts.data);

      if (resAccounts.data && resAccounts.data.length > 0) {
        const account = resAccounts.data[0];
        setCurrentAccount(account);

        // Fetch operations history for this account
        const resOps = await api.get(`/api/operations/historique?iban=${account.numeroCompte}`);
        setTransactions(resOps.data);
      }

      // Proactively fetch cards to show in sidebar
      try {
        const resCards = await api.get('/api/cartes');
        setCards(resCards.data);
        if (resCards.data && resCards.data.length > 0) {
          const currentSelected = resCards.data[0];
          setSelectedCard(currentSelected);
          setLimitePaiementVal(currentSelected.limitePaiement.toString());
          setLimiteRetraitVal(currentSelected.limiteRetrait.toString());
        }
      } catch (e) {
        console.error("Cards fetch failed:", e);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données financières.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (accountId: number) => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      const res = await api.get(`/api/analytics/dashboard?accountId=${accountId}`);
      setAnalyticsData(res.data);
    } catch (err: any) {
      console.error("Analytics fetch failed:", err);
      setAnalyticsError("Erreur lors du chargement des analyses prédictives.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSupportMessages = async () => {
    try {
      const res = await api.get('/api/messages/my-advisor-conversation');
      if (res.data && res.data.messages) {
        setSupportMessages(res.data.messages);
        setAdvisorInfo(res.data.advisor);
      } else {
        setSupportMessages(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendSupportMessage = async () => {
    if (!supportInput.trim()) return;
    setSupportLoading(true);
    setSupportError('');
    try {
      const res = await api.post('/api/messages/send-to-advisor', { contenu: supportInput });
      setSupportMessages(prev => [...prev, res.data]);
      setSupportInput('');
    } catch (e: any) {
      setSupportError(e.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSupportLoading(false);
    }
  };

  const fetchBeneficiaries = async () => {
    try {
      setBLoading(true);
      setBError('');
      const res = await api.get('/api/beneficiaires');
      setBeneficiaries(res.data);
    } catch (err: any) {
      setBError(err.response?.data?.message || 'Impossible de charger les bénéficiaires.');
    } finally {
      setBLoading(false);
    }
  };

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setBError('');
    setBSuccess('');
    if (!newBName.trim() || !newBIban.trim()) {
      setBError('Le nom et l\'IBAN sont obligatoires.');
      return;
    }
    try {
      setBLoading(true);
      await api.post('/api/beneficiaires', {
        nom: newBName.trim(),
        iban: newBIban.trim(),
        nomBanque: newBBank.trim() || 'Banque'
      });
      setBSuccess('Bénéficiaire ajouté avec succès !');
      setNewBName('');
      setNewBIban('');
      setNewBBank('');
      fetchBeneficiaries();
    } catch (err: any) {
      setBError(err.response?.data?.message || 'Impossible d\'ajouter le bénéficiaire.');
    } finally {
      setBLoading(false);
    }
  };

  const handleDeleteBeneficiary = async (id: number) => {
    setBError('');
    setBSuccess('');
    try {
      setBLoading(true);
      await api.delete(`/api/beneficiaires/${id}`);
      setBSuccess('Bénéficiaire supprimé.');
      fetchBeneficiaries();
    } catch (err: any) {
      setBError(err.response?.data?.message || 'Impossible de supprimer.');
    } finally {
      setBLoading(false);
    }
  };

  const fetchBills = async () => {
    try {
      setBillsLoading(true);
      setBillsError('');
      const res = await api.get('/api/factures');
      setBills(res.data);
    } catch (err: any) {
      setBillsError(err.response?.data?.message || 'Erreur lors du chargement des factures.');
    } finally {
      setBillsLoading(false);
    }
  };

  const handlePayBill = async (id: number) => {
    setBillsError('');
    setBillsSuccess('');
    try {
      setBillsLoading(true);
      const res = await api.post(`/api/factures/${id}/payer`);
      setBillsSuccess(res.data.message || 'Facture réglée avec succès !');

      // Notify client
      const billPaid = bills.find(b => b.id === id);
      if (billPaid) {
        addLocalNotification(`Paiement de facture effectué : ${billPaid.fournisseur} (${billPaid.montant} DH).`);
      }

      await fetchBills();
      await fetchData(); // Refresh balance and transaction log
    } catch (err: any) {
      setBillsError(err.response?.data?.message || 'Paiement échoué.');
    } finally {
      setBillsLoading(false);
    }
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupError('');
    setTopupSuccess('');

    if (!topupAmount || parseFloat(topupAmount) <= 0) {
      setTopupError('Veuillez saisir un montant valide supérieur à 0.');
      return;
    }
    const cleanCard = topupCard.replace(/\D/g, '');
    if (cleanCard.length !== 16) {
      setTopupError('Le numéro de carte doit faire exactement 16 chiffres.');
      return;
    }

    try {
      setTopupLoading(true);
      const res = await api.post('/api/comptes/topup', {
        montant: parseFloat(topupAmount),
        numeroCarte: topupCard.replace(/\s/g, ''),
        dateExpiration: topupExpiry,
        cvv: topupCvv
      });
      setTopupSuccess(res.data.message || 'Recharge réussie !');
      addLocalNotification(`Votre compte a été rechargé de ${parseFloat(topupAmount)} DH.`);
      setTopupAmount('');
      setTopupCard('');
      setTopupExpiry('');
      setTopupCvv('');
      await fetchData(); // Refresh balance
    } catch (err: any) {
      setTopupError(err.response?.data?.message || 'Recharge échouée.');
    } finally {
      setTopupLoading(false);
    }
  };

  const fetchCards = async () => {
    try {
      setCardsLoading(true);
      setCardsError('');
      const res = await api.get('/api/cartes');
      setCards(res.data);
      if (res.data && res.data.length > 0) {
        const currentSelected = res.data.find((c: any) => c.id === selectedCard?.id) || res.data[0];
        setSelectedCard(currentSelected);
        setLimitePaiementVal(currentSelected.limitePaiement.toString());
        setLimiteRetraitVal(currentSelected.limiteRetrait.toString());
      } else {
        setSelectedCard(null);
      }
    } catch (err: any) {
      setCardsError(err.response?.data?.message || 'Impossible de charger les cartes.');
    } finally {
      setCardsLoading(false);
    }
  };

  const handleToggleBlockCard = async (id: number) => {
    try {
      setCardsError('');
      setCardsSuccess('');
      const res = await api.post(`/api/cartes/${id}/toggle`);
      setCards(prev => prev.map(c => c.id === id ? res.data : c));
      if (selectedCard && selectedCard.id === id) {
        setSelectedCard(res.data);
      }
      const newStatus = res.data.statut === 'ACTIVE' ? 'déverrouillée' : 'verrouillée';
      setCardsSuccess(`Carte ${newStatus} avec succès.`);
      addLocalNotification(`Votre carte se terminant par ${res.data.numeroCarte.slice(-4)} a été ${newStatus}.`);
    } catch (err: any) {
      setCardsError(err.response?.data?.message || 'Erreur lors du changement de statut de la carte.');
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    try {
      setCardsError('');
      setCardsSuccess('');
      await api.put(`/api/cartes/${selectedCard.id}/pin`, { pin: newPin });
      setCardsSuccess('Code PIN mis à jour avec succès.');
      addLocalNotification(`Code PIN mis à jour pour la carte se terminant par ${selectedCard.numeroCarte.slice(-4)}.`);
      setNewPin('');
      await fetchCards();
    } catch (err: any) {
      setCardsError(err.response?.data?.message || 'Erreur lors du changement de PIN.');
    }
  };

  const handleUpdateLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    try {
      setCardsError('');
      setCardsSuccess('');
      const res = await api.put(`/api/cartes/${selectedCard.id}/limits`, {
        limitePaiement: parseFloat(limitePaiementVal),
        limiteRetrait: parseFloat(limiteRetraitVal)
      });
      setCardsSuccess('Plafonds mis à jour avec succès.');
      addLocalNotification(`Plafonds modifiés pour votre carte se terminant par ${selectedCard.numeroCarte.slice(-4)}.`);
      setCards(prev => prev.map(c => c.id === selectedCard.id ? res.data : c));
      setSelectedCard(res.data);
    } catch (err: any) {
      setCardsError(err.response?.data?.message || 'Erreur lors de la mise à jour des plafonds.');
    }
  };

  const handleOrderCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCardsError('');
      setCardsSuccess('');
      const res = await api.post('/api/cartes', {
        type: orderType,
        stripeColor: orderColor,
        pin: orderPin
      });
      setCardsSuccess(`Votre nouvelle carte ${orderType.toLowerCase()} a été commandée avec succès !`);
      addLocalNotification(`Nouvelle carte ${orderType.toLowerCase()} commandée.`);
      setOrderPin('');
      await fetchCards();
    } catch (err: any) {
      setCardsError(err.response?.data?.message || 'Erreur lors de la commande.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    try {
      setPasswordLoading(true);
      await api.put('/api/auth/change-password', {
        oldPassword,
        newPassword
      });
      setPasswordSuccess("Votre mot de passe a été mis à jour avec succès.");
      addLocalNotification("Mot de passe mis à jour avec succès.");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Erreur lors de la mise à jour du mot de passe.');
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
        telephone: profilePhone,
        adresse: profileAddress
      });
      updateUser({ telephone: profilePhone, adresse: profileAddress });
      setProfileSuccess("Profil mis à jour avec succès !");
      addLocalNotification("Informations de profil mises à jour.");
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
        addLocalNotification("Photo de profil mise à jour.");
      } catch (err: any) {
        setProfileError(err.response?.data?.message || "Erreur de mise à jour de la photo de profil.");
      } finally {
        setProfileLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };


  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readStatus: true } : n));
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error("Failed to delete notification:", e);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await api.delete('/api/notifications/delete-all-read');
      setNotifications(prev => prev.filter(n => !n.readStatus));
    } catch (e) {
      console.error("Failed to delete read notifications:", e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (activeTab === 'transfers') {
      fetchBeneficiaries();
    } else if (activeTab === 'bills') {
      fetchBills();
    } else if (activeTab === 'cards') {
      fetchCards();
    } else if (activeTab === 'support') {
      fetchSupportMessages();
    } else if (activeTab === 'chatbot') {
      setIsChatOpen(true);
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    } else if (activeTab === 'stats' && currentAccount) {
      fetchAnalytics(currentAccount.id);
    }
  }, [activeTab, currentAccount]);

  // Handle transaction submit
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!currentAccount) {
      setTransferError("Aucun compte actif sélectionné.");
      return;
    }
    if (!destIban.trim()) {
      setTransferError("Veuillez saisir l'IBAN du destinataire.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setTransferError("Veuillez entrer un montant supérieur à 0.");
      return;
    }

    setTransferLoading(true);
    try {
      await api.post('/api/operations/virement', {
        ibanSource: currentAccount.numeroCompte,
        ibanDestination: destIban.trim(),
        montant: parseFloat(amount),
        description: description.trim() || 'Transfert de fonds Banque'
      });

      setTransferSuccess('Transfert exécuté avec succès !');
      addLocalNotification(`Virement de ${parseFloat(amount)} DH envoyé à l'IBAN ${destIban.slice(0, 10)}...`);
      setDestIban('');
      setAmount('');
      setDescription('');

      // Reload accounts and history
      await fetchData();
    } catch (err: any) {
      setTransferError(err.response?.data?.message || 'Une erreur est survenue lors de la transaction.');
    } finally {
      setTransferLoading(false);
    }
  };

  const addLocalNotification = (text: string) => {
    fetchNotifications();
  };

  // Helper to format balances beautifully
  const formatAmount = (val: number, dev: string) => {
    const activeCurrency = dev || 'MAD';
    const locale = 'fr-MA';
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: activeCurrency,
        minimumFractionDigits: 2
      });
      return formatter.format(val);
    } catch (e) {
      return `${val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`;
    }
  };

  // Reusable Chatbot Send Message Logic
  const sendMessage = async (userMsg: string) => {
    if (!userMsg.trim()) return;

    // Optimistically add user message to list
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

    try {
      const res = await api.post('/api/chatbot/ask', {
        message: userMsg,
        history: chatMessages.slice(-5) // Send last 5 messages as context
      });
      if (res.data && res.data.reply) {
        setChatMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
      }
    } catch (e: any) {
      console.error("Erreur Chatbot:", e);
      setChatMessages(prev => [...prev, { sender: 'bot', text: "Désolé, je rencontre des difficultés techniques actuellement." }]);
    }
  };

  // Chatbot Send Message Handler
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    await sendMessage(userMsg);
  };

  // Statements Downloader (CSV Format)
  const generateBankStatementPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Bank Header & Branding
    doc.setFontSize(22);
    doc.setTextColor(0, 180, 216); // Primary Color
    doc.text(bankName || "Banque Nationale", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Relevé de Compte Bancaire", pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 38, { align: 'center' });

    // Client Info Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 45, pageWidth - 28, 35, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Titulaire du compte : ${user?.nom?.toUpperCase()} ${user?.prenom}`, 20, 55);
    doc.text(`N° de compte : ${currentAccount?.numeroCompte || 'Non défini'}`, 20, 63);
    doc.text(`Devise : ${currentAccount?.devise || 'MAD'}`, 20, 71);

    doc.text(`Solde Actuel : ${currentAccount ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currentAccount.devise }).format(currentAccount.solde) : '0,00'}`, pageWidth - 80, 63);

    // Prepare table data
    const tableData = filteredTransactions.map(t => {
      const isDebit = t.compteSource?.numeroCompte === currentAccount?.numeroCompte;
      const isWelcome = t.compteSource === null;

      let typeLabel = t.description || (isWelcome ? "Bonus" : "Virement");
      let montantStr = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(t.montant);
      if (isDebit) montantStr = "- " + montantStr;
      else montantStr = "+ " + montantStr;

      return [
        new Date(t.dateOperation).toLocaleDateString('fr-FR'),
        typeLabel,
        isDebit ? (t.compteDestination?.numeroCompte || "Externe") : (isWelcome ? "Banque" : (t.compteSource?.numeroCompte || "Externe")),
        montantStr
      ];
    });

    autoTable(doc, {
      startY: 90,
      head: [['Date', 'Opération / Description', 'Contrepartie', 'Montant']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 180, 216], textColor: 255, halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { halign: 'center', cellWidth: 60 },
        3: { halign: 'right', cellWidth: 35 }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 3 && data.cell.raw != null) {
          if (data.cell.raw.toString().startsWith('-')) {
            data.cell.styles.textColor = [220, 38, 38]; // Red for debits
          } else {
            data.cell.styles.textColor = [16, 185, 129]; // Green for credits
          }
        }
      }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Ce relevé est généré électroniquement et a valeur légale.", pageWidth / 2, finalY + 15, { align: 'center' });

    // Ouvrir le PDF dans un nouvel onglet pour contourner les bloqueurs de téléchargement/antivirus
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  };

  // Dynamic Filtering Logic
  const filteredTransactions = transactions.filter(t => {
    // Keyword match
    const matchesKeyword = !filterKeyword ||
      (t.description && t.description.toLowerCase().includes(filterKeyword.toLowerCase())) ||
      (t.compteSource?.numeroCompte && t.compteSource.numeroCompte.includes(filterKeyword)) ||
      (t.compteDestination?.numeroCompte && t.compteDestination.numeroCompte.includes(filterKeyword));

    // Type match
    const matchesType = filterType === 'ALL' || t.type === filterType;

    // Amount match
    const matchesMinAmount = !filterMinAmount || t.montant >= parseFloat(filterMinAmount);
    const matchesMaxAmount = !filterMaxAmount || t.montant <= parseFloat(filterMaxAmount);

    // Date match
    const tDate = new Date(t.dateOperation);
    const matchesStartDate = !filterStartDate || tDate >= new Date(filterStartDate);
    const matchesEndDate = !filterEndDate || tDate <= new Date(filterEndDate + 'T23:59:59');

    return matchesKeyword && matchesType && matchesMinAmount && matchesMaxAmount && matchesStartDate && matchesEndDate;
  });

  // Stats Calculations
  const totalIn = transactions
    .filter(t => t.compteSource === null || t.compteDestination?.numeroCompte === currentAccount?.numeroCompte)
    .reduce((sum, t) => sum + t.montant, 0);

  const totalOut = transactions
    .filter(t => t.compteSource?.numeroCompte === currentAccount?.numeroCompte)
    .reduce((sum, t) => sum + t.montant, 0);

  // Dynamic Chart Calculation (Flux trimestriel)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const data: any[] = [];

    // Create buckets for the last 4 months
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.push({
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        monthStr: months[d.getMonth()],
        totalVolume: 0,
        val: 0,
        active: i === 0 // Current month is active
      });
    }

    // Sum up transactions (volume)
    transactions.forEach(t => {
      if (!currentAccount) return;
      const tDate = new Date(t.dateOperation);
      const isCredit = t.compteDestination?.numeroCompte === currentAccount.numeroCompte || t.compteSource === null;
      const bucket = data.find(b => b.monthIndex === tDate.getMonth() && b.year === tDate.getFullYear());
      if (bucket) {
        // Here we track total money flow (performance)
        if (isCredit) {
          bucket.totalVolume += t.montant;
        }
      }
    });

    // Normalize values to 0-100 scale for the chart height (max 100%)
    const maxVol = Math.max(...data.map(d => d.totalVolume), 1); // Avoid division by zero

    return data.map(d => ({
      month: d.monthStr,
      val: (d.totalVolume / maxVol) * 100, // 0 to 100
      active: d.active
    }));
  }, [transactions, currentAccount]);

  // Tab 1: Dashboard Overview
  const renderDashboard = () => (
    <>
      <Grid container spacing={3}>
        {/* Banner Card */}
        <Grid size={{ xs: 12, md: 7.5 }}>
          <Paper
            elevation={1}
            sx={{
              p: { xs: 3, md: '24px 32px' },
              borderRadius: '5px',
              height: { xs: 'auto', md: '240px' },
              minHeight: '240px',
              display: 'flex',
              position: 'relative',
              overflow: 'hidden',
              background: 'background.paper'
            }}
          >
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2, height: '100%' }}>
              <Box>
                <Logo size="small" />
                <Typography variant="h4" sx={{ mt: 2.5, color: 'text.primary', letterSpacing: '-0.02em', fontWeight: 800 }}>
                  Bonjour, {user?.prenom} !
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Votre espace sécurisé est actif. Suivez vos transactions et gérez votre capital.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setActiveTab('stats')}
                sx={{ alignSelf: 'flex-start', mt: { xs: 2.5, md: 0 } }}
              >
                Voir mes statistiques
              </Button>
            </Box>

            {/* Glowing visuals */}
            <Box sx={{
              position: 'absolute',
              right: -30,
              top: 20,
              width: 260,
              height: '180px',
              display: { xs: 'none', sm: 'block' }
            }}>
              {/* Green Card rotated */}
              <Box sx={{
                position: 'absolute', right: 20, top: 10, width: 180, height: 110,
                borderRadius: '5px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                transform: 'rotate(25deg)', opacity: 0.6, boxShadow: 'none'
              }} />
              {/* Blue Card rotated */}
              <Box sx={{
                position: 'absolute', right: 50, top: 25, width: 180, height: 110,
                borderRadius: '5px', background: isDark ? 'linear-gradient(135deg, #3B82F6 0%, #07111F 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #FFFFFF 100%)',
                transform: 'rotate(15deg)', border: '1px solid rgba(59, 130, 246, 0.3)', boxShadow: 'none'
              }} />
            </Box>
          </Paper>
        </Grid>

        {/* Balance Card */}
        <Grid size={{ xs: 12, md: 4.5 }}>
          <Paper
            elevation={1}
            sx={{
              p: { xs: 3, md: '24px 32px' },
              borderRadius: '5px',
              height: { xs: 'auto', md: '240px' },
              minHeight: '240px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>Solde disponible</Typography>
              <Stack direction="row" spacing={2}>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 600, cursor: 'pointer', color: 'primary.main' }}
                  onClick={() => setIsRibOpen(true)}
                >
                  RIB/QR
                </Typography>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontWeight: 600, cursor: 'pointer', color: 'primary.main' }}
                  onClick={() => setActiveTab('wallet')}
                >
                  Gérer
                </Typography>
              </Stack>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">Solde consolidé</Typography>
              <Typography variant="h3" sx={{ color: 'text.primary', my: 0.5, letterSpacing: '-0.03em', fontWeight: 900 }}>
                {currentAccount ? formatAmount(currentAccount.solde, currentAccount.devise) : '0,00 DH'}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', height: 24, mr: 2 }}>
                <Box sx={{ width: 6, height: 12, bgcolor: 'primary.main', borderRadius: '5px' }} />
                <Box sx={{ width: 6, height: 18, bgcolor: 'success.main', borderRadius: '5px' }} />
                <Box sx={{ width: 6, height: 8, bgcolor: 'error.main', borderRadius: '5px' }} />
                <Box sx={{ width: 6, height: 22, bgcolor: '#42E8FF', borderRadius: '5px' }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, bgcolor: isDark ? 'rgba(59, 130, 2462,0.1)' : 'rgba(84, 227, 255, 0.1)', px: 1.5, py: 0.5, borderRadius: '5px' }}>
                ACTIF
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Send Form */}
        <Grid size={{ xs: 12, md: 6.5 }}>
          <Paper
            elevation={1}
            sx={{
              p: 4,
              borderRadius: '5px',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="h6" color="text.primary" sx={{ mb: 2, fontWeight: 700 }}>
              Effectuer un virement rapide
            </Typography>

            <Box component="form" onSubmit={handleTransfer} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {transferError && <Alert severity="error" sx={{ py: 0, borderRadius: '5px' }}>{transferError}</Alert>}
              {transferSuccess && <Alert severity="success" sx={{ py: 0, borderRadius: '5px' }}>{transferSuccess}</Alert>}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="IBAN du bénéficiaire (MA64...)"
                    value={destIban}
                    onChange={(e) => setDestIban(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setIsQrScannerOpen(true)} size="small" sx={{ color: 'primary.main' }}>
                              <QrCodeScannerRoundedIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`Montant (${currentAccount?.devise || 'EUR'})`}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Motif / Description du virement"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                disabled={transferLoading}
                sx={{ alignSelf: 'flex-end', px: 4, py: 1, mt: 1, bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
              >
                {transferLoading ? 'Envoi...' : 'Envoyer'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Overview Graph */}
        <Grid size={{ xs: 12, md: 5.5 }}>
          <Paper
            elevation={1}
            sx={{
              p: 4,
              borderRadius: '5px',
              height: '315px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>Flux trimestriel</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: isDark ? 'rgba(59, 130, 2462,0.1)' : 'rgba(48, 207, 239, 0.06)', px: 1.5, py: 0.5, borderRadius: '5px' }}>
                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>Performance</Typography>
              </Box>
            </Box>

            {/* Professional Flat Chart */}
            <Box sx={{ display: 'flex', flexDirection: 'column', height: 180, justifyContent: 'space-between', mt: 2 }}>
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'stretch' }}>
                {/* Y Axis scale values */}
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pr: 1.5, pb: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>100%</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>50%</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>0%</Typography>
                </Box>

                {/* Grid container */}
                <Box sx={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', borderLeft: '1px solid', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', pb: 0.5 }}>
                  {/* Grid Lines */}
                  <Box sx={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', zIndex: 0 }} />

                  {chartData.map((item, idx) => {
                    const barColor = item.active
                      ? ('#54E3FF')
                      : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)');
                    return (
                      <Stack key={idx} spacing={1} sx={{ width: '15%', zIndex: 1, alignItems: 'center' }}>
                        <Box sx={{
                          width: '100%',
                          height: `${item.val * 1.3}px`,
                          bgcolor: barColor,
                          borderRadius: '5px 5px 0 0',
                          transition: 'all 0.3s'
                        }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: item.active ? 700 : 500, fontSize: '0.7rem' }}>
                          {item.month}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Advanced Filters & Transactions History list */}
      <Box>
        <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
          <Stack spacing={2} sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
              Historique des Transactions ({filteredTransactions.length})
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterListRoundedIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ borderRadius: '5px', borderColor: '#54E3FF', color: 'primary.main' }}
              >
                {showFilters ? "Masquer Filtres" : "Filtrer"}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<FileDownloadRoundedIcon />}
                onClick={generateBankStatementPDF}
                sx={{ borderRadius: '5px', bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
              >
                Relevé (PDF)
              </Button>
            </Stack>
          </Stack>

          {/* Filters Panel */}
          {showFilters && (
            <Box sx={{ p: 3, mb: 3, borderRadius: '5px', bgcolor: innerBg }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Rechercher description/IBAN"
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="ALL" style={{ background: 'background.paper', color: isDark ? '#fff' : '#0F172A' }}>Toutes les opérations</option>
                      <option value="DEPOT" style={{ background: 'background.paper', color: isDark ? '#fff' : '#0F172A' }}>Dépôts</option>
                      <option value="VIREMENT" style={{ background: 'background.paper', color: isDark ? '#fff' : '#0F172A' }}>Virements</option>
                      <option value="RETRAIT" style={{ background: 'background.paper', color: isDark ? '#fff' : '#0F172A' }}>Retraits</option>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Min Amount (DH)"
                      type="number"
                      value={filterMinAmount}
                      onChange={(e) => setFilterMinAmount(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Max Amount (DH)"
                      type="number"
                      value={filterMaxAmount}
                      onChange={(e) => setFilterMaxAmount(e.target.value)}
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Date de début"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Date de fin"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Aucune transaction trouvée.</Typography>
            </Box>
          ) : (
            filteredTransactions.map((t, idx) => {
              const isDebit = t.compteSource?.numeroCompte === currentAccount?.numeroCompte;
              const isWelcome = t.compteSource === null;

              let txName = '';
              let txType = '';
              let color = '#EF4444';
              let prefix = '-';

              if (isWelcome) {
                txName = "Crédit d'accueil Banque";
                txType = 'Bonus de bienvenue';
                color = '#10B981';
                prefix = '+';
              } else if (t.type === 'RETRAIT') {
                txName = "Retrait d'espèces GAB";
                txType = t.description || "Retrait d'espèces";
                color = '#EF4444';
                prefix = '-';
              } else if (t.type === 'DEPOT') {
                txName = "Dépôt de fonds";
                txType = t.description || "Dépôt d'espèces";
                color = '#10B981';
                prefix = '+';
              } else if (isDebit) {
                const destNum = t.compteDestination?.numeroCompte;
                txName = `Virement émis ${destNum ? 'vers ...' + destNum.substring(destNum.length - 4) : ''}`;
                txType = t.description || 'Virement bancaire';
                color = '#EF4444';
                prefix = '-';
              } else {
                const srcNum = t.compteSource?.numeroCompte;
                txName = `Virement reçu ${srcNum ? 'de ...' + srcNum.substring(srcNum.length - 4) : ''}`;
                txType = t.description || 'Virement bancaire';
                color = '#10B981';
                prefix = '+';
              }

              return (
                <Box key={t.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2.5, '&:hover': { bgcolor: 'rgba(66,232,255,0.03)' } }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: color === '#10B981' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: color, width: 40, height: 40 }}>
                        {isWelcome ? 'B' : isDebit ? 'E' : 'R'}
                      </Avatar>
                      <Box>
                        <Typography color="text.primary" sx={{ fontWeight: 700 }}>{txName}</Typography>
                        <Typography variant="body2" color="text.secondary">{txType}</Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography color={color} sx={{ fontWeight: 700 }}>
                        {prefix} {formatAmount(t.montant, currentAccount?.devise || 'MAD')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(t.dateOperation).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Box>
                  </Box>
                  {idx < filteredTransactions.length - 1 && <Divider />}
                </Box>
              );
            })
          )}
        </Paper>
      </Box>

      {/* Cards and Account Details for Mobile/Tablet */}
      <Box sx={{ display: { xs: 'block', lg: 'none' }, mt: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
                  Vos Cartes
                </Typography>
              </Box>

              <Box sx={{ position: 'relative', height: 210, mb: 2 }}>
                <Box sx={{
                  position: 'absolute', top: 0, left: 10, right: 10, height: 160,
                  bgcolor: innerBg, borderRadius: '5px', p: 3, color: isDark ? '#FFFFFF' : '#0F172A',
                  transform: 'scale(0.92)', opacity: 0.6,
                  boxShadow: 'none'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 3 }}>•••• 6789</Typography>
                </Box>

                {cards.length > 0 ? (
                  <Box sx={{
                    position: 'absolute', top: 15, left: 0, right: 0, height: 170,
                    background: cards[0].stripeColor === 'DARK'
                      ? (isDark ? "linear-gradient(135deg, #07111F 0%, #000000 100%)" : "linear-gradient(135deg, #F1F5F9 0%, #CBD5E1 100%)")
                      : (isDark ? 'linear-gradient(135deg, #54E3FF 0%, #07111F 100%)' : 'linear-gradient(135deg, #54E3FF 0%, #FFFFFF 100%)'),
                    borderRadius: '5px', p: 3, color: isDark ? 'white' : '#0F172A',
                    border: '1px solid rgba(84, 227, 255, 0.2)',
                    boxShadow: 'none',
                    display: 'flex', flexDirection: 'column', justifyStyle: 'space-between',
                    transition: 'all 0.3s',
                    opacity: cards[0].statut === 'BLOQUEE' ? 0.75 : 1
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Logo onDarkBg={isDark} />
                      <Typography color={isDark ? '#54E3FF' : '#00B4D8'} sx={{ fontWeight: 800, fontStyle: 'italic' }}>
                        {cards[0].type}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: 3, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        •••• •••• •••• {cards[0].numeroCarte.slice(-4)}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          {cards[0].titulaire}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>{cards[0].dateExpiration}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{
                    position: 'absolute', top: 15, left: 0, right: 0, height: 170,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '5px', p: 3,
                    border: '1px dashed rgba(84, 227, 255, 0.2)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    transition: 'all 0.3s'
                  }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Vous n'avez pas de carte active.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', height: '100%' }}>
              <Typography variant="h6" color="text.primary" sx={{ mb: 3, fontWeight: 700 }}>
                Détails du compte
              </Typography>
              <Box sx={{ bgcolor: innerBg, p: 3, borderRadius: '5px' }}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Typography variant="caption" color="text.secondary">IBAN :</Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontFamily: 'monospace', fontWeight: 700, wordBreak: 'break-all' }}>
                      {currentAccount?.numeroCompte || 'MA64...'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Typography variant="caption" color="text.secondary">Offre :</Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                      {currentAccount?.typeCompte === 'PREMIUM' ? 'PREMIUM (Métal Noir)' : 'STANDARD (Gratuit)'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Typography variant="caption" color="text.secondary">Devise principale :</Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                      {currentAccount?.devise || 'EUR'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );

  // Render Cash Flow Prediction SVG line chart (TimeSeries)
  const renderCashFlowPredictionChart = (predictions: any[], currency: string) => {
    if (!predictions || predictions.length === 0) return null;
    
    // Find min and max values for scaling
    const balances = predictions.map((p: any) => p.balance);
    const maxVal = Math.max(...balances, 1000); 
    const minVal = Math.min(...balances, 0); 
    const range = maxVal - minVal || 1;
    
    const svgWidth = 500;
    const svgHeight = 150;
    const paddingX = 30;
    const paddingY = 20;
    
    const points = predictions.map((p: any, idx: number) => {
      const x = paddingX + (idx * (svgWidth - 2 * paddingX)) / (predictions.length - 1);
      const y = svgHeight - paddingY - ((p.balance - minVal) * (svgHeight - 2 * paddingY)) / range;
      return { x, y, balance: p.balance, date: p.date, formattedDate: p.formattedDate, isWarning: p.overdraftWarning };
    });
    
    // Build path string
    const dPath = points.map((p: any, idx: number) => 
      `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');
    
    // Build area path string for gradient fill
    const dArea = `${dPath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;
    
    return (
      <Box sx={{ width: '100%', mt: 2, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">Tendance prévisionnelle (30 jours)</Typography>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
            Max : {maxVal.toFixed(0)} {currency}
          </Typography>
        </Box>
        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#54E3FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#54E3FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
          <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="rgba(255,255,255,0.1)" />

          {/* Area fill */}
          <path d={dArea} fill="url(#chartGrad)" />
          
          {/* Trend line */}
          <path d={dPath} fill="none" stroke="#54E3FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Draw dots & alert indicators */}
          {points.map((p: any, idx: number) => {
            const showDot = idx % 5 === 0 || p.isWarning;
            if (!showDot) return null;
            return (
              <g key={idx}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={p.isWarning ? 5 : 3.5} 
                  fill={p.isWarning ? '#EF4444' : '#00D8FF'} 
                  stroke={isDark ? '#020617' : '#FFFFFF'} 
                  strokeWidth="1.5" 
                />
              </g>
            );
          })}
          
          {/* Axis Labels */}
          <text x={paddingX} y={svgHeight - 4} fill={theme.palette.text.secondary} fontSize="8" textAnchor="middle">{points[0]?.formattedDate || ''}</text>
          <text x={svgWidth / 2} y={svgHeight - 4} fill={theme.palette.text.secondary} fontSize="8" textAnchor="middle">{points[15]?.formattedDate || ''}</text>
          <text x={svgWidth - paddingX} y={svgHeight - 4} fill={theme.palette.text.secondary} fontSize="8" textAnchor="middle">{points[29]?.formattedDate || ''}</text>
        </svg>
      </Box>
    );
  };

  // Tab 2: Statistics Detailed View
  const renderStats = () => {
    if (analyticsLoading) {
      return (
        <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress color="primary" />
        </Paper>
      );
    }

    if (analyticsError || !analyticsData) {
      return (
        <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 2, py: 6, alignItems: 'center' }}>
          <Alert severity="error" sx={{ width: '100%', borderRadius: '5px' }}>{analyticsError || "Données analytiques indisponibles."}</Alert>
          <Button variant="outlined" color="primary" onClick={() => currentAccount && fetchAnalytics(currentAccount.id)} sx={{ mt: 1 }}>
            Réessayer de charger
          </Button>
        </Paper>
      );
    }

    const { totalIn, totalOut, categoriesRatios, predictions, anomalies, currency } = analyticsData;

    return (
      <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
        <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800, mb: 3 }}>
          Analyse prédictive & Apprentissage statistique (IA)
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '5px', bgcolor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Entrées mensuelles réelles (Crédits)</Typography>
              <Typography variant="h4" color="#10B981" sx={{ fontWeight: 900, mt: 1 }}>
                {formatAmount(totalIn, currency)}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '5px', bgcolor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Sorties mensuelles réelles (Débits)</Typography>
              <Typography variant="h4" color="#EF4444" sx={{ fontWeight: 900, mt: 1 }}>
                {formatAmount(totalOut, currency)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={4} sx={{ mb: 4 }}>
          {/* Left: Category ratios */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700, mb: 2 }}>
              Répartition réelle par catégorie (Modèle NLP)
            </Typography>
            <Stack spacing={2.5}>
              {categoriesRatios.map((item: any, idx: number) => (
                <Box key={idx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{item.category}</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 800 }}>
                      {formatAmount(item.amount, currency)} ({item.percent}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={item.percent > 100 ? 100 : item.percent}
                    sx={{
                      height: 6,
                      borderRadius: '5px',
                      bgcolor: innerBg,
                      '& .MuiLinearProgress-bar': { bgcolor: item.color || 'primary.main' }
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Grid>

          {/* Right: Cash Flow SVG predictions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
              Prévisions de Trésorerie (Séries Temporelles)
            </Typography>
            {renderCashFlowPredictionChart(predictions, currency)}
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: borderColor }} />

        {/* Suspicious activity check (Fraud Detection alerts) */}
        <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityRoundedIcon sx={{ color: 'primary.main' }} /> Surveillance & Détection d'anomalies (Z-Score)
        </Typography>

        {anomalies.length === 0 ? (
          <Alert severity="success" icon={<CheckCircleRoundedIcon fontSize="inherit" />} sx={{ borderRadius: '5px', bgcolor: 'rgba(16,185,129,0.06)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
            <strong>Aucune anomalie détectée.</strong> Votre comportement de transaction est stable et aligné avec votre profil historique de dépenses.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <Alert severity="warning" sx={{ borderRadius: '5px', border: '1px solid rgba(255, 183, 3, 0.2)' }}>
              <strong>Alerte de suspicion :</strong> L'algorithme a détecté des anomalies dans l'activité récente de votre compte courant. Veuillez les passer en revue.
            </Alert>
            {anomalies.map((alert: any, idx: number) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2.5, borderRadius: '5px', borderColor: 'error.main', bgcolor: isDark ? 'rgba(239,68,68,0.03)' : 'rgba(239,68,68,0.01)' }}>
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {alert.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Date : {alert.date} | ID : #{alert.transactionId}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'error.main', mt: 1, fontWeight: 500 }}>
                      ⚠️ {alert.reason}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 800 }}>
                      -{formatAmount(alert.amount, currency)}
                    </Typography>
                    <Box sx={{ display: 'inline-block', mt: 1, bgcolor: 'error.main', color: '#000000', px: 1.5, py: 0.2, borderRadius: '15px', fontSize: '0.7rem', fontWeight: 800 }}>
                      SUSPICION : {Math.round(alert.anomalyScore * 100)}%
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    );
  };

  // Tab 3: Wallet, Cards & Top-up View
  const renderWallet = () => (
    <Grid container spacing={3}>
      {/* Wallet details */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', height: '100%' }}>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 3 }}>
            Vos Comptes & Devises
          </Typography>

          <Stack spacing={2.5}>
            {accounts.map((acc) => (
              <Box key={acc.id} sx={{ p: 3, borderRadius: '5px', border: `2px solid ${'#54E3FF'}`, bgcolor: isDark ? 'rgba(59, 130, 2462,0.05)' : 'rgba(84, 227, 255, 0.05)' }}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="#54E3FF" sx={{ fontWeight: 700 }}>COMPTE COURANT ({acc.typeCompte})</Typography>
                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 900, mt: 1 }}>
                      {formatAmount(acc.solde, acc.devise)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', mt: 1 }}>
                      IBAN: {acc.numeroCompte}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main', color: '#000000' }}>
                    <AccountBalanceWalletOutlinedIcon />
                  </Avatar>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Grid>

      {/* Top up account simulated card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
            Alimenter le compte par carte externe
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Simulez un approvisionnement instantané par carte bancaire externe.
          </Typography>

          <Box component="form" onSubmit={handleTopup} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topupError && <Alert severity="error" sx={{ borderRadius: '5px' }}>{topupError}</Alert>}
            {topupSuccess && <Alert severity="success" sx={{ borderRadius: '5px' }}>{topupSuccess}</Alert>}

            <TextField
              fullWidth
              size="small"
              placeholder="Montant de la recharge"
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              placeholder="Numéro de carte (16 chiffres)"
              value={topupCard}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 16) val = val.substring(0, 16);
                const parts = val.match(/\d{1,4}/g);
                setTopupCard(parts ? parts.join(' ') : '');
              }}
              helperText="Exemple de carte de test Stripe : 4242 4242 4242 4242"
              slotProps={{
                input: {
                  startAdornment: <CreditCardRoundedIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  endAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      {getCardBrand(topupCard) === 'visa' && (
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1A1F71', bgcolor: '#E2F0FF', px: 1, py: 0.2, borderRadius: '5px', border: '1px solid #1A1F71' }}>
                          VISA
                        </Typography>
                      )}
                      {getCardBrand(topupCard) === 'mastercard' && (
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#FF5F00', bgcolor: '#FFF0E5', px: 1, py: 0.2, borderRadius: '5px', border: '1px solid #FF5F00' }}>
                          MASTERCARD
                        </Typography>
                      )}
                      {getCardBrand(topupCard) === 'amex' && (
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#0070CD', bgcolor: '#EBF5FF', px: 1, py: 0.2, borderRadius: '5px', border: '1px solid #0070CD' }}>
                          AMEX
                        </Typography>
                      )}
                    </Box>
                  )
                }
              }}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="MM/AA"
                  value={topupExpiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 4) val = val.substring(0, 4);
                    if (val.length > 2) {
                      val = val.substring(0, 2) + '/' + val.substring(2);
                    }
                    setTopupExpiry(val);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="CVV"
                  type="password"
                  value={topupCvv}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 3) val = val.substring(0, 3);
                    setTopupCvv(val);
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              disabled={topupLoading}
              sx={{ py: 1.2, mt: 1, bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
            >
              {topupLoading ? 'Approvisionnement...' : 'Alimenter le compte'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  // Tab 3.5: Cards View
  const renderCards = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          <Box>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
              Vos Cartes Banque
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Gérez vos cartes virtuelles et physiques instantanément.
            </Typography>

            {cardsError && <Alert severity="error" sx={{ mb: 2, borderRadius: '5px' }}>{cardsError}</Alert>}
            {cardsSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '5px' }}>{cardsSuccess}</Alert>}

            {cardsLoading && <Typography variant="body2">Chargement des cartes...</Typography>}

            {cards.length === 0 && !cardsLoading && (
              <Box sx={{ py: 6, textAlign: 'center', border: '2px dashed rgba(66, 232, 255, 0.2)', borderRadius: '5px' }}>
                <Typography color="text.secondary">Vous n'avez pas encore de carte bancaire.</Typography>
              </Box>
            )}

            <Stack spacing={2.5}>
              {cards.map((card) => {
                const isSelected = selectedCard?.id === card.id;
                const isBlocked = card.statut === 'BLOQUEE';
                const showDetails = showCardDetails[card.id] || false;

                return (
                  <Box
                    key={card.id}
                    onClick={() => {
                      setSelectedCard(card);
                      setLimitePaiementVal(card.limitePaiement.toString());
                      setLimiteRetraitVal(card.limiteRetrait.toString());
                      setCardsError('');
                      setCardsSuccess('');
                    }}
                    sx={{
                      cursor: 'pointer',
                      p: 3,
                      borderRadius: '5px',
                      border: isSelected ? '2px solid #54E3FF' : '1px solid rgba(84, 227, 255, 0.12)',
                      bgcolor: isSelected ? (isDark ? 'rgba(59, 130, 2462,0.05)' : 'rgba(84, 227, 255, 0.05)') : cardBg,
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {/* Visual Card component */}
                    <Box sx={{
                      height: 180,
                      borderRadius: '5px',
                      p: 3,
                      color: isDark ? 'white' : '#0F172A',
                      position: 'relative',
                      overflow: 'hidden',
                      background: card.stripeColor === 'DARK'
                        ? (isDark ? "linear-gradient(135deg, #07111F 0%, #000000 100%)" : "linear-gradient(135deg, #F1F5F9 0%, #CBD5E1 100%)")
                        : (isDark ? 'linear-gradient(135deg, #54E3FF 0%, #07111F 100%)' : 'linear-gradient(135deg, #54E3FF 0%, #FFFFFF 100%)'),
                      border: '1px solid rgba(84, 227, 255, 0.2)',
                      boxShadow: 'none'
                    }}>
                      {/* Blocked overlay */}
                      {isBlocked && (
                        <Box sx={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          bgcolor: 'rgba(0, 0, 0, 0.85)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 5
                        }}>
                          <Typography variant="body1" sx={{ letterSpacing: 2, border: '2px solid #EF4444', color: 'error.main', px: 2, py: 0.5, borderRadius: '5px', transform: 'rotate(-5deg)', fontWeight: 950 }}>
                            CARTE VERROUILLÉE
                          </Typography>
                        </Box>
                      )}

                      <Typography sx={{ fontSize: '1.1rem', color: 'primary.main', fontWeight: 900, fontStyle: 'italic' }}>
                        Banque
                      </Typography>

                      <Typography variant="caption" sx={{ position: 'absolute', top: 20, right: 20, bgcolor: 'rgba(84, 227, 255, 0.15)', color: isDark ? '#FFFFFF' : '#00B4D8', px: 1.5, py: 0.5, borderRadius: '5px', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
                        {card.type}
                      </Typography>

                      <Typography variant="h6" sx={{ position: 'absolute', bottom: 65, left: 20, letterSpacing: 3, fontFamily: 'monospace' }}>
                        {showDetails
                          ? card.numeroCarte.replace(/(.{4})/g, '$1 ')
                          : `•••• •••• •••• ${card.numeroCarte.slice(-4)}`}
                      </Typography>

                      <Box sx={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem', display: 'block', textTransform: 'uppercase' }}>Titulaire</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{card.titulaire}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem', display: 'block' }}>EXPIRE</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{card.dateExpiration}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem', display: 'block' }}>CVV</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{showDetails ? card.cvv : '•••'}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    {/* Quick controls */}
                    {isSelected && (
                      <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCardDetails(prev => ({ ...prev, [card.id]: !prev[card.id] }));
                          }}
                          sx={{ borderRadius: '5px', borderColor: '#54E3FF', color: 'primary.main' }}
                        >
                          {showDetails ? 'Masquer' : 'Afficher détails'}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color={isBlocked ? "success" : "error"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBlockCard(card.id);
                          }}
                          sx={{ borderRadius: '5px' }}
                        >
                          {isBlocked ? 'Déverrouiller' : 'Verrouiller'}
                        </Button>
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Paper>
      </Grid>

      {/* Card settings & ordering */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={3}>
          {selectedCard && (
            <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 3 }}>
                Plafonds & Sécurité ({selectedCard.type.toLowerCase()})
              </Typography>

              {/* Limits form */}
              <Box component="form" onSubmit={handleUpdateLimits} sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Limites hebdomadaires</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Limite Paiement (DH)</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={limitePaiementVal}
                      onChange={(e) => setLimitePaiementVal(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Limite Retrait (DH)</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={limiteRetraitVal}
                      onChange={(e) => setLimiteRetraitVal(e.target.value)}
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2, borderRadius: '5px', borderColor: '#54E3FF', color: 'primary.main' }}
                >
                  Mettre à jour les plafonds
                </Button>
              </Box>

              {/* PIN Code form */}
              <Box component="form" onSubmit={handleUpdatePin}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Modifier le code PIN</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    size="small"
                    placeholder="PIN (4 chiffres)"
                    type="password"
                    slotProps={{ htmlInput: { maxLength: 4 } }}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    sx={{ borderRadius: '5px', bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
                  >
                    Changer le PIN
                  </Button>
                </Stack>
              </Box>
            </Paper>
          )}

          {/* Request new card */}
          <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
              Commander une nouvelle carte
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Commandez une nouvelle carte virtuelle ou physique instantanément.
            </Typography>

            <Box component="form" onSubmit={handleOrderCard} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Type de carte</Typography>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', fontSize: '0.9rem', backgroundColor: innerBg, color: isDark ? '#FFF' : '#0F172A' }}
                  >
                    <option value="VIRTUELLE">Virtuelle (Gratuite)</option>
                    <option value="PHYSIQUE">Physique</option>
                  </select>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Style de carte</Typography>
                  <select
                    value={orderColor}
                    onChange={(e) => setOrderColor(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', fontSize: '0.9rem', backgroundColor: innerBg, color: isDark ? '#FFF' : '#0F172A' }}
                  >
                    <option value="DARK">Premium Metal (Gold/Black)</option>
                    <option value="PINK">Standard Cyan (Blue/Teal)</option>
                  </select>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Définir le code PIN (4 chiffres)</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Code PIN"
                  type="password"
                  slotProps={{ htmlInput: { maxLength: 4 } }}
                  value={orderPin}
                  onChange={(e) => setOrderPin(e.target.value)}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                sx={{ py: 1.2, bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
              >
                Commander
              </Button>
            </Box>
          </Paper>
        </Stack>
      </Grid>
    </Grid>
  );

  // Tab 4: Transfers and Beneficiary Management View
  const renderTransfers = () => (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6.5 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
            Gestion des Bénéficiaires
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enregistrez les coordonnées bancaires de vos proches pour vos virements.
          </Typography>

          <Box component="form" onSubmit={handleAddBeneficiary} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            {bError && <Alert severity="error" sx={{ borderRadius: '5px' }}>{bError}</Alert>}
            {bSuccess && <Alert severity="success" sx={{ borderRadius: '5px' }}>{bSuccess}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nom complet"
                  value={newBName}
                  onChange={(e) => setNewBName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Banque (ex: Banque)"
                  value={newBBank}
                  onChange={(e) => setNewBBank(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="IBAN du bénéficiaire (MA64...)"
                  value={newBIban}
                  onChange={(e) => setNewBIban(e.target.value)}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="outlined"
              disabled={bLoading}
              startIcon={<AddRoundedIcon />}
              sx={{ alignSelf: 'flex-end', color: 'primary.main', borderColor: '#54E3FF', '&:hover': { borderColor: '#3B82F6', bgcolor: isDark ? 'rgba(59, 130, 2462,0.05)' : 'rgba(84, 227, 255, 0.05)' } }}
            >
              Enregistrer le bénéficiaire
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700, mb: 2 }}>
            Bénéficiaires enregistrés ({beneficiaries.length})
          </Typography>

          {bLoading && beneficiaries.length === 0 ? (
            <CircularProgress size={24} />
          ) : beneficiaries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Aucun bénéficiaire pour l'instant.</Typography>
          ) : (
            <List>
              {beneficiaries.map((b) => (
                <ListItem
                  key={b.id}
                  sx={{
                    borderRadius: '5px',
                    mb: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: isDark ? 'rgba(59, 130, 2462,0.05)' : 'rgba(84, 227, 255, 0.05)', borderColor: '#54E3FF' }
                  }}
                  onClick={() => setDestIban(b.iban)}
                >
                  <ListItemText>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {b.nom}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {`${b.nomBanque} • IBAN: ${b.iban}`}
                    </Typography>
                  </ListItemText>
                  <ListItemSecondaryAction>
                    <IconButton edge="end" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteBeneficiary(b.id); }}>
                      <DeleteOutlineRoundedIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Grid>

      {/* Wire Form Detailed */}
      <Grid size={{ xs: 12, md: 5.5 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper', height: '100%' }}>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
            Effectuer un Virement
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sélectionnez un bénéficiaire ou saisissez les coordonnées de transfert.
          </Typography>

          <Box component="form" onSubmit={handleTransfer} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {transferError && <Alert severity="error" sx={{ borderRadius: '5px' }}>{transferError}</Alert>}
            {transferSuccess && <Alert severity="success" sx={{ borderRadius: '5px' }}>{transferSuccess}</Alert>}

            {beneficiaries.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Choisir un bénéficiaire</InputLabel>
                <Select
                  value={destIban}
                  label="Choisir un bénéficiaire"
                  onChange={(e) => setDestIban(e.target.value)}
                >
                  {beneficiaries.map((b) => (
                    <MenuItem key={b.id} value={b.iban} style={{ background: 'background.paper', color: isDark ? '#fff' : '#0F172A' }}>{b.nom} ({b.iban.slice(0, 12)}...)</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              size="small"
              label="IBAN de destination"
              placeholder="MA64..."
              value={destIban}
              onChange={(e) => setDestIban(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setIsQrScannerOpen(true)} size="small" sx={{ color: 'primary.main' }}>
                        <QrCodeScannerRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="Montant du transfert"
              placeholder="0.00"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <TextField
              fullWidth
              size="small"
              label="Motif / Description"
              placeholder="Ex: Loyer, Cadeau..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={transferLoading}
              sx={{ py: 1.5, bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' } }}
            >
              {transferLoading ? 'Virement...' : 'Transférer'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  // Tab 5: Invoices and utility bills (Factures)
  const renderBills = () => (
    <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
      <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800, mb: 1 }}>
        Paiement des Factures
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Consultez et réglez vos factures courantes (Internet, Eau, Électricité) d'un simple clic.
      </Typography>

      {billsError && <Alert severity="error" sx={{ borderRadius: '5px', mb: 3 }}>{billsError}</Alert>}
      {billsSuccess && <Alert severity="success" sx={{ borderRadius: '5px', mb: 3 }}>{billsSuccess}</Alert>}

      {billsLoading && bills.length === 0 ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {bills.map((bill) => {
            const isPaid = bill.statut === 'PAID';
            return (
              <Grid key={bill.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 3,
                    borderRadius: '5px',
                    bgcolor: isPaid ? innerBg : cardBg,
                    position: 'relative'
                  }}
                >
                  <Typography variant="subtitle1" color="text.primary" gutterBottom sx={{ fontWeight: 800 }}>
                    {bill.fournisseur}
                  </Typography>
                  <Typography variant="h5" color={isPaid ? 'text.secondary' : '#54E3FF'} sx={{ fontWeight: 900, mt: 1.5 }}>
                    {formatAmount(bill.montant, currentAccount?.devise || 'MAD')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Échéance: {new Date(bill.dateEcheance).toLocaleDateString('fr-FR')}
                  </Typography>

                  <Box sx={{ mt: 3, display: 'flex', width: '100%' }}>
                    {isPaid ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', gap: 1 }}>
                        <CheckCircleRoundedIcon fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Facture réglée</Typography>
                      </Box>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        disabled={billsLoading}
                        onClick={() => handlePayBill(bill.id)}
                        sx={{ bgcolor: 'primary.main', color: '#000000', '&:hover': { bgcolor: '#3B82F6' }, borderRadius: '5px' }}
                      >
                        Payer maintenant
                      </Button>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Paper>
  );

  // Tab Support: Demandes Administratives
  const renderSupport = () => (
    <Paper elevation={1} sx={{ p: 0, borderRadius: '5px', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', height: '600px' }}>
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Demande administrative
        </Typography>
        <Typography variant="body2" color="text.secondary">Contactez votre conseiller pour vos demandes administratives.</Typography>
      </Box>
      <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {supportMessages.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            Aucun message. Commencez la discussion.
          </Typography>
        )}
        {supportMessages.map((msg, index) => {
          const isSender = msg.senderId === user?.id;
          return (
            <Box key={index} sx={{ alignSelf: isSender ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              {!isSender && (
                <Avatar src={msg.senderAvatar || advisorInfo?.avatar} sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.9rem', borderRadius: '5px' }}>
                  {msg.senderName ? msg.senderName.charAt(0) : 'C'}
                </Avatar>
              )}
              <Paper elevation={0} sx={{
                p: 2,
                borderRadius: '5px',
                bgcolor: isSender ? 'primary.main' : innerBg,
                color: isSender ? 'primary.contrastText' : 'text.primary',
                border: isSender ? 'none' : `1px solid ${borderColor}`
              }}>
                <Typography variant="body1">{msg.content}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7, textAlign: isSender ? 'right' : 'left' }}>
                  {new Date(msg.timestamp).toLocaleString()}
                </Typography>
              </Paper>
              {isSender && (
                <Avatar src={user?.avatar} sx={{ bgcolor: 'primary.dark', width: 32, height: 32, fontSize: '0.9rem', borderRadius: '5px' }}>
                  {user?.prenom?.charAt(0) || 'U'}
                </Avatar>
              )}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ p: 2, borderTop: `1px solid ${borderColor}`, bgcolor: innerBg }}>
        {supportError && <Alert severity="error" sx={{ mb: 2, borderRadius: '5px' }}>{supportError}</Alert>}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Écrivez votre message..."
            value={supportInput}
            onChange={(e) => setSupportInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendSupportMessage(); }}
            disabled={supportLoading}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '5px' } }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendSupportMessage}
            disabled={supportLoading || !supportInput.trim()}
            sx={{ borderRadius: '5px', px: 4 }}
          >
            {supportLoading ? <CircularProgress size={24} color="inherit" /> : 'Envoyer'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );

  // Tab 6: User Profile Details with Password Update form and Profile Edit
  const renderProfile = () => (
    <Stack spacing={4}>
      <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
        <Typography variant="h5" color="text.primary" sx={{ fontWeight: 800, mb: 3 }}>
          Détails de votre Profil
        </Typography>

        {profileError && <Alert severity="error" sx={{ mb: 3, borderRadius: '5px' }}>{profileError}</Alert>}
        {profileSuccess && <Alert severity="success" sx={{ mb: 3, borderRadius: '5px' }}>{profileSuccess}</Alert>}

        <Grid container spacing={4}>
          <Grid sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} size={{ xs: 12, md: 4 }}>
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

            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800, mt: 1 }}>
              {user?.prenom} {user?.nom}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {user?.email}
            </Typography>

            <Box sx={{ bgcolor: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', color: 'success.main', px: 2, py: 0.8, borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleRoundedIcon fontSize="small" />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>KYC VALIDÉ</Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700, mb: 2 }}>
              Informations de contact (Modifiables)
            </Typography>

            <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    size="small"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Adresse physique"
                    size="small"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
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

            <Divider sx={{ my: 3, borderColor }} />

            <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700, mb: 2 }}>
              Informations complémentaires
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Nom complet', value: `${user?.prenom} ${user?.nom}` },
                { label: 'Adresse e-mail', value: user?.email },
                { label: 'Date de naissance', value: user?.dateNaissance || 'Non renseignée' },
                { label: 'Numéro de Passeport / CNI', value: user?.numeroPasseport || 'Non renseigné' },
                { label: 'Date de délivrance', value: user?.dateDelivrance || 'Non renseignée' },
                { label: 'Identifiant Fiscal (NIF)', value: user?.numeroNif || 'Non renseigné' },
                { label: 'Pays de résidence fiscale', value: user?.paysResidenceFiscale || 'Non renseigné' },
                { label: 'Profession', value: user?.profession || 'Non renseigné' },
                { label: 'Tranche de revenus', value: user?.trancheRevenus || 'Non renseignée' },
                { label: 'Origine des fonds', value: user?.origineFonds || 'Non renseignée' },
                { label: 'Rôle utilisateur', value: 'Client Particulier' }
              ].map((field, idx) => (
                <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                  <Box sx={{ p: 2, bgcolor: innerBg, borderRadius: '5px' }}>
                    <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {field.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Password Changer */}
      <Paper elevation={1} sx={{ p: 4, borderRadius: '5px', bgcolor: 'background.paper' }}>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
          Sécurité & Mot de passe
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Mettez à jour votre mot de passe pour sécuriser votre compte Banque.
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
  );

  const renderNotifications = () => {
    const filteredNotifs = notifications.filter(n => {
      if (notifFilter === 'unread') return !n.readStatus;
      return true;
    });

    const getIcon = (text: string) => {
      const lower = text.toLowerCase();
      if (lower.includes('virement')) return <SwapHorizRoundedIcon sx={{ color: '#54E3FF' }} />;
      if (lower.includes('carte')) return <CreditCardRoundedIcon sx={{ color: '#10B981' }} />;
      if (lower.includes('kyc')) return <PersonOutlineRoundedIcon sx={{ color: '#F59E0B' }} />;
      if (lower.includes('facture')) return <ReceiptLongRoundedIcon sx={{ color: '#EF4444' }} />;
      if (lower.includes('rechargé') || lower.includes('alimentation')) return <AccountBalanceWalletOutlinedIcon sx={{ color: '#8B5CF6' }} />;
      return <NotificationsOutlinedIcon sx={{ color: '#94A3B8' }} />;
    };

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', width: '100%', py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={notifFilter === 'all' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setNotifFilter('all')}
              sx={{ borderRadius: '5px', textTransform: 'none' }}
            >
              Toutes ({notifications.length})
            </Button>
            <Button
              variant={notifFilter === 'unread' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setNotifFilter('unread')}
              sx={{ borderRadius: '5px', textTransform: 'none' }}
              color="error"
            >
              Non lues ({notifications.filter(n => !n.readStatus).length})
            </Button>
          </Box>
          {notifications.some(n => !n.readStatus) && (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleMarkAllAsRead}
              startIcon={<NotificationsOutlinedIcon />}
              sx={{ borderRadius: '5px', textTransform: 'none', ml: 'auto', mr: 2 }}
            >
              Tout marquer comme lu
            </Button>
          )}
          {notifications.some(n => n.readStatus) && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteAllRead}
              startIcon={<DeleteOutlineRoundedIcon />}
              sx={{ borderRadius: '5px', textTransform: 'none' }}
            >
              Tout supprimer (lus)
            </Button>
          )}
        </Box>

        {filteredNotifs.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '5px', bgcolor: 'background.paper' }}>
            <NotificationsOutlinedIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }} color="text.primary">
              Aucune notification
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Vous n'avez pas de notification correspondant à ce filtre.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filteredNotifs.map(n => (
              <Paper
                key={n.id}
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: '5px',
                  border: `1px solid ${n.readStatus ? borderColor : 'rgba(48, 207, 239, 0.35)'}`,
                  bgcolor: n.readStatus ? cardBg : 'rgba(84, 227, 255, 0.03)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#54E3FF'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: '50%',
                    bgcolor: n.readStatus ? 'rgba(148, 163, 184, 0.1)' : 'rgba(48, 207, 239, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(n.text)}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      color="text.primary"
                      sx={{
                        fontWeight: n.readStatus ? 500 : 700,
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}
                    >
                      {n.text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(n.dateCreation).toLocaleString('fr-FR')}
                    </Typography>
                  </Box>
                  {!n.readStatus && (
                    <Box sx={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleMarkAsRead(n.id)}
                        sx={{ color: '#54E3FF', textTransform: 'none', fontWeight: 600 }}
                      >
                        Marquer lu
                      </Button>
                    </Box>
                  )}
                  <Box sx={{ flexShrink: 0 }}>
                    <IconButton size="small" color="error" onClick={() => handleDeleteNotification(n.id)}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    );
  };

  // Tab Chatbot: Assistant IA Dedicated Page
  const renderChatbot = () => {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 0,
          borderRadius: '5px',
          height: 'calc(100vh - 240px)',
          minHeight: '480px',
          maxHeight: '680px',
          bgcolor: 'background.paper',
          border: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ px: 3, py: 2, bgcolor: isDark ? 'rgba(5, 11, 20, 0.4)' : 'rgba(248, 250, 252, 0.5)', display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${borderColor}` }}>
          <Avatar sx={{ bgcolor: 'primary.main', color: '#000000', width: 40, height: 40, fontWeight: 700 }}>AI</Avatar>
          <Box>
            <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Conseiller Financier Personnel (IA)</Typography>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>Assistant Virtuel Intelligent Actif</Typography>
          </Box>
        </Box>

        {/* Message area */}
        <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {chatMessages.map((msg, idx) => {
            const isBot = msg.sender === 'bot';
            return (
              <Box key={idx} sx={{ alignSelf: isBot ? 'flex-start' : 'flex-end', maxWidth: '75%', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                {isBot && (
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '0.9rem' }}>IA</Avatar>
                )}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: isBot ? (isDark ? 'rgba(5, 11, 20, 0.3)' : 'rgba(248, 250, 252, 0.6)') : 'primary.main',
                    color: isBot ? (isDark ? '#FFFFFF' : '#0F172A') : '#000000',
                    border: isBot ? '1px solid rgba(84, 227, 255, 0.08)' : 'none',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {renderMessageText(msg.text)}
                </Box>
                {!isBot && (
                  <Avatar sx={{ bgcolor: 'primary.dark', width: 32, height: 32, fontSize: '0.9rem' }}>
                    {user?.prenom?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                )}
              </Box>
            );
          })}
          <div ref={chatEndRefPage} />
        </Box>

        {/* Quick action prompts */}
        <Box sx={{ px: 3, py: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, borderTop: `1px solid ${borderColor}`, bgcolor: isDark ? 'rgba(7, 17, 31, 0.2)' : 'rgba(255, 255, 255, 0.3)' }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => sendMessage("Consulter mon solde")}
            startIcon={<BarChartRoundedIcon fontSize="small" />}
            sx={{ borderRadius: '15px', color: 'primary.main', borderColor: 'rgba(84, 227, 255, 0.25)', fontSize: '0.75rem', py: 0.5, px: 2 }}
          >
            Consulter mon solde
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => sendMessage("Analyser mes dépenses")}
            startIcon={<TrendingDownRoundedIcon fontSize="small" />}
            sx={{ borderRadius: '15px', color: 'primary.main', borderColor: 'rgba(84, 227, 255, 0.25)', fontSize: '0.75rem', py: 0.5, px: 2 }}
          >
            Analyser mes dépenses
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => sendMessage("Conseils d'épargne")}
            startIcon={<LightbulbRoundedIcon fontSize="small" />}
            sx={{ borderRadius: '15px', color: 'primary.main', borderColor: 'rgba(84, 227, 255, 0.25)', fontSize: '0.75rem', py: 0.5, px: 2 }}
          >
            Conseils d'épargne
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => sendMessage("Simuler un placement")}
            startIcon={<MonetizationOnRoundedIcon fontSize="small" />}
            sx={{ borderRadius: '15px', color: 'primary.main', borderColor: 'rgba(84, 227, 255, 0.25)', fontSize: '0.75rem', py: 0.5, px: 2 }}
          >
            Simuler un placement
          </Button>
        </Box>

        {/* Input box */}
        <Box component="form" onSubmit={handleSendChatMessage} sx={{ p: 2, bgcolor: isDark ? 'rgba(5, 11, 20, 0.2)' : 'rgba(248, 250, 252, 0.3)', borderTop: `1px solid ${borderColor}` }}>
          <TextField
            fullWidth
            placeholder="Posez une question sur vos soldes, vos virements ou des conseils financiers..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton type="submit" sx={{ color: 'primary.main' }}>
                      <SendRoundedIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </Box>
      </Paper>
    );
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
      WebkitBackdropFilter: 'blur(16px)',
      transition: 'padding 0.2s ease-in-out'
    }}>
      <Stack spacing={4}>
        {/* Brand Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: 1.5, px: 1, cursor: 'pointer' }} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}>
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
            { id: 'dashboard', label: 'Dashboard', icon: <GridViewRoundedIcon /> },
            { id: 'stats', label: 'Statistiques', icon: <BarChartRoundedIcon /> },
            { id: 'wallet', label: 'Portefeuille', icon: <AccountBalanceWalletOutlinedIcon /> },
            { id: 'cards', label: 'Cartes', icon: <CreditCardRoundedIcon /> },
            { id: 'transfers', label: 'Virements', icon: <SwapHorizRoundedIcon /> },
            { id: 'bills', label: 'Factures', icon: <ReceiptLongRoundedIcon /> },
            { id: 'support', label: 'Support Conseiller', icon: <ForumRoundedIcon /> },
            { id: 'chatbot', label: 'Assistant IA', icon: <ChatBubbleRoundedIcon /> },
            { id: 'profile', label: 'Profil', icon: <PersonOutlineRoundedIcon /> }
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
                <Tooltip key={item.id} title={item.label} placement="right" arrow>
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
              borderRight: `1px solid ${borderColor}`
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
          {/* Left: Hamburger menu for mobile & Breadcrumbs */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' }, color: 'primary.main', mr: 1 }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
              {bankName} &nbsp;&gt;&nbsp; Espace Client &nbsp;&gt;&nbsp; <span style={{ color: 'primary.main', fontWeight: 600 }}>
                {activeTab === 'dashboard' && "Vue d'ensemble"}
                {activeTab === 'stats' && "Statistiques financières"}
                {activeTab === 'wallet' && "Portefeuille & Comptes"}
                {activeTab === 'cards' && "Mes Cartes Bancaires"}
                {activeTab === 'transfers' && "Bénéficiaires & Virements"}
                {activeTab === 'bills' && "Règlement de factures"}
                {activeTab === 'notifications' && "Centre de Notifications"}
                {activeTab === 'support' && "Demandes Administratives"}
                {activeTab === 'profile' && "Détails du profil"}
                {activeTab === 'chatbot' && "Assistant IA"}
              </span>
            </Typography>
          </Stack>

          {/* Right: Actions & User Info */}
          <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
            <LanguageSelector />
            <IconButton onClick={toggleTheme} sx={{ color: 'primary.main' }}>
              {mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
            <IconButton sx={{ color: 'primary.main' }} onClick={() => setActiveTab('profile')}><SettingsOutlinedIcon /></IconButton>
            <IconButton sx={{ color: 'primary.main', position: 'relative' }} onClick={(e) => setNotifAnchorEl(e.currentTarget)}>
              <Badge color="error" variant="dot" invisible={notifications.every(n => n.readStatus)}>
                <NotificationsOutlinedIcon />
              </Badge>
            </IconButton>

            {/* Notifications Popover */}
            <Popover
              open={Boolean(notifAnchorEl)}
              anchorEl={notifAnchorEl}
              onClose={() => setNotifAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: {
                  sx: {
                    width: 360,
                    bgcolor: isDark ? 'rgba(7, 17, 31, 0.95)' : '#FFFFFF',
                    backdropFilter: 'blur(10px)',
                    boxShadow: 'none',
                    borderRadius: '5px',
                    p: 2,
                    maxHeight: 450,
                    display: 'flex',
                    flexDirection: 'column'
                  }
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  Notifications
                </Typography>
                {notifications.some(n => !n.readStatus) && (
                  <Button
                    size="small"
                    onClick={handleMarkAllAsRead}
                    sx={{ fontSize: '0.75rem', color: '#54E3FF', p: 0, minWidth: 0, textTransform: 'none', fontWeight: 700 }}
                  >
                    Tout lire
                  </Button>
                )}
              </Box>
              <Divider sx={{ mb: 1.5, borderColor: 'rgba(84, 227, 255, 0.08)' }} />

              {notifications.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <NotificationsOutlinedIcon sx={{ fontSize: 32, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Aucune notification.</Typography>
                </Box>
              ) : (
                <Box sx={{ overflowY: 'auto', flexGrow: 1, pr: 0.5, mb: 1 }}>
                  <Stack spacing={1}>
                    {notifications.slice(0, 5).map(n => {
                      const lower = n.text.toLowerCase();
                      const getPopoverIcon = () => {
                        if (lower.includes('virement')) return <SwapHorizRoundedIcon sx={{ color: '#54E3FF', fontSize: 18 }} />;
                        if (lower.includes('carte')) return <CreditCardRoundedIcon sx={{ color: '#10B981', fontSize: 18 }} />;
                        if (lower.includes('kyc')) return <PersonOutlineRoundedIcon sx={{ color: '#F59E0B', fontSize: 18 }} />;
                        if (lower.includes('facture')) return <ReceiptLongRoundedIcon sx={{ color: '#EF4444', fontSize: 18 }} />;
                        if (lower.includes('rechargé') || lower.includes('alimentation')) return <AccountBalanceWalletOutlinedIcon sx={{ color: '#8B5CF6', fontSize: 18 }} />;
                        return <NotificationsOutlinedIcon sx={{ color: '#94A3B8', fontSize: 18 }} />;
                      };

                      return (
                        <Box
                          key={n.id}
                          onClick={() => {
                            handleMarkAsRead(n.id);
                          }}
                          sx={{
                            p: 1.2,
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: 1.5,
                            alignItems: 'flex-start',
                            bgcolor: n.readStatus ? 'transparent' : 'rgba(84, 227, 255, 0.05)',
                            border: `1px solid ${n.readStatus ? 'transparent' : 'rgba(48, 207, 239, 0.15)'}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                              borderColor: borderColor
                            }
                          }}
                        >
                          <Box sx={{
                            p: 0.5,
                            borderRadius: '50%',
                            bgcolor: n.readStatus ? 'rgba(148, 163, 184, 0.1)' : 'rgba(84, 227, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0
                          }}>
                            {getPopoverIcon()}
                          </Box>

                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{
                                fontWeight: n.readStatus ? 400 : 700,
                                lineHeight: 1.3,
                                fontSize: '0.82rem',
                                wordBreak: 'break-word'
                              }}
                            >
                              {n.text}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                              {new Date(n.dateCreation).toLocaleTimeString('fr-FR')}
                            </Typography>
                          </Box>

                          {!n.readStatus && (
                            <Box sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: '#54E3FF',
                              mt: 1,
                              flexShrink: 0
                            }} />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              <Divider sx={{ my: 1, borderColor: 'rgba(84, 227, 255, 0.08)' }} />
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setNotifAnchorEl(null);
                  setActiveTab('notifications');
                }}
                sx={{
                  color: '#54E3FF',
                  borderColor: 'rgba(48, 207, 239, 0.3)',
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1,
                  fontSize: '0.8rem',
                  '&:hover': {
                    borderColor: '#54E3FF',
                    bgcolor: 'rgba(84, 227, 255, 0.05)'
                  }
                }}
              >
                Voir toutes les notifications
              </Button>
            </Popover>

            <Avatar
              src={user?.avatar}
              sx={{ width: 38, height: 38, border: '1px solid rgba(84, 227, 255, 0.2)', bgcolor: 'primary.main', color: '#000000', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setActiveTab('profile')}
            >
              {!user?.avatar && `${user?.prenom?.[0]?.toUpperCase() || 'U'}${user?.nom?.[0]?.toUpperCase() || ''}`}
            </Avatar>
          </Stack>
        </Box>

        {/* 3. Main Dashboard Layout (Split screen) */}
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left Panel: Primary Content (Scrollable) */}
          <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, pb: 10 }}>


            {error && (
              <Alert severity="error" sx={{ borderRadius: '5px' }}>{error}</Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'stats' && renderStats()}
                {activeTab === 'wallet' && renderWallet()}
                {activeTab === 'cards' && renderCards()}
                {activeTab === 'transfers' && renderTransfers()}
                {activeTab === 'bills' && renderBills()}
                {activeTab === 'notifications' && renderNotifications()}
                {activeTab === 'support' && renderSupport()}
                {activeTab === 'chatbot' && renderChatbot()}
                {activeTab === 'profile' && renderProfile()}
              </>
            )}

          </Box>

          {/* Right Panel: Side bar (Visual cards & Details) */}
          <Box sx={{
            width: 380,
            bgcolor: 'background.paper',
            borderLeft: '1px solid rgba(84, 227, 255, 0.12)',
            p: 4,
            display: { 
              xs: 'none', 
              lg: (activeTab === 'support' || activeTab === 'chatbot') ? 'none' : 'flex' 
            },
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto'
          }}>
            {/* Upper: Your Cards */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>
                  Vos Cartes
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" sx={{ bgcolor: innerBg, color: 'primary.main' }}><ArrowBackIosNewRoundedIcon sx={{ fontSize: 12 }} /></IconButton>
                  <IconButton size="small" sx={{ bgcolor: innerBg, color: 'primary.main' }}><ArrowForwardIosRoundedIcon sx={{ fontSize: 12 }} /></IconButton>
                </Stack>
              </Box>

              {/* Stacked Cards Mockup */}
              <Box sx={{ position: 'relative', height: 210, mb: 4 }}>
                <Box sx={{
                  position: 'absolute', top: 0, left: 10, right: 10, height: 160,
                  bgcolor: innerBg, borderRadius: '5px', p: 3, color: isDark ? '#FFFFFF' : '#0F172A',
                  transform: 'scale(0.92)', opacity: 0.6,
                  boxShadow: 'none'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 3 }}>•••• 6789</Typography>
                </Box>

                {cards.length > 0 ? (
                  <Box sx={{
                    position: 'absolute', top: 15, left: 0, right: 0, height: 170,
                    background: cards[0].stripeColor === 'DARK'
                      ? (isDark ? "linear-gradient(135deg, #07111F 0%, #000000 100%)" : "linear-gradient(135deg, #F1F5F9 0%, #CBD5E1 100%)")
                      : (isDark ? 'linear-gradient(135deg, #54E3FF 0%, #07111F 100%)' : 'linear-gradient(135deg, #54E3FF 0%, #FFFFFF 100%)'),
                    borderRadius: '5px', p: 3, color: isDark ? 'white' : '#0F172A',
                    border: '1px solid rgba(84, 227, 255, 0.2)',
                    boxShadow: 'none',
                    display: 'flex', flexDirection: 'column', justifyStyle: 'space-between',
                    transition: 'all 0.3s',
                    opacity: cards[0].statut === 'BLOQUEE' ? 0.75 : 1
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                      <Logo onDarkBg={isDark} />
                      <Typography color={isDark ? '#54E3FF' : '#00B4D8'} sx={{ fontWeight: 800, fontStyle: 'italic' }}>
                        {cards[0].type}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: 3 }}>
                        •••• •••• •••• {cards[0].numeroCarte.slice(-4)}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          {cards[0].titulaire}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>{cards[0].dateExpiration}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{
                    position: 'absolute', top: 15, left: 0, right: 0, height: 170,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '5px', p: 3,
                    border: '1px dashed rgba(84, 227, 255, 0.2)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    transition: 'all 0.3s'
                  }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Vous n'avez pas de carte active.
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Account Details Box */}
              <Box sx={{ bgcolor: innerBg, p: 3, borderRadius: '5px' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
                  Détails du compte
                </Typography>

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">IBAN :</Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {currentAccount?.numeroCompte || 'MA64...'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Offre :</Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                      {currentAccount?.typeCompte === 'PREMIUM' ? 'PREMIUM (Métal Noir)' : 'STANDARD (Gratuit)'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Devise principale :</Typography>
                    <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>
                      {currentAccount?.devise || 'EUR'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>

            {/* Quick Actions Services */}
            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>Services</Typography>
              </Box>

              <Stack spacing={1.5}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '5px',
                    bgcolor: innerBg,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: isDark ? 'rgba(59, 130, 2462,0.05)' : 'rgba(84, 227, 255, 0.05)', borderColor: '#54E3FF' }
                  }}
                  onClick={() => setActiveTab('bills')}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: isDark ? 'rgba(59, 130, 2462,0.1)' : 'rgba(84, 227, 255, 0.1)', color: 'primary.main', width: 36, height: 36 }}>
                      <ReceiptLongRoundedIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography color="text.primary" sx={{ fontSize: '0.9rem', fontWeight: 700 }}>Factures</Typography>
                      <Typography variant="caption" color="text.secondary">Gérer mes paiements</Typography>
                    </Box>
                  </Stack>
                  <Typography color="#54E3FF" sx={{ fontWeight: 800 }}>&gt;</Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '5px',
                    bgcolor: innerBg,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: isDark ? 'rgba(59, 130, 2462,0.05)' : 'rgba(84, 227, 255, 0.05)', borderColor: '#54E3FF' }
                  }}
                  onClick={() => setActiveTab('transfers')}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: isDark ? 'rgba(59, 130, 2462,0.1)' : 'rgba(84, 227, 255, 0.1)', color: 'primary.main', width: 36, height: 36 }}>
                      <SwapHorizRoundedIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography color="text.primary" sx={{ fontSize: '0.9rem', fontWeight: 700 }}>Mes bénéficiaires</Typography>
                      <Typography variant="caption" color="text.secondary">Gérer mes destinataires</Typography>
                    </Box>
                  </Stack>
                  <Typography color="#54E3FF" sx={{ fontWeight: 800 }}>&gt;</Typography>
                </Paper>
              </Stack>
            </Box>

          </Box>
        </Box>
      </Box>

      {/* Floating AI Banking Chatbot Widget */}
      <Box sx={{ position: 'fixed', bottom: { xs: 80, md: 30 }, right: 30, zIndex: 1000 }}>
        {!isChatOpen ? (
          <IconButton
            onClick={() => setIsChatOpen(true)}
            sx={{
              width: 60,
              height: 60,
              bgcolor: 'primary.main',
              color: '#000000',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#3B82F6', boxShadow: 'none' }
            }}
          >
            <ChatBubbleRoundedIcon />
          </IconButton>
        ) : (
          <Paper
            elevation={0}
            sx={{
              width: { xs: 320, sm: 360 },
              height: 465,
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: 'none',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <Box sx={{ px: 3, py: 2, bgcolor: isDark ? 'rgba(5, 11, 20, 0.4)' : 'rgba(248, 250, 252, 0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderColor}` }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', color: '#000000', width: 32, height: 32, fontWeight: 700 }}>AI</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>Conseiller Banque</Typography>
                  <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>IA Active</Typography>
                </Box>
              </Stack>
              <IconButton size="small" onClick={() => setIsChatOpen(false)} sx={{ color: 'text.secondary' }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Messages body */}
            <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {chatMessages.map((msg, idx) => {
                const isBot = msg.sender === 'bot';
                return (
                  <Box key={idx} sx={{ alignSelf: isBot ? 'flex-start' : 'flex-end', maxWidth: '85%', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    {isBot && (
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 28, height: 28, fontSize: '0.8rem' }}>IA</Avatar>
                    )}
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '8px',
                        bgcolor: isBot ? (isDark ? 'rgba(5, 11, 20, 0.3)' : 'rgba(248, 250, 252, 0.6)') : 'primary.main',
                        color: isBot ? (isDark ? '#FFFFFF' : '#0F172A') : '#000000',
                        border: isBot ? (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)') : 'none',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {renderMessageText(msg.text)}
                    </Box>
                    {!isBot && (
                      <Avatar sx={{ bgcolor: 'primary.dark', width: 28, height: 28, fontSize: '0.8rem' }}>
                        {user?.prenom?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                    )}
                  </Box>
                );
              })}
              <div ref={chatEndRefPopup} />
            </Box>

            {/* Quick action prompts */}
            <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1, overflowX: 'auto', borderTop: `1px solid ${borderColor}`, bgcolor: isDark ? 'rgba(7, 17, 31, 0.2)' : 'rgba(255, 255, 255, 0.3)', whiteSpace: 'nowrap', '&::-webkit-scrollbar': { display: 'none' } }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => sendMessage("Consulter mon solde")}
                startIcon={<BarChartRoundedIcon fontSize="small" />}
                sx={{ borderRadius: '15px', color: 'primary.main', borderColor: 'divider', fontSize: '0.7rem', py: 0.2, px: 1.2, minWidth: 'auto', flexShrink: 0 }}
              >
                Solde
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => sendMessage("Analyser mes dépenses")}
                startIcon={<TrendingDownRoundedIcon fontSize="small" />}
                sx={{ borderRadius: '15px', color: 'primary.main', borderColor: 'divider', fontSize: '0.7rem', py: 0.2, px: 1.2, minWidth: 'auto', flexShrink: 0 }}
              >
                Dépenses
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => sendMessage("Conseils d'épargne")}
                startIcon={<LightbulbRoundedIcon fontSize="small" />}
                sx={{ borderRadius: '15px', color: 'primary.main', borderColor: 'divider', fontSize: '0.7rem', py: 0.2, px: 1.2, minWidth: 'auto', flexShrink: 0 }}
              >
                Épargne
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => sendMessage("Simuler un placement")}
                startIcon={<MonetizationOnRoundedIcon fontSize="small" />}
                sx={{ borderRadius: '15px', color: 'primary.main', borderColor: 'divider', fontSize: '0.7rem', py: 0.2, px: 1.2, minWidth: 'auto', flexShrink: 0 }}
              >
                Placement
              </Button>
            </Box>

            {/* Input field */}
            <Box component="form" onSubmit={handleSendChatMessage} sx={{ p: 2, bgcolor: isDark ? 'rgba(5, 11, 20, 0.2)' : 'rgba(248, 250, 252, 0.3)', borderTop: `1px solid ${borderColor}` }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Posez votre question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="submit" size="small" sx={{ color: 'primary.main' }}>
                          <SendRoundedIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Box>
          </Paper>
        )}
      </Box>

      {/* Mobile bottom navigation bar */}
      <Box className="mobile-nav-capsule" sx={{ display: { xs: 'flex', md: 'none' } }}>
        <Box 
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="mobile-nav-active-glow" />
          <GridViewRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Accueil</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 'wallet' ? 'active' : ''}`} 
          onClick={() => setActiveTab('wallet')}
        >
          <div className="mobile-nav-active-glow" />
          <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Solde</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 'cards' ? 'active' : ''}`} 
          onClick={() => setActiveTab('cards')}
        >
          <div className="mobile-nav-active-glow" />
          <CreditCardRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Cartes</span>
        </Box>
        <Box 
          className={`mobile-nav-item ${activeTab === 'transfers' ? 'active' : ''}`} 
          onClick={() => setActiveTab('transfers')}
        >
          <div className="mobile-nav-active-glow" />
          <SwapHorizRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Vir.</span>
        </Box>
        <Box 
          className="mobile-nav-item" 
          onClick={() => setMobileMenuOpen(true)}
        >
          <MenuRoundedIcon sx={{ fontSize: 20 }} />
          <span className="mobile-nav-label">Plus</span>
        </Box>
      </Box>

      {/* Dialogue Partage de RIB */}
      <Dialog
        open={isRibOpen}
        onClose={() => setIsRibOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(84, 227, 255, 0.2)',
              borderRadius: '5px',
              p: 3
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCodeRoundedIcon sx={{ color: 'primary.main' }} /> Partager mon RIB
          </Typography>
          <IconButton onClick={() => setIsRibOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {currentAccount ? (
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <Box
              sx={{
                p: 2,
                bgcolor: '#fff',
                borderRadius: '5px',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  JSON.stringify({
                    iban: currentAccount.numeroCompte,
                    nom: user?.nom,
                    prenom: user?.prenom
                  })
                )}`}
                alt="QR Code RIB"
                style={{ width: 180, height: 180 }}
              />
            </Box>

            <Box sx={{ width: '100%', bgcolor: innerBg, p: 2, borderRadius: '5px', border: `1px solid ${borderColor}`, textAlign: 'left' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>TITULAIRE</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                {user?.prenom} {user?.nom?.toUpperCase()}
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>IBAN / NUMÉRO DE COMPTE</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', mb: 1.5, color: 'text.primary', wordBreak: 'break-all' }}>
                {currentAccount.numeroCompte}
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>BANQUE</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {bankName}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(currentAccount.numeroCompte);
                  addLocalNotification("IBAN copié dans le presse-papiers.");
                }}
                sx={{ textTransform: 'none', color: 'primary.main', borderColor: '#54E3FF' }}
              >
                Copier l'IBAN
              </Button>
              <Button
                variant="contained"
                fullWidth
                size="small"
                onClick={() => {
                  window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                    JSON.stringify({
                      iban: currentAccount.numeroCompte,
                      nom: user?.nom,
                      prenom: user?.prenom
                    })
                  )}`, '_blank');
                }}
                sx={{ textTransform: 'none', color: 'black', bgcolor: 'primary.main', '&:hover': { bgcolor: '#3B82F6' } }}
              >
                Télécharger QR
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">Aucun compte actif trouvé.</Typography>
        )}
      </Dialog>

      {/* Dialogue Scanner de QR Code */}
      <Dialog
        open={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(84, 227, 255, 0.2)',
              borderRadius: '5px',
              p: 3
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCodeScannerRoundedIcon sx={{ color: 'primary.main' }} /> Scanner un RIB
          </Typography>
          <IconButton onClick={() => setIsQrScannerOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          {qrScannerError && <Alert severity="error" sx={{ width: '100%', borderRadius: '5px' }}>{qrScannerError}</Alert>}
          {qrScannerSuccess && <Alert severity="success" sx={{ width: '100%', borderRadius: '5px' }}>{qrScannerSuccess}</Alert>}

          {/* Camera Viewport */}
          {cameraActive && (
            <Box
              sx={{
                width: '100%',
                aspectRatio: '4/3',
                bgcolor: '#000',
                borderRadius: '5px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(84, 227, 255, 0.3)'
              }}
            >
              <video
                ref={qrVideoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas ref={qrCanvasRef} style={{ display: 'none' }} />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Cadrez le QR Code de la banque dans l'objectif ou importez une image.<br />
            <span style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <InfoRoundedIcon sx={{ fontSize: '0.95rem', color: 'primary.main' }} /> Pour obtenir votre propre QR Code de RIB et le partager, rendez-vous sur l'Accueil et cliquez sur <strong>"RIB/QR"</strong> à côté de votre solde disponible.
            </span>
          </Typography>

          <Stack direction="row" spacing={2} sx={{ width: '100%', mt: 1 }}>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              size="small"
              sx={{ textTransform: 'none', color: 'primary.main', borderColor: '#54E3FF' }}
            >
              Importer une image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleQrImageUpload}
              />
            </Button>
            {cameraActive ? (
              <Button
                variant="contained"
                color="error"
                fullWidth
                size="small"
                onClick={stopQrCamera}
                sx={{ textTransform: 'none' }}
              >
                Arrêter Caméra
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="small"
                onClick={startQrCamera}
                sx={{ textTransform: 'none', color: 'black', bgcolor: 'primary.main', '&:hover': { bgcolor: '#3B82F6' } }}
              >
                Activer Caméra
              </Button>
            )}
          </Stack>
        </Stack>
      </Dialog>
    </Box>
  );
}
