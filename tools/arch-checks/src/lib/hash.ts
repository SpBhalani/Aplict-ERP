import { createHash } from 'node:crypto';

/** Hash with line endings normalised, so Windows and macOS checkouts agree. */
export const sha256 = (text: string): string =>
  createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');

export const isTestFile = (p: string): boolean => /\.(test|spec)\.tsx?$/.test(p);
