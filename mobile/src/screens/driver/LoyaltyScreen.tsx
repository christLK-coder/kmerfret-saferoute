// Programme de fidélité chauffeur — Bronze / Argent / Or / Platine
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../api/axios.config';

interface LoyaltyData {
  tier: 'BRONZE' | 'ARGENT' | 'OR' | 'PLATINE';
  points: number;
  nextTierPoints: number;
  benefit: string;
  deliveries: number;
  averageRating: number;
}

const TIER_CONFIG = {
  BRONZE:  { colors: ['#8D6E63', '#A1887F'] as const, icon: 'medal-outline',    label: 'Bronze',  min: 0    },
  ARGENT:  { colors: ['#78909C', '#90A4AE'] as const, icon: 'medal',            label: 'Argent',  min: 500  },
  OR:      { colors: ['#F9A825', '#FBC02D'] as const, icon: 'star-circle',      label: 'Or',      min: 2000 },
  PLATINE: { colors: ['#7B1FA2', '#9C27B0'] as const, icon: 'diamond-stone',    label: 'Platine', min: 5000 },
};

const TIERS = ['BRONZE', 'ARGENT', 'OR', 'PLATINE'] as const;

export default function LoyaltyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [data,    setData]    = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/loyalty/me')
      .then(r => setData((r.data as any).data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tierCfg = data ? TIER_CONFIG[data.tier] : TIER_CONFIG.BRONZE;
  const progress = data && data.tier !== 'PLATINE'
    ? Math.min(100, ((data.points - TIER_CONFIG[data.tier].min) / (data.nextTierPoints)) * 100)
    : 100;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={tierCfg.colors}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name={tierCfg.icon as any} size={56} color="rgba(255,255,255,0.9)" />
        {data && (
          <>
            <Text style={styles.tierLabel}>{tierCfg.label}</Text>
            <Text style={styles.points}>{data.points.toLocaleString()} pts</Text>
            <Text style={styles.benefit}>{data.benefit}</Text>
          </>
        )}
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#7B1FA2" /></View>
      ) : !data ? (
        <View style={styles.centered}><Text>Données non disponibles</Text></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>

          {/* Progression */}
          {data.tier !== 'PLATINE' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Progression vers {TIER_CONFIG[TIERS[TIERS.indexOf(data.tier) + 1]].label}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.max(progress, 2)}%`, backgroundColor: tierCfg.colors[0] }]} />
              </View>
              <Text style={styles.progressText}>
                {data.points.toLocaleString()} / {(data.points + data.nextTierPoints).toLocaleString()} points
                ({data.nextTierPoints.toLocaleString()} encore nécessaires)
              </Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.grid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="truck-delivery" size={28} color={tierCfg.colors[0]} />
              <Text style={[styles.statVal, { color: tierCfg.colors[0] }]}>{data.deliveries}</Text>
              <Text style={styles.statLabel}>Livraisons</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="star" size={28} color="#F57F17" />
              <Text style={[styles.statVal, { color: '#F57F17' }]}>{data.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Note moy.</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trophy" size={28} color={tierCfg.colors[0]} />
              <Text style={[styles.statVal, { color: tierCfg.colors[0] }]}>{data.points.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>

          {/* Paliers */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tous les paliers</Text>
            {TIERS.map(t => {
              const cfg     = TIER_CONFIG[t];
              const current = t === data.tier;
              const reached = TIERS.indexOf(t) <= TIERS.indexOf(data.tier);
              return (
                <View key={t} style={[styles.tierRow, current && styles.tierRowCurrent]}>
                  <LinearGradient colors={cfg.colors} style={styles.tierIcon}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={18} color="#FFF" />
                  </LinearGradient>
                  <View style={styles.tierInfo}>
                    <Text style={[styles.tierName, reached && { color: cfg.colors[0] }]}>{cfg.label}</Text>
                    <Text style={styles.tierMin}>{cfg.min === 0 ? 'Départ' : `${cfg.min.toLocaleString()} pts`}</Text>
                  </View>
                  {current && (
                    <View style={[styles.currentBadge, { backgroundColor: cfg.colors[0] }]}>
                      <Text style={styles.currentBadgeText}>Votre niveau</Text>
                    </View>
                  )}
                  {!current && reached && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={cfg.colors[0]} />
                  )}
                </View>
              );
            })}
          </View>

          {/* Comment gagner */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comment gagner des points</Text>
            <View style={styles.howRow}>
              <MaterialCommunityIcons name="truck-check" size={20} color="#2E7D32" />
              <Text style={styles.howText}>+100 pts par livraison complétée</Text>
            </View>
            <View style={styles.howRow}>
              <MaterialCommunityIcons name="star" size={20} color="#F57F17" />
              <Text style={styles.howText}>+50 pts bonus si note ≥ 4.5 / 5</Text>
            </View>
            <View style={styles.howRow}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#0277BD" />
              <Text style={styles.howText}>Zéro litige = multiplicateur ×1.5</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center', gap: 8 },
  backBtn: { alignSelf: 'flex-start', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tierLabel: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  points: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  benefit: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 16, paddingHorizontal: 20 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 14 },

  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },

  progressBar: { height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  progressText: { fontSize: 12, color: '#9E9E9E' },

  grid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, elevation: 2 },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },

  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  tierRowCurrent: { backgroundColor: '#F8F8F8', borderRadius: 10, paddingHorizontal: 8 },
  tierIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 14, fontWeight: '700', color: '#424242' },
  tierMin: { fontSize: 11, color: '#9E9E9E' },
  currentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  currentBadgeText: { fontSize: 10, color: '#FFF', fontWeight: '700' },

  howRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howText: { fontSize: 13, color: '#424242', fontWeight: '500' },
});
