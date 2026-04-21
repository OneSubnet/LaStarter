import { router, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/settings/teams';

export default function CreateTeamModal({ children }: PropsWithChildren) {
    const { t } = useTranslation();
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [open, setOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.post(store(teamSlug).url, Object.fromEntries(formData), {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <form
                    key={String(open)}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    <DialogHeader>
                        <DialogTitle>{t('components.create_team.title')}</DialogTitle>
                        <DialogDescription>
                            {t('components.create_team.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('components.create_team.name_label')}</Label>
                        <Input
                            id="name"
                            name="name"
                            data-test="create-team-name"
                            placeholder={t('components.create_team.placeholder')}
                            required
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">{t('common.cancel')}</Button>
                        </DialogClose>

                        <Button
                            type="submit"
                            data-test="create-team-submit"
                        >
                            {t('common.create')} {t('common.team').toLowerCase()}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
