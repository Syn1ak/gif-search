import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, Provider } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { provideValidationMessages } from '../validation-messages.token';
import { InputControlComponent } from './input-control.component';

@Component({
  imports: [ReactiveFormsModule, InputControlComponent],
  template: `
    <app-input-control
      class="standalone"
      label="Search"
      [formControl]="search"
      [clearable]="true"
      (enter)="submitted.push($event)"
    />
    <form [formGroup]="form">
      <app-input-control class="grouped" label="Name" formControlName="name" />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly search = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(5)],
  });
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  readonly submitted: string[] = [];
}

describe('InputControlComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let loader: HarnessLoader;

  async function setUp(providers: Provider[] = []): Promise<void> {
    TestBed.configureTestingModule({ providers });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  }

  const searchInput = () => loader.getHarness(MatInputHarness.with({ ancestor: '.standalone' }));
  const searchField = () => loader.getHarness(MatFormFieldHarness.with({ ancestor: '.standalone' }));
  const nameField = () => loader.getHarness(MatFormFieldHarness.with({ ancestor: '.grouped' }));

  describe('with [formControl]', () => {
    beforeEach(() => setUp());

    it('shows the model value and writes user input back to the control', async () => {
      host.search.setValue('cats');
      const input = await searchInput();

      expect(await input.getValue()).toBe('cats');

      await input.setValue('dogs');

      expect(host.search.value).toBe('dogs');
      expect(host.search.dirty).toBe(true);
    });

    it('marks the control as touched on blur', async () => {
      const input = await searchInput();

      await input.focus();
      await input.blur();

      expect(host.search.touched).toBe(true);
    });

    it('follows the disabled state of the control', async () => {
      host.search.disable();

      expect(await (await searchInput()).isDisabled()).toBe(true);
    });

    it('shows validation messages only after the user interacted with the field', async () => {
      host.search.setValue('too long');

      expect(await (await searchField()).getTextErrors()).toEqual([]);

      host.search.markAsTouched();

      expect(await (await searchField()).getTextErrors()).toEqual(['Maximum length is 5 characters']);
      expect(await (await searchField()).isControlValid()).toBe(false);
    });

    it('clears the value with the clear button', async () => {
      await (await searchInput()).setValue('cats');

      await (await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Clear"]' }))).click();

      expect(host.search.value).toBe('');
    });

    it('emits the current value on Enter', async () => {
      const input = await searchInput();
      await input.setValue('cats');

      await (await input.host()).dispatchEvent('keydown', { key: 'Enter' });

      expect(host.submitted).toEqual(['cats']);
    });
  });

  describe('with formControlName inside a form group', () => {
    beforeEach(() => setUp());

    it('binds to the named control and marks it as required', async () => {
      const input = await loader.getHarness(MatInputHarness.with({ ancestor: '.grouped' }));
      await input.setValue('Ada');

      expect(host.form.value).toEqual({ name: 'Ada' });
      expect(await input.isRequired()).toBe(true);
    });

    it('shows the required message after blur', async () => {
      const input = await loader.getHarness(MatInputHarness.with({ ancestor: '.grouped' }));

      await input.focus();
      await input.blur();

      expect(await (await nameField()).getTextErrors()).toEqual(['This field is required']);
    });
  });

  it('uses messages provided by provideValidationMessages', async () => {
    await setUp([provideValidationMessages({ maxlength: () => 'Too long!' })]);

    host.search.setValue('too long');
    host.search.markAsTouched();

    expect(await (await searchField()).getTextErrors()).toEqual(['Too long!']);
  });
});
