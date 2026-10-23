import { computed, Directive, inject, OnInit, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlContainer,
  ControlValueAccessor,
  FormControlName,
  NgControl,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { of, switchMap } from 'rxjs';
import { FALLBACK_VALIDATION_MESSAGE, VALIDATION_MESSAGES } from './validation-messages.token';

/**
 * Base class for form controls: a typed ControlValueAccessor that also reads the bound control,
 * so subclasses can show its validation state without the parent passing errors in.
 *
 * It registers itself as the value accessor of the host NgControl instead of providing
 * NG_VALUE_ACCESSOR, which would make injecting that same NgControl a circular dependency.
 * Works with both `[formControl]` and `formControlName` inside a `[formGroup]`.
 */
@Directive()
export abstract class ABaseInputComponent<T> implements ControlValueAccessor, OnInit {
  protected readonly ngControl = inject(NgControl, {
    self: true,
    optional: true,
  });
  private readonly controlContainer = inject(ControlContainer, {
    skipSelf: true,
    optional: true,
  });
  private readonly messages = inject(VALIDATION_MESSAGES);

  protected readonly $value = signal<T | null>(null);
  protected readonly $disabled = signal(false);

  private readonly $control = signal<AbstractControl | null>(null);
  /** Ticks on every value, status, touched and pristine change of the bound control. */
  private readonly $controlChanges = toSignal(
    toObservable(this.$control).pipe(switchMap((control) => control?.events ?? of(null))),
  );

  /** Messages for the current errors, shown once the user has touched or changed the field. */
  readonly $errors = computed(() => {
    this.$controlChanges();
    const control = this.$control();

    if (!control?.errors || !(control.touched || control.dirty)) {
      return [];
    }

    return Object.entries(control.errors).map(([key, error]) => this.toMessage(key, error));
  });

  /** Keeps Material's error styling in sync with the messages above. */
  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.$errors().length > 0,
  };

  private onChange: (value: T | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.$control.set(this.resolveControl());
  }

  writeValue(value: T | null): void {
    this.$value.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.$disabled.set(isDisabled);
  }

  /** Call from the view when the user changes the value. */
  protected updateValue(value: T | null): void {
    this.$value.set(value);
    this.onChange(value);
  }

  /** Call from the view when the user leaves the field. */
  protected markAsTouched(): void {
    this.onTouched();
  }

  /**
   * FormControlName registers its control after this component's ngOnInit has run,
   * so a named control is looked up in the parent group directly.
   */
  private resolveControl(): AbstractControl | null {
    if (this.ngControl instanceof FormControlName) {
      const { name } = this.ngControl;
      return name === null ? null : (this.controlContainer?.control?.get(String(name)) ?? null);
    }

    return this.ngControl?.control ?? null;
  }

  private toMessage(key: string, error: unknown): string {
    const message = this.messages[key];
    return message ? message(error) : FALLBACK_VALIDATION_MESSAGE;
  }
}
