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
});
