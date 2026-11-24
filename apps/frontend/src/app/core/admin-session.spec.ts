import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminSession } from './admin-session';

describe('AdminSession: lecturas eficientes del panel', () => {
  let session: AdminSession;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    session = TestBed.inject(AdminSession);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('comparte una sola solicitud GET cuando dos pantallas piden el mismo recurso a la vez', async () => {
    const first = session.get<{ total: number }>('/admin/dashboard', { modality: 'ORD' });
    const second = session.get<{ total: number }>('/admin/dashboard', { modality: 'ORD' });

    const requests = http.match('/api/v1/admin/dashboard?modality=ORD');
    expect(requests).toHaveLength(1);
    requests[0]!.flush({ data: { total: 12 } });

    await expect(Promise.all([first, second])).resolves.toEqual([{ total: 12 }, { total: 12 }]);
  });

  it('reutiliza por pocos segundos una lectura marcada como cacheable', async () => {
    const first = session.getCached<{ total: number }>('/admin/dashboard', {}, 15_000);
    http.expectOne('/api/v1/admin/dashboard').flush({ data: { total: 12 } });
    await expect(first).resolves.toEqual({ total: 12 });

    await expect(session.getCached<{ total: number }>('/admin/dashboard', {}, 15_000)).resolves.toEqual({ total: 12 });
    http.expectNone('/api/v1/admin/dashboard');
  });

  it('invalida las lecturas cacheadas después de una escritura', async () => {
    const first = session.getCached<{ total: number }>('/admin/dashboard');
    http.expectOne('/api/v1/admin/dashboard').flush({ data: { total: 12 } });
    await first;

    const mutation = session.postAuth<void>('/admin/calls/2027-I/publish');
    http.expectOne('/api/v1/admin/calls/2027-I/publish').flush({ data: undefined });
    await mutation;

    const fresh = session.getCached<{ total: number }>('/admin/dashboard');
    http.expectOne('/api/v1/admin/dashboard').flush({ data: { total: 13 } });
    await expect(fresh).resolves.toEqual({ total: 13 });
  });
});
