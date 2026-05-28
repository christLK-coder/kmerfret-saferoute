// Service de télémétrie — détection de nids-de-poule via accéléromètre + GPS
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import type { LocationObject, LocationSubscription } from 'expo-location';
import uuid from 'react-native-uuid';
import dayjs from 'dayjs';

import {
  SHOCK_THRESHOLDS,
  ACCEL_UPDATE_MS,
  GPS_INTERVAL_MS,
  SHOCK_COOLDOWN_MS,
} from '../utils/constants';
import { insertHazard } from '../database/hazardsDb';
import { insertPosition } from '../database/positionsDb';
import { enqueue } from '../database/syncDb';
import type { LocalHazard, LocalPosition, HazardSeverity } from '../types';

class TelemetryService {
  private missionId: string | null = null;
  private lastShockTime: number = 0;
  private currentPosition: LocationObject | null = null;
  private accelSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;
  private locationSubscription: LocationSubscription | null = null;

  async startTracking(missionId: string): Promise<void> {
    if (this.missionId) this.stopTracking();

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission GPS refusée — impossible de démarrer la télémétrie');
    }

    this.missionId = missionId;

    // GPS en continu — toutes les GPS_INTERVAL_MS ou 10m de déplacement
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: GPS_INTERVAL_MS,
        distanceInterval: 10,
      },
      (location) => {
        this.currentPosition = location;
        this.recordPosition(location).catch(() => {});
      }
    );

    // Accéléromètre à 10 Hz
    Accelerometer.setUpdateInterval(ACCEL_UPDATE_MS);
    this.accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
      this.onAccelerometerData({ x, y, z });
    });
  }

  stopTracking(): void {
    this.accelSubscription?.remove();
    this.locationSubscription?.remove();
    this.accelSubscription = null;
    this.locationSubscription = null;
    this.missionId = null;
    this.currentPosition = null;
    this.lastShockTime = 0;
  }

  get isTracking(): boolean {
    return this.missionId !== null;
  }

  private onAccelerometerData({ x, y, z }: { x: number; y: number; z: number }): void {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const now = Date.now();

    if (magnitude >= SHOCK_THRESHOLDS.LOW && now - this.lastShockTime > SHOCK_COOLDOWN_MS) {
      this.lastShockTime = now;
      this.recordHazard(magnitude).catch(() => {});
    }
  }

  private async recordHazard(magnitude: number): Promise<void> {
    if (!this.missionId) return;

    const severity = this.getSeverity(magnitude);
    const coords = this.currentPosition?.coords;
    const id = uuid.v4() as string;
    const recorded_at = dayjs().toISOString();

    const hazard: LocalHazard = {
      id,
      mission_id: this.missionId,
      latitude: coords?.latitude ?? 0,
      longitude: coords?.longitude ?? 0,
      altitude: coords?.altitude ?? undefined,
      accuracy: coords?.accuracy ?? undefined,
      shock_magnitude: magnitude,
      shock_axis: 'Z',
      // expo-location retourne la vitesse en m/s → conversion km/h
      speed_kmh: coords?.speed != null && coords.speed >= 0 ? coords.speed * 3.6 : undefined,
      severity,
      hazard_type: 'POTHOLE',
      recorded_at,
    };

    await insertHazard(hazard);
    await enqueue('HAZARD', id, {
      missionId: this.missionId,
      latitude: hazard.latitude,
      longitude: hazard.longitude,
      altitude: hazard.altitude ?? null,
      accuracy: hazard.accuracy ?? null,
      shockMagnitude: magnitude,
      shockAxis: 'Z',
      speedKmh: hazard.speed_kmh ?? null,
      severity,
      hazardType: 'POTHOLE',
      recordedAt: recorded_at,
      wasOffline: true,
    });
  }

  private async recordPosition(location: LocationObject): Promise<void> {
    if (!this.missionId) return;

    const { latitude, longitude, speed, heading, accuracy } = location.coords;
    const recorded_at = dayjs(location.timestamp).toISOString();

    const position: LocalPosition = {
      mission_id: this.missionId,
      latitude,
      longitude,
      speed_kmh: speed != null && speed >= 0 ? speed * 3.6 : undefined,
      // heading < 0 signifie non disponible sur certains appareils Android
      heading: heading != null && heading >= 0 ? heading : undefined,
      accuracy: accuracy ?? undefined,
      recorded_at,
    };

    await insertPosition(position);
    await enqueue('POSITION', `${this.missionId}_${location.timestamp}`, {
      missionId: this.missionId,
      latitude,
      longitude,
      speedKmh: position.speed_kmh ?? null,
      headingDeg: position.heading ?? null,
      accuracyM: accuracy ?? null,
      recordedAt: recorded_at,
      wasOffline: true,
    });
  }

  private getSeverity(magnitude: number): HazardSeverity {
    if (magnitude >= SHOCK_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (magnitude >= SHOCK_THRESHOLDS.HIGH) return 'HIGH';
    if (magnitude >= SHOCK_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
  }
}

export default new TelemetryService();
