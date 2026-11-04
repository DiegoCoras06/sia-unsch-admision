import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface StaffMe { id: string; email: string; fullName: string; roles: string[]; permissions: string[] }
export interface StaffStep {
  step: 'CHANGE_PASSWORD' | 'SETUP_MFA' | 'MFA';
  challenge: string;
  fullName: string;
  mfaSetup?: { secret: string; otpauthUri: string; qrDataUrl: string };
}
type Query = Record<string, string | number | boolean | undefined | null>;

const API = '/api/v1';
const CLIENT = new HttpHeaders({ 'X-SIA-Client': 'web' });

/**
 * Sesión del personal (ADR-018). El token de acceso vive solo en memoria; al recargar la página
 * se renueva con la cookie HttpOnly de refresco. Cada llamada del panel pasa por `request`,
 * que agrega el token y, si venció, lo renueva una vez.
 */
@Injectable({ providedIn: 'root' })
export class AdminSession {
  private readonly http = inject(HttpClient);
  private token: string | null = null;
  private restoring: Promise<boolean> | null = null;
  readonly me = signal<StaffMe | null>(null);
  /** Consultas en curso: el marco del panel muestra la barra de progreso y las filas de carga. */
  private readonly pending = signal(0);
  readonly busy = computed(() => this.pending() > 0);
  /** Falló la conexión o el servidor al consultar (no un 4xx, que cada pantalla explica a su manera). */
  readonly loadFailed = signal(false);
  readonly permissions = computed(() => new Set(this.me()?.permissions ?? []));

  can = (permission: string) => this.permissions().has(permission);

  // ── Ingreso en pasos ───────────────────────────────────────────────
  login = (email: string, password: string) => this.post<StaffStep>('/admin/auth/login', { email, password });
  changePassword = (challenge: string, newPassword: string) => this.post<StaffStep>('/admin/auth/password', { challenge, newPassword });

  /** Al activar el segundo factor devuelve los códigos de respaldo, que no se vuelven a mostrar (ADR-022). */
  async verifyMfa(challenge: string, code: string): Promise<string[] | undefined> {
    const r = await this.post<{ accessToken: string; recoveryCodes?: string[] }>('/admin/auth/mfa', { challenge, code });
    this.token = r.accessToken;
    await this.loadMe();
    return r.recoveryCodes;
  }

  async verifyRecovery(challenge: string, code: string): Promise<void> {
    const r = await this.post<{ accessToken: string }>('/admin/auth/recovery', { challenge, code });
    this.token = r.accessToken;
    await this.loadMe();
  }

  recoveryStatus = () => this.get<{ remaining: number }>('/admin/me/recovery-codes');
  regenerateRecovery = (code: string) => this.postAuth<{ codes: string[] }>('/admin/me/recovery-codes', { code });

  /** Recupera la sesión con la cookie (recarga de página). Devuelve si hay sesión del personal. */
  restore(): Promise<boolean> {
    if (this.me()) return Promise.resolve(true);
    this.restoring ??= this.refresh().then(async (ok) => {
      if (ok) await this.loadMe().catch(() => this.clear());
      this.restoring = null;
      return Boolean(this.me());
    });
    return this.restoring;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post(`${API}/auth/logout`, {}, { headers: CLIENT })).catch(() => undefined);
    this.clear();
  }

  // ── Llamadas autenticadas ──────────────────────────────────────────
  async get<T>(path: string, query: Query = {}): Promise<T> {
    if (this.pending() === 0) this.loadFailed.set(false);
    this.pending.update((n) => n + 1);
    try {
      return await this.request<T>('GET', path, undefined, query);
    } catch (e) {
      if (e instanceof HttpErrorResponse && (e.status === 0 || e.status >= 500)) this.loadFailed.set(true);
      throw e;
    } finally {
      this.pending.update((n) => n - 1);
    }
  }
  put<T>(path: string, body: unknown) { return this.request<T>('PUT', path, body); }
  postAuth<T>(path: string, body: unknown = {}) { return this.request<T>('POST', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }

  async request<T>(method: string, path: string, body?: unknown, query: Query = {}, retried = false): Promise<T> {
    try {
      const res = await firstValueFrom(this.http.request<{ data: T }>(method, `${API}${path}`, {
        body, params: this.params(query), headers: this.auth(),
      }));
      return (res?.data ?? (undefined as T));
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401 && !retried && (await this.refresh())) {
        return this.request<T>(method, path, body, query, true);
      }
      throw e;
    }
  }

  /** Archivo protegido (p. ej. un documento del expediente) como blob, con el token. */
  async blob(path: string, retried = false): Promise<Blob> {
    try {
      return await firstValueFrom(this.http.get(`${API}${path}`, { headers: this.auth(), responseType: 'blob' }));
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401 && !retried && (await this.refresh())) return this.blob(path, true);
      throw e;
    }
  }

  /** Descarga un reporte (Excel o PDF) con el token, sin exponerlo en la URL. */
  async download(path: string, query: Query, filename: string): Promise<void> {
    const blob = await firstValueFrom(this.http.get(`${API}${path}`, { params: this.params(query), headers: this.auth(), responseType: 'blob' }));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private async refresh(): Promise<boolean> {
    try {
      const r = await firstValueFrom(this.http.post<{ data: { accessToken: string; user: { type: string } } }>(`${API}/auth/refresh`, {}, { headers: CLIENT }));
      if (r.data.user.type !== 'STAFF') return false;
      this.token = r.data.accessToken;
      return true;
    } catch {
      return false;
    }
  }

  private async loadMe() {
    this.me.set(await this.request<StaffMe>('GET', '/admin/me'));
  }

  private clear() {
    this.token = null;
    this.me.set(null);
  }

  private auth() {
    return this.token ? new HttpHeaders({ Authorization: `Bearer ${this.token}` }) : new HttpHeaders();
  }

  private params(q: Query) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    return p;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return (await firstValueFrom(this.http.post<{ data: T }>(`${API}${path}`, body))).data;
  }
}
