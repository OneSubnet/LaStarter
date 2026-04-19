import { router, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import CreateTeamModal from '@/components/create-team-modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { switchMethod } from '@/routes/settings/teams';

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function TeamSwitcher() {
    const page = usePage();
    const isMobile = useIsMobile();
    const { state } = useSidebar();
    const currentTeam = page.props.currentTeam as
        | { id: number; name: string; slug: string }
        | undefined;
    const teams =
        (page.props.teams as { id: number; name: string; slug: string }[]) ??
        [];

    const switchTeam = (team: {
        id: number;
        name: string;
        slug: string;
    }) => {
        router.visit(switchMethod({ current_team: currentTeam?.slug ?? '', team: team.slug }).url, {
            method: 'post',
        });
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            data-test="team-switcher-trigger"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <span className="text-xs font-semibold">
                                    {currentTeam
                                        ? getInitials(currentTeam.name)
                                        : '?'}
                                </span>
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {currentTeam?.name ?? 'Select team'}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {currentTeam?.slug}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Teams
                        </DropdownMenuLabel>
                        {teams.map((team) => (
                            <DropdownMenuItem
                                key={team.id}
                                data-test="team-switcher-item"
                                className="cursor-pointer gap-2 p-2"
                                onSelect={() => switchTeam(team)}
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border">
                                    <span className="text-xs">
                                        {getInitials(team.name)}
                                    </span>
                                </div>
                                {team.name}
                                {currentTeam?.id === team.id && (
                                    <Check className="ml-auto size-4" />
                                )}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <CreateTeamModal>
                            <DropdownMenuItem
                                data-test="team-switcher-new-team"
                                className="cursor-pointer gap-2 p-2"
                                onSelect={(event) => event.preventDefault()}
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border bg-transparent">
                                    <Plus className="size-4" />
                                </div>
                                <div className="font-medium text-muted-foreground">
                                    New team
                                </div>
                            </DropdownMenuItem>
                        </CreateTeamModal>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
