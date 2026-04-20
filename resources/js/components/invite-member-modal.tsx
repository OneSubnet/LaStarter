import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store as storeInvitation } from '@/routes/settings/team/invitations';
import type { RoleOption, Team } from '@/types';

type Props = {
    team: Team;
    availableRoles: RoleOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function InviteMemberModal({
    team,
    availableRoles,
    open,
    onOpenChange,
}: Props) {
    const { t } = useTranslation();
    const [inviteRole, setInviteRole] = useState<RoleOption['value']>('member');

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            setInviteRole('member');
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.post(storeInvitation(team.slug).url, Object.fromEntries(formData), {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <form
                    key={String(open)}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <DialogHeader>
                        <DialogTitle>{t('components.invite_member.title')}</DialogTitle>
                        <DialogDescription>
                            {t('components.invite_member.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('components.invite_member.email_label')}</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                data-test="invite-email"
                                placeholder={t('components.invite_member.email_placeholder')}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role">{t('components.invite_member.role_label')}</Label>
                            <Select
                                name="role"
                                data-test="invite-role"
                                value={inviteRole}
                                onValueChange={(value) =>
                                    setInviteRole(
                                        value as RoleOption['value'],
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('components.invite_member.select_role')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRoles.map((role) => (
                                        <SelectItem
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">{t('common.cancel')}</Button>
                        </DialogClose>

                        <Button
                            type="submit"
                            data-test="invite-submit"
                        >
                            {t('components.invite_member.send_invitation')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
