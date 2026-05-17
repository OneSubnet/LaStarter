import { usePage } from '@inertiajs/react';
import { useMemo  } from 'react';
import type {ReactNode} from 'react';
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
    const raw = usePage<SharedData>().props.auth?.permissions;
    const permissions = useMemo(
        () => new Set(raw ?? []),
        [raw],
    );

    if (!raw) {
        return <>{fallback}</>;
    }

    const required = Array.isArray(permission) ? permission : [permission];
    const hasPermission = required.every((p) => permissions.has(p));

    return hasPermission ? <>{children}</> : <>{fallback}</>;
}
