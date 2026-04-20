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
import { destroy } from '@/routes/settings/team';
import type { Team } from '@/types';

type Props = {
    team: Team;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function DeleteTeamModal({ team, open, onOpenChange }: Props) {
    const { t } = useTranslation();
    const [confirmationName, setConfirmationName] = useState('');

    const canDeleteTeam = confirmationName === team.name;

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            setConfirmationName('');
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.delete(destroy(team.slug).url, {
            data: Object.fromEntries(formData),
            onSuccess: () => handleOpenChange(false),
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
                        <DialogTitle>{t('components.delete_team.title')}</DialogTitle>
                        <DialogDescription>
                            {t('components.delete_team.description')}{' '}
                            <strong>"{team.name}"</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="confirmation-name">
                                {t('components.delete_team.confirm_label')} <strong>"{team.name}"</strong> {t('components.delete_team.confirm_text')}
                            </Label>
                            <Input
                                id="confirmation-name"
                                name="name"
                                data-test="delete-team-name"
                                value={confirmationName}
                                onChange={(event) =>
                                    setConfirmationName(
                                        event.target.value,
                                    )
                                }
                                placeholder={t('components.delete_team.placeholder')}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">{t('common.cancel')}</Button>
                        </DialogClose>

                        <Button
                            variant="destructive"
                            type="submit"
                            data-test="delete-team-confirm"
                            disabled={!canDeleteTeam}
                        >
                            {t('settings.team.general.delete_button')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
