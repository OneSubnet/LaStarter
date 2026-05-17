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

type Props = {
    extension: {
        identifier: string;
        name: string;
    };
    uninstallUrl: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function UninstallExtensionModal({
    extension,
    uninstallUrl,
    open,
    onOpenChange,
}: Props) {
    const { t } = useTranslation();
    const [confirmationName, setConfirmationName] = useState('');

    const canUninstall = confirmationName === extension.name;

    const handleOpenChange = (nextOpen: boolean) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
            setConfirmationName('');
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        router.post(
            uninstallUrl,
            {},
            {
                onSuccess: () => handleOpenChange(false),
            },
        );
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
                        <DialogTitle>
                            {t('settings.extensions.uninstall_confirm_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'settings.extensions.uninstall_confirm_description',
                            )}{' '}
                            <strong>"{extension.name}"</strong>.{' '}
                            {t('settings.extensions.uninstall_confirm_warning')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="confirmation-name">
                                {t(
                                    'settings.extensions.uninstall_confirm_label',
                                )}{' '}
                                <strong>"{extension.name}"</strong>{' '}
                                {t(
                                    'settings.extensions.uninstall_confirm_text',
                                )}
                            </Label>
                            <Input
                                id="confirmation-name"
                                value={confirmationName}
                                onChange={(event) =>
                                    setConfirmationName(event.target.value)
                                }
                                placeholder={extension.name}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">
                                {t('common.cancel')}
                            </Button>
                        </DialogClose>

                        <Button
                            variant="destructive"
                            type="submit"
                            disabled={!canUninstall}
                        >
                            {t('settings.extensions.uninstall')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
