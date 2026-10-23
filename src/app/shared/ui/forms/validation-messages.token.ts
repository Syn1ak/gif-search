import { inject, InjectionToken, Provider } from '@angular/core';

/** Builds a message from the value a validator put under its error key. */
export type TValidationMessageFn = (error: unknown) => string;

export type TValidationMessages = Record<string, TValidationMessageFn>;

type TLengthError = { requiredLength: number };

export const DEFAULT_VALIDATION_MESSAGES: TValidationMessages = {
  required: () => 'This field is required',
  maxlength: (error) => `Maximum length is ${(error as TLengthError).requiredLength} characters`,
  minlength: (error) => `Minimum length is ${(error as TLengthError).requiredLength} characters`,
  email: () => 'Enter a valid email address',
  pattern: () => 'Invalid format',
};

export const FALLBACK_VALIDATION_MESSAGE = 'Invalid value';

export const VALIDATION_MESSAGES = new InjectionToken<TValidationMessages>('VALIDATION_MESSAGES', {
  providedIn: 'root',
  factory: () => DEFAULT_VALIDATION_MESSAGES,
});

/** Overrides or extends the messages for an injector subtree (a route, a feature, a dialog). */
export function provideValidationMessages(overrides: TValidationMessages): Provider {
  return {
    provide: VALIDATION_MESSAGES,
    useFactory: () => ({
      // At the root there is no parent provider to extend, only the defaults.
      ...(inject(VALIDATION_MESSAGES, {
        skipSelf: true,
        optional: true,
      }) ?? DEFAULT_VALIDATION_MESSAGES),
      ...overrides,
    }),
  };
}
