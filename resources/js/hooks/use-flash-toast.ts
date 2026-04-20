import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        // Flash toast messages from backend (Inertia::flash)
        router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (data) {
                toast[data.type](data.message);
            }
        });

        // Validation errors (422) — show first error
        router.on('error', (event) => {
            const errors = (event as CustomEvent).detail?.errors;

            if (errors && typeof errors === 'object') {
                const firstError = Object.values(errors).flat()[0];

                if (typeof firstError === 'string') {
                    toast.error(firstError);
                }
            }
        });

        // HTTP exceptions (403, 404, 500, etc.)
        router.on('httpException', (event) => {
            const exception = (event as CustomEvent).detail?.exception;
            const status = exception?.status ?? exception?.statusCode;

            if (status === 403) {
                toast.error("Vous n'avez pas la permission d'effectuer cette action.");
            } else if (status === 404) {
                toast.error('La ressource demandée est introuvable.');
            } else if (status === 419) {
                toast.error('Votre session a expiré. Veuillez rafraîchir la page.');
            } else if (status && status >= 500) {
                toast.error('Une erreur serveur est survenue. Veuillez réessayer.');
            } else {
                toast.error('Une erreur est survenue.');
            }
        });

        // Network errors (no connectivity, CORS, etc.)
        router.on('networkError', () => {
            toast.error('Erreur réseau. Vérifiez votre connexion.');
        });
    }, []);
}
