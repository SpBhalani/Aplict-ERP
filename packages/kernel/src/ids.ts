import { v7 as uuidv7 } from 'uuid';

/**
 * Generates a UUIDv7: a time-ordered identifier (48-bit millisecond
 * timestamp followed by random bits). IDs generated in sequence sort in
 * creation order, which keeps database indexes append-friendly.
 */
export function newId(): string {
  return uuidv7();
}
