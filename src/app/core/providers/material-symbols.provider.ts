import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';

/** Makes <mat-icon>name</mat-icon> use the Material Symbols Rounded font loaded in index.html. */
export function provideMaterialSymbols(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-rounded');
  });
}
