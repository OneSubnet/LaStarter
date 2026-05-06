import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedData } from '@/types';

interface GuardProps {
    permission: string | string[];
    fallback?: ReactNode;
    children: ReactNode;
}

export default function Guard({
    permission,
    fallback = null,
    children,
}: GuardProps) {
    const permissions = usePage<SharedData>().props.auth?.permissions;

    if (!permissions) {
        return <>{fallback}</>;
    }

    const required = Array.isArray(permission) ? permission : [permission];
    const hasPermission = required.every((p) => permissions.includes(p));

    return hasPermission ? <>{children}</> : <>{fallback}</>;
}
