export type Team = {
    id: number;
    name: string;
    slug: string;
    isPersonal: boolean;
    role?: string;
    roleLabel?: string;
    isCurrent?: boolean;
};

export type TeamMember = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    role: string;
    role_label: string;
    roles?: string[];
};

export type TeamInvitation = {
    code: string;
    email: string;
    role: string;
    role_label: string;
    created_at: string;
};

export type RoleOption = {
    value: string;
    label: string;
};
