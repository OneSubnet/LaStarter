import { Form as InertiaForm } from '@inertiajs/react';
import { createContext, useContext } from 'react';
import type { ComponentProps, PropsWithChildren } from 'react';

type Props = PropsWithChildren<ComponentProps<typeof InertiaForm>>;

const FormContext = createContext({
    errors: {} as Record<string, string>,
    processing: false,
});

export function InertiaFormWrapper({ children, ...props }: Props) {
    return (
        <InertiaForm {...props}>
            {({ errors, processing }) => (
                <FormContext value={{ errors, processing }}>
                    {children}
                </FormContext>
            )}
        </InertiaForm>
    );
}

export function useFormError(name: string): string | null {
    const ctx = useContext(FormContext);

    return ctx.errors[name] ?? null;
}

export function useFormErrors(): Record<string, string> {
    return useContext(FormContext).errors;
}

export function useFormProcessing(): boolean {
    return useContext(FormContext).processing;
}
