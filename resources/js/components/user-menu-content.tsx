import { Link, router, usePage } from '@inertiajs/react';
import { Bell, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { index as notificationsIndex } from '@/routes/notifications';
import type { User as UserType } from '@/types';

type Props = {
    user: UserType;
};

export function UserMenuContent({ user }: Props) {
    const { t } = useTranslation();
    const cleanup = useMobileNavigation();
    const teamSlug = (usePage().props.currentTeam as { slug: string } | null)?.slug ?? '';

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={`/${teamSlug}/settings/profile`}
                        prefetch
                        onClick={cleanup}
                    >
                        <User className="mr-2" />
                        {t('common.profile')}
                    </Link>
                </DropdownMenuItem>
                {teamSlug && (
                    <DropdownMenuItem asChild>
                        <Link
                            className="block w-full cursor-pointer"
                            href={notificationsIndex(teamSlug).url}
                            onClick={cleanup}
                        >
                            <Bell className="mr-2" />
                            {t('notifications.title')}
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    {t('common.log_out')}
                </Link>
            </DropdownMenuItem>
        </>
    );
}
