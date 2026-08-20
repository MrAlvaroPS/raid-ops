import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { provideRuntimeConfig, RaidOpsRuntimeConfig } from './core/config/runtime-config';

const TEST_CONFIG: RaidOpsRuntimeConfig = {
  apiBaseUrl: '',
  legacyAppUrl: 'http://legacy.test',
  migrationMode: 'foundation',
  productionSwitchEnabled: false,
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideRuntimeConfig(TEST_CONFIG),
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
    expect(compiled.textContent).toContain('Production switch disabled');
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
});
