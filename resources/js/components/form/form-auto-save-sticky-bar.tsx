import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CmdOrOption } from '@/components/nowts/keyboard-shortcut';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { useIsClient } from '@/hooks/use-is-client';
import { useFormAutoSave } from './form-auto-save';

export function FormAutoSaveStickyBar() {
    const { t } = useTranslation();
    const ctx = useFormAutoSave();
    const isClient = useIsClient();

    if (!isClient) {
        return null;
    }

    const { isDirty, isLoading, cancel, submit } = ctx;

    return createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center justify-center overflow-hidden py-4">
            <AnimatePresence>
                {isDirty ? (
                    <motion.div
                        key="save-bar"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                            opacity: [1, 1, 0],
                            y: [0, -10, 20],
                            transition: { duration: 0.5 },
                        }}
                        className="pointer-events-auto flex items-center gap-4 rounded-md border bg-card p-2 shadow-lg"
                    >
                        <span className="text-sm text-muted-foreground">
                            {t('form.unsaved_changes')}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={cancel}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button size="sm" disabled={isLoading} onClick={submit}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('common.saving')}
                                </>
                            ) : (
                                <>
                                    {t('common.save')}
                                    <Kbd className="ml-1">
                                        <CmdOrOption /> + S
                                    </Kbd>
                                </>
                            )}
                        </Button>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>,
        document.body,
    );
}
