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
    const [isDirty, setIsDirty] = useState(form.store.state.isDirty);
    const [isLoading, setIsLoading] = useState(form.store.state.isSubmitting);

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

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const timeout = setTimeout(() => submit(), autoSaveMs);

        return () => clearTimeout(timeout);
    }, [form.state.values, isDirty, autoSaveMs, submit]);

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);

        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                submit();
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [isDirty, submit]);

    useEffect(() => {
        if (!isLoading && submitCallback.current) {
            const cb = submitCallback.current;
            submitCallback.current = null;
            cb();
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
