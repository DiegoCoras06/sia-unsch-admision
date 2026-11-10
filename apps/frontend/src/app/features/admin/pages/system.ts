import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSession } from '../../../core/admin-session';
import { apiErrorMessage } from '../../../core/api.service';
import { shortDateTime } from '../../../core/format';

interface SystemInfo {
  integrations: Record<string, { label: string; value: string; ok: boolean }>;
  parameters: { key: string; label: string; value: string; updatedAt: string | null; _value?: string }[];
  failures: { id: string; eventType: string; occurredAt: string; attempts: number; lastError: string | null }[];
}

/** Spec 008, Historia 8: integraciones (sin secretos), fallas con reintento, respaldos y retención (RF-13.10, RF-14.04 a RF-14.10). */
@Component({
  selector: 'app-admin-system',
  imports: [FormsModule],
  template: `
    <header class="adm-head"><div><h1>Configuración</h1><p>Las credenciales viven solo en el servidor (variables de entorno o AWS Systems Manager Parameter Store) y aquí se muestran enmascaradas.</p></div></header>
    @if (msg()) { <p class="adm-msg" [class.err]="msgErr()" role="status">{{ msg() }}</p> }
    @if (info(); as s) {
      <section class="adm-panel"><h2>Integraciones</h2>
        <div class="adm-table-wrap"><table class="adm-table"><tbody>
          @for (i of integrations(); track i.label) {
            <tr><td><strong>{{ i.label }}</strong></td><td>{{ i.value }}</td><td><span class="adm-tag" [class.ok]="i.ok" [class.warn]="!i.ok">{{ i.ok ? 'Conectada' : 'Simulada / pendiente' }}</span></td></tr>
          }
        </tbody></table></div>
      </section>
      <div class="adm-grid">
        <section class="adm-panel"><h2>Retención y respaldos</h2>
          <div class="adm-table-wrap"><table class="adm-table"><tbody>
            @for (p of s.parameters; track p.key) {
              <tr><td>{{ p.label }}</td>
                <td>@if (p.key === 'retencion.auditoria') { {{ p.value }} } @else { <input class="input" style="width:12rem" [(ngModel)]="p._value" [attr.aria-label]="p.label"> }</td>
                <td>@if (p.key !== 'retencion.auditoria') {<button class="btn btn--quiet" type="button" (click)="saveParam(p)">Guardar</button>}</td></tr>
            }
          </tbody></table></div>
          <div class="adm-row"><button class="btn btn--quiet" type="button" (click)="runRetention()">Aplicar retención ahora</button>
            <span class="adm-muted">Borra las conversaciones del asistente más antiguas que el plazo.</span></div>
          <p class="adm-muted">Respaldo: copias automáticas diarias de Amazon RDS con recuperación a un punto en el tiempo; instantánea manual antes de publicar resultados. Restauración: crear instancia desde la instantánea, apuntar DATABASE_URL y verificar con npm run rds:check.</p>
        </section>
        <section class="adm-panel"><h2>Fallas de integración ({{ s.failures.length }})</h2>
          <div class="adm-table-wrap"><table class="adm-table"><tbody>
            @for (f of s.failures; track f.id) {
              <tr><td><strong>{{ f.eventType }}</strong><br><span class="adm-muted">{{ when(f.occurredAt) }}, {{ f.attempts }} intentos</span><br><span class="adm-muted">{{ f.lastError }}</span></td>
                <td><button class="btn btn--quiet" type="button" (click)="retry(f.id)">Reintentar</button></td></tr>
            } @empty { <tr class="adm-none"><td>Sin fallas pendientes. Todas las notificaciones se entregaron.</td></tr> }
          </tbody></table></div>
        </section>
      </div>
    }
  `,
})
export class SystemAdminPage implements OnInit {
  private readonly session = inject(AdminSession);
  protected readonly info = signal<SystemInfo | null>(null);
  protected readonly msg = signal<string | null>(null);
  protected readonly msgErr = signal(false);
  protected readonly when = shortDateTime;
  protected integrations = () => Object.values(this.info()?.integrations ?? {});

  ngOnInit() { void this.reload(); }

  private async reload() {
    const s = await this.session.get<SystemInfo>('/admin/system');
    s.parameters.forEach((p) => { p._value = p.value; });
    this.info.set(s);
  }

  protected saveParam(p: SystemInfo['parameters'][number]) {
    return this.act(async () => { await this.session.put(`/admin/parameters/${p.key}`, { value: p._value }); return `Guardado: ${p.label}.`; });
  }
  protected retry(id: string) {
    return this.act(async () => { await this.session.postAuth(`/admin/failures/${id}/retry`); return 'Reintento en curso.'; });
  }
  protected runRetention() {
    return this.act(async () => {
      const r = await this.session.postAuth<{ conversacionesBorradas: number; inscripcionesAnonimizadas: number }>('/admin/retention/run');
      return `Retención aplicada: ${r.conversacionesBorradas} conversaciones borradas y ${r.inscripcionesAnonimizadas} inscripciones antiguas anonimizadas.`;
    });
  }

  private async act(fn: () => Promise<string>) {
    try {
      this.msg.set(await fn());
      this.msgErr.set(false);
    } catch (e) {
      this.msg.set(apiErrorMessage(e));
      this.msgErr.set(true);
    }
    await this.reload();
  }
}
