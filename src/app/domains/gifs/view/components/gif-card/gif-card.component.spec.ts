import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TGif } from '../../../models/gif.types';
import { GifCardComponent } from './gif-card.component';

const GIF: TGif = {
  id: 'abc',
  slug: 'happy-cat-abc',
  title: 'Happy Cat',
  altText: 'A cat smiling',
  rating: 'g',
  pageUrl: 'https://giphy.com/gifs/happy-cat-abc',
  sourceUrl: null,
  createdAt: null,
  author: null,
  preview: {
    url: 'https://media.test/200w.webp',
    stillUrl: 'https://media.test/200w_s.gif',
    width: 200,
    height: 113,
  },
  original: {
    url: 'https://media.test/giphy.gif',
    stillUrl: null,
    width: 480,
    height: 270,
    size: null,
  },
};

describe('GifCardComponent', () => {
  let fixture: ComponentFixture<GifCardComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(GifCardComponent);
    fixture.componentRef.setInput('gif', GIF);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders the lazy preview with its intrinsic size and alt text', () => {
    const image = element.querySelector('img')!;

    expect(image.getAttribute('src')).toBe(GIF.preview.url);
    expect(image.getAttribute('width')).toBe('200');
    expect(image.getAttribute('height')).toBe('113');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.alt).toBe('A cat smiling');
  });

  it('is a labelled button that emits the GIF when activated', () => {
    const opened: TGif[] = [];
    fixture.componentInstance.$open.subscribe((gif) => opened.push(gif));

    const button = element.querySelector('button')!;
    button.click();

    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Open details for Happy Cat');
    expect(opened).toEqual([GIF]);
  });

  it('has a separate quick copy button that emits copyLink without opening the details', () => {
    const opened: TGif[] = [];
    const copied: TGif[] = [];
    fixture.componentInstance.$open.subscribe((gif) => opened.push(gif));
    fixture.componentInstance.$copyLink.subscribe((gif) => copied.push(gif));

    const copyButton = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Copy link to Happy Cat"]',
    )!;
    copyButton.click();

    expect(copyButton.type).toBe('button');
    expect(copyButton.closest('button[aria-label^="Open details"]')).toBeNull();
    expect(copied).toEqual([GIF]);
    expect(opened).toEqual([]);
  });

  it('pulses as a skeleton until the preview loads', async () => {
    const button = element.querySelector('button')!;
    expect(button.classList).toContain('animate-pulse');

    element.querySelector('img')!.dispatchEvent(new Event('load'));
    await fixture.whenStable();

    expect(button.classList).not.toContain('animate-pulse');
  });

  it('shows a placeholder when the preview fails to load', async () => {
    element.querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(element.querySelector('mat-icon')!.textContent?.trim()).toBe('broken_image');
  });

  it('offers the still frame for reduced motion, and animates it while hovered or focused', async () => {
    const source = element.querySelector('picture source')!;
    expect(source.getAttribute('media')).toBe('(prefers-reduced-motion: reduce)');
    expect(source.getAttribute('srcset')).toBe(GIF.preview.stillUrl);

    const overlay = () => element.querySelector('img[aria-hidden="true"]');
    expect(overlay()).toBeNull();

    element.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(overlay()!.getAttribute('src')).toBe(GIF.preview.url);

    element.dispatchEvent(new MouseEvent('mouseleave'));
    await fixture.whenStable();
    expect(overlay()).toBeNull();

    element.querySelector('button')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await fixture.whenStable();
    expect(overlay()).not.toBeNull();
  });
});
