// Création mission — wizard 3 étapes — design agricole premium
import React, { useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, StatusBar, ScrollView, Animated,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppInput }      from '../../components/common/AppInput';
import { AppButton }     from '../../components/common/AppButton';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import { useMissionStore } from '../../store/missionStore';
import type { MainStackParamList } from '../../navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'CreateMission'>;

// ─── Types cargo agricoles camerounais ───────────────────────────────────────

const CARGO_TYPES = [
  { value: 'GENERAL',    label: 'Vivres & Légumes', icon: 'food-apple',       color: '#2E7D32', bg: '#E8F5E9' },
  { value: 'PERISHABLE', label: 'Céréales & Grains', icon: 'barley',           color: '#F57F17', bg: '#FFF8E1' },
  { value: 'LIQUID',     label: 'Café / Cacao',      icon: 'coffee',           color: '#5D4037', bg: '#EFEBE9' },
  { value: 'CONTAINER',  label: 'Bétail',            icon: 'cow',              color: '#E65100', bg: '#FBE9E7' },
  { value: 'OVERSIZED',  label: 'Bois & Bois d\'œuvre', icon: 'tree',         color: '#6D4C41', bg: '#EFEBE9' },
  { value: 'DANGEROUS',  label: 'Engrais & Intrants', icon: 'flask',          color: '#7B1FA2', bg: '#F3E5F5' },
] as const;

type CargoTypeValue = typeof CARGO_TYPES[number]['value'];

const PAYMENT_METHODS = [
  { value: 'MTN_MOMO',     label: 'MTN MoMo',      icon: 'cellphone',         color: '#F9A825' },
  { value: 'ORANGE_MONEY', label: 'Orange Money',   icon: 'cellphone-wireless', color: '#E65100' },
  { value: 'STRIPE',       label: 'Carte bancaire', icon: 'credit-card',       color: '#0277BD' },
] as const;

// ─── Indicateur étapes ────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Route', 'Cargaison', 'Paiement'];
  return (
    <View style={si.row}>
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = step === n;
        const done   = step > n;
        return (
          <View key={n} style={si.item}>
            <View style={[si.dot, done && si.dotDone, active && si.dotActive]}>
              {done
                ? <MaterialCommunityIcons name="check" size={13} color="#FFF" />
                : <Text style={[si.dotText, active && si.dotTextActive]}>{n}</Text>}
            </View>
            <Text style={[si.label, active && si.labelActive]}>{label}</Text>
            {n < 3 && <View style={[si.line, done && si.lineDone]} />}
          </View>
        );
      })}
    </View>
  );
}
const si = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 0, paddingVertical: 8 },
  item:         { alignItems: 'center', flex: 1, position: 'relative' },
  dot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  dotActive:    { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  dotDone:      { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.9)' },
  dotText:      { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  dotTextActive:{ color: '#1B5E20' },
  label:        { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '600', textAlign: 'center' },
  labelActive:  { color: '#FFFFFF', fontWeight: '800' },
  line:         { position: 'absolute', top: 14, left: '60%', right: '-60%', height: 1.5, backgroundColor: 'rgba(255,255,255,0.25)', zIndex: -1 },
  lineDone:     { backgroundColor: 'rgba(255,255,255,0.8)' },
});

// ─── Sélecteur cargo ──────────────────────────────────────────────────────────

function CargoSelector({ selected, onSelect }: { selected: CargoTypeValue | null; onSelect: (v: CargoTypeValue) => void }) {
  return (
    <View style={css.cargoGrid}>
      {CARGO_TYPES.map(ct => {
        const active = selected === ct.value;
        return (
          <TouchableOpacity
            key={ct.value}
            style={[css.cargoItem, { backgroundColor: active ? ct.color : ct.bg, borderColor: active ? ct.color : 'transparent' }]}
            onPress={() => onSelect(ct.value)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name={ct.icon as any} size={28} color={active ? '#FFFFFF' : ct.color} />
            <Text style={[css.cargoLabel, { color: active ? '#FFFFFF' : ct.color }]}>{ct.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateMissionScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const { createMission, isLoading, error, clearError } = useMissionStore();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  // Étape 1 — Route
  const [originLabel, setOriginLabel]   = useState('');
  const [originLat,   setOriginLat]     = useState('');
  const [originLng,   setOriginLng]     = useState('');
  const [destLabel,   setDestLabel]     = useState('');
  const [destLat,     setDestLat]       = useState('');
  const [destLng,     setDestLng]       = useState('');

  // Étape 2 — Cargaison
  const [cargoType,   setCargoType]     = useState<CargoTypeValue | null>(null);
  const [cargoDesc,   setCargoDesc]     = useState('');
  const [cargoWeight, setCargoWeight]   = useState('');
  const [specialInst, setSpecialInst]   = useState('');

  // Étape 3 — Paiement
  const [price,         setPrice]       = useState('');
  const [payMethod,     setPayMethod]   = useState<string>('MTN_MOMO');

  async function useCurrentLocation(target: 'origin' | 'dest') {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée', 'Activez la localisation'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      // Géocodage inverse
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const label = [place.street, place.city, place.region].filter(Boolean).join(', ');
      if (target === 'origin') {
        setOriginLat(latitude.toFixed(6)); setOriginLng(longitude.toFixed(6));
        setOriginLabel(label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      } else {
        setDestLat(latitude.toFixed(6)); setDestLng(longitude.toFixed(6));
        setDestLabel(label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch { Alert.alert('Erreur', 'Impossible de récupérer la position'); }
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!originLabel.trim()) e.originLabel = 'Lieu d\'origine requis';
    if (!destLabel.trim())   e.destLabel   = 'Lieu de destination requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!cargoType)              e.cargoType   = 'Sélectionnez un type de marchandise';
    if (!cargoDesc.trim())       e.cargoDesc   = 'Description requise';
    if (!cargoWeight || isNaN(parseFloat(cargoWeight))) e.cargoWeight = 'Poids invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e: Record<string, string> = {};
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) e.price = 'Montant invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    Animated.timing(slideAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
      setStep(s => (s < 3 ? s + 1 : s) as any);
      slideAnim.setValue(0);
    });
  }

  function goBack() {
    setStep(s => (s > 1 ? s - 1 : s) as any);
  }

  async function handleSubmit() {
    if (!validateStep3()) return;
    clearError();
    try {
      await createMission({
        originLabel:      originLabel.trim(),
        destinationLabel: destLabel.trim(),
        originLat:        parseFloat(originLat) || 3.848,
        originLng:        parseFloat(originLng) || 11.502,
        destLat:          parseFloat(destLat)   || 3.848,
        destLng:          parseFloat(destLng)   || 11.502,
        cargoDescription: cargoDesc.trim(),
        cargoWeightTons:  parseFloat(cargoWeight),
        cargoType:        cargoType ?? 'GENERAL',
        specialInstructions: specialInst.trim() || undefined,
        totalPrice:       parseFloat(price),
        paymentMethod:    payMethod as any,
      });
      navigation.goBack();
    } catch { /* error in store */ }
  }

  // Prix estimé
  const estimatedPrice = (() => {
    const w = parseFloat(cargoWeight) || 0;
    const base = w * 15000; // 15 000 FCFA/tonne comme base
    return base > 0 ? base.toLocaleString() : null;
  })();

  const cargoInfo = CARGO_TYPES.find(c => c.value === cargoType);

  return (
    <View style={css.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LoadingOverlay visible={isLoading} message="Création de la mission…" />

      {/* ─── Header gradient ─── */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#33691E']}
        locations={[0, 0.6, 1]}
        style={[css.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={css.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={css.backBtn}>
            <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={css.headerCenter}>
            <Text style={css.headerTitle}>Nouvelle mission</Text>
            <Text style={css.headerSub}>Transport agricole sécurisé</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <StepIndicator step={step} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[css.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ════ ÉTAPE 1 — Route ════ */}
          {step === 1 && (
            <Animated.View style={{ opacity: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
              <View style={css.card}>
                <View style={css.cardHeader}>
                  <MaterialCommunityIcons name="map-marker-path" size={22} color="#1B5E20" />
                  <Text style={css.cardTitle}>Itinéraire de transport</Text>
                </View>

                {/* Origine */}
                <View style={css.locationBlock}>
                  <View style={[css.locationDot, { backgroundColor: '#1B5E20' }]} />
                  <View style={css.locationInputs}>
                    <Text style={css.locationLabel}>Point de chargement</Text>
                    <AppInput
                      label="Ville / Marché d'origine"
                      value={originLabel}
                      onChangeText={t => { setOriginLabel(t); setErrors(e => ({ ...e, originLabel: '' })); }}
                      error={errors.originLabel}
                    />
                    {!!errors.originLabel && <HelperText type="error">{errors.originLabel}</HelperText>}
                    <TouchableOpacity style={css.gpsBtn} onPress={() => useCurrentLocation('origin')}>
                      <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#1B5E20" />
                      <Text style={css.gpsBtnText}>Ma position actuelle</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={css.routeLine} />

                {/* Destination */}
                <View style={css.locationBlock}>
                  <View style={[css.locationDot, { backgroundColor: '#E65100' }]} />
                  <View style={css.locationInputs}>
                    <Text style={css.locationLabel}>Point de livraison</Text>
                    <AppInput
                      label="Ville / Marché de destination"
                      value={destLabel}
                      onChangeText={t => { setDestLabel(t); setErrors(e => ({ ...e, destLabel: '' })); }}
                      error={errors.destLabel}
                    />
                    {!!errors.destLabel && <HelperText type="error">{errors.destLabel}</HelperText>}
                    <TouchableOpacity style={css.gpsBtn} onPress={() => useCurrentLocation('dest')}>
                      <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#1B5E20" />
                      <Text style={css.gpsBtnText}>Ma position actuelle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Info sécurité route */}
              <View style={css.infoCard}>
                <MaterialCommunityIcons name="shield-check" size={18} color="#1B5E20" />
                <Text style={css.infoText}>
                  KmerFret surveille les nids-de-poule et vous alerte en temps réel pour protéger vos produits agricoles.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ════ ÉTAPE 2 — Cargaison ════ */}
          {step === 2 && (
            <View>
              <View style={css.card}>
                <View style={css.cardHeader}>
                  <MaterialCommunityIcons name="package-variant" size={22} color="#1B5E20" />
                  <Text style={css.cardTitle}>Type de marchandise</Text>
                </View>
                <CargoSelector selected={cargoType} onSelect={ct => { setCargoType(ct); setErrors(e => ({ ...e, cargoType: '' })); }} />
                {!!errors.cargoType && <HelperText type="error">{errors.cargoType}</HelperText>}
              </View>

              <View style={css.card}>
                <View style={css.cardHeader}>
                  <MaterialCommunityIcons name="clipboard-text" size={22} color="#1B5E20" />
                  <Text style={css.cardTitle}>Détails cargaison</Text>
                </View>
                <AppInput
                  label="Description (ex: 200 sacs de manioc frais)"
                  value={cargoDesc}
                  onChangeText={t => { setCargoDesc(t); setErrors(e => ({ ...e, cargoDesc: '' })); }}
                  error={errors.cargoDesc}
                  multiline
                />
                {!!errors.cargoDesc && <HelperText type="error">{errors.cargoDesc}</HelperText>}

                <AppInput
                  label="Poids total (en tonnes)"
                  value={cargoWeight}
                  onChangeText={t => { setCargoWeight(t); setErrors(e => ({ ...e, cargoWeight: '' })); }}
                  keyboardType="numeric"
                  error={errors.cargoWeight}
                />
                {!!errors.cargoWeight && <HelperText type="error">{errors.cargoWeight}</HelperText>}

                <AppInput
                  label="Instructions spéciales (fragile, température, etc.)"
                  value={specialInst}
                  onChangeText={setSpecialInst}
                  multiline
                />

                {/* Conseil spécifique au type */}
                {cargoInfo && (
                  <View style={[css.cargoTip, { borderLeftColor: cargoInfo.color, backgroundColor: cargoInfo.bg }]}>
                    <MaterialCommunityIcons name={cargoInfo.icon as any} size={16} color={cargoInfo.color} />
                    <Text style={[css.cargoTipText, { color: cargoInfo.color }]}>
                      {cargoType === 'PERISHABLE' && 'Produit périssable — précisez les conditions de conservation requises.'}
                      {cargoType === 'CONTAINER'  && 'Transport de bétail — eau et ventilation obligatoires en route.'}
                      {cargoType === 'DANGEROUS'  && 'Matières dangereuses — le chauffeur doit avoir le permis ADR.'}
                      {cargoType === 'GENERAL'    && 'Conditionnez bien pour éviter les dommages sur routes dégradées.'}
                      {cargoType === 'LIQUID'     && 'Café/cacao — indiquez le grade et la certification si applicable.'}
                      {cargoType === 'OVERSIZED'  && 'Bois — vérifiez les permis de transport forestier (MINFOF).'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ════ ÉTAPE 3 — Paiement ════ */}
          {step === 3 && (
            <View>
              <View style={css.card}>
                <View style={css.cardHeader}>
                  <MaterialCommunityIcons name="cash-multiple" size={22} color="#1B5E20" />
                  <Text style={css.cardTitle}>Montant & Paiement</Text>
                </View>

                {estimatedPrice && (
                  <View style={css.estimateBanner}>
                    <MaterialCommunityIcons name="calculator-variant" size={16} color="#0277BD" />
                    <Text style={css.estimateText}>Estimation : {estimatedPrice} FCFA (15 000/tonne)</Text>
                  </View>
                )}

                <AppInput
                  label="Montant total (FCFA)"
                  value={price}
                  onChangeText={t => { setPrice(t); setErrors(e => ({ ...e, price: '' })); }}
                  keyboardType="numeric"
                  error={errors.price}
                />
                {!!errors.price && <HelperText type="error">{errors.price}</HelperText>}

                <Text style={css.payMethodLabel}>Mode de paiement</Text>
                <View style={css.payRow}>
                  {PAYMENT_METHODS.map(pm => {
                    const active = payMethod === pm.value;
                    return (
                      <TouchableOpacity
                        key={pm.value}
                        style={[css.payBtn, active && { backgroundColor: pm.color, borderColor: pm.color }]}
                        onPress={() => setPayMethod(pm.value)}
                        activeOpacity={0.75}
                      >
                        <MaterialCommunityIcons name={pm.icon as any} size={20} color={active ? '#FFF' : pm.color} />
                        <Text style={[css.payBtnLabel, active && { color: '#FFF' }]}>{pm.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Résumé commission */}
              {parseFloat(price) > 0 && (
                <View style={css.summaryCard}>
                  <Text style={css.summaryTitle}>Résumé financier</Text>
                  <View style={css.summaryRow}>
                    <Text style={css.summaryKey}>Prix total</Text>
                    <Text style={css.summaryVal}>{parseFloat(price).toLocaleString()} FCFA</Text>
                  </View>
                  <View style={css.summaryRow}>
                    <Text style={css.summaryKey}>Commission KmerFret (7.5%)</Text>
                    <Text style={[css.summaryVal, { color: '#E65100' }]}>
                      -{(parseFloat(price) * 0.075).toLocaleString()} FCFA
                    </Text>
                  </View>
                  <View style={[css.summaryRow, css.summaryTotalRow]}>
                    <Text style={css.summaryTotalKey}>Payout chauffeur</Text>
                    <Text style={css.summaryTotalVal}>
                      {(parseFloat(price) * 0.925).toLocaleString()} FCFA
                    </Text>
                  </View>
                  <Text style={css.escrowNote}>
                    Les fonds sont séquestrés jusqu'à confirmation QR Code par le destinataire.
                  </Text>
                </View>
              )}

              {(error) && (
                <View style={css.errorCard}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color="#B71C1C" />
                  <Text style={css.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}

          {/* ─── Navigation ─── */}
          <View style={css.navRow}>
            {step > 1 && (
              <TouchableOpacity style={css.backNavBtn} onPress={goBack}>
                <MaterialCommunityIcons name="arrow-left" size={18} color="#1B5E20" />
                <Text style={css.backNavText}>Retour</Text>
              </TouchableOpacity>
            )}
            {step < 3 ? (
              <AppButton
                label="Étape suivante"
                onPress={goNext}
                style={step === 1 ? { ...css.nextBtn, flex: 1 } : css.nextBtn}
                fullWidth={false}
              />
            ) : (
              <AppButton
                label="Créer la mission"
                onPress={handleSubmit}
                loading={isLoading}
                style={css.nextBtn}
                icon="check"
                fullWidth={false}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const css = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  content: { padding: 16, gap: 14 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, gap: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#212121' },

  locationBlock: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  locationDot: { width: 14, height: 14, borderRadius: 7, marginTop: 18, flexShrink: 0 },
  locationInputs: { flex: 1, gap: 8 },
  locationLabel: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.5 },
  routeLine: { width: 2, height: 16, backgroundColor: '#E0E0E0', marginLeft: 20, borderRadius: 1 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  gpsBtnText: { fontSize: 12, color: '#1B5E20', fontWeight: '600' },

  cargoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cargoItem: {
    width: '47%', borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 8, borderWidth: 2,
  },
  cargoLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  cargoTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderLeftWidth: 3, borderRadius: 8, padding: 10, marginTop: 4,
  },
  cargoTipText: { fontSize: 12, lineHeight: 16, flex: 1, fontWeight: '500' },

  payMethodLabel: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.5 },
  payRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA',
  },
  payBtnLabel: { fontSize: 12, fontWeight: '700', color: '#616161' },

  estimateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E3F2FD', borderRadius: 10, padding: 10,
  },
  estimateText: { fontSize: 12, color: '#0277BD', fontWeight: '600', flex: 1 },

  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 10,
    elevation: 2, borderWidth: 1, borderColor: '#E8F5E9',
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#1B5E20', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryKey: { fontSize: 13, color: '#616161' },
  summaryVal: { fontSize: 13, fontWeight: '700', color: '#212121' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 10 },
  summaryTotalKey: { fontSize: 14, fontWeight: '800', color: '#1B5E20' },
  summaryTotalVal: { fontSize: 18, fontWeight: '900', color: '#1B5E20' },
  escrowNote: { fontSize: 11, color: '#9E9E9E', fontStyle: 'italic', lineHeight: 16 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#1B5E20',
  },
  infoText: { fontSize: 12, color: '#2E7D32', lineHeight: 17, flex: 1 },

  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12 },
  errorText: { fontSize: 13, color: '#B71C1C', flex: 1 },

  navRow: { flexDirection: 'row', gap: 12, marginTop: 4, alignItems: 'center' },
  backNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#1B5E20' },
  backNavText: { fontSize: 14, fontWeight: '600', color: '#1B5E20' },
  nextBtn: { flex: 1, borderRadius: 12 },
});
