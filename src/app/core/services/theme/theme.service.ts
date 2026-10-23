import { computed, DestroyRef, DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { THEME_MODES, THEME_STORAGE_KEY, TThemeMode } from '../../models/theme.types';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';
const DEFAULT_MODE: TThemeMode = 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly $modeState = signal<TThemeMode>(this.readStoredMode());

  readonly $mode = this.$modeState.asReadonly();
  /** What `cycle()` switches to: system → light → dark → system. */
  readonly $nextMode = computed(() => {
    const index = THEME_MODES.indexOf(this.$modeState());
    return THEME_MODES[(index + 1) % THEME_MODES.length] ?? DEFAULT_MODE;
  });

  private readonly darkScheme = this.document.defaultView?.matchMedia?.(DARK_SCHEME_QUERY) ?? null;

  init(): void {
    this.apply();

    if (this.darkScheme) {
      fromEvent(this.darkScheme, 'change')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.apply());
    }
  }

  setMode(mode: TThemeMode): void {
    this.$modeState.set(mode);
    this.apply();
    this.storeMode(mode);
  }

  cycle(): void {
    this.setMode(this.$nextMode());
  }

  private apply(): void {
    const mode = this.$modeState();
    const isDark = mode === 'dark' || (mode === 'system' && !!this.darkScheme?.matches);
    const { classList } = this.document.documentElement;

    classList.toggle('light', mode === 'light');
    classList.toggle('dark', isDark);
  }


  private readStoredMode(): TThemeMode {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      return THEME_MODES.find((mode) => mode === stored) ?? DEFAULT_MODE;
    } catch {
      return DEFAULT_MODE;
    }
  }

  private storeMode(mode: TThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Not persisted; the mode still applies for this visit.
    }
  }
}
