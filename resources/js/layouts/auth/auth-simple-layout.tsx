import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import LanguageSelector from '@/components/language-selector';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-background py-4">
            <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
                <Link href={home()} className="flex h-14 w-14 items-center justify-center">
                    <AppLogoIcon className="h-14 w-12 fill-current text-[var(--foreground)] dark:text-white" />
                </Link>

                <h1 className="mb-8 w-full text-center text-3xl font-medium tracking-tighter text-foreground md:text-4xl">
                    {title}
                </h1>

                {description && (
                    <p className="w-full max-w-lg text-center text-sm text-foreground/40">
                        {description}
                    </p>
                )}

                {children}
            </div>

            <div className="fixed bottom-4 right-4">
                <LanguageSelector />
            </div>
        </div>
    );
}
