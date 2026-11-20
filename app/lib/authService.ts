import {
  AdminLoginDto,
  AdminRegisterDto,
  AdminRefreshTokenDto,
  AuthResponse,
  RefreshResponse,
  AdminUser,
} from '@/app/types/auth';
import { apiPost, apiGet } from './api';
import { saveTokens, clearTokens } from './token';

export async function login(dto: AdminLoginDto): Promise<AuthResponse> {
  const data = await apiPost<AuthResponse>('/admin/auth/login', dto);
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function register(dto: AdminRegisterDto): Promise<AuthResponse> {
  const data = await apiPost<AuthResponse>('/admin/auth/register', dto);
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiPost<{ message: string }>('/admin/auth/logout');
  } catch {
    // Clear tokens regardless of API response
  }
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export async function refreshToken(dto: AdminRefreshTokenDto): Promise<RefreshResponse> {
  const data = await apiPost<RefreshResponse>('/admin/auth/refresh-token', dto);
  saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function getProfile(): Promise<AdminUser> {
  const data = await apiGet<{ admin: AdminUser }>('/admin/auth/profile');
  return data.admin;
}
