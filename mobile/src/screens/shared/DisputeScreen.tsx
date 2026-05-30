// Écran de litige — signaler un problème sur une mission
import React, { useState } from 'react';
import {
  View, StyleSheet, StatusBar, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../api/axios.config';
import type { MainStackParamList } from '../../navigation/MainNavigator';

type NavProp = NativeStackNavigationProp<MainStackParamList>;
type RoutePropType = RouteProp<MainStackParamList, 'Dispute'>;

const DISPUTE_TYPES = [
  { value: 'DAMAGED_GOODS',   label: 'Marchandise endommagée', icon: 'package-variant-closed-remove', color: '#B71C1C' },
  { value: 'PAYMENT_ISSUE',   label: 'Problème de paiement',   icon: 'cash-remove',                  color: '#E65100' },
  { value: 'DELAY',           label: 'Retard de livraison',     icon: 'clock-alert',                  color: '#F57F17' },
  { value: 'DRIVER_BEHAVIOR', label: 'Comportement chauffeur',  icon: 'account-alert',                color: '#7B1FA2' },
  { value: 'ROUTE_CHANGE',    label: 'Changement de route',     icon: 'road',                         color: '#0277BD' },
  { value: 'OTHER',           label: 'Autre problème',          icon: 'dots-horizontal-circle',       color: '#616161' },
] as const;

export default function DisputeScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const insets = useSafeAreaInsets();
  const { missionId } = route.params;

  const [type,        setType]        = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);

  async function handleSubmit() {
    if (!type)            { Alert.alert('Type requis', 'Sélectionnez le type de problème'); return; }
    if (!description.trim() || description.length < 20) {
      Alert.alert('Description insuffisante', 'Décrivez le problème en au moins 20 caractères'); return;
    }
    setLoading(true);
    try {
      await api.post('/api/disputes', { missionId, disputeType: type, description: description.trim() });
      setDone(true);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message ?? 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient colors={['#7B0000', '#B71C1C', '#D32F2F']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="shield-alert" size={30} color="#FFF" />
        <Text style={styles.headerTitle}>Ouvrir un litige</Text>
        <Text style={styles.headerSub}>Votre signalement est traité sous 24h</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>

        {done ? (
          <View style={styles.doneCard}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#2E7D32" />
            <Text style={styles.doneTitle}>Litige enregistré</Text>
            <Text style={styles.doneSub}>
              Le paiement est gelé jusqu'à résolution. L'équipe KmerFret vous contactera sous 24h pour arbitrage.
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Retour aux missions</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Type de problème</Text>
              <View style={styles.typeGrid}>
                {DISPUTE_TYPES.map(dt => {
                  const active = type === dt.value;
                  return (
                    <TouchableOpacity
                      key={dt.value}
                      style={[styles.typeChip, { borderColor: active ? dt.color : '#E0E0E0', backgroundColor: active ? `${dt.color}12` : '#FAFAFA' }]}
                      onPress={() => setType(dt.value)}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons name={dt.icon as any} size={22} color={active ? dt.color : '#9E9E9E'} />
                      <Text style={[styles.typeChipLabel, { color: active ? dt.color : '#616161' }]}>{dt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description détaillée</Text>
              <TextInput
                style={styles.descInput}
                placeholder="Décrivez précisément le problème rencontré — date, heure, quantité endommagée, montant contesté…"
                placeholderTextColor="#BDBDBD"
                multiline
                numberOfLines={6}
                value={description}
                onChangeText={setDescription}
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>

            <View style={styles.warningCard}>
              <MaterialCommunityIcons name="lock-clock" size={18} color="#F57F17" />
              <Text style={styles.warningText}>
                En ouvrant un litige, le paiement sera gelé jusqu'à résolution par l'équipe KmerFret. Cette action est irréversible.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (loading || !type) && styles.submitBtnDisabled]}
              onPress={handleSubmit} disabled={loading || !type}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator size="small" color="#FFF" />
                : <>
                    <MaterialCommunityIcons name="shield-alert" size={20} color="#FFF" />
                    <Text style={styles.submitBtnText}>Ouvrir le litige</Text>
                  </>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 6 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  body: { padding: 16, gap: 14 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#212121' },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  typeChipLabel: { fontSize: 12, fontWeight: '600', flex: 1 },

  descInput: { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, fontSize: 14, color: '#212121', minHeight: 120 },
  charCount: { fontSize: 11, color: '#BDBDBD', textAlign: 'right' },

  warningCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#F57F17' },
  warningText: { fontSize: 12, color: '#E65100', lineHeight: 17, flex: 1 },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#B71C1C', borderRadius: 14, paddingVertical: 16, elevation: 4, shadowColor: '#B71C1C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  submitBtnDisabled: { backgroundColor: '#EF9A9A' },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

  doneCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 32, alignItems: 'center', gap: 12, marginTop: 20, elevation: 3 },
  doneTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20' },
  doneSub: { fontSize: 14, color: '#616161', textAlign: 'center', lineHeight: 20 },
  doneBtn: { marginTop: 8, backgroundColor: '#1B5E20', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 13 },
  doneBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
