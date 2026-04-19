import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface GuardProps {
    permission: string | string[];
    fallback?: ReactNode;
    children: ReactNode;
}

export default function Guard({ permission, fallback = null, children }: GuardProps) {
    const permissions = usePage().props.auth?.permissions as string[] | undefined;

    if (!permissions) {
        return <>{fallback}</>;
    }

    const required = Array.isArray(permission) ? permission : [permission];
    const hasPermission = required.every((p) => permissions.includes(p));

    return hasPermission ? <>{children}</> : <>{fallback}</>;
}
