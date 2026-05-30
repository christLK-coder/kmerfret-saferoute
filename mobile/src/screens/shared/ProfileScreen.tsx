// Profil — actions rapides + dark mode + biométrie + flotte
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Avatar, Divider, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { registerForPushNotifications } from '../../services/NotificationService';
import {
  isBiometricAvailable, getBiometricType,
  isBiometricEnabled, setBiometricEnabled,
} from '../../services/BiometricService';
import { setLocale, i18n } from '../../i18n';
import type { MainStackParamList } from '../../navigation/MainNavigator';

type NavProp = NativeStackNavigationProp<MainStackParamList>;

const ROLE_LABEL: Record<string, string> = {
  IMPORTER: 'Exportateur / Producteur',
  DRIVER:   'Chauffeur',
  ADMIN:    'Administrateur',
};

const ROLE_COLOR: Record<string, string> = {
  IMPORTER: '#1B5E20',
  DRIVER:   '#0277BD',
  ADMIN:    '#6A1B9A',
};

function ActionRow({ icon, label, desc, color, onPress, right }: {
  icon: string; label: string; desc?: string; color?: string; onPress?: () => void; right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.actionIcon, { backgroundColor: `${color ?? '#1B5E20'}15` }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color ?? '#1B5E20'} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionLabel}>{label}</Text>
        {desc && <Text style={styles.actionDesc}>{desc}</Text>}
      </View>
      {right ?? (onPress && <MaterialCommunityIcons name="chevron-right" size={18} color="#BDBDBD" />)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const navigation  = useNavigation<NavProp>();
  const { fullName, phone, userRole, userId, logout, isLoading } = useAuthStore();
  const { isDark, mode, setMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  const [locale,     setLocaleState] = useState<'fr'|'en'>(i18n.locale as 'fr'|'en');
  const [bioAvail,   setBioAvail]   = useState(false);
  const [bioEnabled, setBioEnabledState] = useState(false);
  const [bioType,    setBioType]    = useState('Biométrie');

  useEffect(() => {
    registerForPushNotifications().catch(() => {});
    isBiometricAvailable().then(avail => {
      setBioAvail(avail);
      if (avail) {
        getBiometricType().then(setBioType);
        isBiometricEnabled().then(setBioEnabledState);
      }
    });
  }, []);

  async function toggleBiometric(val: boolean) {
    if (val) {
      const ok = await isBiometricAvailable();
      if (!ok) { Alert.alert('Non disponible', 'Votre appareil ne supporte pas la biométrie'); return; }
    }
    await setBiometricEnabled(val);
    setBioEnabledState(val);
  }

  function toggleDark() {
    setMode(isDark ? 'light' : 'dark');
  }

  const isDriver   = userRole === 'DRIVER';
  const roleColor  = ROLE_COLOR[userRole ?? ''] ?? '#1B5E20';

  const initials = (fullName ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={[styles.root, isDark && styles.rootDark]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ─── Header ─── */}
      <LinearGradient
        colors={isDark ? ['#1A2E1A', '#1F3D1F'] : ['#1B5E20', '#2E7D32', '#388E3C']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.avatarWrap}>
          <Avatar.Text size={88} label={initials}
            style={[styles.avatar, { backgroundColor: `${roleColor}40` }]}
            labelStyle={styles.avatarLabel} />
          <View style={[styles.roleIndicator, { backgroundColor: roleColor }]} />
        </View>
        <Text style={styles.name}>{fullName ?? 'Utilisateur'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: `${roleColor}30`, borderColor: `${roleColor}60` }]}>
          <Text style={[styles.roleText, { color: '#FFFFFF' }]}>
            {ROLE_LABEL[userRole ?? ''] ?? userRole ?? '—'}
          </Text>
        </View>
        <Text style={styles.phone}>{phone ?? ''}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>

        {/* ─── Navigation rapide ─── */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Navigation</Text>
          <ActionRow icon="chart-bar"      label="Mes statistiques"    color="#0277BD" onPress={() => navigation.navigate('Stats')} />
          <Divider />
          <ActionRow icon="map"            label="Carte des routes"    color="#1B5E20" onPress={() => navigation.navigate('Map')} />
          {isDriver && <>
            <Divider />
            <ActionRow icon="truck"          label="Ma Flotte"           color="#E65100" onPress={() => navigation.navigate('Trucks')} />
            <Divider />
            <ActionRow icon="trophy"         label="Programme Fidélité"  color="#F9A825" onPress={() => navigation.navigate('Loyalty')} />
          </>}
          <Divider />
          <ActionRow icon="alert-octagon"  label="Alerte SOS"          color="#B71C1C" onPress={() => navigation.navigate('Alert', {})} />
        </View>

        {/* ─── Préférences ─── */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Préférences</Text>

          <ActionRow
            icon={isDark ? 'weather-night' : 'weather-sunny'}
            label="Mode sombre"
            desc={isDark ? 'Activé' : 'Désactivé'}
            color="#6A1B9A"
            right={
              <Switch
                value={isDark}
                onValueChange={toggleDark}
                trackColor={{ false: '#E0E0E0', true: '#AB47BC' }}
                thumbColor={isDark ? '#9C27B0' : '#F5F5F5'}
              />
            }
          />

          {bioAvail && (
            <>
              <Divider />
              <ActionRow
                icon="fingerprint"
                label={bioType}
                desc={bioEnabled ? 'Connexion rapide activée' : 'Désactivé'}
                color="#0277BD"
                right={
                  <Switch
                    value={bioEnabled}
                    onValueChange={toggleBiometric}
                    trackColor={{ false: '#E0E0E0', true: '#64B5F6' }}
                    thumbColor={bioEnabled ? '#0277BD' : '#F5F5F5'}
                  />
                }
              />
            </>
          )}
          <Divider />
          <ActionRow
            icon="translate"
            label="Langue / Language"
            desc={locale === 'fr' ? 'Français' : 'English'}
            color="#E65100"
            right={
              <TouchableOpacity
                style={{ flexDirection: 'row', gap: 4 }}
                onPress={async () => {
                  const next = locale === 'fr' ? 'en' : 'fr';
                  await setLocale(next);
                  setLocaleState(next);
                }}
              >
                <Text style={{ fontWeight: '700', color: locale === 'fr' ? '#1B5E20' : '#9E9E9E', fontSize: 14 }}>FR</Text>
                <Text style={{ color: '#BDBDBD' }}>/</Text>
                <Text style={{ fontWeight: '700', color: locale === 'en' ? '#1B5E20' : '#9E9E9E', fontSize: 14 }}>EN</Text>
              </TouchableOpacity>
            }
          />
        </View>

        {/* ─── Compte ─── */}
        <View style={[styles.card, isDark && styles.cardDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Mon compte</Text>
          <ActionRow icon="phone"           label="Téléphone"    desc={phone ?? '—'}        color="#1B5E20" />
          <Divider />
          <ActionRow icon="shield-account"  label="Rôle"         desc={ROLE_LABEL[userRole ?? ''] ?? '—'} color={roleColor} />
          <Divider />
          <ActionRow icon="information-outline" label="Version"  desc="KmerFret v2.0 — Agri Transport" color="#9E9E9E" />
        </View>

        <Button
          mode="outlined"
          onPress={logout}
          loading={isLoading}
          disabled={isLoading}
          icon="logout"
          style={styles.logoutBtn}
          contentStyle={styles.logoutContent}
          labelStyle={styles.logoutLabel}
        >
          Se déconnecter
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  rootDark: { backgroundColor: '#121212' },

  header: { alignItems: 'center', paddingBottom: 28, paddingHorizontal: 24, gap: 8 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 30 },
  roleIndicator: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 5, borderWidth: 1 },
  roleText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  content: { padding: 16, gap: 14 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardDark: { backgroundColor: '#2C2C2C' },

  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  textLight: { color: '#BDBDBD' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  actionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionContent: { flex: 1 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#212121' },
  actionDesc: { fontSize: 12, color: '#9E9E9E', marginTop: 1 },

  logoutBtn: { marginTop: 4, borderColor: '#B71C1C', borderWidth: 1.5, borderRadius: 14 },
  logoutContent: { height: 52 },
  logoutLabel: { color: '#B71C1C', fontSize: 15, fontWeight: '600' },
});
