import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchFormComponent } from './search-form.component';

describe('SearchFormComponent', () => {
  let fixture: ComponentFixture<SearchFormComponent>;
  let emitted: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(SearchFormComponent);
    emitted = [];
    fixture.componentInstance.$querySubmit.subscribe((query) => emitted.push(query));
    TestBed.tick();
  });

  afterEach(() => vi.useRealTimers());

  const input = () => (fixture.nativeElement as HTMLElement).querySelector('input')!;

  function type(value: string): void {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    TestBed.tick();
  }

  function pressEnter(): void {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    TestBed.tick();
  }

  it('emits the trimmed query once typing pauses for 500 ms', () => {
    type('  cats ');
    vi.advanceTimersByTime(499);
    expect(emitted).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(emitted).toEqual(['cats']);
  });

  it('only emits the last value of a burst of typing', () => {
    type('ca');
    vi.advanceTimersByTime(200);
    type('cat');
    vi.advanceTimersByTime(200);
    type('cats');
    vi.advanceTimersByTime(500);

    expect(emitted).toEqual(['cats']);
  });

  it('waits for at least two characters but emits an empty query when cleared', () => {
    type('c');
    vi.advanceTimersByTime(500);
    expect(emitted).toEqual([]);

    type('cats');
    vi.advanceTimersByTime(500);
    type('');
    vi.advanceTimersByTime(500);

    expect(emitted).toEqual(['cats', '']);
  });

  it('searches immediately on Enter', () => {
    type('dogs');
    pressEnter();

    expect(emitted).toEqual(['dogs']);

    vi.advanceTimersByTime(500);
    expect(emitted).toEqual(['dogs']);
  });

  it('does not search a query longer than Giphy allows and explains why', () => {
    type('a'.repeat(51));
    vi.advanceTimersByTime(500);
    pressEnter();

    expect(emitted).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Maximum length is 50 characters');
  });

  it('shows the query it receives and does not search it again', () => {
    fixture.componentRef.setInput('query', 'cats');
    TestBed.tick();

    expect(input().value).toBe('cats');

    type('cats ');
    vi.advanceTimersByTime(500);
    pressEnter();

    expect(emitted).toEqual([]);
  });
});
