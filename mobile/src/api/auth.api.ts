// Appels API d'authentification — login, register
import { api } from './axios.config';
import type { AuthResponse } from '../types';

export interface RegisterPayload {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  role: 'IMPORTER' | 'DRIVER';
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
    return data;
  } catch (err: unknown) {
    const e = err as {
      code?: string;
      message?: string;
      response?: { status: number; data: unknown; headers: unknown };
    };
    console.error('[auth.api] loginApi ERREUR RÉSEAU:', {
      code: e.code,
      message: e.message,
      httpStatus: e.response?.status,
      body: e.response?.data,
    });
    throw err;
  }
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/register', payload);
    return data;
  } catch (err: unknown) {
    const e = err as {
      code?: string;
      message?: string;
      response?: { status: number; data: unknown };
    };
    console.error('[auth.api] registerApi ERREUR RÉSEAU:', {
      code: e.code,
      message: e.message,
      httpStatus: e.response?.status,
      body: e.response?.data,
    });
    throw err;
  }
}
