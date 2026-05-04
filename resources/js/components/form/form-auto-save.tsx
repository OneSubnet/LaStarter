import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type FormAutoSaveContextValue = {
    isDirty: boolean;
    isLoading: boolean;
    cancel: () => void;
    submit: () => void;
};

const FormAutoSaveContext = createContext<FormAutoSaveContextValue | null>(
    null,
);

export function useFormAutoSave() {
    const ctx = useContext(FormAutoSaveContext);

    if (!ctx) {
        throw new Error(
            'useFormAutoSave must be used within FormAutoSaveProvider',
        );
    }

    return ctx;
}

type FormAutoSaveProviderProps = {
    children: ReactNode;
    form: {
        store: {
            state: {
                values: Record<string, unknown>;
                isSubmitting: boolean;
                isDirty: boolean;
            };
            subscribe: (callback: () => void) => { unsubscribe: () => void };
        };
        handleSubmit: (onSubmit?: () => void) => void;
        reset: () => void;
        state: {
            values: Record<string, unknown>;
            isSubmitting: boolean;
            isDirty: boolean;
        };
    };
    onSubmit: () => void | Promise<void>;
    autoSaveMs?: number;
};

export function FormAutoSaveProvider({
    children,
    form,
    onSubmit,
    autoSaveMs = 2000,
}: FormAutoSaveProviderProps) {
    const submitCallback = useRef<VoidFunction | null>(null);

    // Use local state that subscribes to form changes
    const [isDirty, setIsDirty] = useState(form.store.state.isDirty);
    const [isLoading, setIsLoading] = useState(form.store.state.isSubmitting);

    // Subscribe to form state changes
    useEffect(() => {
        const { unsubscribe } = form.store.subscribe(() => {
            setIsDirty(form.store.state.isDirty);
            setIsLoading(form.store.state.isSubmitting);
        });

        return unsubscribe;
    }, [form.store]);

    const submit = () => {
        form.handleSubmit(() => {
            submitCallback.current = onSubmit;
        });
    };

    const cancel = () => {
        form.reset();
    };

    // Auto-save with debounce
    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const timeout = setTimeout(() => {
            submit();
        }, autoSaveMs);

        return () => clearTimeout(timeout);
    }, [form.state.values, isDirty, autoSaveMs, submit]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Keyboard shortcut (Cmd+S / Ctrl+S)
    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                submit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDirty, submit]);

    // Call the onSubmit callback after form submission
    useEffect(() => {
        if (!isLoading && submitCallback.current) {
            const callback = submitCallback.current;
            submitCallback.current = null;
            callback();
        }
    }, [isLoading]);

    return (
        <FormAutoSaveContext.Provider
            value={{ isDirty, isLoading, cancel, submit }}
        >
            {children}
        </FormAutoSaveContext.Provider>
    );
}
