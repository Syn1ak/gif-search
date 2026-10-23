import { Pipe, PipeTransform } from '@angular/core';

const UNITS = ['B', 'KB', 'MB'] as const;
const STEP = 1024;

/** Bytes as a short human-readable size (`512 B`, `1.5 KB`, `2 MB`), or null when unknown. */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null): string | null {
    if (bytes === null || !Number.isFinite(bytes) || bytes < 0) {
      return null;
    }

    let value = bytes;
    let unit = 0;

    while (value >= STEP && unit < UNITS.length - 1) {
      value /= STEP;
      unit++;
    }

    const rounded = unit === 0 ? value : Math.round(value * 10) / 10;
    return `${rounded} ${UNITS[unit]}`;
  }
}
