import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// ─── Palette KmerFret — Agriculture Cameroun ─────────────────────────────────

export const KmerFretColors = {
  // Primaire : vert forêt camerounaise
  primary:          '#1B5E20',
  primaryLight:     '#2E7D32',
  primaryContainer: '#A5D6A7',
  // Secondaire : ocre terres agricoles
  secondary:        '#E65100',
  secondaryContainer: '#FFCC80',
  // Tertiaire : bleu ciel / eau
  tertiary:         '#0277BD',
  // États
  error:            '#B71C1C',
  success:          '#2E7D32',
  warning:          '#F57F17',
  info:             '#0277BD',
  // Surfaces light
  surface:          '#FAFAFA',
  background:       '#F5F5F5',
  card:             '#FFFFFF',
  border:           '#E0E0E0',
  // Textes light
  onPrimary:        '#FFFFFF',
  onSecondary:      '#FFFFFF',
  textPrimary:      '#212121',
  textSecondary:    '#757575',
  textMuted:        '#BDBDBD',
  // Surfaces dark
  surfaceDark:      '#1E1E1E',
  backgroundDark:   '#121212',
  cardDark:         '#2C2C2C',
  borderDark:       '#3A3A3A',
  textPrimaryDark:  '#F5F5F5',
  textSecondaryDark:'#BDBDBD',
};

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          KmerFretColors.primary,
    primaryContainer: KmerFretColors.primaryContainer,
    secondary:        KmerFretColors.secondary,
    secondaryContainer: KmerFretColors.secondaryContainer,
    surface:          KmerFretColors.surface,
    background:       KmerFretColors.background,
    error:            KmerFretColors.error,
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary:          '#81C784',
    primaryContainer: '#1B5E20',
    secondary:        '#FFAB40',
    surface:          KmerFretColors.surfaceDark,
    background:       KmerFretColors.backgroundDark,
    error:            '#EF9A9A',
    onSurface:        KmerFretColors.textPrimaryDark,
    onBackground:     KmerFretColors.textPrimaryDark,
  },
};

// ─── Hook couleurs contextuelles ─────────────────────────────────────────────

export function useColors(isDark: boolean) {
  return {
    background:    isDark ? KmerFretColors.backgroundDark  : KmerFretColors.background,
    card:          isDark ? KmerFretColors.cardDark         : KmerFretColors.card,
    border:        isDark ? KmerFretColors.borderDark       : KmerFretColors.border,
    textPrimary:   isDark ? KmerFretColors.textPrimaryDark  : KmerFretColors.textPrimary,
    textSecondary: isDark ? KmerFretColors.textSecondaryDark: KmerFretColors.textSecondary,
    primary:       isDark ? '#81C784'                       : KmerFretColors.primary,
    gradientStart: isDark ? '#1A2E1A'                       : '#1B5E20',
    gradientEnd:   isDark ? '#2A3D2A'                       : '#388E3C',
  };
}
