import { api } from './axios.config';
import type { ApiResponse, MissionStatusValue } from '../types';

export interface MissionPayload {
  originLabel: string;
  destinationLabel: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  cargoDescription: string;
  totalPrice?: number;
}

export interface MissionDto {
  id: string;
  status: MissionStatusValue;
  originLabel: string;
  destinationLabel: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  cargoDescription?: string;
  totalPrice?: number;
  driverId?: string;
  importerId?: string;
  qrToken?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function createMissionApi(payload: MissionPayload): Promise<MissionDto> {
  const { data } = await api.post<ApiResponse<MissionDto>>('/api/v1/missions', payload);
  if (!data.data) throw new Error(data.message ?? 'Erreur création mission');
  return data.data;
}

export async function getMyMissionsApi(): Promise<MissionDto[]> {
  const { data } = await api.get<ApiResponse<MissionDto[]>>('/api/v1/missions/my');
  return data.data ?? [];
}

export async function getAvailableMissionsApi(): Promise<MissionDto[]> {
  const { data } = await api.get<ApiResponse<MissionDto[]>>('/api/v1/missions?status=OPEN');
  return data.data ?? [];
}

export async function acceptMissionApi(missionId: string): Promise<MissionDto> {
  const { data } = await api.post<ApiResponse<MissionDto>>(`/api/v1/missions/${missionId}/accept`);
  if (!data.data) throw new Error(data.message ?? 'Erreur acceptation mission');
  return data.data;
}

export async function completeMissionApi(missionId: string, qrToken: string): Promise<MissionDto> {
  const { data } = await api.post<ApiResponse<MissionDto>>(
    `/api/v1/missions/${missionId}/complete`,
    { qrToken }
  );
  if (!data.data) throw new Error(data.message ?? 'Livraison non confirmée');
  return data.data;
}
