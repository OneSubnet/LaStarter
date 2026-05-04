import { ChevronDown, Columns3, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type DataTableToolbarProps = {
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
    columns: {
        id: string;
        getCanHide: () => boolean;
        getIsVisible: () => boolean;
        toggleVisibility: (value: boolean) => void;
    }[];
    searchPlaceholder?: string;
    children?: React.ReactNode;
};

export function DataTableToolbar({
    globalFilter,
    setGlobalFilter,
    columns,
    searchPlaceholder,
    children,
}: DataTableToolbarProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
                {children}

                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder || t('common.search')}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="h-9 w-[200px] pl-9 lg:w-[260px]"
                    />
                </div>

                <DropdownMenu>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Columns3 className="h-4 w-4" />
                                        <span className="hidden lg:inline">
                                            {t('common.columns')}
                                        </span>
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                {t('common.customize_columns')}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent align="end" className="w-48">
                        {columns
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(!!value)
                                    }
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
