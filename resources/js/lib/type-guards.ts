/**
 * Type Guards and Runtime Validation Utilities
 *
 * This file provides type-safe runtime validation functions.
 * Use these to validate data from external sources (API, localStorage, etc.)
 */

// ── Primitives ─────────────────────────────────────────────────

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isNull(value: unknown): value is null {
    return value === null;
}

export function isUndefined(value: unknown): value is undefined {
    return value === undefined;
}

export function isNullish(value: unknown): value is null | undefined {
    return isNull(value) || isUndefined(value);
}

export function isFunction(
    value: unknown,
): value is (...args: unknown[]) => unknown {
    return typeof value === 'function';
}

// ── Arrays ─────────────────────────────────────────────────────

export function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

export function isNonEmptyArray<T>(value: T[] | unknown): value is [T, ...T[]] {
    return isArray(value) && value.length > 0;
}

export function isArrayOf<T>(
    value: unknown,
    guard: (item: unknown) => item is T,
): value is T[] {
    return isArray(value) && value.every(guard);
}

export function isStringArray(value: unknown): value is string[] {
    return isArrayOf(value, isString);
}

export function isNumberArray(value: unknown): value is number[] {
    return isArrayOf(value, isNumber);
}

// ── Objects ────────────────────────────────────────────────────

export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isObjectWithKeys<T extends Record<string, unknown>>(
    value: unknown,
    keys: (keyof T)[],
): value is T {
    if (!isObject(value)) {
        return false;
    }

    return keys.every((key) => key in value);
}

// ─── CustomEvent ───────────────────────────────────────────────

export function isCustomEvent<T = unknown>(
    value: Event,
): value is CustomEvent<T> {
    return value instanceof CustomEvent;
}

export function getCustomEventDetail<T = unknown>(value: Event): T | undefined {
    return isCustomEvent<T>(value) ? value.detail : undefined;
}

// ─── API Response ──────────────────────────────────────────────

export type ApiResponse<T = unknown> = {
    data?: T;
    error?: string;
    message?: string;
};

export function isApiResponse<T = unknown>(
    value: unknown,
    dataGuard?: (item: unknown) => item is T,
): value is ApiResponse<T> {
    if (!isObject(value)) {
        return false;
    }

    const hasDataOrError = 'data' in value || 'error' in value;

    if (!hasDataOrError) {
        return false;
    }

    if ('data' in value && value.data !== undefined && dataGuard) {
        return dataGuard(value.data);
    }

    return true;
}

// ─── Inertia Page Props ────────────────────────────────────────

export type InertiaPageProps = {
    [key: string]: unknown;
    auth?: {
        user?: Record<string, unknown>;
        permissions?: string[];
    };
    errors?: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
};

export function isInertiaPageProps(value: unknown): value is InertiaPageProps {
    return isObject(value);
}

// ─── Schema Validation ─────────────────────────────────────────

export type Schema<T> = {
    parse: (value: unknown) => T;
    safeParse: (
        value: unknown,
    ) => { success: true; data: T } | { success: false; error: unknown };
};

/**
 * Validates data against a schema (e.g., Zod)
 * Returns the validated data or null if validation fails
 */
export function validateSchema<T>(schema: Schema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);

    return result.success ? result.data : null;
}

/**
 * Validates data against a schema and throws if invalid
 */
export function assertSchema<T>(schema: Schema<T>, data: unknown): T {
    const result = schema.safeParse(data);

    if (!result.success) {
        throw new Error('Validation failed');
    }

    return result.data;
}

// ─── LocalStorage ──────────────────────────────────────────────

/**
 * Safely gets a value from localStorage
 * Returns null if the key doesn't exist or parsing fails
 */
export function getLocalStorageItem<T = unknown>(
    key: string,
    guard?: (value: unknown) => value is T,
): T | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const item = window.localStorage.getItem(key);

        if (item === null) {
            return null;
        }

        const parsed = JSON.parse(item) as unknown;

        return guard ? (guard(parsed) ? parsed : null) : (parsed as T);
    } catch {
        return null;
    }
}

/**
 * Safely sets a value in localStorage
 * Returns false if the operation fails
 */
export function setLocalStorageItem<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        window.localStorage.setItem(key, JSON.stringify(value));

        return true;
    } catch {
        return false;
    }
}

/**
 * Safely removes a value from localStorage
 */
export function removeLocalStorageItem(key: string): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        window.localStorage.removeItem(key);

        return true;
    } catch {
        return false;
    }
}
