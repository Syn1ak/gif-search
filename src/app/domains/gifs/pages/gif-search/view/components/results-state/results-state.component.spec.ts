import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TGiphyErrorKind } from '../../../../../../../core/models/giphy-error';
import { TResultsState } from '../../../models/gif-search.types';
import { ResultsStateComponent } from './results-state.component';

describe('ResultsStateComponent', () => {
  let fixture: ComponentFixture<ResultsStateComponent>;

  async function render(state: TResultsState): Promise<HTMLElement> {
    fixture = TestBed.createComponent(ResultsStateComponent);
    fixture.componentRef.setInput('state', state);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const retryButton = (element: HTMLElement) =>
    [...element.querySelectorAll('button')].find((button) => button.textContent?.includes('Try again'));

  it('explains an empty search without offering a retry', async () => {
    const element = await render({
      kind: 'empty',
      query: 'zzzz',
    });

    expect(element.textContent).toContain('Nothing found for “zzzz”');
    expect(retryButton(element)).toBeUndefined();
  });

  it.each<[TGiphyErrorKind, string, boolean]>([
    ['unauthorized', 'API key is missing or invalid', false],
    ['rate-limited', 'Rate limit reached', true],
    ['network', 'You seem to be offline', true],
    ['unknown', 'Something went wrong', true],
  ])('shows the "%s" error as "%s"', async (error, title, retryable) => {
    const element = await render({
      kind: 'error',
      error,
    });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(title);
    expect(retryButton(element) !== undefined).toBe(retryable);
  });

  it('emits retry when the button is clicked', async () => {
    const element = await render({
      kind: 'error',
      error: 'network',
    });
    let retries = 0;
    fixture.componentInstance.$retry.subscribe(() => retries++);

    retryButton(element)!.click();

    expect(retries).toBe(1);
  });
});
