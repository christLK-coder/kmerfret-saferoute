// Gestion de la flotte — Ma Flotte (chauffeur)
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, StatusBar, TouchableOpacity,
  Modal, Alert, TextInput,
} from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getMyTrucksApi, createTruckApi, TruckDto, TruckType, CreateTruckPayload,
} from '../../api/trucks.api';
import dayjs from 'dayjs';

const TRUCK_TYPES: { value: TruckType; label: string; icon: string; desc: string }[] = [
  { value: 'FLATBED',      label: 'Plateau',       icon: 'truck',           desc: 'Transport général, vivres, bois' },
  { value: 'TANKER',       label: 'Citerne',        icon: 'tanker-truck',    desc: 'Liquides, huile de palme, eau' },
  { value: 'REFRIGERATED', label: 'Frigorifique',   icon: 'snowflake',       desc: 'Produits frais, poisson, viande' },
  { value: 'CONTAINER_20', label: 'Conteneur 20"',  icon: 'package-variant', desc: 'Exportation port Douala/Kribi' },
  { value: 'CONTAINER_40', label: 'Conteneur 40"',  icon: 'package-variant-closed', desc: 'Grande capacité export' },
  { value: 'TIPPER',       label: 'Benne',          icon: 'dump-truck',      desc: 'Granulats, sable, déchets agricoles' },
];

// ─── Carte camion ─────────────────────────────────────────────────────────────

function TruckCard({ truck }: { truck: TruckDto }) {
  const type  = TRUCK_TYPES.find(t => t.value === truck.truckType);
  const daysLeft = truck.insuranceExpiry
    ? dayjs(truck.insuranceExpiry).diff(dayjs(), 'day')
    : null;
  const insuranceOk = daysLeft === null || daysLeft > 30;

  return (
    <View style={styles.truckCard}>
      <LinearGradient
        colors={insuranceOk ? ['#1B5E20', '#2E7D32'] : ['#7B0000', '#B71C1C']}
        style={styles.truckCardBand}
      />
      <View style={styles.truckCardBody}>
        <View style={styles.truckCardTop}>
          <View style={styles.plateWrap}>
            <MaterialCommunityIcons name={type?.icon as any ?? 'truck'} size={24} color="#1B5E20" />
            <View>
              <Text style={styles.plate}>{truck.plateNumber}</Text>
              <Text style={styles.truckModel}>{[truck.brand, truck.model].filter(Boolean).join(' ') || 'Camion'}</Text>
            </View>
          </View>
          {truck.docsVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#1B5E20" />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
        </View>

        <View style={styles.truckStats}>
          <View style={styles.truckStat}>
            <Text style={styles.truckStatVal}>{truck.capacityTons}t</Text>
            <Text style={styles.truckStatLabel}>Capacité</Text>
          </View>
          <View style={styles.truckStatDivider} />
          <View style={styles.truckStat}>
            <Text style={styles.truckStatVal}>{type?.label ?? truck.truckType}</Text>
            <Text style={styles.truckStatLabel}>Type</Text>
          </View>
          <View style={styles.truckStatDivider} />
          <View style={styles.truckStat}>
            <Text style={[styles.truckStatVal, !insuranceOk && { color: '#B71C1C' }]}>
              {daysLeft !== null ? `${daysLeft}j` : '—'}
            </Text>
            <Text style={styles.truckStatLabel}>Assurance</Text>
          </View>
        </View>

        {!insuranceOk && daysLeft !== null && (
          <View style={styles.insuranceWarn}>
            <MaterialCommunityIcons name="alert" size={14} color="#B71C1C" />
            <Text style={styles.insuranceWarnText}>
              {daysLeft <= 0 ? 'Assurance expirée !' : `Expire dans ${daysLeft} jours`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Modal ajout camion ───────────────────────────────────────────────────────

function AddTruckModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [plate,    setPlate]    = useState('');
  const [brand,    setBrand]    = useState('');
  const [model,    setModel]    = useState('');
  const [capacity, setCapacity] = useState('');
  const [type,     setType]     = useState<TruckType>('FLATBED');
  const [saving,   setSaving]   = useState(false);

  async function save() {
    if (!plate.trim() || !capacity) { Alert.alert('Champs requis', 'Plaque et capacité obligatoires'); return; }
    setSaving(true);
    try {
      await createTruckApi({
        plateNumber: plate.trim().toUpperCase(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        capacityTons: parseFloat(capacity),
        truckType: type,
      });
      onSaved();
      onClose();
      setPlate(''); setBrand(''); setModel(''); setCapacity('');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Ajouter un camion</Text>

          <Text style={styles.modalFieldLabel}>Plaque d'immatriculation *</Text>
          <TextInput style={styles.modalInput} value={plate} onChangeText={setPlate}
            placeholder="LT 1234 A" placeholderTextColor="#BDBDBD"
            autoCapitalize="characters" />

          <Text style={styles.modalFieldLabel}>Marque</Text>
          <TextInput style={styles.modalInput} value={brand} onChangeText={setBrand}
            placeholder="Mercedes, Scania, MAN…" placeholderTextColor="#BDBDBD" />

          <Text style={styles.modalFieldLabel}>Modèle</Text>
          <TextInput style={styles.modalInput} value={model} onChangeText={setModel}
            placeholder="Actros, R450…" placeholderTextColor="#BDBDBD" />

          <Text style={styles.modalFieldLabel}>Capacité (tonnes) *</Text>
          <TextInput style={styles.modalInput} value={capacity} onChangeText={setCapacity}
            placeholder="10" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />

          <Text style={styles.modalFieldLabel}>Type de camion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {TRUCK_TYPES.map(tt => (
              <TouchableOpacity
                key={tt.value}
                style={[styles.typeChip, type === tt.value && styles.typeChipActive]}
                onPress={() => setType(tt.value)}
              >
                <MaterialCommunityIcons name={tt.icon as any} size={18} color={type === tt.value ? '#FFF' : '#1B5E20'} />
                <Text style={[styles.typeChipText, type === tt.value && { color: '#FFF' }]}>{tt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {TRUCK_TYPES.find(t => t.value === type) && (
            <Text style={styles.typeDesc}>{TRUCK_TYPES.find(t => t.value === type)!.desc}</Text>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={save} disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.saveBtnText}>Enregistrer le camion</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TruckScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [trucks,  setTrucks]  = useState<TruckDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTrucks(await getMyTrucksApi()); }
    catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#1B5E20', '#2E7D32', '#388E3C']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ma Flotte</Text>
          <Text style={styles.headerSub}>{trucks.length} camion{trucks.length !== 1 ? 's' : ''} enregistré{trucks.length !== 1 ? 's' : ''}</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1B5E20" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}>
          {trucks.length === 0 && (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="truck-outline" size={72} color="#C8E6C9" />
              <Text style={styles.emptyTitle}>Aucun camion</Text>
              <Text style={styles.emptySub}>Ajoutez votre premier camion pour l'associer à vos missions</Text>
            </View>
          )}
          {trucks.map(t => <TruckCard key={t.id} truck={t} />)}
        </ScrollView>
      )}

      <FAB icon="plus" label="Ajouter un camion"
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setShowAdd(true)} color="#FFF" customSize={52} />

      <AddTruckModal visible={showAdd} onClose={() => setShowAdd(false)} onSaved={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 14 },

  truckCard: {
    backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden', flexDirection: 'row',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  truckCardBand: { width: 6 },
  truckCardBody: { flex: 1, padding: 16, gap: 12 },
  truckCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plateWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plate: { fontSize: 18, fontWeight: '900', color: '#212121', letterSpacing: 1 },
  truckModel: { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#1B5E20' },
  truckStats: { flexDirection: 'row', alignItems: 'center' },
  truckStat: { flex: 1, alignItems: 'center' },
  truckStatVal: { fontSize: 16, fontWeight: '800', color: '#212121' },
  truckStatLabel: { fontSize: 10, color: '#9E9E9E', fontWeight: '600', marginTop: 2 },
  truckStatDivider: { width: 1, height: 32, backgroundColor: '#F0F0F0' },
  insuranceWarn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFEBEE', borderRadius: 8, padding: 8 },
  insuranceWarnText: { fontSize: 12, color: '#B71C1C', fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#424242' },
  emptySub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  fab: { position: 'absolute', right: 20, backgroundColor: '#1B5E20', elevation: 8, shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#212121', marginBottom: 4 },
  modalFieldLabel: { fontSize: 12, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#212121' },
  typeScroll: { flexGrow: 0 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#C8E6C9', marginRight: 8, backgroundColor: '#F1F8E9' },
  typeChipActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#1B5E20' },
  typeDesc: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic' },
  saveBtn: { backgroundColor: '#1B5E20', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4, elevation: 3 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontSize: 14, color: '#9E9E9E', fontWeight: '600' },
});
