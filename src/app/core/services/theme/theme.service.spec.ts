import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY } from '../../models/theme.types';
import { ThemeService } from './theme.service';

/** Stands in for `matchMedia('(prefers-color-scheme: dark)')`, which jsdom lacks. */
class FakeDarkScheme extends EventTarget {
  constructor(public matches: boolean) {
    super();
  }

  osPrefersDark(matches: boolean): void {
    this.matches = matches;
    this.dispatchEvent(new Event('change'));
  }
}

describe('ThemeService', () => {
  let darkScheme: FakeDarkScheme;
  const root = document.documentElement;

  beforeEach(() => {
    darkScheme = new FakeDarkScheme(false);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => darkScheme,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
    localStorage.clear();
    root.classList.remove('light', 'dark');
    vi.restoreAllMocks();
  });

  function startService(): ThemeService {
    const service = TestBed.inject(ThemeService);
    service.init();
    return service;
  }

  it('follows the OS by default', () => {
    darkScheme.matches = true;

    const service = startService();

    expect(service.$mode()).toBe('system');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.classList.contains('light')).toBe(false);
  });

  it('keeps following the OS in system mode, but not once a mode is forced', () => {
    const service = startService();

    darkScheme.osPrefersDark(true);
    expect(root.classList.contains('dark')).toBe(true);

    service.setMode('light');
    darkScheme.osPrefersDark(true);
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.classList.contains('light')).toBe(true);
  });

  it('restores the stored mode', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    darkScheme.matches = true;

    const service = startService();

    expect(service.$mode()).toBe('light');
    expect(root.classList.contains('light')).toBe(true);
    expect(root.classList.contains('dark')).toBe(false);
  });

  it('ignores an unknown stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');

    expect(startService().$mode()).toBe('system');
  });

  it('applies and stores a chosen mode', () => {
    const service = startService();

    service.setMode('dark');

    expect(root.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('cycles system → light → dark → system', () => {
    const service = startService();
    const seen = [service.$mode()];

    for (let step = 0; step < 3; step++) {
      expect(service.$nextMode()).not.toBe(service.$mode());
      service.cycle();
      seen.push(service.$mode());
    }

    expect(seen).toEqual(['system', 'light', 'dark', 'system']);
  });

  it('still works for the visit when storage is unavailable', () => {
    const denied = () => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);

    const service = startService();
    expect(service.$mode()).toBe('system');

    expect(() => service.setMode('dark')).not.toThrow();
    expect(service.$mode()).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
  });
});
