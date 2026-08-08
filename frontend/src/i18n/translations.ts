import { useLanguageStore } from '../store/languageStore';

export const translations = {
  FR: {
    // General
    logout: 'Se déconnecter',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    active: 'Actif',
    blocked: 'Bloqué',
    inactive: 'Inactif',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    back: 'Retour',
    continue: 'Continuer',
    submit: 'Soumettre',
    actions: 'Actions',
    date: 'Date',
    amount: 'Montant',
    status: 'Statut',
    type: 'Type',
    currency: 'Devise',
    description: 'Description',

    // Landing Page
    landingTitle: 'Espace Client Banque',
    landingSub: 'Votre portail bancaire sécurisé en ligne.',
    connect: 'Se connecter',
    register: 'S\'inscrire',
    heroButton: 'Commencer',
    heroFeatureTag: 'SERVICES EN LIGNE',
    heroFeatureDesc: 'Consultez vos comptes, effectuez des virements et gérez vos cartes bancaires.',
    feature1Title: 'Sécurité renforcée',
    feature1Desc: 'Chiffrement de vos données et authentification pour sécuriser vos opérations.',
    feature2Title: 'Virements simples',
    feature2Desc: 'Envoyez et recevez des fonds en toute simplicité.',
    feature3Title: 'Compte en Dirhams',
    feature3Desc: 'Gérez votre solde en Dirhams marocains (MAD) en toute transparence.',

    // Login Page
    loginTitle: 'Se connecter',
    loginSub: 'Saisissez vos identifiants ci-dessous pour accéder à votre espace Banque.',
    emailLabel: 'Adresse e-mail',
    passwordLabel: 'Mot de passe',
    newToBank: 'Nouveau sur Banque ?',
    createAccount: 'Créer un compte',
    loggingIn: 'Connexion...',
    loginBtn: 'Se connecter',
    staffRegisterLink: 'Rejoindre en tant que collaborateur',

    // Register Page
    registerTitle: 'Créer un compte',
    registerSub: 'Commencez dès aujourd\'hui et découvrez une nouvelle façon de gérer votre argent.',
    firstName: 'Prénom',
    lastName: 'Nom',
    alreadyHaveAccount: 'Déjà un compte ?',
    registerBtn: 'S\'inscrire',
    registering: 'Inscription...',

    // Staff Register Page
    staffRegisterTitle: 'Espace Collaborateurs - Inscription',
    staffRegisterSub: 'Créez votre compte professionnel pour gérer les dossiers clients et valider les transactions.',
    roleStaff: 'Rôle souhaité',
    roleEmploye: 'Employé (Conseiller Client)',
    roleAdmin: 'Administrateur',

    // Onboarding
    onboardingTitle: 'Finalisez votre compte',
    profileSetup: 'Configuration du profil',
    profileSetupSub: 'Complétez vos coordonnées pour que nous puissions valider l\'ouverture de votre compte.',
    phoneLabel: 'Téléphone portable',
    birthdateLabel: 'Date de naissance',
    addressLabel: 'Adresse postale de résidence (Maroc)',
    currencySetup: 'Devise principale du compte',
    currencySetupSub: 'Choisissez la devise dans laquelle vos comptes de paiement et vos opérations bancaires seront libellés.',
    planSetup: 'Sélectionnez votre produit de compte',
    planSetupSub: 'Sélectionnez l\'offre et le design de la carte bancaire VISA Banque que vous souhaitez obtenir.',
    standardPlan: 'Compte Standard',
    standardPlanDesc: 'Carte virtuelle et physique gratuites. Pas de frais mensuels. Support par chat standard.',
    premiumPlan: 'Compte Premium',
    premiumPlanDesc: '99 DH / mois. Carte Premium en métal noir. Cashback de 2% sur tous les achats. Support prioritaire.',
    kycReviewTitle: 'Dossier en cours d\'examen',
    kycReviewDesc: 'Merci, {{name}} ! Vos informations de profil et vos préférences de compte ont été transmises avec succès. Un conseiller de Banque valide actuellement vos pièces justificatives.',
    kycReviewAlert: 'Cette étape prend généralement moins de 24 heures. Vous recevrez un e-mail dès validation.',
    kycRefreshBtn: 'Actualiser le statut',
    kycStatusChecking: 'Vérification...',
    kycRejectedTitle: 'Dossier non conforme',
    kycRejectedDesc: 'Désolé, les informations fournies n\'ont pas pu être validées par nos services de conformité. Veuillez vérifier et soumettre à nouveau vos informations.',
    kycRestartBtn: 'Recommencer',
    onboardingStep1: 'Profil',
    onboardingStep1Desc: 'Informations personnelles',
    onboardingStep2: 'CNIE & OCR',
    onboardingStep2Desc: 'Extraction et scan de la carte d\'identité',
    onboardingStep3: 'Plan',
    onboardingStep3Desc: 'Choix de l\'offre & carte',
    onboardingNeedHelp: 'Besoin d\'aide ? Contactez le support Banque.',
    onboardingTerms: 'Conditions Générales • Confidentialité',

    // Dashboard
    dashWelcome: 'Ravi de vous revoir, {{name}}',
    dashSub: 'Voici un aperçu de vos comptes et de vos dernières activités financières.',
    menuDashboard: 'Dashboard',
    menuTransfers: 'Virements',
    menuCards: 'Cartes',
    menuChatbot: 'Assistant IA',
    menuSettings: 'Paramètres',
    accountsTitle: 'Vos comptes de paiement',
    balanceLabel: 'Solde total',
    addAccount: 'Ajouter un compte',
    recentTransactions: 'Dernières transactions',
    noTransactions: 'Aucune transaction enregistrée.',
    myCards: 'Mes cartes bancaires',
    cardStatusActive: 'CARTE ACTIVE',
    cardStatusBlocked: 'CARTE BLOQUÉE',
    cardToggleBlock: 'Bloquer la carte',
    cardToggleUnblock: 'Débloquer la carte',
    cardCreateBtn: 'Commander une carte',
    transferTitle: 'Effectuer un virement',
    transferSub: 'Transférez des fonds instantanément entre vos comptes ou vers un autre client.',
    transferSource: 'Compte source',
    transferDest: 'Compte destinataire',
    transferDestIBAN: 'IBAN du destinataire (Pour virement externe)',
    transferDestClient: 'Client destinataire (Banque)',
    transferMode: 'Type de transfert',
    transferModeInternal: 'Entre mes comptes',
    transferModeExternal: 'Vers un tiers',
    transferAmount: 'Montant à transférer',
    transferBtn: 'Valider le virement',
    chatbotTitle: 'Banque AI Assistant',
    chatbotPlaceholder: 'Posez une question sur vos soldes, vos virements ou des conseils financiers...',
    chatbotInitMsg: 'Bonjour {{name}}! Je suis votre assistant Banque IA. Comment puis-je vous aider aujourd\'hui ? Vous pouvez me poser des questions sur vos comptes, me demander d\'analyser vos dépenses, ou simuler des placements.',
    settingsTitle: 'Paramètres du compte',
    settingsSub: 'Gérez la sécurité de votre compte et mettez à jour votre mot de passe.',
    changePassword: 'Changer le mot de passe',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    passwordUpdated: 'Votre mot de passe a été mis à jour avec succès.',

    // Employee Workspace
    empTitle: 'Espace Collaborateur',
    empSub: 'Gestion des dossiers clients, validations KYC, et approbation des transactions.',
    tabKyc: 'Dossiers KYC',
    tabAccounts: 'Comptes Clients',
    tabTransactions: 'Transactions',
    kycPendingTitle: 'Dossiers KYC en attente de vérification',
    kycNoRequests: 'Aucun client en attente de validation KYC pour le moment.',
    kycAllDone: 'Tous les dossiers sont validés',
    kycVerifyBtn: 'Traiter le dossier',
    clientDetailsTitle: 'Détails du Client',
    clientStatus: 'Statut du compte',
    clientKycStatus: 'Statut KYC',
    clientPhone: 'TÉLÉPHONE',
    clientBirthdate: 'DATE DE NAISSANCE',
    clientAddress: 'ADRESSE',
    clientRegistered: 'INSCRIT LE',
    clientAccounts: 'Comptes Associés',
    clientNoAccounts: 'Aucun compte créé pour ce client.',
    kycApprove: 'Approuver KYC',
    kycReject: 'Rejeter KYC',
    accountCreateForClient: 'Ouvrir un nouveau compte',
    accountCreateSuccess: 'Compte créé avec succès.',
    transactionApprovalTitle: 'Transactions en attente d\'approbation',
    transactionNoPending: 'Aucune transaction en attente d\'approbation.',
    transactionApprove: 'Approuver',
    transactionReject: 'Rejeter',

    // Admin Workspace
    adminTitle: 'Console Administrateur',
    adminSub: 'Supervision de la plateforme, gestion des employés et journaux système.',
    tabEmployees: 'Gestion Employés',
    tabSystemLogs: 'Journal Système',
    tabStats: 'Statistiques Globales',
    empAddBtn: 'Inscrire un collaborateur',
    empListTitle: 'Liste des Collaborateurs',
    empRole: 'Rôle',
    empStatus: 'Statut',
    logListTitle: 'Journaux d\'Audit Système',
    logNoLogs: 'Aucun log enregistré dans le système.',
    statTitle: 'Indicateurs Clés d\'Activité',
    statTotalClients: 'Total Clients',
    statTotalAccounts: 'Total Comptes',
    statTotalTransfers: 'Transactions Validées',
    statDepositVolume: 'Volume des Dépôts',

    // Forgot / Reset Password
    forgotPasswordTitle: 'Mot de passe oublié',
    forgotPasswordSub: 'Saisissez votre e-mail pour recevoir un lien de réinitialisation sécurisé.',
    sendLink: 'Envoyer le lien',
    sendingLink: 'Envoi du lien...',
    backToLogin: 'Retour à la page de connexion',
    emailRequired: 'Veuillez saisir votre adresse e-mail.',
    resetPasswordTitle: 'Nouveau mot de passe',
    resetPasswordSub: 'Choisissez un mot de passe sécurisé pour votre compte.',
    newPasswordLabel: 'Nouveau mot de passe',
    confirmPasswordLabel: 'Confirmer le nouveau mot de passe',
    resetBtn: 'Réinitialiser le mot de passe',
    resetting: 'Réinitialisation...',
    passwordMismatch: 'Les mots de passe ne correspondent pas.',
    resetSuccess: 'Votre mot de passe a été réinitialisé avec succès.',
    resetError: 'Le lien est invalide ou a expiré.'
  },
};

export const useTranslation = () => {
  const language = 'FR';
  const setLanguage = (lang: string) => {};

  const t = (key: string, variables?: Record<string, string | number>) => {
    const keys = key.split('.');
    let translation: any = translations['FR'];
    for (const k of keys) {
      if (translation && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        return key; // Fallback to key name if not found
      }
    }
    
    if (typeof translation !== 'string') return key;

    let result = translation;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return result;
  };

  return { t, language, setLanguage };
};
