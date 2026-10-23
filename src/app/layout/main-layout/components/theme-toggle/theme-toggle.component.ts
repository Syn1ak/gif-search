import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TThemeMode } from '../../../../core/models/theme.types';
import { ThemeService } from '../../../../core/services/theme/theme.service';

const THEME_OPTIONS: Record<TThemeMode, { label: string; icon: string }> = {
  system: {
    label: 'System',
    icon: 'brightness_auto',
  },
  light: {
    label: 'Light',
    icon: 'light_mode',
  },
  dark: {
    label: 'Dark',
    icon: 'dark_mode',
  },
};

/** Cycles the theme. Deferred by the header: its Material button and tooltip stay out of the initial bundle. */
@Component({
  selector: 'app-theme-toggle',
  imports: [MatIconButton, MatIcon, MatTooltip],
  template: `
    @let theme = $theme();
    <button
      matIconButton
      type="button"
      [matTooltip]="'Theme: ' + theme.current.label"
      [attr.aria-label]="'Theme: ' + theme.current.label + '. Switch to ' + theme.next.label"
      (click)="themeService.cycle()"
    >
      <mat-icon>{{ theme.current.icon }}</mat-icon>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);

  protected readonly $theme = computed(() => {
    const mode = this.themeService.$mode();
    const next = this.themeService.$nextMode();

    return {
      current: THEME_OPTIONS[mode],
      next: THEME_OPTIONS[next],
    };
  });
}
