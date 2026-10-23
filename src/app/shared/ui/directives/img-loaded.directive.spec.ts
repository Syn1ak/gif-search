import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImgLoadedDirective } from './img-loaded.directive';

@Component({
  imports: [ImgLoadedDirective],
  template: `
    <img appImgLoaded #img="appImgLoaded" src="https://media.test/a.gif" alt="" />
    <span>{{ img.$state() }}</span>
  `,
})
class HostComponent {
  readonly directive = viewChild.required(ImgLoadedDirective);
}

describe('ImgLoadedDirective', () => {
  async function render() {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    return {
      fixture,
      image: element.querySelector('img')!,
      stateText: () => element.querySelector('span')!.textContent,
    };
  }

  it('keeps the image transparent while it loads', async () => {
    const { fixture, image, stateText } = await render();

    expect(fixture.componentInstance.directive().$state()).toBe('loading');
    expect(stateText()).toBe('loading');
    expect(image.classList).toContain('opacity-0');
  });

  it('fades the image in once it has loaded', async () => {
    const { fixture, image, stateText } = await render();

    image.dispatchEvent(new Event('load'));
    await fixture.whenStable();

    expect(stateText()).toBe('loaded');
    expect(image.classList).not.toContain('opacity-0');
  });

  it('reports a failed image so the host can show a placeholder', async () => {
    const { fixture, image, stateText } = await render();

    image.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(stateText()).toBe('error');
    expect(image.classList).toContain('opacity-0');
  });
});
