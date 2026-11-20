const ACCESS_TOKEN_KEY = 'speakeasy_admin_access_token';
const REFRESH_TOKEN_KEY = 'speakeasy_admin_refresh_token';
const ACCESS_COOKIE_NAME = 'admin_access_token';
const REFRESH_COOKIE_NAME = 'admin_refresh_token';

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=')[1] ?? '');
}

export function restoreTokensFromStorage(): void {
  if (typeof window === 'undefined') return;

  const access = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (access && !getCookieValue(ACCESS_COOKIE_NAME)) {
    setCookie(ACCESS_COOKIE_NAME, access, 60 * 60);
  }
  if (refresh && !getCookieValue(REFRESH_COOKIE_NAME)) {
    setCookie(REFRESH_COOKIE_NAME, refresh, 60 * 60 * 24 * 7);
  }
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  // Cookies for middleware (server-readable)
  setCookie(ACCESS_COOKIE_NAME, accessToken, 60 * 60); // 1 hour
  setCookie(REFRESH_COOKIE_NAME, refreshToken, 60 * 60 * 24 * 7); // 7 days
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? getCookieValue(ACCESS_COOKIE_NAME);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? getCookieValue(REFRESH_COOKIE_NAME);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  deleteCookie(ACCESS_COOKIE_NAME);
  deleteCookie(REFRESH_COOKIE_NAME);
}
