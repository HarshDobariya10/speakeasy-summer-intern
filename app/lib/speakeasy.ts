import { apiDelete, apiGet, apiPatch, apiPost } from './api';

/* ───────────────────────── Types (mirror the NestJS / Prisma models) ───────────────────────── */

export const POS_PROVIDERS = ['ORACLE', 'TOAST', 'UNION'] as const;
export const API_KEY_TYPES = [
  'API_KEY',
  'BEARER_TOKEN',
  'BASIC_AUTH',
  'OAUTH2_CLIENT_CREDENTIALS',
  'OAUTH2_REFRESH_TOKEN',
  'JWT',
  'CUSTOM_HEADERS',
] as const;
export const EXPIRY_OPTIONS = ['NO_EXPIRE', 'ONE_DAY', 'ONE_WEEK', 'ONE_MONTH'] as const;

export type PosProvider = (typeof POS_PROVIDERS)[number];
export type ApiKeyType = (typeof API_KEY_TYPES)[number];
export type ApiKeyExpiration = (typeof EXPIRY_OPTIONS)[number];

export interface VenueApiKey {
  id: string;
  name: string;
  apiKey: string;
  venueId: string;
  expiryOption: ApiKeyExpiration;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isDeleted: boolean;
}

export interface Venue {
  id: string;
  venueName: string;
  posProvider: PosProvider;
  apiKeyType: ApiKeyType;
  apiKey: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  venueApiKeys?: VenueApiKey[];
}

export interface Paginated<T> {
  total: number;
  list: T[];
  hasMany: boolean;
  count: number;
}

export interface VenuePayload {
  venueName: string;
  posProvider: PosProvider;
  apiKeyType: ApiKeyType;
  apiKey: Record<string, unknown>;
}

/* ───────────────────────── Labels ───────────────────────── */

export const POS_LABELS: Record<PosProvider, string> = {
  ORACLE: 'Oracle MICROS',
  TOAST: 'Toast',
  UNION: 'Union',
};

export const AUTH_LABELS: Record<ApiKeyType, string> = {
  API_KEY: 'API Key',
  BEARER_TOKEN: 'Bearer Token',
  BASIC_AUTH: 'Basic Auth',
  OAUTH2_CLIENT_CREDENTIALS: 'OAuth2 · Client Credentials',
  OAUTH2_REFRESH_TOKEN: 'OAuth2 · Refresh Token',
  JWT: 'JWT',
  CUSTOM_HEADERS: 'Custom Headers',
};

export const EXPIRY_LABELS: Record<ApiKeyExpiration, string> = {
  NO_EXPIRE: 'Never expires',
  ONE_DAY: '1 day',
  ONE_WEEK: '1 week',
  ONE_MONTH: '1 month',
};

/** Credential fields the backend requires for each auth type (see VenueService.validateApiCredentials). */
export const CREDENTIAL_FIELDS: Record<
  Exclude<ApiKeyType, 'CUSTOM_HEADERS'>,
  { key: string; label: string; secret?: boolean; placeholder: string }[]
> = {
  API_KEY: [{ key: 'apiKey', label: 'API Key', secret: true, placeholder: 'sk_live_…' }],
  BEARER_TOKEN: [{ key: 'token', label: 'Bearer Token', secret: true, placeholder: 'eyJhbGciOi…' }],
  BASIC_AUTH: [
    { key: 'username', label: 'Username', placeholder: 'pos-integration' },
    { key: 'password', label: 'Password', secret: true, placeholder: '••••••••' },
  ],
  OAUTH2_CLIENT_CREDENTIALS: [
    { key: 'clientId', label: 'Client ID', placeholder: 'client_id' },
    { key: 'clientSecret', label: 'Client Secret', secret: true, placeholder: 'client_secret' },
    { key: 'tokenUrl', label: 'Token URL', placeholder: 'https://auth.provider.com/oauth/token' },
  ],
  OAUTH2_REFRESH_TOKEN: [
    { key: 'clientId', label: 'Client ID', placeholder: 'client_id' },
    { key: 'clientSecret', label: 'Client Secret', secret: true, placeholder: 'client_secret' },
    { key: 'tokenUrl', label: 'Token URL', placeholder: 'https://auth.provider.com/oauth/token' },
    { key: 'refreshToken', label: 'Refresh Token', secret: true, placeholder: 'refresh_token' },
  ],
  JWT: [{ key: 'jwtToken', label: 'JWT', secret: true, placeholder: 'eyJhbGciOi…' }],
};

/* ───────────────────────── Venues API ───────────────────────── */

export interface VenueQuery {
  skip?: number;
  take?: number;
  search?: string;
  orderBy?: string; // e.g. "createdAt|desc"
  includeKeys?: boolean;
}

function venueQueryString(q: VenueQuery): string {
  const p = new URLSearchParams();
  if (q.skip) p.set('skip', String(q.skip));
  if (q.take) p.set('take', String(q.take));
  if (q.orderBy) p.set('orderBy', q.orderBy);
  if (q.search?.trim()) {
    p.set('search', q.search.trim());
    p.set('search_column', 'venueName');
  }
  if (q.includeKeys) p.set('include', 'venueApiKeys');
  return p.toString();
}

export async function listVenues(q: VenueQuery = {}): Promise<Paginated<Venue>> {
  const data = await apiGet<Paginated<Venue>>(`/admin/venues?${venueQueryString(q)}`);
  return { ...data, list: data.list.map(withLiveKeys) };
}

/** Fetches every venue (paging through the 50-per-request backend limit) with their API keys. */
export async function listAllVenuesWithKeys(): Promise<Venue[]> {
  const all: Venue[] = [];
  let skip = 0;
  for (;;) {
    const page = await listVenues({ skip, take: 50, includeKeys: true, orderBy: 'createdAt|desc' });
    all.push(...page.list);
    if (!page.hasMany) break;
    skip += 50;
  }
  return all;
}

export const getVenue = (id: string) => apiGet<Venue>(`/admin/venues/${id}`);
export const createVenue = (body: VenuePayload) => apiPost<Venue>('/admin/venues', body);
export const updateVenue = (id: string, body: Partial<VenuePayload>) =>
  apiPatch<Venue>(`/admin/venues/${id}`, body);
export const deleteVenue = (id: string) => apiDelete<Venue>(`/admin/venues/${id}`);

/* ───────────────────────── Venue API keys ───────────────────────── */

export const listVenueKeys = async (venueId: string) =>
  (await apiGet<VenueApiKey[]>(`/admin/venue-api-keys?venueId=${venueId}`)).filter((k) => !k.isDeleted);
export const createVenueKey = (body: { name: string; venueId: string; expiryOption: ApiKeyExpiration }) =>
  apiPost<VenueApiKey>('/admin/venue-api-keys', body);
export const updateVenueKey = (id: string, body: { name?: string; expiryOption?: ApiKeyExpiration }) =>
  apiPatch<VenueApiKey>(`/admin/venue-api-keys/${id}`, body);
export const deleteVenueKey = (id: string) => apiDelete<VenueApiKey>(`/admin/venue-api-keys/${id}`);

function withLiveKeys(v: Venue): Venue {
  return v.venueApiKeys ? { ...v, venueApiKeys: v.venueApiKeys.filter((k) => !k.isDeleted) } : v;
}

/* ───────────────────────── Helpers ───────────────────────── */

export type KeyStatus = 'active' | 'expiring' | 'expired';

const DAY = 24 * 60 * 60 * 1000;

export function keyStatus(k: Pick<VenueApiKey, 'expiresAt'>, now = Date.now()): KeyStatus {
  if (!k.expiresAt) return 'active';
  const t = new Date(k.expiresAt).getTime();
  if (t <= now) return 'expired';
  if (t - now <= 3 * DAY) return 'expiring';
  return 'active';
}

export function maskKey(key: string): string {
  if (key.length <= 12) return '•'.repeat(key.length);
  return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}

export function maskSecret(value: string): string {
  if (!value) return '';
  return value.length <= 4 ? '••••' : `${'•'.repeat(Math.min(12, value.length - 4))}${value.slice(-4)}`;
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [365 * DAY, 'y'],
    [30 * DAY, 'mo'],
    [DAY, 'd'],
    [60 * 60 * 1000, 'h'],
    [60 * 1000, 'm'],
  ];
  for (const [ms, label] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms);
      return diff >= 0 ? `${n}${label} ago` : `in ${n}${label}`;
    }
  }
  return 'just now';
}

export function timeUntil(iso: string | null | undefined): string {
  if (!iso) return 'No expiry';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return `Expired ${timeAgo(iso)}`;
  return `Expires ${timeAgo(iso)}`;
}
