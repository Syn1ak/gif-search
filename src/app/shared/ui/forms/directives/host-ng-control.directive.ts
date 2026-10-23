import { Directive, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Shares the wrapper component's NgControl with an inner Material control.
 *
 * MatInput only tracks error, disabled and required state when it finds an NgControl on its own
 * element. In a ControlValueAccessor wrapper that NgControl sits on the wrapper's host instead,
 * so this directive re-provides it one level down.
 */
@Directive({
  selector: '[appHostNgControl]',
  providers: [
    {
      provide: NgControl,
      useFactory: () =>
        inject(NgControl, {
          skipSelf: true,
          optional: true,
        }),
    },
  ],
})
export class HostNgControlDirective {}
