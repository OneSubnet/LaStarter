import { useMemo } from 'react';

export function CmdOrOption() {
    const isMac = useMemo(
        () => navigator.userAgent.toUpperCase().includes('MAC'),
        [],
    );

    return <>{isMac ? '⌘' : 'Ctrl'}</>;
}
