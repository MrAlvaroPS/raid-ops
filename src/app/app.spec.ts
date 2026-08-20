import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { provideRuntimeConfig, RaidOpsRuntimeConfig } from './core/config/runtime-config';

const TEST_CONFIG: RaidOpsRuntimeConfig = {
  apiBaseUrl: '',
  legacyAppUrl: 'http://legacy.test',
  migrationMode: 'incremental',
  productionSwitchEnabled: false,
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideRuntimeConfig(TEST_CONFIG),
        provideHttpClient(),
      ],
    }).compileComponents();
  });

  it('renders the Angular foundation inside the product shell', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/foundation');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand')?.textContent).toContain('AVOID');
    expect(compiled.querySelector('h1')?.textContent).toContain('Foundation');
    expect(compiled.textContent).toContain('global switch disabled');
  });

  it('makes legacy ownership explicit instead of rendering a fake product feature', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/mechanics');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Mechanics');
    expect(compiled.textContent).toContain('CURRENT OWNER');
    expect(compiled.textContent).toContain('LEGACY');
    expect(compiled.textContent).not.toContain('mechanical accuracy');
  });

  it('renders Composition in Angular without requesting WCL before scope is explicit', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/composition');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Composition');
    expect(compiled.textContent).toContain('CONTEXT REQUIRED');
    expect(compiled.textContent).toContain('No request has been made');
    expect(compiled.textContent).not.toContain('92%');
  });

  it('renders Damage & Healing in Angular without fixture metrics before scope is explicit', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/damage-healing');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Damage & Healing');
    expect(compiled.textContent).toContain('CONTEXT REQUIRED');
    expect(compiled.textContent).not.toContain('18.7M');
    expect(compiled.textContent).not.toContain('Execute DPS');
  });

  it('renders Pull Lab in Angular without a mock comparison before scope is explicit', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/pull-lab');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Pull Lab');
    expect(compiled.textContent).toContain('CONTEXT REQUIRED');
    expect(compiled.textContent).not.toContain('Why pull 25 was better');
    expect(compiled.textContent).not.toContain('18.7M');
  });
});
