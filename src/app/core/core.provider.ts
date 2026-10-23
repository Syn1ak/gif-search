import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Routes, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { giphyApiKeyInterceptor } from './interceptors/giphy-api-key.interceptor';

export type TCoreOptions = {
  routes: Routes;
};

export function provideCore({ routes }: TCoreOptions): (Provider | EnvironmentProviders)[] {
  return [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions({ skipInitialTransition: true })),
    provideHttpClient(withFetch(), withInterceptors([giphyApiKeyInterceptor])),
  ];
}
