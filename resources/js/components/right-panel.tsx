import type { ReactNode } from 'react';

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

type RightPanelProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
    className?: string;
};

export function RightPanel({
    open,
    onOpenChange,
    title,
    children,
    className,
}: RightPanelProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="max-h-[80vh]">
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto px-4 pb-4">{children}</div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className={`w-[400px] !max-w-[400px] gap-0 overflow-hidden p-0 ${className ?? ''}`}
            >
                <SheetHeader className="border-b px-4 py-3">
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription className="sr-only">
                        {title}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </SheetContent>
        </Sheet>
    );
}
