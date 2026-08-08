import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si l'utilisateur est un client, authentifié mais que le KYC n'est pas validé,
  // et qu'il n'est pas déjà sur la page d'onboarding, on le force à y aller.
  if (user.role === 'ROLE_CLIENT' && user.kycStatus !== 'VALIDATED' && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Si le client a fini son KYC et essaie d'aller sur /onboarding, on l'envoie à l'accueil
  if (user.role === 'ROLE_CLIENT' && user.kycStatus === 'VALIDATED' && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  // Si c'est un employé ou admin et qu'il essaie d'aller sur /onboarding, on le redirige à l'accueil
  if (user.role !== 'ROLE_CLIENT' && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return children;
}
