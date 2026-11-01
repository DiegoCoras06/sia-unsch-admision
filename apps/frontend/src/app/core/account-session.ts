import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { ActivityDto, ConsentDto, IdentityLookupDto, InscriptionSummaryDto, ProfileDto, RegisterResultDto, UpdateProfileRequestDto } from '@sia/contracts';
import { firstValueFrom } from 'rxjs';

const API = '/api/v1';
const CLIENT = new HttpHeaders({ 'X-SIA-Client': 'web' });

/**
 * Cuenta opcional del postulante (enmienda de ADR-015, spec 002). El token de acceso vive en memoria y
 * se renueva con la cookie HttpOnly; inscribirse sigue sin requerir cuenta.
 */
@Injectable({ providedIn: 'root' })
export class AccountSession {
  private readonly http = inject(HttpClient);
  private token: string | null = null;
  private restoring: Promise<boolean> | null = null;
  readonly profile = signal<ProfileDto | null>(null);

  // ── Registro (Historia 1) ──────────────────────────────────────────
  consent = () => this.call<ConsentDto>('GET', '/legal/consent/current');
  lookup = (documentNumber: string, checkDigit: string) =>
    this.call<IdentityLookupDto>('POST', '/auth/identity/lookup', { documentType: 'DNI', documentNumber, checkDigit });
  register = (body: { identityToken: string; email: string; phone: string; password: string; consentVersion: string }) =>
    this.call<RegisterResultDto>('POST', '/auth/register', body);
  verifyEmail = (email: string, code: string) => this.call<{ verified: boolean }>('POST', '/auth/email/verify', { email, code });
  resendCode = (email: string) => this.call<{ message: string }>('POST', '/auth/email/resend', { email });
  forgot = (identifier: string) => this.call<{ message: string }>('POST', '/auth/password/forgot', { identifier });
  reset = (token: string, newPassword: string) => this.call<void>('POST', '/auth/password/reset', { token, newPassword });

  // ── Sesión (Historia 3) ────────────────────────────────────────────
  async login(identifier: string, password: string): Promise<void> {
    const r = await firstValueFrom(this.http.post<{ data: { accessToken: string } }>(`${API}/auth/login`, { identifier, password }));
    this.token = r.data.accessToken;
    await this.loadProfile();
  }

  restore(): Promise<boolean> {
    if (this.profile()) return Promise.resolve(true);
    this.restoring ??= this.refresh().then(async (ok) => {
      if (ok) await this.loadProfile().catch(() => this.clear());
      this.restoring = null;
      return Boolean(this.profile());
    });
    return this.restoring;
  }

  async logout(all = false): Promise<void> {
    if (all) await this.authed('POST', '/auth/logout-all').catch(() => undefined);
    else await firstValueFrom(this.http.post(`${API}/auth/logout`, {}, { headers: CLIENT })).catch(() => undefined);
    this.clear();
  }

  // ── Mi cuenta (Historias 4 y 5) ────────────────────────────────────
  inscriptions = () => this.authed<InscriptionSummaryDto[]>('GET', '/me/inscriptions');
  activity = () => this.authed<ActivityDto[]>('GET', '/me/activity');
  async updateProfile(body: UpdateProfileRequestDto): Promise<{ pendingEmailVerification: boolean }> {
    const r = await this.authedRaw<ProfileDto>('PATCH', '/me', body);
    this.profile.set(r.data);
    return { pendingEmailVerification: Boolean((r.meta as { pendingEmailVerification?: boolean } | undefined)?.pendingEmailVerification) };
  }

  private async loadProfile() {
    this.profile.set(await this.authed<ProfileDto>('GET', '/me'));
  }

  private async authed<T>(method: string, path: string, body?: unknown): Promise<T> {
    return (await this.authedRaw<T>(method, path, body)).data;
  }

  private async authedRaw<T>(method: string, path: string, body?: unknown, retried = false): Promise<{ data: T; meta?: unknown }> {
    try {
      const headers = this.token ? new HttpHeaders({ Authorization: `Bearer ${this.token}` }) : undefined;
      return await firstValueFrom(this.http.request<{ data: T; meta?: unknown }>(method, `${API}${path}`, { body, ...(headers ? { headers } : {}) }));
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401 && !retried && (await this.refresh())) return this.authedRaw<T>(method, path, body, true);
      throw e;
    }
  }

  private async refresh(): Promise<boolean> {
    try {
      const r = await firstValueFrom(this.http.post<{ data: { accessToken: string; user: { type: string } } }>(`${API}/auth/refresh`, {}, { headers: CLIENT }));
      if (r.data.user.type !== 'APPLICANT') return false;
      this.token = r.data.accessToken;
      return true;
    } catch {
      return false;
    }
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    return (await firstValueFrom(this.http.request<{ data: T }>(method, `${API}${path}`, { body }))).data;
  }

  private clear() {
    this.token = null;
    this.profile.set(null);
  }
}
