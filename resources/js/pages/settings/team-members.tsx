import { Head, router } from '@inertiajs/react';
import { ChevronDown, Mail, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import CancelInvitationModal from '@/components/cancel-invitation-modal';
import Guard from '@/components/guard';
import Heading from '@/components/heading';
import InviteMemberModal from '@/components/invite-member-modal';
import RemoveMemberModal from '@/components/remove-member-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import TeamSettingsLayout from '@/layouts/team-settings-layout';
import { members as membersUrl } from '@/routes/settings/team';
import { update as updateMember } from '@/routes/settings/team/members';
import type {
    RoleOption,
    Team,
    TeamInvitation,
    TeamMember,
} from '@/types';

type Props = {
    team: Team;
    members: TeamMember[];
    invitations: TeamInvitation[];
    permissions: string[];
    availableRoles: RoleOption[];
};

export default function TeamMembers({
    team,
    members,
    invitations,
    permissions,
    availableRoles,
}: Props) {
    const getInitials = useInitials();

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(
        null,
    );
    const [cancelInvitationDialogOpen, setCancelInvitationDialogOpen] =
        useState(false);
    const [invitationToCancel, setInvitationToCancel] =
        useState<TeamInvitation | null>(null);

    const can = (permission: string) => permissions.includes(permission);

    const updateMemberRole = (member: TeamMember, newRole: string) => {
        router.visit(updateMember({ current_team: team.slug, user: member.id }).url, {
            data: { role: newRole },
            method: 'patch',
            preserveScroll: true,
        });
    };

    const confirmRemoveMember = (member: TeamMember) => {
        setMemberToRemove(member);
        setRemoveMemberDialogOpen(true);
    };

    const confirmCancelInvitation = (invitation: TeamInvitation) => {
        setInvitationToCancel(invitation);
        setCancelInvitationDialogOpen(true);
    };

    return (
        <TeamSettingsLayout
            activeTab="Members"
            breadcrumbs={[
                {
                    title: team.name,
                    href: membersUrl(team.slug).url,
                },
            ]}
        >
            <Head title={`Members - ${team.name}`} />
            <h1 className="sr-only">Team members</h1>

            <div className="flex flex-col space-y-10">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Heading
                            variant="small"
                            title="Team members"
                            description={
                                can('invitation.create')
                                    ? 'Manage who belongs to this team'
                                    : ''
                            }
                        />

                        <div className="flex items-center gap-2">
                            <Guard permission="invitation.create">
                                <Button
                                    data-test="invite-member-button"
                                    onClick={() => setInviteDialogOpen(true)}
                                >
                                    <UserPlus /> Invite member
                                </Button>
                            </Guard>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                data-test="member-row"
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        {member.avatar ? (
                                            <AvatarImage
                                                src={member.avatar}
                                                alt={member.name}
                                            />
                                        ) : null}
                                        <AvatarFallback>
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">
                                            {member.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {member.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {member.role !== 'owner' &&
                                    can('member.update') ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    data-test="member-role-trigger"
                                                >
                                                    {member.role_label}
                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {availableRoles.map((role) => (
                                                    <DropdownMenuItem
                                                        key={role.value}
                                                        data-test="member-role-option"
                                                        onSelect={() =>
                                                            updateMemberRole(
                                                                member,
                                                                role.value,
                                                            )
                                                        }
                                                    >
                                                        {role.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <Badge variant="secondary">
                                            {member.role_label}
                                        </Badge>
                                    )}

                                    {member.role !== 'owner' &&
                                    can('member.remove') ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        data-test="member-remove-button"
                                                        onClick={() =>
                                                            confirmRemoveMember(
                                                                member,
                                                            )
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Remove member</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {invitations.length > 0 ? (
                    <div className="space-y-6">
                        <Heading
                            variant="small"
                            title="Pending invitations"
                            description="Invitations that haven't been accepted yet"
                        />

                        <div className="space-y-3">
                            {invitations.map((invitation) => (
                                <div
                                    key={invitation.code}
                                    data-test="invitation-row"
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <Mail className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {invitation.email}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {invitation.role_label}
                                            </div>
                                        </div>
                                    </div>

                                    <Guard permission="invitation.cancel">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        data-test="invitation-cancel-button"
                                                        onClick={() =>
                                                            confirmCancelInvitation(
                                                                invitation,
                                                            )
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Cancel invitation</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Guard>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            <Guard permission="invitation.create">
                <InviteMemberModal
                    team={team}
                    availableRoles={availableRoles}
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                />
            </Guard>

            <RemoveMemberModal
                team={team}
                member={memberToRemove}
                open={removeMemberDialogOpen}
                onOpenChange={setRemoveMemberDialogOpen}
            />

            <CancelInvitationModal
                team={team}
                invitation={invitationToCancel}
                open={cancelInvitationDialogOpen}
                onOpenChange={setCancelInvitationDialogOpen}
            />
        </TeamSettingsLayout>
    );
}
