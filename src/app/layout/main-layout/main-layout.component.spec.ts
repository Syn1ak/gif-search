import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';

describe('MainLayoutComponent', () => {
  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(MainLayoutComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the header with a home link, the main outlet and the footer', async () => {
    const element = await render();

    const home = element.querySelector<HTMLAnchorElement>('header a[href="/"]');
    expect(home?.textContent).toContain('GIF Search');
    expect(element.querySelector('main router-outlet')).not.toBeNull();
    expect(element.querySelector('footer')).not.toBeNull();
  });

  it('credits GIPHY with an external link, as the GIPHY terms require', async () => {
    const element = await render();

    const attribution = element.querySelector<HTMLAnchorElement>('footer a[href="https://giphy.com"]');
    expect(attribution?.textContent).toContain('Powered by GIPHY');
    expect(attribution?.target).toBe('_blank');
    expect(attribution?.rel).toContain('noopener');
  });
});
