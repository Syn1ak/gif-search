import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TGif } from '../../../../../models/gif.types';
import { FileSizePipe } from '../../pipes/file-size.pipe';

const UNKNOWN = 'Unknown';

/** Author, date, rating, dimensions, size and source of a GIF as a description list. */
@Component({
  selector: 'app-gif-meta-list',
  imports: [DatePipe, UpperCasePipe, FileSizePipe],
  template: `
    @let gif = $gif();
    <dl class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 text-sm">
      <dt class="text-on-surface-variant">Author</dt>
      <dd class="min-w-0">
        @if (gif.author; as author) {
          <span class="flex min-w-0 items-center gap-2">
            @if (author.avatarUrl) {
              <img
                class="size-8 shrink-0 rounded-full bg-surface-container-high object-cover"
                [src]="author.avatarUrl"
                width="32"
                height="32"
                alt=""
              />
            }
            @if (author.profileUrl) {
              <a
                class="truncate font-medium text-primary underline-offset-2 hover:underline"
                [href]="author.profileUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ author.name }}
              </a>
            } @else {
              <span class="truncate font-medium text-on-surface">{{ author.name }}</span>
            }
          </span>
        } @else {
          Unknown author
        }
      </dd>

      <dt class="text-on-surface-variant">Created</dt>
      <dd>{{ gif.createdAt ? (gif.createdAt | date: 'mediumDate') : unknown }}</dd>

      <dt class="text-on-surface-variant">Rating</dt>
      <dd>{{ (gif.rating | uppercase) || unknown }}</dd>

      <dt class="text-on-surface-variant">Dimensions</dt>
      <dd>{{ gif.original.width }} × {{ gif.original.height }} px</dd>

      <dt class="text-on-surface-variant">File size</dt>
      <dd>{{ (gif.original.size | fileSize) ?? unknown }}</dd>

      <dt class="text-on-surface-variant">Source</dt>
      <dd class="min-w-0">
        @if (gif.sourceUrl; as sourceUrl) {
          <a
            class="block truncate text-primary underline-offset-2 hover:underline"
            [href]="sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $sourceLabel() }}
          </a>
        } @else {
          {{ unknown }}
        }
      </dd>
    </dl>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GifMetaListComponent {
  readonly $gif = input.required<TGif>({ alias: 'gif' });

  /** The source's host name (`www.reddit.com` → `reddit.com`), or the raw value if it is not a URL. */
  protected readonly $sourceLabel = computed(() => {
    const sourceUrl = this.$gif().sourceUrl ?? '';

    try {
      return new URL(sourceUrl).hostname.replace(/^www\./, '');
    } catch {
      return sourceUrl;
    }
  });

  protected readonly unknown = UNKNOWN;
}
