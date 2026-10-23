import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { ThemeService } from '../services/theme/theme.service';

/** Applies the stored theme on startup and keeps the system mode in sync with the OS. */
export function provideTheme(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => inject(ThemeService).init());
}
