import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Routes, withComponentInputBinding } from '@angular/router';
import { giphyApiKeyInterceptor } from './interceptors/giphy-api-key.interceptor';
import { giphyErrorInterceptor } from './interceptors/giphy-error.interceptor';
import { provideMaterialSymbols } from './providers/material-symbols.provider';
import { provideTheme } from './providers/theme.provider';

export type TCoreOptions = {
  routes: Routes;
};

export function provideCore({ routes }: TCoreOptions): (Provider | EnvironmentProviders)[] {
  return [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([giphyApiKeyInterceptor, giphyErrorInterceptor])),
    provideMaterialSymbols(),
    provideTheme(),
  ];
}
