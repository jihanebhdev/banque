import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterStaffPage from './pages/RegisterStaffPage';
import LandingPage from './pages/LandingPage';
import OnboardingFlow from './pages/OnboardingFlow';
import Dashboard from './pages/Dashboard';
import EmployeWorkspace from './pages/EmployeWorkspace';
import AdminWorkspace from './pages/AdminWorkspace';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ClientInspectionPage from './pages/ClientInspectionPage';
import ContractSigningPage from './pages/ContractSigningPage';

import { useMemo, useEffect } from 'react';
import { useThemeStore } from './store/themeStore';
import { useConfigStore } from './store/configStore';
import { useLanguageStore } from './store/languageStore';

const queryClient = new QueryClient();

function App() {
  const { mode } = useThemeStore();
  const { language } = useLanguageStore();
  const { isAuthenticated, user } = useAuthStore();
  const { fetchConfig } = useConfigStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'fr');
  }, []);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#54E3FF',
        dark: '#06B6D4',
        light: '#ECFEFF'},
      secondary: {
        main: '#3B82F6',
        dark: '#1D4ED8',
        light: '#DBEAFE'},
      background: {
        default: mode === 'dark' ? '#020617' : '#F8FAFC',
        paper: mode === 'dark' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.7)'},
      text: {
        primary: mode === 'dark' ? '#FFFFFF' : '#0F172A',
        secondary: mode === 'dark' ? '#B8C4CC' : '#475569'},
      success: {
        main: '#10B981'},
      warning: {
        main: '#F59E0B'},
      error: {
        main: '#EF4444'},
      divider: mode === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0, 0, 0, 0.05)'},
    typography: {
      fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.04em' },
      h2: { fontWeight: 700, letterSpacing: '-0.03em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '0.01em'}},
    shape: {
      borderRadius: 5},
    shadows: Array(25).fill('none') as any,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            padding: '10px 24px',
            borderRadius: '5px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'},
            '&.MuiButton-containedPrimary': {
              background: mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(84, 227, 255, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)'
                : 'linear-gradient(135deg, #54E3FF 0%, #3B82F6 100%)',
              color: mode === 'dark' ? '#000000' : '#FFFFFF',
              fontWeight: 700,
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                filter: 'brightness(1.15)',
                boxShadow: 'none'}
            },
            '&.MuiButton-outlinedPrimary': {
              borderColor: '#54E3FF',
              color: '#54E3FF',
              backdropFilter: 'blur(4px)',
              '&:hover': {
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(84, 227, 255, 0.1)'}
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '5px',
            background: mode === 'dark' 
              ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.6) 0%, rgba(7, 17, 31, 0.8) 100%)' 
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: mode === 'dark' ? '1px solid rgba(84, 227, 255, 0.15)' : '1px solid rgba(84, 227, 255, 0.2)',
            boxShadow: 'none',
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: '5px'},
          elevation1: {
            boxShadow: 'none',
            border: mode === 'dark' ? '1px solid rgba(84, 227, 255, 0.15)' : '1px solid rgba(84, 227, 255, 0.2)',
            background: mode === 'dark' 
              ? 'linear-gradient(145deg, rgba(7, 17, 31, 0.5) 0%, rgba(2, 6, 23, 0.7) 100%)' 
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '5px'}
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 5,
              backgroundColor: mode === 'dark' ? 'rgba(5, 11, 20, 0.5)' : '#FFFFFF',
              color: mode === 'dark' ? '#FFFFFF' : '#0F172A',
              backdropFilter: 'blur(8px)',
              '& fieldset': {
                borderColor: mode === 'dark' ? 'rgba(84, 227, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'},
              '&:hover fieldset': {
                borderColor: mode === 'dark' ? 'rgba(84, 227, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'},
              '&.Mui-focused fieldset': {
                borderColor: '#54E3FF',
                borderWidth: '2px'},
              '&.Mui-focused': {
                backgroundColor: mode === 'dark' ? 'rgba(7, 17, 31, 0.7)' : '#FFFFFF',
                boxShadow: 'none'}
            },
            '& .MuiInputLabel-root': {
              color: mode === 'dark' ? '#B8C4CC' : '#475569',
              '&.Mui-focused': {
                color: '#3B82F6'}
            }
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: mode === 'dark' ? '1px solid rgba(66, 232, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
            color: mode === 'dark' ? '#FFFFFF' : '#0F172A',
            padding: '16px 20px'},
          head: {
            backgroundColor: mode === 'dark' ? 'rgba(5, 11, 20, 0.8)' : '#F1F5F9',
            color: mode === 'dark' ? '#B8C4CC' : '#475569',
            fontWeight: 700}
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'dark' ? 'rgba(66, 232, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}
        }
      }
    }
  }), [mode]);


  const renderDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'ROLE_ADMIN') {
      return <AdminWorkspace />;
    } else if (user.role === 'ROLE_EMPLOYE') {
      return <EmployeWorkspace />;
    } else {
      if (!user.contratSigne) {
        return <ContractSigningPage />;
      }
      return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="liquid-blur-1"></div>
      <div className="liquid-blur-2"></div>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } />
            <Route path="/registre" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage defaultSignUp={true} />
            } />
            <Route path="/registre-employees" element={
              isAuthenticated ? <Navigate to="/" replace /> : <RegisterStaffPage />
            } />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <OnboardingFlow />
              </ProtectedRoute>
            } />
            
            <Route path="/employe/client/:id" element={
              <ProtectedRoute>
                <ClientInspectionPage />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            
            <Route path="/" element={
              isAuthenticated ? (
                <ProtectedRoute>
                  {renderDashboard()}
                </ProtectedRoute>
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
