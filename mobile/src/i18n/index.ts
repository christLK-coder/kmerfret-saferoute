import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  fr: {
    // Navigation
    missions:    'Missions',
    map:         'Carte',
    profile:     'Profil',
    available:   'Disponibles',
    // Accueil importateur
    hello:       'Bonjour',
    myMissions:  'Gérez vos missions de transport',
    newMission:  'Nouvelle mission',
    noMission:   'Aucune mission',
    noMissionSub:'Créez votre première mission de transport',
    create:      'Créer une mission',
    // Statuts
    OPEN:        'Disponible',
    ASSIGNED:    'Assignée',
    IN_TRANSIT:  'En transit',
    DELIVERED:   'Livrée',
    CANCELLED:   'Annulée',
    DISPUTED:    'Litige',
    // Paiement
    paymentPending:   'En attente',
    paymentEscrowed:  'Séquestré',
    paymentReleased:  'Libéré',
    payAndEscrow:     'Payer & séquestrer les fonds',
    // Mission
    route:       'Itinéraire',
    cargo:       'Cargaison',
    payment:     'Paiement',
    origin:      'Origine',
    destination: 'Destination',
    weight:      'Poids',
    price:       'Prix',
    commission:  'Commission',
    driverPayout:'Payout chauffeur',
    // Actions
    accept:      'Accepter',
    start:       'Démarrer',
    deliver:     'Livrer (QR)',
    dispute:     'Signaler un problème',
    rate:        'Noter',
    scan:        'Scanner document',
    sos:         'Alerte SOS',
    // Auth
    login:       'Se connecter',
    register:    'S\'inscrire',
    logout:      'Se déconnecter',
    phone:       'Téléphone',
    password:    'Mot de passe',
    fullName:    'Nom complet',
    role:        'Rôle',
    importer:    'Exportateur / Producteur',
    driver:      'Chauffeur',
    // Erreurs
    networkError:'Erreur de connexion',
    required:    'Champ obligatoire',
    invalidPhone:'Format invalide (+237XXXXXXXXX)',
  },
  en: {
    missions:    'Missions',
    map:         'Map',
    profile:     'Profile',
    available:   'Available',
    hello:       'Hello',
    myMissions:  'Manage your transport missions',
    newMission:  'New mission',
    noMission:   'No missions',
    noMissionSub:'Create your first transport mission',
    create:      'Create mission',
    OPEN:        'Open',
    ASSIGNED:    'Assigned',
    IN_TRANSIT:  'In transit',
    DELIVERED:   'Delivered',
    CANCELLED:   'Cancelled',
    DISPUTED:    'Disputed',
    paymentPending:  'Pending',
    paymentEscrowed: 'Escrowed',
    paymentReleased: 'Released',
    payAndEscrow:    'Pay & escrow funds',
    route:       'Route',
    cargo:       'Cargo',
    payment:     'Payment',
    origin:      'Origin',
    destination: 'Destination',
    weight:      'Weight',
    price:       'Price',
    commission:  'Commission',
    driverPayout:'Driver payout',
    accept:      'Accept',
    start:       'Start',
    deliver:     'Deliver (QR)',
    dispute:     'Report a problem',
    rate:        'Rate',
    scan:        'Scan document',
    sos:         'SOS Alert',
    login:       'Sign in',
    register:    'Sign up',
    logout:      'Sign out',
    phone:       'Phone',
    password:    'Password',
    fullName:    'Full name',
    role:        'Role',
    importer:    'Exporter / Producer',
    driver:      'Driver',
    networkError:'Connection error',
    required:    'Required field',
    invalidPhone:'Invalid format (+237XXXXXXXXX)',
  },
};

export const i18n = new I18n(translations);

// Langue par défaut : système ou sauvegardée
const systemLocale = getLocales()[0]?.languageCode ?? 'fr';
i18n.locale = systemLocale.startsWith('en') ? 'en' : 'fr';
i18n.enableFallback = true;

export async function loadSavedLocale(): Promise<void> {
  const saved = await AsyncStorage.getItem('app_locale');
  if (saved === 'en' || saved === 'fr') i18n.locale = saved;
}

export async function setLocale(locale: 'fr' | 'en'): Promise<void> {
  i18n.locale = locale;
  await AsyncStorage.setItem('app_locale', locale);
}

export const t = (key: string, opts?: object) => i18n.t(key, opts);
