/**
 * Application-wide constants
 *
 * This file contains magic numbers and strings that are used throughout the application.
 * Using constants makes the code more maintainable and easier to update.
 */

// ── Table & Pagination ────────────────────────────────────────

/** Default number of rows per page in data tables */
export const DEFAULT_PAGE_SIZE = 10;

/** Available page size options for data tables */
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

// ── Icons ──────────────────────────────────────────────────────

/** Default icon size class name */
export const ICON_SIZE_DEFAULT = 'h-4 w-4';

/** Small icon size class name */
export const ICON_SIZE_SM = 'h-3.5 w-3.5';

/** Large icon size class name */
export const ICON_SIZE_LG = 'h-5 w-5';

/** Button icon size class name */
export const ICON_SIZE_BUTTON = 'size-8';

// ── UI Dimensions ───────────────────────────────────────────────

/** Default max width for responsive text truncation */
export const MAX_TRUNCATE_WIDTH = 300;

/** Small max width for responsive text truncation */
export const MAX_TRUNCATE_WIDTH_SM = 200;

/** Default input height for form elements */
export const INPUT_HEIGHT_DEFAULT = 'h-9';

/** Small input height for form elements */
export const INPUT_HEIGHT_SM = 'h-8';

// ── Debounce & Delays ───────────────────────────────────────────

/** Default debounce delay for search inputs (ms) */
export const DEBOUNCE_DELAY_SEARCH = 300;

/** Default debounce delay for auto-save (ms) */
export const DEBOUNCE_DELAY_AUTOSAVE = 500;

/** Default debounce delay for API calls (ms) */
export const DEBOUNCE_DELAY_API = 400;

// ── File Upload ─────────────────────────────────────────────────

/** Maximum file size for uploads (in bytes) - 5MB */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Maximum image file size for uploads (in bytes) - 2MB */
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
] as const;
