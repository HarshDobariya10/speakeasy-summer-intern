'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPatch } from '@/app/lib/api';
import ApiKeysModal from './ApiKeysModal';

const PAGE_SIZE = 10;
const POS_PROVIDERS = ['ORACLE', 'TOAST', 'UNION'] as const;
const API_KEY_TYPES = [
  'BASIC_AUTH',
  'BEARER_TOKEN',
  'API_KEY',
  'OAUTH2_CLIENT_CREDENTIALS',
  'OAUTH2_REFRESH_TOKEN',
  'JWT',
  'CUSTOM_HEADERS',
] as const;

type PosProvider = (typeof POS_PROVIDERS)[number];
type ApiKeyType = (typeof API_KEY_TYPES)[number];

type Venue = {
  id: string;
  venueName: string;
  posProvider: PosProvider;
  apiKeyType: ApiKeyType;
  apiKey: Record<string, unknown>;
};

type VenueFormState = {
  venueName: string;
  posProvider: PosProvider;
  apiKeyType: ApiKeyType;
  // credential sub-fields
  token: string;
  username: string;
  password: string;
  apiKeyValue: string;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  refreshToken: string;
  jwtToken: string;
  customHeaders: string; // JSON string for CUSTOM_HEADERS
};

const emptyFormState: VenueFormState = {
  venueName: '',
  posProvider: 'ORACLE',
  apiKeyType: 'BASIC_AUTH',
  token: '',
  username: '',
  password: '',
  apiKeyValue: '',
  clientId: '',
  clientSecret: '',
  tokenUrl: '',
  refreshToken: '',
  jwtToken: '',
  customHeaders: '{}',
};

/** Build the apiKey object to send to backend based on the selected type */
function buildApiKeyPayload(state: VenueFormState): Record<string, unknown> {
  switch (state.apiKeyType) {
    case 'BEARER_TOKEN':
      return { token: state.token };
    case 'BASIC_AUTH':
      return { username: state.username, password: state.password };
    case 'API_KEY':
      return { apiKey: state.apiKeyValue };
    case 'OAUTH2_CLIENT_CREDENTIALS':
      return { clientId: state.clientId, clientSecret: state.clientSecret, tokenUrl: state.tokenUrl };
    case 'OAUTH2_REFRESH_TOKEN':
      return { clientId: state.clientId, clientSecret: state.clientSecret, tokenUrl: state.tokenUrl, refreshToken: state.refreshToken };
    case 'JWT':
      return { jwtToken: state.jwtToken };
    case 'CUSTOM_HEADERS':
      try { return { headers: JSON.parse(state.customHeaders) }; } catch { return { headers: {} }; }
    default:
      return {};
  }
}

/** Parse apiKey JSON from backend into individual form fields */
function parseApiKeyIntoForm(apiKeyType: ApiKeyType, apiKey: Record<string, unknown>): Partial<VenueFormState> {
  switch (apiKeyType) {
    case 'BEARER_TOKEN':
      return { token: String(apiKey.token ?? '') };
    case 'BASIC_AUTH':
      return { username: String(apiKey.username ?? ''), password: String(apiKey.password ?? '') };
    case 'API_KEY':
      return { apiKeyValue: String(apiKey.apiKey ?? '') };
    case 'OAUTH2_CLIENT_CREDENTIALS':
      return { clientId: String(apiKey.clientId ?? ''), clientSecret: String(apiKey.clientSecret ?? ''), tokenUrl: String(apiKey.tokenUrl ?? '') };
    case 'OAUTH2_REFRESH_TOKEN':
      return { clientId: String(apiKey.clientId ?? ''), clientSecret: String(apiKey.clientSecret ?? ''), tokenUrl: String(apiKey.tokenUrl ?? ''), refreshToken: String(apiKey.refreshToken ?? '') };
    case 'JWT':
      return { jwtToken: String(apiKey.jwtToken ?? '') };
    case 'CUSTOM_HEADERS':
      return { customHeaders: JSON.stringify(apiKey.headers ?? {}, null, 2) };
    default:
      return {};
  }
}

export default function DashboardVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [formState, setFormState] = useState<VenueFormState>(emptyFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [viewApiKeysVenue, setViewApiKeysVenue] = useState<Venue | null>(null);
  // Custom confirm dialog state (avoids window.confirm blocking issues)
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const canNext = useMemo(() => {
    if (total === null) return venues.length === PAGE_SIZE;
    return page * PAGE_SIZE < total;
  }, [page, total, venues.length]);

  useEffect(() => { fetchVenues(page); }, [page]);

  async function fetchVenues(pageNumber: number) {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<any>(`/admin/venues?page=${pageNumber}&limit=${PAGE_SIZE}`);
      let venuesList: Venue[] = [];
      let totalCount: number | null = null;
      if (Array.isArray(response)) {
        venuesList = response;
        totalCount = response.length === PAGE_SIZE ? null : response.length + (pageNumber - 1) * PAGE_SIZE;
      } else if (response?.list && Array.isArray(response.list)) {
        venuesList = response.list; totalCount = response.total ?? null;
      } else if (response?.data && Array.isArray(response.data)) {
        venuesList = response.data; totalCount = response.total ?? null;
      } else if (response?.items && Array.isArray(response.items)) {
        venuesList = response.items; totalCount = response.total ?? null;
      } else {
        setError(`Unexpected data format: ${JSON.stringify(response).slice(0, 200)}`);
        setVenues([]); setTotal(null); setLoading(false); return;
      }
      setVenues(venuesList);
      setTotal(totalCount);
    } catch (err) {
      setError((err as Error).message || 'Unable to load venues.');
      setVenues([]); setTotal(null);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormOpen(true);
    setIsEditing(false);
    setSelectedVenue(null);
    setFormState(emptyFormState);
    setFormError(null);
  }

  function openEditForm(venue: Venue) {
    setFormOpen(true);
    setIsEditing(true);
    setSelectedVenue(venue);
    const parsed = parseApiKeyIntoForm(venue.apiKeyType, venue.apiKey ?? {});
    setFormState({ ...emptyFormState, venueName: venue.venueName, posProvider: venue.posProvider, apiKeyType: venue.apiKeyType, ...parsed });
    setFormError(null);
  }

  function set(field: keyof VenueFormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormState(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSubmitting(true);
    const apiKey = buildApiKeyPayload(formState);
    const payload = {
      venueName: formState.venueName.trim(),
      posProvider: formState.posProvider,
      apiKeyType: formState.apiKeyType,
      apiKey,
    };
    if (!payload.venueName) {
      setFormError('Venue name is required.');
      setFormSubmitting(false);
      return;
    }
    try {
      if (isEditing && selectedVenue) {
        await apiPatch(`/admin/venues/${selectedVenue.id}`, payload);
      } else {
        await apiPost('/admin/venues', payload);
      }
      setFormOpen(false);
      fetchVenues(page);
    } catch (err) {
      setFormError((err as Error).message || 'Failed to save venue.');
    } finally {
      setFormSubmitting(false);
    }
  }

  function promptDelete(venueId: string) {
    setConfirmState({
      message: 'Delete this venue? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          setLoading(true);
          await apiDelete(`/admin/venues/${venueId}`);
          const nextPage = venues.length === 1 && page > 1 ? page - 1 : page;
          setPage(nextPage);
          fetchVenues(nextPage);
        } catch (err) {
          setError((err as Error).message || 'Unable to delete venue.');
        } finally {
          setLoading(false);
        }
      },
    });
  }

  const t = formState.apiKeyType;

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <p style={styles.breadcrumb}>Dashboard / Venues</p>
          <h1 style={styles.pageTitle}>Venue Management</h1>
          <p style={styles.pageDescription}>Manage venue integrations, POS providers, and API keys from one place.</p>
        </div>
        <button type="button" style={styles.actionButton} onClick={openCreateForm}>Create New Venue</button>
      </div>

      {error ? <div style={styles.alert}>{error}</div> : null}

      <div style={styles.card}>
        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.loadingState}>Loading venues…</div>
          ) : venues.length === 0 ? (
            <div style={styles.emptyState}>No venues found. Start by creating a new venue.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Venue Name</th>
                  <th style={styles.th}>POS Provider</th>
                  <th style={styles.th}>API Key Type</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((venue) => (
                  <tr key={venue.id} style={styles.tr}>
                    <td style={styles.td}>{venue.venueName}</td>
                    <td style={styles.td}>{venue.posProvider}</td>
                    <td style={styles.td}>{venue.apiKeyType}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button id={`view-${venue.id}`} style={styles.viewButton} onClick={() => setViewApiKeysVenue(venue)}>View</button>
                      <button id={`edit-${venue.id}`} style={styles.secondaryButton} onClick={() => openEditForm(venue)}>Edit</button>
                      <button id={`delete-${venue.id}`} style={styles.dangerButton} onClick={() => promptDelete(venue.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.paginationRow}>
          <button
            type="button"
            style={{ ...styles.pageButton, opacity: page === 1 ? 0.45 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            disabled={page === 1}
            onClick={() => setPage(c => Math.max(1, c - 1))}
          >Previous</button>
          <span style={styles.pageInfo}>Page {page}{total ? ` of ${Math.ceil(total / PAGE_SIZE)}` : ''}</span>
          <button
            type="button"
            style={{ ...styles.pageButton, opacity: !canNext ? 0.45 : 1, cursor: !canNext ? 'not-allowed' : 'pointer' }}
            disabled={!canNext}
            onClick={() => setPage(c => c + 1)}
          >Next</button>
        </div>
      </div>

      {/* ── CREATE / EDIT VENUE MODAL ── */}
      {formOpen ? (
        <div style={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) setFormOpen(false); }}>
          <div style={styles.modalPanel}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{isEditing ? 'Edit Venue' : 'Create New Venue'}</h2>
                <p style={styles.modalSubtitle}>Add or update venue details for POS integration.</p>
              </div>
              <button style={styles.closeButton} onClick={() => setFormOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={styles.formGrid}>
              <label style={styles.fieldLabel}>
                Venue Name
                <input value={formState.venueName} onChange={set('venueName')} placeholder="Downtown Restaurant" style={styles.fieldInput} required />
              </label>

              <label style={styles.fieldLabel}>
                POS Provider
                <select value={formState.posProvider} onChange={set('posProvider')} style={styles.fieldInput}>
                  {POS_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>

              <label style={styles.fieldLabel}>
                Authentication Type
                <select value={formState.apiKeyType} onChange={set('apiKeyType')} style={styles.fieldInput}>
                  {API_KEY_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </label>

              {/* Dynamic credential fields based on apiKeyType */}
              {t === 'BEARER_TOKEN' && (
                <label style={styles.fieldLabel}>
                  Bearer Token
                  <input value={formState.token} onChange={set('token')} placeholder="eyJhbGci..." style={styles.fieldInput} required />
                </label>
              )}
              {t === 'BASIC_AUTH' && (<>
                <label style={styles.fieldLabel}>
                  Username
                  <input value={formState.username} onChange={set('username')} placeholder="admin" style={styles.fieldInput} required />
                </label>
                <label style={styles.fieldLabel}>
                  Password
                  <input value={formState.password} onChange={set('password')} placeholder="••••••••" style={styles.fieldInput} type="password" required />
                </label>
              </>)}
              {t === 'API_KEY' && (
                <label style={styles.fieldLabel}>
                  API Key
                  <input value={formState.apiKeyValue} onChange={set('apiKeyValue')} placeholder="sk-..." style={styles.fieldInput} required />
                </label>
              )}
              {(t === 'OAUTH2_CLIENT_CREDENTIALS' || t === 'OAUTH2_REFRESH_TOKEN') && (<>
                <label style={styles.fieldLabel}>
                  Client ID
                  <input value={formState.clientId} onChange={set('clientId')} placeholder="client_id" style={styles.fieldInput} required />
                </label>
                <label style={styles.fieldLabel}>
                  Client Secret
                  <input value={formState.clientSecret} onChange={set('clientSecret')} placeholder="client_secret" style={styles.fieldInput} required />
                </label>
                <label style={styles.fieldLabel}>
                  Token URL
                  <input value={formState.tokenUrl} onChange={set('tokenUrl')} placeholder="https://auth.example.com/token" style={styles.fieldInput} required />
                </label>
              </>)}
              {t === 'OAUTH2_REFRESH_TOKEN' && (
                <label style={styles.fieldLabel}>
                  Refresh Token
                  <input value={formState.refreshToken} onChange={set('refreshToken')} placeholder="refresh_token" style={styles.fieldInput} required />
                </label>
              )}
              {t === 'JWT' && (
                <label style={styles.fieldLabel}>
                  JWT Token
                  <input value={formState.jwtToken} onChange={set('jwtToken')} placeholder="eyJhbGci..." style={styles.fieldInput} required />
                </label>
              )}
              {t === 'CUSTOM_HEADERS' && (
                <label style={styles.fieldLabel}>
                  Custom Headers (JSON)
                  <textarea
                    value={formState.customHeaders}
                    onChange={set('customHeaders')}
                    placeholder={'{"X-API-Key": "value"}'}
                    style={{ ...styles.fieldInput, minHeight: 100, resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </label>
              )}

              {formError ? <div style={styles.formError}>{formError}</div> : null}

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setFormOpen(false)}>Cancel</button>
                <button type="submit" style={styles.submitButton} disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ── API KEYS MODAL ── */}
      {viewApiKeysVenue ? (
        <ApiKeysModal venue={viewApiKeysVenue} onClose={() => setViewApiKeysVenue(null)} />
      ) : null}

      {/* ── CUSTOM CONFIRM DIALOG ── */}
      {confirmState ? (
        <div style={styles.confirmBackdrop}>
          <div style={styles.confirmPanel}>
            <p style={styles.confirmMsg}>{confirmState.message}</p>
            <div style={styles.confirmActions}>
              <button style={styles.cancelButton} onClick={() => setConfirmState(null)}>Cancel</button>
              <button style={styles.dangerButton} onClick={confirmState.onConfirm}>Confirm Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { color: '#f0ead6', minHeight: '100vh', fontFamily: "'DM Sans',sans-serif" },
  topBar: { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' },
  breadcrumb: { margin: 0, color: '#7a6f5e', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' },
  pageTitle: { margin: '10px 0 8px', fontSize: 32, fontWeight: 500, color: '#f0ead6' },
  pageDescription: { margin: 0, color: '#b9a87b', fontSize: 14, maxWidth: 620 },
  actionButton: { padding: '12px 18px', borderRadius: 6, border: 'none', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0c0b09', fontWeight: 700, cursor: 'pointer', boxShadow: '0 14px 30px rgba(201,168,76,0.15)' },
  alert: { marginBottom: 20, padding: '14px 18px', borderRadius: 8, background: '#3f1f1f', color: '#f2c6c6', border: '1px solid #6e3838' },
  card: { background: '#161410', border: '1px solid #2a2520', borderRadius: 16, padding: 24, minHeight: 320 },
  tableWrapper: { overflowX: 'auto' },
  loadingState: { padding: 54, fontSize: 15, color: '#c9a84c' },
  emptyState: { padding: 54, color: '#7a6f5e', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 720 },
  th: { textAlign: 'left', padding: '18px 16px 12px', color: '#7a6f5e', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #2a2520' },
  tr: { borderBottom: '1px solid #2a2520' },
  td: { padding: '16px', fontSize: 14, color: '#f0ead6', verticalAlign: 'middle' },
  viewButton: { marginRight: 10, padding: '8px 14px', borderRadius: 6, border: '1px solid #1e3a5f', background: '#0f1e30', color: '#7ba7f5', cursor: 'pointer' },
  secondaryButton: { marginRight: 10, padding: '8px 14px', borderRadius: 6, border: '1px solid #3f3a35', background: '#1f1b18', color: '#d3c6a5', cursor: 'pointer' },
  dangerButton: { padding: '8px 14px', borderRadius: 6, border: '1px solid #5d2f2f', background: '#2d1d1d', color: '#f3c6c6', cursor: 'pointer' },
  paginationRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, gap: 16, flexWrap: 'wrap' },
  pageButton: { padding: '10px 16px', minWidth: 110, borderRadius: 8, border: '1px solid #2a2520', background: '#1f1b18', color: '#f0ead6', cursor: 'pointer' },
  pageInfo: { color: '#7a6f5e', fontSize: 13 },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(10,9,8,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 },
  modalPanel: { width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', background: '#161410', borderRadius: 18, border: '1px solid #2a2520', padding: 28, boxShadow: '0 24px 80px rgba(0,0,0,0.35)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 24, alignItems: 'flex-start' },
  modalTitle: { margin: 0, fontSize: 24, fontWeight: 600, color: '#f0ead6' },
  modalSubtitle: { margin: '8px 0 0', fontSize: 14, color: '#7a6f5e' },
  closeButton: { border: 'none', background: 'transparent', color: '#7a6f5e', fontSize: 26, lineHeight: 1, cursor: 'pointer' },
  formGrid: { display: 'grid', gap: 18 },
  fieldLabel: { display: 'grid', gap: 8, color: '#f0ead6', fontSize: 13, fontWeight: 500 },
  fieldInput: { width: '100%', minHeight: 48, padding: '12px 14px', borderRadius: 12, border: '1px solid #2a2520', background: '#0c0b09', color: '#f0ead6', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  formError: { color: '#f3c6c6', fontSize: 13, padding: '12px 0 0' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap', marginTop: 8 },
  cancelButton: { padding: '12px 18px', borderRadius: 10, border: '1px solid #2a2520', background: 'transparent', color: '#7a6f5e', cursor: 'pointer' },
  submitButton: { padding: '12px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0c0b09', fontWeight: 700, cursor: 'pointer' },
  confirmBackdrop: { position: 'fixed', inset: 0, background: 'rgba(10,9,8,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 },
  confirmPanel: { background: '#1a1814', border: '1px solid #2e2a25', borderRadius: 14, padding: '28px 32px', maxWidth: 420, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', fontFamily: "'DM Sans',sans-serif" },
  confirmMsg: { margin: '0 0 24px', fontSize: 15, color: '#f0ead6', lineHeight: 1.6 },
  confirmActions: { display: 'flex', justifyContent: 'flex-end', gap: 12 },
};
