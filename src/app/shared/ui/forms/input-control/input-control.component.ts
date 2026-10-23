import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatError, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ABaseInputComponent } from '../a-base-input.component';
import { HostNgControlDirective } from '../directives/host-ng-control.directive';

@Component({
  selector: 'app-input-control',
  imports: [
    MatFormField,
    MatLabel,
    MatError,
    MatPrefix,
    MatSuffix,
    MatInput,
    MatIcon,
    MatIconButton,
    MatProgressSpinner,
    HostNgControlDirective,
  ],
  templateUrl: './input-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputControlComponent extends ABaseInputComponent<string> {
  readonly $label = input('', { alias: 'label' });
  readonly $placeholder = input('', { alias: 'placeholder' });
  readonly $type = input<'text' | 'search' | 'email'>('text', { alias: 'type' });
  readonly $prefixIcon = input('', { alias: 'prefixIcon' });
  readonly $clearable = input(false, { alias: 'clearable' });
  readonly $loading = input(false, { alias: 'loading' });
  readonly $enter = output<string>({ alias: 'enter' });

  private readonly $input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  onInput(event: Event): void {
    this.updateValue((event.target as HTMLInputElement).value);
  }

  onBlur(): void {
    this.markAsTouched();
  }

  onEnter(): void {
    this.$enter.emit(this.$value() ?? '');
  }

  clear(): void {
    this.updateValue('');
    this.$input().nativeElement.focus();
  }
}
