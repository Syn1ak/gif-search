import { TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('names the current and the next mode, and switches on click', async () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    await fixture.whenStable();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label^="Theme"]',
    )!;

    expect(toggle.getAttribute('aria-label')).toBe('Theme: System. Switch to Light');
    expect(toggle.textContent?.trim()).toBe('brightness_auto');

    toggle.click();
    await fixture.whenStable();

    expect(toggle.getAttribute('aria-label')).toBe('Theme: Light. Switch to Dark');
    expect(toggle.textContent?.trim()).toBe('light_mode');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });
});
